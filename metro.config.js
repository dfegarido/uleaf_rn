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
    // RN 0.87 moved this off Libraries/Image/AssetRegistry.
    assetRegistryPath: 'react-native/asset-registry',
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
      // Stale Metro transforms / older deps still require the pre-0.87 path.
      if (
        moduleName === 'react-native/Libraries/Image/AssetRegistry' ||
        moduleName.endsWith('/Libraries/Image/AssetRegistry')
      ) {
        return context.resolveRequest(
          context,
          'react-native/asset-registry',
          platform,
        );
      }

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

      // ...and exports resolution also trips on a React Native 0.87 bug.
      //
      // `@react-native/virtualized-lists@0.87.x` deep-imports
      // `react-native/src/private/featureflags/ReactNativeFeatureFlags` (bare specifier)
      // from VirtualizedList.js and VirtualizeUtils.js, but RN 0.87 removed the `./src/*`
      // wildcard from its package `exports`, so that subpath is no longer listed. Metro
      // warns and falls back to file-based resolution — the bundle is byte-identical
      // either way, so this is noise, not a failure.
      //
      // Upstream: facebook/react-native#57933, fix PRs #57940/#57969 (not in any released
      // 0.87.x). Resolving these with exports off reproduces Metro's own fallback one step
      // earlier and silences the warning. Drop this branch once the fix ships.
      if (moduleName.startsWith('react-native/src/')) {
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
