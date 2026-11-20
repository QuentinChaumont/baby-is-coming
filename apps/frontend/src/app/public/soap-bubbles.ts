import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input } from '@angular/core';
import { type Kiki, KikiSounds } from '@org/frontend-ui';

/**
 * Soap bubbles blown wherever the guest taps the hero's sky. They drift
 * up and pop (or pop when tapped); one of each puff floats to Kiki, who
 * licks it. Plain DOM + Web Animations; nothing under reduced motion.
 */
@Component({
  selector: 'app-soap-bubbles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 3;
    }
  `,
})
export class SoapBubbles {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sounds = inject(KikiSounds);
  private readonly live = new Set<HTMLElement>();

  /** Kiki, who catches one bubble of each puff. */
  readonly kiki = input<Kiki | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.live.forEach((b) => b.remove()));
  }

  /** Blows a puff of bubbles from a screen point. */
  blow(clientX: number, clientY: number): void {
    const win = globalThis.window;
    if (!win || typeof Element.prototype.animate !== 'function') return;
    if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const box = this.host.nativeElement.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const count = 4 + Math.floor(Math.random() * 3);
    const mouth = this.kiki()?.mouthPoint();
    for (let i = 0; i < count; i++) {
      const bubble = this.create(x, y, 14 + Math.random() * 26);
      if (i === 0 && mouth) this.toKiki(bubble, mouth.x - clientX, mouth.y - clientY);
      else this.drift(bubble, y);
    }
  }

  private create(x: number, y: number, size: number): HTMLElement {
    const bubble = document.createElement('span');
    bubble.setAttribute('aria-hidden', 'true');
    Object.assign(bubble.style, {
      position: 'absolute',
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      pointerEvents: 'auto',
      cursor: 'pointer',
      border: '1.5px solid rgba(255, 255, 255, 0.85)',
      background:
        'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.95) 0 9%, rgba(255,255,255,0.18) 32%, rgba(156,195,213,0.25) 62%, rgba(243,222,154,0.4) 100%)',
      boxShadow: 'inset -3px -3px 6px rgba(63, 90, 60, 0.18)',
    });
    bubble.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      this.pop(bubble);
    });
    this.host.nativeElement.appendChild(bubble);
    this.live.add(bubble);
    return bubble;
  }

  /** Floats about, mostly sideways (the sky is short), then pops. */
  private drift(bubble: HTMLElement, top: number): void {
    const dx = (Math.random() - 0.5) * 260;
    const dy = -Math.random() * Math.min(110, Math.max(0, top - 16)) + Math.random() * 30;
    const animation = bubble.animate(
      [
        { transform: 'translate(0, 0) scale(0.3)' },
        { transform: `translate(${dx * 0.3}px, ${dy * 0.4 - 8}px) scale(1)`, offset: 0.2 },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.7 + 6}px) scale(1.05)`, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)` },
      ],
      { duration: 3000 + Math.random() * 2500, delay: Math.random() * 200, easing: 'ease-in-out', fill: 'forwards' },
    );
    animation.onfinish = () => this.pop(bubble);
  }

  /** Straight(ish) to her mouth: she licks it and it pops. */
  private toKiki(bubble: HTMLElement, dx: number, dy: number): void {
    const animation = bubble.animate(
      [
        { transform: 'translate(0, 0) scale(0.3)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 50}px) scale(1)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.9)` },
      ],
      { duration: 1700 + Math.random() * 500, easing: 'ease-in-out', fill: 'forwards' },
    );
    animation.onfinish = () => {
      if (!this.live.has(bubble)) return;
      this.kiki()?.lick();
      this.pop(bubble, true);
    };
  }

  private pop(bubble: HTMLElement, silent = false): void {
    if (!this.live.has(bubble)) return;
    this.live.delete(bubble);
    bubble.getAnimations().forEach((a) => a.pause());
    if (!silent) this.sounds.play('pop');
    const burst = bubble.animate(
      [
        { opacity: 1, scale: '1' },
        { opacity: 0, scale: '1.5' },
      ],
      { duration: 140, easing: 'ease-out', fill: 'forwards' },
    );
    burst.onfinish = () => bubble.remove();
  }
}
