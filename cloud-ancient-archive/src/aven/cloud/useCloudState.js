import useCloud from './useCloud';
import useCloudValue from './useCloudValue';

export default function useCloudState(name, defaultValue) {
  const cloud = useCloud();
  const doc = cloud.get(name);
  let value = useCloudValue(doc.value);
  if (value === null && defaultValue !== undefined) {
    value = defaultValue;
  }
  return [value, doc.putValue];
}
