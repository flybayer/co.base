import React from 'react';
import { useTheme } from './Theme';
import Heading from './Heading';
import { opacify } from './utils';

export default function SmallHeading({ theme: themeProp = {}, ...props }) {
  const theme = useTheme(themeProp);
  return (
    <Heading
      theme={{
        // colorForeground: theme.colorPrimary,
        // fontSize: theme.headingFontSize,
        // lineHeight: theme.headingLineHeight,
        // fontWeight: theme.headingFontWeight,
        // textFont: theme.headingFont,

        headingFontSize:
          theme.smallHeadingFontSize ||
          Math.floor((theme.headingFontSize / 3) * 2),
        colorPrimary:
          theme.smallHeadingColorPrimary || opacify(theme.colorForeground, 0.8),
      }}
      {...props}
    />
  );
}
