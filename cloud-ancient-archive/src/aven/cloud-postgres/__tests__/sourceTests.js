import { setMaxListDocs } from '../../cloud-core/maxListDocs';

async function justASec(ds) {
  const duration = ds.testPatienceMS || 1;
  return new Promise(resolve => setTimeout(resolve, duration));
}

export default function testDataSource(startTestDataSource) {
  it('basic put and get', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const putResult = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      value: { foo: 'bar' },
      name: 'foo',
    });
    const blk = await ds.dispatch({
      type: 'GetBlock',
      domain: 'test',
      id: putResult.id,
      name: 'foo',
    });
    await ds.close();
    expect(blk.value.foo).toEqual('bar');
  });

  it('get blocks', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const putResult1 = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      value: { foo: 'bar' },
      name: 'foo',
    });
    const putResult2 = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      value: { foo: 'foo' },
      name: 'foo',
    });
    const { results } = await ds.dispatch({
      type: 'GetBlocks',
      domain: 'test',
      ids: [putResult1.id, putResult2.id],
      name: 'foo',
    });
    expect(results[0].id).toEqual(putResult1.id);
    expect(results[1].id).toEqual(putResult2.id);
    await ds.close();
  });

  it('gets multiple docs', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      value: { myName: 'isFoo' },
      name: 'foo',
    });
    await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      value: { myName: 'isBar' },
      name: 'bar',
    });
    const { results } = await ds.dispatch({
      type: 'GetDocValues',
      domain: 'test',
      names: ['foo', 'bar'],
    });
    expect(results[0].value.myName).toEqual('isFoo');
    expect(results[1].value.myName).toEqual('isBar');
    await ds.close();
  });

  it('move doc shows in list', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const blk = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo',
      value: { foo: 'bar' },
    });
    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'foo',
      id: blk.id,
    });
    let result;
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(result.docs).toEqual(['foo']);
    await ds.dispatch({
      type: 'MoveDoc',
      domain: 'test',
      from: 'foo',
      to: 'foobob',
    });
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(result.docs).toEqual(['foobob']);
    await ds.close();
  });

  it('move doc works', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const blk = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo',
      value: { foo: 'bar' },
    });
    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'foo',
      id: blk.id,
    });
    await ds.dispatch({
      type: 'MoveDoc',
      domain: 'test',
      from: 'foo',
      to: 'foobob',
    });
    const doc = await ds.dispatch({
      type: 'GetDoc',
      domain: 'test',
      name: 'foobob',
    });
    expect(doc.id).toEqual(blk.id);

    const gotBlk = await ds.dispatch({
      type: 'GetBlock',
      domain: 'test',
      name: 'foobob',
      id: doc.id,
    });
    expect(gotBlk.value.foo).toEqual('bar');
    await ds.close();
  });

  it('list doc works', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    let list = null;
    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(list.docs).toEqual([]);

    const blk = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo',
      value: { foo: 'bar' },
    });
    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(list.docs).toEqual(['foo']);

    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'bar',
      id: blk.id,
    });
    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(list.docs).toEqual(['bar', 'foo']);
    await ds.close();
  });

  it('list docs length limit', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    let list = null;
    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(list.docs).toEqual([]);
    expect(list.hasMore).toEqual(false);

    setMaxListDocs(10);

    await Promise.all(
      Array(10)
        .fill(null)
        .map(async () => {
          await ds.dispatch({
            type: 'PostDoc',
            domain: 'test',
            parentName: 'foo',
            value: { foo: 'bar' },
          });
        }),
    );

    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      name: 'foo',
    });
    expect(list.docs.length).toEqual(10);
    expect(list.hasMore).toEqual(false);

    await ds.dispatch({
      type: 'PostDoc',
      domain: 'test',
      parentName: 'foo',
      value: { foo: 'bar' },
    });

    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      name: 'foo',
    });

    expect(list.docs.length).toEqual(10);
    expect(list.hasMore).toEqual(true);
    await ds.close();
  });

  it('list doc "after" pagination', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    let list = null;
    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      parentName: 'foo',
    });
    expect(list.docs).toEqual([]);
    expect(list.hasMore).toEqual(false);

    setMaxListDocs(2);

    await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo/a',
      value: { foo: 'bar' },
    });

    await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo/b',
      value: { foo: 'bar' },
    });

    await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo/c',
      value: { foo: 'bar' },
    });

    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      parentName: 'foo',
    });
    expect(list.docs).toEqual(['a', 'b']);
    expect(list.hasMore).toEqual(true);

    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      parentName: 'foo',
      afterName: 'a',
    });
    expect(list.docs).toEqual(['b', 'c']);
    expect(list.hasMore).toEqual(false);

    list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      parentName: 'foo',
      afterName: 'c',
    });
    expect(list.docs).toEqual([]);
    expect(list.hasMore).toEqual(false);
    await ds.close();
  });

  it('list doc works works', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    let docs = null;
    docs = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(docs.docs).toEqual([]);

    const blk = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo',
      value: { foo: 'bar' },
    });
    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'foo',
      id: null,
    });
    docs = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(docs.docs).toEqual(['foo']);

    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'bar',
      id: blk.id,
    });
    docs = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(docs.docs).toEqual(['bar', 'foo']);

    await ds.dispatch({
      type: 'DestroyDoc',
      domain: 'test',
      name: 'foo',
    });
    docs = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(docs.docs).toEqual(['bar']);
    await ds.close();
  });

  it('move doc affects children too', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const blk = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo',
      value: { foo: 'bar' },
    });
    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'foo/bar',
      id: blk.id,
    });
    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'foo/baz',
      id: blk.id,
    });
    let result;
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(result.docs).toEqual(['foo']);
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      parentName: 'foo',
    });
    expect(result.docs).toEqual(['bar', 'baz']);
    await ds.dispatch({
      type: 'MoveDoc',
      domain: 'test',
      from: 'foo',
      to: 'foobob',
    });

    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(result.docs).toEqual(['foobob']);
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      parentName: 'foobob',
    });
    expect(result.docs).toEqual(['bar', 'baz']);
    await ds.close();
  });

  it('get missing doc', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const doc = await ds.dispatch({
      type: 'GetDoc',
      domain: 'test',
      name: 'foo',
    });
    expect(doc.id).toEqual(undefined);
    await ds.close();
  });

  it('gets multiple missing docs', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const doc = await ds.dispatch({
      type: 'GetDocs',
      domain: 'test',
      names: ['foo', 'bar'],
    });
    expect(doc.results[0].id).toEqual(undefined);
    expect(doc.results[1].id).toEqual(undefined);
    await ds.close();
  });

  it('implicit parent list doc ', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    let result = null;
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(result.docs).toEqual([]);

    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'hello/world',
      id: null,
    });
    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'hello/mars',
      id: null,
    });
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(result.docs).toEqual(['hello']);
    result = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
      parentName: 'hello',
    });
    expect(result.docs).toEqual(['mars', 'world']);
    await ds.close();
  });

  it('implicit parent doc creation with null', async () => {
    // this test also demonstrates that docs can *exist* and still be empty, with id = null
    const ds = await startTestDataSource({ domain: 'test' });
    let result = null;

    await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'hello/world',
      value: 'foo',
    });
    result = await ds.dispatch({
      type: 'GetDocValue',
      domain: 'test',
      name: 'hello',
    });
    expect(result.value).toEqual(undefined);
    expect(result.id).toEqual(null);
    await ds.dispatch({
      type: 'DestroyDoc',
      domain: 'test',
      name: 'hello/world',
    });
    result = await ds.dispatch({
      type: 'GetDocValue',
      domain: 'test',
      name: 'hello',
    });
    expect(result.value).toEqual(undefined);
    expect(result.id).toEqual(null);
    // parent doc destroying works, and id goes to undefined:
    await ds.dispatch({
      type: 'DestroyDoc',
      domain: 'test',
      name: 'hello',
    });
    result = await ds.dispatch({
      type: 'GetDocValue',
      domain: 'test',
      name: 'hello',
    });
    expect(result.value).toEqual(undefined);
    expect(result.id).toEqual(undefined);
    await ds.close();
  });

  it('can destroy parent docs and children go away', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    const blk = await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo',
      value: { foo: 'bar' },
    });
    await ds.dispatch({
      type: 'PutDoc',
      domain: 'test',
      name: 'foo/bar',
      id: blk.id,
    });
    await ds.dispatch({
      type: 'DestroyDoc',
      domain: 'test',
      name: 'foo',
    });
    const doc = await ds.dispatch({
      type: 'GetDoc',
      domain: 'test',
      name: 'foo/bar',
    });
    expect(doc.id).toEqual(undefined);
    await ds.close();
  });

  it('destroy doc works', async () => {
    const ds = await startTestDataSource({ domain: 'test' });
    await ds.dispatch({
      type: 'PutDocValue',
      domain: 'test',
      name: 'foo',
      value: { foo: 'bar' },
    });
    await ds.dispatch({
      type: 'DestroyDoc',
      domain: 'test',
      name: 'foo',
    });
    const doc = await ds.dispatch({
      type: 'GetDoc',
      domain: 'test',
      name: 'foo',
    });
    expect(doc.id).toEqual(undefined);
    const list = await ds.dispatch({
      type: 'ListDocs',
      domain: 'test',
    });
    expect(list.docs).toEqual([]);
    await ds.close();
  });

  it('transaction enforcement on PutDocValue', async () => {
    const ds = await startTestDataSource({ domain: 'test' });

    const { id } = await ds.dispatch({
      type: 'PutDocValue',
      name: 'foo',
      domain: 'test',
      value: {
        name: 'init',
      },
    });

    // failed transaction with bad "on" block reference
    await expect(
      ds.dispatch({
        type: 'PutDocValue',
        name: 'foo',
        domain: 'test',
        value: {
          type: 'TransactionValue',
          on: { type: 'BlockReference', id: 'badId' },
          value: {
            name: 'changed',
          },
        },
      }),
    ).rejects.toThrow();

    const result = await ds.dispatch({
      type: 'PutDocValue',
      name: 'foo',
      domain: 'test',
      value: {
        type: 'TransactionValue',
        on: { type: 'BlockReference', id },
        value: {
          name: 'changed',
        },
      },
    });

    expect(result.id).not.toBe(null);

    const valueResult = await ds.dispatch({
      type: 'GetDocValue',
      name: 'foo',
      domain: 'test',
    });

    expect(valueResult.value.on.id).toEqual(id);
    expect(valueResult.value.value.name).toEqual('changed');
    await ds.close();
  });

  it('PutTransactionValue action', async () => {
    // this action behaves like PutDoc, but always forces the type and "on" to be set

    const ds = await startTestDataSource({ domain: 'test' });

    // transact on nonexistent value
    const { id } = await ds.dispatch({
      type: 'PutDocValue',
      name: 'foo',
      domain: 'test',
      value: {
        name: 'init',
      },
    });

    const result = await ds.dispatch({
      type: 'PutTransactionValue',
      name: 'foo',
      domain: 'test',
      value: {
        name: 'changed',
      },
    });

    expect(result.id).not.toBe(null);

    const valueResult = await ds.dispatch({
      type: 'GetDocValue',
      name: 'foo',
      domain: 'test',
    });

    expect(valueResult.value.on.id).toEqual(id);
    expect(valueResult.value.value.name).toEqual('changed');
    await ds.close();
  });

  describe('parent child docs', () => {
    it('can list with parents', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      let list = null;
      list = await ds.dispatch({
        type: 'ListDocs',
        domain: 'test',
      });
      expect(list.docs).toEqual([]);

      const blk = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: { foo: 'bar' },
      });

      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo/bar',
        id: blk.id,
      });

      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo/bar/boo',
        id: blk.id,
      });

      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo/baz',
        id: blk.id,
      });

      list = await ds.dispatch({
        type: 'ListDocs',
        domain: 'test',
        parentName: 'foo',
      });
      expect(list.docs).toEqual(['bar', 'baz']);

      list = await ds.dispatch({
        type: 'ListDocs',
        domain: 'test',
        parentName: 'foo/bar',
      });
      expect(list.docs).toEqual(['boo']);

      list = await ds.dispatch({
        type: 'ListDocs',
        domain: 'test',
      });
      expect(list.docs).toEqual(['foo']);
      await ds.close();
    });

    it('list child docs only with ListDocs', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      let list = null;

      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo',
        id: null,
      });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo/bar',
        id: null,
      });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo/boo',
        id: null,
      });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo/bar/baz',
        id: null,
      });
      list = await ds.dispatch({
        type: 'ListDocs',
        domain: 'test',
      });
      expect(list.docs).toEqual(['foo']);

      list = await ds.dispatch({
        type: 'ListDocs',
        domain: 'test',
        parentName: 'foo',
      });
      expect(list.docs).toEqual(['bar', 'boo']);

      list = await ds.dispatch({
        type: 'ListDocs',
        domain: 'test',
        parentName: 'foo/bar',
      });
      expect(list.docs).toEqual(['baz']);
      await ds.close();
    });
  });

  describe('basic data source setup', () => {
    it('gets status reports ready', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      const status = await ds.dispatch({
        type: 'GetStatus',
      });
      expect(typeof status.ready).toEqual('boolean');
      await justASec(ds); // necessary for cleanup to work for some reason. Postgres tests will time out if not for this..
      await ds.close();
    });
  });

  describe('doc storage', () => {
    it('puts doc fails when a referenced block is missing', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      await expect(
        ds.dispatch({
          type: 'PutDoc',
          domain: 'test',
          name: 'foo',
          id: 'wrong',
        }),
      ).rejects.toThrow();
      await ds.close();
    });

    it('put doc value works', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: { foo: 'bar' },
      });
      const doc = await ds.dispatch({
        type: 'GetDoc',
        domain: 'test',
        name: 'foo',
      });
      const gotBlk = await ds.dispatch({
        type: 'GetBlock',
        domain: 'test',
        name: 'foo',
        id: doc.id,
      });
      expect(gotBlk.value.foo).toEqual('bar');
      await ds.close();
    });

    it('put doc value correctly dereferences blocks', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: {
          foo: 'bar',
          baz: { type: 'BlockReference', value: { woah: 42 } },
        },
      });
      const docResult = await ds.dispatch({
        type: 'GetDocValue',
        domain: 'test',
        name: 'foo',
      });
      expect(docResult.value.foo).toBe('bar');
      expect(docResult.value.baz.type).toBe('BlockReference');
      expect(typeof docResult.value.baz.id).toBe('string');
      expect(docResult.value.baz.value).toBe(undefined);
      const bazBlock = await ds.dispatch({
        type: 'GetBlock',
        domain: 'test',
        name: 'foo',
        id: docResult.value.baz.id,
      });
      expect(bazBlock.value.woah).toEqual(42);
      await ds.close();
    });

    it('put doc works', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      const blk = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: { foo: 'bar' },
      });
      await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: null,
      });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo',
        id: blk.id,
      });
      const doc = await ds.dispatch({
        type: 'GetDoc',
        domain: 'test',
        name: 'foo',
      });
      expect(doc.id).toEqual(blk.id);

      const gotBlock = await ds.dispatch({
        type: 'GetBlock',
        domain: 'test',
        name: 'foo',
        id: doc.id,
      });
      expect(gotBlock.value.foo).toEqual('bar');
      await ds.close();
    });

    it('post doc works', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      const blk = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: { foo: 'bar' },
      });
      const postResult = await ds.dispatch({
        type: 'PostDoc',
        domain: 'test',
        name: 'foo',
        value: { foo: 'bar' },
      });
      expect(postResult.name).toMatch(/^foo\//);
      expect(postResult.id).toEqual(blk.id);

      const getResult = await ds.dispatch({
        type: 'GetDoc',
        domain: 'test',
        name: postResult.name,
      });
      expect(getResult.id).toEqual(blk.id);
      await ds.close();
    });

    it('get doc value works', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      const blk = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: { foo: 'bar' },
      });
      const doc = await ds.dispatch({
        type: 'GetDocValue',
        domain: 'test',
        name: 'foo',
      });
      expect(doc.value.foo).toEqual('bar');
      await ds.close();
    });
  });

  describe('observing docs', () => {
    it('observe doc works', async () => {
      const ds = await startTestDataSource({ domain: 'test' });
      // note: we run observeDoc before the doc exists to intentionally test that the subscription works on an empty doc
      const blk2 = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: { foo: 'baz' },
      });
      const obs = await ds.observeDoc('test', 'foo');
      await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test',
        name: 'foo',
        value: { foo: 'bar' },
      });
      let lastObserved = undefined;
      obs.subscribe({
        next: newVal => {
          lastObserved = newVal;
        },
      });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'foo',
        id: blk2.id,
      });
      await justASec(ds);
      expect(lastObserved.id).toEqual(blk2.id);
      await ds.close();
    });

    it('observe cleanup works', async () => {
      const ds = await startTestDataSource({ domain: 'test-d' });
      const blk1 = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test-d',
        name: 'foo',
        value: { foo: 'bar' },
      });
      const blk2 = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test-d',
        name: 'foo',
        value: { foo: 'baz' },
      });
      const obs = await ds.observeDoc('test-d', 'foo');
      let lastObserved = undefined;
      const subs = obs.subscribe({
        next: newVal => {
          lastObserved = newVal;
        },
      });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-d',
        name: 'foo',
        id: blk1.id,
      });
      await justASec(ds);
      expect(lastObserved.id).toEqual(blk1.id);
      subs.unsubscribe();
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-d',
        name: 'foo',
        id: blk2.id,
      });
      await justASec(ds);
      // expect(lastObserved.id).toEqual(blk1.id);
      await ds.close();
    });

    it('observe same doc multiple times', async () => {
      const ds = await startTestDataSource({ domain: 'test-obs' });
      const blk1 = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test-obs',
        name: 'foo',
        value: { foo: 'bar' },
      });
      const blk2 = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test-obs',
        name: 'foo',
        value: { foo: 'baz' },
      });
      const blk3 = await ds.dispatch({
        type: 'PutDocValue',
        domain: 'test-obs',
        name: 'foo',
        value: { foo: 42 },
      });
      const obs1 = await ds.observeDoc('test-obs', 'foo');
      const obs2 = await ds.observeDoc('test-obs', 'foo');
      let lastObserved1 = undefined;
      let lastObserved2 = undefined;

      const subs1 = obs1.subscribe({
        next: newVal => {
          lastObserved1 = newVal;
        },
      });
      const subs2 = obs2.subscribe({
        next: newVal => {
          lastObserved2 = newVal;
        },
      });

      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-obs',
        name: 'foo',
        id: blk1.id,
      });
      await justASec(ds);
      expect(lastObserved1.id).toEqual(blk1.id);
      expect(lastObserved2.id).toEqual(blk1.id);

      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-obs',
        name: 'foo',
        id: blk2.id,
      });
      await justASec(ds);
      expect(lastObserved1.id).toEqual(blk2.id);
      expect(lastObserved2.id).toEqual(blk2.id);

      subs1.unsubscribe();
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-obs',
        name: 'foo',
        id: blk3.id,
      });
      await justASec(ds);
      expect(lastObserved1.id).toEqual(blk2.id);
      expect(lastObserved2.id).toEqual(blk3.id);
      subs2.unsubscribe();
      await ds.close();
    });
  });

  describe('observing doc children', () => {
    it('children events subscription', async () => {
      const ds = await startTestDataSource({ domain: 'test-a' });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-a',
        name: 'foo',
        id: null,
      });
      const obs = await ds.observeDocChildren('test-a', 'foo');
      let lastObserved = undefined;
      obs.subscribe({
        next: newVal => {
          lastObserved = newVal;
        },
      });
      await justASec(ds);
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-a',
        name: 'foo/bar',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved.type).toEqual('AddChildDoc');
      expect(lastObserved.name).toEqual('bar');
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-a',
        name: 'foo/baz',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved.type).toEqual('AddChildDoc');
      expect(lastObserved.name).toEqual('baz');
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-a',
        name: 'foo/baz/boo',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved.type).toEqual('AddChildDoc');
      expect(lastObserved.name).toEqual('baz');
      await ds.dispatch({
        type: 'DestroyDoc',
        domain: 'test-a',
        name: 'foo/baz',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved.type).toEqual('DestroyChildDoc');
      expect(lastObserved.name).toEqual('baz');
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-a',
        name: 'foo/baz',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved.type).toEqual('AddChildDoc');
      expect(lastObserved.name).toEqual('baz');
      await ds.close();
    });

    it('observe root doc list works', async () => {
      const ds = await startTestDataSource({ domain: 'test-b' });
      const obs = await ds.observeDocChildren('test-b', null);
      let lastObserved = undefined;
      obs.subscribe({
        next: newVal => {
          lastObserved = newVal;
        },
      });
      await justASec(ds);
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-b',
        name: 'foo',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({ name: 'foo', type: 'AddChildDoc' });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-b',
        name: 'foo/bar',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({ name: 'foo', type: 'AddChildDoc' });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-b',
        name: 'baz',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({ name: 'baz', type: 'AddChildDoc' });
      await ds.close();
    });

    it('observe named doc list works', async () => {
      const ds = await startTestDataSource({ domain: 'test-c' });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-c',
        name: 'foo',
        id: null,
      });
      const obs = await ds.observeDocChildren('test-c', 'foo');
      let lastObserved = undefined;
      obs.subscribe({
        next: newVal => {
          lastObserved = newVal;
        },
      });
      await justASec(ds);
      expect(lastObserved).toEqual(undefined);
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-c',
        name: 'foo/bar',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({ name: 'bar', type: 'AddChildDoc' });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-c',
        name: 'foo/baz',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({ name: 'baz', type: 'AddChildDoc' });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-c',
        name: 'foo/baz/boo',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({ name: 'baz', type: 'AddChildDoc' });
      await ds.dispatch({
        type: 'DestroyDoc',
        domain: 'test-c',
        name: 'foo/baz',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({
        name: 'baz',
        type: 'DestroyChildDoc',
      });
      await ds.dispatch({
        type: 'PutDoc',
        domain: 'test-c',
        name: 'foo/baz',
        id: null,
      });
      await justASec(ds);
      expect(lastObserved).toMatchObject({ name: 'baz', type: 'AddChildDoc' });
      await ds.close();
    });
  });
}
