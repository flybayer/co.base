export default function defineCloudFunction(name, fn, versionId) {
  return {
    type: 'CloudFunction',
    name,
    fn,
    versionId,
  };
}
