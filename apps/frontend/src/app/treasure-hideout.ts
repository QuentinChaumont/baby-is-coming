import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Confetti, Doudou, Hochet, KikiTreasures, type KikiTreasure } from '@org/frontend-ui';
import { filter, map } from 'rxjs';

/** Where each lost treasure hides — the pages nobody reads — and which
 * screen edge it peeks from. */
export const TREASURE_HIDEOUTS: Record<KikiTreasure, { url: string; side: 'left' | 'right' }> = {
  doudou: { url: '/legal/notice', side: 'left' },
  hochet: { url: '/legal/privacy', side: 'right' },
};

/**
 * Kiki's lost treasures, each peeking from a screen edge on a legal page.
 * Finding one is remembered in this browser; it then waits next to Kiki
 * on the home page.
 */
@Component({
  selector: 'app-treasure-hideout',
  imports: [RouterLink, Doudou, Hochet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hiding(); as treasure) {
      <button
        type="button"
        class="hideout"
        [class.hideout--right]="side() === 'right'"
        aria-label="Qu'est-ce qui dépasse, là ?"
        (click)="find(treasure, $event)"
      >
        @if (treasure === 'doudou') {
          <lib-doudou class="hideout__treasure" />
        } @else {
          <lib-hochet class="hideout__treasure" />
        }
      </button>
    }
    @if (justFound(); as treasure) {
      <div class="found app-rise" role="status">
        @if (treasure === 'doudou') {
          <lib-doudou class="found__treasure" />
        } @else {
          <lib-hochet class="found__treasure" />
        }
        <div class="found__text">
          <p class="found__title">Le {{ treasure }} de Kiki !</p>
          <p>Elle le cherchait partout. Va vite le lui rendre.</p>
          <p class="found__count">Trésors retrouvés : {{ store.found().length }} / {{ store.total }}</p>
          <a class="app-button app-button--ink" routerLink="/" (click)="justFound.set(null)">
            Rendre le {{ treasure }} à Kiki
          </a>
        </div>
        <button type="button" class="found__close" aria-label="Fermer" (click)="justFound.set(null)">×</button>
      </div>
    }
  `,
  styles: `
    .hideout {
      position: fixed;
      left: 0;
      bottom: 22vh;
      z-index: 30;
      width: 46px;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      transform: translateX(-58%) rotate(32deg);
      transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
      -webkit-tap-highlight-color: transparent;
    }
    .hideout:hover,
    .hideout:focus-visible {
      transform: translateX(-30%) rotate(18deg);
    }
    .hideout--right {
      left: auto;
      right: 0;
      bottom: 34vh;
      transform: translateX(58%) rotate(-32deg);
    }
    .hideout--right:hover,
    .hideout--right:focus-visible {
      transform: translateX(30%) rotate(-18deg);
    }
    .hideout:focus-visible {
      outline: 3px solid var(--app-color-sage-strong);
      outline-offset: 2px;
    }
    .hideout__treasure {
      width: 46px;
      animation: hideout-wiggle 6s ease-in-out infinite;
    }
    /* Every few seconds, an ear twitches — just enough to be noticed. */
    @keyframes hideout-wiggle {
      0%, 88%, 100% {
        transform: rotate(0);
      }
      91% {
        transform: rotate(-8deg);
      }
      95% {
        transform: rotate(6deg);
      }
    }
    .found {
      position: fixed;
      left: 50%;
      bottom: 24px;
      z-index: 40;
      width: min(26rem, calc(100vw - 32px));
      margin-left: calc(min(26rem, calc(100vw - 32px)) / -2);
      box-sizing: border-box;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding: 16px 18px;
      background: var(--app-color-background);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
      box-shadow: 4px 4px 0 var(--app-color-ink);
    }
    .found__treasure {
      flex: none;
      width: 52px;
      animation: found-hop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 2;
    }
    @keyframes found-hop {
      40% {
        transform: translateY(-10px) rotate(-8deg);
      }
    }
    .found__text p {
      margin: 0 0 10px;
      font-size: 0.9375rem;
    }
    .found__text .found__count {
      font-weight: 800;
      font-size: 0.8125rem;
      color: var(--app-color-sage-strong);
    }
    .found__text .found__title {
      margin-bottom: 4px;
      font-family: var(--app-font-hand);
      font-weight: 700;
      font-size: 1.5rem;
      line-height: 1.1;
    }
    .found__close {
      flex: none;
      width: 32px;
      height: 32px;
      margin: -6px -8px 0 auto;
      border: 0;
      background: transparent;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--app-color-ink);
      cursor: pointer;
    }
  `,
})
export class TreasureHideout {
  private readonly router = inject(Router);
  private readonly confetti = inject(Confetti);
  protected readonly store = inject(KikiTreasures);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly justFound = signal<KikiTreasure | null>(null);
  /** The treasure still hidden on this page, if any. */
  protected readonly hiding = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    return this.store.missing().find((t) => TREASURE_HIDEOUTS[t].url === path) ?? null;
  });
  protected readonly side = computed(() => {
    const t = this.hiding();
    return t ? TREASURE_HIDEOUTS[t].side : 'left';
  });

  protected find(treasure: KikiTreasure, event: MouseEvent): void {
    this.store.markFound(treasure);
    this.justFound.set(treasure);
    const x = event.clientX || (TREASURE_HIDEOUTS[treasure].side === 'left' ? 24 : globalThis.innerWidth - 24);
    this.confetti.burst({ origin: { x, y: event.clientY || globalThis.innerHeight / 2 } });
  }
}
