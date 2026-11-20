import { Injectable, computed, signal } from '@angular/core';
import type { KikiTreasure } from './kiki.model';

/** Every treasure hidden around the site, in the order they're shelved. */
export const KIKI_TREASURES: readonly KikiTreasure[] = ['doudou', 'hochet'];

const storageKey = (treasure: KikiTreasure) => `kiki-${treasure}`;

/**
 * Which of Kiki's lost treasures this guest found. Remembered in this
 * browser only (one localStorage key each); nothing goes to the server.
 */
@Injectable({ providedIn: 'root' })
export class KikiTreasures {
  readonly found = signal<readonly KikiTreasure[]>(KIKI_TREASURES.filter(readStored));
  readonly missing = computed(() => KIKI_TREASURES.filter((t) => !this.found().includes(t)));
  readonly total = KIKI_TREASURES.length;

  has(treasure: KikiTreasure): boolean {
    return this.found().includes(treasure);
  }

  /** Hides every treasure again (the notebook's « start over »). */
  clear(): void {
    this.found.set([]);
    try {
      KIKI_TREASURES.forEach((t) => globalThis.localStorage?.removeItem(storageKey(t)));
    } catch {
      /* nothing stored */
    }
  }

  markFound(treasure: KikiTreasure): void {
    if (this.has(treasure)) return;
    this.found.update((found) => KIKI_TREASURES.filter((t) => t === treasure || found.includes(t)));
    try {
      globalThis.localStorage?.setItem(storageKey(treasure), 'found');
    } catch {
      /* private mode: found for this visit only */
    }
  }
}

function readStored(treasure: KikiTreasure): boolean {
  try {
    return globalThis.localStorage?.getItem(storageKey(treasure)) === 'found';
  } catch {
    return false;
  }
}
