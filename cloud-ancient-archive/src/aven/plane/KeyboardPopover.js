import React from 'react';
import {
  View,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from '@rn';

export default function KeyboardPopover({ children, onClose, openValue }) {
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        flex: 1,
        alignItems: 'center',
      }}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#0004',
            opacity: openValue,
          }}
        />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView behavior="padding" enabled>
        <Animated.View
          style={{
            flex: 1,
            // width: 400,
            justifyContent: 'center',
            opacity: openValue.interpolate({
              inputRange: [0, 0.5],
              outputRange: [0, 1],
            }),
            transform: [
              {
                translateY: openValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              alignSelf: 'stretch',

              shadowOffset: { width: 0, height: 0 },
              shadowColor: 'black',
              shadowOpacity: 0.08,
              shadowRadius: 22,

              borderRadius: 10,
              // width: wide ? 636 : 400,
              minHeight: 200,
              padding: 8,
              minWidth: 300,
            }}
          >
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
