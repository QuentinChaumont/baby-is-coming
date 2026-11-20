import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Where a {@link PriceTag} sits: over a photo (cream, tilted left) or as a
 * standalone butter label (tilted right). */
export type PriceTagVariant = 'overlay' | 'label';

const EUR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/**
 * Handwritten price label (Caveat) — the « ~120 € » tag of the charter.
 * Always an indicative second-hand price, hence the leading tilde.
 *
 * ```html
 * <lib-price-tag [amount]="120" />
 * <lib-price-tag [amount]="120" variant="label" suffix="d'occasion" />
 * ```
 */
@Component({
  selector: 'lib-price-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"price-tag price-tag--" + variant()',
    '[hidden]': 'amount() === null',
  },
  template: `~{{ formatted() }} €{{ suffix() ? ' ' + suffix() : '' }}`,
  styles: `
    :host([hidden]) {
      display: none;
    }
    :host {
      display: inline-block;
      font-family: var(--app-font-hand);
      font-weight: 600;
      line-height: 1;
      color: var(--app-color-ink);
      white-space: nowrap;
    }
    :host(.price-tag--overlay) {
      background: var(--app-color-background);
      padding: 4px 10px 4px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 1.375rem;
      transform: rotate(-4deg);
    }
    :host(.price-tag--label) {
      background: var(--app-color-secondary);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 1.875rem;
      transform: rotate(3deg);
      box-shadow: var(--app-shadow-soft);
    }
  `,
})
export class PriceTag {
  /** The price, or the low end of a range; `null` hides the tag. */
  readonly amount = input.required<number | null>();
  /** High end of a range: « ~80–120 € ». */
  readonly max = input<number | null>(null);
  readonly variant = input<PriceTagVariant>('overlay');
  readonly suffix = input<string>('');

  protected readonly formatted = computed(() => {
    const amount = this.amount();
    if (amount === null) return '';
    const max = this.max();
    return max !== null && max > amount
      ? `${EUR.format(amount)}–${EUR.format(max)}`
      : EUR.format(amount);
  });
}
