// Kite - The lightweight Aven Cloud Client

import getIdOfValue from '../cloud-utils/getIdOfValue';
import Err from '../utils/Err';
import cuid from 'cuid';
import createDispatcher from '../cloud-utils/createDispatcher';
import bindCommitDeepBlock from './bindCommitDeepBlock';
import { createStreamValue } from './StreamValue';
import {
  createProducerStream,
  streamOf,
  streamOfValue,
  streamNever,
  combineStreams,
} from './createMemoryStream';

/*

Pretend types:

CloudSubscriber<V, E>:
  next: (V) => void,
  error: (E) => void,
  complete: () => void,

AttachmentSubscriber:
  next: (isAttached: boolean) => void

CloudValue<V, E>:
  get: () => V,
  stream: {
    addListener: (s: CloudSubscriber<V, E>) => void,

    removeListener: (s: CloudSubscriber<V, E>) => void,
  }
  getIsAttached: () => bool,
  isAttachedStream: {
    addListener: (s: AttachmentSubscriber) => void,
    removeListener: (s: AttachmentSubscriber) => void,
  }
  load: () => Promise<void>

Block
  value: CloudValue()

BlockState

Doc

*/

function getNow() {
  return Math.floor(new Date().getTime() / 1000);
}

function hasDepth(name) {
  return name.match(/\//);
}
function valuePluck(o) {
  return o.value;
}
export function valueMap(idAndValue) {
  return idAndValue.map(valuePluck, 'GetValue');
}
export function createStreamDoc(idAndValueStream, domain, onGetName) {
  const streamIdAndValue = createStreamValue(idAndValueStream, onGetName);
  const value = createStreamValue(valueMap(idAndValueStream), onGetName);

  return {
    type: 'StreamDoc',
    value,
    idAndValue: streamIdAndValue,
    getReference: () => ({
      type: 'StreamDoc',
      name: onGetName(),
    }),
    putValue: () => {
      throw new Error('Cannot PutValue of a stream doc');
    },
    export: async () => {
      const idAndValue = await streamIdAndValue.load();
      if (!idAndValue) {
        return {
          type: 'Doc',
          domain,
          name: onGetName(),
        };
      }
      return {
        type: 'Doc',
        domain,
        name: onGetName(),
        id: idAndValue.id,
        value: idAndValue.value,
      };
    },

    isDestroyed: () => false,
    putTransactionValue: () => {
      throw new Error(`Cannot putTransactionValue on "${onGetName()}"`);
    },
    getId: () => {
      throw new Error(
        'Cannot getId of a stream doc. Instead, go load doc.idAndValue',
      );
    },
  };
}

export function createBlock({
  domain,
  auth,
  onGetName,
  nameChangeNotifiers,
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
  });
  const blockStateValue = createStreamValue(
    blockStream,
    () => `Block(${onGetName()}#${blockId})`,
  );

  const blockValueStream = blockStream
    .map(blockState => {
      return blockState.value;
    }, 'GetValue')
    .filter(val => {
      return val !== undefined;
    }, 'FilterUndefined');

  const blockValue = createStreamValue(
    blockValueStream,
    () => `Block(${onGetName()}#${blockId}).value`,
  );

  const blockIdAndValueStream = blockValueStream.map(value => {
    return { value, id: blockId };
  }, 'ExpandBlockIdAndValue-' + blockId);

  const blockIdAndValue = createStreamValue(
    blockIdAndValueStream,
    () => `Block(${onGetName()}#${blockId}).idAndValue`,
  );

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
    ...blockStateValue,
    type: 'Block',
    id: blockId,
    getId,
    getReference,
    value: blockValue,
    idAndValue: blockIdAndValue,
    export: async () => {
      const name = onGetName();
      const idAndValue = await blockIdAndValue.load();
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

export function createDoc({
  source,
  domain,
  auth,
  onGetName,
  nameChangeNotifiers,
  isUnposted,
  onDidRename,
  onDidDestroy,
  onReport,
  onInitialLoad,
}) {
  function getName() {
    return onGetName();
  }

  function getParentName() {
    const name = getName();
    const nameParts = name.split('/');
    if (nameParts.length === 1) {
      return null;
    }
    return nameParts.slice(0, -1).join('/');
  }

  let docState = {
    isPosted: !isUnposted,
    lastFetchTime: null,
    lastPutTime: null,
    id: undefined,
    context: { gen: 0 },
  };

  const docReportHandlers = new Set();
  function handleReports(reportHandler) {
    docReportHandlers.add(reportHandler);
    return {
      remove: () => {
        docReportHandlers.delete(reportHandler);
      },
    };
  }

  function performReport(reportType, report) {
    onReport && onReport(reportType, report);
    docReportHandlers.forEach(handler => handler(reportType, report));
  }

  async function getReference() {
    // why is this async? good question. Eventually, we should make block checksumming lazy, so unlike the current implementation, the id may not be ready yet
    return {
      type: 'DocReference',
      domain,
      name: getName(),
      id: docState.id,
    };
  }

  let notifyStateChange = null;

  function setDocState(updates) {
    docState = {
      ...docState,
      ...updates,
    };
    notifyStateChange && notifyStateChange();
  }

  let docName = onGetName();
  let doStop = null;
  let performNotification = null;
  const docProducer = {
    crumb: 'DocState-' + docName,
    start: listen => {
      // todo.. add listener to nameChangeNotifiers, then unsubscribe and re-subscribe using new name
      performNotification = () => {
        listen.next(docState);
      };
      performNotification();
      notifyStateChange = () => {
        performNotification && performNotification();
      };
      if (onInitialLoad && docState.id === undefined) {
        onInitialLoad('Doc', domain, docName)
          .then(initState => {
            if (initState && initState.id) {
              if (initState.value) {
                commitBlock(initState.value);
              }
              setDocState({
                id: initState.id,
              });
            } else if (docState.isLocalOnly) {
              setDocState({
                id: null,
              });
            }
          })
          .catch(err => {
            console.error(
              'Failure of onInitialLoad of doc state',
              { domain, docName },
              err,
            );
          });
      }

      if (docState.isLocalOnly) {
        return;
      }
      const upStream = source.getDocStream(domain, docName, auth);
      const internalListener = {
        next: v => {
          if (!v) {
            return;
          }
          if (v.value !== undefined) {
            const block = getBlock(v.id);
            block.shamefullySetFetchedValue(v.value);
          }
          setDocState({
            lastFetchTime: getNow(),
            context: v.context,
            id: v.id || null,
          });
        },
        error: e => {
          listen.error(e);
        },
        complete: () => {
          listen.complete();
        },
      };
      upStream.addListener(internalListener);
      doStop = () => upStream.removeListener(internalListener);
    },
    stop: () => {
      performNotification = null;
      doStop && doStop();
      doStop = null;
    },
  };
  const docStream = createProducerStream(docProducer);

  const docStateValue = createStreamValue(docStream, () => `Doc(${getName()})`);

  const docBlocks = {};

  function getBlockOfValue(value) {
    const block = createBlock({
      source,
      domain,
      auth,
      onGetName,
      nameChangeNotifiers,
      value,
      onReport: performReport,
      onInitialLoad,
    });
    if (docBlocks[block.id]) {
      return docBlocks[block.id];
    }
    return (docBlocks[block.id] = block);
  }

  function getBlock(id) {
    if (docBlocks[id]) {
      return docBlocks[id];
    }
    docBlocks[id] = createBlock({
      source,
      domain,
      auth,
      onGetName,
      nameChangeNotifiers,
      id,
      onReport: performReport,
      onInitialLoad,
    });

    return docBlocks[id];
  }

  function commitBlock(value) {
    const block = getBlockOfValue(value);
    return { id: block.id };
  }

  const commitDeepBlock = bindCommitDeepBlock(commitBlock);

  async function publishValue(value) {
    const committed = await commitDeepBlock(value);
    const block = getBlockOfValue(committed.value);
    await block.put();
    return block;
  }

  async function putValue(value) {
    const committed = await commitDeepBlock(value);
    const block = getBlockOfValue(committed.value);
    performReport('PutDocValue', { value, id: block.id });
    await quietlyPutBlock(block);
  }

  function isBlockPublished(block) {
    const blockState = block.get();
    return blockState.lastFetchTime != null || blockState.lastPutTime != null;
  }

  function isBlockValueLoaded(block) {
    const blockState = block.get();
    return blockState.value !== undefined;
  }

  async function quietlyPutBlock(block) {
    if (docState.isLocalOnly) {
      setDocState({ id: block.id });
      return;
    }
    const lastId = docState.id;
    const isPosted = docState.isPosted;

    if (!isPosted) {
      setDocState({
        puttingFromId: lastId,
        id: block.id,
      });

      let postData = { id: null };
      if (block && block.value.get() !== undefined) {
        postData = { value: block.value.get() };
      } else if (block) {
        postData = { id: await block.getId() };
      }

      try {
        const parentName = getParentName();

        const postResp = await source.dispatch({
          type: 'PostDoc',
          domain,
          auth,
          name: parentName,
          ...postData,
        });

        const resultingChildName =
          parentName == null
            ? postResp.name
            : postResp.name.slice(parentName.length + 1);
        await onDidRename(resultingChildName);
        setDocState({
          lastPutTime: getNow(),
          isPosted: true,
        });
        block.shamefullySetPutTime();
      } catch (e) {
        setDocState({
          id: lastId,
          puttingFromId: null,
        });
        throw e;
      }
      return;
    }

    if (
      block === null ||
      isBlockPublished(block) ||
      !isBlockValueLoaded(block)
    ) {
      const putId = block === null ? null : block.id;
      setDocState({
        puttingFromId: lastId,
        id: putId,
      });
      try {
        await source.dispatch({
          type: 'PutDoc',
          domain,
          auth,
          name: getName(),
          id: putId,
        });
        setDocState({
          lastPutTime: getNow(),
        });
      } catch (e) {
        setDocState({
          id: lastId,
          puttingFromId: null,
        });
        throw e;
      }
    } else {
      setDocState({
        puttingFromId: lastId,
        id: block.id,
      });
      try {
        await source.dispatch({
          type: 'PutDocValue',
          domain,
          auth,
          name: getName(),
          id: block.id,
          value: block.value.get(),
        });
        setDocState({
          lastPutTime: getNow(),
        });
        block.shamefullySetPutTime();
      } catch (e) {
        setDocState({
          id: lastId,
          puttingFromId: null,
        });
        throw e;
      }
    }
  }

  async function putBlock(block) {
    onReport &&
      onReport('PutDoc', {
        id: block.id,
      });
    await quietlyPutBlock(block);
  }

  function hydrate(id, value) {
    const block = getBlockOfValue(value);
    if (block.id !== id) {
      console.error('Hydration failed');
      return;
    }
    setDocState({
      id,
      lastFetchTime: getNow(),
    });
  }

  async function _remotePutTransactionValue(value) {
    // an implementation of putTransactionValue, where the change is not expected to be optimistic. This is used by putTransactionValue when the current id of a doc is not known

    const result = await source.dispatch({
      type: 'PutTransactionValue',
      domain,
      auth,
      name: getName(),
      value,
    });
    setDocState({
      id: result.id,
      lastFetchTime: getNow(),
      lastPut: getNow(),
    });
    performReport('PutDoc', {
      id: result.id,
    });
    return result;
  }

  const emptyIdValueStream = streamOfValue(
    {
      id: null,
      value: undefined,
    },
    'StaticEmptyIdValue',
  );

  async function finallyPutTransactionValue(value) {
    const fullValue =
      typeof value === 'object' && value.dispatchTime === undefined
        ? { ...value, dispatchTime: Date.now(), dispatchId: cuid() }
        : value;
    if (docState.id === undefined && !docState.isLocalOnly) {
      return _remotePutTransactionValue(value);
    }
    const prevId = docState.id;
    const on = prevId ? { id: prevId, type: 'BlockReference' } : null;
    const expectedTransactionValue = {
      type: 'TransactionValue',
      on,
      value: fullValue,
    };
    const expectedBlock = getBlockOfValue(expectedTransactionValue);

    performReport('PutDocValue', {
      id: expectedBlock.id,
      value: expectedTransactionValue,
    });

    if (docState.isLocalOnly) {
      setDocState({
        id: expectedBlock.id,
      });
      return { id: expectedBlock.id };
    }
    setDocState({
      id: expectedBlock.id,
      puttingFromId: prevId,
    });

    const result = await source.dispatch({
      type: 'PutTransactionValue',
      domain,
      auth,
      name: getName(),
      value,
    });

    let stateUpdates = {
      lastPutTime: getNow(),
      puttingFromId: null,
      lastFetchTime: getNow(),
      id: result.id,
    };
    if (result.id !== expectedBlock.id) {
      performReport('PutDoc', {
        id: result.id,
      });
      // console.warn(
      //   `Expected to put block id "${expectedBlock.id}", but actually put id "${result.id}"`,
      // );
    }
    setDocState(stateUpdates);
    return result;
  }

  let transactionPutPromise = Promise.resolve();
  function putTransactionValue(value) {
    transactionPutPromise = transactionPutPromise.then(() =>
      finallyPutTransactionValue(value),
    );
    return transactionPutPromise;
  }

  const docIdAndValue = createStreamValue(
    docStream
      .dropRepeats((a, b) => a.id === b.id, 'DropRepeatedIds')
      .map(state => {
        if (state.id === undefined) {
          return streamNever('UndefinedId');
        }
        if (state.id === null) {
          return emptyIdValueStream;
        }
        const block = getBlock(state.id);
        return block.value.stream.map(val => {
          return {
            value: val,
            id: state.id,
            context: state.context,
          };
        });
      })
      .flatten()
      .dropRepeats((a, b) => {
        return a.id === b.id;
      }, 'DropRepeatedIdValues'),
    () => `Doc(${getName()}).idValue`,
  );

  const docValue = createStreamValue(
    docIdAndValue.stream.map(idAndValue => {
      return idAndValue.value;
    }, 'DocValueStream'),
    () => `Doc(${getName()}).value`,
  );

  const children = createDocSet({
    domain,
    auth,
    source,
    onGetName,
    nameChangeNotifiers,
    onInitialLoad,
    onReport: performReport,
  });

  async function destroy() {
    setDocState({ id: null, isDestroyed: true });
    onDidDestroy();
    children.shamefullyDestroyAll();
    await source.dispatch({
      type: 'DestroyDoc',
      domain,
      auth,
      name: getName(),
    });
  }

  async function getId() {
    return docState.id;
  }

  function isDestroyed() {
    return docState.isDestroyed;
  }

  function setLocalOnly(isLocalOnly = true) {
    if (docState.isLocalOnly === isLocalOnly) {
      return;
    }
    setDocState({
      isLocalOnly,
    });
  }

  async function transact(transactionFn) {
    // todo.. uh, do this safely by putting a TransactionValue!
    let lastValue = undefined;
    if (docState.isPosted) {
      const { value } = await docIdAndValue.load();
      lastValue = value;
    } else {
      const { value } = docIdAndValue.get();
      lastValue = value;
    }
    const newValue = transactionFn(lastValue);
    if (lastValue !== newValue) {
      await putValue(newValue);
    }
  }

  const cloudDoc = {
    ...docStateValue,
    type: 'Doc',
    transact,
    getId,
    idAndValue: docIdAndValue,
    isDestroyed,
    getReference,
    value: docValue,
    getName,
    getParentName,
    getBlock,
    getBlockOfValue,
    publishValue,
    setLocalOnly,
    handleReports,
    destroy,
    putValue,
    putTransactionValue,
    putBlock,
    export: async () => {
      const name = getName();
      const idAndValue = await docIdAndValue.load();
      if (!idAndValue) {
        return {
          type: 'Doc',
          domain,
          name,
        };
      }
      return {
        type: 'Doc',
        domain,
        name,
        id: idAndValue.id,
        value: idAndValue.value,
      };
    },
    hydrate,
    children,
  };
  return cloudDoc;
}

function parentChildName(parent, child) {
  if (parent) {
    return `${parent}/${child}`;
  }
  return child;
}

export function createDocSet({
  domain,
  auth,
  source,
  onGetName,
  nameChangeNotifiers,
  onReport,
  onInitialLoad,
}) {
  let childDocs = {};
  let notifyChildDocsChange = null;

  const childDocMovers = new WeakMap();

  function _createChildDoc(name) {
    if (childDocs[name]) {
      return childDocs[name];
    }
    let currentDocName = name;
    let currentDocFullName = parentChildName(onGetName(), currentDocName);
    const childNameChangeNotifiers = new Set();

    function handleParentRename(newParentName) {
      currentDocFullName = parentChildName(newParentName, currentDocName);
      childNameChangeNotifiers.forEach(notifier =>
        notifier(currentDocFullName),
      );
    }

    function handleRename(newLocalName) {
      const prevName = currentDocName;
      onReport &&
        onReport('DocRename', {
          name: prevName,
          newName: currentDocFullName,
        });
      const childDoc = childDocs[currentDocName];
      currentDocName = newLocalName;
      currentDocFullName = parentChildName(onGetName(), currentDocName);
      const nextChildDocs = {
        ...childDocs,
        [newLocalName]: childDoc,
      };
      delete nextChildDocs[prevName];
      childDocs = nextChildDocs;
      notifyChildDocsChange && notifyChildDocsChange();
    }

    nameChangeNotifiers && nameChangeNotifiers.add(handleParentRename);

    const newDoc = createDoc({
      source,
      domain,
      auth,
      nameChangeNotifiers: childNameChangeNotifiers,
      onGetName: () => currentDocFullName,
      onDidRename: newLocalName => {
        handleRename(newLocalName);
      },
      onDidDestroy: () => {
        nameChangeNotifiers && nameChangeNotifiers.delete(handleParentRename);
        childNameChangeNotifiers.clear(); // this probably won't be needed because the whole thing should be GC'd
        const nextChildDocs = {
          ...childDocs,
        };
        delete nextChildDocs[currentDocName];
        childDocs = nextChildDocs;
      },
      onReport: (reportType, report) => {
        onReport &&
          onReport(reportType, {
            ...report,
            name: report.name
              ? `${currentDocName}/${report.name}`
              : currentDocName,
          });
      },
      onInitialLoad,
    });
    childDocs = { ...childDocs, [name]: newDoc };
    childDocMovers.set(newDoc, handleRename);
    notifyChildDocsChange && notifyChildDocsChange();
    return newDoc;
  }

  function get(name) {
    if (typeof name !== 'string') {
      throw new Err(
        `Expected a string to be passed to DocSet.get(). Instead got "${name}"`,
      );
    }
    const localName = name.split('/')[0];
    if (!localName) {
      throw new Err('Invalid name to get');
    }
    let returningCloudValue = null;

    let restOfName = null;
    if (localName.length < name.length - 1) {
      restOfName = name.slice(localName.length + 1);
    }
    if (childDocs[localName]) {
      returningCloudValue = childDocs[localName];
    }
    if (!returningCloudValue) {
      const newDoc = _createChildDoc(localName);
      returningCloudValue = newDoc;
    }
    if (restOfName) {
      if (!returningCloudValue.children) {
        throw new Error(`Cannot get "${restOfName}" within "${name}"`);
      }
      returningCloudValue = returningCloudValue.children.get(restOfName);
    }
    return returningCloudValue;
  }

  function post() {
    const localName = cuid();
    const postedDoc = _createChildDoc(localName);
    return postedDoc;
  }

  function shamefullyDestroyAll() {
    childDocs = {};
    notifyChildDocsChange && notifyChildDocsChange();
  }

  function setOverride(name, doc) {
    childDocs = {
      ...childDocs,
      [name]: doc,
    };
    notifyChildDocsChange && notifyChildDocsChange();
    return doc;
  }
  function setOverrideStream(name, stream) {
    const streamDoc = createStreamDoc(stream, domain, () => name);
    return setOverride(name, streamDoc);
  }

  async function move(fromName, toName) {
    if (hasDepth(fromName)) {
      throw new Error(
        `Cannot move from "${fromName}" because it has a slash. Deep moves are not supported yet.`,
      );
    }
    if (hasDepth(toName)) {
      throw new Error(
        `Cannot move to "${toName}" because it has a slash. Deep moves are not supported yet.`,
      );
    }
    const docToMove = childDocs[fromName];
    const mover = childDocMovers.get(docToMove);
    if (!mover) {
      throw new Error(
        'Cannot move this doc because we misplaced the ability to do so',
      );
    }
    mover(toName);

    try {
      await source.dispatch({
        type: 'MoveDoc',
        domain,
        from: fromName,
        to: toName,
      });
    } catch (e) {
      mover(fromName);
      throw e;
    }
  }

  function setOverrideValueStream(name, stream, context) {
    return setOverrideStream(
      name,
      stream.map(value => {
        return { value, id: getIdOfValue(value).id };
      }),
      context,
    );
  }
  const allProducer = {
    crumb: `${onGetName()}.all`,
    start: notify => {
      let notificationTimeout = null;
      notifyChildDocsChange = () => {
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
          notify.next(childDocs);
        }, 1);
      };
      notifyChildDocsChange();
      source
        .dispatch({
          type: 'ListDocs',
          domain,
          parentName: onGetName(),
        })
        .then(resp => {
          if (resp && resp.docs) {
            resp.docs.forEach(docName => {
              _createChildDoc(docName);
            });
          }
        })
        .catch(e => {
          console.error('ListDocError', e);
          notify.error(e);
        });
    },
    stop: () => {
      notifyChildDocsChange = null;
    },
  };
  const all = createProducerStream(allProducer);

  const cloudDocSet = {
    all,
    get,
    post,
    move,
    setOverride,
    setOverrideStream,
    setOverrideValueStream,
    shamefullyDestroyAll,
  };

  return cloudDocSet;
}

