import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KikiDiscoveries } from '@org/frontend-ui';
import { CarnetProgress } from './carnet';
import { SoundToggle } from './sound-toggle';

/**
 * The bottom-left corner of the public pages: Kiki's sound toggle and her
 * notebook, with the number of secrets found. A new discovery makes the
 * notebook hop and say so. It ducks out of the way while the guest scrolls
 * down (reading) and comes back when they scroll up.
 */
@Component({
  selector: 'app-kiki-corner',
  imports: [RouterLink, SoundToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.corner--away]': 'away() && !cheer()' },
  template: `
    <app-sound-toggle />
    <a
      class="corner__carnet"
      [class.corner__carnet--new]="cheer()"
      routerLink="/carnet"
      [attr.aria-label]="'Le carnet de Kiki : ' + progress.count() + ' secrets sur ' + progress.total"
      title="Le carnet de Kiki"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z" /><path d="M6 3v18" /><path d="M10 8h5M10 12h4" />
        <path d="M3.5 7h3M3.5 12h3M3.5 17h3" />
      </svg>
      <span class="corner__count" aria-hidden="true">{{ progress.count() }}/{{ progress.total }}</span>
    </a>
    @if (cheer()) {
      <span class="corner__news app-rise" role="status">Nouveau secret dans le carnet !</span>
    }
  `,
  styles: `
    :host {
      position: fixed;
      left: 12px;
      bottom: 12px;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 280ms var(--app-ease-out), opacity 280ms ease;
    }
    :host(.corner--away) {
      transform: translateY(calc(100% + 16px));
      opacity: 0;
      pointer-events: none;
    }
    .corner__carnet {
      height: 44px;
      padding: 0 12px 0 10px;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: var(--app-border-ink);
      border-radius: 999px;
      background: var(--app-color-secondary);
      box-shadow: 2px 2px 0 var(--app-color-ink);
      color: var(--app-color-ink);
      font-weight: 800;
      font-size: 0.875rem;
      text-decoration: none;
      transition: transform var(--app-duration-fast) var(--app-ease-out);
    }
    .corner__carnet:active {
      transform: scale(0.94);
    }
    .corner__carnet:focus-visible {
      outline: 3px solid var(--app-color-sage-strong);
      outline-offset: 2px;
    }
    .corner__carnet--new {
      animation: corner-hop 520ms cubic-bezier(0.34, 1.56, 0.64, 1) 3;
    }
    @keyframes corner-hop {
      40% {
        transform: translateY(-8px) rotate(-6deg);
      }
    }
    .corner__news {
      padding: 6px 10px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      background: var(--app-color-background);
      font-family: var(--app-font-hand);
      font-weight: 700;
      font-size: 1.125rem;
      white-space: nowrap;
    }
  `,
})
export class KikiCorner {
  protected readonly progress = inject(CarnetProgress);
  private readonly discoveries = inject(KikiDiscoveries);
  protected readonly cheer = signal(false);
  protected readonly away = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = globalThis.window;
      if (!win) return;
      let last = win.scrollY;
      const onScroll = () => {
        const y = win.scrollY;
        if (Math.abs(y - last) < 6) return;
        this.away.set(y > last && y > 80);
        last = y;
      };
      win.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => win.removeEventListener('scroll', onScroll));
    });

    // A fresh discovery: hop and say so for a moment.
    effect(() => {
      if (!this.discoveries.latest()) return;
      untracked(() => {
        this.cheer.set(true);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.cheer.set(false);
          this.discoveries.latest.set(null);
        }, 2_800);
      });
    });
  }
}
