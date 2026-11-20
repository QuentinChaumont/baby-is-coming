import { KONAMI, SNEEZE_TAPS, SNEEZE_WINDOW_MS } from './kiki.model';

/**
 * Accumulates how far a pointer travels in one continuous stroke (petting
 * her head, scrubbing her in the bath). A pause longer than `gapMs` starts
 * a new stroke.
 */
export class Rub {
  private last: { x: number; y: number; t: number } | null = null;
  distance = 0;

  constructor(private readonly gapMs = 300) {}

  /** Adds a pointer sample; returns the stroke's length so far. */
  add(event: PointerEvent): number {
    const last = this.last;
    this.last = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    if (!last || event.timeStamp - last.t > this.gapMs) this.distance = 0;
    else this.distance += Math.hypot(event.clientX - last.x, event.clientY - last.y);
    return this.distance;
  }

  reset(): void {
    this.distance = 0;
    this.last = null;
  }
}

/** Counts quick taps; true once enough land inside the window (a sneeze). */
export class TapCounter {
  private taps: number[] = [];

  tap(now = Date.now()): boolean {
    this.taps = [...this.taps.filter((t) => now - t < SNEEZE_WINDOW_MS), now];
    if (this.taps.length < SNEEZE_TAPS) return false;
    this.taps = [];
    return true;
  }
}

/** Follows the keys typed; true when the Konami code is complete. */
export class KonamiTracker {
  private step = 0;

  key(key: string): boolean {
    this.step = key === KONAMI[this.step] ? this.step + 1 : key === KONAMI[0] ? 1 : 0;
    if (this.step < KONAMI.length) return false;
    this.step = 0;
    return true;
  }
}
