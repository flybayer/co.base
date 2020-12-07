import { BehaviorSubject, Subject } from 'rxjs-compat';
import xs from 'xstream';
import cuid from 'cuid';

import { createDispatcher, Err } from '@aven/utils';
import bindCommitDeepBlock from './bindCommitDeepBlock';
import { getMaxListDocs } from './maxListDocs';

class IDMatchError extends Error {
  constructor(providedId, computedId) {
    super(
      `The Id spcified does not match! "${providedId}" was specified, but the checksum id of the block is "${computedId}"`,
    );
    this.params = {
      providedId,
      computedId,
    };
  }
  code = 'IDMatchError';
}

const pathJoin = require('path').join;

function getTerms(name) {
  if (!name) {
    return [];
  }
  return name.split('/');
}

function isDocNameValid(name) {
  return true; // todo, probably actually use this??
}

function getParentDocName(name) {
  const terms = getTerms(name);
  const parentTerms = terms.slice(0, terms.length - 1);
  return parentTerms.join('/');
}

function getMainTerm(name) {
  const terms = getTerms(name);
  return terms[terms.length - 1];
}

function getRootTerm(name) {
  const terms = getTerms(name);
  return terms[0];
}

function getChildName(name) {
  const terms = getTerms(name);
  const childTerms = terms.slice(1);
  const childName = childTerms.join('/');
  return childName;
}

function _renderDoc({ id }) {
  // this strips out hidden features of the doc and snapshots the referenced values
  return {
    id,
  };
}

function verifyDomain(inputDomain, sourceDomain) {
  if (inputDomain !== sourceDomain) {
    throw new Error(
      `Invalid domain for this data source. Expecting "${sourceDomain}", but "${inputDomain}" was provided as the domain`,
    );
  }
}

