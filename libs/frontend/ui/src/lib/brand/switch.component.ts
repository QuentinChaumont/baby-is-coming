import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * Labelled on/off switch (e.g. « Afficher aussi les objets pris »). A real
 * `<button role="switch">`, so it is keyboard- and screen-reader-friendly.
 *
 * ```html
 * <lib-switch [(checked)]="showTaken" label="Afficher aussi les objets pris" />
 * ```
 */
@Component({
  selector: 'lib-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" role="switch" [attr.aria-checked]="checked()" (click)="toggle()">
      <span class="switch__track" [class.switch__track--on]="checked()" aria-hidden="true">
        <span class="switch__knob"></span>
      </span>
      <span class="switch__label">{{ label() }}</span>
    </button>
  `,
  styles: `
    button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding: 0;
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--app-color-ink);
      cursor: pointer;
    }
    .switch__track {
      flex: none;
      width: 40px;
      height: 24px;
      border-radius: var(--app-radius-pill);
      background: #b7c2b3;
      display: flex;
      align-items: center;
      padding: 2px;
      box-sizing: border-box;
      transition: background-color 160ms ease-out;
    }
    .switch__track--on {
      background: var(--app-color-sage-strong);
    }
    .switch__knob {
      width: 20px;
      height: 20px;
      border-radius: var(--app-radius-pill);
      background: var(--app-color-surface);
      transition: transform 160ms ease-out;
    }
    .switch__track--on .switch__knob {
      transform: translateX(16px);
    }
  `,
})
export class Switch {
  readonly label = input.required<string>();
  readonly checked = model(false);

  protected toggle(): void {
    this.checked.update((v) => !v);
  }
}
