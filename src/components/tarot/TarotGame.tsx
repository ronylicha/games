// Orchestrateur du Tarot français : composant présentationnel contrôlé.
//
// Il compose les panneaux de chaque phase (enchères, écart, jeu, score) à
// partir d'un unique `controller` (le contrat de vue ci-dessous). Il n'embarque
// aucune règle de jeu propre : l'état et les actions viennent du hook
// `useTarotGame`, que la route branche via `controller={useTarotGame(...)}`.
//
// Seul l'écart (sélection des cartes à défausser par le preneur humain) est
// géré localement, comme état d'UI transitoire : la validation reste déléguée
// au moteur (`validateEcart`), aucune règle n'est dupliquée.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  TAROT_CONTRACTS,
  validateEcart,
  type TarotAnnounceableContract,
  type TarotBiddingState,
  type TarotCard as TarotCardModel,
  type TarotContract,
  type TarotPhase,
  type TarotPlayer,
  type TarotScoreResult,
  type TarotTrick,
} from '@/game/tarot';

import { BiddingPanel } from './BiddingPanel';
import { Scoreboard } from './Scoreboard';
import { TarotCard } from './TarotCard';
import { TarotTable } from './TarotTable';

/**
 * Contrat de vue consommé par `TarotGame`. Le hook `useTarotGame` type son
 * retour avec ce contrat ; la route compose `<TarotGame controller={...} />`.
 * Définir le contrat côté consommateur (inversion de dépendance) découple
 * l'orchestrateur de l'implémentation du hook.
 */
export type TarotGameController = {
  /** Joueurs à la table (l'index est la position canonique). */
  players: TarotPlayer[];
  /** Index du joueur humain ; sa main est visible et jouable. */
  humanPlayer: number;
  /** Phase courante de la donne. */
  phase: TarotPhase;
  /** Mains courantes par joueur (indexées comme `players`). */
  hands: TarotCardModel[][];

  /** État de la machine à états des enchères. */
  bidding: TarotBiddingState;
  /** Annonce (ou passe) du joueur humain. */
  onBid: (contract: TarotContract) => void;

  /** Preneur désigné, ou `null` tant que les enchères ne sont pas closes. */
  taker: number | null;
  /** Contrat retenu, ou `null` si tout le monde a passé. */
  contract: TarotAnnounceableContract | null;
  /** Taille du chien / nombre exact de cartes à écarter. */
  chienSize: number;
  /** Main combinée (main + chien) dans laquelle le preneur humain écarte. */
  discardHand: TarotCardModel[];
  /** Le contrat impose-t-il au joueur humain de constituer un écart ? */
  requiresEcart: boolean;
  /** Soumet l'écart validé constitué par le joueur humain. */
  onSubmitEcart: (selection: TarotCardModel[]) => void;

  /** Pli en cours, ou `null` hors phase de jeu. */
  trick: TarotTrick | null;
  /** Joueur dont c'est le tour, ou `null`. */
  currentPlayer: number | null;
  /** Cartes légales pour le joueur humain (vide si ce n'est pas son tour). */
  legalCards: TarotCardModel[];
  /** Joue une carte (joueur humain). */
  onPlayCard: (card: TarotCardModel) => void;

  /** Résultat de la donne (phases `scoring`/`finished`), sinon `null`. */
  score: TarotScoreResult | null;
  /** Scores cumulés par joueur, indexés par position. */
  totals: number[];

  /** Démarre une nouvelle donne. */
  onNewDeal: () => void;
};

type TarotGameProps = {
  /** État + actions de la partie, fournis par le hook `useTarotGame`. */
  controller: TarotGameController;
};

/** Nom affiché d'un joueur (repli sur « Joueur N »). */
function playerName(players: TarotPlayer[], index: number): string {
  return players[index]?.name ?? `Joueur ${index + 1}`;
}

export function TarotGame({ controller }: TarotGameProps) {
  const {
    players,
    humanPlayer,
    phase,
    hands,
    bidding,
    onBid,
    taker,
    contract,
    chienSize,
    discardHand,
    requiresEcart,
    onSubmitEcart,
    trick,
    currentPlayer,
    legalCards,
    onPlayCard,
    score,
    totals,
    onNewDeal,
  } = controller;

  return (
    <View style={styles.container}>
      {phase === 'dealing' ? (
        <Banner title="Distribution…" subtitle="Les cartes sont en train d'être distribuées." />
      ) : null}

      {phase === 'bidding' ? (
        <View style={styles.section}>
          <BiddingPanel state={bidding} players={players} humanPlayer={humanPlayer} onBid={onBid} />
          <TarotTable
            players={players}
            hands={hands}
            humanPlayer={humanPlayer}
            currentPlayer={bidding.currentPlayer}
          />
        </View>
      ) : null}

      {phase === 'discard' ? (
        <DiscardPhase
          players={players}
          humanPlayer={humanPlayer}
          taker={taker}
          contract={contract}
          chienSize={chienSize}
          discardHand={discardHand}
          requiresEcart={requiresEcart}
          onSubmitEcart={onSubmitEcart}
        />
      ) : null}

      {phase === 'playing' ? (
        <TarotTable
          players={players}
          hands={hands}
          humanPlayer={humanPlayer}
          trick={trick}
          currentPlayer={currentPlayer}
          legalCards={legalCards}
          onPlayCard={onPlayCard}
        />
      ) : null}

      {(phase === 'scoring' || phase === 'finished') && score ? (
        <View style={styles.section}>
          <Scoreboard result={score} taker={taker ?? 0} players={players} totals={totals} />
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.newDeal, pressed && styles.pressed]}
            onPress={onNewDeal}>
            <Text style={styles.newDealLabel}>Nouvelle donne</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** Bandeau informatif simple (phase transitoire ou attente). */
function Banner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.banner} accessibilityRole="summary">
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerSubtitle}>{subtitle}</Text>
    </View>
  );
}

