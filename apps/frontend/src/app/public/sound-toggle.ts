import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KikiSounds } from '@org/frontend-ui';

/** Turns Kiki's little noises on or off (off by default, remembered). */
@Component({
  selector: 'app-sound-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="sound"
      [attr.aria-pressed]="sounds.enabled()"
      [attr.aria-label]="sounds.enabled() ? 'Couper les sons de Kiki' : 'Activer les sons de Kiki'"
      [attr.title]="sounds.enabled() ? 'Couper les sons' : 'Activer les sons'"
      (click)="sounds.toggle()"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        @if (sounds.enabled()) {
          <path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" />
        } @else {
          <path d="M17 9l5 6M22 9l-5 6" />
        }
      </svg>
    </button>
  `,
  styles: `
    .sound {
      width: 44px;
      height: 44px;
      box-shadow: 2px 2px 0 var(--app-color-ink);
      display: inline-grid;
      place-items: center;
      border: var(--app-border-ink);
      border-radius: 50%;
      background: var(--app-color-background);
      color: var(--app-color-ink);
      cursor: pointer;
      transition: transform var(--app-duration-fast) var(--app-ease-out);
    }
    .sound:active {
      transform: scale(0.92);
    }
    .sound:focus-visible {
      outline: 3px solid var(--app-color-sage-strong);
      outline-offset: 2px;
    }
  `,
})
export class SoundToggle {
  protected readonly sounds = inject(KikiSounds);
}
