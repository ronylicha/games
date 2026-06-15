// Carte de Tarot : atome d'affichage d'une carte du paquet (face ou dos).
//
// Composant présentational pur : il ne connaît ni l'état de la partie ni les
// règles. Il rend l'image de la carte (via la table d'assets auto-générée) à la
// taille demandée, gère la mise en évidence (sélection), l'état non-jouable
// (grisé) et un éventuel `onPress`. La face est résolue par `tarotCardAsset` —
// jamais par un `require()` dynamique (incompatible avec le bundler Metro).

import { Image } from 'expo-image';
import { memo } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import type { TarotCard as TarotCardModel } from '@/game/tarot';

import { TAROT_DECOR_ASSETS, tarotCardAsset } from './tarotAssets';

/** Ratio largeur/hauteur des assets de cartes (200 × 300). */
const CARD_ASPECT_RATIO = 200 / 300;
/** Largeur par défaut d'une carte, en pixels. */
const DEFAULT_CARD_WIDTH = 72;

export type TarotCardProps = {
  /** Carte à afficher (sa face). Ignorée lorsque `faceDown` est vrai. */
  card: TarotCardModel;
  /** Affiche le dos de la carte au lieu de sa face. */
  faceDown?: boolean;
  /** Largeur de la carte en pixels ; la hauteur découle du ratio 2:3. */
  width?: number;
  /** Carte mise en évidence (sélectionnée dans la main). */
  selected?: boolean;
  /** Carte non jouable : grisée et non pressable. */
  disabled?: boolean;
  /** Rappelé au tap avec la carte ; rend la carte pressable s'il est fourni. */
  onPress?: (card: TarotCardModel) => void;
  /** Style additionnel du conteneur. */
  style?: StyleProp<ViewStyle>;
  /** Identifiant de test. */
  testID?: string;
};

const SUIT_LABELS: Record<string, string> = {
  spades: 'pique',
  hearts: 'cœur',
  diamonds: 'carreau',
  clubs: 'trèfle',
};

const FIGURE_LABELS: Record<number, string> = {
  11: 'Valet',
  12: 'Cavalier',
  13: 'Dame',
  14: 'Roi',
};

/** Libellé français lisible d'une carte (pour l'accessibilité). */
function tarotCardLabel(card: TarotCardModel): string {
  if (card.kind === 'excuse') {
    return 'Excuse';
  }
  if (card.kind === 'trump') {
    return `Atout ${card.rank}`;
  }
  const suit = SUIT_LABELS[card.suit] ?? card.suit;
  const figure = FIGURE_LABELS[card.rank];
  return figure ? `${figure} de ${suit}` : `${card.rank} de ${suit}`;
}

/**
 * Affiche une carte de Tarot. Sans `onPress`, le rendu est statique (rôle
 * « image ») ; avec `onPress` et hors état `disabled`, la carte devient un
 * bouton accessible.
 */
export const TarotCard = memo(function TarotCard({
  card,
  faceDown = false,
  width = DEFAULT_CARD_WIDTH,
  selected = false,
  disabled = false,
  onPress,
  style,
  testID,
}: TarotCardProps) {
  const height = width / CARD_ASPECT_RATIO;
  const source = faceDown ? TAROT_DECOR_ASSETS.back : tarotCardAsset(card);
  const label = faceDown ? 'Carte face cachée' : tarotCardLabel(card);

  const surface = (
    <View
      style={[
        styles.card,
        { width, height, borderRadius: width * 0.09 },
        selected && styles.selected,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Image source={source} style={styles.image} contentFit="cover" />
    </View>
  );

  if (!onPress || disabled) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        testID={testID}
      >
        {surface}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(card)}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {surface}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selected: {
    transform: [{ translateY: -10 }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
});
