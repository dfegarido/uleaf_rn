const {getDefaultConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = (() => {
  const metroConfig = getDefaultConfig(__dirname);

  const {transformer, resolver} = metroConfig;

  metroConfig.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  metroConfig.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg', 'cjs'],
    // Firebase JS SDK + RN: package "exports" resolution can load the wrong
    // @firebase/auth build ("Component auth has not been registered yet").
    // See https://github.com/firebase/firebase-js-sdk/issues/8988
    unstable_enablePackageExports: false,
  };

  return metroConfig;
})();
