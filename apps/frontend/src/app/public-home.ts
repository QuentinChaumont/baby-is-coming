import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder for the public home page (DEV step 0.1). The real page —
 * "Coucou, c'est Kiki", the parents' note, the three ways to take part —
 * lands in step 3.1 on top of the public shell (step 0.3).
 */
@Component({
  selector: 'app-public-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="public-home">
      <h1>Coucou, c'est Kiki</h1>
      <p>La liste de naissance seconde main arrive bientôt.</p>
    </main>
  `,
  styles: `
    .public-home {
      max-width: 40rem;
      margin: 0 auto;
      padding: 48px 16px;
    }
  `,
})
export class PublicHome {}
