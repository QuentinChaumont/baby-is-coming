import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalPageShell } from './legal-page-shell';

/** Legal notice (« mentions légales »). Hosting details are completed at
 * go-live (DEV step 5.3). */
@Component({
  selector: 'lib-legal-notice',
  imports: [LegalPageShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-legal-page-shell heading="Mentions légales">
      <p class="legal__meta"><em>Dernière mise à jour : 19/11/2026</em></p>

      <h2>Éditeur du site</h2>
      <p>
        Ce site est édité par <strong>Quentin CHAUMONT EI</strong>, entreprise
        individuelle, 40 rue Monsarrat, 33800 Bordeaux, France, SIREN
        839&nbsp;387&nbsp;883 (SIRET 839&nbsp;387&nbsp;883&nbsp;00037), [RCS/RM
        Bordeaux — à confirmer]. TVA intracommunautaire :
        FR11&nbsp;839&nbsp;387&nbsp;883. Contact : chaumont.quentin@gmail.com.
      </p>

      <h2>Directeur de la publication</h2>
      <p>Quentin CHAUMONT.</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>[NOM DE L'HÉBERGEUR]</strong>,
        [ADRESSE], [TÉLÉPHONE / SITE] — à compléter à la mise en ligne.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Sauf mention contraire, les contenus de ce site (textes, images,
        logos, code) appartiennent à leurs auteurs et sont protégés par le
        droit de la propriété intellectuelle. Toute reproduction sans
        autorisation écrite préalable est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la
        <a href="/legal/privacy">politique de confidentialité</a> ; les cookies
        dans la <a href="/legal/cookies">politique cookies</a>.
      </p>

      <h2>Crédits</h2>
      <p>
        Fait avec ❤️ par
        <a
          href="https://www.linkedin.com/in/quentin-chmt/"
          target="_blank"
          rel="noopener"
          >Quentin Chaumont</a
        >.
      </p>
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
    a {
      color: var(--app-color-primary);
    }
    strong {
      color: var(--app-color-on-surface);
      font-weight: 600;
    }
  `,
})
export class LegalNotice {}
