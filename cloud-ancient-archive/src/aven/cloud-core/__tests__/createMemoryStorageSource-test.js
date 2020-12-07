import createMemoryStorageSource from '../createMemoryStorageSource';
import sourceTests from './sourceTests';

beforeAll(async () => {});

async function startTestDataSource(options = {}) {
  const ds = createMemoryStorageSource({ domain: 'test', ...options });
  return ds;
}

describe('memory data source tests', () => {
  sourceTests(startTestDataSource);
});

describe('basic data source setup', () => {
  it('throws when starting without a domain', () => {
    expect(() => {
      createMemoryStorageSource({});
    }).toThrow();
  });
});
