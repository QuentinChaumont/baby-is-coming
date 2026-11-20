import { Injectable, signal } from '@angular/core';

/** Every secret Kiki's notebook keeps track of (treasures are tracked by
 * `KikiTreasures`, the notebook reads both). */
export type KikiDiscovery =
  | 'tetine'
  | 'chatouilles'
  | 'caresses'
  | 'cornes'
  | 'sieste'
  | 'baillement'
  | 'eternuement'
  | 'bain'
  | 'loucher'
  | 'langue'
  | 'bulles';

const STORAGE_KEY = 'kiki-carnet';

/**
 * The secrets this guest discovered while playing with Kiki, for her
 * notebook. Remembered in this browser only; nothing goes to the server.
 */
@Injectable({ providedIn: 'root' })
export class KikiDiscoveries {
  readonly found = signal<readonly KikiDiscovery[]>(readStored());
  /** The latest new discovery, to cheer about it (null once seen). */
  readonly latest = signal<KikiDiscovery | null>(null);

  has(discovery: KikiDiscovery): boolean {
    return this.found().includes(discovery);
  }

  record(discovery: KikiDiscovery): void {
    if (this.has(discovery)) return;
    this.found.update((found) => [...found, discovery]);
    this.latest.set(discovery);
    this.save();
  }

  /** Forgets everything (the notebook's « start over »). */
  clear(): void {
    this.found.set([]);
    this.latest.set(null);
    this.save();
  }

  private save(): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(this.found()));
    } catch {
      /* private mode: remembered for this visit only */
    }
  }
}

function readStored(): KikiDiscovery[] {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((d): d is KikiDiscovery => typeof d === 'string') : [];
  } catch {
    return [];
  }
}
