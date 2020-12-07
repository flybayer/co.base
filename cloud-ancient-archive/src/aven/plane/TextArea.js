import React from 'react';
import { View, TextInput } from '@rn';
import { useTheme } from './Theme';
import Text from './Text';
import { opacify } from './utils';

function TextArea(
  {
    onValue,
    value,
    label,
    onFocus,
    onBlur,
    onSubmit,
    accessibilityLabel,
    theme: themeProp,
  },
  inputRef,
) {
  const theme = useTheme(themeProp);

  return (
    <View>
      <Text theme={{ colorForeground: opacify(theme.colorPrimary, 0.6) }}>
        {label}
      </Text>
      <View
        style={{
          borderWidth: 2,
          borderRadius: 4,
          borderColor: opacify(theme.colorPrimary, 0.6),
          overflow: 'hidden',
        }}
      >
        <TextInput
          ref={inputRef}
          multiline={true}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          onChangeText={onValue}
          onSubmitEditing={onSubmit}
          accesible="true"
          accessibilityLabel={accessibilityLabel || label}
          style={{
            flex: 1,
            outline: 'none',
            color: theme.colorForeground,
            fontFamily: theme.fontRegular,
            fontSize: 16,
            backgroundColor: 'white',
            minHeight: 120,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        />
      </View>
    </View>
  );
}

export default React.forwardRef(TextArea);
