import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Empty public page (DEV step 0.3) — its heading comes from the route's
 * `data.heading`. Replaced page by page in phase 3 (list 3.2, item 3.3,
 * kitty 3.4).
 */
@Component({
  selector: 'app-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="placeholder">
      <h1>{{ heading }}</h1>
      <p>Bientôt ici.</p>
    </main>
  `,
  styles: `
    .placeholder {
      padding: 24px 20px;
    }
    .placeholder h1 {
      margin: 0 0 8px;
      font-size: 2.125rem;
    }
    .placeholder p {
      margin: 0;
    }
  `,
})
export class PlaceholderPage {
  protected readonly heading: string =
    inject(ActivatedRoute).snapshot.data['heading'] ?? '';
}
