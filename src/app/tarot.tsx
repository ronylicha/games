import { GameStage } from '@/components/game-shell/GameStage';
import { TarotGame, type TarotGameController } from '@/components/tarot/TarotGame';
import { useTarotGame } from '@/components/tarot/use-tarot-game';

export default function TarotScreen() {
  const game = useTarotGame();

  // Adapte le retour du hook (`UseTarotGameResult`) au contrat de vue attendu
  // par l'orchestrateur (`TarotGameController`). Le hook agrège son état sous
  // `state` ; l'orchestrateur consomme une vue à plat — cette projection est le
  // seul point de jonction entre les deux.
  const controller: TarotGameController = {
    players: game.state.players,
    humanPlayer: game.state.humanPlayer,
    phase: game.state.phase,
    hands: game.state.hands,
    bidding: game.state.bidding,
    onBid: game.bid,
    taker: game.state.taker,
    contract: game.state.contract,
    chienSize: game.state.chien.length,
    discardHand: game.state.combinedHand ?? [],
    requiresEcart: game.state.awaitingEcart,
    onSubmitEcart: game.setEcart,
    trick: game.state.trick,
    currentPlayer: game.currentPlayer,
    legalCards: game.humanLegalCards,
    onPlayCard: game.playCard,
    score: game.state.result,
    totals: game.state.totals,
    onNewDeal: game.nextDeal,
  };

  return (
    <GameStage title="Tarot" subtitle="Tarot français à 4 joueurs : enchères, écart et plis contre l'IA.">
      <TarotGame controller={controller} />
    </GameStage>
  );
}
