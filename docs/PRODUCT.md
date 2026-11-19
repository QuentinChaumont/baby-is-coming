# PRODUCT — Baby is coming 🍼

> Liste de naissance alternative : seconde main, cagnotte & entraide.
>
> **Statut : document de travail.** Tout ce qui est marqué 💡 est une
> *proposition* à valider, tout ce qui est marqué ❓ est une *décision à
> prendre ensemble*. Rien n'est figé tant que la case n'est pas cochée ✅.

---

## 1. Vision

Sortir des listes de naissance classiques qui poussent à acheter du neuf.
Le site privilégie :

- **la seconde main** — on chine plutôt qu'on achète en magasin ;
- **les contributions financières** — on laisse les parents trouver la bonne affaire ;
- **le don et le prêt entre proches** — l'objet qui dort dans un grenier ;
- **les coups de main** — un plat cuisiné vaut parfois mieux qu'un body de plus (V2, si le temps le permet).

### Principes directeurs

| # | Principe | Conséquence concrète |
|---|----------|----------------------|
| P1 | **Site public sans connexion** ✅ | Aucun compte, aucune authentification côté invités. Un lien, un formulaire court, c'est fini. |
| P1b | **Back-office admin authentifié** ✅ | Seule la partie admin (gestion de la liste, des objets, des participations, des réglages) exige une connexion. |
| P2 | **Mobile d'abord** | Le lien circule par SMS / WhatsApp : 90 % des visites seront sur téléphone. |
| P3 | **Seconde main d'abord, sans axer sur l'économie** ✅ | Le message porte sur la seconde main et la planète, pas sur l'argent économisé : pas de prix neuf, pas de compteur d'économies. |
| P4 | **Convivial et décalé** | Un ton qui fait sourire ; le site doit donner envie de participer. |
| P5 | **Les parents gardent la main** | Ils valident les dons, peuvent remettre un objet en disponible, ajuster la liste. |
| P6 | **Pas de paiement intégré (au début)** | Promesses de dons + liens de paiement externes. Pas de flux d'argent chez nous. |

---

## 2. Périmètre produit

❓ **D1 — Mono-liste ou plateforme ?**

| Option | Description | Impact |
|--------|-------------|--------|
| A. Site perso | Une seule liste (la nôtre), les parents = admins du site. | Beaucoup plus simple. Le starter (auth + admin) suffit tel quel. |
| B. Plateforme | N'importe quel couple crée sa liste (`/l/<slug>`). | Multi-tenant, onboarding, modération, CGU… |

✅ **Décision : A (mono-liste) pour le MVP.** On modélise quand même une
entité `BirthList` dès le départ pour pouvoir passer à B (plateforme, V2+)
sans tout réécrire.

---

## 3. Acteurs & rôles

✅ **Acté : deux espaces distincts.**

| Espace | Accès | Contenu |
|--------|-------|---------|
| **Site public** (`/`) | Libre, **aucune connexion ni authentification** | Accueil, liste, fiches objets, cagnotte, formulaires de participation. |
| **Back-office admin** (`/admin`) | **Authentification obligatoire** (brick `auth`) | Gestion de la liste, des objets, de la cagnotte, des participations, des réglages. |

| Acteur | Compte ? | Peut faire |
|--------|----------|-----------|
| **Parent / admin** (1 ou 2, voire plus) | Oui, dans le back-office | Gérer la liste, les objets, la cagnotte, valider les dons, voir le suivi, remercier. |
| **Invité** | Non, jamais | Consulter la liste, prendre un cadeau, promettre une contribution, proposer un don (prêt en V1), laisser un mot. |

> Côté public, on retire du starter toute UI de connexion / inscription : pas de
> bouton « Se connecter » visible. L'admin accède au back-office par l'URL `/admin`.
> ✅ **D21** — Aucune inscription ni gestion de comptes dans l'interface : les
> deux comptes parents sont créés **par script** (`seed:admin` existant).

✅ **D2 — Identification et gestion des participations invité**

- Chaque participation demande **prénom + nom** (obligatoires).
- Case **« Masquer mon nom aux autres invités »** : le nom reste visible des
  parents dans le back-office, mais le site public affiche « Quelqu'un de
  discret » (libellé à affiner).
- **Une participation est définitive côté invité** : ni modification, ni
  annulation, ni suppression depuis le site public. Pour changer quoi que ce
  soit, l'invité **contacte les parents**, qui agissent depuis le back-office.
- Pas de lien magique, pas de code de gestion.
- ✅ Un message clair l'indique avant validation du formulaire (« Une fois
  validé, seuls les parents pourront modifier ou annuler. »).