type DiscardPhaseProps = {
  players: TarotPlayer[];
  humanPlayer: number;
  taker: number | null;
  contract: TarotAnnounceableContract | null;
  chienSize: number;
  discardHand: TarotCardModel[];
  requiresEcart: boolean;
  onSubmitEcart: (selection: TarotCardModel[]) => void;
};

/**
 * Phase d'écart. Si le contrat n'impose pas d'écart, ou si le preneur n'est pas
 * le joueur humain, on affiche un simple bandeau d'attente. Sinon le joueur
 * humain choisit exactement `chienSize` cartes ; la validité est calculée par
 * le moteur (`validateEcart`), seul un écart valide active la confirmation.
 */
function DiscardPhase({
  players,
  humanPlayer,
  taker,
  contract,
  chienSize,
  discardHand,
  requiresEcart,
  onSubmitEcart,
}: DiscardPhaseProps) {
  const contractLabel = contract ? TAROT_CONTRACTS[contract].label : '';
  const humanIsTaker = taker === humanPlayer;

  if (!requiresEcart || !humanIsTaker) {
    const who = taker !== null ? playerName(players, taker) : 'Le preneur';
    return (
      <Banner
        title="Écart"
        subtitle={
          requiresEcart
            ? `${who} constitue son écart (${contractLabel})…`
            : `${who} joue ${contractLabel} : pas d'écart à faire.`
        }
      />
    );
  }

  return (
    <EcartSelector chienSize={chienSize} combinedHand={discardHand} onSubmit={onSubmitEcart} />
  );
}

type EcartSelectorProps = {
  chienSize: number;
  combinedHand: TarotCardModel[];
  onSubmit: (selection: TarotCardModel[]) => void;
};

/**
 * Sélecteur d'écart : le preneur humain choisit ses cartes à mettre de côté.
 * La validation (nombre, cartes interdites, limite d'atouts) est déléguée au
 * moteur ; le bouton de confirmation n'est actif que pour un écart valide.
 */
function EcartSelector({ chienSize, combinedHand, onSubmit }: EcartSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  const selection = useMemo(
    () => combinedHand.filter((card) => selectedIds.has(card.id)),
    [combinedHand, selectedIds],
  );

  const validation = useMemo(
    () => validateEcart(selection, combinedHand, chienSize),
    [selection, combinedHand, chienSize],
  );

  const toggle = (card: TarotCardModel) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else {
        next.add(card.id);
      }
      return next;
    });
  };

  return (
    <View style={styles.ecart} accessibilityRole="summary">
      <Text style={styles.eyebrow}>Écart</Text>
      <Text style={styles.ecartStatus}>
        {selection.length} / {chienSize} carte{chienSize > 1 ? 's' : ''} sélectionnée
        {selection.length > 1 ? 's' : ''}
      </Text>

      <View style={styles.ecartHand}>
        {combinedHand.map((card) => (
          <TarotCard
            key={card.id}
            card={card}
            width={56}
            selected={selectedIds.has(card.id)}
            onPress={toggle}
            style={styles.ecartCard}
          />
        ))}
      </View>

      {validation.revealsTrumps ? (
        <Text style={styles.ecartHint}>Des atouts sont à l’écart : ils seront montrés aux autres joueurs.</Text>
      ) : null}

      {selection.length === chienSize && !validation.valid ? (
        <Text style={styles.ecartError}>{validation.errors[0]}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !validation.valid }}
        disabled={!validation.valid}
        style={({ pressed }) => [
          styles.confirm,
          !validation.valid && styles.confirmDisabled,
          pressed && validation.valid && styles.pressed,
        ]}
        onPress={() => onSubmit(selection)}>
        <Text style={styles.confirmLabel}>Valider l’écart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  section: {
    width: '100%',
    gap: 16,
  },
  banner: {
    width: '100%',
    gap: 6,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: '#E1DBCB',
  },
  bannerTitle: {
    color: '#191A1F',
    fontSize: 18,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: '#53635D',
    fontSize: 14,
    fontWeight: '600',
  },
  ecart: {
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
  ecartStatus: {
    color: '#191A1F',
    fontSize: 18,
    fontWeight: '800',
  },
  ecartHand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ecartCard: {
    marginBottom: 6,
  },
  ecartHint: {
    color: '#53635D',
    fontSize: 13,
    fontWeight: '600',
  },
  ecartError: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '700',
  },
  confirm: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#564AA8',
  },
  confirmDisabled: {
    backgroundColor: '#B7AFC9',
  },
  confirmLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  newDeal: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#114A34',
  },
  newDealLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
