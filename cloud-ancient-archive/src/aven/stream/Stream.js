import Err from '../utils/Err';

export function streamOf(initialValue, crumb) {
  const subscribers = new Set();
  let lastValue = initialValue;

  function addListener(sub) {
    sub.next(lastValue);
    subscribers.add(sub);
  }

  function removeListener(sub) {
    subscribers.delete(sub);
  }

  function updateStream(value) {
    lastValue = value;
    subscribers.forEach(subs => subs.next(value));
  }

  const stream = {
    type: 'ValueStream',
    crumb,
    addListener,
    removeListener,
    get: () => lastValue,
    compose: composeFn => composeFn(stream),
    map: (mapper, mapDescriptor) => mapStream(stream, mapper, mapDescriptor),
    filter: (filterFn, filterDescriptor) =>
      filterStream(stream, filterFn, filterDescriptor),
    dropRepeats: (repeatComparator, dropRepeatsDescriptor) =>
      dropRepeatsStream(stream, repeatComparator, dropRepeatsDescriptor),
    flatten: () => flattenStream(stream),
    cacheFirst: () => cacheFirstStream(stream),
    spy: spier => spyStream(stream, spier),
  };
  return [stream, updateStream];
}

export function streamNever(crumb) {
  function addListener() {}
  function removeListener() {}

  const stream = {
    type: 'NeverStream',
    crumb,
    addListener,
    removeListener,
    get: () => undefined,
    compose: composeFn => composeFn(stream),
    map: (mapper, mapDescriptor) => mapStream(stream, mapper, mapDescriptor),
    filter: (filterFn, filterDescriptor) =>
      filterStream(stream, filterFn, filterDescriptor),
    dropRepeats: (repeatComparator, dropRepeatsDescriptor) =>
      dropRepeatsStream(stream, repeatComparator, dropRepeatsDescriptor),
    flatten: () => flattenStream(stream),
    cacheFirst: () => cacheFirstStream(stream),
    spy: spier => spyStream(stream, spier),
  };
  return stream;
}

export function streamOfValue(staticValue, crumb) {
  const [stream] = streamOf(staticValue, crumb);
  return stream;
}

export function combineStreamEntries(inputEntries, initialValue = {}) {
  const stoppers = new Set();
  const lastValues = initialValue;
  const entries = Object.fromEntries(
    inputEntries.map(([key, inputStream]) => {
      return [key, inputStream && inputStream.crumb];
    }),
  );

  return createProducerStream({
    crumb: {
      type: 'CombinedStream',
      entries,
    },
    start: notifier => {
      let scheduledUpdate = null;
      function scheduleNotifyValues() {
        clearTimeout(scheduledUpdate);
        scheduledUpdate = setTimeout(() => {
          notifier.next(lastValues);
        }, 1);
      }
      inputEntries.forEach(([inputKey, inputStream]) => {
        if (!inputStream) return;
        const listener = {
          next: v => {
            if (lastValues[inputKey] === v) {
              return;
            }
            lastValues[inputKey] = v;
            scheduleNotifyValues();
          },
          complete: () => {},
          error: e => {
            // todo.. one error should stop all other combined streams.. correct? otherwise the combined stream may fire again when a non-error input stream has a next
            console.error('Error within combined stream', inputStream.crumb);
            notifier.error(e); // todo, pass crumb and inputStream.crumb into error
          },
        };
        inputStream.addListener(listener);
        stoppers.add(() => {
          inputStream.removeListener(listener);
        });
      });
    },
    stop: () => {
      stoppers.forEach(stop => stop());
      stoppers.clear();
    },
  });
}
export function combineStreamArray(inputs) {
  return combineStreamEntries(
    inputs.map((stream, index) => [index, stream]),
    [],
  );
}
export function combineStreams(inputs) {
  if (Array.isArray(inputs)) {
    return combineStreamArray(inputs);
  }
  return combineStreamEntries(Object.entries(inputs));
}

