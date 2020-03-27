import React from 'react';
import { View, Text } from '@rn';
import { createFullscreenSwitchNavigator } from '@aven/navigation-web';

function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text>Hello, World!</Text>
    </View>
  );
}

export default createFullscreenSwitchNavigator({
  Home: {
    path: '',
    screen: Home,
  },
});
