import { CheckersGame } from '@/components/checkers/CheckersGame';
import { GameScreenScaffold } from '@/components/game-shell/GameScreenScaffold';

export default function CheckersScreen() {
  return (
    <GameScreenScaffold maxWidth={720}>
      <CheckersGame compact />
    </GameScreenScaffold>
  );
}
