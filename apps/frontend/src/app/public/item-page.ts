import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LinkPill, PriceTag, Stamp } from '@org/frontend-ui';
import type { ListingPlatform, PublicItem, PublicItemDetail, PublicListing } from '@org/shared-contracts';
import { catchError, map, merge, of, startWith, Subject, switchMap } from 'rxjs';
import { stampOf, takenByLine } from './item-card';
import { PublicApi } from './public-api.service';
import { TakeForm, type TakeKind } from './take-form';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready'; item: PublicItemDetail };

const PLATFORM_LABEL: Record<ListingPlatform, string> = {
  leboncoin: 'Leboncoin',
  vinted: 'Vinted',
  facebook: 'Facebook Marketplace',
  autre: 'Annonce',
};

/** « Leboncoin · 90 € · Nantes ». */
export function listingLabel(listing: PublicListing): string {
  const parts = [PLATFORM_LABEL[listing.platform]];
  if (listing.price !== null) parts.push(`${listing.price} €`);
  if (listing.location) parts.push(listing.location);
  return parts.join(' · ');
}

const CONFIRMATION: Record<TakeKind, { title: string; text: string }> = {
  chasse: {
    title: 'Bonne chasse !',
    text: 'On compte sur ton flair légendaire. Choisis un état que tu trouves correct, et si tu ne trouves pas, envoie-nous un petit message pour nous prévenir :)',
  },
  don: {
    title: 'Merci, Kiki va adorer !',
    text: "Une seconde vie pour cet objet, c'est exactement l'idée. Organise-toi avec nous par message pour nous le faire passer.",
  },
};

/**
 * Item page (DEV step 3.3): photo, price, description, listings, and the
 * actions — « Je pars à la chasse ! », « J'ai déjà ça chez moi ! » (inline
 * form, then confirmation) and « La flemme de chercher » (→ kitty).
 */
