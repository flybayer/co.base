import { hostname } from "os"
import db from "../../db"
import { HostEvents, HostEventType, RecordedHostEvent } from "./EventTypes"

export const SERVER_HOST = hostname()

let events: RecordedHostEvent<any>[] = []

const savePromises = new Set<Promise<void>>()

async function asyncSaveEvents(
  events: RecordedHostEvent<any>[],
  hostBatchWriteId: number
): Promise<void> {
  await db.hostEvent.create({
    data: { host: SERVER_HOST, events: { hostBatchWriteId, events } },
  })
}

let hostBatchWriteIdCount = 0

function saveEvents(): void {
  const eventsToSave = events
  events = []
  const hostBatchWriteId = hostBatchWriteIdCount++

  function performSave(onRetry?: () => void): void {
    const savePromise = asyncSaveEvents(eventsToSave, hostBatchWriteId)
    savePromises.add(savePromise)
    savePromise
      .then(() => {
        console.log(`Saved ${eventsToSave.length} events.`)
      })
      .catch((e) => {
        if (onRetry) {
          console.error("Failed to save events! Retrying in 10sec.")
          console.error(e)
          setTimeout(() => {
            onRetry()
          }, 10_000)
        } else {
          console.error("Failed to save events!")
          console.error(e)
          console.log(
            `=== ERROR Saving Host Events (${hostBatchWriteId}) ===: ` +
              JSON.stringify(eventsToSave)
          )
        }
      })
      .finally(() => {
        savePromises.delete(savePromise)
      })
  }
  performSave(performSave)
}

let slowestWriteTimeout: NodeJS.Timer | null = null

function markEventWrite() {
  if (slowestWriteTimeout) {
    clearTimeout(slowestWriteTimeout)
  }
  if (events.length >= 100) {
    saveEvents()
    return
  }
  slowestWriteTimeout = setTimeout(() => {
    saveEvents()
  }, 30_000)
}

export function writeEvent<EvtTypeName extends HostEventType>(
  type: EvtTypeName,
  event: HostEvents[EvtTypeName]
): void {
  events.push({
    type,
    event,
    time: Date.now(),
  })
  markEventWrite()
}

export async function flushEvents(): Promise<void> {
  saveEvents()
  await Promise.all(savePromises)
}