export function combineLoadedStreams(inputs) {
  const inputEntries = Object.entries(inputs);
  const stoppers = new Set();
  const lastValues = {};
  const entries = Object.fromEntries(
    inputEntries.map(([key, inputStream]) => {
      return [key, inputStream && inputStream.crumb];
    }),
  );
  const waitingForValues = new Set(Object.keys(inputs));
  return createProducerStream({
    crumb: {
      type: 'CombinedStream',
      entries,
    },
    start: notifier => {
      let scheduledUpdate = null;
      function scheduleNotifyValues() {
        clearTimeout(scheduledUpdate);
        scheduledUpdate = setTimeout(() => {
          if (waitingForValues.size === 0) {
            notifier.next(lastValues);
          }
        }, 1);
      }
      inputEntries.forEach(([inputName, inputStream]) => {
        if (!inputStream) return;
        const listener = {
          next: v => {
            if (v !== undefined && !v.unloadedProgress) {
              waitingForValues.delete(inputName);
            }
            if (lastValues[inputName] === v) {
              return;
            }
            lastValues[inputName] = v;
            scheduleNotifyValues();
          },
          complete: () => {},
          error: e => {
            // todo.. one error should stop all other combined streams.. correct? otherwise the combined stream may fire again when a non-error input stream has a next
            console.error('Error within combined stream', inputStream.crumb);
            notifier.error(e); // todo, pass crumb and inputStream.crumb into error
          },
        };
        inputStream.addListener(listener);
        stoppers.add(() => {
          inputStream.removeListener(listener);
        });
      });
    },
    stop: () => {
      stoppers.forEach(stop => stop());
      stoppers.clear();
    },
  });
}

function filterStream(stream, filterFn, filterDescriptor) {
  let listener = null;
  return createProducerStream({
    crumb: {
      type: 'FilteredStream',
      desc: filterDescriptor,
      on: stream.crumb,
    },
    start: notifier => {
      if (!listener) {
        listener = {
          next: val => {
            if (filterFn(val)) {
              notifier.next(val);
            }
          },
          complete: () => notifier.complete(),
          error: err => notifier.error(err),
        };
        stream.addListener(listener);
      }
    },
    stop: () => {
      if (listener) {
        stream.removeListener(listener);
        listener = null;
      }
    },
    getDetachedValue: () => {
      const gotten = stream.get();
      if (filterFn(gotten)) return gotten;
      return undefined;
    },
  });
}

function cacheFirstStream(stream) {
  let listener = null;
  let value = undefined;
  return createProducerStream({
    crumb: {
      type: 'CacheFirstStream',
      on: stream.crumb,
    },
    start: notifier => {
      if (value !== undefined) {
        notifier.next(value);
        notifier.complete();
        return;
      }
      if (!listener) {
        listener = {
          next: val => {
            notifier.next(val);
            if (val !== undefined) {
              value = val;
              notifier.complete();
              stream.removeListener(listener);
              listener = null;
            }
          },
          complete: () => notifier.complete(),
          error: err => notifier.error(err),
        };
        stream.addListener(listener);
      }
    },
    stop: () => {
      if (listener) {
        stream.removeListener(listener);
        listener = null;
      }
    },
  });
}

const defaultComparator = (a, b) => a === b;

function dropRepeatsStream(
  stream,
  isRepeatingValue = defaultComparator,
  dropRepeatsDescriptor,
) {
  let lastEmitted = undefined;
  let hasEmitted = undefined;
  let listener = null;
  return createProducerStream({
    crumb: {
      type: 'DropRepeatedStream',
      on: stream.crumb,
      desc: dropRepeatsDescriptor,
    },
    start: notifier => {
      if (!listener) {
        listener = {
          next: val => {
            if (!hasEmitted || !isRepeatingValue(lastEmitted, val)) {
              notifier.next(val);
              lastEmitted = val;
              hasEmitted = true;
            }
          },
          complete: () => notifier.complete(),
          error: err => notifier.error(err),
        };
        stream.addListener(listener);
      }
    },
    stop: () => {
      if (listener) {
        lastEmitted = undefined;
        hasEmitted = false;
        stream.removeListener(listener);
        listener = null;
      }
    },
  });
}

