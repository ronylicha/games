const { expo } = require('./app.json');

const baseUrl = process.env.EXPO_BASE_URL;

module.exports = {
  expo: {
    ...expo,
    plugins: [...(expo.plugins ?? []), 'expo-audio', 'expo-asset'],
    experiments: {
      ...expo.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  },
};