@Component({
  selector: 'app-item-page',
  imports: [RouterLink, LinkPill, PriceTag, Stamp, TakeForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state().status) {
      @case ('loading') {
        <div class="item__skeleton" aria-busy="true" aria-label="Chargement de l'objet"></div>
      }
      @case ('missing') {
        <main class="item__body">
          <h1>Cet objet n'existe pas (ou plus)</h1>
          <p><a routerLink="/liste">Retour à la liste</a></p>
        </main>
      }
      @case ('error') {
        <main class="item__body">
          <p class="item__error" role="alert">Oups, l'objet n'a pas pu se charger. Réessaie dans un instant.</p>
        </main>
      }
      @default {
        @if (item(); as it) {
          <main class="item">
            <div class="item__photo">
              @if (it.photos[0]; as photo) {
                <img [src]="photo.largeUrl" alt="" decoding="async" />
              }
              <a class="item__back" routerLink="/liste" aria-label="Retour à la liste">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </a>
              <lib-price-tag class="item__price" [amount]="it.price" variant="label" suffix="d'occasion" />
              @if (taken()) {
                <span class="item__veil"><lib-stamp [kind]="stamp()" /></span>
              }
            </div>

            <section class="item__body">
              <h1>{{ it.title }}</h1>
              @if (it.description) {
                <p class="item__description">{{ it.description }}</p>
              }
              @if (it.quantity > 1) {
                <p class="item__units">Encore {{ it.remaining }} sur {{ it.quantity }}</p>
              }

              @if (it.listings.length) {
                <div class="item__listings">
                  <h2>Des pistes pour chiner</h2>
                  <div class="item__pills">
                    @for (listing of it.listings; track listing.id) {
                      <lib-link-pill [href]="listing.url" [label]="listingLabel(listing)" />
                    }
                  </div>
                </div>
              }

              @if (!taken() && !confirmation()) {
                <p class="item__hand">
                  Choisis un état que tu trouves correct. Et si tu ne trouves pas, envoie-nous un
                  petit message pour nous prévenir :)
                </p>
              }
            </section>

            <section class="item__actions" aria-live="polite">
              @if (notice(); as message) {
                <p class="item__notice" role="alert">{{ message }}</p>
              }
              @if (confirmation(); as done) {
                <div class="item__done">
                  <h2>{{ done.title }}</h2>
                  <p>{{ done.text }}</p>
                  <a class="app-button app-button--outline app-button--block" routerLink="/liste">Retour à la liste</a>
                </div>
              } @else if (kind(); as chosen) {
                <app-take-form
                  [item]="it"
                  [kind]="chosen"
                  (taken)="onTaken($event, chosen)"
                  (conflict)="onConflict()"
                  (cancelled)="kind.set(null)"
                />
              } @else if (taken()) {
                <p class="item__taken">
                  Cet objet a déjà trouvé preneur{{ takenBy() ? ' (' + takenBy() + ')' : '' }}.
                </p>
                <a class="app-button app-button--butter app-button--block" routerLink="/cagnotte">
                  La cagnotte « J'ai la flemme »
                </a>
              } @else {
                <button type="button" class="app-button app-button--ink app-button--block" (click)="kind.set('chasse')">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" />
                  </svg>
                  Je pars à la chasse !
                </button>
                <button type="button" class="app-button app-button--outline app-button--block" (click)="kind.set('don')">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" />
                  </svg>
                  J'ai déjà ça chez moi !
                </button>
                <a class="item__flemme" routerLink="/cagnotte">La flemme de chercher ? La cagnotte</a>
                <p class="item__warning">Une fois validé, seuls les parents pourront modifier ou annuler.</p>
              }
            </section>
          </main>
        }
      }
    }
  `,
  styles: `
    .item {
      display: flex;
      flex-direction: column;
    }
    .item__skeleton {
      height: 440px;
      background: var(--app-color-surface-variant);
    }
    .item__photo {
      position: relative;
      aspect-ratio: 4 / 5;
      max-height: 70vh;
      background: var(--app-color-kraft);
    }
    .item__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .item__back {
      position: absolute;
      top: 16px;
      left: 16px;
      width: 44px;
      height: 44px;
      border-radius: var(--app-radius-pill);
      background: var(--app-color-background);
      color: var(--app-color-ink);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item__price {
      position: absolute;
      bottom: -18px;
      right: 20px;
    }
    .item__veil {
      position: absolute;
      inset: 0;
      background: rgba(251, 247, 238, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item__body {
      padding: 36px 24px 8px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .item__body h1 {
      margin: 0;
      font-size: 2rem;
      line-height: 1.05;
    }
    .item__description {
      margin: 0;
      font-size: 1rem;
      line-height: 1.55;
      white-space: pre-line;
    }
    .item__units {
      margin: 0;
      font-weight: 800;
    }
    .item__listings h2 {
      margin: 0 0 8px;
      font-family: var(--app-font-family);
      font-size: 0.875rem;
      letter-spacing: 0;
    }
    .item__pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .item__hand {
      margin: 6px 0 0;
      font-family: var(--app-font-hand);
      font-size: 1.375rem;
      line-height: 1.2;
      color: var(--app-color-sage-strong);
    }
    .item__actions {
      margin-top: 20px;
      padding: 20px 20px 28px;
      background: var(--app-color-sage);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .item__flemme {
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: var(--app-color-ink);
    }
    .item__warning {
      margin: 0;
      font-size: 0.8125rem;
      text-align: center;
    }
    .item__taken {
      margin: 0;
      font-weight: 800;
    }
    .item__done h2 {
      margin: 0 0 6px;
      font-size: 1.75rem;
    }
    .item__done p {
      margin: 0 0 14px;
      line-height: 1.5;
    }
    .item__notice {
      margin: 0;
      font-weight: 800;
      color: var(--app-color-ink);
    }
    .item__error {
      margin: 0;
      color: var(--app-color-error);
      font-weight: 800;
    }
  `,
})
export class ItemPage {
  private readonly api = inject(PublicApi);

  /** Route param `:id` (component input binding). */
  readonly id = input.required<string>();

  protected readonly kind = signal<TakeKind | null>(null);
  protected readonly confirmation = signal<{ title: string; text: string } | null>(null);
  protected readonly notice = signal<string | null>(null);
  private readonly afterTake = signal<PublicItem | null>(null);
  private readonly reloads = new Subject<void>();

  protected readonly state = toSignal(
    merge(toObservable(this.id), this.reloads.pipe(map(() => this.id()))).pipe(
      switchMap((id) =>
        this.api.item(id).pipe(
          map((item): PageState => ({ status: 'ready', item })),
          catchError((error: { status?: number }) =>
            of<PageState>({ status: error?.status === 404 ? 'missing' : 'error' }),
          ),
          startWith<PageState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as PageState },
  );

  protected readonly item = computed(() => {
    const s = this.state();
    if (s.status !== 'ready') return null;
    const updated = this.afterTake();
    return updated && updated.id === s.item.id ? { ...s.item, ...updated } : s.item;
  });

  protected readonly taken = computed(() => this.item()?.availability === 'taken');
  protected readonly stamp = computed(() => stampOf(this.item()?.takers ?? []));
  protected readonly takenBy = computed(() => takenByLine(this.item()?.takers ?? []));
  protected readonly listingLabel = listingLabel;

  protected onTaken(item: PublicItem, kind: TakeKind): void {
    this.afterTake.set(item);
    this.kind.set(null);
    this.confirmation.set(CONFIRMATION[kind]);
  }

  /** Someone else took it first: close the form, say so, refresh. */
  protected onConflict(): void {
    this.kind.set(null);
    this.notice.set("Oups, quelqu'un vient de le prendre juste avant toi.");
    this.reloads.next();
  }
}
