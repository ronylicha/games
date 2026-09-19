/**
 * Constantes responsive partagées : breakpoints, nombre de colonnes et caps de
 * largeur. Source de vérité unique consommée par le hook `useResponsive`, le
 * scaffold d'écran et les plateaux de jeu pour s'adapter du téléphone à la
 * tablette (et au web).
 *
 * Ce module est volontairement « pur » (aucune dépendance React/RN) : il
 * n'expose que des données et des sélecteurs déterministes. Les hooks réactifs
 * (`useResponsive`, `useSafeNavInsets`) viennent par-dessus.
 */

/**
 * Largeurs minimales (en points logiques / dp) qui ouvrent chaque classe
 * d'appareil. Une classe s'applique tant que la dimension mesurée est >= à son
 * seuil et < au seuil suivant.
 */
export const Breakpoints = {
  /** Téléphones — disposition compacte par défaut. */
  phone: 0,
  /** Tablettes (iPad mini ≈ 744dp, iPad ≈ 768/810dp). */
  tablet: 600,
  /** Grandes tablettes en paysage / web large. */
  desktop: 1024,
} as const;

/** Les trois familles de gabarits pris en charge par l'application. */
export type DeviceClass = keyof typeof Breakpoints;

/** Ordre croissant des classes, du plus compact au plus large. */
export const DeviceClasses: readonly DeviceClass[] = ['phone', 'tablet', 'desktop'];

/**
 * Résout la classe d'appareil à partir d'UNE dimension (typiquement le côté le
 * plus court de la fenêtre, voir {@link resolveDeviceClassFromSize}).
 */
export function resolveDeviceClass(size: number): DeviceClass {
  if (size >= Breakpoints.desktop) return 'desktop';
  if (size >= Breakpoints.tablet) return 'tablet';
  return 'phone';
}

/**
 * Résout la classe d'appareil à partir de la taille de fenêtre complète.
 *
 * On classe sur le **côté le plus court** : un téléphone passé en paysage
 * (largeur > 600) doit rester `phone`, sinon les jeux paysage (Dino, Street
 * Brawl, Vallombre) seraient pris à tort pour des tablettes.
 */
export function resolveDeviceClassFromSize(width: number, height: number): DeviceClass {
  return resolveDeviceClass(Math.min(width, height));
}

/** Vrai dès que la dimension fournie atteint le gabarit tablette. */
export function isTabletSize(size: number): boolean {
  return size >= Breakpoints.tablet;
}

/**
 * Nombre de colonnes de la grille de l'écran d'accueil par classe d'appareil.
 */
export const HomeColumns: Record<DeviceClass, number> = {
  phone: 2,
  tablet: 3,
  desktop: 4,
};

/** Colonnes de la grille d'accueil pour une largeur de fenêtre donnée. */
export function resolveHomeColumns(width: number): number {
  return HomeColumns[resolveDeviceClass(width)];
}

/**
 * Largeur maximale du contenu d'un écran (scaffold, listes, panneaux). Évite
 * les lignes de texte et les zones de contrôle trop étirées sur tablette.
 */
export const ContentMaxWidth: Record<DeviceClass, number> = {
  phone: 640,
  tablet: 900,
  desktop: 1120,
};

/**
 * Côté maximal d'un plateau carré (Échecs, Dames, Puissance 4, Tic Tac Toe).
 * Les plateaux restent confortables sans devenir démesurés sur grand écran ;
 * les consommateurs appliquent `Math.min(largeurDisponible, cap)`.
 */
export const BoardMaxSize: Record<DeviceClass, number> = {
  phone: 460,
  tablet: 560,
  desktop: 640,
};

/**
 * Largeur maximale d'une table de jeu « large » (Solitaire, Dominos,
 * Backgammon) qui s'étale horizontalement.
 */
export const TableMaxWidth: Record<DeviceClass, number> = {
  phone: 520,
  tablet: 820,
  desktop: 1040,
};

/**
 * Sélectionne la valeur d'une table de caps ({@link ContentMaxWidth},
 * {@link BoardMaxSize}, {@link TableMaxWidth}, …) pour une largeur de fenêtre.
 */
export function resolveCap(cap: Record<DeviceClass, number>, width: number): number {
  return cap[resolveDeviceClass(width)];
}
