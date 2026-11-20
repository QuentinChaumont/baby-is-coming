import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Confetti } from '@org/frontend-ui';
import type { HallOfFameEntry } from '@org/shared-contracts';
import { PublicApi } from './public-api.service';

/** Remembers, in this browser, the name signed in the hall of fame. */
const SIGNED_KEY = 'kiki-fame';

function readSigned(): string | null {
  try {
    return globalThis.localStorage?.getItem(SIGNED_KEY) ?? null;
  } catch {
    return null;
  }
}

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * The notebook's hall of fame: everyone who found all of Kiki's secrets,
 * first finders first. Once this guest's notebook is complete, a little
 * popup asks for their name (only « Prénom N. » is shown and kept).
 */
@Component({
  selector: 'app-carnet-fame',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="fame" aria-labelledby="fame-title">
      <h2 id="fame-title">Le tableau d'honneur</h2>
      <p class="fame__hand">Celles et ceux qui ont trouvé tous les secrets de Kiki.</p>
      @if (entries().length) {
        <ol class="fame__list">
          @for (entry of entries(); track entry.id; let i = $index) {
            <li [class.fame__me]="entry.name === signed()">
              <span class="fame__rank" aria-hidden="true">{{ medals[i] ?? i + 1 + '.' }}</span>
              <span class="fame__name">{{ entry.name }}</span>
              @if (entry.name === signed()) {
                <span class="fame__you">c'est toi !</span>
              }
            </li>
          }
        </ol>
      } @else {
        <p class="fame__empty">Personne pour l'instant… La première place t'attend !</p>
      }
      @if (complete() && !signed() && !open()) {
        <button type="button" class="app-button app-button--butter" (click)="open.set(true)">
          Inscrire mon nom au tableau d'honneur
        </button>
      }
    </section>

    @if (open()) {
      <div class="popup__backdrop" aria-hidden="true"></div>
      <div class="popup app-rise" role="dialog" aria-modal="true" aria-labelledby="popup-title" (keydown.escape)="later()">
        <p class="popup__trophy" aria-hidden="true">🏆</p>
        <h2 id="popup-title">Bravo, tu as trouvé tous les secrets !</h2>
        <p>Inscris ton nom au tableau d'honneur de Kiki. Seuls ton prénom et l'initiale de ton nom seront affichés.</p>
        <form [formGroup]="form" (ngSubmit)="sign()" novalidate>
          <div class="popup__row">
            <label>
              <span>Prénom</span>
              <input #first formControlName="firstName" autocomplete="given-name" required maxlength="60" />
            </label>
            <label>
              <span>Nom</span>
              <input formControlName="lastName" autocomplete="family-name" required maxlength="60" />
            </label>
          </div>
          <div class="popup__trap" aria-hidden="true">
            <label>Site web <input formControlName="website" tabindex="-1" autocomplete="off" /></label>
          </div>
          @if (error(); as message) {
            <p class="popup__error" role="alert">{{ message }}</p>
          }
          <button type="submit" class="app-button app-button--ink app-button--block" [disabled]="busy()">
            {{ busy() ? 'Un instant…' : 'Inscrire mon nom' }}
          </button>
          <button type="button" class="popup__later" (click)="later()">Plus tard</button>
        </form>
      </div>
    }
  `,
  styles: `
    .fame {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 18px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-kraft);
      box-shadow: 3px 3px 0 var(--app-color-ink);
    }
    .fame h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    .fame__hand {
      margin: 0;
      font-family: var(--app-font-hand);
      font-size: 1.25rem;
      color: var(--app-color-sage-strong);
    }
    .fame__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .fame__list li {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 6px 10px;
      border-radius: var(--app-radius-sm);
      background: var(--app-color-background);
    }
    .fame__list li.fame__me {
      background: var(--app-color-secondary);
    }
    .fame__rank {
      min-width: 1.75rem;
      font-weight: 800;
      text-align: center;
    }
    .fame__name {
      font-family: var(--app-font-hand);
      font-weight: 700;
      font-size: 1.375rem;
    }
    .fame__you {
      margin-left: auto;
      font-size: 0.8125rem;
      font-weight: 800;
    }
    .fame__empty {
      margin: 0;
      font-style: italic;
    }
    .popup__backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(34, 48, 31, 0.45);
    }
    .popup {
      position: fixed;
      z-index: 51;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(26rem, calc(100vw - 32px));
      box-sizing: border-box;
      padding: 22px 20px 16px;
      background: var(--app-color-background);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
      box-shadow: 4px 4px 0 var(--app-color-ink);
      text-align: center;
    }
    .popup h2 {
      margin: 0 0 6px;
      font-size: 1.375rem;
    }
    .popup p {
      margin: 0 0 12px;
      font-size: 0.9375rem;
    }
    .popup__trophy {
      font-size: 2.5rem;
      line-height: 1;
    }
    .popup form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
    }
    .popup__row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .popup label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 800;
      font-size: 0.875rem;
    }
    .popup input {
      min-height: 44px;
      padding: 8px 12px;
      box-sizing: border-box;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      font: inherit;
      font-size: 1rem;
    }
    .popup__trap {
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
    .popup__error {
      color: var(--app-color-error);
      font-weight: 800;
    }
    .popup__later {
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
export class CarnetFame {
  private readonly api = inject(PublicApi);
  private readonly confetti = inject(Confetti);
  private readonly firstField = viewChild<ElementRef<HTMLInputElement>>('first');

  /** This guest found every secret. */
  readonly complete = input(false);

  protected readonly medals = MEDALS;
  protected readonly entries = signal<HallOfFameEntry[]>([]);
  protected readonly signed = signal<string | null>(readSigned());
  protected readonly open = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  private asked = false;

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    website: [''],
  });

  constructor() {
    this.api.hallOfFame().subscribe({ next: (entries) => this.entries.set(entries), error: () => undefined });

    // A complete notebook that isn't signed yet: ask, once per visit.
    effect(() => {
      if (this.complete() && !untracked(this.signed) && !this.asked) {
        this.asked = true;
        untracked(() => this.open.set(true));
      }
    });
    effect(() => this.firstField()?.nativeElement.focus());
  }

  protected sign(): void {
    const value = this.form.getRawValue();
    if (!value.firstName.trim() || !value.lastName.trim()) {
      this.error.set('Ton prénom et ton nom, pour le tableau d’honneur.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.joinHallOfFame(value).subscribe({
      next: (entries) => {
        const name = `${value.firstName.trim()} ${value.lastName.trim().charAt(0).toLocaleUpperCase('fr-FR')}.`;
        this.entries.set(entries);
        this.signed.set(name);
        try {
          globalThis.localStorage?.setItem(SIGNED_KEY, name);
        } catch {
          /* private mode: signed for this visit only */
        }
        this.busy.set(false);
        this.open.set(false);
        this.confetti.burst();
      },
      error: () => {
        this.busy.set(false);
        this.error.set("Oups, ça n'a pas marché. Réessaie dans un instant.");
      },
    });
  }

  protected later(): void {
    this.open.set(false);
  }
}
