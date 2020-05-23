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
    const authVal = useCloudValue(`${contentDocName}/_auth`);
    console.log('aaaaaa', { val, authVal });
    return (
      <PageWrapper>
        <View style={{ flex: 1 }}>
          <Text>{contentDocName}</Text>
        </View>
      </PageWrapper>
    );
  }
  ContentPage.navigationOptions = ({ screenProps }) => ({
    loadData: async () => {
      return [await screenProps.cloud.get(contentDocName).load()];
    },
  });
  return ContentPage;
}
