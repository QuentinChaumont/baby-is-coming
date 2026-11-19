import { ChangeDetectionStrategy, Component } from '@angular/core';

let nextId = 0;

/**
 * Kraft band with crisp giraffe-spot shapes — the charter's signature
 * decoration. Purely decorative: hidden from assistive tech. Runs the
 * full width of its container, the spots repeated at a fixed size.
 */
@Component({
  selector: 'lib-giraffe-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg width="100%" height="96" aria-hidden="true" focusable="false">
      <defs>
        <!-- A seamless 520 × 96 tile: no spot crosses its edges, so it repeats
             across any width at a fixed size with no visible join. -->
        <pattern [attr.id]="patternId" width="520" height="96" patternUnits="userSpaceOnUse">
          <rect width="520" height="96" class="giraffe-band__kraft" />
          <g class="giraffe-band__spots">
            <path d="M8 12 L46 7 L58 30 L38 49 L11 41 Z" />
            <path d="M78 16 L112 9 L125 33 L102 51 L75 39 Z" />
            <path d="M150 6 L194 11 L199 35 L174 47 L146 29 Z" />
            <path d="M226 14 L258 7 L276 27 L255 49 L223 41 Z" />
            <path d="M300 9 L340 14 L347 39 L319 50 L296 31 Z" />
            <path d="M372 5 L408 10 L420 31 L396 47 L368 27 Z" />
            <path d="M448 13 L488 7 L505 30 L482 49 L450 40 Z" />
            <path d="M8 66 L36 61 L44 84 L24 93 L6 85 Z" />
            <path d="M66 61 L104 57 L113 83 L84 93 L60 83 Z" />
            <path d="M136 63 L174 66 L182 88 L146 94 L131 80 Z" />
            <path d="M206 58 L240 63 L250 86 L222 94 L200 80 Z" />
            <path d="M276 65 L316 59 L326 84 L292 94 L270 83 Z" />
            <path d="M350 61 L386 66 L394 89 L360 94 L344 80 Z" />
            <path d="M418 63 L458 58 L468 84 L432 94 L412 81 Z" />
            <path d="M484 66 L504 62 L508 84 L492 93 L480 82 Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="96" [attr.fill]="'url(#' + patternId + ')'" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: 96px;
    }
    .giraffe-band__kraft {
      fill: var(--app-color-kraft);
    }
    /* A same-colour round-joined stroke softens the corners, like real
       giraffe patches. */
    .giraffe-band__spots {
      fill: var(--app-color-giraffe-spot);
      stroke: var(--app-color-giraffe-spot);
      stroke-width: 6;
      stroke-linejoin: round;
    }
  `,
})
export class GiraffeBand {
  /** Unique per instance, so several bands can share a page. */
  protected readonly patternId = `giraffe-spots-${nextId++}`;
}
