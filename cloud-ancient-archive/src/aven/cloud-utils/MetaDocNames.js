export function getAuthDocName(name) {
  if (name == null) {
    return null;
  }
  if (name === '_auth') {
    return '';
  }
  const match = name.match(/^(.*)\/_auth$/);
  if (match) {
    return match[1];
  }
  return null;
}
