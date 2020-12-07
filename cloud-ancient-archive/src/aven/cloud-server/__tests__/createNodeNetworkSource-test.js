import createMemoryStorageSource from '../../cloud-core/createMemoryStorageSource';
import sourceTests from '../../cloud-core/__tests__/sourceTests';
import createNodeNetworkSource from '../createNodeNetworkSource';
import attachSourceServer from '../attachSourceServer';

beforeAll(async () => {});

let portOffset = 0;

jest.setTimeout(10000);

async function startTestDataSource(options = {}) {
  const ds = createMemoryStorageSource({ domain: 'test', ...options });
  portOffset += 1;
  let port = 9900 + portOffset;
  const server = await attachSourceServer({
    source: ds,
    listenLocation: port,
    quiet: true,
  });
  const clientDs = createNodeNetworkSource({
    useSSL: false,
    authority: `localhost:${port}`,
    quiet: true,
  });
  return {
    ...clientDs,
    testPatienceMS: 1200,
    close: () => {
      clientDs.close();
      server.close();
      ds.close();
    },
  };
}

// skipping because they pass locally (after about 30 sec!), but they time out on CircleCI
describe.skip('memory data source tests through network', () => {
  sourceTests(startTestDataSource);
});
