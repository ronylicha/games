import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/game-shell/BackButton';
import { CheckersGame } from '@/components/checkers/CheckersGame';

export default function CheckersScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 18) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}>
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
          <BackButton />
          <CheckersGame compact />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  safeArea: {
    width: '100%',
    maxWidth: 720,
    gap: 14,
  },
});
