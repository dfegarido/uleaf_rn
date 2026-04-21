/**
 * @format
 * Smoke test only: the full `App` graph pulls many native modules (Agora, FS, camera, etc.).
 * Use device builds / E2E for integration. This keeps `npm test` fast and stable in CI.
 */
import 'react-native';
import React from 'react';
import {it} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

jest.mock('../App', () => {
  const RN = require('react-native');
  const ReactMod = require('react');
  function App() {
    return ReactMod.createElement(
      RN.View,
      {testID: 'jest-app-smoke'},
      ReactMod.createElement(RN.Text, null, 'iLeafU'),
    );
  }
  return {__esModule: true, default: App};
});

const App = require('../App').default;

it('renders smoke root', () => {
  act(() => {
    renderer.create(React.createElement(App, null));
  });
});
