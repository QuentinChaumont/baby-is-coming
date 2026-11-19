import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { AdminContribution, AdminItem, AdminParticipation } from '@org/shared-contracts';
import { catchError, forkJoin, map, of, startWith } from 'rxjs';
import { AdminApi } from './admin-api.service';
import { KIND_LABEL, euros, guestName, when } from './admin-format';

const LAST_VISIT_KEY = 'kiki.admin.lastVisit';

/** Reads the previous visit, then stamps this one (per browser). */
function takeLastVisit(): string | null {
  try {
    const previous = globalThis.localStorage?.getItem(LAST_VISIT_KEY) ?? null;
    globalThis.localStorage?.setItem(LAST_VISIT_KEY, new Date().toISOString());
    return previous;
  } catch {
    return null;
  }
}

interface Data {
  items: AdminItem[];
  participations: AdminParticipation[];
  contributions: AdminContribution[];
}
type State = { status: 'loading' } | { status: 'error' } | ({ status: 'ready' } & Data);

interface NewsLine {
  at: string;
  text: string;
}

/**
 * Back-office home (DEV step 4.1): items by status, kitty promised /
 * received, what is left to receive or thank, and what is new since the
 * last visit (PRODUCT D10 — no notification emails).
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash" data-testid="dashboard-home">
      <h1>Tableau de bord</h1>

      @switch (state().status) {
        @case ('loading') {
          <p aria-busy="true">Chargement…</p>
        }
        @case ('error') {
          <p class="dash__error" role="alert">Le tableau de bord n'a pas pu se charger. Réessaie dans un instant.</p>
        }
        @default {
          <section class="dash__news" aria-labelledby="news-title">
            <h2 id="news-title">Nouveautés depuis ta dernière visite</h2>
            @if (news().length) {
              <ul>
                @for (line of news(); track line.at + line.text) {
                  <li><span class="dash__when">{{ line.at }}</span> {{ line.text }}</li>
                }
              </ul>
            } @else {
              <p>Rien de neuf. Partage la liste pour que ça bouge !</p>
            }
          </section>

          <div class="dash__grid">
            <a class="dash__card" routerLink="objets">
              <span class="dash__figure">{{ counts().published }}</span>
              <span class="dash__label">objets publiés</span>
              <span class="dash__detail">{{ counts().taken }} pris · {{ counts().draft }} brouillons · {{ counts().archived }} archivés</span>
            </a>
            <a class="dash__card dash__card--butter" routerLink="cagnotte">
              <span class="dash__figure">{{ kitty().promised }}</span>
              <span class="dash__label">promis à la cagnotte</span>
              <span class="dash__detail">{{ kitty().received }} reçus</span>
            </a>
            <a class="dash__card" routerLink="participations">
              <span class="dash__figure">{{ todo().toReceive }}</span>
              <span class="dash__label">cadeaux pas encore reçus</span>
            </a>
            <a class="dash__card" routerLink="participations">
              <span class="dash__figure">{{ todo().toThank }}</span>
              <span class="dash__label">mercis à envoyer</span>
              <span class="dash__detail">cadeaux et cagnotte</span>
            </a>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .dash {
      max-width: 60rem;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .dash h1 {
      margin: 0;
      font-size: 2rem;
    }
    .dash h2 {
      margin: 0 0 8px;
      font-size: 1.25rem;
    }
    .dash__news {
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
      padding: 16px 20px;
    }
    .dash__news ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dash__news p {
      margin: 0;
    }
    .dash__when {
      font-family: var(--app-font-mono);
      font-size: 0.8125rem;
      color: var(--app-color-on-surface-variant);
      margin-right: 6px;
    }
    .dash__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 12px;
    }
    .dash__card {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 16px;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      color: var(--app-color-ink);
      text-decoration: none;
    }
    .dash__card--butter {
      background: var(--app-color-secondary);
    }
    .dash__figure {
      font-family: var(--app-font-display);
      font-weight: 800;
      font-size: 2rem;
      line-height: 1.1;
    }
    .dash__label {
      font-weight: 800;
    }
    .dash__detail {
      font-size: 0.875rem;
      color: var(--app-color-on-surface-variant);
    }
    .dash__error {
      color: var(--app-color-error);
      font-weight: 800;
    }
  `,
})
export class DashboardPage {
  private readonly api = inject(AdminApi);
  private readonly lastVisit = takeLastVisit();

  protected readonly state = toSignal(
    forkJoin({
      items: this.api.items(),
      participations: this.api.participations(),
      contributions: this.api.contributions(),
    }).pipe(
      map((data): State => ({ status: 'ready', ...data })),
      catchError(() => of<State>({ status: 'error' })),
      startWith<State>({ status: 'loading' }),
    ),
    { requireSync: true },
  );

  private readonly data = computed<Data>(() => {
    const s = this.state();
    return s.status === 'ready' ? s : { items: [], participations: [], contributions: [] };
  });

  protected readonly counts = computed(() => {
    const items = this.data().items;
    const published = items.filter((i) => i.publication === 'published');
    return {
      published: published.length,
      taken: published.filter((i) => i.availability === 'taken').length,
      draft: items.filter((i) => i.publication === 'draft').length,
      archived: items.filter((i) => i.publication === 'archived').length,
    };
  });

  protected readonly kitty = computed(() => {
    const c = this.data().contributions;
    return {
      promised: euros(c.reduce((s, x) => s + x.amount, 0)),
      received: euros(c.filter((x) => x.received).reduce((s, x) => s + x.amount, 0)),
    };
  });

  protected readonly todo = computed(() => {
    const { participations, contributions } = this.data();
    const guests = participations.filter((p) => p.kind !== 'parents');
    return {
      toReceive: participations.filter((p) => !p.received).length,
      toThank: guests.filter((p) => !p.thanked).length + contributions.filter((c) => !c.thanked).length,
    };
  });

  protected readonly news = computed<NewsLine[]>(() => {
    const since = this.lastVisit;
    const { participations, contributions } = this.data();
    const isNew = (iso: string) => !since || iso > since;
    const lines = [
      ...participations
        .filter((p) => isNew(p.createdAt) && !p.enteredByParents)
        .map((p) => ({
          iso: p.createdAt,
          text: `${guestName(p)} a pris « ${p.itemTitle} » (${KIND_LABEL[p.kind].toLowerCase()})${p.message ? ' et a laissé un petit mot' : ''}.`,
        })),
      ...contributions
        .filter((c) => isNew(c.createdAt))
        .map((c) => ({
          iso: c.createdAt,
          text: `${c.firstName ?? 'Un invité'} ${c.lastName ?? ''} a promis ${euros(c.amount)} à la cagnotte.`.replace(/\s+/g, ' '),
        })),
    ];
    return lines.sort((a, b) => b.iso.localeCompare(a.iso)).map((l) => ({ at: when(l.iso), text: l.text }));
  });
}
