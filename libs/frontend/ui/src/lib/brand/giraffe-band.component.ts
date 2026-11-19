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
        <!-- One 390 × 96 tile of spots, repeated across any width at a fixed
             size (never stretched). -->
        <pattern [attr.id]="patternId" width="390" height="96" patternUnits="userSpaceOnUse">
          <rect width="390" height="96" class="giraffe-band__kraft" />
          <g class="giraffe-band__spots">
            <path d="M0 8 L34 4 L46 28 L28 46 L0 40 Z" />
            <path d="M58 6 L104 10 L110 38 L80 52 L54 34 Z" />
            <path d="M122 4 L160 2 L170 30 L150 50 L118 36 Z" />
            <path d="M184 8 L226 6 L236 36 L206 54 L180 38 Z" />
            <path d="M250 4 L292 8 L298 34 L268 50 L244 30 Z" />
            <path d="M312 6 L356 4 L366 32 L338 52 L306 36 Z" />
            <path d="M376 8 L390 6 L390 44 L372 40 Z" />
            <path d="M14 60 L52 58 L60 84 L36 96 L8 88 Z" />
            <path d="M78 64 L120 62 L132 90 L96 96 L70 84 Z" />
            <path d="M146 62 L190 66 L196 92 L160 96 L140 84 Z" />
            <path d="M214 66 L254 60 L264 88 L232 96 L208 86 Z" />
            <path d="M282 62 L322 64 L330 90 L296 96 L276 82 Z" />
            <path d="M346 60 L386 62 L390 90 L356 96 L340 82 Z" />
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
    .giraffe-band__spots {
      fill: var(--app-color-giraffe-spot);
    }
  `,
})
export class GiraffeBand {
  /** Unique per instance, so several bands can share a page. */
  protected readonly patternId = `giraffe-spots-${nextId++}`;
}
