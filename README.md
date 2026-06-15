# Games

Games est une collection de jeux classiques jouables directement sur mobile et sur le web. Le projet réunit des jeux de plateau, de réflexion et d'arcade dans une interface unique, avec IA locale, assets dédiés, sauvegarde automatique et version web prête à tester.

Tester les jeux en ligne :

```text
https://ronylicha.github.io/games/
```

## Pourquoi Games

- Une seule application pour jouer aux classiques incontournables.
- Des parties contre l'IA ou en local selon le jeu.
- Des règles accessibles depuis le bouton `?` de chaque jeu.
- Des assets PNG transparents générés pour l'application.
- Une version mobile Expo et une version web publiée sur GitHub Pages.
- Sauvegarde automatique des parties principales et leaderboard persistant pour Dino Run.

## Jeux disponibles

### Dames

Un jeu de dames complet avec moteur de coups, captures, promotion en dame et marquage visuel du dernier mouvement joué par l'IA.

- 1 vs IA ou 1 vs 1 local.
- Choix de la couleur du joueur.
- Détection des coups légaux et captures.
- Sauvegarde automatique de la partie tant qu'une nouvelle partie n'est pas lancée.

### Échecs

Une expérience d'échecs lisible et rapide, basée sur `chess.js`, avec vrais pions PNG, choix de couleur et niveaux d'IA.

- Choix blanc/noir.
- Niveaux facile, normal et difficile.
- 1 vs IA ou 1 vs 1 local.
- Dernier coup IA mis en évidence.
- Sauvegarde automatique de la partie.

### Backgammon

Un backgammon adapté aux petits écrans et confortable sur desktop web. Le plateau reste optimisé sur mobile, puis revient horizontal sur grand écran web.

- Lancers de dés et coups légaux.
- 1 vs IA ou 1 vs 1 local.
- Pions capturés empilés au centre.
- Zones de sortie visibles.
- Dernier coup IA marqué.
- Sauvegarde automatique.

### Dominos

Un jeu de dominos contre l'IA avec tuiles classiques, chaîne lisible et plateau pensé pour les écrans mobiles.

- Mode 1 vs IA uniquement.
- Pioche et coups légaux.
- Chaîne en serpent par lignes de 5 tuiles pour rester lisible.
- Connecteurs verticaux par rotation de tuile.
- Assets de dominos classiques.

### Solitaire

Un Klondike jouable en solo avec options de pioche et sauvegarde automatique.

- Pioche infinie ou limitée à 3 passages.
- Déplacement des cartes selon les règles classiques.
- Fondations, tableau, réserve et défausse.
- Reprise automatique de la partie en cours.

### Tarot

Le Tarot français à 4 joueurs au complet : un humain contre trois IA, en *un contre tous*. Une donne enchaîne enchères, prise du chien, écart et plis, puis décompte au seuil de bouts. Voir la [documentation détaillée du Tarot](./docs/tarot.md).

