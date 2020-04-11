import createChildrenCache from './createChildrenCache';
import { streamOfValue } from '@aven/stream';

export default function createSyntheticDoc({ onCreateChild }) {
  const value = streamOfValue(undefined);
  const idAndValue = streamOfValue({ id: null, value: undefined });
  return {
    type: 'SyntheticDoc',
    value,
    idAndValue,
    getReference: () => ({ type: 'SyntheticDoc' }),
    children: createChildrenCache(onCreateChild),
  };
}
