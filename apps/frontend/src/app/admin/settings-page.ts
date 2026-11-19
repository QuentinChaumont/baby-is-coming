import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AdminBirthList, UpdateBirthListRequest } from '@org/shared-contracts';
import { AdminApi } from './admin-api.service';
import { formatDay } from '../public/public-api.service';

const MAX_LINKS = 6;

/**
 * The list's settings (DEV step 4.5): nickname, due date, welcome message,
 * kitty goal and payment methods, guests' data anonymization date
 * (PRODUCT F1, F5, D13).
 */
@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="set">
      <h1>Réglages</h1>

      <form [formGroup]="form" (ngSubmit)="save()" novalidate class="set__form">
        <section class="set__card">
          <h2>Kiki</h2>
          <div class="set__row">
            <label class="set__field"><span>Surnom</span><input formControlName="babyNickname" maxlength="40" required /></label>
            <label class="set__field"><span>Date du terme</span><input formControlName="dueDate" type="date" /></label>
          </div>
          <label class="set__field">
            <span>Message d'accueil <em>(un paragraphe par ligne vide)</em></span>
            <textarea formControlName="welcomeMessage" rows="10" maxlength="4000"></textarea>
          </label>
        </section>

        <section class="set__card" formGroupName="paymentMethods">
          <h2>Cagnotte</h2>
          <label class="set__field set__field--short">
            <span>Objectif (€, facultatif)</span>
            <input [formControl]="form.controls.kittyGoal" type="number" min="1" step="1" />
          </label>
          <div class="set__row">
            <label class="set__field"><span>Titulaire du compte</span><input formControlName="ibanHolder" maxlength="120" /></label>
            <label class="set__field"><span>IBAN</span><input formControlName="iban" autocomplete="off" /></label>
          </div>
          <fieldset class="set__links">
            <legend>Liens de paiement (Lydia, PayPal, Wero…)</legend>
            @for (link of links.controls; track $index; let i = $index) {
              <div class="set__row" [formGroup]="link">
                <label class="set__field"><span>Nom</span><input formControlName="label" maxlength="40" /></label>
                <label class="set__field"><span>Lien (https://…)</span><input formControlName="url" type="url" /></label>
                <button type="button" class="set__link" (click)="links.removeAt(i)" [attr.aria-label]="'Retirer le lien ' + (i + 1)">Retirer</button>
              </div>
            }
            @if (links.length < maxLinks) {
              <button type="button" class="set__link" (click)="addLink()">+ Ajouter un lien</button>
            }
          </fieldset>
          <label class="set__field">
            <span>Note <em>(ex. « En main propre ou par chèque à la naissance »)</em></span>
            <input formControlName="note" maxlength="300" />
          </label>
        </section>

        <section class="set__card">
          <h2>Données des invités</h2>
          <p>
            Les noms et petits mots des invités sont effacés automatiquement à cette date.
            Laisse vide pour la date par défaut (6 mois après le terme).
          </p>
          <label class="set__field set__field--short">
            <span>Date d'effacement</span>
            <input formControlName="anonymizeAt" type="date" />
          </label>
          @if (effective(); as day) {
            <p class="set__hint">Date retenue : <strong>{{ day }}</strong></p>
          } @else {
            <p class="set__hint">Renseigne la date du terme pour fixer la date par défaut.</p>
          }
        </section>

        @if (message(); as m) {
          <p class="set__message" [class.set__message--error]="m.error" [attr.role]="m.error ? 'alert' : 'status'">{{ m.text }}</p>
        }
        <button type="submit" class="app-button app-button--ink" [disabled]="busy()">
          {{ busy() ? 'Enregistrement…' : 'Enregistrer les réglages' }}
        </button>
      </form>
    </div>
  `,
  styles: `
    .set {
      max-width: 48rem;
      padding: 24px;
    }
    .set h1 {
      margin: 0 0 16px;
      font-size: 2rem;
    }
    .set h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .set__form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .set__card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px 20px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
    }
    .set__card p {
      margin: 0;
    }
    .set__row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px;
    }
    .set__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 800;
      font-size: 0.875rem;
      flex: 1 1 12rem;
    }
    .set__field--short {
      max-width: 14rem;
    }
    .set__field em {
      font-weight: 400;
      font-style: normal;
    }
    .set input,
    .set textarea {
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
    .set__links {
      border: 0;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .set__links legend {
      font-weight: 800;
      font-size: 0.875rem;
      margin-bottom: 4px;
    }
    .set__link {
      align-self: flex-start;
      min-height: 44px;
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 3px;
      color: var(--app-color-ink);
      cursor: pointer;
    }
    .set__hint {
      color: var(--app-color-on-surface-variant);
    }
    .set__message {
      margin: 0;
      font-weight: 800;
    }
    .set__message--error {
      color: var(--app-color-error);
    }
  `,
})
export class SettingsPage {
  private readonly api = inject(AdminApi);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly maxLinks = MAX_LINKS;

  protected readonly busy = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);
  protected readonly effective = signal<string | null>(null);

  protected readonly form = this.fb.group({
    babyNickname: ['', [Validators.required, Validators.maxLength(40)]],
    dueDate: [''],
    welcomeMessage: [''],
    kittyGoal: [null as number | null],
    anonymizeAt: [''],
    paymentMethods: this.fb.group({
      iban: [''],
      ibanHolder: [''],
      note: [''],
      links: this.fb.array<ReturnType<SettingsPage['linkGroup']>>([]),
    }),
  });
  protected readonly links = this.form.controls.paymentMethods.controls.links as FormArray<
    ReturnType<SettingsPage['linkGroup']>
  >;

  constructor() {
    this.api.list().subscribe({
      next: (list) => this.loaded(list),
      error: () => this.message.set({ text: "Les réglages n'ont pas pu se charger.", error: true }),
    });
  }

  private linkGroup(label = '', url = '') {
    return this.fb.group({ label: [label], url: [url] });
  }

  protected addLink(): void {
    this.links.push(this.linkGroup());
  }

  private loaded(list: AdminBirthList): void {
    this.links.clear();
    list.paymentMethods.links.forEach((l) => this.links.push(this.linkGroup(l.label, l.url)));
    this.form.patchValue({
      babyNickname: list.babyNickname,
      dueDate: list.dueDate ?? '',
      welcomeMessage: list.welcomeMessage,
      kittyGoal: list.kittyGoal,
      anonymizeAt: list.anonymizeAt ?? '',
      paymentMethods: {
        iban: list.paymentMethods.iban ?? '',
        ibanHolder: list.paymentMethods.ibanHolder ?? '',
        note: list.paymentMethods.note ?? '',
      },
    });
    this.effective.set(list.effectiveAnonymizeAt ? formatDay(list.effectiveAnonymizeAt) : null);
  }

  protected save(): void {
    const v = this.form.getRawValue();
    if (!v.babyNickname.trim()) {
      this.message.set({ text: 'Il faut un surnom (« Kiki » par défaut).', error: true });
      return;
    }
    const goal = v.kittyGoal === null || (v.kittyGoal as unknown) === '' ? null : Number(v.kittyGoal);
    const patch: UpdateBirthListRequest = {
      babyNickname: v.babyNickname,
      dueDate: v.dueDate || null,
      welcomeMessage: v.welcomeMessage,
      kittyGoal: goal,
      anonymizeAt: v.anonymizeAt || null,
      paymentMethods: {
        iban: v.paymentMethods.iban.trim() || null,
        ibanHolder: v.paymentMethods.ibanHolder,
        note: v.paymentMethods.note,
        links: v.paymentMethods.links
          .filter((l) => l.label.trim() || l.url.trim())
          .map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
      },
    };
    this.busy.set(true);
    this.api.updateList(patch).subscribe({
      next: (list) => {
        this.busy.set(false);
        this.loaded(list);
        this.message.set({ text: 'Réglages enregistrés.', error: false });
      },
      error: () => {
        this.busy.set(false);
        this.message.set({
          text: "Enregistrement refusé : vérifie l'IBAN, que les liens commencent par https:// et que chacun a un nom.",
          error: true,
        });
      },
    });
  }
}
