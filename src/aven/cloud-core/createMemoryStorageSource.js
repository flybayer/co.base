import createGenericDataSource from './createGenericDataSource';
import { getIdOfValue } from '@aven/utils';
import { streamOfValue } from '@aven/stream';

export default function createMemoryStorageSource(opts = {}) {
  const primaryDomain = opts.domain;

  if (!primaryDomain) {
    throw new Error(
      'Cannot start a memory storage source without specifying a domain',
    );
  }

  const _blocks = {};

  const docState = { children: {}, childrenSet: new Set() };

  const isConnected = streamOfValue(true);

  async function getBlock(blockId) {
    if (typeof blockId !== 'string') {
      console.error(blockId);
      throw new Error(`Block ID is not valid ${blockId}`);
    }
    if (_blocks[blockId] === undefined) {
      throw new Error(`Block ID "${blockId}" was not found in the store.`);
    }
    return _blocks[blockId];
  }

  async function getAllBlockIds() {
    return Object.keys(_blocks);
  }

  async function commitBlock(value) {
    const { id } = getIdOfValue(value);
    if (!_blocks[id]) {
      _blocks[id] = value;
    }
    return { id };
  }

  async function commitBlockId(id) {
    if (id == null || _blocks[id] === undefined) {
      throw new Error(`Cannot find block with id "${id}"`);
    }
  }

  async function commitDoc(name, id) {}

  async function commitDocDestroy(name) {}

  async function commitDocMove(name, newName) {}

  return createGenericDataSource({
    id: opts.id,

    domain: primaryDomain,
    docState,

    getBlock,
    getAllBlockIds,

    commitBlock,
    commitBlockId,
    commitDoc,
    commitDocDestroy,
    commitDocMove,

    isConnected,
  });
}
