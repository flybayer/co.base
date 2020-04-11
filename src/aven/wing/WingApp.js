import React from 'react';
import { View, Text } from '@rn';
import { createFullscreenSwitchNavigator } from '@aven/navigation-web';
import { useCloudClient } from '@aven/cloud';
import { useFocus, useNavigation } from '@aven/navigation-hooks';
import { Button, Stack, TextInput } from '@aven/plane';
import { Link } from '@aven/navigation-web';

function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text>Welcome!</Text>
      <Link routeName="AuthLogin">Log in</Link>
    </View>
  );
}
function SMSCollectForm({ onSubmit }) {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  function handleSubmit() {
    onSubmit({ phoneNumber });
  }
  const { inputs } = useFocus({
    onSubmit: handleSubmit,
    inputRenderers: [
      props => (
        <TextInput
          {...props}
          type={'phone'}
          label={'phone number'}
          value={phoneNumber}
          onValue={setPhoneNumber}
        />
      ),
    ],
  });

  return (
    <>
      {inputs}
      <Button title="Submit" onPress={handleSubmit} />
    </>
  );
}
function EmailCollectForm({ onSubmit }) {
  const [email, setEmail] = React.useState('');
  function handleSubmit() {
    onSubmit({ email });
  }
  const { inputs } = useFocus({
    onSubmit: handleSubmit,
    inputRenderers: [
      props => (
        <TextInput
          {...props}
          type={'email'}
          label={'email'}
          value={email}
          onValue={setEmail}
        />
      ),
    ],
  });

  return (
    <>
      {inputs}
      <Button title="Submit" onPress={handleSubmit} />
    </>
  );
}

function AuthLoginScreen() {
  return (
    <View>
      <AuthLogin />
    </View>
  );
}

function AuthLogin() {
  const client = useCloudClient();
  const { getParam, setParams } = useNavigation();
  const method = getParam('method');

  if (!method) {
    return (
      <Stack>
        <Button
          title="Email"
          onPress={() => {
            setParams({ method: 'email' });
          }}
        />

        <Button
          title="Phone Number"
          onPress={() => {
            setParams({ method: 'phone' });
          }}
        />
      </Stack>
    );
  }
  if (method === 'email') {
    return (
      <>
        <Text>Log in with Email</Text>

        <EmailCollectForm
          onSubmit={({ email }) => {
            client
              .login({
                verificationInfo: {
                  email,
                },
              })
              .then()
              .catch();
          }}
        />
      </>
    );
  }
  if (method === 'phone') {
    return (
      <>
        <Text>Log in with phone</Text>

        <SMSCollectForm
          onSubmit={({ phoneNumber }) => {
            client
              .login({
                verificationInfo: {
                  phoneNumber,
                },
              })
              .then()
              .catch();
          }}
        />
      </>
    );
  }
}

function AuthHomeScreen() {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.navigate('AuthLogin');
  }, [navigation]);
  return null;
}

const AuthNavigator = createFullscreenSwitchNavigator({
  AuthHome: {
    path: '',
    screen: AuthHomeScreen,
  },
  AuthLogin: {
    path: 'login',
    screen: AuthLoginScreen,
  },
});

export default createFullscreenSwitchNavigator({
  Home: {
    path: '',
    screen: Home,
  },
  Auth: {
    path: 'auth',
    screen: AuthNavigator,
  },
});
