import { ConnectFourGame } from '@/components/connect-four/ConnectFourGame';
import { GameStage } from '@/components/game-shell/GameStage';

export default function ConnectFourScreen() {
  return (
    <GameStage title="Puissance 4" subtitle="Plateau moderne, jetons 3D et IA tactique.">
      <ConnectFourGame />
    </GameStage>
  );
}
