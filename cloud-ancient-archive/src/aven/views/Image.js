import React from 'react';
import { Image } from '@rn';
import { getAssetManifest } from '@aven/web-server';

const assetHashLookup = {};
getAssetManifest().then(assets => {
  assets.forEach(asset => {
    assetHashLookup[asset.hash] = asset;
  });
});
// this is the SERVER implementation of Image
export default function WebImage({ source, style, tintColor, ...props }) {
  let uri = null;
  if (source && source.uri) {
    uri = source.uri;
  }
  if (!uri) {
    const sourceMatch = source.match(/\/([^\/.]*)\.(.*)/);
    if (sourceMatch) {
      const hash = sourceMatch[1];
      const asset = assetHashLookup[hash];
      if (asset) {
        const { httpServerLocation, name, type } = asset;
        uri = `${httpServerLocation}/${name}.${type}`;
      }
    }
  }
  if (!uri) {
    return null;
  }
  return <Image source={{ uri }} style={[{ tintColor }, style]} {...props} />;
}

export async function loadImages() {
  // nope
}
