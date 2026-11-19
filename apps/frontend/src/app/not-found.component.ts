import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Catch-all for unknown URLs — Angular otherwise throws
 * "Cannot match any routes" and renders nothing. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="not-found">
      <img class="not-found__kiki" src="kiki.svg" alt="Kiki, bébé girafe" width="270" height="430" />
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">Page introuvable</h1>
      <p class="not-found__text">
        Cette page n'existe pas (ou plus). Kiki l'a peut-être mâchouillée.
      </p>
      <a routerLink="/">Retour à l'accueil</a>
    </main>
  `,
  styles: `
    .not-found {
      max-width: 420px;
      margin: 8vh auto;
      padding: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .not-found__kiki {
      width: 140px;
      height: auto;
      margin: 0 auto;
      transform-origin: 50% 100%;
      animation: kiki-tilt 600ms cubic-bezier(0.23, 1, 0.32, 1) both;
    }
    /* Kiki tilts her head, puzzled — once. */
    @keyframes kiki-tilt {
      0% {
        opacity: 0;
        transform: translateY(12px);
      }
      60% {
        opacity: 1;
        transform: rotate(-5deg);
      }
      100% {
        transform: rotate(0);
      }
    }
    .not-found__code {
      margin: 0;
      font: 700 2.5rem/1 var(--app-font-mono, monospace);
      color: var(--app-color-primary, currentColor);
    }
    .not-found__title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }
    .not-found__text {
      margin: 0 0 8px;
      color: color-mix(in srgb, currentColor 65%, transparent);
    }
  `,
})
export class NotFoundPage {}
