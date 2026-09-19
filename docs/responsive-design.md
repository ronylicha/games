# Système de design responsive

Ce document décrit le système qui adapte l'interface des jeux du **téléphone**
à la **tablette** et au **web large**, ainsi que les marges de navigation
garanties (safe-area). Il s'adresse aux développeurs qui ajoutent ou adaptent
un écran de jeu.

## Vue d'ensemble

Le système repose sur une **source de vérité pure** (constantes + sélecteurs
sans dépendance React), surmontée de **hooks réactifs**, eux-mêmes consommés par
des **coques d'écran partagées** et par chaque composant de jeu.

```text
src/constants/responsive.ts   Breakpoints, colonnes, caps de largeur (pur, déterministe)
src/constants/theme.ts        Échelles Spacing / SpacingTablet et Typography (+ surcharge tablet)
        │
        ▼
src/hooks/use-responsive.ts   useResponsive() — classe d'appareil + caps + sélecteur
src/hooks/use-safe-nav-insets.ts  useSafeNavInsets() — marges nav garanties par bord
        │
        ▼
src/components/game-shell/
  GameScreenScaffold.tsx       Coque d'écran (variantes scroll / fill)
  GameStage.tsx                Coque « titre + sous-titre + contenu » (jeux duel)
  BackButton.tsx               Bouton Retour adapté à la taille d'écran
        │
        ▼
src/components/<jeu>/<Jeu>Game.tsx  Plateau/table dimensionné via useResponsive
```

## Classes d'appareil et breakpoints

`src/constants/responsive.ts` définit trois familles :

| Classe    | Seuil (dp) | Cible                                   |
| --------- | ---------- | --------------------------------------- |
| `phone`   | 0          | Téléphones (disposition compacte)       |
| `tablet`  | 600        | iPad mini ≈ 744, iPad ≈ 768/810         |
| `desktop` | 1024       | Grandes tablettes paysage / web large   |

Deux résolutions **cohabitent volontairement** :

- **La classe d'appareil (capacité)** est calculée sur le **côté le plus court**
  de la fenêtre (`resolveDeviceClassFromSize`). Ainsi un téléphone passé en
  paysage reste `phone` — sinon les jeux paysage (Dino, Street Brawl, Vallombre)
  seraient pris à tort pour des tablettes.
- **Les caps de mise en page** (colonnes, largeurs max) sont résolus sur la
  **largeur courante** (`resolveCap`), pour suivre l'espace horizontal réel
  (un iPad en paysage profite des caps `desktop`).

### Caps de largeur

| Constante         | phone | tablet | desktop | Usage                                                  |
| ----------------- | ----- | ------ | ------- | ------------------------------------------------------ |
| `HomeColumns`     | 2     | 3      | 4       | Colonnes de la grille d'accueil                        |
| `ContentMaxWidth` | 640   | 900    | 1120    | Largeur max du contenu (scaffold, panneaux, listes)    |
| `BoardMaxSize`    | 460   | 560    | 640     | Côté max d'un **plateau carré** (Échecs, Dames, P4, TTT) |
| `TableMaxWidth`   | 520   | 820    | 1040    | Largeur max d'une **table large** (Solitaire, Dominos, Backgammon) |

## `useResponsive()`

Point d'entrée réactif unique (`src/hooks/use-responsive.ts`), basé sur
`useWindowDimensions` (réactif aux rotations, redimensionnements et split-view
iPad — contrairement à `Dimensions.get()` qui est figé).

Champs principaux retournés :

