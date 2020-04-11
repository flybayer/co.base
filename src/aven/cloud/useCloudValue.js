export default function useCloudValue(cloudValueInput) {
  let cloudVal = cloudValueInput;
  const cloud = useCloud();
  if (typeof cloudValueInput === 'string') {
    const doc = cloud.get(cloudValueInput);
    cloudVal = doc.value;
  }
  if (cloudVal === null) {
    return null;
  }
  if (!cloudVal) {
    throw new Error('Cloud value must have a stream');
  }
  return useStream(cloudVal);
}
