import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useResponsive } from '@/hooks/use-responsive';
import { useSafeNavInsets } from '@/hooks/use-safe-nav-insets';

import { BackButton } from './BackButton';

type GameStageProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function GameStage({ title, subtitle, children }: GameStageProps) {
  const nav = useSafeNavInsets();
  const { contentMaxWidth, isLargeScreen } = useResponsive();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: nav.top, paddingBottom: nav.bottom, paddingLeft: nav.left, paddingRight: nav.right },
        ]}>
        <View style={[styles.body, { maxWidth: contentMaxWidth }, isLargeScreen && styles.bodyLarge]}>
          <BackButton />
          <View style={styles.header}>
            <Text style={[styles.eyebrow, isLargeScreen && styles.eyebrowLarge]}>Jeux duel</Text>
            <Text numberOfLines={2} style={[styles.title, isLargeScreen && styles.titleLarge]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, isLargeScreen && styles.subtitleLarge]}>{subtitle}</Text>
          </View>
          {children}
        </View>
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
  },
  body: {
    width: '100%',
    gap: 18,
  },
  bodyLarge: {
    gap: 26,
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
  eyebrowLarge: {
    fontSize: 15,
  },
  title: {
    color: '#191A1F',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  titleLarge: {
    fontSize: 40,
    lineHeight: 46,
  },
  subtitle: {
    color: '#53635D',
    fontSize: 15,
    lineHeight: 21,
  },
  subtitleLarge: {
    fontSize: 18,
    lineHeight: 25,
  },
});