| Champ                              | Description                                                        |
| ---------------------------------- | ----------------------------------------------------------------- |
| `width`, `height`                  | Dimensions de la fenêtre en dp                                     |
| `deviceClass`                      | `'phone' \| 'tablet' \| 'desktop'`                                 |
| `isPhone` / `isTablet` / `isDesktop` | Booléens de classe                                               |
| `isLargeScreen`                    | `true` pour tablette **ou** desktop (déclenche le « grand écran ») |
| `orientation` / `isLandscape` / `isPortrait` | Orientation courante                                     |
| `spacing`                          | Échelle d'espacement (`Spacing` ou `SpacingTablet`)               |
| `homeColumns`                      | Colonnes de la grille d'accueil pour la largeur courante          |
| `contentMaxWidth`                  | Cap `ContentMaxWidth` pour la largeur courante                    |
| `boardMaxSize`                     | Cap `BoardMaxSize` pour la largeur courante                       |
| `tableMaxWidth`                    | Cap `TableMaxWidth` pour la largeur courante                      |
| `typography(role)`                 | Style typographique d'un rôle, surcharge grand écran appliquée    |
| `select({ phone, tablet?, desktop? })` | Choisit une valeur par classe, avec **repli ascendant**       |

`select` est l'outil privilégié pour les valeurs discrètes par classe (un cap de
taille de carte, un gap, un nombre d'éléments). Le repli ascendant signifie
qu'omettre `tablet`/`desktop` reprend la valeur de la classe inférieure.

```tsx
const { boardMaxSize, select } = useResponsive();
const maxCardWidth = select({ phone: 68, tablet: 92, desktop: 104 });
```

## `useSafeNavInsets()`

`src/hooks/use-safe-nav-insets.ts` combine les **insets de safe-area système**
(encoche, barre d'état, indicateur d'accueil, bords gauche/droite en paysage)
avec un **plancher minimal** par classe d'appareil. Chaque bord vaut
`Math.max(insetSystème, plancher)`.

Ce plancher est essentiel : sur **Android sans encoche** (et en paysage), le
système rapporte `0` — sans plancher, les boutons de navigation et les contrôles
tactiles toucheraient le bord de l'écran ou la barre de gestes.

| Plancher              | top | right | bottom | left |
| --------------------- | --- | ----- | ------ | ---- |
| `PhoneNavFloor`       | 18  | 16    | 20     | 16   |
| `LargeScreenNavFloor` | 24  | 24    | 28     | 24   |

Les écrans paysage peuvent **relever un plancher** par bord via `minMargins` :

```tsx
// Street Brawl : 48dp garantis pour les contrôles tactiles en paysage.
const nav = useSafeNavInsets({ left: 48, right: 48, bottom: 48 });
```

## Coques d'écran partagées (`game-shell`)

### `GameScreenScaffold`

Centralise fond, marges nav garanties, bouton Retour et boîte de contenu centrée
plafonnée. Deux dispositions :

- **`scroll`** (défaut) : contenu défilant centré, bouton Retour dans le flux.
  Pour les jeux qui empilent plateau + panneaux (Dames, etc.).
- **`fill`** : plein écran sans défilement, bouton Retour flottant. Pour les jeux
  dont le plateau occupe toute la hauteur (Backgammon).

Props clés : `variant`, `maxWidth` (défaut = `contentMaxWidth`), `backgroundColor`
(défaut `ScreenBackground = '#F4F1EA'`), `backButton` (`inline`/`floating`/`none`),
`navMargins` (planchers surchargés transmis à `useSafeNavInsets`), `gap`,
`contentStyle`.

```tsx
// Écran simple : plateau empilé, largeur plafonnée.
<GameScreenScaffold maxWidth={720}>
  <CheckersGame compact />
</GameScreenScaffold>

// Écran plein, plateau pleine hauteur, marges latérales serrées.
<GameScreenScaffold variant="fill" navMargins={{ left: 8, right: 8 }}>
  <BackgammonGame />
</GameScreenScaffold>
```

### `GameStage`

Coque « titre + sous-titre + contenu défilant » utilisée par les jeux duel
(Échecs, Tic Tac Toe, Puissance 4). Branche `useSafeNavInsets` (marges nav) et
`useResponsive` (`contentMaxWidth` + typographie agrandie sur grand écran).

