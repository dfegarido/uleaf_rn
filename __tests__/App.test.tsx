/**
 * @format
 */

import 'react-native';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it, test} from '@jest/globals';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
