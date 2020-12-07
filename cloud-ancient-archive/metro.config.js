module.exports = {
  resolver: {
    platforms: ['web', 'ios', 'android'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'mp4', 'mp3'], // keep in sync with bablrc
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
