# Games

Application mobile Expo / React Native regroupant plusieurs jeux classiques, jouables en local contre l'IA ou en solo selon le jeu.

## Jeux inclus

- **Dames** : choix de la couleur du joueur, mode 1 vs 1 ou 1 vs IA, moteur de coups, captures, dames, dernier mouvement IA marqué visuellement.
- **Echecs** : choix de la couleur, niveaux d'IA, moteur base sur `chess.js`, pieces PNG dediees, dernier mouvement IA marque.
- **Backgammon** : plateau mobile optimise, pions, prison au centre, zones de sortie, lancers de des et moteur de jeu.
- **Dominos** : mode 1 vs IA, tuiles classiques en PNG, chaine en serpent lisible sur mobile, IA et pioche.
- **Solitaire** : Klondike avec pioche infinie ou limitee a 3 passages.
- **Dino Run** : runner inspire du jeu hors ligne de Chrome, cactus, oiseaux, nuages, score, alternance jour/nuit tous les 250 points et leaderboard persistant.

L'accueil affiche une liste de jeux avec une vignette graphique et un bouton `?` qui ouvre les regles de chaque jeu.

## Stack

- Expo SDK 56
- React Native 0.85
- React 19
- Expo Router
- TypeScript
- `expo-image` pour les assets PNG
- `chess.js` pour le moteur d'echecs
- `@react-native-async-storage/async-storage` pour le leaderboard Dino
- EAS Build pour la creation d'APK preview

## Configuration app

- Nom affiche : `Games`
- Android package : `com.ronylicha.games`
- EAS project : `b675206c-2314-4bdd-b87c-904befe75f62`
- Scheme : `games`
- Orientation : portrait

## Installation

```bash
npm install
```

## Lancement local

```bash
npm run start
```

Puis ouvrir dans Expo Go, un emulateur Android, un simulateur iOS ou le web.

Commandes utiles :

```bash
npm run android
npm run ios
npm run web
```

## Verification

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform web --output-dir dist-web-check
rm -rf dist-web-check
```

## Build APK preview avec EAS

Le profil `preview` dans [eas.json](./eas.json) genere un APK Android installable :

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
  chess.tsx        Route Echecs
  backgammon.tsx   Route Backgammon
  dominos.tsx      Route Dominos
  solitaire.tsx    Route Solitaire
  dino.tsx         Route Dino Run

src/components/
  checkers/        UI Dames
  chess/           UI Echecs
  backgammon/      UI Backgammon
  dominoes/        UI Dominos
  solitaire/       UI Solitaire
  dino/            UI et boucle de jeu Dino Run
  game-shell/      Layout commun des ecrans de jeu

src/game/
  checkers/        Moteur et IA Dames
  backgammon/      Moteur Backgammon
  dominoes/        Moteur Dominos
  solitaire/       Moteur Solitaire

assets/game/
  checkers/        Pions et textures Dames
  chess/           Pieces Echecs PNG
  dominoes/        Tuiles Dominos PNG
  dino/            Sprites Dino Run PNG
```

## Assets

Les assets de jeu sont des PNG transparents generes localement et stockes dans `assets/game`.

Le logo et les icones de l'application sont dans `assets/images` :

- `icon.png`
- `app-logo.png`
- `splash-icon.png`
- `favicon.png`
- `android-icon-foreground.png`
- `android-icon-background.png`
- `android-icon-monochrome.png`

## Licence et contributions

Ce depot utilise un modele de licence separe par type de contenu :

- **Code, documentation, scripts, configuration et tests** : GPL-3.0-only. Voir [LICENSE](./LICENSE).
- **Assets originaux du jeu et branding** : proprietaires. Voir [ASSETS-LICENSE.md](./ASSETS-LICENSE.md).
- **Nom, logo, identite visuelle et package Android `com.ronylicha.games`** : reserves a l'application officielle. Voir [TRADEMARKS.md](./TRADEMARKS.md).
- **Contributions** : soumises a un CLA. Voir [CLA.md](./CLA.md) et [CONTRIBUTING.md](./CONTRIBUTING.md).

Les forks du code sont autorises sous GPLv3, mais les versions publiques modifiees doivent remplacer les assets proprietaires et le branding officiel.

## Notes de gameplay

### Dino Run

- Appui sur le plateau ou sur `Sauter` pour sauter.
- `Baisser` maintenu pour passer sous certains oiseaux.
- Les obstacles et sprites sont volontairement petits pour conserver une grande surface de jeu.
- Le mode nuit alterne tous les 250 points.
- Si le score entre dans le top 5, une modale custom demande le nom du joueur.
- Le leaderboard est persistant via AsyncStorage.

### Dominos

- Le mode 1 vs 1 est retire : seul le mode 1 vs IA est conserve.
- La chaine est rendue en lignes de 5 tuiles sur mobile pour rester lisible.
- Les lignes alternent gauche/droite avec des connecteurs verticaux.

### Backgammon

- Le plateau est optimise pour l'ecran mobile.
- Les pions captures sont empiles au centre pour eviter de cacher les fleches.
- Les marges et espacements ont ete ajustes pour conserver un plateau jouable.

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

- Le dossier `screenshots/` est ignore par Git et sert uniquement aux captures de verification locales.
- Les dossiers natifs `ios/` et `android/` ne sont pas versionnes ; ils sont generes par Expo/EAS si necessaire.
