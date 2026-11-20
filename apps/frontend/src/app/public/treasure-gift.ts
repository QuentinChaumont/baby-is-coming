import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { Doudou, Hochet, KIKI_HUG_MS, type KikiTreasure } from '@org/frontend-ui';

/**
 * A found treasure (doudou, rattle), waiting next to Kiki on the home
 * page. Tap it (or drag it onto her) and it flies to her; it comes back
 * after she's played with it, ready to be given again.
 */
@Component({
  selector: 'app-treasure-gift',
  imports: [Doudou, Hochet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="gift"
      [class.gift--away]="away()"
      [class.gift--dragging]="dragging()"
      [style.transform]="offset()"
      [attr.aria-label]="'Donner son ' + treasure() + ' à Kiki'"
      [disabled]="away()"
      (pointerdown)="grab($event)"
      (pointermove)="move($event)"
      (pointerup)="release($event)"
      (pointercancel)="cancel()"
      (keydown.enter)="give($event)"
      (keydown.space)="give($event)"
    >
      @if (treasure() === 'doudou') {
        <lib-doudou class="gift__treasure" />
      } @else {
        <lib-hochet class="gift__treasure" />
      }
    </button>
  `,
  styles: `
    :host {
      display: block;
      line-height: 0;
    }
    .gift {
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: grab;
      touch-action: none;
      transition: transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .gift--dragging {
      cursor: grabbing;
      transition: none;
    }
    .gift--away {
      opacity: 0;
      pointer-events: none;
    }
    .gift:focus-visible {
      outline: 3px solid var(--app-color-sage-strong);
      outline-offset: 2px;
      border-radius: 8px;
    }
    .gift__treasure {
      width: 100%;
      transform-origin: 50% 100%;
      animation: gift-idle 3.4s ease-in-out infinite;
    }
    .gift:hover .gift__treasure {
      animation-duration: 0.9s;
    }
    @keyframes gift-idle {
      50% {
        transform: rotate(-6deg) translateY(-2px);
      }
    }
  `,
})
export class TreasureGift {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly treasure = input.required<KikiTreasure>();
  /** Kiki's element: where the doudou flies to, and the drop zone. */
  readonly target = input.required<HTMLElement>();
  /** The treasure reached Kiki. */
  readonly given = output<void>();

  protected readonly away = signal(false);
  protected readonly dragging = signal(false);
  protected readonly offset = signal('none');
  private drag: { id: number; x: number; y: number; moved: boolean } | null = null;

  protected grab(event: PointerEvent): void {
    if (this.away()) return;
    this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected move(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    this.dragging.set(true);
    this.offset.set(`translate(${dx}px, ${dy}px) rotate(-10deg)`);
  }

  protected release(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) return;
    this.drag = null;
    this.dragging.set(false);
    if (!drag.moved || this.isOverTarget(event.clientX, event.clientY)) this.flyToKiki();
    else this.offset.set('none');
  }

  protected cancel(): void {
    this.drag = null;
    this.dragging.set(false);
    this.offset.set('none');
  }

  protected give(event: Event): void {
    event.preventDefault();
    this.flyToKiki();
  }

  private isOverTarget(x: number, y: number): boolean {
    const r = this.target().getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  /** Off to her neck, a beat, then the cuddle; back after it. */
  private flyToKiki(): void {
    const from = this.host.nativeElement.getBoundingClientRect();
    const to = this.target().getBoundingClientRect();
    const dx = to.left + to.width * 0.5 - (from.left + from.width / 2);
    const dy = to.top + to.height * 0.62 - (from.top + from.height / 2);
    this.offset.set(`translate(${dx}px, ${dy}px) scale(1.2)`);
    setTimeout(() => {
      this.away.set(true);
      this.given.emit();
      setTimeout(() => {
        this.offset.set('none');
        this.away.set(false);
      }, KIKI_HUG_MS);
    }, 360);
  }
}
