import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Kiki's doudou: a little sage bunny. Purely the drawing — the hideout
 * and the home decide what tapping it does. The same shapes are drawn in
 * Kiki's arms when she hugs it (`kiki.template.ts`).
 */
@Component({
  selector: 'lib-doudou',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 40 54" width="40" height="54" aria-hidden="true" focusable="false">
      <g stroke="#3F5A3C" stroke-width="2" stroke-linejoin="round">
        <ellipse cx="13" cy="13" rx="4.5" ry="11" fill="#8FA98A" transform="rotate(-14 13 13)" />
        <ellipse cx="13" cy="14" rx="2" ry="7" fill="#F3DE9A" stroke="none" transform="rotate(-14 13 13)" />
        <ellipse cx="27" cy="13" rx="4.5" ry="11" fill="#8FA98A" transform="rotate(14 27 13)" />
        <ellipse cx="27" cy="14" rx="2" ry="7" fill="#F3DE9A" stroke="none" transform="rotate(14 27 13)" />
        <ellipse cx="20" cy="43" rx="11" ry="9.5" fill="#8FA98A" />
        <ellipse cx="20" cy="44" rx="5.5" ry="5" fill="#FBF7EE" stroke="none" />
        <circle cx="20" cy="27" r="11" fill="#8FA98A" />
        <circle cx="16" cy="26" r="1.7" fill="#22301F" stroke="none" />
        <circle cx="24" cy="26" r="1.7" fill="#22301F" stroke="none" />
        <circle cx="20" cy="30" r="1.4" fill="#A4442A" stroke="none" />
        <path d="M17.5,32.5 Q20,34.5 22.5,32.5" fill="none" stroke-width="1.4" />
        <path d="M14,36 L20,39 L26,36 L26,41 L20,39 L14,41 Z" fill="#F3DE9A" stroke-width="1.6" />
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
export class Doudou {}