- ✅ **D23** — MVP : pas de moyen de contact sur le site (les invités sont des
  proches, ils savent joindre les parents). **V1** : mention / page
  « Contactez-nous ».

✅ **D22 — Aucun email invité.** On ne collecte pas d'email. Les parents
communiquent eux-mêmes avec leurs proches (SMS, WhatsApp…) : remerciements,
relances, refus de don, annulations. Le site n'envoie **aucun message aux
invités**.

✅ **D3 — Accès à la liste : toute personne disposant du lien.**

- Aucun code d'accès, aucun mot de passe.
- Site **non indexé** par les moteurs de recherche (`noindex`, `robots.txt`).
- Conséquence assumée : si le lien circule, n'importe qui voit la liste et les
  noms non masqués (d'où l'importance de la case « Masquer mon nom »).

---

## 4. Glossaire

| Terme | Définition |
|-------|-----------|
| **Liste** | L'ensemble des objets et la cagnotte d'une naissance. |
| **Objet** | Un article souhaité (poussette, transat, lot de bodies 3 mois…). |
| **Participation** | Toute action d’un invité : prise d’un cadeau (chasse), contribution, don (prêt en V1). |
| **Chasse** | Prise ferme d’un objet : l’invité s'engage à le trouver d'occasion. |
| **Contribution** | Promesse d'un montant, vers un objet ou vers la cagnotte libre. |
| **Don** | L'invité propose un objet qu'il possède déjà (« J'ai déjà ça ! »). |
| **Prêt** (V1) | L'invité prête un objet qui sera rendu (cosy, lit parapluie…). |
| **Coup de main** (V2) | Un service : repas, babysitting, ménage, courses… |

---

## 5. Fonctionnalités

Légende priorité : **MVP** = indispensable au lancement · **V1** = juste après · **V2** = plus tard / bonus.

### F1 — Page d'accueil de la liste · MVP

- Mot des parents (texte libre), photo ou illustration.
- Date prévue du terme, compte à rebours décalé (« J-42 avant la fin des nuits complètes »).
- ✅ **D4** — Le bébé s'appelle **« Kiki »** (surnom provisoire). Le sexe est
  **inconnu, y compris des parents** : surprise pour tout le monde à la
  naissance. Le surnom est modifiable dans le back-office (annonce F11).
- **Message d'accueil** — premier jet des parents, à peaufiner (cf. §7.1).
- Un encart « Comment ça marche ? » en 3 étapes illustrées.
- Accès rapide : Objets · Cagnotte.

### F2 — Catalogue d'objets · MVP

Chaque objet possède :

| Champ | Obligatoire | Note |
|-------|:-:|------|
| Photo(s) | ✅ (1 min.) | ✅ Au moins une photo obligatoire pour **publier** ; un objet sans photo peut rester en `BROUILLON`. Recadrée / optimisée à l'upload (cf. D20). |
| Titre | ✅ | « Poussette tout-terrain », « Lot de bodies 3 mois » (la taille / l'âge s'écrit dans le titre ou la description, pas de champ dédié). |
| Description | — | Ce qu'on attend, les critères (« pliable d'une main, svp »). |
| Prix seconde main indicatif | ✅ | En €. Seul prix affiché (pas de prix neuf, pas de calcul d'économie). Sert au tri par prix. |
| Annonces | — | 0 à N **annonces** rattachées à l'objet (entité dédiée, cf. F12). |
| Quantité souhaitée | ✅ (défaut 1) | Ex. « bodies 3 mois × 6 ». |
| Mode de participation autorisé | ✅ | Cases : chasse / flemme / don (+ prêt en V1). |
| Statut | auto | Disponibilité `DISPONIBLE` / `PRIS` + publication `BROUILLON` / `PUBLIÉ` / `ARCHIVÉ` (voir §6.1). |

✅ **Pas de catégories ni de niveau de priorité** : une seule liste d'objets ; l'ordre défini par les parents fait passer l'essentiel en haut.

**Navigation invité :**
- ✅ **Filtre statut** : par défaut **seuls les objets disponibles** sont
  affichés ; un interrupteur permet d'afficher aussi les objets pris (avec leur
  tampon « Chassé ! » / « Adopté ! »).
- ✅ **Tri par prix** (croissant / décroissant) ; par défaut, ordre défini par
  les parents dans le back-office.
- ✅ **Barre de recherche** sur le **titre et la description**.

### F3 — Actions invité sur un objet · MVP

Trois actions de base sur la fiche d'un objet :

