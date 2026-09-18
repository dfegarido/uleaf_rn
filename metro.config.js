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
    assetExts: [...resolver.assetExts.filter(ext => ext !== 'svg'), 'lottie'],
    sourceExts: [...resolver.sourceExts, 'svg', 'cjs'],
    // RN 0.87 ships @react-native/asset-utils with NO `main` field — only a package
    // `exports` map — so Metro must resolve `exports` or bundling fails outright
    // ("main module field could not be resolved").
    unstable_enablePackageExports: true,
    // ...but exports resolution breaks the Firebase JS SDK on RN.
    //
    // `firebase@10.14.1` exposes NO `react-native` export condition, so `firebase/firestore`
    // resolves through `browser`/`default` (dist/esm/index.esm.js) while the underlying
    // `@firebase/firestore` — which DOES have a `react-native` condition (dist/index.rn.js)
    // — loads its own build. Two different Firestore module instances end up in the bundle,
    // so the instance created by firebase/app is not the one the SDK's collection() checks
    // against, and the app dies at startup with:
    //   "FirebaseError: Expected first argument to collection() to be a
    //    CollectionReference, a DocumentReference or FirebaseFirestore"
    // (firebase-js-sdk#8988)
    //
    // Fix: force every firebase/@firebase package back to classic main-field resolution
    // (which honours the `react-native` field consistently) while the rest of the graph
    // keeps exports resolution (which RN 0.87 requires).
    resolveRequest: (context, moduleName, platform) => {
      const isFirebasePackage =
        moduleName === 'firebase' ||
        moduleName.startsWith('firebase/') ||
        moduleName.startsWith('@firebase/');

      if (isFirebasePackage) {
        return context.resolveRequest(
          {...context, unstable_enablePackageExports: false},
          moduleName,
          platform,
        );
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  };

  return metroConfig;
})();
