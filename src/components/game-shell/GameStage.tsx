import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from './BackButton';

type GameStageProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function GameStage({ title, subtitle, children }: GameStageProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 18) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}>
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
          <BackButton />
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Jeux duel</Text>
            <Text numberOfLines={2} style={styles.title}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {children}
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
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  safeArea: {
    width: '100%',
    maxWidth: 760,
    gap: 18,
  },
  header: {
    gap: 4,
  },
  eyebrow: {
    color: '#5D6D66',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#191A1F',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    color: '#53635D',
    fontSize: 15,
    lineHeight: 21,
  },
});
