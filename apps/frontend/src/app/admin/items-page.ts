import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminItem, ItemPublication } from '@org/shared-contracts';
import { AdminApi } from './admin-api.service';
import { euros } from './admin-format';

const FILTERS: { value: ItemPublication | null; label: string }[] = [
  { value: null, label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'archived', label: 'Archivés' },
];

export const PUBLICATION_LABEL: Record<ItemPublication, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
};

/**
 * Items in the back-office (DEV step 4.2): every item in the parents'
 * order, filters by publication, drag & drop (or ↑ ↓ buttons, for the
 * keyboard) to reorder.
 */
@Component({
  selector: 'app-items-page',
  imports: [RouterLink, CdkDropList, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="items">
      <header class="items__head">
        <h1>Objets</h1>
        <a class="app-button app-button--ink" routerLink="nouveau">Ajouter un objet</a>
      </header>

      <div class="items__filters" role="group" aria-label="Filtrer par statut">
        @for (f of filters; track f.label) {
          <button type="button" [attr.aria-pressed]="filter() === f.value" (click)="filter.set(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (error(); as message) {
        <p class="items__error" role="alert">{{ message }}</p>
      }

      @if (loading()) {
        <p aria-busy="true">Chargement…</p>
      } @else if (!visible().length) {
        <p>Aucun objet ici pour l'instant.</p>
      } @else {
        @if (filter() !== null) {
          <p class="items__hint">Affiche « Tous » pour changer l'ordre.</p>
        }
        <ol class="items__list" cdkDropList [cdkDropListDisabled]="filter() !== null" (cdkDropListDropped)="drop($event)">
          @for (item of visible(); track item.id; let i = $index; let last = $last) {
            <li class="items__row" cdkDrag>
              @if (filter() === null) {
                <span class="items__grip" cdkDragHandle aria-hidden="true">⋮⋮</span>
              }
              <span class="items__thumb">
                @if (item.photos[0]; as p) {
                  <img [src]="p.thumbUrl" alt="" />
                }
              </span>
              <a class="items__title" [routerLink]="[item.id]">{{ item.title }}</a>
              <span class="items__price">{{ euros(item.price) }}</span>
              <span class="items__badge" [attr.data-status]="item.publication">{{ publicationLabel[item.publication] }}</span>
              <span class="items__avail">
                {{ item.availability === 'taken' ? 'Pris' : item.quantity > 1 ? item.remaining + '/' + item.quantity + ' dispo' : 'Disponible' }}
              </span>
              @if (filter() === null) {
                <span class="items__move">
                  <button type="button" [disabled]="i === 0" (click)="move(i, -1)" [attr.aria-label]="'Monter ' + item.title">↑</button>
                  <button type="button" [disabled]="last" (click)="move(i, 1)" [attr.aria-label]="'Descendre ' + item.title">↓</button>
                </span>
              }
            </li>
          }
        </ol>
      }
    </div>
  `,
  styles: `
    .items {
      max-width: 60rem;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .items__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .items__head h1 {
      margin: 0;
      font-size: 2rem;
    }
    .items__filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .items__filters button {
      min-height: 40px;
      padding: 0 14px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-pill);
      background: var(--app-color-surface);
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    .items__filters button[aria-pressed='true'] {
      background: var(--app-color-ink);
      color: var(--app-color-on-primary);
    }
    .items__hint {
      margin: 0;
      font-size: 0.875rem;
      color: var(--app-color-on-surface-variant);
    }
    .items__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .items__row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
    }
    .items__grip {
      cursor: grab;
      font-weight: 800;
      color: var(--app-color-on-surface-variant);
    }
    .items__thumb {
      width: 48px;
      height: 60px;
      border-radius: 6px;
      background: var(--app-color-kraft);
      overflow: hidden;
      flex: none;
    }
    .items__thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .items__title {
      flex: 1 1 10rem;
      font-weight: 800;
      color: var(--app-color-ink);
    }
    .items__price {
      font-variant-numeric: tabular-nums;
    }
    .items__badge {
      padding: 2px 8px;
      border-radius: var(--app-radius-sm);
      background: var(--app-color-surface-variant);
      font-size: 0.8125rem;
      font-weight: 800;
    }
    .items__badge[data-status='published'] {
      background: var(--app-color-sage);
    }
    .items__badge[data-status='archived'] {
      background: var(--app-color-kraft);
    }
    .items__avail {
      font-size: 0.875rem;
      color: var(--app-color-on-surface-variant);
    }
    .items__move {
      display: flex;
      gap: 4px;
    }
    .items__move button {
      width: 36px;
      height: 36px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      cursor: pointer;
    }
    .items__move button:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .items__error {
      color: var(--app-color-error);
      font-weight: 800;
    }
    .cdk-drag-preview {
      box-shadow: var(--app-shadow-soft);
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
  `,
})
export class ItemsPage {
  private readonly api = inject(AdminApi);
  protected readonly filters = FILTERS;
  protected readonly publicationLabel = PUBLICATION_LABEL;
  protected readonly euros = euros;

  protected readonly items = signal<AdminItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<ItemPublication | null>(null);

  protected readonly visible = computed(() => {
    const f = this.filter();
    return f ? this.items().filter((i) => i.publication === f) : this.items();
  });

  constructor() {
    this.api.items().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Les objets n'ont pas pu se charger.");
      },
    });
  }

  protected drop(event: CdkDragDrop<AdminItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const next = [...this.items()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.save(next);
  }

  protected move(index: number, delta: number): void {
    const next = [...this.items()];
    moveItemInArray(next, index, index + delta);
    this.save(next);
  }

  private save(next: AdminItem[]): void {
    const previous = this.items();
    this.items.set(next);
    this.error.set(null);
    this.api.reorderItems(next.map((i) => i.id)).subscribe({
      next: (items) => this.items.set(items),
      error: () => {
        this.items.set(previous);
        this.error.set("Le nouvel ordre n'a pas pu être enregistré.");
      },
    });
  }
}
