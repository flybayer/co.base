import { getIdOfValue, Err } from '@aven/utils';
import { createProducerStream } from '@aven/stream';

function getNow() {
  return Math.floor(new Date().getTime() / 1000);
}

export default function createBlock({
  domain,
  auth,
  onGetName,
  source,
  id,
  value,
  onReport,
  onInitialLoad,
}) {
  let observedBlockId = null;

  if (value !== undefined) {
    observedBlockId = getIdOfValue(value).id;
  }
  const blockId = id || observedBlockId;
  if (!blockId && value === undefined) {
    throw new Error('Cannot create block without id or value!');
  }
  if (!blockId) {
    throw new Error('Block id could not be determined!');
  }
  if (id && observedBlockId && id !== observedBlockId) {
    throw new Error(
      'id and value were both provided to createBlock, but the id does not match the value!',
    );
  }

  if (!blockId) {
    throw new Error('id or value must be provided to createBlock!');
  }

  const initValue = value;
  // const initValue = value === undefined ? blockValueCache.get(blockId) : value;

  const initialBlockState = {
    id: blockId, // Known to be the correct id by this point
    value: initValue, // either the block's final value, or undefined
    lastFetchTime: null,
    lastPutTime: null,
  };

  let blockState = initialBlockState;

  let notifyStateChange = null;

  function setBlockState(stateUpdates) {
    blockState = {
      ...blockState,
      ...stateUpdates,
    };
    notifyStateChange && notifyStateChange();
  }

  let onStop = null;
  const blockStream = createProducerStream({
    crumb: 'BlockState-' + blockId,
    start: notify => {
      notifyStateChange = () => {
        notify.next(blockState);
      };
      notifyStateChange();

      const docName = onGetName();

      if (blockState.value !== undefined) {
        return; // no need to load, the value is already here
      }

      let promiseChain = Promise.resolve();

      if (onInitialLoad) {
        promiseChain = promiseChain
          .then(() => onInitialLoad('Block', domain, docName, blockId))
          .then(initState => {
            if (initState) {
              setBlockState({
                value: initState.value,
              });
            }
          })
          .catch(err => {
            // Initial load may fail
            // console.error(
            //   'Failure of onInitialLoad of block state',
            //   { domain, docName, blockId },
            //   err,
            // );
          });
      }

      promiseChain
        .then(() => {
          if (blockState.value === undefined) {
            return source.dispatch({
              type: 'GetBlock',
              domain,
              auth,
              name: docName,
              id: blockId,
            });
          }
        })
        .then(resp => {
          if (blockState.value !== undefined) {
            return;
          }
          if (!resp) {
            throw new Error('Could not load block');
          }
          setBlockState({
            value: resp.value,
            lastFetchTime: getNow(),
          });
        })
        .catch(err => {
          notify.error(err);
        });
    },
    stop: () => {
      if (onStop) {
        onStop();
      }
      notifyStateChange = null;
      onStop = null;
    },
    getDetachedValue: () => blockState,
  });

  const blockValueStream = blockStream
    .map(blockState => {
      return blockState.value;
    }, 'GetValue')
    .filter(val => {
      return val !== undefined;
    }, 'FilterUndefined');

  const blockIdAndValueStream = blockValueStream.map(value => {
    return { value, id: blockId };
  }, 'ExpandBlockIdAndValue-' + blockId);

  async function getReference() {
    // why is this async? good question. Eventually, we should make block checksumming lazy, so unlike the current implementation, the id may not be ready yet
    if (!blockId) {
      throw new Error(
        'Cannot getReference of an incomplete block without a value or id',
      );
    }
    return { type: 'BlockReference', id: blockId };
  }

  function shamefullySetPutTime() {
    // internal use only please
    setBlockState({
      lastPutTime: getNow(),
    });
  }

  function shamefullySetFetchedValue(value) {
    setBlockState({
      lastFetchTime: getNow(),
      value,
    });
  }

  async function put() {
    if (blockState.lastFetchTime || blockState.lastPutTime) {
      return;
    }
    if (blockState.value === undefined) {
      throw new Err('Cannot put empty block');
    }
    onReport && onReport('PutBlock', { id: blockId, value: blockState.value });
    const name = onGetName;
    const resp = await source.dispatch({
      type: 'PutBlock',
      domain,
      auth,
      name,
      value: blockState.value,
    });
    if (resp.id !== blockId) {
      throw new Error(
        `Attempted to put "${name}" block "${blockId}" but the server claims the ID is "${resp.id}"`,
      );
    }
    shamefullySetPutTime();
  }

  async function getId() {
    return blockId;
  }

  const cloudBlock = {
    ...blockStream,
    type: 'Block',
    id: blockId,
    getId,
    getReference,
    value: blockValueStream,
    idAndValue: blockIdAndValueStream,
    export: async () => {
      const name = onGetName();
      const idAndValue = await blockIdAndValueStream.load();
      if (!idAndValue) {
        return {
          type: 'Block',
          domain,
          name,
        };
      }
      return {
        type: 'Block',
        domain,
        name,
        id: idAndValue.id,
        value: idAndValue.value,
      };
    },
    put,
    shamefullySetPutTime,
    shamefullySetFetchedValue,
  };

  return cloudBlock;
}
