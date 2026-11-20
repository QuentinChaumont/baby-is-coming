import { Injectable, computed, inject } from '@angular/core';
import { KikiDiscoveries, KikiTreasures, type KikiDiscovery, type KikiTreasure } from '@org/frontend-ui';

/** One page of Kiki's notebook: a secret to discover or a treasure to find. */
export interface CarnetEntry {
  id: KikiDiscovery | KikiTreasure;
  kind: 'secret' | 'treasure';
  icon: string;
  title: string;
  /** How it works — shown once discovered. */
  text: string;
  /** A nudge — shown while it's still « ??? ». */
  hint: string;
}

export const CARNET: readonly CarnetEntry[] = [
  {
    id: 'tetine',
    kind: 'secret',
    icon: '🍼',
    title: 'La tétine',
    text: 'Retire-lui sa tétine (un clic ou en la faisant glisser)… Ouiiin ! Rends-la-lui pour la consoler.',
    hint: 'Elle a quelque chose dans la bouche…',
  },
  {
    id: 'chatouilles',
    kind: 'secret',
    icon: '🤭',
    title: 'Les chatouilles',
    text: 'Un clic sur son ventre et elle glousse en se tortillant.',
    hint: 'Elle est très chatouilleuse… mais où ?',
  },
  {
    id: 'caresses',
    kind: 'secret',
    icon: '💛',
    title: 'Les caresses',
    text: 'Caresse sa tête en faisant des allers-retours : des cœurs s’envolent.',
    hint: 'Elle adore qu’on lui caresse la…',
  },
  {
    id: 'cornes',
    kind: 'secret',
    icon: '🦒',
    title: 'Les cornes',
    text: 'Tapote ses petites cornes : elle secoue la tête.',
    hint: 'Ce qui dépasse en haut de sa tête…',
  },
  {
    id: 'sieste',
    kind: 'secret',
    icon: '😴',
    title: 'La sieste',
    text: 'Laisse-la tranquille 30 secondes : elle s’endort avec une bulle au nez. Bouge pour la réveiller.',
    hint: 'Les bébés dorment beaucoup…',
  },
  {
    id: 'baillement',
    kind: 'secret',
    icon: '🥱',
    title: 'Le bâillement',
    text: 'Ne bouge plus quelques secondes : elle bâille… et toi aussi, avoue.',
    hint: 'Un bâillement, ça se partage.',
  },
  {
    id: 'eternuement',
    kind: 'secret',
    icon: '🤧',
    title: 'Atchoum !',
    text: 'Tapote-la très vite plein de fois (ou tape ↑ ↑ ↓ ↓ ← → ← → B A) : ses taches s’envolent.',
    hint: 'Trop de clics, ça chatouille le nez…',
  },
  {
    id: 'bain',
    kind: 'secret',
    icon: '🛁',
    title: 'Le bain',
    text: 'Frotte son ventre jusqu’à effacer ses taches : elle s’ébroue et elles reviennent.',
    hint: 'Frotte, frotte, frotte…',
  },
  {
    id: 'loucher',
    kind: 'secret',
    icon: '😵‍💫',
    title: 'Ça tourne !',
    text: 'Attrape son oreille gauche et tire-la vers l’extérieur : elle louche.',
    hint: 'Ses oreilles sont bien longues… à gauche.',
  },
  {
    id: 'langue',
    kind: 'secret',
    icon: '😛',
    title: 'Bleuh !',
    text: 'Tire son oreille droite : clin d’œil et langue tirée.',
    hint: 'Et de l’autre côté ?',
  },
  {
    id: 'bulles',
    kind: 'secret',
    icon: '🫧',
    title: 'Les bulles',
    text: 'Clique dans le ciel vert de l’accueil : elle attrape une bulle avec la langue.',
    hint: 'Le ciel de l’accueil cache quelque chose…',
  },
  {
    id: 'doudou',
    kind: 'treasure',
    icon: '🐰',
    title: 'Le doudou',
    text: 'Il se cachait au bord des mentions légales. Donne-le-lui : câlin garanti.',
    hint: 'Elle a perdu son doudou… sur une page que personne ne lit.',
  },
  {
    id: 'hochet',
    kind: 'treasure',
    icon: '🎀',
    title: 'Le hochet',
    text: 'Il dépassait de la page confidentialité. Elle le secoue dans sa patte.',
    hint: 'Son hochet aussi a disparu… sur une autre page que personne ne lit.',
  },
];

/** What's unlocked in the notebook: secrets discovered plus treasures found. */
@Injectable({ providedIn: 'root' })
export class CarnetProgress {
  private readonly discoveries = inject(KikiDiscoveries);
  private readonly treasures = inject(KikiTreasures);

  readonly unlocked = computed(
    () => new Set<string>([...this.discoveries.found(), ...this.treasures.found()]),
  );
  readonly count = computed(() => CARNET.filter((e) => this.unlocked().has(e.id)).length);
  readonly total = CARNET.length;
  readonly complete = computed(() => this.count() === this.total);

  /** Forgets every secret and hides the treasures again. */
  reset(): void {
    this.discoveries.clear();
    this.treasures.clear();
  }
}
