import React from 'react';
import { View, Platform } from '@rn';

const defaultFont = Platform.select({
  ios: 'System',
  android: 'System',
  default: 'sans-serif',
});

export const baseTheme = {
  spacing: 8,
  fontSize: 16,
  // lineHeight: 24,

  colorForeground: '#333',
  colorBackground: '#f7f7f7',
  colorPrimary: '#355175',

  darkMode: false,

  paddingVertical: 6,
  paddingHorizontal: 12,
  fontRegular: defaultFont,
  fontBold: defaultFont,
  borderRadius: 3,
  borderWidth: 2,

  textFont: defaultFont,
  fontWeight: '400',
  headingFont: defaultFont,
  headingFontSize: 56,
  headingLineHeight: 64,
  headingFontWeight: 'bold',

  // buttonColor:
  // tagMaxWidth
  breakpoints: [768, 1024],

  inputPaddingTop: 16,
  inputFontSize: 24,

  buttonFontSize: 16,
  buttonLineHeight: 24,
};

const ThemeContext = React.createContext(baseTheme);

export function ThemeProvider({ children, theme = baseTheme }) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(theme) {
  // get the base theme from context
  const contextTheme = React.useContext(ThemeContext);

  // get the override values. can be a object or a mapper function
  const overrides = typeof theme === 'function' ? theme(contextTheme) : theme;

  // merge both themes
  return {
    ...contextTheme,
    ...overrides,
  };
}

// Context components

export function Large({ children }) {
  // better if we add a fixed values instead of multiplying
  const scaleTheme = useTheme(theme => ({
    fontSize: theme.fontSize + 8,
    buttonFontSize: theme.buttonFontSize + 8,
    textFontSize: theme.textFontSize + 8,
    inputFontSize: theme.inputFontSize + 8,
    headingFontSize: theme.headingFontSize + 8,
    paddingHorizontal: theme.paddingHorizontal + 8,
    paddingVertical: theme.paddingVertical + 8,
  }));

  return (
    <ThemeContext.Provider value={scaleTheme}>{children}</ThemeContext.Provider>
  );
}

const darkTheme = {
  colorBackground: '#333333',
  colorForeground: '#f7f7f7',
  colorPrimary: '#005252',
};

export function DarkMode({ theme = darkTheme, children }) {
  // get the base theme from context
  const baseTheme = React.useContext(ThemeContext);

  // get the override values. can be a object or a mapper function
  const overrides = typeof theme === 'function' ? theme(baseTheme) : theme;
  // merge both themes
  const composedTheme = {
    ...baseTheme,
    ...overrides,
    darkMode: true,
  };

  return (
    <ThemeContext.Provider value={composedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function Center({ children }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      {children}
    </View>
  );
}

export function Spacing({
  value,
  vertical,
  horizontal,
  top,
  right,
  bottom,
  left,
  children,
  theme: themeProp,
  maxWidth,
  maxHeight,
  inline = true,
  debug = false,
}) {
  const theme = useTheme(themeProp);
  let allMargin = value;
  if (
    !value &&
    !vertical &&
    !horizontal &&
    !top &&
    !right &&
    !bottom &&
    !left
  ) {
    // a handy behavior: when using spacing without any props, it will inherit the default
    allMargin = theme.spacing;
  }
  return (
    <View
      style={[
        !inline && { flex: 1 },
        allMargin && { margin: allMargin },
        vertical && { marginVertical: vertical },
        horizontal && { marginHorizontal: horizontal },
        top && { marginTop: top },
        right && { marginRight: right },
        bottom && { marginBottom: bottom },
        left && { marginLeft: left },
        debug && { backgroundColor: 'indianred' },
        maxWidth && { maxWidth: maxWidth },
        maxHeight && { maxHeight: maxHeight },
      ]}
    >
      {children}
    </View>
  );
}