- Paquet complet de 78 cartes (56 couleurs, 21 atouts, l'Excuse).
- Enchères de la Petite à la Garde Contre.
- Écart contrôlé (pas de Roi, de bout ni d'Excuse).
- Coups légaux : fourniture de la couleur, coupe à l'atout, Excuse libre.
- Décompte demi-points avec petit au bout, poignée et chelem.
- IA d'enchères, d'écart et de jeu de la carte.

### Dino Run

Un runner inspiré des jeux d'arcade minimalistes, avec cactus, oiseaux, nuages, score, passage jour/nuit et leaderboard.

- Cactus, oiseaux et obstacles animés.
- Score, record et vitesse.
- Alternance jour/nuit tous les 250 points.
- Leaderboard top 5 persistant.
- Modale custom de saisie du nom en fin de partie.
- Sur web desktop, flèche haut pour sauter et flèche bas pour se baisser.

## Plateformes

- Web : https://ronylicha.github.io/games/
- Android : APK preview via EAS Build.
- iOS : compatible Expo/EAS.
- Local : Expo Go, émulateur Android, simulateur iOS ou navigateur.

## Stack

- Expo SDK 56
- React Native 0.85
- React 19
- Expo Router
- TypeScript
- `expo-image` pour les assets PNG
- `chess.js` pour le moteur d'échecs
- `@react-native-async-storage/async-storage` pour la persistance
- GitHub Pages pour la version web
- EAS Build pour les APK preview

## Configuration app

- Nom affiché : `Games`
- Android package : `com.ronylicha.games`
- EAS project : `b675206c-2314-4bdd-b87c-904befe75f62`
- Scheme : `games`
- Orientation mobile : portrait
- URL web : `https://ronylicha.github.io/games/`

## Installation

```bash
npm install
```

## Lancement local

```bash
npm run start
```

Commandes utiles :

```bash
npm run android
npm run ios
npm run web
```

## Vérification

```bash
npx tsc --noEmit
npm run lint
EXPO_BASE_URL=/games npm run export:web
```

## Déploiement web GitHub Pages

La version web est exportée avec Expo et publiée par GitHub Actions. Le workflow [deploy-web.yml](./.github/workflows/deploy-web.yml) se lance automatiquement à chaque push sur `main` et peut aussi être lancé manuellement depuis l'onglet Actions.

Dans les réglages GitHub du dépôt, **Pages > Build and deployment > Source** doit être configuré sur **GitHub Actions**.

Le build Pages utilise `EXPO_BASE_URL=/games` pour que les assets Expo soient servis correctement depuis le sous-chemin GitHub Pages du dépôt.

## Release automatique au merge d'une PR

Quand une pull request est fusionnée dans `main`, le workflow [release.yml](./.github/workflows/release.yml) lit la version de [package.json](./package.json) et, si le tag `v<version>` n'existe pas encore, le crée et le pousse automatiquement, puis publie une GitHub Release.

- Les notes de version sont reprises de `docs/releases/<version>.md` si le fichier existe, sinon générées automatiquement à partir de l'historique.
- Le workflow est **idempotent** : fusionner une PR qui ne change pas la version (tag déjà présent) est sans effet.
- Il peut aussi être déclenché manuellement depuis l'onglet Actions (`workflow_dispatch`).

Pour publier une nouvelle version : bumper `version` dans `package.json` (et idéalement ajouter `docs/releases/<version>.md`) dans la PR ; le tag et la release sont créés au merge.

## Build APK preview avec EAS

Le profil `preview` dans [eas.json](./eas.json) génère un APK Android installable :

```bash
eas build --platform android --profile preview
```

En mode non interactif :

```bash
eas build --platform android --profile preview --non-interactive
```

## Tests

Les moteurs de jeu (fonctions pures) sont testés avec le **lanceur de tests natif de Node** (`node:test`, Node 24) — sans dépendance supplémentaire. Un petit resolveur ESM ([scripts/ts-test-loader.mjs](./scripts/ts-test-loader.mjs)) transpile le TypeScript via le paquet `typescript` déjà installé et résout l'alias `@/`.

```bash
npm test            # exécute tous les fichiers src/**/*.test.ts
```

Les fichiers de test sont co-localisés avec le code (ex. `src/game/tarot/play.test.ts` couvre le moteur de plis du Tarot).

## Structure principale

```text
src/app/
  index.tsx        Accueil et liste des jeux
  checkers.tsx     Route Dames
  chess.tsx        Route Échecs
  backgammon.tsx   Route Backgammon
  dominos.tsx      Route Dominos
  solitaire.tsx    Route Solitaire
  dino.tsx         Route Dino Run

src/components/
  checkers/        UI Dames
  chess/           UI Échecs
  backgammon/      UI Backgammon
  dominoes/        UI Dominos
  solitaire/       UI Solitaire
  dino/            UI et boucle de jeu Dino Run
  game-shell/      Layout commun des écrans de jeu

src/game/
  checkers/        Moteur et IA Dames
  backgammon/      Moteur Backgammon
  dominoes/        Moteur Dominos
  solitaire/       Moteur Solitaire

assets/game/
  checkers/        Pions et textures Dames
  chess/           Pièces Échecs PNG
  dominoes/        Tuiles Dominos PNG
  dino/            Sprites Dino Run PNG
```

## Assets

Les assets de jeu sont des PNG transparents générés localement et stockés dans `assets/game`.

Le logo et les icônes de l'application sont dans `assets/images` :

- `icon.png`
- `app-logo.png`
- `splash-icon.png`
- `favicon.png`
- `android-icon-foreground.png`
- `android-icon-background.png`
- `android-icon-monochrome.png`

## Licence et contributions

Ce dépôt utilise un modèle de licence séparé par type de contenu :

- **Code, documentation, scripts, configuration et tests** : GPL-3.0-only. Voir [LICENSE](./LICENSE).
- **Assets originaux du jeu et branding** : propriétaires. Voir [ASSETS-LICENSE.md](./ASSETS-LICENSE.md).
- **Nom, logo, identité visuelle et package Android `com.ronylicha.games`** : réservés à l'application officielle. Voir [TRADEMARKS.md](./TRADEMARKS.md).
- **Contributions** : soumises à un CLA. Voir [CLA.md](./CLA.md) et [CONTRIBUTING.md](./CONTRIBUTING.md).

Les forks du code sont autorisés sous GPLv3, mais les versions publiques modifiées doivent remplacer les assets propriétaires et le branding officiel.

## Git

Remote principal :

```bash
git@github.com:ronylicha/games.git
```

Branche principale :

```bash
main
```

## Remarques

- Le dossier `screenshots/` est ignoré par Git et sert uniquement aux captures de vérification locales.
- Les dossiers natifs `ios/` et `android/` ne sont pas versionnés ; ils sont générés par Expo/EAS si nécessaire.
