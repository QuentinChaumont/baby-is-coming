import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Switch } from '@org/frontend-ui';
import type { ItemSort, PublicItem } from '@org/shared-contracts';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { ItemCard } from './item-card';
import { PublicApi } from './public-api.service';

type ListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; items: PublicItem[] };

const SORTS: { value: ItemSort | undefined; label: string }[] = [
  { value: undefined, label: 'Trier par prix' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
];

/**
 * The gift list (DEV step 3.2): available items by default, a switch to
 * show taken ones too, price sort, and a search over title + description
 * (PRODUCT F2).
 */
@Component({
  selector: 'app-list-page',
  imports: [RouterLink, Switch, ItemCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="list">
      <h1>La liste</h1>
      <label class="list__search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" />
        </svg>
        <span class="list__sr">Rechercher dans la liste</span>
        <input
          type="search"
          placeholder="Rechercher un objet"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </label>
      <div class="list__tools">
        <lib-switch [(checked)]="showTaken" label="Afficher aussi les objets pris" />
        <button type="button" class="list__sort" (click)="nextSort()" [attr.aria-label]="'Tri : ' + sortLabel()">
          {{ sortLabel() }}
        </button>
      </div>

      @switch (state().status) {
        @case ('loading') {
          <div class="list__grid" aria-busy="true" aria-label="Chargement de la liste">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="list__skeleton"></div>
            }
          </div>
        }
        @case ('error') {
          <p class="list__message" role="alert">
            Oups, la liste n'a pas pu se charger. Réessaie dans un instant.
          </p>
        }
        @default {
          @if (items().length) {
            <ul class="list__grid">
              @for (item of items(); track item.id) {
                <li><app-item-card [item]="item" /></li>
              }
            </ul>
          } @else if (query().trim()) {
            <p class="list__message">Rien ne correspond à « {{ query().trim() }} ».</p>
          } @else {
            <p class="list__message">
              Tout a été chassé ! Il reste
              <a routerLink="/cagnotte">la cagnotte</a>, et elle a faim.
            </p>
          }
        }
      }
    </main>
  `,
  styles: `
    .list {
      padding: 20px 20px 32px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .list h1 {
      margin: 0;
      font-size: 2.125rem;
    }
    .list__search {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 48px;
      padding: 0 14px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
    }
    .list__search input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      font: inherit;
      font-size: 1rem;
      color: var(--app-color-ink);
    }
    .list__search input::placeholder {
      color: var(--app-color-on-surface-variant);
    }
    .list__search:focus-within {
      outline: 3px solid var(--app-color-sage-strong);
      outline-offset: 2px;
    }
    .list__sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    .list__tools {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .list__sort {
      min-height: 44px;
      padding: 0 12px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      font: inherit;
      font-weight: 800;
      font-size: 0.8125rem;
      color: var(--app-color-ink);
      cursor: pointer;
    }
    .list__grid {
      list-style: none;
      margin: 6px 0 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px 16px;
    }
    .list__skeleton {
      aspect-ratio: 4 / 5;
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface-variant);
    }
    .list__message {
      margin: 16px 0 0;
      font-family: var(--app-font-hand);
      font-size: 1.5rem;
      line-height: 1.2;
      color: var(--app-color-sage-strong);
    }
  `,
})
export class ListPage {
  private readonly api = inject(PublicApi);

  protected readonly query = signal('');
  protected readonly showTaken = signal(false);
  private readonly sortIndex = signal(0);
  protected readonly sortLabel = computed(() => SORTS[this.sortIndex()].label);

  private readonly request = computed(() => ({
    q: this.query(),
    showTaken: this.showTaken(),
    sort: SORTS[this.sortIndex()].value,
  }));

  protected readonly state = toSignal(
    toObservable(this.request).pipe(
      debounceTime(200),
      switchMap((query) =>
        this.api.items(query).pipe(
          map((items): ListState => ({ status: 'ready', items })),
          catchError(() => of<ListState>({ status: 'error' })),
        ),
      ),
      startWith<ListState>({ status: 'loading' }),
    ),
    { requireSync: true },
  );

  protected readonly items = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.items : [];
  });

  protected nextSort(): void {
    this.sortIndex.update((i) => (i + 1) % SORTS.length);
  }
}
