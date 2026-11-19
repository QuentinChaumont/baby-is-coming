import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { AdminItem, AdminParticipation, ParticipationKind } from '@org/shared-contracts';
import { AdminApi } from './admin-api.service';
import { KIND_LABEL, guestName, when } from './admin-format';
import { apiErrorCode } from '../public/public-api.service';

type Filter = 'all' | 'toReceive' | 'toThank' | 'byParents';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'toReceive', label: 'Pas encore reçues' },
  { value: 'toThank', label: 'À remercier' },
  { value: 'byParents', label: 'Saisies par vous' },
];

/**
 * Who took what (DEV step 4.3, PRODUCT F8): « petits mots », « Reçu ✓ »
 * and « Merci envoyé ✓ », cancelling (the item becomes available again),
 * and assigning an item on a guest's behalf or marking it taken.
 */
@Component({
  selector: 'app-participations-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parts">
      <h1>Participations</h1>

      @if (message(); as m) {
        <p class="parts__message" [class.parts__message--error]="m.error" [attr.role]="m.error ? 'alert' : 'status'">{{ m.text }}</p>
      }

      <div class="parts__filters" role="group" aria-label="Filtrer">
        @for (f of filters; track f.value) {
          <button type="button" [attr.aria-pressed]="filter() === f.value" (click)="filter.set(f.value)">{{ f.label }}</button>
        }
      </div>

      @if (!visible().length) {
        <p>Rien à afficher ici.</p>
      }
      <ul class="parts__list">
        @for (p of visible(); track p.id) {
          <li class="parts__row">
            <div class="parts__main">
              <p class="parts__who">
                <strong>{{ guestName(p) }}</strong>
                @if (p.hideName) { <span class="parts__tag">nom masqué</span> }
                @if (p.enteredByParents) { <span class="parts__tag">saisie par vous</span> }
              </p>
              <p>
                <a [routerLink]="['/admin/objets', p.itemId]">{{ p.itemTitle }}</a>
                · {{ kindLabel[p.kind] }}@if (p.quantity > 1) { · ×{{ p.quantity }} }
                · <span class="parts__when">{{ when(p.createdAt) }}</span>
              </p>
              @if (p.message) {
                <blockquote class="parts__note">« {{ p.message }} »</blockquote>
              }
            </div>
            <div class="parts__side">
              <label><input type="checkbox" [checked]="p.received" (change)="toggle(p, 'received')" /> Reçu</label>
              @if (p.kind !== 'parents') {
                <label><input type="checkbox" [checked]="p.thanked" (change)="toggle(p, 'thanked')" /> Merci envoyé</label>
              }
              @if (confirmCancel() === p.id) {
                <span class="parts__confirm">
                  Remettre « {{ p.itemTitle }} » disponible ?
                  <button type="button" class="parts__link parts__danger" (click)="cancel(p)">Oui</button>
                  <button type="button" class="parts__link" (click)="confirmCancel.set(null)">Non</button>
                </span>
              } @else {
                <button type="button" class="parts__link" (click)="confirmCancel.set(p.id)">Annuler la participation</button>
              }
            </div>
          </li>
        }
      </ul>

      <form class="parts__assign" [formGroup]="assignForm" (ngSubmit)="assign()" novalidate>
        <h2>Attribuer un objet</h2>
        <p class="parts__hint">Mamie a appelé au lieu d'aller sur le site ? Saisis sa participation ici.</p>
        <label class="parts__field">
          <span>Objet</span>
          <select formControlName="itemId" required>
            <option value="">Choisir…</option>
            @for (item of assignable(); track item.id) {
              <option [value]="item.id">{{ item.title }}{{ item.quantity > 1 ? ' (' + item.remaining + ' dispo)' : '' }}</option>
            }
          </select>
        </label>
        <fieldset class="parts__kinds">
          <legend>Type</legend>
          <label><input type="radio" formControlName="kind" value="chasse" /> Chasse</label>
          <label><input type="radio" formControlName="kind" value="don" /> Don</label>
          <label><input type="radio" formControlName="kind" value="parents" /> Pris par nous (sans invité)</label>
        </fieldset>
        @if (assignForm.controls.kind.value !== 'parents') {
          <div class="parts__row-fields">
            <label class="parts__field"><span>Prénom</span><input formControlName="firstName" /></label>
            <label class="parts__field"><span>Nom</span><input formControlName="lastName" /></label>
          </div>
          <label class="parts__check"><input type="checkbox" formControlName="hideName" /> Masquer son nom aux autres invités</label>
          <label class="parts__field"><span>Son petit mot <em>(facultatif)</em></span><textarea formControlName="message" rows="2"></textarea></label>
        }
        <button type="submit" class="app-button app-button--ink">Attribuer</button>
      </form>
    </div>
  `,
  styles: `
    .parts {
      max-width: 60rem;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .parts h1 {
      margin: 0;
      font-size: 2rem;
    }
    .parts h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .parts__filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .parts__filters button {
      min-height: 40px;
      padding: 0 14px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-pill);
      background: var(--app-color-surface);
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    .parts__filters button[aria-pressed='true'] {
      background: var(--app-color-ink);
      color: var(--app-color-on-primary);
    }
    .parts__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .parts__row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
    }
    .parts__main p {
      margin: 0;
    }
    .parts__main {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1 1 20rem;
    }
    .parts__tag {
      margin-left: 6px;
      padding: 1px 6px;
      border-radius: var(--app-radius-sm);
      background: var(--app-color-surface-variant);
      font-size: 0.75rem;
      font-weight: 800;
    }
    .parts__when {
      color: var(--app-color-on-surface-variant);
    }
    .parts__note {
      margin: 4px 0 0;
      font-family: var(--app-font-hand);
      font-size: 1.25rem;
      color: var(--app-color-sage-strong);
    }
    .parts__side {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
    .parts__side label,
    .parts__check {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      font-weight: 700;
    }
    .parts__link {
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
    .parts__danger {
      color: var(--app-color-error);
    }
    .parts__assign {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 18px 20px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
    }
    .parts__hint {
      margin: 0;
      color: var(--app-color-on-surface-variant);
    }
    .parts__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 800;
      font-size: 0.875rem;
      flex: 1 1 10rem;
    }
    .parts__field em {
      font-weight: 400;
      font-style: normal;
    }
    .parts input:not([type='checkbox']):not([type='radio']),
    .parts select,
    .parts textarea {
      min-height: 44px;
      padding: 8px 12px;
      box-sizing: border-box;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      font: inherit;
      color: var(--app-color-ink);
    }
    .parts__row-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .parts__kinds {
      border: 0;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px 16px;
    }
    .parts__kinds legend {
      font-weight: 800;
      font-size: 0.875rem;
      margin-bottom: 4px;
    }
    .parts__message {
      margin: 0;
      font-weight: 800;
    }
    .parts__message--error {
      color: var(--app-color-error);
    }
  `,
})
export class ParticipationsPage {
  private readonly api = inject(AdminApi);
  protected readonly filters = FILTERS;
  protected readonly kindLabel = KIND_LABEL;
  protected readonly guestName = guestName;
  protected readonly when = when;

  protected readonly participations = signal<AdminParticipation[]>([]);
  private readonly items = signal<AdminItem[]>([]);
  protected readonly filter = signal<Filter>('all');
  protected readonly confirmCancel = signal<string | null>(null);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly assignForm = inject(NonNullableFormBuilder).group({
    itemId: [''],
    kind: ['chasse' as ParticipationKind],
    firstName: [''],
    lastName: [''],
    hideName: [false],
    message: [''],
  });

  protected readonly visible = computed(() => {
    const all = this.participations();
    switch (this.filter()) {
      case 'toReceive':
        return all.filter((p) => !p.received);
      case 'toThank':
        return all.filter((p) => p.kind !== 'parents' && !p.thanked);
      case 'byParents':
        return all.filter((p) => p.enteredByParents);
      default:
        return all;
    }
  });

  /** Items that still have a free unit and are not archived. */
  protected readonly assignable = computed(() =>
    this.items().filter((i) => i.publication !== 'archived' && i.remaining > 0),
  );

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.api.participations().subscribe((p) => this.participations.set(p));
    this.api.items().subscribe((i) => this.items.set(i));
  }

  protected toggle(p: AdminParticipation, field: 'received' | 'thanked'): void {
    this.api.updateParticipation(p.id, { [field]: !p[field] }).subscribe({
      next: (updated) => this.participations.update((all) => all.map((x) => (x.id === updated.id ? updated : x))),
      error: () => this.message.set({ text: "La modification n'a pas pu être enregistrée.", error: true }),
    });
  }

  protected cancel(p: AdminParticipation): void {
    this.confirmCancel.set(null);
    this.api.cancelParticipation(p.id).subscribe({
      next: () => {
        this.message.set({ text: `« ${p.itemTitle} » est de nouveau disponible. Pense à prévenir ${guestName(p)}.`, error: false });
        this.reload();
      },
      error: () => this.message.set({ text: "L'annulation a échoué.", error: true }),
    });
  }

  protected assign(): void {
    const v = this.assignForm.getRawValue();
    if (!v.itemId) {
      this.message.set({ text: 'Choisis un objet.', error: true });
      return;
    }
    if (v.kind !== 'parents' && (!v.firstName.trim() || !v.lastName.trim())) {
      this.message.set({ text: 'Prénom et nom de la personne, pour savoir qui remercier.', error: true });
      return;
    }
    this.api
      .assign(v.itemId, {
        kind: v.kind,
        firstName: v.kind === 'parents' ? undefined : v.firstName,
        lastName: v.kind === 'parents' ? undefined : v.lastName,
        hideName: v.kind === 'parents' ? undefined : v.hideName,
        message: v.kind === 'parents' ? undefined : v.message.trim() || undefined,
      })
      .subscribe({
        next: (p) => {
          this.message.set({ text: `« ${p.itemTitle} » attribué.`, error: false });
          this.assignForm.reset({ itemId: '', kind: 'chasse', firstName: '', lastName: '', hideName: false, message: '' });
          this.reload();
        },
        error: (err: unknown) =>
          this.message.set({
            text: apiErrorCode(err) === 'ITEM_ALREADY_TAKEN' ? 'Cet objet vient d’être pris.' : "L'attribution a échoué.",
            error: true,
          }),
      });
  }
}
