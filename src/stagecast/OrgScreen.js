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

export default function OrgScreen({}) {
  const { getParam } = useNavigation();
  const orgId = getParam('orgId');
  const org = useCloudValue(`Orgs/${orgId}`);
  console.log('oooorg', org);
  return (
    <SimplePage>
      <Text>List all org events:</Text>
    </SimplePage>
  );
}
