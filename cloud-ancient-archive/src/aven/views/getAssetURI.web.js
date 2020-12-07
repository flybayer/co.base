// so, on the web client, metro is kind enough to register assets in this registry, as they are required.
// once the asset is required/registered, it is treated as a numerical id which can be looked up.
import { getAssetByID } from 'react-native/Libraries/Image/AssetRegistry';
// metro must have this file hard-coded somewhere?? can it be configured to the RNW registry?

export default function getAssetURI(source) {
  if (typeof source === 'number') {
    const asset = getAssetByID(source);
    let uri = `/static/${asset.hash}.${asset.type}`;
    if (__DEV__) {
      uri = `http://localhost:8081${asset.httpServerLocation}/${asset.name}.${asset.type}`;
    }
    return uri;
  }
  return null;
}
