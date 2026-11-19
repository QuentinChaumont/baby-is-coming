# DESIGN — Baby is coming (Kiki)

> Charte de la piste **A « Brocante en savane »**, retenue le 2026-11-18
> (D16, cf. `docs/PRODUCT.md` §8). Maquette de référence :
> https://claude.ai/artifact/GALPtw7v4vJxRJFXD48Fq9 (artboards « A · … »).
> Implémentation : `libs/frontend/design` (tokens `_tokens.scss` /
> `design.config.ts`, boutons `_brand.scss`) et composants de marque dans
> `libs/frontend/ui/src/lib/brand` (`PriceTag`, `Stamp`, `LinkPill`,
> `GiraffeBand`, `InkCard`, `Switch`). Vitrine en dev : `/charte`.

## Direction artistique

Un vide-grenier chic transposé dans la savane : on assume la seconde main avec
fierté, sur l'univers de la chambre de Kiki (vert sauge, jaune beurre, girafe).

- **Accueil** : grand titre « Coucou, c'est Kiki » sur bandeau sauge, étiquettes
  légèrement inclinées (terme prévu, « Fille ou garçon ? Surprise »), bande
  kraft au **motif de taches de girafe** (formes vectorielles nettes).
- **Mot des parents** : carte blanche bordée d'encre, très légèrement inclinée.
- **Liste** : grille 2 colonnes, photos 4:5, **étiquette de prix manuscrite**
  (Caveat) qui déborde sur la photo, **tampons** terracotta « Chassé ! » /
  « Adopté ! » inclinés sur les objets pris.
- **Fiche objet** : grande photo, prix sur étiquette beurre, liens annonces en
  pastilles bordées, note manuscrite « si tu ne trouves pas, préviens-nous »,
  zone d'actions sur fond sauge.
- **Illustrations** : uniquement de vraies illustrations ; la mascotte girafe
  (D17) est produite en parallèle, le motif de taches la remplace en attendant.
  Silhouette validée le 2026-11-18 : bébé girafe assis, tête ronde (~40 % de
  la hauteur), pelage beurre à taches ocre, bandana et tétine sauge, étiquette « Kiki »,
  unisexe (ni nœud ni cils). Version retenue = « version plus douce » : trait
  sauge foncé fin (pas l'encre), grands yeux à deux reflets, mèche bouclée,
  cornes ocre, sabots noirs. Planches : https://claude.ai/artifact/AAaER3hzo28NMq5heuGew3
  Pas de croquis SVG faits main. Icônes : trait 1.8–2 px, coins arrondis.
- **À éviter** : ombres dures décalées, sur-titres au-dessus des titres,
  emoji en guise d'icônes, dégradés décoratifs.

## Where things live

| Concern | File |
| --- | --- |
| Brand values (build-time source of truth) | `libs/frontend/design/src/lib/theme/design.config.ts` |
| Brand values as CSS custom properties (what the browser reads) | `libs/frontend/design/src/lib/theme/_tokens.scss` |
| Material M3 setup + `--mat-sys-*` wiring | `libs/frontend/design/src/lib/theme/_theme.scss` |
| Material bootstrap providers | `libs/frontend/design/src/lib/material/material.providers.ts` |
| Runtime theming (step 24) | `libs/frontend/design/src/lib/theme/` (`ThemeService`, `ThemeSettingsPanel`) |

## Colour palette

Mode clair uniquement (D18) : pas de valeur sombre.

| Token (`--app-color-*`) | Valeur | Rôle |
| --- | --- | --- |
| `primary` / `on-primary` | `#22301F` / `#FBF7EE` | Encre : bouton principal, texte fort, bordures |
| `secondary` / `on-secondary` | `#F3DE9A` / `#22301F` | Jaune beurre : cagnotte, étiquettes, sélection de texte |
| `sage` / `on-sage` | `#8FA98A` / `#22301F` | Vert sauge : bandeau d'accueil, zone d'actions |
| `sage-strong` | `#3F5A3C` | Icônes, liens, focus, notes manuscrites |
| `kraft` | `#E6D5B8` | Bande à taches, fonds de photos |
| `giraffe-spot` | `#C9A86A` | Taches de girafe sur kraft (décor uniquement) |
| `stamp` | `#A4442A` | Tampons « Chassé ! » / « Adopté ! » |
| `background` | `#FBF7EE` | Crème : fond de page |
| `surface` / `on-surface` | `#FFFFFF` / `#22301F` | Cartes, champs |
| `on-surface-variant` | `#4E5C4B` | Texte secondaire (≥ 4.5:1 sur crème) |
| `error` / `on-error` | `#A4442A` / `#FFFFFF` | Erreurs |

## Typography

| Rôle | Police | Usage |
| --- | --- | --- |
| Display | **Fraunces** 800 (600) — `--app-font-display` | Titres ; tracking -0.02em |
| Texte | **Nunito** 400 / 600 / 800 — `--app-font-family` | Corps, boutons (800), labels |
| Manuscrit | **Caveat** 600 — `--app-font-hand` | Prix sur étiquettes, notes, sous-titres d'ambiance — jamais pour un texte long |

Échelle de la maquette (mobile) : titre accueil 56px, titre page 32–34px,
h2 28px, corps 15–16px, petit texte 13–14px.

## Shape (radius)

| Token | Value | Use |
| --- | --- | --- |
| `--app-radius-sm` | `4px` | Étiquettes inclinées, tags |
| `--app-radius-md` | `10px` | Boutons, champs |
| `--app-radius-lg` | `12px` | Cartes, photos |
| `--app-radius-pill` | `999px` | Pastilles de liens, interrupteurs, boutons ronds |

Bordures : 2px encre (`primary`) pour cartes, champs et boutons secondaires.
Élévation : rare, toujours douce (`0 6px 14px rgba(34,48,31,.18)`), jamais
une ombre dure décalée.

## Spacing

8px base grid — `4 / 8 / 12 / 16 / 24 / 32 / 48`. Prefer multiples of 8;
`4px` only for tight inline gaps.

## Density

`design.config.ts` → `density: 0` (comfortable). Lower toward `-3` for
data-dense admin screens.

## Using Material components

**Do**

- Consume colours through `--app-color-*` / `--mat-sys-*`, never a hex.
- `MatFormField` appearance is `outline` by default — keep it consistent.
- Use `mat-icon` (Material Symbols Outlined, ligature mode).
- Route protected screens through the dashboard shell (step 26).

**Don't**

- Import `@angular/material` from `libs/frontend/core`.
- Add a second component library.
- Put a brand colour literal anywhere but `design.config.ts` / `_tokens.scss`.
- Override component internals with `::ng-deep` — use the documented
  `--mat-*` token for that component.

## Changing the palette

- **Permanent (all environments):** edit `design.config.ts` **and** the
  matching `light-dark()` values in `_tokens.scss`, commit both.
- **Per visitor, at runtime:** the settings panel (step 24) writes
  overrides to `document.documentElement` and persists them in
  `localStorage`. It never changes the committed charter.

## Light / dark

**Mode clair uniquement** (D18) : `color-scheme: light` forcé sur `<html>`,
sélecteur de thème du starter retiré.

## Icons

Add **Material Symbols Outlined** per project — self-host, or in
`apps/frontend/src/index.html`:

```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
```
