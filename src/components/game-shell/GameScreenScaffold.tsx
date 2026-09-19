/**
 * `GameScreenScaffold` — coque d'écran de jeu partagée et responsive.
 *
 * Centralise la mécanique répétée dans chaque écran de `src/app/*` : fond,
 * marges nav garanties (via {@link useSafeNavInsets}), bouton Retour, et boîte
 * de contenu centrée plafonnée en largeur (via {@link useResponsive}).
 *
 * Deux dispositions :
 *  - `scroll` (défaut) : contenu défilant centré, bouton Retour dans le flux —
 *    pour les jeux qui empilent plateau + panneaux (Dames, Échecs, Solitaire…).
 *  - `fill` : plein écran sans défilement, bouton Retour flottant — pour les
 *    jeux dont le plateau occupe toute la hauteur (Backgammon).
 */

import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { BackButton } from '@/components/game-shell/BackButton';
import { useResponsive } from '@/hooks/use-responsive';
import { useSafeNavInsets, type SafeNavInsets } from '@/hooks/use-safe-nav-insets';

/** Fond crème commun à tous les écrans de jeu. */
export const ScreenBackground = '#F4F1EA';

/** Respiration verticale ajoutée au contenu défilant, au-delà des marges nav. */
const ScrollGutterTop = 12;
const ScrollGutterBottom = 24;

type GameScreenScaffoldProps = {
  children: ReactNode;
  /** `scroll` (défaut) = contenu défilant ; `fill` = plein écran sans scroll. */
  variant?: 'scroll' | 'fill';
  /** Largeur max de la boîte de contenu. Défaut : largeur responsive de l'appareil. */
  maxWidth?: number;
  /** Fond de l'écran. Défaut : {@link ScreenBackground}. */
  backgroundColor?: string;
  /**
   * Bouton Retour : `inline` (dans le flux), `floating` (absolu) ou `none`.
   * Défaut : `floating` en `fill`, sinon `inline`.
   */
  backButton?: 'inline' | 'floating' | 'none';
  /** Planchers de marge nav surchargés (transmis à {@link useSafeNavInsets}). */
  navMargins?: Partial<SafeNavInsets>;
  /** Espace vertical entre les enfants de la boîte de contenu (disposition scroll). */
  gap?: number;
  /** Style additionnel sur la boîte de contenu. */
  contentStyle?: StyleProp<ViewStyle>;
};

export function GameScreenScaffold({
  children,
  variant = 'scroll',
  maxWidth,
  backgroundColor = ScreenBackground,
  backButton,
  navMargins,
  gap = 14,
  contentStyle,
}: GameScreenScaffoldProps) {
  const nav = useSafeNavInsets(navMargins);
  const { contentMaxWidth } = useResponsive();
  const resolvedMaxWidth = maxWidth ?? contentMaxWidth;
  const backMode = backButton ?? (variant === 'fill' ? 'floating' : 'inline');

  const floatingBack =
    backMode === 'floating' ? (
      <View style={[styles.floatingBack, { top: nav.top, left: nav.left }]}>
        <BackButton />
      </View>
    ) : null;

  if (variant === 'fill') {
    return (
      <View style={[styles.screen, { backgroundColor }]}>
        <View
          style={[
            styles.fillBody,
            { paddingTop: nav.top, paddingBottom: nav.bottom, paddingLeft: nav.left, paddingRight: nav.right },
          ]}>
          <View style={[styles.fillContent, { maxWidth: resolvedMaxWidth }, contentStyle]}>{children}</View>
        </View>
        {floatingBack}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: nav.top + ScrollGutterTop,
            paddingBottom: nav.bottom + ScrollGutterBottom,
            paddingLeft: nav.left,
            paddingRight: nav.right,
          },
        ]}>
        <View style={[styles.contentBox, { maxWidth: resolvedMaxWidth, gap }, contentStyle]}>
          {backMode === 'inline' ? <BackButton /> : null}
          {children}
        </View>
      </ScrollView>
      {floatingBack}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  contentBox: {
    width: '100%',
  },
  fillBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fillContent: {
    flex: 1,
    width: '100%',
  },
  floatingBack: {
    position: 'absolute',
    zIndex: 20,
  },
});
