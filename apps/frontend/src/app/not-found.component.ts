import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Kiki } from '@org/frontend-ui';

/** Catch-all for unknown URLs — Angular otherwise throws
 * "Cannot match any routes" and renders nothing. Kiki plays hide-and-seek
 * behind a tree far too thin for her. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Kiki],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="not-found">
      <div class="not-found__scene" aria-hidden="true">
        <lib-kiki class="not-found__kiki" [interactive]="false" />
        <svg
          class="not-found__tree"
          viewBox="0 0 120 260"
          width="120"
          height="260"
          focusable="false"
        >
          <g
            stroke="#3F5A3C"
            stroke-width="3"
            stroke-linejoin="round"
            stroke-linecap="round"
          >
            <path d="M56,258 L57,96 Q58,86 60,96 L62,258 Z" fill="#8B6B43" />
            <path d="M59,150 L76,128" fill="none" />
            <path d="M76,128 q10,-10 16,-2 q-4,10 -16,2 z" fill="#8FA98A" />
            <path d="M58,120 L44,102" fill="none" />
            <path d="M44,102 q-12,-8 -16,2 q8,8 16,-2 z" fill="#8FA98A" />
            <path
              d="M60,96 C30,96 24,62 44,52 C42,28 78,24 82,46 C102,50 100,90 60,96 Z"
              fill="#8FA98A"
            />
          </g>
        </svg>
        <span class="not-found__ground"></span>
      </div>
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">Page introuvable</h1>
      <p class="not-found__text">
        Chut, Kiki joue à cache-cache… pas très discrètement. Cette page, en
        revanche, s'est vraiment bien cachée : elle n'existe pas (ou plus).
      </p>
      <a routerLink="/">Retour à l'accueil</a>
    </main>
  `,
  styles: `
    .not-found {
      max-width: 420px;
      margin: 6vh auto;
      padding: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .not-found__scene {
      position: relative;
      width: 220px;
      height: 230px;
      margin: 0 auto 8px;
    }
    /* Kiki stands behind the trunk and leans out, one side then the
       other, to check whether anyone is looking. */
    .not-found__kiki {
      position: absolute;
      left: 50%;
      bottom: 6px;
      width: 120px;
      margin-left: -60px;
      transform-origin: 50% 100%;
      animation: kiki-peek 4.8s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
    }
    @keyframes kiki-peek {
      0%,
      100% {
        transform: translateX(0) rotate(0);
      }
      20%,
      38% {
        transform: translateX(-34px) rotate(-8deg);
      }
      50% {
        transform: translateX(0) rotate(0);
      }
      70%,
      88% {
        transform: translateX(34px) rotate(8deg);
      }
    }
    .not-found__tree {
      position: absolute;
      left: 50%;
      bottom: 0;
      width: 100px;
      height: auto;
      margin-left: -50px;
    }
    .not-found__ground {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 3px;
      border-radius: 2px;
      background: var(--app-color-sage-strong);
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
