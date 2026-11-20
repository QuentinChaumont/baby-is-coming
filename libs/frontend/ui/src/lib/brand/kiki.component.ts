import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { KikiDiscoveries } from './discoveries.store';
import { KonamiTracker, Rub, TapCounter } from './kiki-gestures';
import { listenToPage } from './kiki-page';
import { KikiSound, KikiSounds } from './kiki-sound.service';
import { KIKI_PLAY_STYLES } from './kiki-play.styles';
import { KIKI_STYLES } from './kiki.styles';
import { KIKI_TEMPLATE } from './kiki.template';
import {
  BATH_MIN,
  BATH_RUB_PX,
  BODY_SPOTS,
  BUBBLE,
  DROPS,
  EAR_GRIMACE_AT,
  EYES,
  Eyes,
  GROUND_Y,
  KikiMood,
  KikiTreasure,
  MOOD_DISCOVERY,
  MOOD_MS,
  MOUTH,
  NECK_SPOTS,
  Pacifier,
  SLEEP_AFTER_MS,
  SMUG_WINDOW_MS,
  SPOTS,
  TAP_DROP_X,
  YAWN_AFTER_MS,
  YAWN_EVERY_MS,
  bubbleGeometry,
} from './kiki.model';

type Ear = 'left' | 'right';

/**
 * Kiki, the baby giraffe — alive. She breathes, blinks and follows the
 * pointer with her eyes. When `interactive`, a guest can pull her
 * pacifier out (she cries until it's back), tickle her belly, pet her
 * head, scrub her spots off in the bath, pull her ears into grimaces, tap
 * her horns, catch her yawning (contagious!), let her doze off, or make
 * her sneeze her spots off (many quick taps, or the Konami code).
 * `celebrate` makes her dance; `receive()` gives her back a treasure.
 *
 * Motion is CSS on SVG groups; the OS « reduce motion » setting stops the
 * eye tracking and (globally) the keyframes.
 */
@Component({
  selector: 'lib-kiki',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.kiki-host--interactive]': 'interactive()',
    '[style.--kiki-spots]': 'soap()',
  },
  template: KIKI_TEMPLATE,
  styles: [KIKI_STYLES, KIKI_PLAY_STYLES],
})
export class Kiki {
  private readonly sounds = inject(KikiSounds);
  private readonly discoveries = inject(KikiDiscoveries);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  /** Lets guests play with her (pacifier, tickles, bath, naps…). */
  readonly interactive = input(true, { transform: booleanAttribute });
  /** Makes her dance with joy, each time it turns true. */
  readonly celebrate = input(false, { transform: booleanAttribute });
  /** The name on her tag and in the labels. */
  readonly name = input('Kiki');
  /** Treasures still lost: she sometimes sighs about one after a nap. */
  readonly missing = input<readonly KikiTreasure[]>([]);

  protected readonly clipId = `kiki-body-${nextId++}`;
  protected readonly headSpots = SPOTS;
  protected readonly neckSpots = NECK_SPOTS;
  protected readonly bodySpots = BODY_SPOTS;
  protected readonly mouth = MOUTH;
  protected readonly drops = DROPS;
  /** Her drawn width in CSS px: the smaller she is, the bigger her words. */
  private readonly width = signal(150);

  protected readonly pacifier = signal<Pacifier>('mouth');
  protected readonly free = signal({ ...MOUTH });
  protected readonly falling = signal(false);
  /** How visible her spots are: scrubbing in the bath washes them out. */
  protected readonly soap = signal(1);
  protected readonly ears = signal<Record<Ear, number>>({ left: 1, right: 1 });
  private readonly passing = signal<KikiMood | null>(null);
  private readonly asleep = signal(false);
  private readonly lostTreasure = signal<KikiTreasure>('doudou');
  /** Her doudou consoled her: no more tears, even without the pacifier. */
  private readonly comforted = signal(false);

  /** Crying is the resting state as long as the pacifier is out. */
  private readonly base = computed<KikiMood>(() => {
    const p = this.pacifier();
    if (p === 'free') return this.comforted() ? 'idle' : 'cry';
    return p === 'drag' ? 'pout' : 'idle';
  });
  readonly mood = computed<KikiMood>(() => (this.asleep() ? 'sleep' : (this.passing() ?? this.base())));
  protected readonly eyes = computed<Eyes>(() => EYES[this.mood()] ?? 'open');
  protected readonly bubble = computed(() => {
    const mood = this.mood();
    if (!this.interactive() && mood !== 'joy') return null;
    return mood === 'lost' ? `J'ai perdu mon ${this.lostTreasure()}…` : (BUBBLE[mood] ?? null);
  });
  protected readonly bubbleShape = computed(() =>
    bubbleGeometry(this.bubble() ?? '', Math.min(1.6, Math.max(1, 150 / this.width()))),
  );
  protected readonly label = computed(() => `${this.name()}, bébé girafe`);
  protected readonly announcement = computed(() => {
    switch (this.mood()) {
      case 'cry':
        return `${this.name()} pleure : rends-lui sa tétine !`;
      case 'sleep':
        return `${this.name()} fait la sieste.`;
      default:
        return '';
    }
  });

