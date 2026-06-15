// AUTO-GÉNÉRÉ par scripts/generate-tarot-assets.mjs — NE PAS ÉDITER À LA MAIN.
// Régénérer via `npm run assets:tarot`.
//
// Table de correspondance identifiant de carte (`TarotCard.id`) → asset PNG.
// Le bundler Metro résout les `require()` statiquement : un chemin construit
// dynamiquement (`require(\`...${id}.png\`)`) ne fonctionne pas. D'où cette
// table exhaustive, régénérée avec les images pour rester synchronisée.

import type { ImageSourcePropType } from 'react-native';

import type { TarotCard } from '@/game/tarot';

/** Face visible de chaque carte du paquet, indexée par `TarotCard.id`. */
export const TAROT_CARD_ASSETS: Record<string, ImageSourcePropType> = {
  'suit-spades-1': require('@/assets/game/tarot/suit-spades-1.png'),
  'suit-spades-2': require('@/assets/game/tarot/suit-spades-2.png'),
  'suit-spades-3': require('@/assets/game/tarot/suit-spades-3.png'),
  'suit-spades-4': require('@/assets/game/tarot/suit-spades-4.png'),
  'suit-spades-5': require('@/assets/game/tarot/suit-spades-5.png'),
  'suit-spades-6': require('@/assets/game/tarot/suit-spades-6.png'),
  'suit-spades-7': require('@/assets/game/tarot/suit-spades-7.png'),
  'suit-spades-8': require('@/assets/game/tarot/suit-spades-8.png'),
  'suit-spades-9': require('@/assets/game/tarot/suit-spades-9.png'),
  'suit-spades-10': require('@/assets/game/tarot/suit-spades-10.png'),
  'suit-spades-11': require('@/assets/game/tarot/suit-spades-11.png'),
  'suit-spades-12': require('@/assets/game/tarot/suit-spades-12.png'),
  'suit-spades-13': require('@/assets/game/tarot/suit-spades-13.png'),
  'suit-spades-14': require('@/assets/game/tarot/suit-spades-14.png'),
  'suit-hearts-1': require('@/assets/game/tarot/suit-hearts-1.png'),
  'suit-hearts-2': require('@/assets/game/tarot/suit-hearts-2.png'),
  'suit-hearts-3': require('@/assets/game/tarot/suit-hearts-3.png'),
  'suit-hearts-4': require('@/assets/game/tarot/suit-hearts-4.png'),
  'suit-hearts-5': require('@/assets/game/tarot/suit-hearts-5.png'),
  'suit-hearts-6': require('@/assets/game/tarot/suit-hearts-6.png'),
  'suit-hearts-7': require('@/assets/game/tarot/suit-hearts-7.png'),
  'suit-hearts-8': require('@/assets/game/tarot/suit-hearts-8.png'),
  'suit-hearts-9': require('@/assets/game/tarot/suit-hearts-9.png'),
  'suit-hearts-10': require('@/assets/game/tarot/suit-hearts-10.png'),
  'suit-hearts-11': require('@/assets/game/tarot/suit-hearts-11.png'),
  'suit-hearts-12': require('@/assets/game/tarot/suit-hearts-12.png'),
  'suit-hearts-13': require('@/assets/game/tarot/suit-hearts-13.png'),
  'suit-hearts-14': require('@/assets/game/tarot/suit-hearts-14.png'),
  'suit-diamonds-1': require('@/assets/game/tarot/suit-diamonds-1.png'),
  'suit-diamonds-2': require('@/assets/game/tarot/suit-diamonds-2.png'),
  'suit-diamonds-3': require('@/assets/game/tarot/suit-diamonds-3.png'),
  'suit-diamonds-4': require('@/assets/game/tarot/suit-diamonds-4.png'),
  'suit-diamonds-5': require('@/assets/game/tarot/suit-diamonds-5.png'),
  'suit-diamonds-6': require('@/assets/game/tarot/suit-diamonds-6.png'),
  'suit-diamonds-7': require('@/assets/game/tarot/suit-diamonds-7.png'),
  'suit-diamonds-8': require('@/assets/game/tarot/suit-diamonds-8.png'),
  'suit-diamonds-9': require('@/assets/game/tarot/suit-diamonds-9.png'),
  'suit-diamonds-10': require('@/assets/game/tarot/suit-diamonds-10.png'),
  'suit-diamonds-11': require('@/assets/game/tarot/suit-diamonds-11.png'),
  'suit-diamonds-12': require('@/assets/game/tarot/suit-diamonds-12.png'),
  'suit-diamonds-13': require('@/assets/game/tarot/suit-diamonds-13.png'),
  'suit-diamonds-14': require('@/assets/game/tarot/suit-diamonds-14.png'),
  'suit-clubs-1': require('@/assets/game/tarot/suit-clubs-1.png'),
  'suit-clubs-2': require('@/assets/game/tarot/suit-clubs-2.png'),
  'suit-clubs-3': require('@/assets/game/tarot/suit-clubs-3.png'),
  'suit-clubs-4': require('@/assets/game/tarot/suit-clubs-4.png'),
  'suit-clubs-5': require('@/assets/game/tarot/suit-clubs-5.png'),
  'suit-clubs-6': require('@/assets/game/tarot/suit-clubs-6.png'),
  'suit-clubs-7': require('@/assets/game/tarot/suit-clubs-7.png'),
  'suit-clubs-8': require('@/assets/game/tarot/suit-clubs-8.png'),
  'suit-clubs-9': require('@/assets/game/tarot/suit-clubs-9.png'),
  'suit-clubs-10': require('@/assets/game/tarot/suit-clubs-10.png'),
  'suit-clubs-11': require('@/assets/game/tarot/suit-clubs-11.png'),
  'suit-clubs-12': require('@/assets/game/tarot/suit-clubs-12.png'),
  'suit-clubs-13': require('@/assets/game/tarot/suit-clubs-13.png'),
  'suit-clubs-14': require('@/assets/game/tarot/suit-clubs-14.png'),
  'trump-1': require('@/assets/game/tarot/trump-1.png'),
  'trump-2': require('@/assets/game/tarot/trump-2.png'),
  'trump-3': require('@/assets/game/tarot/trump-3.png'),
  'trump-4': require('@/assets/game/tarot/trump-4.png'),
  'trump-5': require('@/assets/game/tarot/trump-5.png'),
  'trump-6': require('@/assets/game/tarot/trump-6.png'),
  'trump-7': require('@/assets/game/tarot/trump-7.png'),
  'trump-8': require('@/assets/game/tarot/trump-8.png'),
  'trump-9': require('@/assets/game/tarot/trump-9.png'),
  'trump-10': require('@/assets/game/tarot/trump-10.png'),
  'trump-11': require('@/assets/game/tarot/trump-11.png'),
  'trump-12': require('@/assets/game/tarot/trump-12.png'),
  'trump-13': require('@/assets/game/tarot/trump-13.png'),
  'trump-14': require('@/assets/game/tarot/trump-14.png'),
  'trump-15': require('@/assets/game/tarot/trump-15.png'),
  'trump-16': require('@/assets/game/tarot/trump-16.png'),
  'trump-17': require('@/assets/game/tarot/trump-17.png'),
  'trump-18': require('@/assets/game/tarot/trump-18.png'),
  'trump-19': require('@/assets/game/tarot/trump-19.png'),
  'trump-20': require('@/assets/game/tarot/trump-20.png'),
  'trump-21': require('@/assets/game/tarot/trump-21.png'),
  'excuse': require('@/assets/game/tarot/excuse.png'),
};

/** Assets de décor (hors paquet) : dos de carte, logo, tapis, aperçu. */
export const TAROT_DECOR_ASSETS = {
  back: require('@/assets/game/tarot/back.png'),
  logo: require('@/assets/game/tarot/logo.png'),
  table: require('@/assets/game/tarot/bg-table.png'),
  preview: require('@/assets/game/tarot/preview.png'),
} as const;

/** Source d'image de la face d'une carte d'après son identifiant moteur. */
export function tarotCardAsset(card: TarotCard): ImageSourcePropType {
  return TAROT_CARD_ASSETS[card.id];
}
