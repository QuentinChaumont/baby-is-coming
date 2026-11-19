import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

/**
 * Frame of the public pages other than the home (list, item, kitty):
 * a slim cream header with the « Kiki » wordmark back home and the butter
 * « Cagnotte » shortcut. The legal footer is global (`app.html`).
 */
@Component({
  selector: 'app-public-shell',
  imports: [RouterLink, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="public-header">
      <a class="public-header__brand" routerLink="/">Kiki</a>
      <a class="public-header__kitty" routerLink="/cagnotte">Cagnotte</a>
    </header>
    <div class="public-body">
      <router-outlet />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
    }
    .public-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 20px;
      background: var(--app-color-background);
      border-bottom: var(--app-border-ink);
    }
    .public-header__brand {
      font-family: var(--app-font-display);
      font-weight: 800;
      font-size: 1.375rem;
      color: var(--app-color-ink);
      text-decoration: none;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
    }
    .public-header__kitty {
      font-weight: 800;
      font-size: 0.875rem;
      color: var(--app-color-on-secondary);
      background: var(--app-color-secondary);
      padding: 0 14px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      border-radius: var(--app-radius-md);
      text-decoration: none;
    }
    .public-body {
      width: 100%;
      max-width: 40rem;
      margin: 0 auto;
      box-sizing: border-box;
    }
  `,
})
export class PublicShell {}
