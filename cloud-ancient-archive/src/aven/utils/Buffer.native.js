/* eslint-disable no-undef */

// Avoid the lint warning and pretend Buffer is not a global

global.Buffer = global.Buffer || require('buffer').Buffer

const BufferModule = global.Buffer
// RN supports buffer properly
export default BufferModule;