  private moodTimer: ReturnType<typeof setTimeout> | undefined;
  private fallTimer: ReturnType<typeof setTimeout> | undefined;
  private bathTimer: ReturnType<typeof setTimeout> | undefined;
  private drag: { id: number; startX: number; startY: number; moved: boolean; from: Pacifier } | null = null;
  private earDrag: { id: number; ear: Ear; startX: number; startY: number } | null = null;
  private readonly taps = new TapCounter();
  private readonly konami = new KonamiTracker();
  private readonly petting = new Rub();
  private readonly scrubbing = new Rub();
  private lastActivity = Date.now();
  private lastYawn = -Infinity;
  private teased = true;
  private onScreen = true;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      if (this.celebrate()) untracked(() => this.setMood('joy', 'tada'));
    });

    afterNextRender(() => {
      const win = globalThis.window;
      if (!win) return;
      const stop = listenToPage(win, this.host.nativeElement, {
        look: (x, y) => this.lookAt(x, y),
        activity: () => this.wake(),
        key: (key) => {
          this.wake();
          if (this.interactive() && this.konami.key(key)) this.setMood('sneeze', 'sneeze');
        },
        tick: () => this.tick(),
        resized: (width) => this.width.set(width || 150),
        // No yawns or naps nobody can see.
        visible: (onScreen) => (this.onScreen = onScreen),
      });
      destroyRef.onDestroy(() => {
        stop();
        clearTimeout(this.moodTimer);
        clearTimeout(this.fallTimer);
        clearTimeout(this.bathTimer);
      });
    });
  }

  // — Public: treasures and bubbles —

  /** Her host element, e.g. as a drop target. */
  get element(): HTMLElement {
    return this.host.nativeElement;
  }

  /** A treasure given back: a cuddle for the doudou, a shake for the
   * rattle. Either one consoles her, even without the pacifier. */
  receive(treasure: KikiTreasure): void {
    this.wake();
    if (this.pacifier() !== 'mouth') this.comforted.set(true);
    if (treasure === 'doudou') this.setMood('hug', 'tada');
    else this.setMood('rattle', 'rattle');
  }

  /** A soap bubble reached her nose: she licks it, cross-eyed. */
  lick(): void {
    if (this.asleep()) return;
    this.setMood('lick', 'pop');
  }

  /** Her mouth, in screen pixels (where soap bubbles fly to). */
  mouthPoint(): { x: number; y: number } | null {
    const ctm = this.svg().nativeElement.getScreenCTM?.();
    if (!ctm) return null;
    return { x: ctm.a * MOUTH.x + ctm.c * MOUTH.y + ctm.e, y: ctm.b * MOUTH.x + ctm.d * MOUTH.y + ctm.f };
  }

  // — Eyes —

  /** Turns her gaze (and a little of her head) towards a screen point. */
  private lookAt(clientX: number, clientY: number): void {
    // Hold still while an ear is being pulled, so it stays under the finger.
    if (this.earDrag) return;
    const ctm = this.svg().nativeElement.getScreenCTM?.();
    if (!ctm) return;
    // Between her eyes, in screen pixels.
    const dx = clientX - (ctm.a * 200 + ctm.c * 128 + ctm.e);
    const dy = clientY - (ctm.b * 200 + ctm.d * 128 + ctm.f);
    const dist = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, dist / 160);
    const style = this.host.nativeElement.style;
    style.setProperty('--kiki-look-x', `${((dx / dist) * 4.5 * reach).toFixed(2)}px`);
    style.setProperty('--kiki-look-y', `${((dy / dist) * 4 * reach).toFixed(2)}px`);
    style.setProperty('--kiki-tilt', `${((dx / dist) * 4 * reach).toFixed(2)}deg`);
  }

  // — Pointer routing (pacifier and ears capture the pointer on the SVG) —

  protected onPointerMove(event: PointerEvent): void {
    if (this.earDrag?.id === event.pointerId) this.stretchEar(event);
    else if (this.drag?.id === event.pointerId) this.movePacifier(event);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.earDrag?.id === event.pointerId) this.releaseEar();
    else if (this.drag?.id === event.pointerId) this.releasePacifier();
  }

  // — Pacifier —

  protected grab(event: PointerEvent): void {
    if (!this.interactive()) return;
    event.stopPropagation();
    event.preventDefault();
    this.wake();
    const p = this.toSvg(event);
    this.drag = { id: event.pointerId, startX: p.x, startY: p.y, moved: false, from: this.pacifier() };
    this.svg().nativeElement.setPointerCapture?.(event.pointerId);
    clearTimeout(this.fallTimer);
    this.falling.set(false);
  }

  private movePacifier(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag) return;
    const p = this.toSvg(event);
    if (!drag.moved && Math.hypot(p.x - drag.startX, p.y - drag.startY) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      if (drag.from === 'mouth') this.sounds.play('pop');
    }
    this.free.set(p);
    this.pacifier.set('drag');
  }

  private releasePacifier(): void {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    if (!drag.moved) {
      // A tap: pull it out, or give it back.
      if (drag.from === 'mouth') this.pullOut();
      else this.returnPacifier();
      return;
    }
    const p = this.free();
    if (Math.hypot(p.x - MOUTH.x, p.y - MOUTH.y) < 30) this.returnPacifier();
    else this.drop(p, drag.from);
  }

  protected pull(event: Event): void {
    event.preventDefault();
    this.pullOut();
  }

  protected giveBack(event: Event): void {
    event.preventDefault();
    this.returnPacifier();
  }

  private pullOut(): void {
    this.sounds.play('pop');
    this.free.set({ ...MOUTH });
    this.pacifier.set('drag');
    // Next frame, so the fall animates from the mouth: it lands on her
    // left, by her feet (where the doudou waits on the home page).
    requestAnimationFrame(() => this.drop({ x: TAP_DROP_X, y: GROUND_Y }, 'mouth', true));
  }

  /** Lets go of the pacifier where it is (kept within the drawing), or
   * lets it fall there; out of her mouth, she cries. */
  private drop(at: { x: number; y: number }, from: Pacifier, fall = false): void {
    this.falling.set(fall);
    this.free.set({ x: Math.min(340, Math.max(88, at.x)), y: Math.min(GROUND_Y, Math.max(40, at.y)) });
    this.pacifier.set('free');
    if (fall) this.fallTimer = setTimeout(() => this.falling.set(false), 560);
    if (from === 'mouth') {
      this.comforted.set(false);
      this.setMood('pout');
      setTimeout(() => {
        if (this.pacifier() !== 'free') return;
        this.sounds.play('cry');
        this.discover('cry');
      }, MOOD_MS.pout);
    }
  }

  private returnPacifier(): void {
    const wasOut = this.pacifier() !== 'mouth';
    this.falling.set(false);
    this.pacifier.set('mouth');
    this.free.set({ ...MOUTH });
    if (wasOut) {
      this.sounds.play('squeak');
      this.setMood('relief');
    }
  }

  // — Ears: pull one outwards, let go, and she pulls a face —

  protected grabEar(event: PointerEvent, ear: Ear): void {
    if (!this.interactive()) return;
    event.stopPropagation();
    event.preventDefault();
    this.wake();
    const p = this.toSvg(event);
    this.earDrag = { id: event.pointerId, ear, startX: p.x, startY: p.y };
    this.svg().nativeElement.setPointerCapture?.(event.pointerId);
  }

  private stretchEar(event: PointerEvent): void {
    const drag = this.earDrag;
    if (!drag) return;
    const p = this.toSvg(event);
    const dx = p.x - drag.startX;
    const outwards = drag.ear === 'left' ? -dx : dx;
    // Any pull counts (sideways, up, diagonal) — just not pushing it inwards.
    const pull = outwards < -8 ? 0 : Math.hypot(dx, p.y - drag.startY);
    const stretch = Math.min(1.7, 1 + pull / 60);
    this.ears.update((ears) => ({ ...ears, [drag.ear]: stretch }));
  }

  private releaseEar(): void {
    const drag = this.earDrag;
    if (!drag) return;
    this.earDrag = null;
    const pulled = this.ears()[drag.ear] >= EAR_GRIMACE_AT;
    this.ears.set({ left: 1, right: 1 });
    if (pulled) this.setMood(drag.ear === 'left' ? 'cross' : 'tongue', 'boing');
  }

  // — Tickles, horns, petting, bath, sneezes —

  protected tickle(): void {
    if (!this.interactive() || this.mood() === 'cry' || this.mood() === 'sneeze') return;
    this.setMood('giggle', 'giggle');
  }

  protected tapHorns(event: Event): void {
    if (!this.interactive()) return;
    event.stopPropagation();
    if (this.mood() !== 'sneeze') this.setMood('shake', 'squeak');
  }

  /** Every tap on her counts towards a sneeze (pacifier and ears stop their own). */
  protected onTap(): void {
    if (this.interactive() && this.taps.tap()) this.setMood('sneeze', 'sneeze');
  }

  /** Stroking her head back and forth makes her purr with hearts. */
  protected onPet(event: PointerEvent): void {
    if (!this.interactive() || this.drag || this.earDrag || this.mood() !== 'idle') return;
    if (this.petting.add(event) > 450) {
      this.petting.reset();
      this.setMood('love', 'giggle');
    }
  }

  /** Scrubbing her body washes her spots out; fully washed, she shakes
   * herself dry and they're back. Stop halfway and they come back too. */
  protected onScrub(event: PointerEvent): void {
    if (!this.interactive() || this.drag || this.earDrag || this.asleep() || this.mood() === 'shakeoff') return;
    const distance = this.scrubbing.add(event);
    if (!distance) return;
    clearTimeout(this.bathTimer);
    this.soap.set(Math.max(BATH_MIN, 1 - distance / BATH_RUB_PX));
    if (this.soap() > BATH_MIN) {
      if (this.mood() !== 'bath') this.setMood('bath');
      else this.extendMood('bath');
      this.bathTimer = setTimeout(() => this.soap.set(1), 2_500);
      return;
    }
    this.scrubbing.reset();
    this.setMood('shakeoff', 'splash');
    this.bathTimer = setTimeout(() => this.soap.set(1), 350);
  }

  // — Yawns and naps —

  /** Once a second: a yawn after a while, a nap after a longer while. */
  private tick(): void {
    if (!this.interactive() || !this.onScreen || this.asleep() || this.drag || this.earDrag) return;
    const now = Date.now();
    const idle = now - this.lastActivity;
    if (idle >= SLEEP_AFTER_MS) {
      clearTimeout(this.moodTimer);
      this.passing.set(null);
      this.asleep.set(true);
      this.discover('sleep');
    } else if (idle >= YAWN_AFTER_MS && now - this.lastYawn >= YAWN_EVERY_MS && !this.passing()) {
      this.lastYawn = now;
      this.teased = false;
      this.setMood('yawn', 'yawn');
    }
  }

  private wake(): void {
    const now = Date.now();
    this.lastActivity = now;
    if (this.asleep()) {
      this.asleep.set(false);
      this.setMood('startle', 'pop');
      const missing = this.missing();
      if (missing.length) {
        this.lostTreasure.set(missing[Math.floor(Math.random() * missing.length)]);
        setTimeout(() => {
          if (this.mood() === 'idle') this.setMood('lost');
        }, (MOOD_MS.startle ?? 0) + 200);
      }
      return;
    }
    // Back after her yawn? Bet they yawned too.
    const sinceYawn = now - this.lastYawn;
    if (!this.teased && sinceYawn > (MOOD_MS.yawn ?? 0) && sinceYawn < SMUG_WINDOW_MS && !this.passing()) {
      this.teased = true;
      this.setMood('smug', 'giggle');
    }
  }

  // — Helpers —

  private setMood(mood: KikiMood, sound?: KikiSound): void {
    clearTimeout(this.moodTimer);
    this.asleep.set(false);
    this.passing.set(mood);
    this.discover(mood);
    if (sound) this.sounds.play(sound);
    this.extendMood(mood);
  }

  /** Ticks the notebook entry this mood reveals, if any. */
  private discover(mood: KikiMood): void {
    const discovery = MOOD_DISCOVERY[mood];
    if (discovery) this.discoveries.record(discovery);
  }

  /** (Re)starts the countdown back to her resting mood. */
  private extendMood(mood: KikiMood): void {
    clearTimeout(this.moodTimer);
    const ms = MOOD_MS[mood];
    if (ms) this.moodTimer = setTimeout(() => this.passing.set(null), ms);
  }

  /** A pointer event's position in the drawing's user units. */
  private toSvg(event: PointerEvent): { x: number; y: number } {
    const ctm = this.svg().nativeElement.getScreenCTM?.();
    if (!ctm) return { ...MOUTH };
    const inv = ctm.inverse();
    return {
      x: inv.a * event.clientX + inv.c * event.clientY + inv.e,
      y: inv.b * event.clientX + inv.d * event.clientY + inv.f,
    };
  }
}

let nextId = 0;
