module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 movio su plugin a `react-native-worklets`.
    // Este plugin debe ir SIEMPRE al final.
    plugins: ['react-native-worklets/plugin'],
  }
}
