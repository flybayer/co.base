import React from 'react';
import CloudContext from './CloudContext';

export default function useCloudClient() {
  // todo check the type to verify this is actually a client and not a cloud
  return React.useContext(CloudContext);
}
