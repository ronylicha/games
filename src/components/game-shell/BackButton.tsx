import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export function BackButton() {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={() => router.replace('/')}>
      <Text style={styles.text}>Retour</Text>
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
  pressed: {
    opacity: 0.76,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
