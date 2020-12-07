import { createDocSet, createReducerStream } from '../Kite';
import createMemoryStorageSource from '../createMemoryStorageSource';

async function justASec(duration) {
  return new Promise(resolve => setTimeout(resolve, duration || 1));
}

const dummySource = {
  dispatch: async () => null,
};

describe('kite reducer', () => {
  it('handles reducer stream', async () => {
    const m = createMemoryStorageSource({ domain: 'test' });

    const docSet = createDocSet({
      source: m,
      onGetName: () => null,
      domain: 'test',
    });
    const foo = docSet.get('foo');
    const initialState = {
      items: [],
    };
    function reducerFn(state, action) {
      if (action.add) {
        return {
          items: [...state.items, action.add],
        };
      } else if (action.remove) {
        return {
          items: state.items.filter(i => i !== action.remove),
        };
      }
      return state;
    }

    const fooReducedStream = createReducerStream(foo, reducerFn, initialState);
    let lastObserved = null;
    const listener = {
      next: v => {
        lastObserved = v;
      },
    };
    fooReducedStream.addListener(listener);
    expect(lastObserved.value).toBe(undefined);
    await foo.putTransactionValue({ add: 'a' });
    expect(lastObserved.value).toMatchObject({ items: ['a'] });
    await foo.putTransactionValue({ add: 'b' });
    expect(lastObserved.value).toMatchObject({ items: ['a', 'b'] });
  });

  it('reducer stream informs late subscribers', async () => {
    const m = createMemoryStorageSource({ domain: 'test' });

    const docSet = createDocSet({
      source: m,
      onGetName: () => null,
      domain: 'test',
    });
    const foo = docSet.get('foo');
    const initialState = {
      items: [],
    };
    function reducerFn(state, action) {
      if (action.add) {
        return {
          items: [...state.items, action.add],
        };
      } else if (action.remove) {
        return {
          items: state.items.filter(i => i !== action.remove),
        };
      }
      return state;
    }

    const fooReducedStream = createReducerStream(foo, reducerFn, initialState);
    let lastObserved = null;
    const listener = {
      next: v => {
        lastObserved = v;
      },
    };
    fooReducedStream.addListener(listener);
    expect(lastObserved.value).toBe(undefined);
    await foo.putTransactionValue({ add: 'a' });
    expect(lastObserved.value).toMatchObject({ items: ['a'] });
    let lastObservedTwice = null;
    const listener2 = {
      next: v => {
        lastObservedTwice = v;
      },
    };
    fooReducedStream.addListener(listener2);
    expect(lastObservedTwice.value).toMatchObject({ items: ['a'] });
  });

  it('does not call reducer excessively', async () => {
    const m = createMemoryStorageSource({ domain: 'test' });

    const docSet = createDocSet({
      source: m,
      onGetName: () => null,
      domain: 'test',
    });
    const foo = docSet.get('foo');
    const initialState = {
      items: [],
    };
    let reducerRunCount = 0;
    function reducerFn(state, action) {
      reducerRunCount += 1;
      if (action.add) {
        return {
          items: [...state.items, action.add],
        };
      } else if (action.remove) {
        return {
          items: state.items.filter(i => i !== action.remove),
        };
      }
      return state;
    }

    const fooReducedStream = createReducerStream(foo, reducerFn, initialState);
    let lastObserved = null;
    const listener = {
      next: v => {
        lastObserved = v;
      },
    };
    fooReducedStream.addListener(listener);
    expect(lastObserved.value).toBe(undefined);
    await foo.putTransactionValue({ add: 'a' });
    expect(lastObserved.value).toMatchObject({ items: ['a'] });
    expect(reducerRunCount).toEqual(1);
    await foo.putTransactionValue({ add: 'b' });
    expect(lastObserved.value).toMatchObject({ items: ['a', 'b'] });
    expect(reducerRunCount).toEqual(2);
  });

  it('handles reducer stream override docs', async () => {
    const m = createMemoryStorageSource({ domain: 'test' });
    const docSet = createDocSet({
      source: m,
      onGetName: () => null,
      domain: 'test',
    });
    const foo = docSet.get('foo');
    const initialState = {
      items: [],
    };
    function reducerFn(state, action) {
      if (action.add) {
        return {
          items: [...state.items, action.add],
        };
      } else if (action.remove) {
        return {
          items: state.items.filter(i => i !== action.remove),
        };
      }
      return state;
    }
    const streamReduced = createReducerStream(foo, reducerFn, initialState);
    const fooReduced = docSet.setOverrideStream('fooReduced', streamReduced);
    const loaded = await fooReduced.idAndValue.load();
    expect(loaded.value).toBe(undefined);
    await foo.putTransactionValue({ add: 'a' });
    const loaded2 = await fooReduced.idAndValue.load();
    expect(loaded2.value).toMatchObject({ items: ['a'] });
    let lastObserved = null;
    const listener = {
      next: v => {
        lastObserved = v;
      },
    };
    fooReduced.idAndValue.addListener(listener);
    await justASec();
    expect(lastObserved.value).toMatchObject({ items: ['a'] });
    await foo.putTransactionValue({ add: 'b' });
    const loaded3 = await fooReduced.idAndValue.load();
    // expect(loaded3.value).toMatchObject({ items: ['a', 'b'] });
    // await justASec();
    // expect(lastObserved.value).toMatchObject({ items: ['a', 'b'] });
  });
});
