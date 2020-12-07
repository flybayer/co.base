let maxRefCount = 25; // default value

export function getMaxBlockRefCount() {
  return maxRefCount;
}

export function setMaxBlockRefCount(count) {
  maxRefCount = count;
}
