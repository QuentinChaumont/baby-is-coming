import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalPageShell } from './legal-page-shell';

/** Cookie policy: strictly necessary cookies only (no analytics). */
@Component({
  selector: 'lib-cookie-policy',
  imports: [LegalPageShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-legal-page-shell heading="Politique cookies">
      <p class="legal__meta"><em>Dernière mise à jour : 19/11/2026</em></p>

      <h2>Qui sommes-nous</h2>
      <p>
        Ce site est exploité par <strong>Quentin CHAUMONT EI</strong>, 40 rue
        Monsarrat, 33800 Bordeaux, France. Contact :
        chaumont.quentin@gmail.com
      </p>

      <h2>Les cookies utilisés</h2>
      <table>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Usage</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Strictement nécessaires</td>
            <td>Mémoriser ton choix de cookies ; session et sécurité (CSRF) de l'espace parents.</td>
            <td>Session / jusqu'à 12 mois</td>
          </tr>
          <tr>
            <td>Mesure d'audience</td>
            <td>Aucune : ce site ne fait ni statistiques ni publicité.</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>

      <h2>Tes choix</h2>
      <p>
        Les cookies strictement nécessaires ne peuvent pas être refusés. Pour
        toute autre catégorie, tu choisis via le bandeau affiché lors de ta
        première visite. Ton choix est conservé 6 mois, puis nous te le
        redemandons.
      </p>

      <h2>Contact</h2>
      <p>Une question : chaumont.quentin@gmail.com</p>
    </lib-legal-page-shell>
  `,
  styles: `
    .legal__meta {
      margin: 0 0 var(--app-space-4);
      font-size: 0.8125rem;
      color: color-mix(in srgb, var(--app-color-on-surface) 55%, transparent);
    }
    h2 {
      margin: var(--app-space-6) 0 var(--app-space-2);
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: -0.005em;
    }
    h2:first-of-type {
      margin-block-start: var(--app-space-4);
    }
    p {
      margin: 0 0 var(--app-space-2);
      font-size: 0.9375rem;
      line-height: 1.6;
      color: color-mix(in srgb, var(--app-color-on-surface) 88%, transparent);
    }
    strong {
      color: var(--app-color-on-surface);
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: var(--app-space-2) 0 var(--app-space-4);
      font-size: 0.875rem;
    }
    th,
    td {
      border: var(--app-border-hairline);
      padding: var(--app-space-2) var(--app-space-3);
      text-align: start;
    }
    th {
      font-weight: 600;
      background: var(--app-color-surface-variant);
    }
  `,
})
export class CookiePolicy {}
