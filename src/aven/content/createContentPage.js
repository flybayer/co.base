import React from 'react';
import { View, Text, ScrollView } from '@rn';
import { createFullscreenSwitchNavigator } from '@aven/navigation-web';
import { useCloudValue, useCloudClient, useStream } from '@aven/cloud';
import { useFocus, useNavigation } from '@aven/navigation-hooks';
import { Button, Stack, TextInput } from '@aven/plane';
import { Link } from '@aven/navigation-web';

function PageEditButton() {
  const cloudState = useStream(useCloudClient().clientState);
  return <Text>{JSON.stringify(cloudState)}</Text>;
}

export default function createContentPage(PageWrapper, contentDocName) {
  function ContentPage() {
    const val = useCloudValue(contentDocName);
    console.log('aaaaaa', { val });
    return (
      <PageWrapper>
        <PageEditButton onEdit={() => {}} onSave={() => {}} />
        <View style={{ flex: 1 }}>
          <Text>herroo {contentDocName}</Text>
        </View>
      </PageWrapper>
    );
  }
  return ContentPage;
}
