import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LinkPill } from '@org/frontend-ui';
import type { PaymentMethods, PublicKitty } from '@org/shared-contracts';
import { catchError, forkJoin, map, of, startWith } from 'rxjs';
import { PublicApi } from './public-api.service';

type KittyState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; kitty: PublicKitty; payment: PaymentMethods };

const EUR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** « Merci à Paul M., Anne L. et 2 autres personnes discrètes ». */
export function thanksLine(kitty: PublicKitty): string | null {
  const hidden = kitty.contributorCount - kitty.contributors.length;
  const parts = [...kitty.contributors];
  if (hidden > 0) parts.push(hidden === 1 ? 'une personne discrète' : `${hidden} personnes discrètes`);
  if (!parts.length) return null;
  const last = parts.pop() as string;
  return `Merci à ${parts.length ? `${parts.join(', ')} et ${last}` : last} !`;
}

/** `FR7630006000011234567890189` → `FR76 3000 6000 0112 3456 7890 189`. */
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * The « J'ai la flemme » kitty (DEV step 3.4, PRODUCT F5): total promised
 * and visible names (never an individual amount), the pledge form, then
 * the parents' payment methods.
 */
@Component({
  selector: 'app-kitty-page',
  imports: [ReactiveFormsModule, LinkPill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="kitty">
      <h1>La cagnotte « J'ai la flemme »</h1>
      <p class="kitty__hand">
        La flemme de chercher ? Participe, et on s'occupe de dénicher les bonnes affaires
        qui manquent encore.
      </p>

      @switch (state().status) {
        @case ('loading') {
          <div class="kitty__skeleton" aria-busy="true" aria-label="Chargement de la cagnotte"></div>
        }
        @case ('error') {
          <p class="kitty__error" role="alert">Oups, la cagnotte n'a pas pu se charger. Réessaie dans un instant.</p>
        }
        @default {
          <section class="kitty__total" [class.kitty__total--bump]="thanked()" aria-label="Total promis">
            @if (empty()) {
              <p class="kitty__amount kitty__amount--empty">Pas encore de participation</p>
              <p class="kitty__goal">À toi l'honneur !</p>
            } @else {
              <p class="kitty__amount">{{ total() }} € promis</p>
            }
            @if (goal(); as g) {
              <p class="kitty__goal">pour un objectif de {{ g }} €</p>
            }
            @if (thanks(); as line) {
              <p class="kitty__thanks">{{ line }}</p>
            }
          </section>

          @if (thanked()) {
            <section class="kitty__pay app-rise" aria-live="polite">
              <h2>Merci ! Plus qu'à faire le geste</h2>
              <p>Rien ne passe par le site : voici comment nous faire parvenir ta participation.</p>
              @if (hasPayment()) {
                @if (payment()?.iban; as iban) {
                  <div class="kitty__iban">
                    @if (payment()?.ibanHolder; as holder) {
                      <p class="kitty__label">Virement à {{ holder }}</p>
                    } @else {
                      <p class="kitty__label">Virement</p>
                    }
                    <p class="kitty__iban-value">{{ formatIban(iban) }}</p>
                    <button type="button" class="app-button app-button--outline" (click)="copy(iban)">
                      {{ copied() ? 'Copié !' : "Copier l'IBAN" }}
                    </button>
                  </div>
                }
                @if (payment()?.links?.length) {
                  <div class="kitty__links">
                    @for (link of payment()?.links; track link.url) {
                      <lib-link-pill [href]="link.url" [label]="link.label" />
                    }
                  </div>
                }
                @if (payment()?.note; as note) {
                  <p class="kitty__note">{{ note }}</p>
                }
              } @else {
                <p class="kitty__note">Les parents te diront comment leur faire parvenir ta participation.</p>
              }
            </section>
          } @else {
            <form class="kitty__form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <h2>Je participe</h2>
              <div class="kitty__row">
                <label class="kitty__field">
                  <span>Prénom</span>
                  <input formControlName="firstName" autocomplete="given-name" required />
                </label>
                <label class="kitty__field">
                  <span>Nom</span>
                  <input formControlName="lastName" autocomplete="family-name" required />
                </label>
              </div>
              <label class="kitty__field kitty__field--amount">
                <span>Montant (€)</span>
                <input formControlName="amount" type="number" inputmode="numeric" min="1" step="1" required />
              </label>
              <label class="kitty__check">
                <input type="checkbox" formControlName="hideName" />
                <span>Masquer mon nom aux autres invités</span>
              </label>
              <label class="kitty__field">
                <span>Un petit mot d'amour <em>(facultatif, lu seulement par les parents)</em></span>
                <textarea formControlName="message" rows="3" maxlength="1000"></textarea>
              </label>
              <div class="kitty__trap" aria-hidden="true">
                <label>Site web <input formControlName="website" tabindex="-1" autocomplete="off" /></label>
              </div>
              <p class="kitty__warning">
                Le montant reste entre toi et les parents. Une fois validé, seuls les parents pourront
                modifier ou annuler.
              </p>
              @if (failure(); as message) {
                <p class="kitty__error" role="alert">{{ message }}</p>
              }
              <button type="submit" class="app-button app-button--butter app-button--block" [disabled]="submitting()">
                {{ submitting() ? 'Un instant…' : 'Je promets ma participation' }}
              </button>
            </form>
          }
        }
      }
    </main>
  `,
  styles: `
    .kitty {
      padding: 20px 20px 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .kitty h1 {
      margin: 0;
      font-size: 2.125rem;
      line-height: 1.05;
    }
    .kitty h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    .kitty__hand {
      margin: 0;
      font-family: var(--app-font-hand);
      font-size: 1.375rem;
      line-height: 1.2;
      color: var(--app-color-sage-strong);
    }
    .kitty__skeleton {
      height: 160px;
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface-variant);
    }
    .kitty__total {
      background: var(--app-color-secondary);
      border-radius: var(--app-radius-lg);
      padding: 20px;
      transform: rotate(-0.6deg);
    }
    .kitty__total--bump {
      animation: total-bump 360ms var(--app-ease-out) both;
    }
    @keyframes total-bump {
      40% {
        transform: rotate(-0.6deg) scale(1.04);
      }
    }
    .kitty__total p {
      margin: 0;
    }
    .kitty__amount {
      font-family: var(--app-font-display);
      font-weight: 800;
      font-size: 2.25rem;
      line-height: 1.1;
    }
    .kitty__amount--empty {
      font-size: 1.625rem;
    }
    .kitty__goal {
      font-weight: 700;
    }
    .kitty__thanks {
      margin-top: 8px !important;
      font-family: var(--app-font-hand);
      font-size: 1.375rem;
      line-height: 1.2;
    }
    .kitty__form,
    .kitty__pay {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .kitty__pay p {
      margin: 0;
      line-height: 1.5;
    }
    .kitty__row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .kitty__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 800;
      font-size: 0.875rem;
    }
    .kitty__field em {
      font-weight: 400;
      font-style: normal;
    }
    .kitty__field--amount {
      max-width: 10rem;
    }
    .kitty input:not([type='checkbox']),
    .kitty textarea {
      min-height: 44px;
      padding: 8px 12px;
      box-sizing: border-box;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      font: inherit;
      font-size: 1rem;
      color: var(--app-color-ink);
    }
    .kitty__check {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      font-weight: 700;
    }
    .kitty__check input {
      width: 22px;
      height: 22px;
      accent-color: var(--app-color-ink);
    }
    .kitty__trap {
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
    .kitty__warning {
      margin: 0;
      font-size: 0.8125rem;
    }
    .kitty__error {
      margin: 0;
      font-weight: 800;
      color: var(--app-color-error);
    }
    .kitty__iban {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 16px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
    }
    .kitty__label {
      font-weight: 800;
    }
    .kitty__iban-value {
      font-family: var(--app-font-mono);
      font-size: 1rem;
      font-variant-numeric: tabular-nums;
      word-break: break-word;
    }
    .kitty__links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kitty__note {
      font-family: var(--app-font-hand);
      font-size: 1.375rem;
      line-height: 1.2;
      color: var(--app-color-sage-strong);
    }
  `,
})
export class KittyPage {
  private readonly api = inject(PublicApi);

  private readonly latest = signal<PublicKitty | null>(null);
  protected readonly thanked = signal(false);
  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly copied = signal(false);
  protected readonly formatIban = formatIban;

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    amount: [null as unknown as number, [Validators.required, Validators.min(1)]],
    hideName: [false],
    message: [''],
    website: [''],
  });

  protected readonly state = toSignal(
    forkJoin({ kitty: this.api.kitty(), list: this.api.list() }).pipe(
      map(({ kitty, list }): KittyState => ({ status: 'ready', kitty, payment: list.paymentMethods })),
      catchError(() => of<KittyState>({ status: 'error' })),
      startWith<KittyState>({ status: 'loading' }),
    ),
    { requireSync: true },
  );

  private readonly kitty = computed(() => {
    const s = this.state();
    return this.latest() ?? (s.status === 'ready' ? s.kitty : null);
  });
  protected readonly payment = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.payment : null;
  });
  protected readonly total = computed(() => EUR.format(this.kitty()?.totalPromised ?? 0));
  protected readonly empty = computed(() => (this.kitty()?.totalPromised ?? 0) === 0);
  protected readonly goal = computed(() => {
    const g = this.kitty()?.goal;
    return g ? EUR.format(g) : null;
  });
  protected readonly thanks = computed(() => {
    const k = this.kitty();
    return k ? thanksLine(k) : null;
  });
  protected readonly hasPayment = computed(() => {
    const p = this.payment();
    return !!p && (!!p.iban || p.links.length > 0 || !!p.note);
  });

  protected submit(): void {
    const value = this.form.getRawValue();
    const amount = Number(value.amount);
    if (!value.firstName.trim() || !value.lastName.trim()) {
      this.failure.set('Ton prénom et ton nom, pour que les parents sachent qui remercier.');
      return;
    }
    if (!Number.isInteger(amount) || amount < 1) {
      this.failure.set('Indique un montant en euros, sans centimes (1 € minimum).');
      return;
    }
    this.submitting.set(true);
    this.failure.set(null);
    this.api
      .pledge({
        firstName: value.firstName,
        lastName: value.lastName,
        amount,
        hideName: value.hideName,
        message: value.message.trim() || undefined,
        website: value.website || undefined,
      })
      .subscribe({
        next: (kitty) => {
          this.submitting.set(false);
          this.latest.set(kitty);
          this.thanked.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.failure.set("Oups, ça n'a pas marché. Réessaie dans un instant.");
        },
      });
  }

  protected copy(iban: string): void {
    void globalThis.navigator?.clipboard?.writeText(iban).then(
      () => this.copied.set(true),
      () => this.copied.set(false),
    );
  }
}
