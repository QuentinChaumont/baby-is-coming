import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Confetti, Doudou, Hochet } from '@org/frontend-ui';
import { CARNET, CarnetProgress } from './carnet';
import { CarnetFame } from './carnet-fame';

/**
 * Kiki's notebook: every secret and treasure on the site, described once
 * found, « ??? » with a hint until then. Progress lives in this browser.
 */
@Component({
  selector: 'app-carnet-page',
  imports: [RouterLink, CarnetFame, Doudou, Hochet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="carnet">
      <h1>Le carnet de Kiki</h1>
      <p class="carnet__hand">
        Tous les secrets de Kiki sont notés ici. Sauras-tu les trouver tous ?
      </p>

      <section class="carnet__progress" aria-label="Progression">
        <p class="carnet__count">
          <strong>{{ progress.count() }} / {{ progress.total }}</strong> secrets
          découverts
        </p>
        <div
          class="carnet__bar"
          role="progressbar"
          [attr.aria-valuenow]="progress.count()"
          aria-valuemin="0"
          [attr.aria-valuemax]="progress.total"
        >
          <span
            [style.width.%]="(progress.count() / progress.total) * 100"
          ></span>
        </div>
        @if (progress.complete()) {
          <p class="carnet__done">Bravo, tu connais Kiki par cœur ! 🦒💛</p>
        } @else {
          <p class="carnet__tip">
            Joue avec Kiki sur <a routerLink="/">l'accueil</a> pour remplir le
            carnet.
          </p>
        }
      </section>

      <ul class="carnet__grid">
        @for (entry of entries; track entry.id) {
          @if (progress.unlocked().has(entry.id)) {
            <li
              class="carnet__entry"
              [class.carnet__entry--treasure]="entry.kind === 'treasure'"
            >
              @if (entry.id === 'doudou') {
                <lib-doudou class="carnet__drawing" />
              } @else if (entry.id === 'hochet') {
                <lib-hochet class="carnet__drawing" />
              } @else {
                <span class="carnet__icon" aria-hidden="true">{{
                  entry.icon
                }}</span>
              }
              <div>
                <h2>{{ entry.title }}</h2>
                <p>{{ entry.text }}</p>
              </div>
            </li>
          } @else {
            <li class="carnet__entry carnet__entry--locked">
              <span class="carnet__icon" aria-hidden="true">?</span>
              <div>
                <h2 aria-label="Secret pas encore découvert">???</h2>
                <p>{{ entry.hint }}</p>
              </div>
            </li>
          }
        }
      </ul>

      <app-carnet-fame [complete]="progress.complete()" />

      <div class="carnet__reset">
        @if (confirming()) {
          <p>Tout oublier ? Les trésors retourneront se cacher.</p>
          <button
            type="button"
            class="app-button app-button--outline"
            (click)="reset()"
          >
            Oui, tout effacer
          </button>
          <button
            type="button"
            class="carnet__link"
            (click)="confirming.set(false)"
          >
            Non, je garde
          </button>
        } @else {
          <button
            type="button"
            class="carnet__link"
            (click)="confirming.set(true)"
          >
            Effacer le carnet et recommencer
          </button>
        }
      </div>
    </main>
  `,
  styles: `
    .carnet {
      padding: 20px 20px 96px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .carnet h1 {
      margin: 0;
      font-size: 2.125rem;
      line-height: 1.05;
    }
    .carnet__hand {
      margin: 0;
      font-family: var(--app-font-hand);
      font-size: 1.375rem;
      line-height: 1.2;
      color: var(--app-color-sage-strong);
    }
    .carnet__progress {
      background: var(--app-color-secondary);
      border-radius: var(--app-radius-lg);
      padding: 16px 18px;
      transform: rotate(-0.6deg);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .carnet__progress p {
      margin: 0;
    }
    .carnet__count {
      font-size: 1rem;
    }
    .carnet__count strong {
      font-family: var(--app-font-display);
      font-size: 1.75rem;
    }
    .carnet__bar {
      height: 14px;
      border: var(--app-border-ink);
      border-radius: 999px;
      background: var(--app-color-background);
      overflow: hidden;
    }
    .carnet__bar span {
      display: block;
      height: 100%;
      background: var(--app-color-giraffe-spot);
      transition: width 600ms var(--app-ease-out);
    }
    .carnet__done {
      font-family: var(--app-font-hand);
      font-weight: 700;
      font-size: 1.5rem;
    }
    .carnet__tip {
      font-size: 0.875rem;
    }
    .carnet__tip a {
      color: var(--app-color-ink);
      font-weight: 800;
    }
    .carnet__grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
      gap: 12px;
    }
    .carnet__entry {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      box-shadow: 3px 3px 0 var(--app-color-ink);
      animation: app-rise var(--app-duration) var(--app-ease-out) both;
    }
    .carnet__entry:nth-child(odd) {
      transform: rotate(-0.4deg);
    }
    .carnet__entry:nth-child(even) {
      transform: rotate(0.4deg);
    }
    .carnet__entry--treasure {
      background: var(--app-color-kraft);
    }
    .carnet__entry--locked {
      background: transparent;
      border-style: dashed;
      box-shadow: none;
      color: var(--app-color-on-surface-variant);
    }
    .carnet__entry h2 {
      margin: 0 0 4px;
      font-size: 1.0625rem;
    }
    .carnet__entry p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.45;
    }
    .carnet__entry--locked p {
      font-style: italic;
    }
    .carnet__icon {
      flex: none;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      font-size: 1.75rem;
      line-height: 1;
    }
    .carnet__entry--locked .carnet__icon {
      border: 2px dashed currentColor;
      border-radius: 50%;
      font: 800 1.25rem/1 var(--app-font-display);
      box-sizing: border-box;
    }
    .carnet__drawing {
      flex: none;
      width: 34px;
      margin: 0 3px;
    }
    .carnet__reset {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
    }
    .carnet__reset p {
      margin: 0;
      width: 100%;
    }
    .carnet__link {
      min-height: 44px;
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 700;
      color: var(--app-color-on-surface-variant);
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
  `,
})
export class CarnetPage {
  protected readonly progress = inject(CarnetProgress);
  private readonly confetti = inject(Confetti);
  protected readonly entries = CARNET;
  protected readonly confirming = signal(false);

  constructor() {
    // A full notebook deserves a little party.
    afterNextRender(() => {
      if (this.progress.complete()) this.confetti.burst();
    });
  }

  protected reset(): void {
    this.progress.reset();
    this.confirming.set(false);
  }
}
