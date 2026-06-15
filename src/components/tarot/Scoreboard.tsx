// Tableau de score du Tarot : composant présentationnel contrôlé.
//
// Il n'embarque aucune règle de score : il reçoit le résultat déjà calculé par
// le moteur (`TarotScoreResult`, produit par `scoreContract`) et se contente de
// le mettre en forme — issue du contrat, détail des primes (petit au bout,
// poignée, chelem) et delta de chaque joueur (le preneur encaisse `takerScore`,
// chaque défenseur règle `defenderScore`). Des totaux cumulés optionnels
// permettent de suivre le score d'une partie sur plusieurs donnes.

import { StyleSheet, Text, View } from 'react-native';

import { TAROT_CONTRACTS, type TarotPlayer, type TarotScoreResult } from '@/game/tarot';

type ScoreboardProps = {
  /** Résultat de la donne, tel que renvoyé par `scoreContract`. */
  result: TarotScoreResult;
  /** Index du preneur (pour le repérer parmi les joueurs). */
  taker: number;
  /** Joueurs à la table, pour afficher les noms (optionnel). */
  players?: TarotPlayer[];
  /** Scores cumulés par joueur sur la partie (optionnel), indexés par position. */
  totals?: number[];
};

/** Nom affiché d'un joueur (repli sur « Joueur N » si non fourni). */
function playerName(players: TarotPlayer[] | undefined, index: number): string {
  return players?.[index]?.name ?? `Joueur ${index + 1}`;
}

/** Met en forme un nombre de points en demi-points (virgule décimale française). */
function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

/** Met en forme un score signé (+12 / -8), avec le moins typographique. */
function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  if (value < 0) {
    return `−${Math.abs(value)}`;
  }
  return '0';
}

/** Une ligne du détail de calcul (libellé + valeur signée). */
function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{formatSigned(value)}</Text>
    </View>
  );
}

export function Scoreboard({ result, taker, players, totals }: ScoreboardProps) {
  const contractLabel = TAROT_CONTRACTS[result.contract].label;
  const boutsLabel = `${result.takerBouts} bout${result.takerBouts > 1 ? 's' : ''}`;

  return (
    <View style={styles.panel} accessibilityRole="summary">
      <Text style={styles.eyebrow}>Score de la donne</Text>

      <View style={styles.headline}>
        <Text style={styles.contract}>
          {contractLabel} <Text style={styles.multiplier}>×{result.multiplier}</Text>
        </Text>
        <View style={[styles.badge, result.contractWon ? styles.badgeWon : styles.badgeLost]}>
          <Text style={styles.badgeText}>{result.contractWon ? 'Contrat gagné' : 'Contrat chuté'}</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Points du preneur</Text>
        <Text style={styles.summaryValue}>
          {formatPoints(result.takerCardPoints)} / {result.target} · {boutsLabel}
        </Text>
      </View>

      <View style={styles.breakdown}>
        <BreakdownRow label={`Socle (25 + ${result.ecart})`} value={result.baseValue} />
        {result.petitAuBoutValue !== 0 ? (
          <BreakdownRow label="Petit au bout" value={result.petitAuBoutValue} />
        ) : null}
        {result.poigneeValue !== 0 ? (
          <BreakdownRow label="Poignée" value={result.poigneeValue} />
        ) : null}
        {result.chelemValue !== 0 ? (
          <BreakdownRow label="Chelem" value={result.chelemValue} />
        ) : null}
        <View style={[styles.breakdownRow, styles.breakdownTotal]}>
          <Text style={styles.breakdownTotalLabel}>Par défenseur</Text>
          <Text style={styles.breakdownTotalValue}>{formatSigned(result.perDefender)}</Text>
        </View>
      </View>

      <View style={styles.players}>
        {Array.from({ length: result.playerCount }, (_, index) => {
          const isTaker = index === taker;
          const delta = isTaker ? result.takerScore : result.defenderScore;
          return (
            <View key={index} style={styles.playerRow}>
              <View style={styles.playerIdentity}>
                <Text style={styles.playerName}>{playerName(players, index)}</Text>
                {isTaker ? <Text style={styles.takerTag}>Preneur</Text> : null}
              </View>
              <View style={styles.playerScores}>
                <Text style={[styles.playerDelta, delta >= 0 ? styles.deltaUp : styles.deltaDown]}>
                  {formatSigned(delta)}
                </Text>
                {totals ? <Text style={styles.playerTotal}>{totals[index] ?? 0}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
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
  headline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  contract: {
    color: '#191A1F',
    fontSize: 20,
    fontWeight: '800',
  },
  multiplier: {
    color: '#564AA8',
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeWon: {
    backgroundColor: '#2F8F5B',
  },
  badgeLost: {
    backgroundColor: '#C0392B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#EDE8DA',
  },
  summaryLabel: {
    color: '#53635D',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#1A1C26',
    fontSize: 14,
    fontWeight: '800',
  },
  breakdown: {
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  breakdownLabel: {
    color: '#53635D',
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownValue: {
    color: '#1A1C26',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  breakdownTotal: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E1DBCB',
  },
  breakdownTotalLabel: {
    color: '#191A1F',
    fontSize: 15,
    fontWeight: '800',
  },
  breakdownTotalValue: {
    color: '#191A1F',
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  players: {
    gap: 6,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#EDE8DA',
  },
  playerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: '#1A1C26',
    fontSize: 15,
    fontWeight: '800',
  },
  takerTag: {
    color: '#564AA8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerDelta: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  deltaUp: {
    color: '#2F8F5B',
  },
  deltaDown: {
    color: '#C0392B',
  },
  playerTotal: {
    color: '#53635D',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
});
