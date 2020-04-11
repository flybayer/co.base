import { Err, createDispatcher } from '@aven/utils';
import { streamOfValue } from '@aven/stream';

import cuid from 'cuid';

export default function sourceFromRootDocSet(rootDocSet, domain, source, auth) {
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
