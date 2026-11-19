import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * White card with the charter's 2px ink border, optionally tilted a hair
 * (the « mot des parents » card). Content is projected.
 *
 * ```html
 * <lib-ink-card tilted>…</lib-ink-card>
 * ```
 */
@Component({
  selector: 'lib-ink-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.ink-card--tilted]': 'tilted()' },
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
      padding: 22px 20px;
    }
    :host(.ink-card--tilted) {
      transform: rotate(-0.6deg);
    }
  `,
})
export class InkCard {
  readonly tilted = input(false, {
    transform: (v: boolean | '') => v === '' || v,
  });
}
