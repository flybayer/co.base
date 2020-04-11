import createBlock from './createBlock';
import bindCommitDeepBlock from './bindCommitDeepBlock';

import { Err } from '@aven/utils';
import { createProducerStream, streamOfValue, streamNever } from '@aven/stream';

import cuid from 'cuid';

export default function createDoc({
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
  onCreateDocSet,
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

  const children = onCreateDocSet({
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
