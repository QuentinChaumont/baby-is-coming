import { ChangeDetectionStrategy, Component } from '@angular/core';

let nextId = 0;

/**
 * Kraft band with crisp giraffe-spot shapes — the charter's signature
 * decoration. Purely decorative: hidden from assistive tech. Runs the
 * full width of its container, the spots repeated at a fixed size; they
 * drift by slowly while hovered.
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
            <path d="M12 15 L43 11 L53 30 L37 45 L15 39 Z" />
            <path d="M84 20 L108 15 L117 32 L101 44 L82 36 Z" />
            <path d="M150 6 L194 11 L199 35 L174 47 L146 29 Z" />
            <path d="M227 15 L258 8 L275 27 L255 48 L224 40 Z" />
            <path d="M304 13 L336 17 L341 37 L319 45 L301 30 Z" />
            <path d="M372 5 L408 10 L420 31 L396 47 L368 27 Z" />
            <path d="M450 14 L487 9 L503 30 L481 47 L452 39 Z" />
            <path d="M11 68 L34 64 L40 83 L24 90 L9 84 Z" />
            <path d="M72 65 L98 63 L105 81 L84 88 L68 81 Z" />
            <path d="M136 63 L174 66 L182 88 L146 94 L131 80 Z" />
            <path d="M207 59 L239 64 L249 86 L222 93 L201 80 Z" />
            <path d="M280 68 L312 63 L319 82 L293 90 L276 82 Z" />
            <path d="M350 61 L386 66 L394 89 L360 94 L344 80 Z" />
            <path d="M421 65 L455 61 L463 83 L433 91 L416 80 Z" />
            <path d="M485 68 L502 64 L506 83 L492 91 L482 81 Z" />
          </g>
        </pattern>
      </defs>
      <!-- Wider than the band, so it can drift one tile on hover. -->
      <g class="giraffe-band__fill">
        <rect x="-520" width="300%" height="96" [attr.fill]="'url(#' + patternId + ')'" />
      </g>
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
    /* On hover the spots drift by, like a giraffe ambling past. One full
       tile per loop, so the motion never jumps; the animation is always
       there but paused, so leaving the band stops it where it is (no snap
       back to the start) and hovering again resumes from there. */
    .giraffe-band__fill {
      animation: giraffe-band-amble 9s linear infinite paused;
    }
    :host(:hover) .giraffe-band__fill {
      animation-play-state: running;
    }
    @keyframes giraffe-band-amble {
      to {
        transform: translateX(520px);
      }
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