function flattenStream(stream) {
  let listener = null;
  let cleanupLastListener = null;
  return createProducerStream({
    crumb: {
      type: 'FlattenedStream',
      on: stream.crumb,
    },
    start: notifier => {
      if (!listener) {
        listener = {
          next: downStream => {
            cleanupLastListener && cleanupLastListener();
            const downStreamListener = {
              next: val => {
                notifier.next(val);
              },
              error: err => {
                notifier.error(err);
              },
              complete: () => {},
            };
            downStream.addListener(downStreamListener);
            cleanupLastListener = () => {
              downStream.removeListener(downStreamListener);
            };
          },
          complete: () => {
            cleanupLastListener && cleanupLastListener();
            notifier.complete();
          },
          error: err => {
            cleanupLastListener && cleanupLastListener();
            notifier.error(err);
          },
        };
        stream.addListener(listener);
      }
    },
    stop: () => {
      if (listener) {
        stream.removeListener(listener);
        cleanupLastListener && cleanupLastListener();
        listener = null;
      }
    },
  });
}

function spyStream(stream, spier) {
  const reportHandler =
    typeof spier === 'function'
      ? spier
      : report => {
          if (spier) {
            console.log(spier, stream.crumb, report);
          } else {
            console.log(stream.crumb, report);
          }
        };
  let listener = null;
  return createProducerStream({
    crumb: { type: 'SpiedStream', on: stream.crumb },
    start: notifier => {
      if (!listener) {
        listener = {
          next: val => {
            reportHandler({ next: val });
            notifier.next(val);
          },
          complete: () => {
            reportHandler({ complete: true });
            notifier.complete();
          },
          error: err => {
            reportHandler({ error: err });
            notifier.error(err);
          },
        };
        stream.addListener(listener);
      }
    },
    stop: () => {
      if (listener) {
        stream.removeListener(listener);
        listener = null;
      }
    },
  });
}

export function intervalStream(timeMs = 1000, outputSpec = t => t) {
  let intervalId = null;
  return createProducerStream({
    start(notifier) {
      setInterval(() => {
        if (typeof outputSpec === 'function') {
          notifier.next(outputSpec(Date.now()));
        } else {
          notifier.next(outputSpec);
        }
      }, timeMs);
    },
    stop() {
      clearInterval(intervalId);
    },
    crumb: `interval-${timeMs}`,
  });
}

function mapStream(stream, mapper, mapDescriptor) {
  let listener = null;
  return createProducerStream({
    crumb: { type: 'MappedStream', on: stream.crumb, mapDescriptor },
    start: notifier => {
      if (!listener) {
        listener = {
          next: val => notifier.next(mapper(val)),
          complete: () => notifier.complete(),
          error: err => notifier.error(err),
        };
        stream.addListener(listener);
      }
    },
    stop: () => {
      if (listener) {
        stream.removeListener(listener);
        listener = null;
      }
    },
    getDetachedValue: () => {
      return mapper(stream.get());
    },
  });
}

function loadStream(stream) {
  return new Promise((resolve, reject) => {
    let loadTimeout = setTimeout(() => {
      wrapUp();
      reject(new Error(`Timed out loading "${JSON.stringify(stream.crumb)}".`));
    }, 300000);

    let loadListener = null;

    function wrapUp() {
      clearTimeout(loadTimeout);
      if (loadListener) {
        stream.removeListener(loadListener);
        loadListener = null;
      }
    }
    loadListener = {
      next: value => {
        if (value && value.unloadedProgress) {
          return;
        }
        resolve(value);
        wrapUp();
      },
      error: e => {
        reject(e);
        wrapUp();
      },
      complete: () => {
        // should be covereed by next and erorr?
      },
    };
    stream.addListener(loadListener);
  });
}

