import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { Kiki } from '@org/frontend-ui';

/** How far down the page before Kiki pops her head up. */
const SHOW_AFTER_PX = 600;

/**
 * Kiki peeks over the bottom-right edge once the guest has scrolled down
 * the page; tapping her heads back to the top.
 */
@Component({
  selector: 'app-kiki-peek',
  imports: [Kiki],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="peek"
      [class.peek--shown]="shown()"
      [attr.tabindex]="shown() ? 0 : -1"
      [attr.aria-hidden]="!shown()"
      aria-label="Remonter en haut de la page"
      (click)="toTop()"
    >
      <lib-kiki class="peek__kiki" [interactive]="false" />
    </button>
  `,
  styles: `
    .peek {
      position: fixed;
      right: 14px;
      bottom: 0;
      z-index: 20;
      width: 76px;
      height: 74px;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: hidden;
      cursor: pointer;
      transform: translateY(105%);
      transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .peek--shown {
      transform: translateY(0);
    }
    .peek:hover .peek__kiki,
    .peek:focus-visible .peek__kiki {
      transform: translateY(-6px) rotate(-4deg);
    }
    .peek:focus-visible {
      outline: 3px solid var(--app-color-sage-strong);
      outline-offset: -3px;
      border-radius: 12px;
    }
    .peek__kiki {
      width: 76px;
      transition: transform 260ms var(--app-ease-out);
    }
  `,
})
export class KikiPeek {
  protected readonly shown = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = globalThis.window;
      if (!win) return;
      const update = () => this.shown.set(win.scrollY > SHOW_AFTER_PX);
      win.addEventListener('scroll', update, { passive: true });
      update();
      destroyRef.onDestroy(() => win.removeEventListener('scroll', update));
    });
  }

  protected toTop(): void {
    const smooth = !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    globalThis.scrollTo?.({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }
}
