import { GameStage } from '@/components/game-shell/GameStage';
import { SolitaireGame } from '@/components/solitaire/SolitaireGame';

export default function SolitaireScreen() {
  return (
    <GameStage title="Solitaire" subtitle="Klondike avec pioche infinie ou limitée à 3 reprises.">
      <SolitaireGame />
    </GameStage>
  );
}