export default function createGenericDataSource({
  getBlock,
  getAllBlockIds,
  commitBlock,
  commitBlockId,
  commitDoc,
  commitDocDestroy,
  commitDocMove,
  isConnected,
  docState,
  domain: sourceDomain,
  id,
}) {
  const sourceId = id || cuid();

  if (!docState) {
    throw new Error('Cannot create a data source without a state object');
  }

  function getMemoryNode(name, ensureExistence, context) {
    let currentNode = context || docState;
    if (!currentNode && !ensureExistence) {
      return null;
    }
    if (!currentNode) {
      throw new Error('Cannot access this memory node without a context');
    }
    if (!currentNode.children) {
      currentNode.children = {};
    }
    if (!currentNode.childrenSet) {
      currentNode.childrenSet = new Set();
    }
    if (!currentNode.childrenEvents) {
      currentNode.childrenEvents = new Subject();
    }
    if (name === '') {
      return currentNode;
    }
    let rootTerm = getRootTerm(name);
    let { children, childrenSet } = currentNode;
    if (ensureExistence && !childrenSet.has(rootTerm)) {
      addChild(currentNode, rootTerm, { id: null });
    }
    const childNode = children[rootTerm];
    if (name === rootTerm) {
      return getMemoryNode('', ensureExistence, childNode);
    }
    const childPath = getChildName(name);
    return getMemoryNode(childPath, ensureExistence, childNode);
  }

  const commitDeepBlock = bindCommitDeepBlock(commitBlock);

  async function _putDoc(name, id) {
    await commitDoc(name, id);
    const memoryDoc = getMemoryNode(name, true);
    memoryDoc.id = id;
    if (memoryDoc.behavior) {
      const newDoc = _renderDoc(memoryDoc);
      if (newDoc.id !== memoryDoc.behavior.getValue().id) {
        memoryDoc.behavior.next(newDoc);
      }
    } else {
      memoryDoc.behavior = new BehaviorSubject(_renderDoc(memoryDoc));
    }
  }

  async function _putBlock(fullValue) {
    const { value, refs } = await commitDeepBlock(fullValue);
    const block = await commitBlock(value, refs);
    return block;
  }

  async function PutBlock({ value, name, domain, id }) {
    if (!name) {
      throw new Err('Invalid doc name for "PutBlock"', 'InvalidDocName', {
        domain,
        name,
      });
    }
    if (!domain) {
      throw new Err('Invalid domain for "PutBlock"', 'InvalidDomain', {
        domain,
      });
    }
    if (value === undefined) {
      throw new Err('Invalid value for "PutBlock"', 'EmptyValue', {
        domain,
        name,
        value,
      });
    }
    // todo, (epic): properly associate these blocks with the provided domain+docName

    const putResult = await _putBlock(value);

    if (id && putResult.id !== id) {
      throw new Err(
        `Invalid ID provided for this value. Provided "${id}" but expected "${putResult.id}"`,
        'InvalidValueId',
        { id, value },
      );
      // should destroy putResult.id, todo
    }
    return {
      id: putResult.id,
    };
  }

  async function PutDoc({ domain, name, id }) {
    if (id === undefined) {
      throw new Error('Cannot PutDoc without id set to null or valid block id');
    }
    verifyDomain(domain, sourceDomain);
    if (id !== null) {
      await commitBlockId(id);
    }
    await _putDoc(name, id);
  }

  async function PutDocValue({ domain, name, value, id }) {
    verifyDomain(domain, sourceDomain);
    if (value === undefined) {
      throw new Error('Must provide value to PutDocValue');
    }
    if (name == null) {
      throw new Error('Must provide a name to PutDocValue');
    }
    const memoryDoc = getMemoryNode(name, true);
    if (
      typeof value === 'object' &&
      value != null &&
      value.type === 'TransactionValue'
    ) {
      const { on } = value;
      if (typeof on !== 'object') {
        throw new Error(
          'Cannot PutDocValue a TransactionValue with invalid "on" field',
        );
      } else if (on === null) {
        if (memoryDoc.id != null) {
          throw new Error(
            'Cannot PutDocValue a TransactionValue on a null id, because the current doc id is not null.',
          );
        }
      } else if (on.id !== memoryDoc.id) {
        throw new Error(
          'Cannot put a transaction value when the previous id does not match `on.id`',
        );
      }
    }
    const { id: blockId } = await _putBlock(value);
    if (id && id !== blockId) {
      throw new IDMatchError(id, blockId);
    }
    await commitDoc(name, blockId);
    memoryDoc.id = blockId;
    if (memoryDoc.behavior) {
      memoryDoc.behavior.next(_renderDoc(memoryDoc));
    } else {
      memoryDoc.behavior = new BehaviorSubject(_renderDoc(memoryDoc));
    }
    return { id: blockId, name, domain };
  }

  async function PutTransactionValue({ domain, name, value }) {
    verifyDomain(domain, sourceDomain);
    if (value === undefined) {
      throw new Error('Must provide value to PutTransactionValue');
    }
    const memoryDoc = getMemoryNode(name, true);
    const on = memoryDoc.id
      ? { id: memoryDoc.id, type: 'BlockReference' }
      : null;
    const finalValue = {
      type: 'TransactionValue',
      on,
      value,
    };
    const { id } = await _putBlock(finalValue);
    await commitDoc(name, id);
    memoryDoc.id = id;
    if (memoryDoc.behavior) {
      memoryDoc.behavior.next(_renderDoc(memoryDoc));
    } else {
      memoryDoc.behavior = new BehaviorSubject(_renderDoc(memoryDoc));
    }
    return { id, name, domain };
  }

  function publishChildrenBehavior(memoryDoc) {
    memoryDoc.childrenSetBehavior &&
      memoryDoc.childrenSetBehavior.next({
        value: { docs: [...memoryDoc.childrenSet] },
      });
  }

  function destroyChild(node, childName) {
    node.childrenSet.delete(childName);
    node.childrenEvents.next({ type: 'DestroyChildDoc', name: childName });
    delete node.children[childName];
    publishChildrenBehavior(node); // todo delete all childrenSetBehavior
  }

  function addChild(node, childName, newDocNode) {
    node.children[childName] = newDocNode;
    node.childrenSet.add(childName);
    node.childrenEvents.next({ type: 'AddChildDoc', name: childName });
    publishChildrenBehavior(node); // todo delete all childrenSetBehavior
  }

  async function MoveDoc({ domain, from, to }) {
    verifyDomain(domain, sourceDomain);
    await commitDocMove(from, to);
    const fromParentName = getParentDocName(from);
    const fromChildName = getMainTerm(from);
    const toParentName = getParentDocName(to);
    const toChildName = getMainTerm(to);
    const fromParent = getMemoryNode(fromParentName, false);
    const toParent = getMemoryNode(toParentName, true);
    const docToMove = fromParent.children[fromChildName];

    addChild(toParent, toChildName, docToMove);

    destroyChild(fromParent, fromChildName);
  }

  async function PostDoc({ domain, name, id, value }) {
    verifyDomain(domain, sourceDomain);

    if (!isDocNameValid(name)) {
      throw new Error(`Invalid Doc name "${name}"`);
    }
    if (domain === undefined) {
      throw new Error('Invalid use. ', { domain, name, id });
    }
    const postedName = name ? pathJoin(name, cuid()) : cuid();
    if (value !== undefined) {
      const { id } = await _putBlock(value);
      await _putDoc(postedName, id);
      return { name: postedName, id };
    } else {
      await PutDoc({ domain, name: postedName, id });
      return { name: postedName, id };
    }
  }

  async function DestroyDoc({ domain, name }) {
    verifyDomain(domain, sourceDomain);
    await commitDocDestroy(name);

    const parentMemoryDoc = getMemoryNode(getParentDocName(name), false);
    const destroyChildName = getMainTerm(name);
    if (!parentMemoryDoc || !parentMemoryDoc.children[destroyChildName]) {
      throw new Error('Cannot destroy doc that does not exist');
    }
    destroyChild(parentMemoryDoc, destroyChildName);
    publishChildrenBehavior(parentMemoryDoc);
  }

  async function GetBlock({ domain, name, id }) {
    if (!name) {
      throw new Error('Name must be provided while getting a block!');
      // and theoretically, shouldn't we actually verify that the block actually belongs to this doc??
    }
    verifyDomain(domain, sourceDomain);
    const value = await getBlock(id);
    return { id, value };
  }

  async function GetBlocks({ domain, name, ids }) {
    const results = await Promise.all(
      ids.map(async id => {
        return await GetBlock({ domain, name, id });
      }),
    );
    return { results };
  }

  async function GetDoc({ domain, name }) {
    verifyDomain(domain, sourceDomain);
    const nameParts = name.split('#');
    const realName = nameParts[0];
    if (nameParts[1]) {
      return { id: nameParts[1] };
    }
    const memoryDoc = getMemoryNode(realName, false);
    if (!memoryDoc) {
      return { id: undefined };
    }
    return { id: memoryDoc.id };
  }

  async function GetDocs({ domain, names }) {
    const results = await Promise.all(
      names.map(async name => {
        return await GetDoc({ domain, name });
      }),
    );
    return { results };
  }

  async function ListDocs({ domain, parentName, afterName }) {
    verifyDomain(domain, sourceDomain);

    const parentMemoryDoc = getMemoryNode(parentName || '', false);
    if (!parentMemoryDoc) {
      return { docs: [] };
    }
    const maxCount = getMaxListDocs();
    let docs = afterName
      ? [...parentMemoryDoc.childrenSet, afterName]
      : [...parentMemoryDoc.childrenSet];
    let hasMore = parentMemoryDoc.childrenSet.size > maxCount;
    docs.sort();
    if (afterName) {
      const i = docs.lastIndexOf(afterName);
      if (i === -1) {
        // umm, we inject this value, so I wouldn't ever expect to see this:
        throw new Error('wh0t?!');
      }
      docs = docs.slice(i + 1);
      hasMore = docs.length > maxCount;
    }
    docs = docs.slice(0, maxCount);
    return {
      docs,
      hasMore,
    };
  }

  async function ListDomains() {
    return [sourceDomain];
  }

  async function GetStatus() {
    return {
      ready: true,
      connected: true,
      migrated: true,
    };
  }

  const close = () => {
    docState = null;
  };
  const observeDoc = async (domain, name) => {
    verifyDomain(domain, sourceDomain);
    const memoryDoc = getMemoryNode(name, false);
    if (memoryDoc === null) {
      throw new Error(`Cannot observe nonexistent doc "${name}"`);
    }
    if (memoryDoc && memoryDoc.behavior) {
      return memoryDoc.behavior;
    } else {
      return (memoryDoc.behavior = new BehaviorSubject(_renderDoc(memoryDoc)));
    }
  };

  const observeDocChildren = async (domain, name) => {
    verifyDomain(domain, sourceDomain);
    const memoryDoc = getMemoryNode(name, false);
    if (!memoryDoc) {
      throw new Error('parent does not exist');
    }
    return memoryDoc.childrenEvents;
  };

  function getDocStream(domain, name) {
    return xs
      .fromPromise(observeDoc(domain, name))
      .map(obs => xs.fromObservable(obs))
      .flatten()
      .remember()
      .debug(() => {});
  }

  function getDocChildrenEventStream(domain, name) {
    return xs
      .fromPromise(observeDocChildren(domain, name))
      .map(obs => xs.fromObservable(obs))
      .flatten()
      .remember()
      .debug(() => {});
  }

  async function GetDocValue({ domain, name }) {
    verifyDomain(domain, sourceDomain);
    const doc = await GetDoc({ domain, name });
    const id = doc && doc.id;
    if (!id) {
      return { id, value: undefined };
    }
    const block = await GetBlock({ domain, name, id });
    return {
      id,
      value: block.value,
    };
  }

  async function GetDocValues({ domain, names }) {
    const results = await Promise.all(
      names.map(async name => {
        return await GetDocValue({ domain, name });
      }),
    );
    return { results };
  }

  return {
    isConnected,
    close,
    observeDoc,
    observeDocChildren,
    getDocStream,
    getDocChildrenEventStream,
    dispatch: createDispatcher({
      PutDoc,
      PutBlock,
      PutDocValue,
      PutTransactionValue,
      PostDoc,
      GetBlock,
      GetBlocks,
      GetDoc,
      GetDocs,
      GetDocValue,
      GetDocValues,
      GetStatus,
      ListDomains,
      ListDocs,
      DestroyDoc,
      MoveDoc,
    }),
    id: sourceId,
  };
}
