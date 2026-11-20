import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { HallOfFameEntry } from '@org/shared-contracts';
import { AdminApi } from './admin-api.service';
import { when } from './admin-format';

/**
 * Moderation of the notebook's hall of fame: every name, with a confirmed
 * « Retirer » for jokes, typos or strangers.
 */
@Component({
  selector: 'app-hall-of-fame-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="fame" aria-labelledby="fame-admin-title">
      <h2 id="fame-admin-title">Tableau d'honneur du carnet</h2>
      <p class="fame__hint">Les invités qui ont trouvé tous les secrets de Kiki (prénom et initiale seulement).</p>
      @if (error(); as message) {
        <p class="fame__error" role="alert">{{ message }}</p>
      }
      @if (loading()) {
        <p aria-busy="true">Chargement…</p>
      } @else if (!entries().length) {
        <p>Personne pour l'instant.</p>
      } @else {
        <ul class="fame__list">
          @for (entry of entries(); track entry.id) {
            <li>
              <span class="fame__name">{{ entry.name }}</span>
              <span class="fame__date">{{ when(entry.createdAt) }}</span>
              @if (confirming() === entry.id) {
                <span class="fame__confirm">
                  Retirer {{ entry.name }} ?
                  <button type="button" class="fame__link fame__danger" (click)="remove(entry)">Oui, retirer</button>
                  <button type="button" class="fame__link" (click)="confirming.set(null)">Non</button>
                </span>
              } @else {
                <button type="button" class="fame__link" (click)="confirming.set(entry.id)" [attr.aria-label]="'Retirer ' + entry.name">
                  Retirer
                </button>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .fame {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .fame h2 {
      margin: 0;
      font-size: 1.375rem;
    }
    .fame__hint {
      margin: 0;
      font-size: 0.875rem;
      color: var(--app-color-on-surface-variant);
    }
    .fame__error {
      margin: 0;
      color: var(--app-color-error);
      font-weight: 800;
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
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border: var(--app-border-hairline);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
    }
    .fame__name {
      font-weight: 800;
    }
    .fame__date {
      font-size: 0.8125rem;
      color: var(--app-color-on-surface-variant);
    }
    .fame__confirm {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }
    .fame__link {
      margin-left: auto;
      min-height: 36px;
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 800;
      color: var(--app-color-ink);
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
    .fame__confirm .fame__link {
      margin-left: 0;
    }
    .fame__danger {
      color: var(--app-color-error);
    }
  `,
})
export class HallOfFameAdmin {
  private readonly api = inject(AdminApi);
  protected readonly when = when;
  protected readonly entries = signal<HallOfFameEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly confirming = signal<string | null>(null);

  constructor() {
    this.api.hallOfFame().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Le tableau d'honneur n'a pas pu se charger.");
      },
    });
  }

  protected remove(entry: HallOfFameEntry): void {
    this.confirming.set(null);
    this.error.set(null);
    this.api.removeFromHallOfFame(entry.id).subscribe({
      next: () => this.entries.update((list) => list.filter((e) => e.id !== entry.id)),
      error: () => this.error.set(`${entry.name} n'a pas pu être retiré.`),
    });
  }
}
