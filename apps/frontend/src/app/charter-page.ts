import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  GiraffeBand,
  InkCard,
  LinkPill,
  PriceTag,
  Stamp,
  Switch,
} from '@org/frontend-ui';

/**
 * Dev-only showcase of the charter « Brocante en savane » (DEV step 0.2):
 * every brand component on one page, to compare against the A mock-ups.
 * Routed at `/charte` in development builds only.
 */
@Component({
  selector: 'app-charter-page',
  imports: [GiraffeBand, InkCard, LinkPill, PriceTag, Stamp, Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="charter">
      <header class="charter__hero">
        <h1>Coucou,<br />c'est Kiki</h1>
        <p class="charter__hand">Une liste de naissance 100 % seconde main</p>
        <div class="charter__labels">
          <span class="charter__label charter__label--butter">Terme prévu : [DATE]</span>
          <span class="charter__label">Fille ou garçon ? Surprise</span>
        </div>
      </header>
      <lib-giraffe-band />

      <section class="charter__section">
        <h2>Carte bordée</h2>
        <lib-ink-card tilted>
          <p class="charter__card-title">Le mot des parents</p>
          <p>On a eu envie de casser un peu les codes…</p>
        </lib-ink-card>
      </section>

      <section class="charter__section">
        <h2>Boutons</h2>
        <button type="button" class="app-button app-button--ink app-button--block">
          Je pars à la chasse !
        </button>
        <button type="button" class="app-button app-button--outline app-button--block">
          J'ai déjà ça chez moi !
        </button>
        <button type="button" class="app-button app-button--butter app-button--block">
          La cagnotte « J'ai la flemme »
        </button>
        <button type="button" class="app-button app-button--ink app-button--block" disabled>
          Désactivé
        </button>
      </section>

      <section class="charter__section">
        <h2>Prix et tampons</h2>
        <div class="charter__photo">
          <span class="charter__photo-label">[PHOTO]</span>
          <lib-price-tag class="charter__photo-price" [amount]="120" />
          <span class="charter__photo-veil"><lib-stamp kind="chasse" /></span>
        </div>
        <lib-price-tag [amount]="120" variant="label" suffix="d'occasion" />
        <lib-stamp kind="don" />
      </section>

      <section class="charter__section">
        <h2>Liens et interrupteur</h2>
        <div class="charter__row">
          <lib-link-pill href="https://www.leboncoin.fr" label="Leboncoin" />
          <lib-link-pill href="https://www.vinted.fr" label="Vinted" />
        </div>
        <lib-switch [(checked)]="showTaken" label="Afficher aussi les objets pris" />
        <p class="charter__note">
          Choisis un état que tu trouves correct. Et si tu ne trouves pas,
          envoie-nous un petit message pour nous prévenir :)
        </p>
      </section>
    </main>
  `,
  styles: `
    .charter {
      max-width: 480px;
      margin: 0 auto;
      padding-bottom: 48px;
    }
    .charter__hero {
      background: var(--app-color-sage);
      padding: 44px 24px 12px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .charter__hero h1 {
      margin: 0;
      font-size: 3.5rem;
      line-height: 0.95;
    }
    .charter__hand {
      margin: 0;
      font-family: var(--app-font-hand);
      font-size: 1.625rem;
      line-height: 1.1;
    }
    .charter__labels {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .charter__label {
      background: var(--app-color-background);
      padding: 6px 12px;
      border-radius: var(--app-radius-sm);
      font-weight: 800;
      font-size: 0.875rem;
      transform: rotate(1.5deg);
    }
    .charter__label--butter {
      background: var(--app-color-secondary);
      transform: rotate(-2deg);
    }
    .charter__section {
      padding: 32px 24px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
    .charter__section h2 {
      margin: 0;
      font-size: 1.75rem;
    }
    .charter__section > .app-button,
    .charter__section > lib-ink-card {
      align-self: stretch;
    }
    .charter__card-title {
      margin: 0 0 8px;
      font-family: var(--app-font-display);
      font-weight: 800;
      font-size: 1.25rem;
    }
    .charter__photo {
      position: relative;
      width: 170px;
      aspect-ratio: 4 / 5;
      border-radius: var(--app-radius-lg);
      background: #c9d8c4;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .charter__photo-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--app-color-sage-strong);
    }
    .charter__photo-price {
      position: absolute;
      top: 10px;
      left: -4px;
    }
    .charter__photo-veil {
      position: absolute;
      inset: 0;
      background: rgba(251, 247, 238, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .charter__row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .charter__note {
      margin: 0;
      font-family: var(--app-font-hand);
      font-size: 1.375rem;
      line-height: 1.2;
      color: var(--app-color-sage-strong);
    }
  `,
})
export class CharterPage {
  protected readonly showTaken = signal(false);
}
