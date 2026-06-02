const { expo } = require('./app.json');

const baseUrl = process.env.EXPO_BASE_URL;

module.exports = {
  expo: {
    ...expo,
    experiments: {
      ...expo.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  },
};
