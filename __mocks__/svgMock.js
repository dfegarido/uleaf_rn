const React = require('react');
const { View } = require('react-native');

/** Placeholder for SVGR output in tests */
const SvgMock = props => React.createElement(View, {...props, testID: 'svg-mock'});
module.exports = SvgMock;
