import { getIdOfValue } from '@aven/utils';

import {
  createProducerStream,
  streamOfValue,
  combineStreams,
} from '@aven/stream';

export default function createReducerStream(
  actionsDoc,
  reducerFn,
  initialState,
  reducerName,
  { snapshotsDoc } = { snapshotsDoc: null },
) {
  let phase = 'init';
  let headId = undefined;
  let walkBackId = null;
  let walkForwardBreadcrumbs = [];
  let rootId = undefined;
  let currentStepPromise = null;
  let isReducerExecuting = false;
  const idRefs = {};
  const valueMap = new WeakMap();
  const actionMap = new WeakMap();
  const primaryStream = combineStreams({
    sourceDoc: actionsDoc.idAndValue,
    snapshotValue: snapshotsDoc ? snapshotsDoc.value : streamOfValue(null),
  }).filter(s => {
    // this is used to ensure the .load call of a reducer stream will wait for both values to be loaded. By default, combineStreams will eagerly provide a value as soon as any stream is ready
    return s.sourceDoc !== undefined && s.snapshotValue !== undefined;
  });
  let notifier = null;
  function getId(id) {
    if (idRefs[id]) {
      return idRefs[id];
    }
    return (idRefs[id] = {});
  }
  function getLatestState() {
    if (headId === null) {
      return { id: null, value: undefined };
    }
    const idRef = getId(headId);
    const value = valueMap.get(idRef);
    if (phase === 'ready') {
      return value;
    }
    return {
      ...(value || {}),
      unloadedProgress: {
        phase,
      },
    };
  }
  function scheduleReducerStep() {
    isReducerExecuting = true;
    if (currentStepPromise) return;
    currentStepPromise = performReducerStep()
      .catch(e => {
        console.error('Bad Step: ', e);
      })
      .finally(() => {
        currentStepPromise = null;
        if (isReducerExecuting) {
          scheduleReducerStep();
        }
      });
  }
  function pauseReducerExecution() {
    isReducerExecuting = false;
  }
  async function performReducerStep() {
    if (!isReducerExecuting) {
      return;
    }
    if (headId != null && !valueMap.has(getId(headId))) {
      phase = 'research';
    } else if (headId === null) {
      rootId = null;
      phase = 'ready';
    }
    if (phase !== 'research') {
      pauseReducerExecution();
      return;
    }
    if (rootId === undefined) {
      // the rootId is not yet determined, so we walk back..
      const researchIdString = walkBackId || headId;
      const researchId = getId(researchIdString);
      if (valueMap.has(researchId)) {
        rootId = researchIdString;
      } else {
        let actionValue = actionMap.get(researchId);
        if (!actionValue) {
          const researchBlock = actionsDoc.getBlock(researchIdString);
          actionValue = await researchBlock.value.load();
          actionMap.set(researchId, actionValue);
        }
        if (researchIdString) {
          walkForwardBreadcrumbs.push(researchIdString);
        }
        if (actionValue === null || actionValue.on === null) {
          rootId = researchIdString;
        } else if (actionValue.on && actionValue.on.id) {
          walkBackId = actionValue.on.id;
        }
      }
    } else if (walkForwardBreadcrumbs.length === 0) {
      if (valueMap.has(getId(headId))) {
        phase = 'ready';
      } else {
        // we are effectively stuck/stumped. restart the process by clearing rootId and walkBackId
        rootId = undefined;
        walkBackId = undefined;
      }
    } else {
      // the rootId is known! We are now executing forward..
      const walkIdString = walkForwardBreadcrumbs.pop();
      const walkId = getId(walkIdString);
      const actionValue = actionMap.get(walkId);
      if (!valueMap.has(walkId)) {
        // if the value has already been calculated.. great!
        const prevState =
          actionValue && actionValue.on
            ? valueMap.get(getId(actionValue.on.id))
            : { value: initialState, context: { gen: 0 } };
        const newState = reducerFn(
          prevState.value,
          actionValue.value,
          walkIdString,
        );
        const newId = getIdOfValue(newState).id;
        valueMap.set(walkId, {
          value: newState,
          id: newId,
          context: {
            type: 'ReducedStream',
            reducerName,
            docName: actionsDoc.getName(),
            rootDocId: rootId,
            docId: walkIdString,
            gen: prevState.context.gen + 1,
          },
        });
      }
      if (walkIdString === headId) {
        phase = 'ready';
        walkBackId = null;
      }
    }
    notifier && notifier.next(getLatestState());
  }
  const listener = {
    next: ({ sourceDoc, snapshotValue }) => {
      if (sourceDoc.value && sourceDoc.id) {
        actionMap.set(getId(sourceDoc.id), sourceDoc.value);
      }
      if (
        snapshotValue &&
        snapshotValue.context &&
        snapshotValue.context.reducerName === reducerName
      ) {
        const { docId } = snapshotValue.context;
        const idRef = getId(docId);
        if (!valueMap.has(idRef)) {
          valueMap.set(idRef, snapshotValue);
        }
      }
      if (sourceDoc.id !== headId) {
        headId = sourceDoc.id;
        // rootId = null;
      }
      if (headId && phase === 'init') {
        phase = 'research';
      }
      if (headId && phase === 'research' && valueMap.has(getId(headId))) {
        phase = 'ready';
      }
      scheduleReducerStep();
      notifier && notifier.next(getLatestState());
    },
    error: err => {
      notifier && notifier.error(err); // todo, wrap err properly.
    },
  };
  return createProducerStream({
    crumb: `reduced:${reducerName}`,
    start: notify => {
      notify.next(getLatestState());
      notifier = notify;
      primaryStream.addListener(listener);
    },
    stop: () => {
      primaryStream.removeListener(listener);
      pauseReducerExecution();
    },
  }).dropRepeats((a, b) => a.id === b.id, 'DropRepeatedIds');
}
