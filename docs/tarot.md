# Tarot français (4 joueurs)

Documentation du jeu de **Tarot français** : règles implémentées, architecture
du moteur, types partagés, formule de score, IA et couche d'interface.

Le code vit dans :

- `src/game/tarot/` — moteur de règles pur (sans dépendance React/UI).
- `src/components/tarot/` — composants React Native + hook orchestrateur.
- `src/app/tarot.tsx` — route Expo Router de l'écran.
- `assets/game/tarot/` — 78 cartes PNG + décors (dos, table, logo, preview).

## Vue d'ensemble

Tarot à **4 joueurs**, un humain (`index 0`) contre trois IA, en mode *un contre
tous* : le **preneur** joue seul contre la **défense**. Une donne suit toujours
les phases `dealing → bidding → discard → playing → scoring → finished`
(cf. `TarotPhase`).

Règles côté joueur (reprises de l'écran d'accueil) :

1. Enchéris de la **Petite** à la **Garde Contre**, puis prends le chien pour
   devenir preneur.
2. Constitue ton **écart** sans y glisser de Roi, de bout ni l'Excuse.
3. Fournis la couleur demandée, **coupe à l'atout** sinon ; l'Excuse échappe à
   toute obligation.
4. Atteins ton **seuil de points** (36 à 56 selon tes bouts) pour remporter le
   contrat.

## Le paquet (78 cartes)

| Catégorie | Détail | Cartes |
| --- | --- | --- |
| Couleurs | 4 enseignes × 14 rangs (1–10, Valet, Cavalier, Dame, Roi) | 56 |
| Atouts | numérotés 1 à 21 | 21 |
| Excuse | le Fou, sans couleur ni rang | 1 |

Les **bouts** (oudlers) sont le **Petit** (atout 1), le **21** et l'**Excuse**.
Le nombre de bouts détenus par le preneur fixe son seuil de points à atteindre.

## Modèle de données (`types.ts`)

`TarotCard` est une **union discriminée** sur `kind`, ce qui rend un atout-avec-
couleur impossible à représenter :

```ts
type TarotCard =
  | { id: string; kind: 'suit'; suit: TarotSuit; rank: TarotSuitRank }  // 1..14
  | { id: string; kind: 'trump'; rank: TarotTrumpRank }                 // 1..21
  | { id: string; kind: 'excuse' };
```

Types transverses : `TarotPlayer` (`index`, `name`, `isHuman`), `TarotTeam`
(`'taker' | 'defense'`), `TarotPhase`, `TarotPlay` (`player`, `card`) et
`TarotTrick` (`leader`, `plays[]`, `winner | null`).

## Règles figées (`constants.ts`)

`constants.ts` est la **source de vérité** des règles ; il ne dépend d'aucun
autre module et les types du moteur en dérivent.

- Distribution 4 joueurs : `TAROT_HAND_SIZE = 18`, `TAROT_DOG_SIZE = 6`
  (chien), donne par paquets de `TAROT_DEAL_BATCH = 3`.
- Valeur des cartes (**système demi-points**, total `91`) :
  bout/Roi `4,5` · Dame `3,5` · Cavalier `2,5` · Valet `1,5` · autre `0,5`.
- Contrats et multiplicateurs (`TAROT_CONTRACTS`) :
  Passe `0` · Petite `1` · Garde `2` · Garde Sans `4` · Garde Contre `6`.
- Seuil selon les bouts (`TAROT_TARGET_BY_BOUTS`) : 0→56, 1→51, 2→41, 3→36.
- Primes : `TAROT_BASE_SCORE = 25`, petit au bout `±10` (×contrat),
  poignée 20/30/40 (10/13/15 atouts), chelem +400 / +200 / −200.

## Architecture du moteur

Tout est importable via le barrel `@/game/tarot` (`index.ts`). Modules et API
publique principale :

### `deck.ts` — paquet & distribution

- `createTarotDeck()` → 78 cartes ordonnées.
- `shuffleTarotDeck(cards)` → copie mélangée (Fisher–Yates, pur).
- `distributeTarot(deck, players=4)` / `dealTarot(players=4)` → `TarotDeal`
  (`hands[]` + `chien`).
- Prédicats : `isExcuse`, `isTrump`, `isBout`.

### `bidding.ts` — enchères

Machine à états des annonces. `createBiddingState(...)`, `availableContracts`,
`canBid`, `applyBid`, `everyonePassed`, `biddingResult`. Un joueur ne peut
annoncer qu'un contrat **strictement supérieur** au plus haut déjà posé
(`contractRank`). Si tout le monde passe, la donne est rejouée.

### `discard.ts` — chien & écart

- `contractRequiresEcart(contract)` — l'écart n'existe qu'en Petite/Garde
  (en Garde Sans le chien va au preneur sans manipulation, en Garde Contre il
  va à la défense).
