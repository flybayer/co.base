import React from 'react';
import { View, Text } from '@rn';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Button } from '@aven/plane';

const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text>Hello RN</Text>
      <Button title="Start Game" onPress={() => navigation.navigate('Game')} />
    </View>
  );
}

export default function PilotApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="screen">
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