function sourceFromRootDocSet(rootDocSet, domain, source, auth) {
  const sourceId = `CloudClient-${cuid()}`;
  function close() {}

  function getDocStream(subsDomain, name, auth) {
    if (subsDomain !== domain) {
      return source.getDocStream(subsDomain, name, auth);
    }
    const doc = rootDocSet.get(name);
    return doc.idAndValue.stream;
  }

  function getDocChildrenEventStream() {}

  async function sessionDispatch(action) {
    return await source.dispatch({
      ...action,
      ...(auth || {}),
    });
  }

  async function PutDoc({ domain, name, id }) {
    const doc = rootDocSet.get(name);
    const block = id === null ? null : doc.getBlock(id);
    await doc.putBlock(block);
    return { id, name, domain };
  }
  // async function PutBlock() {}

  async function PutDocValue({ name, value }) {
    const doc = rootDocSet.get(name);
    await doc.putValue(value);
    const id = await doc.getId();
    return { id, name, domain };
  }

  async function PutTransactionValue({ name, value }) {
    const doc = rootDocSet.get(name);
    await doc.putTransactionValue(value);
    const id = await doc.get().id;
    return { id, name, domain };
  }

  async function PostDoc({ name, value, id }) {
    const docSet = name == null ? rootDocSet : rootDocSet.get(name).children;
    const newDoc = docSet.post();
    if (value !== undefined) {
      await newDoc.putValue(value);
      // todo check id of newDoc
    } else {
      const block = newDoc.getBlock(id);
      await newDoc.putBlock(block);
    }
    return {
      name: newDoc.getName(),
      id: newDoc.get().id,
    };
  }

  async function GetBlock({ name, id }) {
    const doc = rootDocSet.get(name);
    if (doc.type === 'StreamDoc') {
      throw new Err('Cannot get block of a stream doc, yet, unfortunately');
    }
    const block = doc.getBlock(id);
    const value = await block.value.load();
    return {
      id: block.id,
      value,
    };
  }
  async function GetBlocks({ domain, name, ids }) {
    const results = await Promise.all(
      ids.map(async id => {
        return await GetBlock({ domain, name, id });
      }),
    );
    return { results };
  }
  async function GetDoc({ name }) {
    const doc = rootDocSet.get(name);
    const loaded = await doc.load();
    return {
      id: loaded.id,
      domain,
      name,
    };
  }

  async function GetDocs({ domain, names }) {
    const results = await Promise.all(
      names.map(async name => {
        return await GetDoc({ domain, name });
      }),
    );
    return { results };
  }

  async function GetDocValue({ name }) {
    const doc = rootDocSet.get(name);
    const context = await doc.getReference();
    const results = await doc.idAndValue.load();
    const isDestroyed = doc.isDestroyed();
    if (isDestroyed) {
      return {
        isDestroyed: true,
        value: undefined,
        id: undefined,
        context,
      };
    }
    return { context, ...results };
  }

  async function GetDocValues({ domain, names }) {
    const results = await Promise.all(
      names.map(async name => {
        return await GetDocValue({ domain, name });
      }),
    );
    return { results };
  }

  async function MoveDoc({ domain, from, to }) {
    await rootDocSet.move(from, to);
  }

  async function DestroyDoc({ domain, name }) {
    const doc = rootDocSet.get(name);
    await doc.destroy();
  }

  return {
    close,
    getDocStream,
    getDocChildrenEventStream,

    dispatch: createDispatcher(
      {
        PutDoc,
        // PutBlock,
        PutDocValue,
        PutTransactionValue,
        PostDoc,
        GetBlock,
        GetBlocks,
        GetDoc,
        GetDocs,
        GetDocValue,
        GetDocValues,

        // GetStatus,
        // ListDomains,
        // ListDocs,
        DestroyDoc,
        MoveDoc,
      },
      sessionDispatch,
      domain,
      sourceId,
    ),
    id: sourceId,
  };
}

