// Table de Tarot : pli en cours et mains des joueurs (composant contrôlé).
//
// Présentational : il ne connaît pas les règles. Il reçoit les mains, le pli
// courant et l'ensemble des cartes légales (calculé par le moteur) pour griser
// les coups interdits. La main du joueur humain est posée en bas ; les autres
// sièges affichent un dos de cartes avec un compteur. Le tour courant et le
// vainqueur du pli sont mis en évidence.

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  TarotCard as TarotCardModel,
  TarotPlayer,
  TarotTrick,
} from '@/game/tarot';

import { TarotCard } from './TarotCard';

/** Carte fictive servant uniquement de support aux dos (face cachée). */
const BACK_PLACEHOLDER: TarotCardModel = { id: 'excuse', kind: 'excuse' };

/** Nombre maximal de dos empilés affichés pour un adversaire. */
const MAX_VISIBLE_BACKS = 5;

type TarotTableProps = {
  /** Joueurs à la table (l'index sert de position canonique). */
  players: TarotPlayer[];
  /** Mains par joueur (indexées comme `players`). */
  hands: TarotCardModel[][];
  /** Index du joueur humain (sa main est visible et jouable). */
  humanPlayer?: number;
  /** Pli en cours, ou `null` en l'absence de pli. */
  trick?: TarotTrick | null;
  /** Joueur dont c'est le tour (mis en évidence), ou `null`. */
  currentPlayer?: number | null;
  /** Cartes que l'humain peut légalement jouer ; les autres sont grisées. */
  legalCards?: TarotCardModel[];
  /** Rappelé quand l'humain joue une carte. */
  onPlayCard?: (card: TarotCardModel) => void;
};

/** Nom affiché d'un joueur (repli sur « Joueur N »). */
function playerName(players: TarotPlayer[], index: number): string {
  return players[index]?.name ?? `Joueur ${index + 1}`;
}

export function TarotTable({
  players,
  hands,
  humanPlayer = 0,
  trick = null,
  currentPlayer = null,
  legalCards,
  onPlayCard,
}: TarotTableProps) {
  const playerCount = players.length;
  // Sièges adverses dans l'ordre du tour, en partant de la gauche de l'humain.
  const opponents = Array.from({ length: playerCount - 1 }, (_, i) => (humanPlayer + i + 1) % playerCount);

  const isHumanTurn = currentPlayer === humanPlayer;
  const legalIds = legalCards ? new Set(legalCards.map((card) => card.id)) : null;
  const humanHand = hands[humanPlayer] ?? [];

  return (
    <View style={styles.table}>
      <View style={styles.opponents}>
        {opponents.map((index) => (
          <OpponentSeat
            key={index}
            name={playerName(players, index)}
            count={hands[index]?.length ?? 0}
            active={currentPlayer === index}
          />
        ))}
      </View>

      <TrickArea players={players} trick={trick} />

      <View style={styles.handArea}>
        <Text style={[styles.handLabel, isHumanTurn && styles.handLabelActive]}>
          {isHumanTurn ? 'À vous de jouer' : 'Votre main'}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hand}>
          {humanHand.map((card) => {
            const playable = isHumanTurn && Boolean(onPlayCard) && (legalIds ? legalIds.has(card.id) : true);
            return (
              <TarotCard
                key={card.id}
                card={card}
                width={64}
                disabled={!playable}
                onPress={onPlayCard}
                style={styles.handCard}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/** Siège d'un adversaire : nom, dos empilés et compteur de cartes. */
function OpponentSeat({ name, count, active }: { name: string; count: number; active: boolean }) {
  const visibleBacks = Math.min(count, MAX_VISIBLE_BACKS);
  return (
    <View style={[styles.seat, active && styles.seatActive]}>
      <Text style={[styles.seatName, active && styles.seatNameActive]} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.backStack}>
        {Array.from({ length: visibleBacks }, (_, i) => (
          <TarotCard
            key={i}
            card={BACK_PLACEHOLDER}
            faceDown
            width={28}
            style={[styles.backCard, { marginLeft: i === 0 ? 0 : -20 }]}
          />
        ))}
        {visibleBacks === 0 ? <View style={styles.backEmpty} /> : null}
      </View>
      <Text style={styles.seatCount}>{count} carte{count > 1 ? 's' : ''}</Text>
    </View>
  );
}

/** Zone centrale : cartes du pli en cours, vainqueur mis en évidence. */
function TrickArea({ players, trick }: { players: TarotPlayer[]; trick: TarotTrick | null }) {
  if (!trick || trick.plays.length === 0) {
    return (
      <View style={styles.trick}>
        <Text style={styles.trickEmpty}>En attente du pli…</Text>
      </View>
    );
  }

  return (
    <View style={styles.trick}>
      {trick.plays.map((play) => {
        const won = trick.winner === play.player;
        return (
          <View key={`${play.player}-${play.card.id}`} style={styles.trickPlay}>
            <Text style={[styles.trickPlayer, won && styles.trickPlayerWon]} numberOfLines={1}>
              {playerName(players, play.player)}
            </Text>
            <TarotCard card={play.card} width={56} selected={won} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#114A34',
  },
  opponents: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  seat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  seatActive: {
    borderColor: '#F5D678',
    backgroundColor: 'rgba(245, 214, 120, 0.14)',
  },
  seatName: {
    color: '#E7EFE9',
    fontSize: 13,
    fontWeight: '800',
  },
  seatNameActive: {
    color: '#F5D678',
  },
  backStack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
  },
  backCard: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
  },
  backEmpty: {
    width: 28,
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  seatCount: {
    color: '#A9C4B6',
    fontSize: 11,
    fontWeight: '700',
  },
  trick: {
    minHeight: 110,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  trickEmpty: {
    color: '#A9C4B6',
    fontSize: 14,
    fontWeight: '700',
  },
  trickPlay: {
    alignItems: 'center',
    gap: 4,
  },
  trickPlayer: {
    color: '#CFE0D7',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 64,
  },
  trickPlayerWon: {
    color: '#F5D678',
    fontWeight: '900',
  },
  handArea: {
    gap: 8,
  },
  handLabel: {
    color: '#CFE0D7',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  handLabelActive: {
    color: '#F5D678',
  },
  hand: {
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  handCard: {
    marginRight: 2,
  },
});
