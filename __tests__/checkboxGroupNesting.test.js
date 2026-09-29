/**
 * Regression test for the admin Listings Viewer status filter sheet.
 *
 * Reported: opening the Status modal and ticking a checkbox logged
 *   "VirtualizedLists should never be nested inside plain ScrollViews with the
 *    same orientation ..."
 *
 * Root cause: CheckBoxGroup renders a FlatList (a VirtualizedList). The STATUS
 * sheet wrapped it in a plain vertical ScrollView. `nestedScrollEnabled` does
 * not suppress React Native's dev-only nesting check - the list has to own its
 * scrolling, given a bounded height via `containerStyle`.
 *
 * The RN jest preset mocks ScrollView without its context provider, so the
 * warning can never fire while mocked. We unmock it to exercise the real check.
 */
import React from 'react';
import {ScrollView, Text} from 'react-native';
import {it, expect, jest, describe} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

jest.unmock('react-native/Libraries/Components/ScrollView/ScrollView');

const ReusableActionSheet =
  require('../src/components/ReusableActionSheet/ReusableActionSheet').default;
const CheckBoxGroup = require('../src/components/CheckBox/CheckBoxGroup').default;

const NESTING =
  'VirtualizedLists should never be nested inside plain ScrollViews';

const STATUS_OPTIONS = [
  {label: 'Active', value: 'active'},
  {label: 'Inactive', value: 'inactive'},
  {label: 'Draft', value: 'draft'},
];

/** Render `element` and return every console.error raised during mount. */
const captureErrors = (element) => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    act(() => {
      renderer.create(element);
    });
    return spy.mock.calls.map((call) => String(call[0]));
  } finally {
    spy.mockRestore();
  }
};

const nestingWarnings = (errors) =>
  errors.filter((message) => message.includes(NESTING));

describe('admin status filter sheet', () => {
  it('does not nest its checkbox list inside a ScrollView', () => {
    const errors = captureErrors(
      <ReusableActionSheet
        code="STATUS"
        visible
        onClose={() => {}}
        statusOptions={STATUS_OPTIONS}
        statusValue={[]}
        statusChange={() => {}}
      />,
    );

    expect(nestingWarnings(errors)).toEqual([]);
  });

  it('still renders every status option', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ReusableActionSheet
          code="STATUS"
          visible
          onClose={() => {}}
          statusOptions={STATUS_OPTIONS}
          statusValue={[]}
          statusChange={() => {}}
        />,
      );
    });

    const labels = tree.root
      .findAllByType(Text)
      .map((node) => node.props.children)
      .filter((child) => typeof child === 'string');

    STATUS_OPTIONS.forEach((option) => {
      expect(labels).toContain(option.label);
    });
  });
});

describe('other CheckBoxGroup sheets', () => {
  it.each([
    [
      'LEAFTRAIL',
      {leafTrailStatusOptions: STATUS_OPTIONS, leafTrailStatusValue: []},
    ],
    ['PLANTSTATUS', {plantStatusOptions: STATUS_OPTIONS, plantStatusValue: []}],
  ])('%s sheet does not nest its list', (code, options) => {
    const errors = captureErrors(
      <ReusableActionSheet
        code={code}
        visible
        onClose={() => {}}
        {...options}
      />,
    );

    expect(nestingWarnings(errors)).toEqual([]);
  });
});

/**
 * Control case. Proves the assertion above is meaningful: if a CheckBoxGroup is
 * wrapped in a same-orientation ScrollView again, the warning comes back.
 */
describe('control: a nested checkbox list is still detected', () => {
  it('warns when wrapped in a plain vertical ScrollView', () => {
    const errors = captureErrors(
      <ScrollView>
        <CheckBoxGroup
          options={STATUS_OPTIONS}
          selectedValues={[]}
          onChange={() => {}}
        />
      </ScrollView>,
    );

    expect(nestingWarnings(errors).length).toBeGreaterThan(0);
  });
});
