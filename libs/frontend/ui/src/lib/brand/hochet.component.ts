import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Kiki's rattle: a butter ball on a sage handle. Purely the drawing; the
 * same shapes are drawn in her mouth when she shakes it (`kiki.template.ts`).
 */
@Component({
  selector: 'lib-hochet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 40 54" width="40" height="54" aria-hidden="true" focusable="false">
      <g stroke="#3F5A3C" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
        <path d="M20,26 L20,46" stroke-width="6" />
        <path d="M20,26 L20,46" stroke="#8FA98A" stroke-width="2.6" />
        <circle cx="20" cy="47" r="5" fill="#FBF7EE" />
        <circle cx="20" cy="15" r="13" fill="#F3DE9A" />
        <path d="M9,10 Q20,16 31,10 M8,18 Q20,24 32,18" fill="none" stroke="#C9A86A" stroke-width="2.6" />
        <circle cx="15" cy="10" r="2" fill="#FBF7EE" stroke="none" />
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
  `,
})
export class Hochet {}
