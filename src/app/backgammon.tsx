import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackgammonGame } from '@/components/backgammon/BackgammonGame';
import { BackButton } from '@/components/game-shell/BackButton';

export default function BackgammonScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <SafeAreaView
        edges={['left', 'right']}
        style={[
          styles.safeArea,
          {
            paddingTop: Math.max(insets.top, 10),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}>
        <View style={[styles.backButton, { top: Math.max(insets.top + 6, 12) }]}>
          <BackButton />
        </View>
        <BackgammonGame />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
  },
});
