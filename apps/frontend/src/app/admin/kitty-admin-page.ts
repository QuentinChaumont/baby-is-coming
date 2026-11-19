import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminContribution } from '@org/shared-contracts';
import { AdminApi } from './admin-api.service';
import { euros, when } from './admin-format';

type Filter = 'all' | 'toReceive' | 'toThank';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'toReceive', label: 'Pas encore reçues' },
  { value: 'toThank', label: 'À remercier' },
];

const contributorName = (c: AdminContribution) =>
  c.anonymized || !c.firstName ? 'Invité anonymisé' : `${c.firstName} ${c.lastName ?? ''}`.trim();

/**
 * Kitty pledges in the back-office (DEV step 4.4, PRODUCT F5): amounts
 * (parents only), « Reçu ✓ » when the transfer arrives, « Merci envoyé ✓ »,
 * cancelling. Goal and payment methods live in Réglages.
 */
@Component({
  selector: 'app-kitty-admin-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kadm">
      <h1>Cagnotte</h1>

      <div class="kadm__totals">
        <p><span class="kadm__figure">{{ promised() }}</span> promis</p>
        <p><span class="kadm__figure">{{ received() }}</span> reçus</p>
      </div>
      <p class="kadm__hint">Objectif et moyens de paiement : <a routerLink="/admin/reglages">Réglages</a>.</p>

      @if (message(); as m) {
        <p class="kadm__message" [class.kadm__message--error]="m.error" [attr.role]="m.error ? 'alert' : 'status'">{{ m.text }}</p>
      }

      <div class="kadm__filters" role="group" aria-label="Filtrer">
        @for (f of filters; track f.value) {
          <button type="button" [attr.aria-pressed]="filter() === f.value" (click)="filter.set(f.value)">{{ f.label }}</button>
        }
      </div>

      @if (!visible().length) {
        <p>Aucune promesse ici.</p>
      }
      <ul class="kadm__list">
        @for (c of visible(); track c.id) {
          <li class="kadm__row">
            <div class="kadm__main">
              <p>
                <strong>{{ name(c) }}</strong> · <span class="kadm__amount">{{ euros(c.amount) }}</span>
                @if (c.hideName) { <span class="kadm__tag">nom masqué</span> }
              </p>
              <p class="kadm__when">{{ when(c.createdAt) }}</p>
              @if (c.message) {
                <blockquote class="kadm__note">« {{ c.message }} »</blockquote>
              }
            </div>
            <div class="kadm__side">
              <label><input type="checkbox" [checked]="c.received" (change)="toggle(c, 'received')" /> Reçu</label>
              <label><input type="checkbox" [checked]="c.thanked" (change)="toggle(c, 'thanked')" /> Merci envoyé</label>
              @if (confirmCancel() === c.id) {
                <span>
                  Annuler cette promesse ?
                  <button type="button" class="kadm__link kadm__danger" (click)="cancel(c)">Oui</button>
                  <button type="button" class="kadm__link" (click)="confirmCancel.set(null)">Non</button>
                </span>
              } @else {
                <button type="button" class="kadm__link" (click)="confirmCancel.set(c.id)">Annuler la promesse</button>
              }
            </div>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .kadm {
      max-width: 60rem;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .kadm h1 {
      margin: 0;
      font-size: 2rem;
    }
    .kadm__totals {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .kadm__totals p {
      margin: 0;
      padding: 14px 18px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-secondary);
      font-weight: 800;
    }
    .kadm__figure {
      font-family: var(--app-font-display);
      font-size: 1.75rem;
    }
    .kadm__hint {
      margin: 0;
      color: var(--app-color-on-surface-variant);
    }
    .kadm__filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kadm__filters button {
      min-height: 40px;
      padding: 0 14px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-pill);
      background: var(--app-color-surface);
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    .kadm__filters button[aria-pressed='true'] {
      background: var(--app-color-ink);
      color: var(--app-color-on-primary);
    }
    .kadm__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .kadm__row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
    }
    .kadm__main {
      flex: 1 1 18rem;
    }
    .kadm__main p {
      margin: 0;
    }
    .kadm__amount {
      font-variant-numeric: tabular-nums;
      font-weight: 800;
    }
    .kadm__tag {
      margin-left: 6px;
      padding: 1px 6px;
      border-radius: var(--app-radius-sm);
      background: var(--app-color-surface-variant);
      font-size: 0.75rem;
      font-weight: 800;
    }
    .kadm__when {
      color: var(--app-color-on-surface-variant);
      font-size: 0.875rem;
    }
    .kadm__note {
      margin: 4px 0 0;
      font-family: var(--app-font-hand);
      font-size: 1.25rem;
      color: var(--app-color-sage-strong);
    }
    .kadm__side {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
    .kadm__side label {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      font-weight: 700;
    }
    .kadm__link {
      border: 0;
      background: transparent;
      padding: 2px 0;
      font: inherit;
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 3px;
      color: var(--app-color-ink);
      cursor: pointer;
    }
    .kadm__danger {
      color: var(--app-color-error);
    }
    .kadm__message {
      margin: 0;
      font-weight: 800;
    }
    .kadm__message--error {
      color: var(--app-color-error);
    }
  `,
})
export class KittyAdminPage {
  private readonly api = inject(AdminApi);
  protected readonly filters = FILTERS;
  protected readonly euros = euros;
  protected readonly when = when;
  protected readonly name = contributorName;

  protected readonly contributions = signal<AdminContribution[]>([]);
  protected readonly filter = signal<Filter>('all');
  protected readonly confirmCancel = signal<string | null>(null);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly visible = computed(() => {
    const all = this.contributions();
    const f = this.filter();
    return f === 'toReceive' ? all.filter((c) => !c.received) : f === 'toThank' ? all.filter((c) => !c.thanked) : all;
  });
  protected readonly promised = computed(() => euros(this.contributions().reduce((s, c) => s + c.amount, 0)));
  protected readonly received = computed(() =>
    euros(this.contributions().filter((c) => c.received).reduce((s, c) => s + c.amount, 0)),
  );

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.api.contributions().subscribe({
      next: (c) => this.contributions.set(c),
      error: () => this.message.set({ text: "La cagnotte n'a pas pu se charger.", error: true }),
    });
  }

  protected toggle(c: AdminContribution, field: 'received' | 'thanked'): void {
    this.api.updateContribution(c.id, { [field]: !c[field] }).subscribe({
      next: (updated) => this.contributions.update((all) => all.map((x) => (x.id === updated.id ? updated : x))),
      error: () => this.message.set({ text: "La modification n'a pas pu être enregistrée.", error: true }),
    });
  }

  protected cancel(c: AdminContribution): void {
    this.confirmCancel.set(null);
    this.api.cancelContribution(c.id).subscribe({
      next: () => {
        this.message.set({ text: `Promesse de ${contributorName(c)} annulée.`, error: false });
        this.reload();
      },
      error: () => this.message.set({ text: "L'annulation a échoué.", error: true }),
    });
  }
}
