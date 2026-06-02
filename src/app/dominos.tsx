import { DominoesGame } from '@/components/dominoes/DominoesGame';
import { GameStage } from '@/components/game-shell/GameStage';

export default function DominosScreen() {
  return (
    <GameStage title="Dominos" subtitle="Pose, pioche et bloque ton adversaire.">
      <DominoesGame />
    </GameStage>
  );
}
