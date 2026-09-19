import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useResponsive } from '@/hooks/use-responsive';

export function BackButton() {
  const { isLargeScreen } = useResponsive();

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, isLargeScreen && styles.buttonLarge, pressed && styles.pressed]}
      onPress={() => router.replace('/')}>
      <Text style={[styles.text, isLargeScreen && styles.textLarge]}>Retour</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22342F',
  },
  buttonLarge: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.76,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  textLarge: {
    fontSize: 17,
  },
});
