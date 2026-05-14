// Aprende mas: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Permitir cargar videos webm/mp4 con require() en login.tsx
const ASSET_EXTS = ['webm', 'mp4', 'mov', 'm4v']
for (const ext of ASSET_EXTS) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext)
  }
}

module.exports = config
