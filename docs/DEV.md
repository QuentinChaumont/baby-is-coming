# DEV — Plan de développement (Baby is coming · Kiki)

> Découpage du développement de `docs/PRODUCT.md` en étapes livrables.
> Charte visuelle : `DESIGN.md` (piste A). Chaque étape se termine par
> `npx nx run-many -t typecheck lint test build` vert (+ e2e Chromium du
> parcours concerné quand il y a du front) et un commit.

## Principes de découpage

- **Vertical d'abord** : le back-end d'une entité, puis son écran public, puis
  son écran admin. Chaque étape laisse l'app dans un état fonctionnel.
- **Générateurs du starter** quand ils collent :
  `@org/starter-plugin:entity <name> [--crud]` (feature Mongo backend),
  `@org/starter-plugin:frontend-feature <name>` (feature Angular lazy).
- **Contrats partagés** dans `libs/shared/contracts` (DTO / types communs
  front ↔ back).
- **Tests** : unitaires Jest à chaque étape ; e2e Playwright (Chromium) par
  parcours, en réutilisant les helpers `apps/frontend-e2e/src/support/`.

## Vue d'ensemble

| Phase | Étapes | Résultat |
|-------|--------|----------|
| 0. Socle | 0.1 → 0.3 | Starter nettoyé, charte A appliquée, coquille publique |
| 1. Domaine objets | 1.1 → 1.4 | Réglages, objets, photos, annonces côté API |
| 2. Participations | 2.1 → 2.2 | Prendre un objet, promettre une contribution (API) |
| 3. Site public | 3.1 → 3.5 | Tout le parcours invité |
| 4. Back-office | 4.1 → 4.5 | Tout le parcours parents |
| 5. Finitions MVP | 5.1 → 5.3 | RGPD, qualité, mise en ligne |
| V1 | V1.1 → V1.2 | Prêt, page contact |
| V2 | V2.1 → V2.5 | Cron Claude, livre d'or maman, coups de main, annonce de naissance |
| ∥ | P.1 | Mascotte girafe (en parallèle) |

---

## Phase 0 — Socle

### 0.1 Nettoyer le starter
- Retirer du site public toute UI d'auth : pas de bouton « Se connecter »,
  routes d'inscription désactivées (front + `POST /api/auth/register` fermé).
- Déplacer l'espace connecté de `/app` vers **`/admin`** (auth obligatoire).
- Retirer ce qui ne sert pas au produit : sélecteur de langue (FR seul, D19),
  sélecteur / panneau de thème + `color-scheme: light` forcé (D18), écrans
  d'admin du starter non utiles (rôles, OIDC/2FA si non voulus — à lister
  au moment de l'étape, suppression leaf-first selon `BRICKS.md`).
- Script de création des **2 comptes parents** (`seed:admin`, D21).
- **Fini quand** : `/` affiche une page vide publique, `/admin` exige une
  connexion, aucune inscription possible, CI verte.

### 0.2 Appliquer la charte A
- Tokens `DESIGN.md` → `design.config.ts` + `_tokens.scss` (+ mapping
  `--mat-sys-*`).
- Polices Fraunces / Nunito / Caveat (auto-hébergées), échelle typo, radius.
- Composants de base dans `libs/frontend/ui` : bouton (plein / bordé),
  étiquette de prix manuscrite, tampon « Chassé ! / Adopté ! », pastille de
  lien, interrupteur, bande « taches de girafe », carte bordée.
- Thème des surfaces navigateur (sélection, focus, scrollbar).
- **Fini quand** : une page de démo (ou stories en test) montre chaque
  composant conforme à la maquette A.

### 0.3 Coquille du site public
- Layout public mobile-first (header « Kiki » + lien cagnotte, pied de page
  avec mentions légales), routes vides `/`, `/liste`, `/objet/:id`,
  `/cagnotte`.
- `noindex` + `robots.txt` (D3), balises Open Graph (aperçu WhatsApp, F10).
- **Fini quand** : navigation entre les pages vides, Lighthouse mobile OK.

---

## Phase 1 — Domaine objets (API)

