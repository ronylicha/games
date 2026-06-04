import { useLocalSearchParams } from 'expo-router';

import { GameStage } from '@/components/game-shell/GameStage';
import { VallombreGame } from '@/components/vallombre/VallombreGame';

export default function VallombreScreen() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  const startMode = start === 'new' ? 'new' : start === 'resume' ? 'resume' : undefined;

  return (
    <GameStage title="Les Cendres de Vallombre" subtitle="Visual novel d’enquête steampunk, 12 lieux, 20 indices, 6 suspects et 5 fins.">
      <VallombreGame startMode={startMode} />
    </GameStage>
  );
}
