import React from 'react';
import { View, Text } from '@rn';
import { Link } from '@aven/navigation-web';
import SimplePage from './SimplePage';
import AuthSwitch from './AuthSwitch';

function MarketingHome() {
  return <Text>Coming soon, details of StageCast!</Text>;
}

function LoggedInHome() {
  return (
    <View>
      <Link routeName="AuthAccount">My Account</Link>
      <Link routeName="NewOrg">New Org</Link>
    </View>
  );
}
export default function HomeScreen() {
  return (
    <SimplePage>
      <AuthSwitch loggedOut={<MarketingHome />} loggedIn={<LoggedInHome />} />
    </SimplePage>
  );
}
HomeScreen.navigationOptions = { title: 'Welcome' };
