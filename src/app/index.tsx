import { useState } from 'react';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const games = [
  {
    href: '/checkers',
    title: 'Dames',
    preview: 'checkers',
    accent: '#F05A4A',
    background: '#FFE8D9',
    rules: [
      'Avance tes pions en diagonale sur les cases sombres.',
      'Capture en sautant par-dessus un pion adverse.',
      'Un pion qui atteint le fond devient une dame et peut repartir en arrière.',
      'Gagne en capturant ou en bloquant tous les pions adverses.',
    ],
  },
  {
    href: '/backgammon',
    title: 'Backgammon',
    preview: 'backgammon',
    accent: '#18A999',
    background: '#DDF8EE',
    rules: [
      'Lance les dés et avance tes pions selon les valeurs obtenues.',
      'Un pion seul peut être frappé et envoyé au centre.',
      'Tu dois rentrer tes pions capturés avant de jouer les autres.',
      'Sors tes 15 pions avant ton adversaire pour gagner.',
    ],
  },
  {
    href: '/chess',
    title: 'Échecs',
    preview: 'chess',
    accent: '#8758FF',
    background: '#EEE7FF',
    rules: [
      'Chaque pièce a son propre déplacement.',
      'Protège ton roi et attaque celui de l’adversaire.',
      'Un roi menacé est en échec.',
      'Gagne en mettant le roi adverse en échec et mat.',
    ],
  },
  {
    href: '/dominos',
    title: 'Dominos',
    preview: 'dominoes',
    accent: '#FFB000',
    background: '#FFF0C6',
    rules: [
      'Pose un domino dont une extrémité correspond à la chaîne.',
      'Choisis la gauche ou la droite quand plusieurs coups sont possibles.',
      'Pioche si tu ne peux pas jouer.',
      'Vide ta main avant l’IA pour gagner.',
    ],
  },
  {
    href: '/tic-tac-toe',
    title: 'Tic Tac Toe',
    preview: 'tic-tac-toe',
    accent: '#F95F62',
    background: '#FFE8EF',
    rules: [
      'Aligne trois marques sur une ligne, colonne ou diagonale.',
      'Choisis 1 vs 1 pour un duel local ou 1 vs IA pour affronter une IA imbattable.',
      'Les rounds alternent le joueur qui commence et le score est sauvegardé automatiquement.',
      'Sur web, les touches 1 à 9 jouent les cases et R relance le match.',
    ],
  },
  {
    href: '/connect-four',
    title: 'Puissance 4',
    preview: 'connect-four',
    accent: '#65D7FF',
    background: '#E6F7FF',
    rules: [
      'Fais tomber tes jetons dans les colonnes pour former une ligne de quatre.',
      'Les alignements horizontaux, verticaux et diagonaux gagnent le round.',
      'Joue en duel local ou contre une IA tactique qui bloque tes menaces directes.',
      'Sur web, les touches 1 à 7 jouent les colonnes et R relance le match.',
    ],
  },
  {
    href: '/dino',
    title: 'Dino Run',
    preview: 'dino',
    accent: '#18A999',
    background: '#E5FAE8',
    rules: [
      'Touchez pour démarrer puis sauter.',
      'Évitez les cactus au sol et les oiseaux en mouvement.',
      'Maintenez Baisser pour passer sous certains oiseaux.',
      'Le score augmente avec la distance et les meilleurs scores entrent dans le leaderboard.',
    ],
  },
  {
    href: '/solitaire',
    title: 'Solitaire',
    preview: 'solitaire',
    accent: '#2F80ED',
    background: '#DDEBFF',
    rules: [
      'Range les cartes par couleur dans les fondations, de l’As au Roi.',
      'Sur le tableau, empile en descendant et en alternant rouge/noir.',
      'Retourne les cartes cachées dès qu’elles sont libérées.',
      'Choisis une pioche infinie ou limitée à trois passages.',
    ],
  },
  {
    href: '/street-brawl',
    title: 'Street Brawl',
    preview: 'street-brawl',
    accent: '#26C4A6',
    background: '#E8FFF7',
    rules: [
      'Traverse 50 niveaux de Vesper City et sauvegarde automatiquement ta progression.',
      'Enchaine combo, attaque lourde, dash et fury pour nettoyer chaque zone.',
      'Ramasse soins, energie, armes blanches, bouclier, vitesse, force et multiplicateur de score.',
      'Sur mobile, joue en paysage. Sur web, utilise WASD/fleches, J, K, L et Shift/Espace.',
    ],
  },
  {
    href: '/vallombre',
    title: 'Les Cendres de Vallombre',
    preview: 'vallombre',
    accent: '#C98036',
    background: '#F2E4CC',
    rules: [
      'Explore les 12 pièces du manoir et clique les points chauds pour collecter les indices.',
      'Interroge les 6 suspects et présente les preuves qui contredisent leurs mensonges.',
      'Relie les indices sur le Tableau de Liège pour ouvrir les zones verrouillées et la chronologie.',
      'Rends ton accusation finale: le trio Qui, Comment et Pourquoi détermine une des 5 fins.',
    ],
  },
] as const;

