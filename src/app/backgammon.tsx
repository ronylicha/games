import { BackgammonGame } from '@/components/backgammon/BackgammonGame';
import { GameScreenScaffold } from '@/components/game-shell/GameScreenScaffold';

export default function BackgammonScreen() {
  return (
    <GameScreenScaffold variant="fill" navMargins={{ left: 8, right: 8 }}>
      <BackgammonGame />
    </GameScreenScaffold>
  );
}
