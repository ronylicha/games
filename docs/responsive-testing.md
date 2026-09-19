# Matrice de tests — Tablette / Orientation / Boutons de navigation

Plan de tests **manuels** du sprint « support tablette ». Objectif : vérifier que
chaque écran s'adapte correctement aux classes d'appareil et aux orientations, et
que les boutons / contrôles de navigation ne sont jamais masqués par l'encoche,
la barre d'état ou l'indicateur d'accueil.

Référez‑vous aux tokens partagés :
`src/constants/responsive.ts` (breakpoints + caps), `src/constants/theme.ts`
(espacement + typographie), `src/hooks/use-responsive.ts` et
`src/hooks/use-safe-nav-insets.ts`.

---

## 1. Classes d'appareil & breakpoints

La classe est résolue sur le **côté le plus court** de la fenêtre
(`resolveDeviceClassFromSize`) : un téléphone passé en paysage reste `phone`.

| Classe   | Seuil (côté court) | Exemples d'appareils                          |
| -------- | ------------------ | --------------------------------------------- |
| phone    | `0`                | iPhone, Pixel, petit Android                  |
| tablet   | `≥ 600`            | iPad mini (744), iPad (768/810), tablette And.|
| desktop  | `≥ 1024`           | Grande tablette paysage, navigateur large web |

Les **caps de mise en page** (colonnes, largeurs max) sont eux résolus sur la
**largeur courante** (`resolveCap` / `resolveHomeColumns`).

| Token            | phone | tablet | desktop |
| ---------------- | ----- | ------ | ------- |
| HomeColumns      | 2     | 3      | 4       |
| ContentMaxWidth  | 640   | 900    | 1120    |
| BoardMaxSize     | 460   | 560    | 640     |
| TableMaxWidth    | 520   | 820    | 1040    |

## 2. Planchers de marge nav (`useSafeNavInsets`)

Chaque bord vaut `max(insetSystème, plancher)`.

| Bord   | Plancher téléphone | Plancher grand écran |
| ------ | ------------------ | -------------------- |
| top    | 18                 | 24                   |
| right  | 16                 | 24                   |
| bottom | 20                 | 28                   |
| left   | 16                 | 24                   |

---

## 3. Environnements à couvrir

| Code | Appareil / fenêtre                          | Orientations à tester      |
| ---- | ------------------------------------------- | -------------------------- |
| P    | Téléphone (~390 dp)                         | portrait **et** paysage    |
| T    | Tablette (iPad ~810 dp)                     | portrait **et** paysage    |
| D    | Web large (≥ 1024 dp) / grande tablette     | paysage                    |
| N    | Appareil **avec encoche** (iPhone notch)    | portrait **et** paysage    |
| A    | Android **sans** encoche (insets système 0) | portrait                   |

Comment tester :
- **iOS** : simulateur iPad + `⌘→` / `⌘←` pour pivoter ; iPhone avec encoche.
- **Android** : émulateur tablette + rotation ; appareil sans encoche pour valider
  les planchers (insets système = 0).
- **Web** : redimensionner la fenêtre pour franchir 600 puis 1024 dp.

---

## 4. Matrice par écran

Légende des attentes : ✅ comportement requis. Tester sur chaque environnement
pertinent (P/T/D/N/A).

### 4.1 Écran d'accueil (`src/app/index.tsx`)

| # | Vérification | Env. |
| - | ------------ | ---- |
| H1 | Grille à **2 colonnes** sur téléphone, **3** sur tablette, **4** en desktop | P / T / D |
| H2 | Largeur du corps capée (640 / 980 / 1200) et **centrée** | T / D |
| H3 | Cartes de largeur égale, gouttière régulière (gap 12 → 16) sans débordement | P / T / D |
| H4 | Téléphone en **paysage** : reste 2 colonnes (classe = phone) | P |
| H5 | Marges haut/bas/gauche/droite respectées ; rien sous l'encoche/indicateur | N / A |

### 4.2 Coquille de jeu (`GameStage`) — Échecs, Dames, Dominos, Puissance 4, Dino, Solitaire

