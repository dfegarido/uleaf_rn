/**
 * Regression test: a live listing's photo must CROSS-FADE when it is replaced.
 *
 * The seller's auto-snapshot rewrites `listing.imageprimary`; the buyer's live
 * screen polls `active-live-listing` every 10s, so the card's `uri` changes under
 * it. PlantListingImage used to unmount the outgoing photo and show the
 * ActivityIndicator + white veil on every source change, so the buyer saw the
 * plant photo blank out into a spinner and pop back in.
 *
 * Contract pinned here:
 *   1. the FIRST photo still gets its spinner (nothing painted yet),
 *   2. a REPLACED photo keeps the previous one on screen and shows NO spinner,
 *   3. the new photo fades in on top (opacity animates) and the old one is dropped,
 *   4. a cleared uri falls back to the missing-image placeholder, not the stale photo.
 */
import React from 'react';
import {ActivityIndicator, Animated, Image} from 'react-native';
import {it, expect, jest, describe, beforeEach} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

// The component is driven by a hook that prefetches + remounts the remote image in
// a retry loop until it is displayed. Left alone it schedules state updates forever
// (and outside `act`). Parking the prefetch on a promise that never settles isolates
// the render contract under test from RN's real image pipeline.
Image.prefetch = jest.fn(() => new Promise(() => {}));

const PlantListingImage =
  require('../src/components/PlantListingImage/PlantListingImage').default;

// The fade runs on the native driver; capture its config and completion callback so
// the test can drive the fade instead of relying on RN's animation plumbing.
let fadeTweens;
beforeEach(() => {
  fadeTweens = [];
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
    const tween = {
      config,
      onComplete: null,
      start: (cb) => {
        tween.onComplete = cb;
      },
      stop: () => {},
      reset: () => {},
    };
    fadeTweens.push(tween);
    return tween;
  });
});

const FIRST = 'https://x.supabase.co/storage/v1/object/public/listings/a.jpg';
const SECOND = 'https://x.supabase.co/storage/v1/object/public/listings/b.jpg';

/** Remote-URL images only; the bundled placeholder is a `require()` asset. */
const remoteImages = (tree) =>
  tree.root
    .findAllByType(Image)
    .filter((node) => typeof node.props.source?.uri === 'string');

/** The incoming photo is the one carrying load handlers; the painted one has none. */
const incomingImages = (tree) =>
  remoteImages(tree).filter((node) => typeof node.props.onLoad === 'function');

const paintedImages = (tree) =>
  remoteImages(tree).filter((node) => typeof node.props.onLoad !== 'function');

const flattenStyle = (style) => Object.assign({}, ...[style].flat(Infinity));

// `enableSlowFallback: false` keeps the 6s slow-load timer (also outside `act`) out
// of the test; the spinner under test is the pre-load one, not the slow-load one.
const element = (uri) => (
  <PlantListingImage
    uri={uri}
    style={{width: 72, height: 72}}
    enableSlowFallback={false}
  />
);

const mount = (uri) => {
  let tree;
  act(() => {
    tree = renderer.create(element(uri));
  });
  return tree;
};

const setUri = (tree, uri) => {
  act(() => {
    tree.update(element(uri));
  });
};

/** Simulate the native side reporting the incoming photo is decoded. */
const fireLoad = (tree) => {
  const incoming = incomingImages(tree)[0];
  expect(incoming).toBeDefined();
  act(() => {
    incoming.props.onLoad();
  });
};

/** Simulate the fade finishing. */
const finishFade = (tween) => {
  act(() => {
    tween.onComplete({finished: true});
  });
};

describe('PlantListingImage photo replacement', () => {
  it('shows a spinner for the first photo, before anything is painted', () => {
    const tree = mount(FIRST);
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    expect(paintedImages(tree)).toHaveLength(0);
    // Nothing to fade over on a first load, so the layer is simply opaque.
    const incoming = incomingImages(tree)[0];
    expect(flattenStyle(incoming.parent.props.style).opacity).toBe(1);
  });

  it('keeps the previous photo and hides the spinner when the uri is replaced', () => {
    const tree = mount(FIRST);
    fireLoad(tree);

    // The seller's snapshot lands: the poll swaps the card's uri.
    setUri(tree, SECOND);

    // No blank-out: the outgoing photo is still mounted, and no spinner.
    expect(paintedImages(tree)).toHaveLength(1);
    expect(paintedImages(tree)[0].props.source.uri).toContain('listings/a.jpg');
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(0);
  });

  it('mounts the incoming photo invisible, then fades it in over the old one', () => {
    const tree = mount(FIRST);
    fireLoad(tree);

    setUri(tree, SECOND);

    // The incoming layer is wrapped in an Animated.View starting at opacity 0, so
    // it reveals the outgoing photo underneath instead of cutting to a blank slot.
    const incoming = incomingImages(tree)[0];
    const layerStyle = flattenStyle(incoming.parent.props.style);
    expect(layerStyle.opacity).toBe(0);
    // Swapping the uri must not itself animate anything: the new photo stays
    // invisible until it has actually decoded.
    expect(fadeTweens).toHaveLength(0);

    fireLoad(tree);

    expect(fadeTweens).toHaveLength(1);
    expect(fadeTweens[0].config.toValue).toBe(1);
    expect(fadeTweens[0].config.useNativeDriver).toBe(true);
    // The old photo is STILL up mid-fade — releasing it earlier would blank the slot.
    expect(paintedImages(tree)).toHaveLength(1);
    expect(paintedImages(tree)[0].props.source.uri).toContain('listings/a.jpg');

    finishFade(fadeTweens[0]);

    expect(paintedImages(tree)).toHaveLength(0);
    expect(incomingImages(tree)[0].props.source.uri).toContain('listings/b.jpg');
  });

  it('falls back to the placeholder when the listing loses its photo', () => {
    const tree = mount(FIRST);
    fireLoad(tree);

    setUri(tree, null);

    expect(remoteImages(tree)).toHaveLength(0);
    expect(tree.root.findAllByType(Image).length).toBeGreaterThan(0);
  });
});
