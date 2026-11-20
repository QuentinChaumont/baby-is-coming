import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let nextId = 0;

/**
 * A baby bottle that fills up with milk as the kitty nears its goal.
 * `ratio` is clamped to 0–1; beyond the goal the bottle overflows with a
 * little drop. Decorative: the amounts are written next to it in text.
 */
@Component({
  selector: 'lib-baby-bottle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 60 124" width="60" height="124" aria-hidden="true" focusable="false">
      <defs>
        <clipPath [attr.id]="clipId">
          <rect x="13.5" y="35.5" width="33" height="81" rx="9" />
        </clipPath>
      </defs>
      <g stroke="#22301F" stroke-width="2.5" stroke-linejoin="round">
        @if (full()) {
          <path class="bottle__drop" d="M30,0 q-5,7 0,10 q5,-3 0,-10 z" fill="#FBF7EE" />
        }
        <path d="M24,24 C24,14 26,8 30,8 C34,8 36,14 36,24 Z" fill="#F3DE9A" />
        <rect x="16" y="22" width="28" height="11" rx="3" fill="#8FA98A" />
        <g [attr.clip-path]="'url(#' + clipId + ')'">
          <rect class="bottle__milk" x="12" y="34" width="36" height="84" fill="#FBF7EE" stroke="none" [style.transform]="'scaleY(' + level() + ')'" />
          <g class="bottle__bubbles" fill="#E6D5B8" stroke="none">
            <circle cx="22" cy="108" r="2" />
            <circle cx="34" cy="112" r="1.6" />
            <circle cx="28" cy="104" r="1.2" />
          </g>
        </g>
        <rect x="12" y="34" width="36" height="84" rx="10" fill="none" />
        <g stroke-width="1.8">
          <path d="M40,56 h6" /><path d="M42,72 h4" /><path d="M40,88 h6" /><path d="M42,104 h4" />
        </g>
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .bottle__milk {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      transition: transform 900ms cubic-bezier(0.23, 1, 0.32, 1);
      animation: bottle-fill 1.2s cubic-bezier(0.23, 1, 0.32, 1) 200ms backwards;
    }
    @keyframes bottle-fill {
      from {
        transform: scaleY(0);
      }
    }
    .bottle__bubbles circle {
      transform-box: fill-box;
      animation: bottle-bubble 2.4s ease-in infinite;
    }
    .bottle__bubbles circle:nth-child(2) {
      animation-delay: 0.8s;
    }
    .bottle__bubbles circle:nth-child(3) {
      animation-delay: 1.6s;
    }
    @keyframes bottle-bubble {
      0% {
        transform: translateY(0);
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      100% {
        transform: translateY(-60px);
        opacity: 0;
      }
    }
    .bottle__drop {
      transform-box: fill-box;
      animation: bottle-drop 1.6s ease-in infinite;
    }
    @keyframes bottle-drop {
      0% {
        transform: translateY(6px);
        opacity: 0;
      }
      40% {
        opacity: 1;
      }
      100% {
        transform: translateY(-6px);
        opacity: 0;
      }
    }
  `,
})
export class BabyBottle {
  /** Share of the goal reached (0–1, more when it's exceeded). */
  readonly ratio = input(0);

  protected readonly clipId = `bottle-${nextId++}`;
  protected readonly level = computed(() => Math.min(1, Math.max(0, this.ratio() || 0)));
  protected readonly full = computed(() => (this.ratio() || 0) >= 1);
}