export function createReducerStream(
  actionsDoc,
  reducerFn,
  initialState,
  reducerName,
  { snapshotsDoc } = { snapshotsDoc: null },
) {
  const docStateStreams = new Map();

  function getDocStateStream(id) {
    if (id === undefined) {
      return streamNever('UndefinedId');
    }
    if (id === null) {
      const [stream] = streamOf(
        { value: initialState, id: getIdOfValue(initialState).id },
        'NoActionStateStream',
      );
      return stream;
    }
    if (docStateStreams.has(id)) {
      return docStateStreams.get(id);
    }
    const actionBlock = actionsDoc.getBlock(id);

    const docStateStream = actionBlock.idAndValue.stream
      .map(actionDocState => {
        const actionDocId = actionDocState.id;
        const actionDocValue = actionDocState.value;
        const actionValue = actionDocValue.value || actionDocValue;

        let [prevStateStream] = streamOf({
          value: initialState,
          id: getIdOfValue(initialState).id,
        });
        if (actionDocValue.on && actionDocValue.on.type === 'BlockReference') {
          prevStateStream = getDocStateStream(actionDocValue.on.id);
        }
        return prevStateStream.map(lastState => {
          const newState = reducerFn(lastState.value, actionValue);
          const newId = getIdOfValue(newState).id;
          return {
            value: newState,
            id: newId,
            context: {
              type: 'ReducedStream',
              reducerName,
              docName: actionsDoc.getName(),
              docId: actionDocId,
              prevStateId: lastState.id,
              gen: (lastState.context ? lastState.context.gen : 0) + 1,
            },
          };
        });
      })
      .flatten();

    docStateStreams.set(id, docStateStream);
    return docStateStream;
  }
  if (!snapshotsDoc) {
    return actionsDoc.stream
      .dropRepeats((a, b) => {
        return a.id === b.id;
      }, 'DropRepeatedIdActions')
      .map(docState => {
        return getDocStateStream(docState.id);
      })
      .flatten()
      .dropRepeats((a, b) => {
        return a.id === b.id;
      }, 'DropRepeatedIdValues');
  }
  return combineStreams({
    sourceDoc: actionsDoc.stream,
    snapshotValue: snapshotsDoc.value.stream,
  })
    .map(({ snapshotValue, sourceDoc }) => {
      if (
        snapshotValue &&
        snapshotValue.context &&
        snapshotValue.context.reducerName === reducerName
      ) {
        const { docId } = snapshotValue.context;
        if (!docStateStreams.has(docId)) {
          const [docStateStream] = streamOf(snapshotValue);
          docStateStreams.set(docId, docStateStream);
        }
      }
      return getDocStateStream(sourceDoc.id);
    })
    .flatten()
    .dropRepeats((a, b) => {
      return a.id === b.id;
    }, 'DropRepeatedIdValues');
}

