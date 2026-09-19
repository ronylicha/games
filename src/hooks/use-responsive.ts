/**
 * `useResponsive` — point d'entrée réactif unique pour adapter l'UI du
 * téléphone à la tablette (et au web large).
 *
 * Il s'appuie sur `useWindowDimensions` (réactif aux rotations, redimensionnements
 * et au split-view iPad, contrairement à `Dimensions.get()` qui est figé) et sur
 * les sélecteurs purs de `@/constants/responsive`.
 *
 * Deux résolutions cohabitent volontairement :
 *  - la **classe d'appareil** (capacité) est calculée sur le côté le plus court,
 *    pour qu'un téléphone en paysage reste `phone` ;
 *  - les **caps de mise en page** (colonnes, largeurs max) sont calculés sur la
 *    largeur courante, pour suivre l'espace horizontal réellement disponible.
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  type DeviceClass,
  resolveCap,
  resolveDeviceClassFromSize,
  resolveHomeColumns,
  BoardMaxSize,
  ContentMaxWidth,
  TableMaxWidth,
} from '@/constants/responsive';
import { Spacing, SpacingTablet, Typography, type TypographyRole } from '@/constants/theme';

export type Orientation = 'portrait' | 'landscape';

/** Style typographique résolu pour une classe d'appareil donnée. */
export type ResolvedTypography = {
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof Typography)[TypographyRole]['fontWeight'];
};

/** Valeurs proposées à {@link ResponsiveInfo.select}, indexées par classe. */
export type ResponsiveValues<T> = {
  phone: T;
  /** Par défaut : reprend `phone` si non fourni. */
  tablet?: T;
  /** Par défaut : reprend `tablet` (puis `phone`) si non fourni. */
  desktop?: T;
};

export interface ResponsiveInfo {
  /** Largeur de la fenêtre en points logiques (dp). */
  width: number;
  /** Hauteur de la fenêtre en points logiques (dp). */
  height: number;
  /** Classe d'appareil (capacité), calculée sur le côté le plus court. */
  deviceClass: DeviceClass;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Vrai pour tablette OU desktop : déclenche le « traitement grand écran ». */
  isLargeScreen: boolean;
  orientation: Orientation;
  isLandscape: boolean;
  isPortrait: boolean;
  /** Échelle d'espacement adaptée (compacte sur téléphone, ample sur grand écran). */
  spacing: typeof Spacing | typeof SpacingTablet;
  /** Colonnes de la grille d'accueil pour la largeur courante. */
  homeColumns: number;
  /** Largeur max du contenu (scaffold, panneaux) pour la largeur courante. */
  contentMaxWidth: number;
  /** Côté max d'un plateau carré pour la largeur courante. */
  boardMaxSize: number;
  /** Largeur max d'une table « large » pour la largeur courante. */
  tableMaxWidth: number;
  /** Style typographique d'un rôle, surcharge grand écran appliquée si besoin. */
  typography: (role: TypographyRole) => ResolvedTypography;
  /** Choisit une valeur selon la classe d'appareil, avec repli ascendant. */
  select: <T>(values: ResponsiveValues<T>) => T;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  return useMemo<ResponsiveInfo>(() => {
    const deviceClass = resolveDeviceClassFromSize(width, height);
    const isPhone = deviceClass === 'phone';
    const isTablet = deviceClass === 'tablet';
    const isDesktop = deviceClass === 'desktop';
    const isLargeScreen = !isPhone;
    const isLandscape = width > height;

    return {
      width,
      height,
      deviceClass,
      isPhone,
      isTablet,
      isDesktop,
      isLargeScreen,
      orientation: isLandscape ? 'landscape' : 'portrait',
      isLandscape,
      isPortrait: !isLandscape,
      spacing: isLargeScreen ? SpacingTablet : Spacing,
      homeColumns: resolveHomeColumns(width),
      contentMaxWidth: resolveCap(ContentMaxWidth, width),
      boardMaxSize: resolveCap(BoardMaxSize, width),
      tableMaxWidth: resolveCap(TableMaxWidth, width),
      typography: (role) => {
        const style = Typography[role];
        const size = isLargeScreen ? style.tablet : style;
        return {
          fontSize: size.fontSize,
          lineHeight: size.lineHeight,
          fontWeight: style.fontWeight,
        };
      },
      select: (values) => {
        if (isDesktop) return values.desktop ?? values.tablet ?? values.phone;
        if (isTablet) return values.tablet ?? values.phone;
        return values.phone;
      },
    };
  }, [width, height]);
}
