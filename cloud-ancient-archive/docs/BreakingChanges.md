# Breaking Changes

Refer here to see what breaking changes are made in the Aven framework.

## useValue has been renamed to useStream

## 2020 3 26 - Changes to attachWebServer

https://github.com/AvenCloud/Aven/commit/68de5c0cde321b522340018f3364617494897ab5#diff-3bf51e7b013ec596f7032ba794633dee

## 2020 3 30 - Rename to createEmailAuthProvider

`import { EmailAuthProvider } from '@aven/cloud-auth-email`

has been moved to:

`import { createEmailAuthProvider } from '@aven/cloud-auth-email`

## 2020 3 30 - Rename to createSMSAuthProvider

`import { SMSAuthProvider } from '@aven/cloud-auth-sms`

has been moved to:

`import { createSMSAuthProvider } from '@aven/cloud-auth-sms`

## 2020 3 30 - Move stream utilities to @aven/stream

Previously the stream library was a part of `@aven/core`..

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

They have been moved to:

`import * from '@aven/stream`

## 2020 3 30 - useObervable has been removed

This hook was used with rxjs in the past, which has since been removed from the framework. The best alternative is probably [rxjs-hooks](https://github.com/LeetCode-OpenSource/rxjs-hooks).

## 2020 3 31 - Renaming cloud clients, moving React utils to @aven/cloud

`import { createSessionClient } from '@aven/cloud-core';`
Has been moved to:
`import { createCloud } from '@aven/cloud';`

`import { createLocalSessionClient } from '@aven/cloud-core';`
Has been moved to:
`import { createPersistedCloud } from '@aven/cloud';`

The following modules would previously be imported from `@aven/cloud-core`, and they are now under `@aven/cloud`:

```js
import {
  useCloud,
  useCloudClient,
  useCloudState,
  useCloudValue,
  useStream
  CloudContext,
  HostContext,
  HostContextContainer,
} from '@aven/cloud';
```
