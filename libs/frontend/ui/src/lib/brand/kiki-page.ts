/** What Kiki needs to hear from the page around her. */
export interface KikiPageHandlers {
  /** The pointer moved (throttled to one call per frame; off under reduced motion). */
  look(clientX: number, clientY: number): void;
  /** Any sign of life: pointer, scroll. */
  activity(): void;
  key(key: string): void;
  /** Once a second. */
  tick(): void;
  /** Her drawn width changed (CSS px). */
  resized(width: number): void;
  /** She scrolled into or out of view. */
  visible(onScreen: boolean): void;
}

/**
 * Wires Kiki to the page: pointer, keys, scroll, a 1 s ticker, her size
 * and visibility. Returns the cleanup.
 */
export function listenToPage(win: Window, host: HTMLElement, on: KikiPageHandlers): () => void {
  const doc = win.document;
  const reducedMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let frame = 0;
  let last: PointerEvent | null = null;
  const look = (event: PointerEvent) => {
    last = event;
    if (!frame) frame = win.requestAnimationFrame(() => {
      frame = 0;
      if (last) on.look(last.clientX, last.clientY);
    });
  };
  const activity = () => on.activity();
  const key = (event: KeyboardEvent) => on.key(event.key);
  if (!reducedMotion) doc.addEventListener('pointermove', look, { passive: true });
  doc.addEventListener('pointermove', activity, { passive: true });
  doc.addEventListener('pointerdown', activity, { passive: true });
  doc.addEventListener('keydown', key);
  win.addEventListener('scroll', activity, { passive: true });
  const ticker = win.setInterval(() => on.tick(), 1_000);
  const resize =
    typeof ResizeObserver === 'function' ? new ResizeObserver(([e]) => on.resized(e.contentRect.width)) : null;
  resize?.observe(host);
  const seen =
    typeof IntersectionObserver === 'function' ? new IntersectionObserver(([e]) => on.visible(e.isIntersecting)) : null;
  seen?.observe(host);

  return () => {
    doc.removeEventListener('pointermove', look);
    doc.removeEventListener('pointermove', activity);
    doc.removeEventListener('pointerdown', activity);
    doc.removeEventListener('keydown', key);
    win.removeEventListener('scroll', activity);
    win.clearInterval(ticker);
    resize?.disconnect();
    seen?.disconnect();
    if (frame) win.cancelAnimationFrame(frame);
  };
}
