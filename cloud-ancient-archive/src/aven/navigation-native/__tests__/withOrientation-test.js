import React from 'react';
import { View } from '@rn';
import renderer from 'react-test-renderer';
import withOrientation, { isOrientationLandscape } from '../withOrientation';

it('it adds isLandscape to props', () => {
  const WrappedComponent = withOrientation(View);
  const rendered = renderer.create(<WrappedComponent />).toJSON();
  expect(rendered).toMatchSnapshot();
});

it('calculates orientation correctly', () => {
  const isLandscape = isOrientationLandscape({ width: 10, height: 1 });
  // eslint-disable-next-line jest/no-truthy-falsy
  expect(isLandscape).toBeTruthy();
});
