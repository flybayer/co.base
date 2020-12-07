const _values = {};

function markTransitionComplete(key) {
  const marker = _values[key];
  if (marker) {
    marker.end = Date.now();
    marker.duration = marker.end - marker.start;
    // alert(JSON.stringify(marker));
  }
}
function markTransitionStart(key) {
  _values[key] = {
    key,
    start: Date.now(),
  };
}

const PerformanceDebugging = {
  markTransitionComplete,
  markTransitionStart,
};

export default PerformanceDebugging;