export function createSessionClient({
  domain,
  source,
  auth,
  onReport,
  onInitialLoad,
}) {
  const docs = createDocSet({
    domain,
    source,
    auth,
    onGetName: () => null,
    nameChangeNotifiers: null,
    onReport: (reportType, report) => {
      onReport && onReport(reportType, { ...report, domain });
    },
    onInitialLoad,
  });

  function setReducer(
    resultStateDocName,
    { reducer, actionsDoc, snapshotInterval, snapshotsDoc },
  ) {
    const stream = createReducerStream(
      actionsDoc,
      reducer.reducerFn,
      reducer.initialState,
      reducer.reducerName,
      {
        snapshotsDoc,
      },
    ).spy(async update => {
      if (update.next && snapshotsDoc) {
        const { context, id, value } = update.next;
        const lastSnapshot = await snapshotsDoc.value.load();
        if (
          lastSnapshot === undefined ||
          lastSnapshot.context === undefined ||
          lastSnapshot.context === null ||
          (context &&
            lastSnapshot.context.gen <= context.gen - snapshotInterval)
        ) {
          await snapshotsDoc.putValue({ context, id, value });
        }
      }
    });
    docs.setOverrideStream(resultStateDocName, stream);
    return docs.get(resultStateDocName);
  }

  function hydrateDoc(hydrateDomain, name, id, value) {
    if (hydrateDomain !== domain) {
      return;
    }
    const doc = docs.get(name);
    doc.hydrate(id, value);
  }

  function hydrateValue({ type, domain, name, id, value }) {
    if (type === 'Doc') {
      hydrateDoc(domain, name, id, value);
    } else if (type === 'Block') {
      throw new Error('Block hydrating yet implemented');
    }
  }
  const cloudSessionClient = {
    type: 'SesionClient',
    docs,
    connected: source.connected,
    get: docs.get,
    hydrate: values => {
      values.forEach(hydrateValue);
    },
    hydrateValue,
    setReducer,
    ...sourceFromRootDocSet(docs, domain, source, auth),
  };
  return cloudSessionClient;
}