#### 🏹 « Je pars à la chasse ! »
- L'invité **prend** l'objet (ou *n* unités si quantité > 1) et s'engage à le
  trouver d'occasion.
- Formulaire : prénom, nom, case « masquer mon nom », petit mot facultatif (cf. F7).
- L'objet passe immédiatement à **pris** et disparaît des « disponibles ».
- Écran de confirmation avec les liens annonces (pas d'invitation à la
  capture d'écran).
- Engagement définitif : seuls les parents peuvent remettre l'objet en
  disponible (cf. D2, R-OBJ-5).
- ✅ **Pas de champ « état »** : un message général indique que l'invité
  choisit **un état qu'il considère correct** (critères éventuels dans la
  description de l'objet).
- ✅ Message rappelé sur la fiche et à la confirmation : **si tu ne trouves
  pas, préviens-nous par message** 🙂 (les parents remettront l'objet en
  disponible).

#### 🛋️ « La flemme de chercher »
- ✅ **D26** — **Ne prend pas l'objet** : l'objet reste `DISPONIBLE`.
- Simple **redirection vers la page cagnotte** (F5) pour faire un virement qui
  sert à compléter le reste de la liste ; les parents achètent eux-mêmes les
  objets restants qu'ils souhaitent.
- Contribution **non affectée** à l'objet (liste non exclusive) : l'argent va
  dans le pot commun.

#### 🏠 « J'ai déjà ça chez moi ! »
- L'invité propose un objet qu'il possède : photo facultative, état, commentaire.
- ✅ MVP : don uniquement (l'invité peut préciser « je te le prête » en commentaire). **V1** : choix **Je le donne** / **Je le prête**.
- ✅ **D25** — Aucune différence avec la chasse : le don **prend** l'objet
  immédiatement et définitivement, sans validation des parents. Si l'objet ne
  convient pas, les parents le remettent en disponible et préviennent l'invité.

✅ **D5 — Les invités voient-ils qui a pris quoi ?**
Oui, le prénom + nom du participant est affiché sur l'objet, **sauf** s'il a
coché « Masquer mon nom aux autres invités ».

✅ **D6 — Pas de mode surprise.** Les parents voient toujours qui a pris quoi
dans le back-office (indispensable pour remercier, relancer et remettre un
objet en disponible).

### F4 — Cadeaux collectifs · ❌ hors périmètre site

✅ **Pas de cadeau à plusieurs.** Un objet est pris par une seule personne.
Pas de cadeau collectif, pas de contribution partielle, pas de barre de
progression, pas d'état « en cours de financement ».

### F5 — Cagnotte libre & moyens de paiement · MVP

- ✅ **Une seule cagnotte**, « J'ai la flemme », qui sert à compléter le reste
  de la liste. Pas de cagnottes thématiques.
- Objectif facultatif.
- Point d'arrivée du bouton « La flemme de chercher » (cf. D26) : l'argent sert
  à compléter le reste de la liste.
- ✅ **D27** — La contribution est **enregistrée comme promesse** : formulaire
  (prénom, nom, case « masquer mon nom », montant, message facultatif), puis
  affichage des moyens de paiement. Définitive côté invité (cf. D2).
- ✅ **D8** — Affichage public : le **total promis** et la **liste des
  contributeurs** (sauf noms masqués). Les montants individuels ne sont
  **jamais** affichés publiquement ; seuls les parents les voient.
- Paiement **externe**, configuré par les parents :
  - lien Lydia / Sumeria, PayPal.me, Wero, lien Leetchi / Lydia cagnotte ;
  - IBAN (affiché avec bouton « copier ») ;
  - « En main propre / chèque à la naissance ».
- La promesse est **déclarative** : statut `promise` → `received` lorsque les
  parents confirment l'avoir reçue (action manuelle dans l'espace parents).
- ✅ Pas de relance automatique (pas d'email invité).
- ✅ **D9** — Pas d'alerte « promesse en retard » : le back-office liste les
  promesses avec leur case « Reçu ✓ » (filtrable), les parents la parcourent
  eux-mêmes.

### F6 — Coups de main · V2 (si le temps le permet)

✅ Hors MVP et V1 : on verra en V2 s'il reste du temps.

Les « petits services entre proches » cités dans la vision.

- Les parents créent des **bons** : « 🍲 Un plat cuisiné la 1re semaine »,
  « 🧺 Une lessive pliée », « 👶 2 h de babysitting pour une sieste »,
  « 🐕 Promener le chien », « 🛒 Faire les courses ».
- Chaque bon a une quantité (ex. 10 plats) et éventuellement un créneau.
- L'invité s'inscrit (prénom, nom, case « masquer mon nom », créneau / commentaire).
- 💡 V2 : mini calendrier « train de repas » sur les 4 premières semaines.

### F7 — Petits mots & livre d'or surprise pour maman

✅ **Pas de livre d'or public.**

- **MVP** : chaque formulaire (chasse, don, cagnotte) a un champ facultatif
  **« Un petit mot d'amour »** 💌. Ces mots ne sont **jamais affichés sur le
  site public** ; ils sont **lus par les deux parents dans le back-office**.
- **V2** : un **livre d'or surprise pour maman**, à lui faire lire **après
  l'accouchement**. Fonctionnement (dont comment garder la surprise, ❓ **D28**)
  à définir le moment venu.
- 💡 Export PDF « souvenirs » pour l'album de naissance (V2).

### F8 — Back-office admin (espace parents) · MVP

Accessible uniquement après authentification, sous `/admin`.

- Tableau de bord : objets par statut, total promis / reçu, objets pris par don.
- CRUD objets ; réglages de la cagnotte (textes, objectif facultatif) ; réordonner les objets (drag & drop).
- Suivi des participations : qui, quoi, quand, statut, contact.
- ✅ **Assigner un objet à la place d'un invité** : les parents passent un
  objet à `PRIS` en saisissant eux-mêmes la participation (prénom, nom, case
  « masquer mon nom », type chasse / don, petit mot facultatif). Cas d'usage :
  mamie appelle au lieu d'utiliser le site. La participation est marquée
  « saisie par les parents » dans le back-office ; côté public, elle s'affiche
  comme n'importe quelle autre.
- Actions : remettre un objet en disponible, marquer « reçu », marquer
  « contribution reçue », ajouter un objet acheté par eux-mêmes.
- Réglages : textes d'accueil, moyens de paiement,
  date du terme.
- ✅ Suivi des remerciements : case privée **« Merci envoyé ✓ »** par participation (à côté de « Reçu ✓ »), avec un filtre « pas encore remercié ».
- Deux comptes parents (créés par script, cf. D21), mêmes droits sur la liste.

### F9 — Notifications · MVP

✅ **D10 — Aucune notification de participation.** Ni email, ni digest.
Aucun email n'est envoyé aux invités (cf. D22).

- Les parents consultent le back-office quand ils le souhaitent ; le tableau
  de bord **met en avant les nouveautés depuis leur dernière visite**
  (objets pris, promesses de contribution, messages).
- Seul email restant : **mot de passe oublié / gestion des comptes admin**
  (bricks `auth-reset` + `mailer` existantes).

### F10 — Partage · MVP

- Lien court + bouton « Partager » (Web Share API sur mobile).
- ✅ Pas de QR code généré par le site.
- Aperçu soigné quand le lien est collé dans WhatsApp / iMessage (Open Graph).

### F11 — Annonce de naissance · V2 💡

- Les parents publient l'arrivée (prénom, photo, poids, heure) en un clic.
- La page d'accueil bascule en mode « Bienvenue ! » (les parents préviennent
  leurs proches eux-mêmes).

### F12 — Annonces seconde main · MVP (saisie manuelle) + V2 (Claude)

Des pistes concrètes pour aider les chasseurs : des annonces réelles trouvées
sur Leboncoin, Vinted, Facebook Marketplace, etc., rattachées à un objet.

**Modèle de données (dès le MVP)** — entité `Listing`, 0..N par objet :

| Champ | Obligatoire | Note |
|-------|:-:|------|
| `itemId` | ✅ | Objet de la liste concerné. |
| `url` | ✅ | Lien vers l'annonce. Unique par objet (anti-doublon). |
| `platform` | ✅ | `leboncoin` · `vinted` · `facebook` · `autre` (déduit de l'URL si possible). |
| `title` | — | Titre de l'annonce. |
| `price` | — | Prix affiché sur l'annonce (€). |
| `location` | — | Ville / département. |
| `imageUrl` | — | Vignette de l'annonce (lien distant, pas de copie). |
| `source` | ✅ | `manual` (parents) ou `claude` (V2). |
| `status` | ✅ | `active` · `hidden` (masquée par les parents) · `expired`. |
| `foundAt` | ✅ | Date d'ajout. |

**Affichage (MVP)** — sur la fiche objet, section « Des pistes pour chiner » :
les annonces `active`, en pastilles ou mini-cartes (plateforme, prix, ville),
ouvertes dans un nouvel onglet. Rien n'est affiché si aucune annonce.

**Back-office (MVP)** — par objet : ajouter une annonce (coller l'URL +
champs facultatifs), masquer / réactiver, marquer expirée, supprimer.

**V2 — Cron Claude** :
- Une tâche planifiée (agent Claude) parcourt les objets `PUBLIÉ` +
  `DISPONIBLE`, cherche des annonces correspondantes et les ajoute via une
  **API dédiée** (`source: claude`).
- API : endpoint d'écriture protégé par un **jeton d'API** propre à cet usage
  (pas un compte parent), limité à la création / mise à jour d'annonces.
- Les annonces ajoutées par Claude arrivent ❓ **D29** : directement `active`,
  ou en attente de validation par les parents ?
- Le cron peut aussi marquer `expired` les annonces qui ne répondent plus.

---

## 6. Règles métier

### 6.1 Statuts d'un objet

✅ **D11 — Deux statuts seulement : `DISPONIBLE` et `PRIS`.** Un invité
**prend** un cadeau ou ne le prend pas. Prendre un cadeau est un engagement
ferme et définitif : pas d'état intermédiaire, pas d'expiration, pas de
relance, pas de financement partiel. (Libellé affiché « Pris » ou
« Réservé » : à choisir avec le copywriting.)

```text
          ┌────────────┐   chasse / don                       ┌────────┐
          │ DISPONIBLE │ ───────────────────────────────────▶ │  PRIS  │
          └────────────┘ ◀─────────────────────────────────── └────────┘
                              uniquement par les parents
                                    (back-office)
```

✅ **Statut de publication (back-office)** — indépendant de la disponibilité :

| Publication | Visible côté invités ? | Usage |
|-------------|------------------------|-------|
| `BROUILLON` | ❌ Non | Objet en préparation, pas encore publié. |
| `PUBLIÉ` | ✅ Oui (avec son statut `DISPONIBLE` / `PRIS`) | Cas normal. |
| `ARCHIVÉ` | ❌ Plus du tout | Objet retiré (ex. reçu par ailleurs). Reste dans le back-office avec ses participations et petits mots. |

Transitions libres pour les parents (brouillon → publié → archivé, et retour).

| Code | Règle |
|------|-------|
| R-OBJ-1 | Un objet `DISPONIBLE` accepte toutes les actions autorisées par les parents. |
| R-OBJ-2 | Un objet avec quantité > 1 a un statut **par unité** ; l'objet est `DISPONIBLE` tant qu'au moins une unité l'est. |
| R-OBJ-3 | ✅ « Je pars à la chasse ! » et « J'ai déjà ça chez moi ! » passent immédiatement l'unité à `PRIS`, définitivement, sans validation. |
| R-OBJ-4 | Un objet `PRIS` n'accepte plus aucune action invité. |
| R-OBJ-5 | ✅ Seuls les parents peuvent remettre un objet `DISPONIBLE` (ex. l'invité les a prévenus qu'il abandonne) ou le passer `PRIS` en l'**assignant à un invité** (saisie de la participation à sa place, cf. F8) ou sans participant (ex. « acheté par nous-mêmes »). |
| R-OBJ-6 | ✅ Un objet ayant des participations s'**archive** (le back-office liste les participants à prévenir) ; la suppression définitive est réservée aux objets sans participation. |
| R-OBJ-7 | ✅ **D26** — « La flemme de chercher » ne change pas le statut : elle redirige vers la cagnotte. |
| R-OBJ-8 | ✅ **D24** — Case privée « Reçu ✓ » par objet (et par promesse de contribution) dans le back-office uniquement, **jamais visible des invités**. Objectif : savoir ce qui est réellement arrivé, et donc ce qu'il reste à acheter avec la cagnotte ou à ajouter à la liste. |
| R-OBJ-9 | ✅ **D12** — Aucune limite d'objets pris par invité ; en cas d'abus, les parents remettent des objets en disponible. |

### 6.3 Contributions

| Code | Règle |
|------|-------|
| R-CON-1 | Une contribution est une **promesse** : aucun argent ne transite par le site. |
| R-CON-2 | ✅ **D7** — Montant libre : ni minimum, ni maximum (montant > 0 €). |
| R-CON-4 | L'objectif facultatif de la cagnotte libre se base sur les montants **promis** (pas reçus) — ❓ à confirmer. |
| R-CON-5 | Seuls les parents passent une contribution à `reçue`. |
| R-CON-6 | ✅ Seuls les parents peuvent annuler / modifier une contribution. |

### 6.4 Dons & prêts

| Code | Règle |
|------|-------|
| R-DON-1 | ✅ **D25** : un don / prêt passe l’unité à `PRIS` immédiatement, sans validation (même règle que la chasse). |
| R-DON-2 | Si les parents refusent / annulent un don → l’unité redevient `DISPONIBLE` ; ils préviennent l’invité eux-mêmes. |
| R-DON-3 | ✅ Pas de don **hors liste** sur le site : l'invité contacte directement les parents (page « Contactez-nous » en V1). |
| R-DON-4 | V1 — Prêt : date de retour indicative, visible dans le back-office. |

### 6.5 Sécurité bébé

✅ **Aucune fonctionnalité dédiée.** Les parents ne mettent pas sur la liste
les objets déconseillés d'occasion (siège auto, matelas, tétines /
biberons…), ou le précisent dans la description.

### 6.6 Données personnelles (RGPD)

| Code | Règle |
|------|-------|
| R-RGPD-1 | Données invité minimales : prénom, nom, préférence d'affichage du nom, message. Pas d'email, pas de téléphone, pas d'adresse. |
| R-RGPD-2 | Information claire sur l'affichage public du nom (brick `consent` déjà présente pour les mentions légales). |
| R-RGPD-3 | ✅ **D13** — Anonymisation automatique des données invités (noms, messages) **6 mois après la date du terme** par défaut ; date modifiable par les parents dans le back-office. Les objets et totaux sont conservés. (Brick `account-retention` / `app-settings` réutilisable.) |
| R-RGPD-4 | L'invité exerce ses droits (suppression, rectification) en contactant les parents, qui agissent depuis le back-office. |

---

## 7. Ton & écriture (copywriting)

**Ligne éditoriale :** complice, drôle, bienveillante. Jamais culpabilisant,
jamais niais.

✅ **D14 — Tutoiement partout** (accueil, boutons, confirmations, erreurs) :
on s'adresse à chaque invité individuellement, c'est entre proches.

**Positionnement assumé (parents) :** casser les codes de la liste de
naissance « pour le plaisir de vous déstabiliser », et surtout ouvrir les
invités au monde de la seconde main. Message clé : **évitons le neuf, Amazon
et le made in China**. C'est plus long (chercher, trouver, aller récupérer),
mais c'est une double bonne action : Kiki est content, la planète aussi.

### 7.1 Message d'accueil — premier jet (à peaufiner)

> On l'appelle **Kiki** pour l'instant : le sexe, on le découvrira à la
> naissance, pour toi comme pour nous !
>
> On a eu envie de casser un peu les codes, pour le plaisir de te
> déstabiliser, et surtout pour t'ouvrir au monde de la seconde main.
> Évitons le neuf, Amazon et le made in China.
>
> C'est plus long : il faut chercher, dénicher la bonne occasion, aller la
> récupérer… mais tu contribues à deux belles actions. Kiki sera content,
> et la planète aussi ;)
>
> Et si tu as la flemme ? Participe simplement à la cagnotte
> « J'ai la flemme », on s'en occupera :)

