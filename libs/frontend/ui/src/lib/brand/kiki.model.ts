import type { KikiDiscovery } from './discoveries.store';

/** What Kiki is doing right now. */
export type KikiMood =
  | 'idle'
  | 'pout'
  | 'cry'
  | 'relief'
  | 'giggle'
  | 'shake'
  | 'love'
  | 'sleep'
  | 'startle'
  | 'sneeze'
  | 'joy'
  | 'hug'
  | 'lost'
  | 'bath'
  | 'shakeoff'
  | 'cross'
  | 'tongue'
  | 'lick'
  | 'yawn'
  | 'smug'
  | 'rattle';

/** The treasures a guest can find around the site and give back to Kiki. */
export type KikiTreasure = 'doudou' | 'hochet';

export type Eyes = 'open' | 'happy' | 'squeeze' | 'sleep' | 'cross' | 'wink';
export type Pacifier = 'mouth' | 'drag' | 'free';

/** Where the pacifier sits when it's in her mouth (SVG user units). */
export const MOUTH = { x: 200, y: 198 };
/** The ground line a dropped pacifier lands on. */
export const GROUND_Y = 429;
/** Where a tapped-out pacifier lands: on the ground, on her left. */
export const TAP_DROP_X = 104;
export const SLEEP_AFTER_MS = 30_000;
/** Idle time before a (contagious) yawn — at most once every YAWN_EVERY_MS. */
export const YAWN_AFTER_MS = 12_000;
export const YAWN_EVERY_MS = 180_000;
/** A guest coming back this soon after her yawn gets teased about it. */
export const SMUG_WINDOW_MS = 30_000;
/** Rubbing distance (screen px) that washes her spots out, and the faintest
 * they get. */
export const BATH_RUB_PX = 1_600;
export const BATH_MIN = 0.12;
/** How far an ear stretches before it snaps back into a grimace. */
export const EAR_GRIMACE_AT = 1.25;
/** Taps on Kiki within this window that make her sneeze. */
export const SNEEZE_TAPS = 8;
export const SNEEZE_WINDOW_MS = 2_500;
export const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/** How long Kiki cuddles her doudou when given it. */
export const KIKI_HUG_MS = 3_200;

/** How long each passing mood lasts before Kiki settles back. */
export const MOOD_MS: Partial<Record<KikiMood, number>> = {
  pout: 700,
  relief: 1_400,
  giggle: 1_100,
  shake: 700,
  love: 1_800,
  startle: 500,
  sneeze: 2_600,
  joy: 2_600,
  hug: KIKI_HUG_MS,
  lost: 2_600,
  bath: 700,
  shakeoff: 1_000,
  cross: 1_500,
  tongue: 1_500,
  lick: 900,
  yawn: 2_200,
  smug: 2_600,
  rattle: KIKI_HUG_MS,
};

/** Her eyes for each mood (open by default). */
export const EYES: Partial<Record<KikiMood, Eyes>> = {
  giggle: 'happy',
  love: 'happy',
  relief: 'happy',
  joy: 'happy',
  hug: 'happy',
  bath: 'happy',
  smug: 'happy',
  rattle: 'happy',
  cry: 'squeeze',
  sneeze: 'squeeze',
  shakeoff: 'squeeze',
  sleep: 'sleep',
  yawn: 'sleep',
  cross: 'cross',
  lick: 'cross',
  tongue: 'wink',
};

export const SPOTS = [
  { d: 'M190,94 q10,-8 22,0 q4,12 -8,16 q-14,0 -14,-16 z', dx: 0, dy: -90 },
  { d: 'M148,100 q8,-8 16,0 q2,10 -8,12 q-8,-2 -8,-12 z', dx: -80, dy: -60 },
  { d: 'M238,100 q8,-6 16,2 q0,10 -8,10 q-8,-2 -8,-12 z', dx: 80, dy: -70 },
];
export const NECK_SPOTS = [
  {
    d: 'M184,238 q10,-8 20,0 q2,12 -10,14 q-10,-2 -10,-14 z',
    dx: -100,
    dy: -10,
  },
  { d: 'M206,262 q8,-6 16,2 q0,10 -8,10 q-8,-2 -8,-12 z', dx: 100, dy: 10 },
];
export const BODY_SPOTS = [
  {
    d: 'M140,330 q14,-12 28,-2 q6,16 -8,22 q-18,2 -20,-20 z',
    dx: -110,
    dy: -30,
  },
  {
    d: 'M226,322 q16,-6 26,6 q2,16 -14,18 q-14,-4 -12,-24 z',
    dx: 110,
    dy: -50,
  },
  {
    d: 'M186,356 q14,-10 26,0 q4,14 -10,18 q-16,0 -16,-18 z',
    dx: -20,
    dy: 110,
  },
  { d: 'M250,372 q12,-6 20,4 q0,14 -12,14 q-10,-4 -8,-18 z', dx: 120, dy: 40 },
  { d: 'M134,382 q10,-6 18,2 q2,12 -10,12 q-10,-2 -8,-14 z', dx: -120, dy: 50 },
  { d: 'M196,404 q10,-6 18,2 q2,12 -10,12 q-10,-2 -8,-14 z', dx: 30, dy: 120 },
];

