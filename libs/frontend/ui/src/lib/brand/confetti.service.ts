import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** Giraffe-spot outlines (viewBox 0 0 40 40), like the band's patches. */
const SPOTS = [
  'M6 9 L27 5 L36 18 L25 33 L8 28 Z',
  'M4 14 L22 4 L36 12 L32 30 L12 35 Z',
  'M9 6 L33 10 L35 28 L18 36 L5 22 Z',
];
const COLORS = ['#C9A86A', '#E6D5B8', '#8FA98A', '#F3DE9A', '#A4442A'];

export interface ConfettiOptions {
  /** Screen point the spots burst from; defaults to the top centre. */
  origin?: { x: number; y: number };
  count?: number;
}

/**
 * A celebratory shower of giraffe spots, for the moments that matter (a
 * gift taken, a kitty pledge). Plain DOM + Web Animations, removed once
 * done; nothing at all when the OS asks for reduced motion.
 */
@Injectable({ providedIn: 'root' })
export class Confetti {
  private readonly document = inject(DOCUMENT);

  burst(options: ConfettiOptions = {}): void {
    const win = this.document.defaultView;
    if (!win || typeof Element.prototype.animate !== 'function') return;
    if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const origin = options.origin ?? { x: win.innerWidth / 2, y: win.innerHeight * 0.3 };
    const count = options.count ?? 48;
    const layer = this.document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    Object.assign(layer.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: '1000',
    });

    const animations: Animation[] = [];
    for (let i = 0; i < count; i++) {
      const size = 12 + Math.random() * 16;
      const piece = this.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      piece.setAttribute('viewBox', '0 0 40 40');
      piece.setAttribute('width', String(size));
      piece.setAttribute('height', String(size));
      piece.style.position = 'absolute';
      piece.style.left = `${origin.x - size / 2}px`;
      piece.style.top = `${origin.y - size / 2}px`;
      const path = this.document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const color = COLORS[i % COLORS.length];
      path.setAttribute('d', SPOTS[i % SPOTS.length]);
      path.setAttribute('fill', color);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '5');
      path.setAttribute('stroke-linejoin', 'round');
      piece.appendChild(path);
      layer.appendChild(piece);

      // Up and out, then gravity takes over.
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const power = 160 + Math.random() * 260;
      const dx = Math.cos(angle) * power;
      const dy = Math.sin(angle) * power;
      const fall = win.innerHeight - origin.y + 80;
      const spin = (Math.random() - 0.5) * 900;
      animations.push(
        piece.animate(
          [
            { transform: 'translate(0, 0) rotate(0deg) scale(0.4)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${spin / 3}deg) scale(1)`, opacity: 1, offset: 0.3 },
            { transform: `translate(${dx * 1.5}px, ${fall}px) rotate(${spin}deg) scale(0.9)`, opacity: 0.9 },
          ],
          {
            duration: 1600 + Math.random() * 900,
            delay: Math.random() * 120,
            easing: 'cubic-bezier(0.25, 0.6, 0.6, 1)',
            fill: 'forwards',
          },
        ),
      );
    }

    this.document.body.appendChild(layer);
    void Promise.all(animations.map((a) => a.finished)).finally(() => layer.remove());
  }
}
