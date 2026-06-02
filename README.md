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

## Build APK preview avec EAS

Le profil `preview` dans [eas.json](./eas.json) génère un APK Android installable :

```bash
eas build --platform android --profile preview
```

En mode non interactif :

```bash
eas build --platform android --profile preview --non-interactive
```

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
