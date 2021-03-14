import { PerformanceObserver, performance, PerformanceObserverEntryList } from "perf_hooks";

const DISABLE_PERFORMANCE_LOGGING = !!process.env.DISABLE_PERFORMANCE_LOGGING;

export interface Observer {
  markAndMeasure: (tag: string) => void;
  end: () => void;
}

let obsCount = 0;

export function observe(name: string): Observer {
  if (DISABLE_PERFORMANCE_LOGGING) {
    return { markAndMeasure: () => undefined, end: () => undefined };
  }
  const observerId = obsCount++;
  let lastTag = "start";
  let lastTime: number;
  const messages: string[] = [];
  const obs = new PerformanceObserver((items: PerformanceObserverEntryList) => {
    const entry = items.getEntries()[0];
    if (lastTime) {
      const timeDelta = entry.duration - lastTime;
      messages.push(`${entry.name} : ${timeDelta.toFixed(1)} ms`);
    }
    lastTime = entry.duration;
    performance.clearMarks();
  });
  obs.observe({ entryTypes: ["measure"] });

  markAndMeasure("start");

  function markAndMeasure(tag: string) {
    performance.mark(tag);
    performance.measure(`${lastTag} to ${tag}`, lastTag, tag);
    lastTag = tag;
  }
  function end() {
    obs.disconnect();
    console.log(`${name}#${observerId}\n  ${messages.join("\n  ")}`);
  }

  return {
    markAndMeasure,
    end,
  };
}