export function createLocalSessionClient({
  onReport,
  localSource,
  rehydrateIgnoreList,
  ...clientOpts
}) {
  function handleAsyncStorageFailure(err, ctx) {
    console.error('Failed to save locally.', err, ctx);
  }

  function clientReport(reportName, report) {
    const { id, name, domain, value } = report;
    if (reportName === 'PutDocValue') {
      localSource
        .dispatch({ type: 'PutDocValue', domain, name, id, value })
        .catch(err => handleAsyncStorageFailure(err, { reportName, report }));
    } else if (reportName === 'PutDoc') {
      localSource
        .dispatch({ type: 'PutDoc', domain, name, id })
        .catch(err => handleAsyncStorageFailure(err, { reportName, report }));
    } else if (reportName === 'PutBlock') {
      localSource
        .dispatch({ type: 'PutBlock', domain, name, id, value })
        .catch(err => handleAsyncStorageFailure(err, { reportName, report }));
    }
    onReport && onReport(reportName, report);
  }

  const sessionClient = createSessionClient({
    ...clientOpts,
    onReport: clientReport,
    onInitialLoad: async (blockOrDoc, domain, name, blockId) => {
      if (
        rehydrateIgnoreList &&
        rehydrateIgnoreList[domain] &&
        rehydrateIgnoreList[domain][name]
      ) {
        return;
      }
      if (blockOrDoc === 'Doc') {
        const result = await localSource.dispatch({
          type: 'GetDocValue',
          domain,
          name,
        });
        return result;
      }
      if (blockOrDoc === 'Block') {
        const result = await localSource.dispatch({
          type: 'GetBlock',
          domain,
          name,
          id: blockId,
        });

        return result;
      }

      return null;
    },
  });

  return sessionClient;
}

