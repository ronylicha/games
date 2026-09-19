/**
 * `useSafeNavInsets` — marges « nav » garanties sur les quatre bords.
 *
 * Combine les insets de zone sûre du système (encoche, barre d'état, indicateur
 * d'accueil, coins arrondis, et — en paysage — les bords gauche/droite) avec un
 * plancher minimal adapté à la classe d'appareil. Chaque bord vaut
 * `Math.max(insetSystème, plancher)`, garantissant que les boutons de navigation
 * (Retour) et les contrôles près des bords ne touchent jamais le bord de l'écran,
 * y compris sur Android sans encoche (où le système rapporte 0).
 *
 * Les écrans paysage (Dino, Street Brawl, Vallombre) peuvent relever le plancher
 * d'un bord précis via `minMargins` (ex. garantir 48dp en bas/gauche/droite pour
 * les contrôles tactiles).
 */

import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/use-responsive';

/** Marges garanties, en points logiques (dp), par bord. */
export interface SafeNavInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Plancher minimal par bord sur téléphone. */
export const PhoneNavFloor: SafeNavInsets = { top: 18, right: 16, bottom: 20, left: 16 };

/** Plancher minimal par bord sur grand écran (tablette / desktop). */
export const LargeScreenNavFloor: SafeNavInsets = { top: 24, right: 24, bottom: 28, left: 24 };

/**
 * Retourne les marges nav garanties.
 *
 * @param minMargins Planchers minimaux par bord surchargeant les valeurs par
 *   défaut liées à l'appareil. Un bord omis conserve son plancher par défaut.
 *   Le résultat reste `Math.max(insetSystème, plancher)`.
 */
export function useSafeNavInsets(minMargins?: Partial<SafeNavInsets>): SafeNavInsets {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();

  const minTop = minMargins?.top;
  const minRight = minMargins?.right;
  const minBottom = minMargins?.bottom;
  const minLeft = minMargins?.left;

  return useMemo<SafeNavInsets>(() => {
    const floor = isLargeScreen ? LargeScreenNavFloor : PhoneNavFloor;
    return {
      top: Math.max(insets.top, minTop ?? floor.top),
      right: Math.max(insets.right, minRight ?? floor.right),
      bottom: Math.max(insets.bottom, minBottom ?? floor.bottom),
      left: Math.max(insets.left, minLeft ?? floor.left),
    };
  }, [insets.top, insets.right, insets.bottom, insets.left, isLargeScreen, minTop, minRight, minBottom, minLeft]);
}