| Contexte | Exemple |
|----------|---------|
| Bouton chasse | « Je pars à la chasse ! 🏹 » |
| Bouton contribution | « La flemme de chercher 🛋️ » |
| Bouton don | « J'ai déjà ça chez moi ! 🏠 » |
| Objet pris | Tampon « Chassé ! » |
| Objet pris par un don | Tampon « Adopté ! » |
| Liste vide (filtre) | « Tout a été chassé. Il reste la cagnotte, et elle a faim. » |
| Confirmation chasse | « Bonne chasse ! On compte sur ton flair légendaire. »  |
| Rappel état / abandon | « Choisis un état que tu trouves correct. Et si tu ne trouves pas, envoie-nous un petit message pour nous prévenir :) » |
| Erreur générique | « Oups, le bébé a mâchouillé le câble. Réessaie ? » |
| Refus de don | « Merci du fond du cœur ! On est déjà équipés sur ce coup-là. » |

✅ **D15 — Formulations neutres en priorité** (« quelqu'un », « ton flair légendaire »…). Si aucune tournure neutre ne fonctionne : **masculin générique**. Pas de point médian.

---

## 8. Direction artistique

### 8.1 Pistes

✅ **Contrainte d'univers** — La chambre de Kiki sera **vert sauge & jaune
beurre**, thème **savane / jungle, girafe**. Le site reprend cet univers :
les trois pistes ci-dessous sont déclinées sur cette palette et ce thème.

✅ **D16 — Piste A « Brocante en savane »**, avec le titre d'accueil
**« Coucou, c'est Kiki »** (repris de la piste B). Maquettes de référence :
https://claude.ai/artifact/GALPtw7v4vJxRJFXD48Fq9 (artboards « A · … »).
La charte détaillée (couleurs, typos, formes) est dans `DESIGN.md`. Les pistes
B et C ci-dessous sont conservées pour mémoire.

| Piste | Ambiance | Palette (base sauge & beurre) | Typo | Détails signature |
|-------|----------|-------------------------------|------|-------------------|
| **A. « Brocante en savane »** | Vide-grenier chic : étiquettes de prix, kraft, tampons encreurs, transposé dans la savane. Assume la seconde main avec fierté. | Sauge `#8FA98A`, beurre `#F3DE9A`, kraft `#E6D5B8`, crème `#FBF7EE`, encre `#2F3A2E`. | Serif à caractère (*Fraunces*) + *Nunito* ; accents manuscrits (*Caveat*). | Cartes-étiquettes avec ficelle, prix griffonné, tampons « Chassé ! » / « Adopté ! » ; girafe en tampon. |
| **B. « Jungle douce »** | Doux & ludique : formes organiques, feuillages arrondis, illustrations rondes. Très rassurant. | Sauge pastel, beurre, crème, touches de terracotta clair. | *Quicksand* / *Nunito* arrondis. | Feuilles de monstera en fond, stickers animaux, girafe qui passe la tête à la confirmation. |
| **C. « Carnet d'explorateur »** | Carnet naturaliste : croquis au trait, aquarelle, herbier de savane, papier recyclé. Écolo assumé. | Sauge aquarelle, beurre délavé, papier grisé, encre brune. | Serif éditorial + script. | Croquis de girafe et acacias, notes manuscrites, objets « épinglés » dans le carnet. |

### 8.2 Invariants (quelle que soit la piste)

- **Mobile first**, cible 360 px ; actions principales accessibles au pouce (barre d'action collante en bas des fiches).
- **Accessibilité WCAG 2.2 AA** : contrastes, tailles de cible ≥ 44 px, focus visible, `prefers-reduced-motion` respecté (les tampons ne s'animent pas).
- **Photos** à ratio fixe (carré ou 4:5, à fixer sur maquettes), recadrées à l'upload (cf. D20), chargement paresseux.
- **Micro-interactions** : tampon qui s’abat sur la carte quand un objet est pris, petit confetti écolo (feuilles ?) à la confirmation.
- ✅ **D17 — Mascotte girafe en parallèle** : le lancement utilise le **motif de taches de girafe** (piste A) ; une vraie illustration de girafe chineuse est produite **en parallèle du développement**, puis intégrée dès qu'elle est prête (accueil, confirmation, page d'erreur).
- ✅ **D18 — Mode clair uniquement**, site public comme back-office. Le sélecteur de thème du starter est retiré.
- Le `DESIGN.md` du repo sera mis à jour avec les tokens finaux.

---

## 9. Socle technique (rappel du starter)

Le starter fournit déjà : Angular 22 + Material M3, NestJS, MongoDB, Nx.

| Besoin | Brick existante | Usage |
|--------|-----------------|-------|
| Comptes parents (back-office uniquement) | `auth`, `auth-reset`, `user`, `role` | Limité à `/admin` ; inscription publique désactivée, UI de login retirée du site public. |
| Emails | `mailer` | Uniquement mot de passe oublié / comptes admin (F9). |
| i18n | `frontend-i18n` (Transloco) | ✅ **D19** — Français uniquement ; sélecteur de langue retiré. Les textes restent dans les fichiers de traduction (EN possible plus tard). |
| RGPD | `frontend-consent`, `account-retention` | Bandeau, mentions légales, purge. |
| Admin | `frontend-dashboard`, `admin-*` | Base de l'espace parents. |
| Traçabilité | `audit` | Historique des actions parents. |
| Sécurité | `security` (rate limiting) | Indispensable : formulaires invités publics → anti-spam. |

À ajouter :
- ✅ **D20 — Photos stockées dans MongoDB** (GridFS), avec traitement automatique :
  1. **Recadrage dans le navigateur** (back-office) au ratio défini par le site,
     via un composant de crop Angular (ex. `ngx-image-cropper`, à valider).
  2. **Traitement serveur** avec `sharp` (Node) : redimensionnement en 2 tailles
     (vignette ~400 px, grande ~1200 px), conversion **WebP** qualité ~80,
     **suppression des métadonnées EXIF** (dont la position GPS), poids cible
     < 200 Ko par image.
  3. Taille d'upload max ~10 Mo, formats acceptés JPEG / PNG / HEIC (photos iPhone,
     support HEIC à vérifier côté `sharp`).
  4. Servies avec cache long (`Cache-Control`, URL versionnée).
- Accès invité sans compte : jeton de gestion signé dans le lien magique.
- ✅ Anti-spam formulaires publics : simple et invisible — rate limiting (brick `security`) + champ piège (honeypot). Pas de captcha.

---

## 10. Découpage proposé

| Phase | Contenu |
|-------|---------|
| **MVP** | F1 accueil · F2 catalogue · F3 chasse / flemme / déjà-chez-moi · F5 cagnotte + paiements externes · F8 espace parents (avec « nouveautés depuis la dernière visite ») · F10 partage · F12 annonces (saisie manuelle) |
| **V1** | prêts · page « Contactez-nous » |
| **V2** | F12 cron Claude d'annonces (API + jeton) · F7 livre d'or surprise pour maman · F6 coups de main (si le temps le permet) · F11 annonce de naissance · train de repas · export souvenirs PDF · plateforme multi-listes (si D1 = B) · paiement intégré ? |

---

## 11. Décisions à prendre

| # | Question | Proposition | Décision |
|---|----------|-------------|----------|
| D1 | Mono-liste ou plateforme ? | Mono-liste, modèle prêt pour multi | ✅ Mono-liste au MVP |
| D2 | Gestion des participations sans compte | — | ✅ Prénom + nom, option « masquer », aucune annulation côté invité (passer par les parents) |
| D3 | Accès à la liste | — | ✅ Toute personne ayant le lien, site non indexé, pas de code |
| D4 | Prénom / sexe affiché ? | — | ✅ « Kiki » (surnom provisoire), sexe inconnu de tous jusqu'à la naissance |
| D5 | Les invités voient qui a pris quoi ? | — | ✅ Oui, sauf si l'invité masque son nom |
| D6 | Mode surprise côté parents | — | ✅ Non, les parents voient tout |
| D7 | Contribution minimum (cagnotte) | — | ✅ Aucun minimum, montant libre |
| D8 | Visibilité publique de la cagnotte | — | ✅ Total + noms des contributeurs (sauf masqués), jamais les montants individuels |
| D9 | Alerte « promesse non reçue » | — | ✅ Non, simple liste filtrable avec case « Reçu » |
| D10 | Notifs parents | — | ✅ Aucune ; nouveautés mises en avant dans le back-office |
| D11 | Statuts d'un objet | — | ✅ `DISPONIBLE` / `PRIS` uniquement ; définitif ; pas de cadeau à plusieurs |
| D12 | Limite d’objets pris par invité | — | ✅ Aucune |
| D13 | Durée de conservation données invités | — | ✅ Anonymisation auto 6 mois après le terme (date modifiable) |
| D14 | Tutoiement | — | ✅ Tutoiement partout |
| D15 | Écriture inclusive | — | ✅ Neutre en priorité, sinon masculin ; pas de point médian |
| D16 | Direction artistique | — | ✅ Piste A « Brocante en savane », titre « Coucou, c'est Kiki » ; charte dans `DESIGN.md` |
| D17 | Mascotte | — | ✅ Motif de taches au lancement ; illustration girafe produite en parallèle, intégrée quand prête |
| D18 | Mode sombre | — | ✅ Non, mode clair uniquement |
| D19 | Langues | — | ✅ Français uniquement |
| D20 | Stockage photos | — | ✅ MongoDB (GridFS) ; crop navigateur + `sharp` (resize, WebP, EXIF retiré) |
| D21 | Création des comptes admin | — | ✅ Les deux comptes créés par script, pas d'inscription |
| D22 | Email invité | — | ✅ Aucun ; les parents communiquent par leurs propres moyens |
| D23 | Moyen de contacter les parents | — | ✅ Rien au MVP, « Contactez-nous » en V1 |
| D24 | Suivi « reçu » côté parents | — | ✅ Case privée back-office (objets + promesses), invisible des invités |
| D25 | Un don prend-il l'objet immédiatement ? | — | ✅ Oui, comme la chasse |
| D26 | « La flemme » prend-elle l'objet ? | — | ✅ Non : redirection vers la cagnotte, argent non affecté |
| D27 | Contribution enregistrée sur le site ? | — | ✅ Oui, formulaire de promesse puis moyens de paiement |
| D28 | Livre d'or surprise pour maman : fonctionnement | À définir en V2 | ⏸ V2 |
| D29 | Annonces trouvées par Claude : publiées directement ou validées ? | À définir en V2 | ⏸ V2 |
| — | Site public sans connexion, admin authentifié | — | ✅ |
