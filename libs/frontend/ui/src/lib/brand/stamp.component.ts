import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** How the gift was taken: hunted second-hand, or given from home. */
export type StampKind = 'chasse' | 'don';

const LABEL: Record<StampKind, string> = {
  chasse: 'Chassé !',
  don: 'Adopté !',
};

/**
 * Terracotta ink stamp laid over a taken gift: « Chassé ! » (hunted) or
 * « Adopté ! » (given). Decorative over the photo, but it carries the
 * gift's status, so it stays readable text (not `aria-hidden`).
 *
 * ```html
 * <lib-stamp kind="chasse" />
 * ```
 */
@Component({
  selector: 'lib-stamp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ label() }}`,
  styles: `
    :host {
      display: inline-block;
      border: 3px solid var(--app-color-stamp);
      color: var(--app-color-stamp);
      font-family: var(--app-font-display);
      font-weight: 800;
      font-size: 1.375rem;
      line-height: 1.2;
      padding: 4px 12px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      transform: rotate(-12deg);
      white-space: nowrap;
    }
  `,
})
export class Stamp {
  readonly kind = input.required<StampKind>();

  protected readonly label = computed(() => LABEL[this.kind()]);
}
