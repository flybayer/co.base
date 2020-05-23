import React from 'react';
import { View, Text, ScrollView } from '@rn';
import { createFullscreenSwitchNavigator } from '@aven/navigation-web';
import {
  useCloud,
  useCloudClient,
  useCloudValue,
  useStream,
} from '@aven/cloud';
import { useFocus, useNavigation } from '@aven/navigation-hooks';
import { Button, Stack, TextInput } from '@aven/plane';
import { Link } from '@aven/navigation-web';
import { createAuthNavigator } from '@aven/auth';
import { createContentPage } from '@aven/content';
import SimplePage from './SimplePage';
import AuthSwitch from './AuthSwitch';
import { SmallForm } from '@aven/plane';

function NewOrgForm() {
  const [orgName, setOrgName] = React.useState('');
  const [displayName, setOrgDisplayName] = React.useState('');
  const cloud = useCloud();
  function handleSubmit() {
    cloud
      .get('Orgs')
      .children.get(orgName)
      .putValue({
        displayName,
      })
      .then(() => {
        console.log('org created!');
      })
      .catch(e => {
        console.error('Error creating org!!', e);
      });
    console.log({ orgName });
  }
  const { inputs } = useFocus({
    onSubmit: handleSubmit,
    inputRenderers: [
      props => (
        <TextInput
          {...props}
          type={'name'}
          label={'new org short name / url'}
          value={orgName}
          onValue={setOrgName}
        />
      ),
      props => (
        <TextInput
          {...props}
          type={'name'}
          label={'Display Name'}
          value={displayName}
          onValue={setOrgDisplayName}
        />
      ),
    ],
  });

  return (
    <SmallForm title="New Organization">
      <Stack stretchInside>
        {inputs}
        <Button title="Submit" onPress={handleSubmit} />
      </Stack>
    </SmallForm>
  );
}

export default function NewOrgScreen({}) {
  return (
    <SimplePage center>
      <NewOrgForm />
    </SimplePage>
  );
}
