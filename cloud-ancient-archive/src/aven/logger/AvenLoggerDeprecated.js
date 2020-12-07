function createLogger(source, domain, logName) {
  let queue = [];
  let slowTimeout = null;
  let fastTimeout = null;

  function writeLogs() {
    clearTimeout(slowTimeout);
    clearTimeout(fastTimeout);
    if (!queue.length) {
      return;
    }
    const queueSnapshot = queue;
    queue = [];
    source
      .dispatch({
        type: 'PutTransactionValue',
        domain,
        name: logName,
        value: {
          type: 'Logs',
          logs: queueSnapshot,
        },
      })
      .then(() => {
        if (queue.length) {
          enqueueWrite();
        }
      })
      .catch(e => {
        queue = [...queueSnapshot, ...queue];
      });
  }

  function enqueueWrite() {
    if (queue.length > 50) {
      writeLogs();
    } else {
      clearTimeout(fastTimeout);
      slowTimeout = setTimeout(writeLogs, 400);
      fastTimeout = setTimeout(writeLogs, 32);
    }
  }

  function log(message, type, details) {
    queue = [
      ...queue,
      { message, type, details, level: 'log', time: Date.now() },
    ];
    enqueueWrite();
  }
  function warn(message, type, details) {
    queue = [
      ...queue,
      { message, type, details, level: 'warn', time: Date.now() },
    ];
    enqueueWrite();
  }
  function error(message, type, details) {
    queue = [
      ...queue,
      { message, type, details, level: 'error', time: Date.now() },
    ];
    enqueueWrite();
  }

  return {
    log,
    warn,
    error,
  };
}
