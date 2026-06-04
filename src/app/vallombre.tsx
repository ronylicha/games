import { useLocalSearchParams } from 'expo-router';

import { VallombreGame } from '@/components/vallombre/VallombreGame';

export default function VallombreScreen() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  const startMode = start === 'new' ? 'new' : start === 'resume' ? 'resume' : undefined;

  return <VallombreGame startMode={startMode} />;
}
