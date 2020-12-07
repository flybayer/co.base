import React, { useEffect, useState } from 'react';
import { View, TextInput } from '@rn';
import { TextInputMask } from 'react-native-masked-text';
import Animated, { Easing } from 'react-native-reanimated';
import { useTheme } from './Theme';
import { opacify } from './utils';

const textInputFontSize = 26;

function FormInputWithRef(
  {
    value,
    onValue,
    label,
    mode,
    onSubmit,
    onFocus,
    onBlur,
    maxLength,
    upperCase,
    theme: themeProp,
  },
  ref,
) {
  const theme = useTheme(themeProp);
  const desiredPlaceholderOpen = value ? 0 : 1;
  const color60 = opacify(theme.colorPrimary, 0.6);
  const [placeholderOpenProgress] = useState(
    new Animated.Value(desiredPlaceholderOpen),
  );
  useEffect(() => {
    Animated.timing(placeholderOpenProgress, {
      toValue: desiredPlaceholderOpen,
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [desiredPlaceholderOpen]);
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
  // let valueHandler = onValue;
  if (mode === 'phone') {
    Input = TextInputMask;
    inputType = 'custom';
    inputOptions = {
      mask: '(999) 999-9999',
    };
    inputRef = i => {
      ref.current = i && i.getElement();
    };
    valueHandler = onValue;
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
  }
  return (
    <View
      style={{
        borderWidth: 1,
        paddingLeft: theme.spacing,
        borderRadius: 4,
        paddingTop: theme.inputPaddingTop,
        borderColor: color60,
        borderWidth: 3,
        minHeight: 44,
        height: 64,
        minWidth: 300,
      }}
    >
      <Animated.Text
        style={{
          fontFamily: theme.fontRegular,
          position: 'absolute',
          color: opacify(theme.colorPrimary, 0.5),
          left: 0,
          right: 0,
          fontSize: Animated.interpolate(placeholderOpenProgress, {
            inputRange: [0, 1],
            outputRange: [12, 24],
          }),
          transform: [
            {
              translateX: 8,
            },
            {
              translateY: Animated.interpolate(placeholderOpenProgress, {
                inputRange: [0, 1],
                outputRange: [8, 20],
              }),
            },
          ],
        }}
      >
        {label}
      </Animated.Text>
      <Input
        enablesReturnKeyAutomatically={enablesReturnKeyAutomatically}
        keyboardAppearance="light"
        keyboardType={keyboardType}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        ref={inputRef}
        value={value}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={valueHandler}
        options={inputOptions}
        type={inputType}
        onSubmitEditing={onSubmit}
        style={{
          fontSize: theme.inputFontSize,
          color: color60,
          fontFamily: theme.fontRegular,
          minHeight: 44,
          ...(mode === 'description' ? { height: 120 } : {}),
        }}
      />
    </View>
  );
}

const FormInput = React.forwardRef(FormInputWithRef);

export default FormInput;