export const BUBBLE: Partial<Record<KikiMood, string>> = {
  cry: 'Ouiiin ! Ma tétine !',
  giggle: 'Hi hi hi !',
  sneeze: 'Atchoum !',
  relief: 'Ahhh…',
  shake: 'Hé, mes cornes !',
  joy: 'Youpi !',
  hug: 'Mon doudou !',
  shakeoff: 'Brrr !',
  cross: 'Ouh là, ça tourne !',
  tongue: 'Bleuh !',
  lick: 'Pop !',
  yawn: 'Aaaaah…',
  smug: "T'as bâillé aussi, avoue !",
  rattle: 'Tchic tchic !',
};

/** Speech bubble text size, line height and average glyph width (SVG units). */
export const BUBBLE_FONT = 30;
const BUBBLE_LINE = 32;
const BUBBLE_GLYPH = 12.8;
/** Bubble text longer than this wraps onto two lines. */
const BUBBLE_WRAP = 15;

/** Splits long bubble text in two near its middle — never before French
 * « ! ? : ; » (their space is a non-breaking one), preferably just after
 * punctuation. */
export function bubbleLines(text: string): string[] {
  if (text.length <= BUBBLE_WRAP) return [text];
  const middle = text.length / 2;
  const cost = (i: number) =>
    Math.abs(i - middle) - (/[!?,.…]/.test(text[i - 1]) ? 3 : 0);
  let cut = -1;
  for (let i = 1; i < text.length - 1; i++) {
    if (text[i] !== ' ' || /[!?:;]/.test(text[i + 1])) continue;
    if (cut < 0 || cost(i) < cost(cut)) cut = i;
  }
  return cut < 0 ? [text] : [text.slice(0, cut), text.slice(cut + 1)];
}

/** The speech bubble left of her head, sized to its (wrapped) text; its
 * bottom edge stays put and its tail points at her mouth. `scale` enlarges
 * the text when Kiki is drawn small (phones), so it stays readable. */
export function bubbleGeometry(
  text: string,
  scale = 1,
): {
  path: string;
  centerX: number;
  font: number;
  lines: { text: string; y: number }[];
} {
  const lines = bubbleLines(text);
  const font = BUBBLE_FONT * scale;
  const lineHeight = BUBBLE_LINE * scale;
  const width = Math.max(
    80,
    Math.max(...lines.map((l) => l.length)) * BUBBLE_GLYPH * scale + 30,
  );
  const r = 156;
  const l = r - width;
  const bottom = 84;
  const top = bottom - (lines.length * lineHeight + 14);
  return {
    centerX: r - width / 2,
    font,
    lines: lines.map((line, i) => ({
      text: line,
      y: top + 7 + font * 0.8 + i * lineHeight,
    })),
    path: `M${l + 12},${top} H${r - 12} Q${r},${top} ${r},${top + 12} V${bottom - 12} Q${r},${bottom} ${r - 12},${bottom} H${r - 14} L${r + 10},${bottom + 16} L${r - 34},${bottom} H${l + 12} Q${l},${bottom} ${l},${bottom - 12} V${top + 12} Q${l},${top} ${l + 12},${top} Z`,
  };
}

/** Water flung off when she shakes herself dry after the bath. */
export const DROPS = [
  { x: 130, y: 330, dx: -60, dy: -40 },
  { x: 270, y: 330, dx: 60, dy: -50 },
  { x: 150, y: 140, dx: -70, dy: -30 },
  { x: 250, y: 140, dx: 70, dy: -20 },
  { x: 120, y: 390, dx: -70, dy: 10 },
  { x: 280, y: 390, dx: 70, dy: 0 },
  { x: 200, y: 70, dx: 0, dy: -60 },
];

/** The notebook secret each mood reveals. */
export const MOOD_DISCOVERY: Partial<Record<KikiMood, KikiDiscovery>> = {
  cry: 'tetine',
  giggle: 'chatouilles',
  love: 'caresses',
  shake: 'cornes',
  sleep: 'sieste',
  yawn: 'baillement',
  sneeze: 'eternuement',
  shakeoff: 'bain',
  cross: 'loucher',
  tongue: 'langue',
  lick: 'bulles',
};
