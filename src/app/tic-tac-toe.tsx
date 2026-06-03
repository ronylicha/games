import { TicTacToeGame } from '@/components/tic-tac-toe/TicTacToeGame';
import { GameStage } from '@/components/game-shell/GameStage';

export default function TicTacToeScreen() {
  return (
    <GameStage title="Tic Tac Toe" subtitle="Rounds arcade, duel local et IA imbattable.">
      <TicTacToeGame />
    </GameStage>
  );
}