export function createSyntheticDoc({ onCreateChild }) {
  const children = new Map();
  function getChild(name) {
    if (children.has(name)) {
      return children.get(name);
    }
    const child = onCreateChild(name);
    children.set(name, child);
    return child;
  }

  return {
    children: {
      get: getChild,
    },
  };
}

export function createReducedDoc({ actions, reducer, domain, onGetName }) {
  const reducerStream = createReducerStream(
    actions,
    reducer.reducerFn,
    reducer.initialState,
    reducer.reducerName,
    {},
  );
  const streamDoc = createStreamDoc(reducerStream, domain, onGetName);
  return streamDoc;
}

export function createClient({ domain, source, onReport }) {
  let clientState = {};

  let performStateNotification = null;

  let sessionClient = createSessionClient({
    domain,
    source,
    auth: null,
    onReport,
  });

  function setClientState(updates) {
    let prevClientState = clientState;
    clientState = {
      ...clientState,
      ...updates,
    };
    if (clientState.session !== prevClientState.session) {
      sessionClient = createSessionClient({
        domain,
        source,
        auth: clientState.session,
        onReport,
      });
    }
    performStateNotification && performStateNotification();
  }

  const clientStateStream = createStreamValue(
    createProducerStream({
      crumb: 'ClientState',
      start: listen => {
        performStateNotification = () => {
          listen.next(clientState);
        };
        performStateNotification();
      },
      stop: () => {
        performStateNotification = null;
      },
    }),
  );

  async function establishAnonymousSession() {
    if (clientState.session) {
      return clientState.session;
    }
    const created = await source.dispatch({
      type: 'CreateAnonymousSession',
      domain,
    });
    if (created && created.session) {
      setClientState({
        session: created.session,
      });
    }
    return created;
  }

  const cloudClient = {
    type: 'Client',
    establishAnonymousSession,
    getCloud: () => sessionClient,
    connected: source.connected,
    hydrate: sessionClient.hydrate,
    clientStateStream,
    get: docName => sessionClient.get(docName),
  };

  return cloudClient;
}
