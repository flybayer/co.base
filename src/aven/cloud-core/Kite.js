// Kite - The lightweight Aven Cloud Client

import cuid from 'cuid';
import { getIdOfValue, Err, createDispatcher } from '@aven/utils';
import bindCommitDeepBlock from './bindCommitDeepBlock';
import { error, trace } from '@aven/logger';
import {
  createProducerStream,
  streamOf,
  streamOfValue,
  streamNever,
  combineStreams,
} from './createMemoryStream';

function getNow() {
  return Math.floor(new Date().getTime() / 1000);
}

function hasDepth(name) {
  return name.match(/\//);
}
function valuePluck(o) {
  if (o === undefined) return undefined;
  return o.value;
}
export function valueMap(idAndValue) {
  return idAndValue.map(valuePluck, 'GetValue');
}

function createChildrenCache(onCreateChild) {
  const children = new Map();
  function getChild(name) {
    const nameMatch = name.match(/^([^/.]*)/);
    const firstName = nameMatch && nameMatch[0];
    if (!firstName) {
      return null;
    }
    const restOfName =
      name.length > firstName.length ? name.slice(firstName.length + 1) : null;
    if (!nameMatch) {
      return null;
    }
    let childDoc = null;
    if (children.has(firstName)) {
      childDoc = children.get(firstName);
    } else {
      childDoc = onCreateChild(firstName);
      children.set(firstName, childDoc);
    }
    if (restOfName) {
      return childDoc.children.get(restOfName);
    } else {
      return childDoc;
    }
  }
  return {
    get: getChild,
  };
}

export function createStreamDoc(
  idAndValueStream,
  domain,
  onGetName,
  onCreateChild,
) {
  const value = idAndValueStream
    .map(valuePluck)
    .filter(v => v !== undefined, 'StreamDocValueFilterUndefined');
  return {
    type: 'StreamDoc',
    value,
    idAndValue: idAndValueStream,
    children: createChildrenCache(onCreateChild),
    getReference: () => ({
      type: 'StreamDoc',
      name: onGetName(),
      crumb: idAndValueStream.crumb,
    }),
    putValue: () => {
      throw new Error('Cannot PutValue of a stream doc');
    },
    export: async () => {
      const idAndValue = await idAndValueStream.load();

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
      if (
        onInitialLoad &&
        !docState.isRemoteOnly &&
        docState.id === undefined
      ) {
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
        setDocState({
          id: null,
        });
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
            block && block.shamefullySetFetchedValue(v.value);
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
    getDetachedValue: () => docState,
  };
  const docStream = createProducerStream(docProducer);

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
    if (id === null) {
      return null;
    }
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
    performReport('PutDocValue', {
      value,
      id: block.id,
      isRemoteOnly: docState.isRemoteOnly,
      isEphemeral: docState.isEphemeral,
    });
    await quietlyPutBlock(block);
  }

  function isBlockPublished(block) {
    const blockState = block.get();
    return (
      !!blockState &&
      (blockState.lastFetchTime != null || blockState.lastPutTime != null)
    );
  }

  function isBlockValueLoaded(block) {
    const blockState = block.get();
    return !!blockState && blockState.value !== undefined;
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

    const isPublished = isBlockPublished(block);
    const isValueLoaded = isBlockValueLoaded(block);
    if (block === null || isPublished || !isValueLoaded) {
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
    if (block.id === undefined) {
      throw new Error('Cannot put block without id');
    }
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
      isRemoteOnly: docState.isRemoteOnly,
      isEphemeral: docState.isEphemeral,
    });
    return result;
  }

  const emptyIdValueStream = streamOfValue(
    {
      id: null,
      value: null,
    },
    'StaticEmptyIdValue',
  );

  async function locallyPutTransactionValue(value) {
    const dispatchTime = Date.now();
    const dispatchId = cuid();
    const fullLocalValue =
      typeof value === 'object'
        ? { ...value, dispatchTime, dispatchId }
        : value;
    let prevId = docState.id;
    if (prevId === undefined) {
      const { id } = await docIdAndValue.load();
      prevId = id;
    }
    const on = prevId ? { id: prevId, type: 'BlockReference' } : null;
    const localTransactionValue = {
      type: 'TransactionValue',
      on,
      value: fullLocalValue,
    };
    const localBlock = getBlockOfValue(localTransactionValue);
    setDocState({
      id: localBlock.id,
    });
    performReport('PutDocValue', {
      id: localBlock.id,
      value: localTransactionValue,
      isRemoteOnly: docState.isRemoteOnly,
      isEphemeral: docState.isEphemeral,
    });
    return { id: localBlock.id, prevId, dispatchTime, dispatchId };
  }

  async function finallyPutTransactionValue(value) {
    if (docState.isLocalOnly) {
      return locallyPutTransactionValue(value);
    }
    if (docState.id === undefined) {
      return _remotePutTransactionValue(value);
    }
    const dispatchTime = Date.now();
    const dispatchId = cuid();
    const fullLocalValue =
      typeof value === 'object'
        ? { ...value, dispatchTime, dispatchId }
        : value;
    const prevId = docState.id;
    const on = prevId ? { id: prevId, type: 'BlockReference' } : null;
    const localTransactionValue = {
      type: 'TransactionValue',
      on,
      value: fullLocalValue,
    };
    const localBlock = getBlockOfValue(localTransactionValue);

    setDocState({
      id: localBlock.id,
      puttingFromId: prevId,
    });

    const result = await source.dispatch({
      type: 'PutTransactionValue',
      domain,
      auth,
      name: getName(),
      value,
    });
    if (result.id === prevId) {
      const finalValue =
        typeof value === 'object'
          ? {
              ...value,
              dispatchTime: result.dispatchTime,
              dispatchId: result.dispatchId,
            }
          : value;
      if (docState.id === undefined && !docState.isLocalOnly) {
        return _remotePutTransactionValue(value);
      }
      const finalTransactionValue = {
        type: 'TransactionValue',
        on,
        value: finalValue,
      };
      const finalBlock = getBlockOfValue(finalTransactionValue);

      if (result.id !== finalBlock.id) {
        setDocState({
          id: result.id,
          lastFetchTime: getNow(),
          puttingFromId: null,
        });
        throw new Err('TransactionOptimisticFailure', {
          id: result.id,
          domain,
          name: onGetName(),
        });
      }
      performReport('PutDocValue', {
        id: finalBlock.id,
        value: finalTransactionValue,
        isRemoteOnly: docState.isRemoteOnly,
      });
    } else {
      performReport('PutDoc', {
        id: result.id,
        isRemoteOnly: docState.isRemoteOnly,
      });
    }
    setDocState({
      lastPutTime: getNow(),
      puttingFromId: null,
      lastFetchTime: getNow(),
      id: result.id,
    });
    return result;
  }

  let transactionPutPromise = Promise.resolve();
  function putTransactionValue(value) {
    transactionPutPromise = transactionPutPromise.then(() =>
      finallyPutTransactionValue(value),
    );
    return transactionPutPromise;
  }

  const docIdAndValue = docStream
    .dropRepeats((a, b) => a.id === b.id, 'DropRepeatedIds')
    .map(state => {
      if (state.id === undefined) {
        return streamNever('UndefinedId');
      }
      if (state.id === null) {
        return emptyIdValueStream;
      }
      const block = getBlock(state.id);
      return block.value.map(val => {
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
    }, 'DropRepeatedIdValues');

  const docValue = docIdAndValue
    .map(idAndValue => {
      if (idAndValue === undefined) return undefined;
      return idAndValue.value;
    }, 'DocValueStream')
    .filter(value => value !== undefined, 'DocUndefinedValueFilter');

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
    if (!docState.isRemoteOnly && docState.isLocalOnly === isLocalOnly) {
      return;
    }
    setDocState({
      isLocalOnly,
      isRemoteOnly: false,
    });
  }

  function setEphemeral() {
    if (docState.isEphemeral) {
      return;
    }
    setDocState({
      isLocalOnly: true,
      isRemoteOnly: false,
      isEphemeral: true,
    });
  }

  function setRemoteOnly(isRemoteOnly = true) {
    if (!docState.isLocalOnly && docState.isRemoteOnly === isRemoteOnly) {
      return;
    }
    setDocState({
      isRemoteOnly,
      isLocalOnly: false,
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
    ...docStream,
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
    setEphemeral,
    setRemoteOnly,
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
        auth,
      });
    } catch (e) {
      mover(fromName);
      throw e;
    }
  }

  function setOverrideValueStream(name, stream, context) {
    return setOverrideStream(
      name,
      stream
        .map(value => {
          return { value, id: getIdOfValue(value).id };
        })
        .dropRepeats((a, b) => a.id === b.id, 'DropRepeatedIds'),
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
          auth,
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
  async function close() {
    // todo: get rid of local state...
  }

  function getDocStream(subsDomain, name, auth) {
    if (subsDomain !== domain) {
      return source.getDocStream(subsDomain, name, auth);
    }
    const doc = rootDocSet.get(name);
    if (!doc) {
      return streamOfValue(null);
    }
    return doc.idAndValue;
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
    const result = await doc.putTransactionValue(value);
    return { ...result, name, domain };
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
  let phase = 'init';
  let headId = undefined;
  let walkBackId = null;
  let walkForwardBreadcrumbs = [];
  let rootId = undefined;
  let currentStepPromise = null;
  let isReducerExecuting = false;
  const idRefs = {};
  const valueMap = new WeakMap();
  const actionMap = new WeakMap();
  const primaryStream = combineStreams({
    sourceDoc: actionsDoc.idAndValue,
    snapshotValue: snapshotsDoc ? snapshotsDoc.value : streamOfValue(null),
  }).filter(s => {
    // this is used to ensure the .load call of a reducer stream will wait for both values to be loaded. By default, combineStreams will eagerly provide a value as soon as any stream is ready
    return s.sourceDoc !== undefined && s.snapshotValue !== undefined;
  });
  let notifier = null;
  function getId(id) {
    if (idRefs[id]) {
      return idRefs[id];
    }
    return (idRefs[id] = {});
  }
  function getLatestState() {
    if (headId === null) {
      return { id: null, value: undefined };
    }
    const idRef = getId(headId);
    const value = valueMap.get(idRef);
    if (phase === 'ready') {
      return value;
    }
    return {
      ...(value || {}),
      unloadedProgress: {
        phase,
      },
    };
  }
  function scheduleReducerStep() {
    isReducerExecuting = true;
    if (currentStepPromise) return;
    currentStepPromise = performReducerStep()
      .catch(e => {
        console.error('Bad Step: ', e);
      })
      .finally(() => {
        currentStepPromise = null;
        if (isReducerExecuting) {
          scheduleReducerStep();
        }
      });
  }
  function pauseReducerExecution() {
    isReducerExecuting = false;
  }
  async function performReducerStep() {
    if (!isReducerExecuting) {
      return;
    }
    if (headId != null && !valueMap.has(getId(headId))) {
      phase = 'research';
    } else if (headId === null) {
      rootId = null;
      phase = 'ready';
    }
    if (phase !== 'research') {
      pauseReducerExecution();
      return;
    }
    if (rootId === undefined) {
      // the rootId is not yet determined, so we walk back..
      const researchIdString = walkBackId || headId;
      const researchId = getId(researchIdString);
      if (valueMap.has(researchId)) {
        rootId = researchIdString;
      } else {
        let actionValue = actionMap.get(researchId);
        if (!actionValue) {
          const researchBlock = actionsDoc.getBlock(researchIdString);
          actionValue = await researchBlock.value.load();
          actionMap.set(researchId, actionValue);
        }
        if (researchIdString) {
          walkForwardBreadcrumbs.push(researchIdString);
        }
        if (actionValue === null || actionValue.on === null) {
          rootId = researchIdString;
        } else if (actionValue.on && actionValue.on.id) {
          walkBackId = actionValue.on.id;
        }
      }
    } else if (walkForwardBreadcrumbs.length === 0) {
      if (valueMap.has(getId(headId))) {
        phase = 'ready';
      } else {
        // we are effectively stuck/stumped. restart the process by clearing rootId and walkBackId
        rootId = undefined;
        walkBackId = undefined;
      }
    } else {
      // the rootId is known! We are now executing forward..
      const walkIdString = walkForwardBreadcrumbs.pop();
      const walkId = getId(walkIdString);
      const actionValue = actionMap.get(walkId);
      if (!valueMap.has(walkId)) {
        // if the value has already been calculated.. great!
        const prevState =
          actionValue && actionValue.on
            ? valueMap.get(getId(actionValue.on.id))
            : { value: initialState, context: { gen: 0 } };
        const newState = reducerFn(
          prevState.value,
          actionValue.value,
          walkIdString,
        );
        const newId = getIdOfValue(newState).id;
        valueMap.set(walkId, {
          value: newState,
          id: newId,
          context: {
            type: 'ReducedStream',
            reducerName,
            docName: actionsDoc.getName(),
            rootDocId: rootId,
            docId: walkIdString,
            gen: prevState.context.gen + 1,
          },
        });
      }
      if (walkIdString === headId) {
        phase = 'ready';
        walkBackId = null;
      }
    }
    notifier && notifier.next(getLatestState());
  }
  const listener = {
    next: ({ sourceDoc, snapshotValue }) => {
      if (sourceDoc.value && sourceDoc.id) {
        actionMap.set(getId(sourceDoc.id), sourceDoc.value);
      }
      if (
        snapshotValue &&
        snapshotValue.context &&
        snapshotValue.context.reducerName === reducerName
      ) {
        const { docId } = snapshotValue.context;
        const idRef = getId(docId);
        if (!valueMap.has(idRef)) {
          valueMap.set(idRef, snapshotValue);
        }
      }
      if (sourceDoc.id !== headId) {
        headId = sourceDoc.id;
        // rootId = null;
      }
      if (headId && phase === 'init') {
        phase = 'research';
      }
      if (headId && phase === 'research' && valueMap.has(getId(headId))) {
        phase = 'ready';
      }
      scheduleReducerStep();
      notifier && notifier.next(getLatestState());
    },
    error: err => {
      notifier && notifier.error(err); // todo, wrap err properly.
    },
  };
  return createProducerStream({
    crumb: `reduced:${reducerName}`,
    start: notify => {
      notify.next(getLatestState());
      notifier = notify;
      primaryStream.addListener(listener);
    },
    stop: () => {
      primaryStream.removeListener(listener);
      pauseReducerExecution();
    },
  }).dropRepeats((a, b) => a.id === b.id, 'DropRepeatedIds');
}

export function createStackReducerStream(
  // export function createReducerStream(
  actionsDoc,
  reducerFn,
  initialState,
  reducerName,
  { snapshotsDoc } = { snapshotsDoc: null },
) {
  const docStateStreams = new Map();
  function getDocStateStream(id, depth = 0) {
    if (id === undefined) {
      return streamNever('UndefinedId');
    }
    if (id === null) {
      const [stream] = streamOf(
        { value: null, id: null },
        'NoActionStateStream',
      );
      return stream;
    }
    if (docStateStreams.has(id)) {
      return docStateStreams.get(id);
    }
    const actionBlock = actionsDoc.getBlock(id);

    const docStateStream = actionBlock.idAndValue
      .map(actionDocState => {
        const actionDocId = actionDocState.id;
        const actionDocValue = actionDocState.value;
        const actionValue = actionDocValue.value || actionDocValue;

        let [prevStateStream] = streamOf({
          value: initialState,
          id: getIdOfValue(initialState).id,
        });
        if (actionDocValue.on && actionDocValue.on.type === 'BlockReference') {
          prevStateStream = getDocStateStream(actionDocValue.on.id, depth + 1);
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
              rootDocId: lastState.context
                ? lastState.context.rootDocId
                : actionDocId,
              gen: (lastState.context ? lastState.context.gen : 0) + 1,
            },
          };
        });
      })
      .flatten()
      .cacheFirst();

    docStateStreams.set(id, docStateStream);
    return docStateStream;
  }
  if (!snapshotsDoc) {
    return actionsDoc
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
    sourceDoc: actionsDoc,
    snapshotValue: snapshotsDoc.value,
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
    )
      .filter(streamState => {
        return !!streamState && !streamState.unloadedProgress;
      })
      .spy(update => {
        (async () => {
          if (update.next && snapshotsDoc) {
            const lastSnapshot = await snapshotsDoc.value.load();
            if (
              lastSnapshot === null ||
              lastSnapshot === undefined ||
              lastSnapshot.context === undefined ||
              lastSnapshot.context === null ||
              (update.next.context &&
                lastSnapshot.context.reducerName !==
                  update.next.context.reducerName) ||
              (update.next.context &&
                lastSnapshot.context.gen <=
                  update.next.gen - snapshotInterval) ||
              (update.next.context &&
                lastSnapshot.context.rootDocId !==
                  update.next.context.rootDocId)
            ) {
              const { context, id, value } = update.next;
              await snapshotsDoc.putValue({ context, id, value });
              return { id, value, context };
            }
          }
          return false;
        })()
          .then(hasWritten => {
            hasWritten &&
              trace('SnapshotStored', {
                ...hasWritten.context,
              });
          })
          .catch(e => {
            error('SnapshotWriteError', {
              error: e,
              name: snapshotsDoc.getName(),
            });
          });
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
    auth,
    domain,
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
    error('LocalStorageError', {
      err,
      errorString: String(err),
      ctx,
    });
  }

  function clientReport(reportName, report) {
    const { id, name, domain, value, isRemoteOnly, isEphemeral } = report;
    if (isRemoteOnly || !localSource || isEphemeral) {
      return;
    }
    if (reportName === 'PutDocValue') {
      localSource
        .dispatch({
          type: 'PutDocValue',
          domain,
          name,
          id,
          value,
        })
        .catch(err => handleAsyncStorageFailure(err, { reportName, report }));
    } else if (reportName === 'PutDoc') {
      localSource.dispatch({ type: 'PutDoc', domain, name, id }).catch(err => {
        if (err.name === 'UnknownBlock') {
          clientOpts.source
            .dispatch({
              type: 'GetBlock',
              domain,
              name,
              id,
            })
            .then(blockData => {})
            .catch(err => {
              handleAsyncStorageFailure(err, { reportName, report });
            });
          return;
        }
        handleAsyncStorageFailure(err, { reportName, report });
      });
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
      if (!localSource) return;
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

export function createReducedDoc({
  actions,
  reducer,
  domain,
  onGetName,
  onCreateChild,
}) {
  const reducerStream = createReducerStream(
    actions,
    reducer.reducerFn,
    reducer.initialState,
    reducer.reducerName,
    {},
  );
  const streamDoc = createStreamDoc(
    reducerStream,
    domain,
    onGetName,
    onCreateChild,
  );
  return streamDoc;
}

export function createClient({
  domain,
  source,
  onReport,
  onClientState,
  initialClientState = {},
}) {
  const [clientState, setClientState] = streamOf(
    initialClientState,
    'ClientStateStream',
  );

  let clientAuth = initialClientState.session || null;
  let sessionClient = createSessionClient({
    domain,
    source,
    auth: clientAuth,
    onReport,
  });

  clientState.addListener({
    next: state => {
      if (state !== initialClientState) {
        onClientState && onClientState(state);
      }
      if (state.session !== clientAuth) {
        clientAuth = state.session;
        sessionClient = createSessionClient({
          domain,
          source,
          auth: clientAuth,
        });
      }
    },
  });

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
        ...clientState.get(),
        session: created.session,
      });
    }
    return created;
  }

  async function login({ accountId, verificationInfo }) {
    const resp = await source.dispatch({
      type: 'CreateSession',
      domain,
      accountId,
      verificationInfo,
      verificationResponse: null,
    });
    if (resp && resp.verificationChallenge) {
      setClientState({
        ...clientState.get(),
        verification: resp.verificationChallenge,
        verificationInfo: verificationInfo,
        verificationAccountId: accountId,
      });
    }
    return resp;
  }

  async function logout() {
    const state = clientState.get();
    if (state.session) {
      await source.dispatch({
        type: 'DestroySession',
        domain,
        auth: state.session,
      });
    }
    setClientState({
      ...clientState.get(),
      session: null,
      verification: null,
      verificationInfo: null,
      verificationAccountId: null,
    });
  }

  async function destroyAccount() {
    const state = clientState.get();
    if (state.session) {
      await source.dispatch({
        type: 'DestroyAccount',
        domain,
        auth: state.session,
      });
      setClientState({
        ...clientState.get(),
        session: null,
        verification: null,
        verificationInfo: null,
        verificationAccountId: null,
      });
    }
  }

  async function verifyLogin({ code }) {
    const state = clientState.get();
    const verificationResponse = {
      token: state.verification.token,
      key: code,
    };
    const resp = await source.dispatch({
      type: 'CreateSession',
      domain,
      accountId: state.verificationAccountId,
      verificationInfo: state.verificationInfo,
      verificationResponse,
    });
    if (!resp.session) {
      console.error('resp', resp);
      throw new Error('No session returned');
    }
    setClientState({
      ...clientState.get(),
      session: resp.session,
      verification: null,
      verificationInfo: null,
    });
    return resp;
  }

  const cloudClient = {
    type: 'Client',
    establishAnonymousSession,
    getCloud: () => sessionClient,
    connected: source.connected,
    hydrate: (...args) => sessionClient.hydrate(...args),
    login,
    logout,
    destroyAccount,
    verifyLogin,
    clientState,
    get: docName => sessionClient.get(docName),
  };

  return cloudClient;
}
