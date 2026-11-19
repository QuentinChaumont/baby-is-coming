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
      <div class="public-header__inner">
        <a class="public-header__brand" routerLink="/">
          <img src="favicon.svg" alt="" width="36" height="36" />
          Kiki
        </a>
        <a class="public-header__kitty" routerLink="/cagnotte">Cagnotte</a>
      </div>
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
      background: var(--app-color-background);
      border-bottom: var(--app-border-ink);
    }
    /* Full width: the brand on the left edge, the kitty on the right. */
    .public-header__inner {
      box-sizing: border-box;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
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
      gap: 8px;
    }
    .public-header__brand img {
      width: 36px;
      height: 36px;
      flex: none;
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
