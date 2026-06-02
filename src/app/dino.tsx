import { DinoGame } from '@/components/dino/DinoGame';
import { GameStage } from '@/components/game-shell/GameStage';

export default function DinoScreen() {
  return (
    <GameStage title="Dino Run" subtitle="Course réflexe avec cactus, oiseaux, nuages, score et leaderboard.">
      <DinoGame />
    </GameStage>
  );
}