function augmentStream(stream) {
  stream.compose = composeFn => composeFn(stream);
  stream.map = (mapper, mapDescriptor) =>
    mapStream(stream, mapper, mapDescriptor);
  stream.filter = (filterFn, filterDescriptor) =>
    filterStream(stream, filterFn, filterDescriptor);
  stream.dropRepeats = (repeatComparator, dropRepeatsDescriptor) =>
    dropRepeatsStream(stream, repeatComparator, dropRepeatsDescriptor);
  stream.flatten = () => flattenStream(stream);
  stream.cacheFirst = () => cacheFirstStream(stream);
  stream.spy = spier => spyStream(stream, spier);
  stream.load = () => loadStream(stream);
}

// just like createProducerStream, except it does not cache the last value and producer.get is called for sync gets
export function createEventStream(producer) {
  const subscribers = new Set();
  let isListening = false;
  const crumb = producer.crumb;

  function addListener(sub) {
    subscribers.add(sub);
    if (!isListening) {
      isListening = true;
      producer.start({
        next: value => {
          subscribers.forEach(subscriber => {
            subscriber.next && subscriber.next(value);
          });
        },
        complete: () => {
          isListening = false;
        },
        error: err => {
          subscribers.forEach(subscriber => {
            const error = new Err(err.message, 'StreamError', {
              error: err.toJSON(),
              crumb,
            });
            subscriber.error && subscriber.error(error);
          });
          subscribers.clear();
          isListening = false;
        },
      });
    }
  }

  let removeListenerTimeout = null;
  function removeListener(sub) {
    subscribers.delete(sub);
    clearTimeout(removeListenerTimeout);
    removeListenerTimeout = setTimeout(() => {
      if (subscribers.size === 0 && isListening) {
        isListening = false;
        producer.stop();
      }
    }, 1);
  }

  const stream = {
    type: 'Stream',
    crumb,
    addListener,
    removeListener,
    get: producer.get,
  };
  augmentStream(stream);
  return stream;
}

export function createProducerStream(producer) {
  const subscribers = new Set();
  let isListening = false;
  let hasEmitted = false;
  let lastValue = undefined;
  const crumb = producer.crumb;
  function addListener(sub) {
    if (hasEmitted) sub.next(lastValue);
    subscribers.add(sub);
    if (!isListening && !hasEmitted) {
      isListening = true;
      producer.start({
        next: value => {
          lastValue = value;
          hasEmitted = true;
          subscribers.forEach(subscriber => {
            subscriber.next && subscriber.next(value);
          });
        },
        complete: () => {
          isListening = false;
        },
        error: err => {
          if (subscribers.size > 0) {
            subscribers.forEach(subscriber => {
              const error = new Err(err.message, 'StreamError', {
                error: err.toJSON ? err.toJSON() : err,
                crumb,
              });
              subscriber.error && subscriber.error(error);
            });
            subscribers.clear();
          }
          isListening = false;
          hasEmitted = false;
        },
      });
    }
  }

  let removeListenerTimeout = null;
  function removeListener(sub) {
    subscribers.delete(sub);
    clearTimeout(removeListenerTimeout);
    removeListenerTimeout = setTimeout(() => {
      if (subscribers.size === 0 && isListening) {
        hasEmitted = false;
        if (isListening) {
          isListening = false;
          producer.stop();
        }
      }
    }, 1);
  }

  const stream = {
    type: 'MemoryStream',
    crumb,
    addListener,
    removeListener,
    get: () => {
      if (lastValue !== undefined) return lastValue;
      if (!isListening && producer.getDetachedValue)
        return producer.getDetachedValue();
      return undefined;
    },
  };
  augmentStream(stream);
  return stream;
}