### 1.1 Réglages de la liste
- Singleton « liste » (réutiliser / étendre `app-settings`) : surnom
  (« Kiki »), date du terme, message d'accueil, moyens de paiement (IBAN,
  liens Lydia / PayPal / Wero…), objectif facultatif de la cagnotte, date
  d'anonymisation (défaut : terme + 6 mois, D13).
- `GET /api/public/list` (sous-ensemble public), `GET/PATCH` admin.
- Modèle prévu pour le multi-listes (`BirthList`, D1) sans l'exposer.

### 1.2 Objets
- Entité `Item` : titre, description, prix seconde main indicatif, quantité,
  ordre, photos, **disponibilité** (`DISPONIBLE` / `PRIS`, par unité) et
  **publication** (`BROUILLON` / `PUBLIÉ` / `ARCHIVÉ`).
- Admin : CRUD, réordonnancement, changement de publication ; publication
  refusée sans photo ; suppression définitive seulement sans participation
  (R-OBJ-6).
- Public : `GET /api/public/items` (publiés uniquement, filtre disponibles
  par défaut, recherche titre + description, tri prix) et
  `GET /api/public/items/:id`.

### 1.3 Photos
- Upload admin (≤ 10 Mo, JPEG / PNG / HEIC), traitement `sharp` : 2 tailles
  (~400 / ~1200 px), WebP, EXIF retiré ; stockage **GridFS** (D20).
- `GET /api/media/:id` avec cache long + URL versionnée.

### 1.4 Annonces (saisie manuelle)
- Entité `Listing` (cf. PRODUCT F12) : url (unique par objet), plateforme
  déduite de l'URL, titre, prix, ville, vignette, `source`, `status`,
  `foundAt`.
- Admin : ajouter / masquer / expirer / supprimer. Public : annonces
  `active` incluses dans la fiche objet.

---

## Phase 2 — Participations (API)

### 2.1 Prendre un objet (chasse / don)
- Entité `Participation` : objet + unité, type (`chasse` / `don`), prénom,
  nom, `hideName`, petit mot, `enteredByParents`, `received`, `thanked`.
