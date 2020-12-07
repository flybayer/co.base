import React from 'react';
import getAssetURI from './getAssetURI';
import { Image } from '@rn';
// so, on the web client, metro is kind enough to register assets in this registry, as they are required.
// once the asset is required/registered, it is treated as a numerical id which can be looked up.
// metro must have this file hard-coded somewhere?? can it be configured to the RNW registry?

export default function WebImage({ source, ...props }) {
  let rnwSource = source;
  if (typeof source === 'number') {
    // The React Native Web Image component uses its own asset registry, but metro seems to hard-code the react native asset registration. hence, we override the source to be a URI:
    rnwSource = { uri: getAssetURI(source) };
  }
  return <Image source={rnwSource} {...props} />;
}
