/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export type SpacingToken = keyof typeof Spacing;

/**
 * Échelle d'espacement pour les appareils de type tablette (grands écrans).
 * Mêmes clés que `Spacing` : une mise en page peut basculer d'une échelle à
 * l'autre (via `useResponsive`) sans changer les clés qu'elle référence.
 * Le `satisfies` garantit à la compilation que les deux échelles restent
 * synchronisées si une clé est ajoutée ou retirée de `Spacing`.
 */
export const SpacingTablet = {
  half: 4,
  one: 8,
  two: 12,
  three: 24,
  four: 36,
  five: 48,
  six: 96,
} as const satisfies Record<SpacingToken, number>;

/**
 * Échelle typographique partagée par l'application. Chaque rôle porte une
 * taille « téléphone » de base et une surcharge `tablet` (taille + interligne)
 * pour agrandir le texte sur grand écran sans modifier la graisse. Les rôles
 * reflètent les `type` de `ThemedText`, qui peut les adopter à terme.
 */
export const Typography = {
  small: { fontSize: 14, lineHeight: 20, fontWeight: 500, tablet: { fontSize: 16, lineHeight: 24 } },
  default: { fontSize: 16, lineHeight: 24, fontWeight: 500, tablet: { fontSize: 18, lineHeight: 28 } },
  subtitle: { fontSize: 32, lineHeight: 44, fontWeight: 600, tablet: { fontSize: 40, lineHeight: 54 } },
  title: { fontSize: 48, lineHeight: 52, fontWeight: 600, tablet: { fontSize: 60, lineHeight: 66 } },
  link: { fontSize: 14, lineHeight: 30, fontWeight: 400, tablet: { fontSize: 16, lineHeight: 32 } },
  code: { fontSize: 12, lineHeight: 18, fontWeight: 500, tablet: { fontSize: 14, lineHeight: 20 } },
} as const;

export type TypographyRole = keyof typeof Typography;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Largeur maximale du contenu sur tablette (mise en page plus large que le téléphone). */
export const MaxContentWidthTablet = 1100;