type Game = (typeof games)[number];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [rulesGame, setRulesGame] = useState<Game | null>(null);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 18) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}>
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
          <View style={styles.hero}>
            <View style={styles.logoStage}>
              <Image source={require('@/assets/images/app-logo.png')} style={styles.logo} contentFit="contain" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.brand}>Games</Text>
              <Text style={styles.title}>Choisis ton jeu</Text>
            </View>
            <View style={styles.tileScatter}>
              <View style={[styles.scatterTile, styles.scatterRed]} />
              <View style={[styles.scatterTile, styles.scatterTeal]} />
              <View style={[styles.scatterTile, styles.scatterYellow]} />
            </View>
          </View>

          <View style={styles.grid}>
            {games.map((game, index) => (
              <View key={game.href} style={[styles.gameShell, { backgroundColor: game.background }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Règles ${game.title}`}
                  hitSlop={10}
                  onPress={() => setRulesGame(game)}
                  style={({ pressed }) => [
                    styles.helpButton,
                    { borderColor: game.accent },
                    pressed && styles.helpPressed,
                  ]}>
                  <Text style={[styles.helpText, { color: game.accent }]}>?</Text>
                </Pressable>

                {game.preview === 'vallombre' ? (
                  <View style={styles.gameLaunch}>
                    <GamePreview type={game.preview} accent={game.accent} index={index} />
                    <View style={[styles.cardFooter, styles.vallombreFooter]}>
                      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.58} style={styles.vallombreCardTitle}>
                        {game.title}
                      </Text>
                      <View style={styles.vallombreActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Nouvelle partie Vallombre"
                          onPress={() => router.push('/vallombre?start=new' as never)}
                          style={({ pressed }) => [styles.vallombreActionPrimary, { backgroundColor: game.accent }, pressed && styles.pressed]}>
                          <Text style={styles.vallombreActionText}>Nouvelle partie</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Reprendre Vallombre"
                          onPress={() => router.push('/vallombre?start=resume' as never)}
                          style={({ pressed }) => [styles.vallombreActionSecondary, pressed && styles.pressed]}>
                          <Text style={styles.vallombreResumeText}>Reprendre</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Link href={game.href as never} asChild>
                    <Pressable style={({ pressed }) => [styles.gameLaunch, pressed && styles.pressed]}>
                      <GamePreview type={game.preview} accent={game.accent} index={index} />
                      <View style={styles.cardFooter}>
                      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} style={styles.gameTitle}>
                        {game.title}
                      </Text>
                        <View style={[styles.playPill, { backgroundColor: game.accent }]}>
                          <Text style={styles.playText}>Jouer</Text>
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                )}
              </View>
            ))}
          </View>
        </SafeAreaView>
      </ScrollView>

      <RulesModal game={rulesGame} onClose={() => setRulesGame(null)} />
    </View>
  );
}

function RulesModal({ game, onClose }: { game: Game | null; onClose: () => void }) {
  return (
    <Modal transparent visible={Boolean(game)} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        {game ? (
          <Pressable style={styles.rulesPanel}>
            <View style={styles.rulesHeader}>
              <Text style={styles.rulesTitle}>{game.title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.rulesList}>
              {game.rules.map((rule, index) => (
                <View key={rule} style={styles.ruleLine}>
                  <View style={[styles.ruleNumber, { backgroundColor: game.accent }]}>
                    <Text style={styles.ruleNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

function GamePreview({ type, accent, index }: { type: Game['preview']; accent: string; index: number }) {
  if (type === 'checkers') {
    return (
      <View style={[styles.preview, { backgroundColor: '#121B1F' }]}>
        <View style={[styles.diagonalBand, { backgroundColor: accent }]} />
        <View style={styles.miniBoard}>
          {Array.from({ length: 16 }, (_, squareIndex) => (
            <View
              key={squareIndex}
              style={[
                styles.miniSquare,
                (Math.floor(squareIndex / 4) + squareIndex) % 2 ? styles.miniDark : styles.miniLight,
              ]}
            />
          ))}
        </View>
        <Image source={require('@/assets/game/checkers/ivory-king.png')} style={[styles.floatingPiece, styles.leftPiece]} />
        <Image source={require('@/assets/game/checkers/red-king.png')} style={[styles.floatingPiece, styles.rightPiece]} />
      </View>
    );
  }

  if (type === 'street-brawl') {
    return (
      <View style={[styles.preview, { backgroundColor: '#171329' }]}>
        <Image source={require('@/assets/game/street-brawl/bg-downtown.png')} style={styles.brawlBack} contentFit="cover" />
        <View style={[styles.diagonalBand, { backgroundColor: accent, opacity: 0.64 }]} />
        <Image source={require('@/assets/game/street-brawl/player-fury.png')} style={styles.brawlHero} contentFit="contain" />
        <Image source={require('@/assets/game/street-brawl/grunt-attack.png')} style={[styles.brawlEnemy, styles.brawlEnemyLeft]} contentFit="contain" />
        <Image source={require('@/assets/game/street-brawl/bruiser-idle.png')} style={[styles.brawlEnemy, styles.brawlEnemyRight]} contentFit="contain" />
        <View style={styles.brawlHud}>
          <View style={styles.brawlMeter} />
          <View style={[styles.brawlMeter, styles.brawlMeterFury]} />
        </View>
      </View>
    );
  }

  if (type === 'backgammon') {
    return (
      <View style={[styles.preview, { backgroundColor: '#14342F' }]}>
        <View style={[styles.cornerBlock, { backgroundColor: accent }]} />
        <View style={styles.backgammonPreview}>
          {Array.from({ length: 12 }, (_, pointIndex) => (
            <View
              key={pointIndex}
              style={[
                styles.triangle,
                pointIndex % 2 ? styles.triangleRed : styles.triangleTeal,
                pointIndex >= 6 && styles.triangleBottom,
              ]}
            />
          ))}
          <View style={styles.die}>
            <View style={styles.pip} />
            <View style={styles.pip} />
          </View>
        </View>
      </View>
    );
  }

  if (type === 'chess') {
    return (
      <View style={[styles.preview, { backgroundColor: '#171329' }]}>
        <View style={[styles.diagonalBand, { backgroundColor: accent, transform: [{ rotate: '-22deg' }] }]} />
        <View style={styles.chessPreview}>
          {Array.from({ length: 16 }, (_, squareIndex) => (
            <View
              key={squareIndex}
              style={[
                styles.chessSquare,
                (Math.floor(squareIndex / 4) + squareIndex) % 2 ? styles.chessDark : styles.chessLight,
              ]}>
              {[1, 2, 13, 14].includes(squareIndex) && <View style={styles.chessPiece} />}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (type === 'solitaire') {
    return (
      <View style={[styles.preview, { backgroundColor: '#10264D' }]}>
        <View style={[styles.cornerBlock, { backgroundColor: accent }]} />
        <View style={styles.solitairePreview}>
          {[0, 1, 2, 3].map((cardIndex) => (
            <View key={cardIndex} style={[styles.solitaireCard, { left: 76 + cardIndex * 28, top: 18 + cardIndex * 7 }]}>
              <Text style={[styles.solitaireRank, cardIndex % 2 === 0 && styles.solitaireRed]}>
                {['A', '7', 'Q', 'K'][cardIndex]}
              </Text>
              <Text style={[styles.solitaireSuit, cardIndex % 2 === 0 && styles.solitaireRed]}>
                {cardIndex % 2 === 0 ? '♥' : '♣'}
              </Text>
            </View>
          ))}
          <View style={styles.solitaireFoundation} />
          <View style={[styles.solitaireFoundation, { right: 70 }]} />
        </View>
      </View>
    );
  }

  if (type === 'tic-tac-toe') {
    return (
      <View style={[styles.preview, { backgroundColor: '#101820' }]}>
        <Image source={require('@/assets/game/tic-tac-toe/bg-arcade.png')} style={styles.ticBack} contentFit="cover" />
        <View style={[styles.diagonalBand, { backgroundColor: accent, opacity: 0.68 }]} />
        <Image source={require('@/assets/game/tic-tac-toe/board.png')} style={styles.ticBoardPreview} contentFit="contain" />
        <Image source={require('@/assets/game/tic-tac-toe/mark-x.png')} style={[styles.ticMarkPreview, styles.ticMarkLeft]} contentFit="contain" />
        <Image source={require('@/assets/game/tic-tac-toe/mark-o.png')} style={[styles.ticMarkPreview, styles.ticMarkRight]} contentFit="contain" />
        <Image source={require('@/assets/game/tic-tac-toe/avatar-ai.png')} style={styles.ticAvatarPreview} contentFit="contain" />
      </View>
    );
  }

  if (type === 'connect-four') {
    return (
      <View style={[styles.preview, { backgroundColor: '#09111F' }]}>
        <Image source={require('@/assets/game/connect-four/bg-arena.png')} style={styles.connectBack} contentFit="cover" />
        <View style={[styles.diagonalBand, { backgroundColor: accent, opacity: 0.56, transform: [{ rotate: '-18deg' }] }]} />
        <Image source={require('@/assets/game/connect-four/preview-board.png')} style={styles.connectBoardPreview} contentFit="contain" />
        <Image source={require('@/assets/game/connect-four/disc-red.png')} style={[styles.connectDiscPreview, styles.connectDiscLeft]} contentFit="contain" />
        <Image source={require('@/assets/game/connect-four/disc-yellow.png')} style={[styles.connectDiscPreview, styles.connectDiscRight]} contentFit="contain" />
      </View>
    );
  }

  if (type === 'vallombre') {
    return (
      <View style={[styles.preview, { backgroundColor: '#151820' }]}>
        <Image source={require('@/assets/game/vallombre/home-preview.png')} style={styles.vallombreBack} contentFit="cover" />
        <View style={styles.vallombreShade} />
        <View style={[styles.diagonalBand, { backgroundColor: accent, opacity: 0.62, transform: [{ rotate: '-16deg' }] }]} />
        <Image source={require('@/assets/game/vallombre/char-victor-neutre.png')} style={styles.vallombreSuspect} contentFit="contain" />
        <Image source={require('@/assets/game/vallombre/prop-19.png')} style={styles.vallombrePropClock} contentFit="contain" />
        <Image source={require('@/assets/game/vallombre/prop-13.png')} style={styles.vallombrePropKnife} contentFit="contain" />
        <View style={styles.vallombreCaseFile}>
          <Text style={styles.vallombreCaseText}>23:47</Text>
        </View>
      </View>
    );
  }

  if (type === 'dino') {
    return (
      <View style={[styles.preview, { backgroundColor: '#DDF8EE' }]}>
        <View style={[styles.dinoSun, { backgroundColor: '#F6D74A' }]} />
        <Image source={require('@/assets/game/dino/cloud.png')} style={styles.dinoCloudPreview} contentFit="contain" />
        <View style={styles.dinoPreviewGround} />
        <Image source={require('@/assets/game/dino/dino-run-1.png')} style={styles.dinoRunnerPreview} contentFit="contain" />
        <Image source={require('@/assets/game/dino/cactus-wide.png')} style={styles.dinoCactusPreview} contentFit="contain" />
        <Image source={require('@/assets/game/dino/bird-1.png')} style={styles.dinoBirdPreview} contentFit="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.preview, { backgroundColor: index % 2 ? '#241A11' : '#111820' }]}>
      <View style={[styles.diagonalBand, { backgroundColor: accent }]} />
      <View style={styles.dominoPreview}>
        <PreviewDomino left={6} right={1} rotate="-12deg" offset={-42} />
        <PreviewDomino left={4} right={2} rotate="3deg" offset={0} />
        <PreviewDomino left={5} right={3} rotate="14deg" offset={42} />
      </View>
    </View>
  );
}

function PreviewDomino({ left, right, rotate, offset }: { left: number; right: number; rotate: string; offset: number }) {
  return (
    <View style={[styles.dominoTile, { transform: [{ translateX: offset }, { rotate }] }]}>
      <PreviewDominoHalf value={left} />
      <View style={styles.dominoDivider} />
      <PreviewDominoHalf value={right} />
    </View>
  );
}

function PreviewDominoHalf({ value }: { value: number }) {
  return (
    <View style={styles.dominoHalf}>
      {previewDominoPips(value).map((pip) => (
        <View key={`${pip.x}-${pip.y}`} style={[styles.dominoPip, { left: `${pip.x}%`, top: `${pip.y}%` }]} />
      ))}
    </View>
  );
}

function previewDominoPips(value: number): { x: number; y: number }[] {
  switch (value) {
    case 1:
      return [{ x: 50, y: 50 }];
    case 2:
      return [
        { x: 28, y: 28 },
        { x: 72, y: 72 },
      ];
    case 3:
      return [
        { x: 28, y: 28 },
        { x: 50, y: 50 },
        { x: 72, y: 72 },
      ];
    case 4:
      return [
        { x: 28, y: 28 },
        { x: 72, y: 28 },
        { x: 28, y: 72 },
        { x: 72, y: 72 },
      ];
    case 5:
      return [
        { x: 28, y: 28 },
        { x: 72, y: 28 },
        { x: 50, y: 50 },
        { x: 28, y: 72 },
        { x: 72, y: 72 },
      ];
    case 6:
      return [
        { x: 28, y: 24 },
        { x: 72, y: 24 },
        { x: 28, y: 50 },
        { x: 72, y: 50 },
        { x: 28, y: 76 },
        { x: 72, y: 76 },
      ];
    default:
      return [];
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8E4',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  safeArea: {
    width: '100%',
    maxWidth: 940,
    gap: 18,
  },
  hero: {
    minHeight: 122,
    borderRadius: 8,
    backgroundColor: '#101820',
    borderWidth: 3,
    borderColor: '#101820',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  logoStage: {
    width: 86,
    height: 86,
    borderRadius: 8,
    backgroundColor: '#F6D74A',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  logo: {
    width: 82,
    height: 82,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    color: '#F6D74A',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF8E4',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
  },
  tileScatter: {
    width: 54,
    height: 90,
    position: 'relative',
  },
  scatterTile: {
    position: 'absolute',
    width: 30,
    height: 42,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#101820',
  },
  scatterRed: {
    backgroundColor: '#F05A4A',
    right: 10,
    top: 2,
    transform: [{ rotate: '14deg' }],
  },
  scatterTeal: {
    backgroundColor: '#18A999',
    left: 0,
    top: 28,
    transform: [{ rotate: '-12deg' }],
  },
  scatterYellow: {
    backgroundColor: '#F6D74A',
    right: 2,
    bottom: 0,
    transform: [{ rotate: '8deg' }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gameShell: {
    width: '100%',
    maxWidth: 450,
    minHeight: 232,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    overflow: 'hidden',
    position: 'relative',
  },
  gameLaunch: {
    flex: 1,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  helpButton: {
    position: 'absolute',
    zIndex: 3,
    top: 10,
    right: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF8E4',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpPressed: {
    transform: [{ scale: 0.94 }],
  },
  helpText: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  preview: {
    height: 158,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brawlBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  brawlHero: {
    position: 'absolute',
    width: 88,
    height: 122,
    bottom: 12,
  },
  brawlEnemy: {
    position: 'absolute',
    width: 66,
    height: 96,
    bottom: 14,
    opacity: 0.94,
  },
  brawlEnemyLeft: {
    left: 72,
  },
  brawlEnemyRight: {
    right: 66,
    width: 82,
    height: 110,
  },
  brawlHud: {
    position: 'absolute',
    left: 16,
    top: 14,
    width: 96,
    gap: 5,
  },
  brawlMeter: {
    height: 8,
    borderWidth: 2,
    borderColor: '#101820',
    backgroundColor: '#E94B5F',
  },
  brawlMeterFury: {
    width: 68,
    backgroundColor: '#8E5CFF',
  },
  diagonalBand: {
    position: 'absolute',
    width: 220,
    height: 58,
    borderRadius: 8,
    opacity: 0.95,
    transform: [{ rotate: '18deg' }],
  },
  cornerBlock: {
    position: 'absolute',
    width: 120,
    height: 120,
    right: -28,
    top: -36,
    borderRadius: 8,
    transform: [{ rotate: '24deg' }],
  },
  cardFooter: {
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  vallombreFooter: {
    minHeight: 104,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 8,
  },
  vallombreCardTitle: {
    color: '#101820',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  gameTitle: {
    flex: 1,
    minWidth: 0,
    color: '#101820',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
  },
  playPill: {
    minWidth: 86,
    height: 42,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  playText: {
    color: '#101820',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  vallombreActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  vallombreActionPrimary: {
    flexGrow: 1,
    minHeight: 38,
    minWidth: 132,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  vallombreActionSecondary: {
    flexGrow: 1,
    minHeight: 38,
    minWidth: 104,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  vallombreActionText: {
    color: '#101820',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  vallombreResumeText: {
    color: '#101820',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 32, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  rulesPanel: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 8,
    backgroundColor: '#FFF8E4',
    borderWidth: 3,
    borderColor: '#101820',
    padding: 16,
    gap: 16,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rulesTitle: {
    flex: 1,
    color: '#101820',
    fontSize: 26,
    fontWeight: '900',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFF8E4',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },
  rulesList: {
    gap: 12,
  },
  ruleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ruleNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleNumberText: {
    color: '#101820',
    fontSize: 14,
    fontWeight: '900',
  },
  ruleText: {
    flex: 1,
    color: '#273136',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  miniBoard: {
    width: 118,
    height: 118,
    flexDirection: 'row',
    flexWrap: 'wrap',
    transform: [{ rotate: '-5deg' }],
    borderWidth: 3,
    borderColor: '#101820',
  },
  miniSquare: {
    width: '25%',
    height: '25%',
  },
  miniLight: {
    backgroundColor: '#FFE7B5',
  },
  miniDark: {
    backgroundColor: '#32685F',
  },
  floatingPiece: {
    position: 'absolute',
    width: 58,
    height: 58,
  },
  leftPiece: {
    left: 66,
    bottom: 20,
  },
  rightPiece: {
    right: 76,
    top: 24,
  },
  backgammonPreview: {
    width: '86%',
    height: 112,
    borderRadius: 8,
    backgroundColor: '#E2BB74',
    borderWidth: 4,
    borderColor: '#101820',
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'relative',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 84,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleTeal: {
    borderTopColor: '#18A999',
  },
  triangleRed: {
    borderTopColor: '#F05A4A',
  },
  triangleBottom: {
    transform: [{ rotate: '180deg' }],
    alignSelf: 'flex-end',
  },
  die: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFF8E4',
    borderWidth: 2,
    borderColor: '#101820',
    left: '45%',
    top: 36,
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 8,
  },
  pip: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#101820',
  },
  chessPreview: {
    width: 118,
    height: 118,
    flexDirection: 'row',
    flexWrap: 'wrap',
    transform: [{ rotate: '4deg' }],
    borderWidth: 3,
    borderColor: '#101820',
  },
  chessSquare: {
    width: '25%',
    height: '25%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chessLight: {
    backgroundColor: '#FFE7B5',
  },
  chessDark: {
    backgroundColor: '#6E54C8',
  },
  chessPiece: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#101820',
    borderWidth: 3,
    borderColor: '#FFF8E4',
  },
  dominoPreview: {
    width: '84%',
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dominoTile: {
    position: 'absolute',
    width: 62,
    height: 112,
    borderRadius: 8,
    backgroundColor: '#FFF8E4',
    borderWidth: 3,
    borderColor: '#101820',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  dominoHalf: {
    width: 48,
    height: 38,
    position: 'relative',
  },
  dominoDivider: {
    width: 46,
    height: 3,
    backgroundColor: '#101820',
  },
  dominoPip: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: -3.5,
    marginTop: -3.5,
    backgroundColor: '#101820',
  },
  solitairePreview: {
    width: '84%',
    height: 118,
    position: 'relative',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#101820',
    backgroundColor: '#18A999',
  },
  solitaireCard: {
    position: 'absolute',
    width: 54,
    height: 76,
    borderRadius: 8,
    backgroundColor: '#FFF8E4',
    borderWidth: 2,
    borderColor: '#101820',
    padding: 5,
    justifyContent: 'space-between',
  },
  solitaireRank: {
    color: '#101820',
    fontSize: 14,
    fontWeight: '900',
  },
  solitaireSuit: {
    alignSelf: 'flex-end',
    color: '#101820',
    fontSize: 16,
    fontWeight: '900',
  },
  solitaireRed: {
    color: '#F05A4A',
  },
  solitaireFoundation: {
    position: 'absolute',
    right: 12,
    top: 16,
    width: 46,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF8E4',
  },
  ticBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  ticBoardPreview: {
    position: 'absolute',
    width: 124,
    height: 124,
    bottom: 14,
    transform: [{ rotate: '-4deg' }],
  },
  ticMarkPreview: {
    position: 'absolute',
    width: 58,
    height: 58,
  },
  ticMarkLeft: {
    left: 66,
    top: 22,
    transform: [{ rotate: '-10deg' }],
  },
  ticMarkRight: {
    right: 72,
    bottom: 24,
    transform: [{ rotate: '9deg' }],
  },
  ticAvatarPreview: {
    position: 'absolute',
    right: 48,
    top: 20,
    width: 62,
    height: 62,
  },
  connectBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  connectBoardPreview: {
    position: 'absolute',
    width: 250,
    height: 164,
    bottom: -4,
    transform: [{ rotate: '-3deg' }],
  },
  connectDiscPreview: {
    position: 'absolute',
    width: 64,
    height: 64,
  },
  connectDiscLeft: {
    left: 60,
    top: 18,
  },
  connectDiscRight: {
    right: 58,
    bottom: 22,
  },
  vallombreBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  vallombreShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 11, 16, 0.34)',
  },
  vallombreSuspect: {
    position: 'absolute',
    right: 36,
    bottom: -18,
    width: 112,
    height: 166,
  },
  vallombrePropClock: {
    position: 'absolute',
    left: 38,
    top: 18,
    width: 74,
    height: 74,
    transform: [{ rotate: '-9deg' }],
  },
  vallombrePropKnife: {
    position: 'absolute',
    left: 108,
    bottom: 20,
    width: 78,
    height: 78,
    transform: [{ rotate: '12deg' }],
  },
  vallombreCaseFile: {
    position: 'absolute',
    left: 34,
    bottom: 20,
    minWidth: 84,
    height: 38,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#F2E4CC',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  vallombreCaseText: {
    color: '#101820',
    fontSize: 17,
    fontWeight: '900',
  },
  dinoSun: {
    position: 'absolute',
    right: 42,
    top: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: '#101820',
  },
  dinoCloudPreview: {
    position: 'absolute',
    left: 34,
    top: 18,
    width: 92,
    height: 48,
  },
  dinoPreviewGround: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 34,
    height: 5,
    backgroundColor: '#101820',
  },
  dinoRunnerPreview: {
    position: 'absolute',
    left: 78,
    bottom: 34,
    width: 58,
    height: 78,
  },
  dinoCactusPreview: {
    position: 'absolute',
    right: 80,
    bottom: 34,
    width: 68,
    height: 58,
  },
  dinoBirdPreview: {
    position: 'absolute',
    right: 150,
    top: 56,
    width: 62,
    height: 42,
  },
});