- `POST /api/public/items/:id/take` : **prise atomique** d'une unité
  disponible (mise à jour conditionnelle Mongo, deux invités simultanés →
  un seul gagne, l'autre reçoit un message clair).
- Anti-spam invisible : rate limiting (brick `security`) + champ piège.
- Côté public, le nom n'est renvoyé que si `hideName = false`
  (sinon « quelqu'un de discret ») ; le petit mot n'est **jamais** public.

### 2.2 Promesses de contribution
- Entité `Contribution` : prénom, nom, `hideName`, montant (> 0, sans
  minimum, D7), petit mot, `received`, `thanked`.
- `POST /api/public/contributions` ; `GET /api/public/kitty` → total promis
  + noms non masqués, **jamais** les montants individuels (D8).

---

## Phase 3 — Site public

### 3.1 Accueil
- « Coucou, c'est Kiki », terme, « Fille ou garçon ? Surprise », bande
  girafe, mot des parents, « trois façons de jouer », accès liste / cagnotte.

### 3.2 Liste
- Grille 2 colonnes, étiquettes de prix, tampons sur les objets pris,
  interrupteur « afficher aussi les objets pris », tri prix, recherche.
- États : chargement, liste vide, recherche sans résultat.

### 3.3 Fiche objet + formulaires
- Photo, prix, description, annonces, rappel « état correct / préviens-nous ».
- « Je pars à la chasse ! » et « J'ai déjà ça chez moi ! » → formulaire
  (prénom, nom, masquer mon nom, petit mot) avec avertissement
  « seuls les parents pourront modifier ou annuler », puis confirmation.
- « La flemme de chercher » → lien vers la cagnotte.
- Cas d'erreur : objet pris entre-temps.
- **e2e** : un invité prend un objet, il apparaît « pris » ; nom masqué.

### 3.4 Cagnotte
- Total promis, contributeurs, formulaire de promesse, puis moyens de
  paiement (IBAN avec bouton copier, liens externes).
- **e2e** : promesse → total mis à jour, montant individuel non visible.

### 3.5 Partage
- Bouton « Partager » (Web Share API, repli copier le lien).

---

## Phase 4 — Back-office (`/admin`)

### 4.1 Coquille admin + tableau de bord
- Navigation admin, tableau de bord : objets par statut, total promis /
  reçu, **nouveautés depuis la dernière visite** (D10).

### 4.2 Gestion des objets
- Liste avec filtres de publication, création / édition, **recadrage photo**
  dans le navigateur (`ngx-image-cropper` ou équivalent compatible Angular 22),
  réordonnancement drag & drop, gestion des annonces de l'objet.

### 4.3 Participations
- Liste filtrable (objet, type, reçu, remercié, saisie parents).
- Actions : remettre l'objet en disponible, **assigner un objet à la place
  d'un invité**, passer `PRIS` sans participant, cases « Reçu ✓ » et
  « Merci envoyé ✓ », lecture des petits mots.
- Archivage d'un objet pris : liste des participants à prévenir.

### 4.4 Cagnotte
- Liste des promesses, cases « Reçu ✓ » / « Merci envoyé ✓ », filtres.

### 4.5 Réglages
- Surnom, date du terme, message d'accueil, moyens de paiement, objectif de
  cagnotte, date d'anonymisation.
- **e2e** : un parent crée un objet, le publie, le voit sur le site public.

---

## Phase 5 — Finitions MVP

### 5.1 RGPD
- Cron d'**anonymisation** des données invités à la date réglée (défaut
  terme + 6 mois) : noms et petits mots effacés, objets et totaux conservés.
- Mentions légales / politique de confidentialité adaptées (brick
  `consent`) : données collectées, affichage public du nom, durée.
- Suppression ponctuelle d'une participation par les parents (droit à
  l'effacement, R-RGPD-4).

### 5.2 Qualité
- Passe accessibilité (contrastes, focus, cibles ≥ 44 px, lecteurs d'écran),
  performance mobile (images, lazy loading), relecture de tous les textes
  (ton, tutoiement, formulations neutres).
- e2e de bout en bout : parcours invité complet + parcours parent complet.

### 5.3 Mise en ligne
- Hébergement + MongoDB + sauvegardes, domaine, HTTPS, variables d'env,
  création des 2 comptes en production, test réel sur téléphone.

**→ Livraison MVP.**

---

## V1

### V1.1 Prêt
- Choix « Je le donne / Je le prête » sur « J'ai déjà ça chez moi ! », date
  de retour indicative visible dans l'admin.

### V1.2 Page « Contactez-nous »
- Mention / page de contact (contenu défini par les parents).

---

## V2

### V2.1 API annonces + cron Claude (F12)
- Jeton d'API dédié, endpoint d'écriture limité aux annonces
  (`source: claude`), anti-doublon par URL.
- Tâche planifiée Claude : cherche des annonces pour les objets publiés
  disponibles, les ajoute, expire les annonces mortes. Trancher **D29**
  (publication directe ou validation).

### V2.2 Livre d'or surprise pour maman (F7)
- Trancher **D28**, puis réalisation.

### V2.3 Coups de main (F6) — si le temps le permet

### V2.4 Annonce de naissance (F11)

### V2.5 Autres pistes
- Export « souvenirs » PDF, train de repas, multi-listes, paiement intégré.

---

## Piste parallèle

### P.1 Mascotte girafe (D17)
- Production de l'illustration (dessin, commande ou génération + retouche),
  déclinaisons accueil / confirmation / page d'erreur.
- Intégration dès qu'elle est prête, quelle que soit la phase en cours.

---

## Dépendances

```text
0.1 ─▶ 0.2 ─▶ 0.3 ─┬─▶ 3.x (front public)
                   │
1.1 ─▶ 1.2 ─┬─▶ 1.3
            ├─▶ 1.4
            └─▶ 2.1 ─▶ 2.2
                        │
1.x + 2.x ─────────────┴─▶ 3.x ─▶ 4.x ─▶ 5.x ─▶ MVP ─▶ V1 ─▶ V2
```

La phase 1 (API) peut démarrer en parallèle de 0.2 / 0.3 (front).