- `resolveChien(...)` → à qui revient le chien (`'ecart' | 'taker' | 'defense'`).
- `validateEcart(...)` → contrôle de l'écart : bon nombre de cartes, **interdit**
  Rois et bouts, atouts tolérés seulement si nécessaire et alors **montrés**
  (`isFreelyDiscardable`, `isDiscardableTrump`, `maxTrumpsInEcart`).
- `applyEcart(...)` → main du preneur après écart + cartes mises de côté.

### `play.ts` — jeu de la carte

- `legalPlays(hand, plays)` / `isLegalPlay(card, hand, plays)` — applique la
  hiérarchie d'obligations : **fournir la couleur** demandée, sinon **couper**
  (et surcouper si possible), l'Excuse étant toujours jouable.
- `ledSuit(plays)` (couleur ou `'trump'`), `highestTrumpRank(plays)`.
- `createTrick(leader)`, `playInTrick`, `isTrickComplete`, `resolveTrick`,
  `trickWinner(plays)`, `trickWonByTrump(plays)`.

### `scoring.ts` — décompte

- `cardPointValue(card)`, `countCardPoints(cards)`, `countBouts(cards)`,
  `targetPoints(boutCount)`.
- `scoreContract(input: TarotScoreInput)` → `TarotScoreResult` détaillé.
- `scoreContractFromCards(...)` — variante qui compte directement depuis les
  cartes gagnées par le preneur.

**Formule** (par défenseur, du point de vue du preneur) :

```text
perDefender = signe × (25 + écart) × multiplicateur   // socle du contrat
            + petit au bout (±10 × multiplicateur)     // au camp réalisateur
            + signe × poignée                          // prime forfaitaire
            + chelem                                   // prime forfaitaire
```

`signe = +1` si le seuil est atteint (contrat réussi), `−1` sinon. `écart` est
la valeur absolue de (points réalisés − seuil). Le **petit au bout** est
indépendant du résultat du contrat. Le score du preneur vaut
`perDefender × (playerCount − 1)`, chaque défenseur paie `−perDefender`
(somme nulle).

### `ai.ts` — adversaires (fonctions pures)

- Enchères : `evaluateBiddingStrength(hand)` (heuristique bouts/atouts/figures),
  `suggestContract(hand)`, `chooseBid(hand, state)`.
- Écart : `chooseEcart(combinedHand, chienSize)` — défausse les basses cartes
  sans toucher aux Rois/bouts.
- Jeu : `chooseCardToPlay(context: TarotPlayContext)` — entame prudente, charge
  les points quand le partenaire tient le pli, coiffe l'adversaire au moindre
  coût sinon défausse (en lâchant l'Excuse pour préserver ce bout).

## Couche interface (`src/components/tarot/`)

| Fichier | Rôle |
| --- | --- |
| `use-tarot-game.ts` | Hook orchestrateur : `useReducer` pur (`tarotReducer`) + effet qui pilote les IA par timeout. Pièces pures exportées pour les tests : `createInitialState`, `tarotReducer`, `aiActionFor`, `currentActor`, types `TarotGameState`/`TarotAction`. |
| `TarotGame.tsx` | Orchestrateur présentationnel **contrôlé** : reçoit un `TarotGameController` (vue à plat) et compose les panneaux selon la phase. Aucune règle dupliquée. |
| `BiddingPanel.tsx` | Phase d'enchères (contrats disponibles, passe). |
| `TarotTable.tsx` | Pli en cours + mains, coups légaux mis en évidence. |
| `TarotCard.tsx` | Atome `React.memo` (expo-image + Pressable) affichant une carte. |
| `Scoreboard.tsx` | Décompte de la donne (`TarotScoreResult`) + cumuls. |
| `tarotAssets.ts` | Résolution des modules PNG (carte → asset). |

Le hook expose `UseTarotGameResult` (`state`, `currentPlayer`, `isHumanTurn`,
`humanLegalCards`, `bid`, `setEcart`, `playCard`, `nextDeal`, `newGame`). La
route `src/app/tarot.tsx` **projette** ce résultat vers le `TarotGameController`
attendu par `TarotGame` (seul point de jonction entre les deux contrats), le
tout enveloppé dans `GameStage`.

`humanPlayer = 0` par défaut ; le mettre à `-1` lance 4 IA (utile aux tests de
simulation de donnes complètes).

## Assets

`assets/game/tarot/` contient les **78 cartes** (`suit-<couleur>-<rang>.png`,
`trump-<n>.png`, `excuse.png`) plus les décors (`back.png`, `bg-table.png`,
`logo.png`, `preview.png`). Régénération :

```bash
npm run assets:tarot   # node ./scripts/generate-tarot-assets.mjs
```

## Tests

Le moteur est composé de fonctions pures, testables isolément (paquet/distribution,
enchères, écart, plis, scoring) ; le hook expose ses briques pures
(`tarotReducer`, `aiActionFor`, `createInitialState`) pour simuler des donnes
complètes sans rendu React.
