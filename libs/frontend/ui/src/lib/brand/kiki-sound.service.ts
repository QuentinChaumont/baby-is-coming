import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'kiki-sound';

export type KikiSound = 'pop' | 'squeak' | 'giggle' | 'cry' | 'sneeze' | 'tada' | 'rattle' | 'yawn' | 'boing' | 'splash';

/**
 * Kiki's little noises, synthesised with the Web Audio API (no audio file
 * to download). Off by default: a guest turns them on with the sound toggle
 * and the choice is remembered in this browser only.
 */
@Injectable({ providedIn: 'root' })
export class KikiSounds {
  readonly enabled = signal(readStored());
  private ctx: AudioContext | null = null;

  toggle(): void {
    const next = !this.enabled();
    this.enabled.set(next);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      /* private mode: the choice simply isn't remembered */
    }
    if (next) this.play('pop');
  }

  play(sound: KikiSound): void {
    if (!this.enabled()) return;
    const ctx = this.context();
    if (!ctx) return;
    this.recipes[sound](ctx, ctx.currentTime);
  }

  /** How each noise is made, from oscillators and a little noise. */
  private readonly recipes: Record<KikiSound, (ctx: AudioContext, t: number) => void> = {
    pop: (ctx, t) => this.tone(ctx, t, 'sine', [520, 880], [0.09, 0.25]),
    squeak: (ctx, t) => this.tone(ctx, t, 'square', [900, 1500, 1100], [0.16, 0.08]),
    giggle: (ctx, t) => {
      for (let i = 0; i < 4; i++) this.tone(ctx, t + i * 0.11, 'triangle', [720 + i * 40, 980], [0.08, 0.18]);
    },
    cry: (ctx, t) => {
      for (let i = 0; i < 2; i++) this.tone(ctx, t + i * 0.55, 'sawtooth', [420, 560, 380], [0.48, 0.06]);
    },
    sneeze: (ctx, t) => {
      this.tone(ctx, t, 'sine', [300, 620], [0.25, 0.12]);
      this.noise(ctx, t + 0.28, 0.22);
    },
    rattle: (ctx, t) => {
      for (let i = 0; i < 6; i++) this.noise(ctx, t + i * 0.16, 0.05);
    },
    yawn: (ctx, t) => this.tone(ctx, t, 'sine', [330, 420, 260], [1.4, 0.14]),
    boing: (ctx, t) => this.tone(ctx, t, 'sine', [180, 620, 300, 420], [0.45, 0.2]),
    splash: (ctx, t) => this.noise(ctx, t, 0.35),
    tada: (ctx, t) => {
      [523, 659, 784, 1047].forEach((f, i) => this.tone(ctx, t + i * 0.09, 'triangle', [f, f], [0.2, 0.15]));
    },
  };

  private context(): AudioContext | null {
    const Ctor = globalThis.AudioContext;
    if (!Ctor) return null;
    this.ctx ??= new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** One voice gliding through `freqs` over `duration` seconds, at `volume`. */
  private tone(ctx: AudioContext, at: number, type: OscillatorType, freqs: number[], [duration, volume]: [number, number]): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqs[0], at);
    freqs.slice(1).forEach((f, i) => {
      osc.frequency.linearRampToValueAtTime(f, at + (duration * (i + 1)) / (freqs.length - 1));
    });
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  private noise(ctx: AudioContext, at: number, duration: number): void {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    src.buffer = buffer;
    src.connect(gain).connect(ctx.destination);
    src.start(at);
  }
}

function readStored(): boolean {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}
