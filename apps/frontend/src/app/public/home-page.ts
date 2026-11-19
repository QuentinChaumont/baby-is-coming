import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Public home page — placeholder until DEV step 3.1 builds the real one
 * (« Coucou, c'est Kiki » hero, giraffe band, parents' note, the three ways
 * to take part). The home has its own hero, so it sits outside the public
 * shell's header.
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="home">
      <h1>Coucou, c'est Kiki</h1>
      <p>La liste de naissance seconde main arrive bientôt.</p>
      <nav class="home__nav" aria-label="Accès rapide">
        <a class="app-button app-button--ink" routerLink="/liste">Voir la liste</a>
        <a class="app-button app-button--butter" routerLink="/cagnotte">
          La cagnotte « J'ai la flemme »
        </a>
      </nav>
    </main>
  `,
  styles: `
    .home {
      max-width: 40rem;
      margin: 0 auto;
      padding: 48px 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .home h1 {
      margin: 0;
      font-size: 3rem;
      line-height: 1;
    }
    .home p {
      margin: 0;
    }
    .home__nav {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `,
})
export class HomePage {}
