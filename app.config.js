/**
 * Expo config on top of app.json. This file wins: Expo passes app.json in as
 * `config` and uses what this returns. app.json holds only the static image
 * paths; every brand colour is set here from the token module (theme/tokens.js),
 * so the splash, adaptive icon background (#011A4D) and notification accent use
 * the same values as the app. Keep colours out of app.json.
 * Icon PNGs: `node scripts/generate-icons.mjs` (from assets/brand/*.svg).
 */
const { colors } = require('./theme/tokens');

module.exports = ({ config }) => ({
  ...config,
  userInterfaceStyle: 'light',
  android: {
    ...config.android,
    adaptiveIcon: {
      ...config.android.adaptiveIcon,
      backgroundColor: colors.primary,
    },
  },
  plugins: [
    // Inter embedded at build time (android/app/src/main/assets/fonts), family
    // names = file names (Inter-Regular, Inter-Medium, Inter-SemiBold). Loaded
    // only at runtime, Android measured text with the fallback face and drew it
    // with Inter, so every shrink-wrapped label lost its last letter or word.
    ['expo-font', { fonts: ['./assets/fonts/Inter-Regular.ttf', './assets/fonts/Inter-Medium.ttf', './assets/fonts/Inter-SemiBold.ttf'] }],
    ...config.plugins.map((plugin) => {
    if (!Array.isArray(plugin)) return plugin;
    const [name, options] = plugin;
    if (name === 'expo-splash-screen') {
      // Full gradient splash, centred mark (brand/splash). The native splash is
      // one colour, so it uses the gradient's top stop; the JS LaunchScreen
      // takes over with the full gradient.
      return [name, { ...options, backgroundColor: colors.primary, imageWidth: 104, dark: { backgroundColor: colors.primary } }];
    }
    if (name === 'expo-notifications') return [name, { ...options, color: colors.primary }];
    return plugin;
  }),
  ],
});
