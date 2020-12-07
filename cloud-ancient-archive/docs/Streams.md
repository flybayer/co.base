# Streams

In cloud-core, there is a built-in stream library.

The source code is in `src/aven/stream/Stream.js`

```js
import {
  createProducerStream,
  createEventStream,
  intervalStream,
  combineLoadedStreams,
  combineStreams,
  combineStreamArray,
  streamOfValue,
  streamOf,
  streamNever,
} from '@aven/stream';
```

## Creating a stream

### state streams - streamOfValue, streamOf, streamNever

### producer stream

## Stream Features

stream.addListener
stream.removeListener
stream.crumb
stream.type??. why this AND stream.crumb?

stream.map
stream.filter
stream.flatten
stream.get
stream.load
stream.compose
stream.spy
stream.cacheFirst
stream.dropRepeats
