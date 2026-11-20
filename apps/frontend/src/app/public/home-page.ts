import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { GiraffeBand, InkCard, Kiki, KikiTreasures } from '@org/frontend-ui';
import type { PublicBirthList } from '@org/shared-contracts';
import { catchError, map, of, startWith } from 'rxjs';
import { PublicApi, formatDay } from './public-api.service';
import { ShareButton } from './share-button';
import { SoapBubbles } from './soap-bubbles';
import { KikiCorner } from './kiki-corner';
import { TreasureGift } from './treasure-gift';

/** « Plus que 42 (vrais) dodos » — the nights left until the due date (the
 * real nights of sleep: after that, it's over). */
export function dodosLine(dueDate: string | null | undefined, today = new Date()): string | null {
  if (!dueDate) return null;
  const [y, m, d] = dueDate.split('-').map(Number);
  const due = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const nights = Math.round((due - now) / 86_400_000);
  if (nights < 0) return null;
  if (nights === 0) return "C'est le grand jour !";
  if (nights === 1) return "Plus qu'un (vrai) dodo !";
  return `Plus que ${nights} (vrais) dodos`;
}

type HomeState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; list: PublicBirthList };

/**
 * Public home (DEV step 3.1, maquette A « Brocante en savane »): the
 * « Coucou, c'est Kiki » hero, the giraffe band, the parents' note and the
 * three ways to take part.
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, GiraffeBand, InkCard, Kiki, ShareButton, SoapBubbles, KikiCorner, TreasureGift],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="home">
      <!-- Tapping the sky blows soap bubbles (Kiki licks one of each puff). -->
      <header class="home__hero" (pointerdown)="aim($event)" (pointerup)="blow($event, bubbles)">
        <div class="home__hero-inner" [style.--treasures]="treasures.found().length">
        <app-soap-bubbles #bubbles [kiki]="kiki" />
        <lib-kiki #kiki class="home__kiki" [name]="nickname()" [missing]="treasures.missing()" />
        @for (treasure of treasures.found(); track treasure; let i = $index) {
          <app-treasure-gift
            class="home__treasure"
            [style.--slot]="i"
            [treasure]="treasure"
            [target]="kiki.element"
            (given)="kiki.receive(treasure)"
          />
        }
        <h1>Coucou,<br />c'est {{ nickname() }}</h1>
        <p class="home__tagline">Une liste de naissance 100 % seconde main</p>
        <div class="home__labels">
          @if (dueDate(); as due) {
            <span class="home__label home__label--butter">Terme prévu : <span class="home__nowrap">{{ due }}</span></span>
          }
          @if (dodos(); as left) {
            <span class="home__label home__label--count">{{ left }}</span>
          }
          <span class="home__label">Fille ou garçon ? Surprise</span>
        </div>
        </div>
      </header>
      <lib-giraffe-band />

      <section class="home__note" aria-labelledby="home-note-title">
        @switch (state().status) {
          @case ('ready') {
            <lib-ink-card tilted>
              <h2 id="home-note-title" class="home__note-title">Le mot des parents</h2>
              <p class="home__note-text">{{ welcome() }}</p>
            </lib-ink-card>
          }
          @case ('error') {
            <p class="home__error" role="alert">
              Oups, la liste n'a pas pu se charger. Réessaie dans un instant.
            </p>
          }
          @default {
            <div class="home__skeleton" aria-hidden="true"></div>
          }
        }
      </section>

      <section class="home__ways" aria-labelledby="home-ways-title">
        <h2 id="home-ways-title">Trois façons de jouer</h2>
        <ul>
          <li>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" />
            </svg>
            <div>
              <p class="home__way-title">Je pars à la chasse !</p>
              <p>Tu prends un objet de la liste et tu le déniches d'occasion.</p>
            </div>
          </li>
          <li>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" />
            </svg>
            <div>
              <p class="home__way-title">J'ai déjà ça chez moi !</p>
              <p>Il dort dans ton grenier ? Donne-lui une seconde vie.</p>
            </div>
          </li>
          <li>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 14c0-3 3-5 9-5s9 2 9 5v3H3z" /><path d="M5 17v3M19 17v3" />
            </svg>
            <div>
              <p class="home__way-title">La flemme de chercher</p>
              <p>Participe à la cagnotte « J'ai la flemme », on s'en occupera :)</p>
            </div>
          </li>
        </ul>
      </section>

      <nav class="home__nav" aria-label="Accès rapide">
        <a class="app-button app-button--ink app-button--block" routerLink="/liste">Voir la liste</a>
        <a class="app-button app-button--butter app-button--block" routerLink="/cagnotte">
          La cagnotte « J'ai la flemme »
        </a>
        <app-share-button />
      </nav>
      <app-kiki-corner />
    </main>
  `,
  styles: `
    /* The sage hero and the giraffe band run edge to edge; their content
       and the rest of the page keep the reading width, centred. */
    .home__hero {
      background: var(--app-color-sage);
      /* Bubbles drifting past the edge must not widen the page (on mobile
       * the browser zooms out and the layout jumps). Clip keeps
       * vertical overflow visible and creates no scroll container. */
      overflow-x: clip;
    }
    .home__nowrap {
      white-space: nowrap;
    }
    .home__hero-inner {
      position: relative;
      max-width: 40rem;
      margin: 0 auto;
      box-sizing: border-box;
      padding: 44px 24px 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .home__note,
    .home__ways,
    .home__nav {
      max-width: 40rem;
      margin-inline: auto;
      box-sizing: border-box;
    }
    /* Found treasures wait in a row at Kiki's feet, on her left; the
       labels make room for them. */
    .home__treasure {
      position: absolute;
      right: calc(clamp(112px, 30vw, 150px) + 2px + var(--slot, 0) * 32px);
      bottom: 4px;
      z-index: 2;
      width: 30px;
    }
    .home__kiki {
      position: absolute;
      right: 12px;
      bottom: -6px;
      width: clamp(112px, 30vw, 150px);
      z-index: 1;
      transform-origin: 50% 100%;
      animation: kiki-arrive 520ms var(--app-ease-out) 120ms both;
    }
    @keyframes kiki-arrive {
      from {
        opacity: 0;
        transform: translateY(18px) rotate(-4deg);
      }
    }
    .home__hero-inner .home__labels {
      max-width: calc(100% - clamp(100px, 28vw, 140px) - var(--treasures, 0) * 34px);
    }
    .home__hero h1,
    .home__tagline,
    .home__labels {
      position: relative;
      max-width: calc(100% - clamp(100px, 28vw, 140px));
    }
    .home__hero h1 {
      margin: 0;
      font-size: clamp(2.75rem, 12vw, 3.5rem);
      line-height: 0.95;
      color: var(--app-color-ink);
    }
    .home__tagline {
      margin: 0;
      font-family: var(--app-font-hand);
      font-size: 1.625rem;
      line-height: 1.1;
    }
    .home__labels {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .home__label {
      background: var(--app-color-background);
      padding: 6px 12px;
      border-radius: var(--app-radius-sm);
      font-weight: 800;
      font-size: 0.875rem;
      transform: rotate(1.5deg);
    }
    .home__label--count {
      font-family: var(--app-font-hand);
      font-size: 1.25rem;
      font-weight: 700;
      padding: 2px 12px;
      transform: rotate(-1deg);
      animation: home-count 2.8s ease-in-out infinite;
    }
    @keyframes home-count {
      50% {
        transform: rotate(1.5deg) scale(1.04);
      }
    }
    .home__label--butter {
      background: var(--app-color-secondary);
      transform: rotate(-2deg);
    }
    .home__note {
      padding: 32px 24px 8px;
    }
    .home__note-title {
      margin: 0 0 8px;
      font-size: 1.25rem;
    }
    .home__note-text {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.55;
      white-space: pre-line;
    }
    .home__skeleton {
      height: 240px;
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface-variant);
    }
    .home__error {
      margin: 0;
      color: var(--app-color-error);
      font-weight: 700;
    }
    .home__ways {
      padding: 36px 24px 12px;
    }
    .home__ways h2 {
      margin: 0 0 18px;
      font-size: 1.75rem;
    }
    .home__ways ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .home__ways li {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .home__ways svg {
      flex: none;
      color: var(--app-color-sage-strong);
    }
    .home__ways p {
      margin: 2px 0 0;
      font-size: 0.9375rem;
      line-height: 1.45;
    }
    .home__ways .home__way-title {
      margin: 0;
      font-weight: 800;
      font-size: 1.0625rem;
    }
    .home__nav {
      padding: 24px 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `,
})
export class HomePage {
  private readonly api = inject(PublicApi);
  protected readonly treasures = inject(KikiTreasures);

  protected readonly state = toSignal(
    this.api.list().pipe(
      map((list): HomeState => ({ status: 'ready', list })),
      catchError(() => of<HomeState>({ status: 'error' })),
      startWith<HomeState>({ status: 'loading' }),
    ),
    { requireSync: true },
  );

  private readonly list = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.list : null;
  });

  protected readonly nickname = computed(() => this.list()?.babyNickname ?? 'Kiki');
  protected readonly welcome = computed(() => this.list()?.welcomeMessage ?? '');
  protected readonly dodos = computed(() => dodosLine(this.list()?.dueDate));
  protected readonly dueDate = computed(() => {
    const due = this.list()?.dueDate;
    return due ? formatDay(due) : null;
  });

  private tapStart: { x: number; y: number; t: number } | null = null;

  protected aim(event: PointerEvent): void {
    this.tapStart = { x: event.clientX, y: event.clientY, t: event.timeStamp };
  }

  /** Bubbles on a tap in the sky — not a scroll that started there, and not
   * from Kiki, her treasures or links. */
  protected blow(event: PointerEvent, bubbles: SoapBubbles): void {
    const start = this.tapStart;
    this.tapStart = null;
    if (!start || event.timeStamp - start.t > 600) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
    const target = event.target as Element | null;
    if (target?.closest('lib-kiki, app-treasure-gift, a, button')) return;
    bubbles.blow(event.clientX, event.clientY);
  }
}
