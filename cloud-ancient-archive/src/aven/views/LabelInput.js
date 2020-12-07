import React, { useEffect, useState } from 'react';
import { View, TextInput, Text } from '@rn';
import Animated, { Easing } from 'react-native-reanimated';

const textInputFontSize = 26;

function RefLabelInput(
  { value, onValue, label, mode, onSubmit, onFocus, onBlur },
  ref,
) {
  const desiredPlaceholderOpen = value ? 0 : 1;
  const [placeholderOpenProgress] = useState(
    new Animated.Value(desiredPlaceholderOpen),
  );
  useEffect(() => {
    Animated.timing(placeholderOpenProgress, {
      toValue: desiredPlaceholderOpen,
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [desiredPlaceholderOpen, placeholderOpenProgress]);
  const autoCorrect = false;
  let autoComplete = null;
  let keyboardType = 'default';
  let enablesReturnKeyAutomatically = true;
  if (mode === 'phone') {
    keyboardType = 'phone-pad';
  } else if (mode === 'email') {
    keyboardType = 'email-address';
  } else if (mode === 'name') {
    autoComplete = 'words';
  }
  return (
    <View style={{}}>
      <Animated.Text
        style={{
          color: '#aaa',
          position: 'absolute',
          left: 0,
          right: 0,
          fontSize: Animated.interpolate(placeholderOpenProgress, {
            inputRange: [0, 1],
            outputRange: [13, 28],
          }),
          transform: [
            {
              translateY: Animated.interpolate(placeholderOpenProgress, {
                inputRange: [0, 1],
                outputRange: [7, 24],
              }),
            },
          ],
        }}
      >
        {label}
      </Animated.Text>
      <TextInput
        enablesReturnKeyAutomatically={enablesReturnKeyAutomatically}
        keyboardAppearance="dark"
        keyboardType={keyboardType}
        autoCorrect={autoCorrect}
        autoCapitalize={autoComplete}
        ref={ref}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={onValue}
        onSubmitEditing={onSubmit}
        style={{
          fontSize: textInputFontSize,
          marginTop: 20,
          marginBottom: 20,
          height: 40,
        }}
      />
    </View>
  );
}

const LabelInput = React.forwardRef(RefLabelInput);

export default LabelInput;
