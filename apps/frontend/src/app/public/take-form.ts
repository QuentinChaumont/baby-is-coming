import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { PublicItem } from '@org/shared-contracts';
import { PublicApi, apiErrorCode } from './public-api.service';

/** What the guest chose on the item page. */
export type TakeKind = 'chasse' | 'don';

const SUBMIT_LABEL: Record<TakeKind, string> = {
  chasse: 'Je pars à la chasse !',
  don: 'Je le donne !',
};

/**
 * The « prendre un cadeau » form (PRODUCT F3, D2): first and last name,
 * « masquer mon nom », a private « petit mot », the number of units when
 * several are left, and an invisible honeypot. Taking is final — the form
 * says so before submitting.
 */
@Component({
  selector: 'app-take-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="take" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="take__row">
        <label class="take__field">
          <span>Prénom</span>
          <input formControlName="firstName" autocomplete="given-name" required />
        </label>
        <label class="take__field">
          <span>Nom</span>
          <input formControlName="lastName" autocomplete="family-name" required />
        </label>
      </div>
      @if (showNameError()) {
        <p class="take__error" role="alert">Ton prénom et ton nom, pour que les parents sachent qui remercier.</p>
      }

      @if (item().remaining > 1) {
        <label class="take__field take__field--short">
          <span>Combien ?</span>
          <select formControlName="quantity">
            @for (n of quantities(); track n) {
              <option [value]="n">{{ n }}</option>
            }
          </select>
        </label>
      }

      <label class="take__check">
        <input type="checkbox" formControlName="hideName" />
        <span>Masquer mon nom aux autres invités</span>
      </label>

      <label class="take__field">
        <span>Un petit mot d'amour <em>(facultatif, lu seulement par les parents)</em></span>
        <textarea formControlName="message" rows="3" maxlength="1000"></textarea>
      </label>

      <!-- Honeypot: invisible to people, irresistible to bots. -->
      <div class="take__trap" aria-hidden="true">
        <label>Site web <input formControlName="website" tabindex="-1" autocomplete="off" /></label>
      </div>

      <p class="take__warning">Une fois validé, seuls les parents pourront modifier ou annuler.</p>

      @if (failure(); as message) {
        <p class="take__error" role="alert">{{ message }}</p>
      }

      <button type="submit" class="app-button app-button--ink app-button--block" [disabled]="submitting()">
        {{ submitting() ? 'Un instant…' : submitLabel() }}
      </button>
      <button type="button" class="take__cancel" (click)="cancelled.emit()">Finalement non</button>
    </form>
  `,
  styles: `
    .take {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .take__row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .take__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 800;
      font-size: 0.875rem;
    }
    .take__field em {
      font-weight: 400;
      font-style: normal;
    }
    .take__field--short {
      max-width: 8rem;
    }
    .take input:not([type='checkbox']),
    .take select,
    .take textarea {
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
    .take textarea {
      resize: vertical;
    }
    .take__check {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      font-weight: 700;
      font-size: 0.9375rem;
    }
    .take__check input {
      width: 22px;
      height: 22px;
      accent-color: var(--app-color-ink);
    }
    .take__trap {
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
    .take__warning {
      margin: 0;
      font-size: 0.8125rem;
    }
    .take__error {
      margin: 0;
      font-weight: 800;
      color: var(--app-color-error);
    }
    .take__cancel {
      min-height: 44px;
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 800;
      color: var(--app-color-ink);
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
  `,
})
export class TakeForm {
  private readonly api = inject(PublicApi);

  readonly item = input.required<PublicItem>();
  readonly kind = input.required<TakeKind>();
  /** The item after a successful take. */
  readonly taken = output<PublicItem>();
  /** The item was taken by someone else in the meantime. */
  readonly conflict = output<void>();
  readonly cancelled = output<void>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    hideName: [false],
    message: [''],
    quantity: [1],
    website: [''],
  });

  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);
  private readonly triedToSubmit = signal(false);

  protected readonly submitLabel = computed(() => SUBMIT_LABEL[this.kind()]);
  protected readonly quantities = computed(() =>
    Array.from({ length: this.item().remaining }, (_, i) => i + 1),
  );

  protected showNameError(): boolean {
    return this.triedToSubmit() && (this.form.controls.firstName.invalid || this.form.controls.lastName.invalid);
  }

  protected submit(): void {
    this.triedToSubmit.set(true);
    const value = this.form.getRawValue();
    if (!value.firstName.trim() || !value.lastName.trim()) {
      this.form.controls.firstName.setErrors(value.firstName.trim() ? null : { required: true });
      this.form.controls.lastName.setErrors(value.lastName.trim() ? null : { required: true });
      return;
    }
    this.submitting.set(true);
    this.failure.set(null);
    this.api
      .take(this.item().id, {
        kind: this.kind(),
        firstName: value.firstName,
        lastName: value.lastName,
        hideName: value.hideName,
        message: value.message.trim() || undefined,
        quantity: Number(value.quantity) || 1,
        website: value.website || undefined,
      })
      .subscribe({
        next: (item) => {
          this.submitting.set(false);
          this.taken.emit(item ?? this.item());
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          if (apiErrorCode(error) === 'ITEM_ALREADY_TAKEN') {
            this.failure.set("Oups, quelqu'un vient de le prendre juste avant toi.");
            this.conflict.emit();
          } else {
            this.failure.set("Oups, ça n'a pas marché. Réessaie dans un instant.");
          }
        },
      });
  }
}
