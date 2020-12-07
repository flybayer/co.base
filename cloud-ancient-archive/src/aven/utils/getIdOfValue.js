import SHA256 from 'crypto-js/sha256';

const stringify = require('json-stable-stringify');

export default function getIdOfValue(value) {
  const blockData = stringify(value);
  const size = blockData === undefined ? null : blockData.length;
  const id = SHA256(blockData).toString();
  if (size === null) {
    console.error('Bad value serialization', id, value);
  }
  return { id, size, blockData };
}
