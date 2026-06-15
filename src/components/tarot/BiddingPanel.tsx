// Panneau d'enchères du Tarot : composant présentationnel contrôlé.
//
// Il n'embarque aucune logique de jeu : il reçoit l'état d'enchères du moteur
// (`TarotBiddingState`) et remonte les annonces du joueur humain via `onBid`.
// Les contrats légaux affichés proviennent directement de `availableContracts`,
// de sorte que le panneau ne duplique aucune règle de surenchère.

import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  availableContracts,
  everyonePassed,
  TAROT_CONTRACTS,
  type TarotAnnounceableContract,
  type TarotBiddingState,
  type TarotContract,
  type TarotPlayer,
} from '@/game/tarot';

type BiddingPanelProps = {
  /** État courant de la phase d'enchères (machine à états du moteur). */
  state: TarotBiddingState;
  /** Joueurs à la table, pour afficher les noms (optionnel). */
  players?: TarotPlayer[];
  /** Index du joueur humain : les boutons ne sont actifs qu'à son tour. */
  humanPlayer?: number;
  /** Annonce d'un contrat (ou `pass`) par le joueur humain. */
  onBid: (contract: TarotContract) => void;
};

/** Nom affiché d'un joueur (repli sur « Joueur N » si non fourni). */
function playerName(players: TarotPlayer[] | undefined, index: number): string {
  return players?.[index]?.name ?? `Joueur ${index + 1}`;
}

export function BiddingPanel({ state, players, humanPlayer = 0, onBid }: BiddingPanelProps) {
  const isHumanTurn = !state.finished && state.currentPlayer === humanPlayer;
  const contracts = isHumanTurn ? availableContracts(state) : [];

  const handleBid = (contract: TarotContract) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBid(contract);
  };

  return (
    <View style={styles.panel} accessibilityRole="summary">
      <Text style={styles.eyebrow}>Enchères</Text>
      <Text style={styles.status}>{statusLabel(state, players, humanPlayer)}</Text>

      <View style={styles.highest}>
        <Text style={styles.highestLabel}>Meilleure annonce</Text>
        <Text style={styles.highestValue}>
          {state.highestBid
            ? `${TAROT_CONTRACTS[state.highestBid.contract].label} · ${playerName(players, state.highestBid.player)}`
            : 'Aucune prise'}
        </Text>
      </View>

      {isHumanTurn ? (
        <View style={styles.actions}>
          {contracts.map((contract) => (
            <ContractButton key={contract} contract={contract} onPress={() => handleBid(contract)} />
          ))}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.passButton, pressed && styles.pressed]}
            onPress={() => handleBid('pass')}>
            <Text style={styles.passLabel}>{TAROT_CONTRACTS.pass.label}</Text>
          </Pressable>
        </View>
      ) : null}

      {state.bids.length > 0 ? (
        <View style={styles.history}>
          {state.bids.map((bid, index) => (
            <View key={`${bid.player}-${index}`} style={styles.chip}>
              <Text style={styles.chipPlayer}>{playerName(players, bid.player)}</Text>
              <Text style={[styles.chipContract, bid.contract === 'pass' && styles.chipPass]}>
                {TAROT_CONTRACTS[bid.contract].label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Bouton d'un contrat annonçable, avec son multiplicateur de score. */
function ContractButton({
  contract,
  onPress,
}: {
  contract: TarotAnnounceableContract;
  onPress: () => void;
}) {
  const info = TAROT_CONTRACTS[contract];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${info.label}, multiplicateur ${info.multiplier}`}
      style={({ pressed }) => [styles.contractButton, pressed && styles.pressed]}
      onPress={onPress}>
      <Text style={styles.contractLabel}>{info.label}</Text>
      <Text style={styles.contractMultiplier}>×{info.multiplier}</Text>
    </Pressable>
  );
}

/** Phrase d'état décrivant le moment courant des enchères. */
function statusLabel(
  state: TarotBiddingState,
  players: TarotPlayer[] | undefined,
  humanPlayer: number,
): string {
  if (state.finished) {
    if (everyonePassed(state)) {
      return 'Tout le monde a passé — la donne est rejouée.';
    }
    const taker = state.taker ?? 0;
    const contractLabel = state.contract ? TAROT_CONTRACTS[state.contract].label : '';
    return `${playerName(players, taker)} prend : ${contractLabel}.`;
  }
  if (state.currentPlayer === humanPlayer) {
    return 'À vous d’annoncer.';
  }
  return `Au tour de ${playerName(players, state.currentPlayer ?? 0)}…`;
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: '#E1DBCB',
  },
  eyebrow: {
    color: '#564AA8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  status: {
    color: '#191A1F',
    fontSize: 18,
    fontWeight: '800',
  },
  highest: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#EDE8DA',
  },
  highestLabel: {
    color: '#53635D',
    fontSize: 13,
    fontWeight: '700',
  },
  highestValue: {
    color: '#1A1C26',
    fontSize: 14,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#564AA8',
  },
  contractLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  contractMultiplier: {
    color: '#D8D2F2',
    fontSize: 13,
    fontWeight: '700',
  },
  passButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B7AFC9',
    backgroundColor: 'transparent',
  },
  passLabel: {
    color: '#564AA8',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  history: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EDE8DA',
  },
  chipPlayer: {
    color: '#53635D',
    fontSize: 12,
    fontWeight: '700',
  },
  chipContract: {
    color: '#1A1C26',
    fontSize: 12,
    fontWeight: '800',
  },
  chipPass: {
    color: '#9A93A8',
    fontWeight: '700',
  },
});