```tsx
<GameStage title="Tic Tac Toe" subtitle="Rounds arcade, duel local et IA imbattable.">
  <TicTacToeGame />
</GameStage>
```

## Patterns d'adaptation par type de jeu

### Plateau carré (Échecs, Dames, Tic Tac Toe, Puissance 4)

Approche **purement CSS**, sans arithmétique `useWindowDimensions` : le plateau
remplit la largeur disponible et se plafonne par classe d'appareil.

```tsx
const { boardMaxSize } = useResponsive();
// style du plateau :
{ width: '100%', aspectRatio: 1, alignSelf: 'center', maxWidth: boardMaxSize }
```

Pour un plateau encadré d'un **cadre/cabine visuel fort** (ex. la cabine arcade
de Tic Tac Toe), plafonner le conteneur à `boardMaxSize + chrome` et le centrer
(`alignSelf: 'center'`) afin que contrôles et scores ne s'étirent pas
exagérément sur tablette pendant que le plateau reste centré.

Pour un plateau **non carré** (Puissance 4 = 7×6), adapter l'`aspectRatio` en
conséquence.

### Table large (Solitaire, Dominos)

La largeur de table suit `tableMaxWidth` ; les éléments (cartes, tuiles) ont un
**cap de taille par classe** via `select`, la logique d'ajustement existante
garantissant que les colonnes ne débordent jamais.

```tsx
const { width, tableMaxWidth, select } = useResponsive();
const contentWidth = Math.max(280, Math.min(width - 48, tableMaxWidth));
const maxCardWidth = select({ phone: 68, tablet: 92, desktop: 104 });
```

### Jeu paysage plein écran (Backgammon, Street Brawl, Dino, Vallombre)

- **Calculer la vraie boîte de contenu** en retranchant les marges nav, avec les
  **mêmes** planchers que la coque (`useSafeNavInsets`), pour que le plateau ne
  passe pas sous l'encoche / l'indicateur d'accueil.
- **Basculer la disposition** selon l'espace : Backgammon utilise un plateau
  horizontal sur grand écran en paysage (`isLargeScreen && isLandscape`) et un
  plateau pivoté sinon, plafonné par `tableMaxWidth`.
- **Garantir les marges des contrôles tactiles** via les planchers `minMargins`
  (Street Brawl : 48dp gauche/droite/bas).

## Règles à respecter

- **Ne pas** dimensionner un plateau via `useWindowDimensions().width - <constante>`
  figée : passer par `useResponsive` (`boardMaxSize` / `tableMaxWidth` / `select`).
- **Ne pas** utiliser `useSafeAreaInsets`/`SafeAreaView` bruts pour les marges nav :
  préférer `useSafeNavInsets` (planchers garantis, surcharge par bord).
- **Classer** la capacité sur le côté le plus court ; **plafonner** la mise en
  page sur la largeur courante.
- **Réutiliser** `GameScreenScaffold` / `GameStage` plutôt que recoder le
  boilerplate fond + safe-area + bouton Retour.

## Fichiers de référence

| Sujet                    | Fichier                                        |
| ------------------------ | ---------------------------------------------- |
| Breakpoints + caps purs  | `src/constants/responsive.ts`                  |
| Échelles spacing + typo  | `src/constants/theme.ts`                       |
| Hook responsive          | `src/hooks/use-responsive.ts`                  |
| Hook marges nav          | `src/hooks/use-safe-nav-insets.ts`             |
| Coque d'écran            | `src/components/game-shell/GameScreenScaffold.tsx` |
| Coque titre + contenu    | `src/components/game-shell/GameStage.tsx`      |
| Exemple plateau carré    | `src/components/chess/ChessGame.tsx`           |
| Exemple table large      | `src/components/solitaire/SolitaireGame.tsx`   |
| Exemple paysage plein    | `src/components/backgammon/BackgammonGame.tsx` |
