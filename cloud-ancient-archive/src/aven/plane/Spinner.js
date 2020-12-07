// import React from 'react';
// import { useTheme } from './Theme';

// export default function Spinner({ color, isSpinning = true, style }) {
//   // const theme = useTheme();
//   // coming soon on web!
//   return null;
// }

import { Animated, Easing } from '@rn';
import { getAssetURI } from '@aven/views';
import React from 'react';
import { useTheme } from './Theme';

export default function Spinner({ color, isSpinning = true, style }) {
  const theme = useTheme();

  const [spinPosition] = React.useState(new Animated.Value(0));
  const [opacity] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: isSpinning ? 1 : 0,
      duration: 500,
      easing: Easing.inOut(Easing.quad),
    }).start();
  }, [isSpinning]);

  React.useEffect(() => {
    Animated.timing(spinPosition, {
      toValue: 1,
      duration: 900000000,
      easing: Easing.linear,
    }).start();
  }, []);
  return (
    <Animated.Image
      style={{
        opacity,
        width: '80%',
        height: '80%',
        maxWidth: 36,
        maxHeight: 36,
        tintColor: color || theme.colorPrimary,
        transform: [
          {
            rotateZ: spinPosition.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 3600000],
            }),
          },
        ],
        ...style,
      }}
      source={{ uri: getAssetURI(require('./assets/Spinner.png')) }}
    />
  );
}
