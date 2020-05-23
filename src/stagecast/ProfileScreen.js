import React from 'react';
import { View, Text, ScrollView } from '@rn';
import { createFullscreenSwitchNavigator } from '@aven/navigation-web';
import { useCloudClient, useCloudValue, useStream } from '@aven/cloud';
import { useFocus, useNavigation } from '@aven/navigation-hooks';
import { Button, Stack, TextInput } from '@aven/plane';
import { Link } from '@aven/navigation-web';
import { createAuthNavigator } from '@aven/auth';
import { createContentPage } from '@aven/content';
import SimplePage from './SimplePage';
import AuthSwitch from './AuthSwitch';

function useUser() {
  const client = useCloudClient();
  const accountId = useStream(
    client.clientState.map(s => s.accountId).dropRepeats(),
  );
  const user = client.getCloud().get(`@${accountId}`);
  return user;
}

export default function ProfileScreen() {
  const { getParam, setParams } = useNavigation();

  const isEditing = getParam('editing') === null;

  return (
    <SimplePage>
      <View
        style={{
          backgroundColor: 'blue',
          width: 200,
          height: 200,
          borderRadius: 100,
        }}
      />
      <Text>LinkedIn: {isEditing ? 'EDITS!!' : ''}</Text>
      <Text>Twitter: </Text>
      <Text>GitHub: </Text>
      <Button
        title="Edit Profile"
        onPress={() => {
          setParams({ editing: null });
        }}
      />
    </SimplePage>
  );
}
