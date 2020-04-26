import React from 'react';
import { View, Text } from '@rn';
import { useCloudValue, useCloud } from '@aven/cloud';
import { useForm } from 'react-hook-form';

function TestForm() {
  const { handleSubmit, register, errors } = useForm();
  const cloud = useCloud();
  const onSubmit = values => {
    cloud
      .get('MyEmail')
      .putValue(values.email)
      .catch(e => {
        console.error('Ooops', e);
      });
  };

  return (
    <View style={{ marginVertical: 20 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        Email address:
        <input
          name="email"
          ref={register({
            required: 'Required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
              message: 'invalid email address',
            },
          })}
        />
        {errors.email && <Text>{errors.email.message}</Text>}
        <button type="submit">Submit</button>
      </form>
    </View>
  );
}

export default function App() {
  React.useEffect(() => {
    console.log('App did mount');
  }, []);
  const testVal = useCloudValue('MyEmail');
  return (
    <View
      style={{
        flex: 1,
        padding: 50,
        justifyContent: 'center',
      }}
    >
      Current email address:
      <Text style={{ fontSize: 32, textAlign: 'center' }}>{testVal}</Text>
      <TestForm />
    </View>
  );
}