| # | Vérification | Env. |
| - | ------------ | ---- |
| G1 | Bouton **Retour** entièrement visible et tappable, dégagé de l'encoche | N / P / T |
| G2 | Bouton Retour agrandi sur grand écran (cible ≥ 52 dp de haut) | T / D |
| G3 | Largeur de contenu capée (640 / 900 / 1120), centrée | T / D |
| G4 | Titres/sous‑titres agrandis sur grand écran | T / D |
| G5 | Bas de page (dernier contrôle) au‑dessus de l'indicateur d'accueil | N / A |

### 4.3 Plateaux carrés — Échecs, Dames, Puissance 4, Tic Tac Toe

| # | Vérification | Env. |
| - | ------------ | ---- |
| B1 | Côté du plateau capé par **BoardMaxSize** (460 / 560 / 640), centré | P / T / D |
| B2 | Pièces / jetons nets et alignés à toutes les tailles | P / T / D |
| B3 | Contrôles (mode, niveau, couleur, reset) lisibles et tappables | T |
| B4 | Tic Tac Toe / Puissance 4 : marge sous les contrôles bas respectée | N / A |

### 4.4 Tables larges — Dominos, Solitaire, Backgammon

| # | Vérification | Env. |
| - | ------------ | ---- |
| W1 | Table capée par **TableMaxWidth** (520 / 820 / 1040), centrée | T / D |
| W2 | Dominos : chaîne sur plus de colonnes en tablette/desktop, sans débordement | T / D |
| W3 | Main du joueur / tuiles tappables, gouttières correctes | P / T |
| W4 | Backgammon : marge des contrôles dégagée de l'indicateur d'accueil | N / A |

### 4.5 Dino Run (`src/components/dino/DinoGame.tsx`)

| # | Vérification | Env. |
| - | ------------ | ---- |
| R1 | Canvas plus large sur tablette/desktop (cap 760 / 900 / 1100), plus haut (380) | T / D |
| R2 | Téléphone en **paysage** : canvas reste large (cap 760, non réduit) | P |
| R3 | Boutons Sauter / Baisser / Nouvelle tappables (≥ 46 dp) | P / T |
| R4 | Zone de jeu et contrôles dégagés des bords / indicateur | N / A |

### 4.6 Jeux paysage — Street Brawl, Vallombre

| # | Vérification | Env. |
| - | ------------ | ---- |
| L1 | Bouton Retour / barre haute dégagés de l'encoche **latérale** en paysage | N |
| L2 | Overlays (carnet d'indices, tableau de liège) et panneau de choix non rognés | T / N |
| L3 | Dialogue / contrôles bas dégagés de l'indicateur d'accueil | N / A |
| L4 | Marge garantie même sans encoche (planchers appliqués) | A |
| L5 | Verrou paysage actif ; le `RotateGate` s'affiche si l'appareil est en portrait | P |

---

## 5. Focus « boutons de navigation »

À valider explicitement sur **N** (encoche) et **A** (sans encoche), en
**portrait et paysage** :

1. Le bouton **Retour** (`BackButton` / barre haute Vallombre) est entièrement
   visible, non recouvert, et la zone tappable n'est pas sous l'encoche.
2. En **paysage**, l'encoche est latérale : vérifier que rien d'interactif ne
   tombe dans `inset.left` / `inset.right`.
3. Les **contrôles bas** (Dino, Puissance 4, Tic Tac Toe, Backgammon, dialogue
   Vallombre) restent au‑dessus de l'indicateur d'accueil / barre gestuelle.
4. Sur Android **sans** encoche (insets = 0), les planchers (18/16/20/16 ;
   24/24/28/24) garantissent quand même une marge minimale sur les 4 bords.
5. Rotation **en cours de partie** : après pivot, les marges et les caps se
   recalculent (via `useWindowDimensions`) sans recharger l'écran.

---

## 6. Régressions à surveiller

- Téléphone en paysage traité à tort comme une tablette (caps trop grands).
- Plateau/canvas qui déborde du corps capé sur tablette.
- Bouton Retour ou contrôles bas masqués par l'encoche / l'indicateur.
- Texte qui ne s'agrandit pas sur tablette (typographie figée).
- Grille d'accueil bloquée sur une seule colonne sur grand écran.
