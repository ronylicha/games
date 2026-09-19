const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ADI_CONTENT = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'adi-registration.properties'),
  'utf8'
);

const withAdiRegistration = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const assetsDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets'
      );
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(assetsDir, 'adi-registration.properties'),
        ADI_CONTENT
      );
      return config;
    },
  ]);

module.exports = withAdiRegistration;
