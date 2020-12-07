import React, { useEffect, useState } from 'react';
import { View, TextInput, Animated, Easing } from '@rn';
import { useTheme } from './Theme';
import { Responsive } from '@aven/plane';
import { opacify } from './utils';

function FormInputWithRef(
  {
    value,
    onValue,
    label,
    mode,
    onSubmit,
    onFocus,
    onBlur,
    style,
    name,
    required,
    maxLength,
    theme: themeProp,
  },
  ref,
  ...rest
) {
  const theme = useTheme(themeProp);
  const color60 = opacify(theme.colorPrimary, 0.6);
  const desiredPlaceholderOpen = value ? 0 : 1;
  const [placeholderOpenProgress] = useState(
    new Animated.Value(desiredPlaceholderOpen),
  );

  const [focus, setFocus] = React.useState(0);
  const desiredFocus = focus ? 1 : 0;
  const [inputOpacityProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(placeholderOpenProgress, {
      toValue: desiredPlaceholderOpen,
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [desiredPlaceholderOpen]);

  useEffect(() => {
    Animated.timing(inputOpacityProgress, {
      toValue: desiredFocus,
      duration: 200,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [desiredFocus]);

  function handleFocus(e) {
    e.persist();
    setFocus(1);
    onFocus && onFocus(e);
  }

  function handleBlur(e) {
    e.persist();
    setFocus(0);
    onBlur && onBlur(e);
  }

  let autoCorrect = false;
  let secureTextEntry = false;
  let autoCapitalize = null;
  let keyboardType = 'default';
  let enablesReturnKeyAutomatically = true;
  let Input = TextInput;
  let inputType = undefined;
  let inputOptions = undefined;
  let inputRef = ref;
  let valueHandler = onValue;
  let multiline = false;
  if (mode === 'phone') {
    keyboardType = 'phone-pad';
  } else if (mode === 'password') {
    secureTextEntry = true;
    autoCapitalize = 'none';
  } else if (mode === 'description') {
    autoCorrect = true;
    autoCapitalize = 'sentences';
  } else if (mode === 'number') {
    keyboardType = 'number-pad';
  } else if (mode === 'email') {
    autoCapitalize = 'none';
    keyboardType = 'email-address';
  } else if (mode === 'name') {
    autoCapitalize = 'words';
  } else if (mode === 'code') {
    autoCapitalize = 'characters';
  } else if (mode === 'textarea') {
    multiline = true;
  }
  return (
    <Animated.View
      style={{
        padding: 4,
        margin: -4,
        borderRadius: 4,
        backgroundColor: inputOpacityProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(204, 221, 220, 0)', 'rgba(204, 221, 220, 1)'],
        }),
        flex: 1,
        ...style,
      }}
    >
      <Responsive
        style={
          {
            // paddingTop: [10, 14],
            // paddingBottom: [8, 12],
          }
        }
      >
        <View
          style={{
            flex: 1,
            borderRadius: 4,
            borderColor: color60,
            borderWidth: 3,
          }}
          {...rest}
        >
          <Responsive style={{}}>
            <Animated.Text
              pointerEvents="none"
              style={{
                fontFamily: theme.fontRegular,
                position: 'absolute',
                color: theme.colorPrimary,
                opacity: 0.5,
                zIndex: 10,
                top: '30%',
                left: 16,
                right: 16,
                // zIndex: -1,
                fontSize: placeholderOpenProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 16],
                }),
                transform: [
                  {
                    translateY: placeholderOpenProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                ],
              }}
              accesible="true"
              accessibilityLabel={`input label: ${label}`}
              accessibilityRole="label"
            >
              {label}
            </Animated.Text>
          </Responsive>
          <Responsive
            style={{
              fontSize: [15, 18],
              lineHeight: [20, 28],
              // paddingBottom: [6, 6],
              paddingTop: [8, 8],
              ...(mode === 'description' ? { minHeight: [120, 120] } : {}),
              ...(mode === 'textarea' ? { minHeight: [200, 200] } : {}),
            }}
          >
            <Input
              enablesReturnKeyAutomatically={enablesReturnKeyAutomatically}
              keyboardAppearance="dark"
              keyboardType={keyboardType}
              autoCorrect={autoCorrect}
              secureTextEntry={secureTextEntry}
              autoCapitalize={autoCapitalize}
              ref={inputRef}
              multiline={multiline}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChangeText={valueHandler}
              options={inputOptions}
              maxLength={maxLength}
              type={inputType}
              onSubmitEditing={onSubmit}
              accesible="true"
              accessibilityLabel="Location Input"
              name={name}
              required={required}
              style={{
                flex: 1,
                outline: 'none',
                color: theme.colorPrimary,
                fontFamily: theme.fontRegular,
                backgroundColor: 'white',
                minHeight: 44,
                paddingLeft: 16,
              }}
            />
          </Responsive>
        </View>
      </Responsive>
    </Animated.View>
  );
}

const FormInput = React.forwardRef(FormInputWithRef);

export default FormInput;
