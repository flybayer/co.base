import React from 'react';
import { ScrollView, View } from '@rn';

export default function Page({ children }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          alignItems: 'stretch',
          justifyContent: 'center',
          flexDirection: 'row',
          flex: 1,
        }}
      >
        <View
          style={{
            flex: 1,
            maxWidth: 1200,
          }}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
