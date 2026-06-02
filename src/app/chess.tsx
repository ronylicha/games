import { ChessGame } from '@/components/chess/ChessGame';
import { GameStage } from '@/components/game-shell/GameStage';

export default function ChessScreen() {
  return (
    <GameStage title="Échecs" subtitle="Choisis le niveau de l'IA puis joue les blancs.">
      <ChessGame />
    </GameStage>
  );
}
