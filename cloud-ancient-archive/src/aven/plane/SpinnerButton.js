import React from 'react';
import Button from './Button';
import Spinner from './Spinner';
import { useTheme } from './Theme';

export default function SpinnerButton({
  onPress,
  isLoading = false,
  children,
  title,
  disabled,
  theme: themeProp,
  ...props
}) {
  const theme = useTheme(themeProp);
  return (
    <Button
      onPress={onPress}
      title={title}
      disabled={disabled || isLoading}
      theme={theme}
      {...props}
    >
      {isLoading ? <Spinner color={theme.colorBackground} /> : null}
    </Button>
  );
}
