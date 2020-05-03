import React from 'react';
import { View, Text } from '@rn';
import { createFullscreenSwitchNavigator } from '@aven/navigation-web';
import { useCloudClient, useStream } from '@aven/cloud';
import { useFocus, useNavigation } from '@aven/navigation-hooks';
import { Button, Stack, TextInput } from '@aven/plane';
import { Link } from '@aven/navigation-web';
import { useTheme } from '@aven/plane';

function SmallForm({ children, title }) {
  const { borderRadius, paddingVertical, paddingHorizontal } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignSelf: 'stretch',
      }}
    >
      <View
        style={{
          flex: 1,
          maxWidth: 320,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius,
          paddingHorizontal,
          paddingVertical,
          paddingTop: 42,
        }}
      >
        <Text
          style={{
            position: 'absolute',
            top: -6,
            left: paddingHorizontal,
            fontSize: 28,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            color: '#bbb',
          }}
        >
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}

export default function createAuthNavigator(PageWrapper) {
  function VerifyCodeForm({ onSubmit, onCancel }) {
    const [code, setCode] = React.useState('');
    const [error, setError] = React.useState('');
    function onHandleError(err) {
      console.error('wtf', err);
      setError('Error submitting auth!');
    }
    function handleSubmit() {
      onSubmit({ code }, onHandleError);
    }
    const { inputs } = useFocus({
      onSubmit: handleSubmit,
      inputRenderers: [
        props => (
          <TextInput
            {...props}
            type={'code'}
            label={'verification code'}
            value={code}
            onValue={setCode}
          />
        ),
      ],
    });

    return (
      <Stack stretchInside>
        {error && <Text style={{ color: '#522' }}>{error}</Text>}
        {inputs}
        <Button title="Cancel" outline onPress={onCancel} />
        <Button title="Submit" onPress={handleSubmit} />
      </Stack>
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
      <Stack stretchInside>
        {inputs}
        <Button title="Submit" onPress={handleSubmit} />
      </Stack>
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
      <Stack stretchInside>
        {inputs}
        <Button title="Submit" onPress={handleSubmit} />
      </Stack>
    );
  }

  function AuthLoginScreen() {
    return (
      <PageWrapper center>
        <AuthLogin />
      </PageWrapper>
    );
  }
  AuthLoginScreen.navigationOptions = {
    title: 'Login',
  };

  function AuthRegisterScreen() {
    return (
      <PageWrapper center>
        <AuthLogin register />
      </PageWrapper>
    );
  }
  AuthRegisterScreen.navigationOptions = {
    title: 'Register',
  };

  function AuthLogin({ register }) {
    const client = useCloudClient();
    const { navigate, getParam, setParams } = useNavigation();
    const method = getParam('method');
    const clientState = useStream(client.clientState);
    React.useEffect(() => {
      if (clientState?.session) {
        navigate('AuthAccount');
      }
    }, [clientState, navigate]);
    if (clientState?.session) {
      return null;
    }
    if (clientState?.verification) {
      const isEmailed = clientState.verification.email;
      return (
        <SmallForm title={`${isEmailed ? 'Email' : 'Phone'} Verify Code:`}>
          <VerifyCodeForm
            onSubmit={({ code }, onFormError) => {
              client
                .verifyLogin({ code })
                .then(() => {
                  navigate('Home');
                })
                .catch(onFormError);
            }}
            onCancel={() => {
              client.cancelLogin();
            }}
          />
        </SmallForm>
      );
    }
    if (!method) {
      return (
        <SmallForm title={`${register ? 'Register' : 'Login'} with:`}>
          <Stack stretchInside>
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
        </SmallForm>
      );
    }
    if (method === 'email') {
      return (
        <SmallForm title={`${register ? 'Register' : 'Login'} with Email:`}>
          <EmailCollectForm
            onSubmit={({ email }) => {
              const verificationInfo = { email };
              client
                .login({
                  verificationInfo,
                })
                .then(({ providerId, verificationChallenge }) => {})
                .catch();
            }}
          />
        </SmallForm>
      );
    }
    if (method === 'phone') {
      return (
        <SmallForm title={`${register ? 'Register' : 'Login'} with Phone:`}>
          <SMSCollectForm
            onSubmit={({ phoneNumber }) => {
              const verificationInfo = {
                number: phoneNumber,
              };
              client
                .login({
                  verificationInfo,
                })
                .then(({ providerId, verificationChallenge }) => {})
                .catch();
            }}
          />
        </SmallForm>
      );
    }
  }

  function AuthHomeScreen() {
    const client = useCloudClient();
    const { navigate } = useNavigation();
    const clientState = useStream(client.clientState);
    React.useEffect(() => {
      console.log('zoomg', clientState);
      if (clientState?.session) {
        navigate('AuthAccount');
      } else if (clientState !== undefined) {
        navigate('AuthLogin');
      }
    }, [navigate, clientState]);
    return null;
  }
  AuthHomeScreen.navigationOptions = {
    title: '',
  };

  function AuthAccountScreen() {
    const client = useCloudClient();
    const { navigate } = useNavigation();
    const clientState = useStream(client.clientState);
    console.log('clientState', clientState);
    React.useEffect(() => {
      if (clientState !== undefined && !clientState?.session) {
        navigate('AuthLogin');
      }
    }, [navigate, clientState]);
    return (
      <PageWrapper center>
        <SmallForm title={`Your account`}>
          <Stack stretchInside>
            <Button
              onPress={() => {
                client.logout();
              }}
              title="Log out"
            />
            <Text>Username: {clientState?.session?.accountId}</Text>
            <Button title="Change Username" onPress={() => {}} />
          </Stack>
        </SmallForm>
      </PageWrapper>
    );
  }
  AuthAccountScreen.navigationOptions = {
    title: 'My Account',
  };

  const AuthNavigator = createFullscreenSwitchNavigator({
    AuthHome: {
      path: '',
      screen: AuthHomeScreen,
    },
    AuthLogin: {
      path: 'login',
      screen: AuthLoginScreen,
    },
    AuthRegister: {
      path: 'register',
      screen: AuthRegisterScreen,
    },
    AuthAccount: {
      path: 'account',
      screen: AuthAccountScreen,
    },
  });

  return AuthNavigator;
}
