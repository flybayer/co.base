import React from 'react';
import FastImage from 'react-native-fast-image';
import { Image } from 'react-native';

function CustomImage({ source, style, resizeMode, tintColor }) {
  // special treatment for tintColor, outside of styles, because FastImage does not support it
  if (tintColor) {
    return (
      <Image
        style={[style, { tintColor }]}
        tintColor={tintColor}
        resizeMode={resizeMode}
        source={source}
      />
    );
  }

  return <FastImage style={style} resizeMode={resizeMode} source={source} />;
}

export const loadImages = FastImage.preload;

export default CustomImage;
