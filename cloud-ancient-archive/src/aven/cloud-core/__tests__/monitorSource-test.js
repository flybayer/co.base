import createMemoryStorageSource from '../createMemoryStorageSource';
import monitorSource from '../monitorSource';

describe('monitored source', () => {
  it('monitors dispatch', async () => {
    const events = [];

    const logger = {
      log(eventName, details) {
        events.push({ eventName, details });
      },
    };

    const source = createMemoryStorageSource({ domain: 'test' });

    const loggedSource = monitorSource(source, logger);

    await loggedSource.dispatch({
      type: 'GetStatus',
    });

    expect(events.length).toEqual(2);
  });
});
