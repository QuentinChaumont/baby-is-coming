import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalPageShell } from './legal-page-shell';

/** Privacy notice of the Kiki birth list (DEV step 5.1, PRODUCT §6.6). */
@Component({
  selector: 'lib-privacy-policy',
  imports: [LegalPageShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-legal-page-shell heading="Politique de confidentialité">
      <p class="legal__meta"><em>Dernière mise à jour : 19/11/2026</em></p>

      <h2>Responsable du traitement</h2>
      <p>
        <strong>Quentin Chaumont</strong>, particulier, pour une liste de
        naissance familiale et non commerciale. Contact :
        chaumont.quentin@gmail.com.
      </p>

      <h2>Ce que nous collectons, et pourquoi</h2>
      <ul>
        <li>
          <strong>Quand tu prends un cadeau ou participes à la cagnotte</strong> :
          prénom, nom, ton choix d'afficher ou non ton nom, ton petit mot
          facultatif et, pour la cagnotte, le montant promis. Objectif :
          organiser la liste et permettre aux parents de te remercier. Base
          légale : intérêt légitime. Aucun e-mail ni téléphone n'est demandé.
        </li>
        <li>
          <strong>Comptes des parents</strong> (e-mail, nom) — pour accéder à
          l'espace parents. Base légale : exécution du service.
        </li>
        <li>
          <strong>Journaux techniques</strong> (adresse IP, navigateur,
          identifiants de requête) — pour la sécurité. Base légale : intérêt
          légitime.
        </li>
      </ul>

      <h2>Ce que voient les autres invités</h2>
      <p>
        Sur la liste, un cadeau pris affiche « Prénom N. » (par exemple
        « Paul M. »), sauf si tu as coché « Masquer mon nom » : il affiche
        alors « quelqu'un de discret ». Ton petit mot et le montant de ta
        participation ne sont jamais publics : seuls les parents les voient.
        Le site n'est pas référencé par les moteurs de recherche, mais toute
        personne qui a le lien peut le consulter.
      </p>

      <h2>Durée de conservation</h2>
      <ul>
        <li>
          <strong>Données des invités</strong> — effacées automatiquement
          6 mois après la date prévue de l'accouchement (ou à une date choisie
          par les parents) : noms et petits mots sont supprimés, seuls les
          objets et les totaux restent.
        </li>
        <li><strong>Journaux techniques</strong> — 6 mois.</li>
              </ul>

      <h2>Tes droits</h2>
      <p>
        Accès, rectification, effacement, limitation, opposition, et droit
        d'introduire une réclamation auprès de la
        <a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>.
        Le plus simple : écris aux parents, ou à chaumont.quentin@gmail.com, et
        ta participation sera modifiée ou supprimée.
      </p>

      <h2>Transferts hors UE</h2>
      <p>Les données sont hébergées par OVHcloud dans un centre de données situé en France. Aucune donnée n'est transférée hors de l'Union européenne.</p>

      <h2>Décision automatisée</h2>
      <p>Aucune décision automatisée ni aucun profilage.</p>

      <h2>Sous-traitants</h2>
      <p>Hébergement : OVH SAS (OVHcloud), 2 rue Kellermann, 59100 Roubaix, France — centre de données en France.</p>
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
    p,
    li {
      margin: 0 0 var(--app-space-2);
      font-size: 0.9375rem;
      line-height: 1.6;
      color: color-mix(in srgb, var(--app-color-on-surface) 88%, transparent);
    }
    ul {
      margin: 0 0 var(--app-space-2);
      padding-inline-start: 1.25em;
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
export class PrivacyPolicy {}
