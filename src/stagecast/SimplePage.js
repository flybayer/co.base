import React from 'react';
import { View, Text, ScrollView } from '@rn';
import { Link } from '@aven/navigation-web';

function PageStructure({ children, header, footer, center }) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#fafafa',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: '#fff',
          maxWidth: 800,
          alignSelf: 'stretch',
          flex: 1,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
      >
        {header}
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flex: 1,
              justifyContent: center ? 'center' : 'flex-start',
              alignItems: center ? 'center' : 'stretch',
            }}
          >
            {children}
          </ScrollView>
        </View>

        {footer}
      </View>
    </View>
  );
}

function FooterLink({ label, routeName }) {
  return (
    <Link routeName={routeName}>
      <View style={{ padding: 18 }}>
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Helvetica',
          }}
        >
          {label}
        </Text>
      </View>
    </Link>
  );
}
export default function SimplePage({ children, center }) {
  return (
    <PageStructure
      header={
        <View style={{ backgroundColor: '#e5e5ef', height: 80 }}>
          <Link routeName="Home">
            <Text>StageCast</Text>
          </Link>
        </View>
      }
      footer={
        <View
          style={{
            backgroundColor: '#e5e5ef',
            height: 50,
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingLeft: 18,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Helvetica',
              marginHorizontal: 18,
              paddingVertical: 18,
            }}
          >
            &copy; {new Date().getFullYear()} StageCast. All Rights Reserved.
          </Text>
          <View style={{ flex: 1 }} />
          <FooterLink label="Pricing" routeName="Pricing" />
          <FooterLink label="Terms" routeName="LegalTerms" />
          <FooterLink label="Privacy" routeName="LegalPrivacy" />
        </View>
      }
      center={center}
    >
      {children}
    </PageStructure>
  );
}
