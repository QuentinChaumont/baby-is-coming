import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bordered pill linking out to a second-hand listing (Leboncoin, Vinted…).
 * Always opens in a new tab, with an arrow glyph drawn in SVG.
 *
 * ```html
 * <lib-link-pill href="https://www.leboncoin.fr/…" label="Leboncoin" />
 * ```
 */
@Component({
  selector: 'lib-link-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [href]="href()" target="_blank" rel="noopener noreferrer">
      {{ label() }}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
      <span class="link-pill__sr">(nouvel onglet)</span>
    </a>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      box-sizing: border-box;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-pill);
      padding: 8px 14px;
      font-weight: 800;
      font-size: 0.875rem;
      color: var(--app-color-ink);
      text-decoration: none;
      background: var(--app-color-surface);
    }
    a:hover {
      background: var(--app-color-secondary);
    }
    .link-pill__sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class LinkPill {
  readonly href = input.required<string>();
  readonly label = input.required<string>();
}
