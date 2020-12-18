import { APIUser } from "../api-utils/getVerifedUser";
import { database } from "./database";
import { SiteSchema } from "./SiteSchema";

export type SchemaEditResponse = { schema: SiteSchema };

export type SiteEvent = {
  SchemaEdit: SchemaEditResponse;
};

type SiteEventMeta = {
  userId?: number;
  nodeId?: number;
  address?: string[];
};

export type RecordedSiteEvent<SiteEventKey extends keyof SiteEvent> = {
  startTime: number;
  completeTime: number;
  siteName: string;
  eventName: SiteEventKey;
  meta: SiteEventMeta;
  payload: SiteEvent[SiteEventKey];
};

async function writeSiteEvent<SiteEventKey extends keyof SiteEvent>(
  siteName: string,
  eventName: SiteEventKey,
  meta: SiteEventMeta,
  payload: RecordedSiteEvent<SiteEventKey>,
) {
  // await database.siteEvent
}

async function writeSiteEventWithRetries<SiteEventKey extends keyof SiteEvent>(
  siteName: string,
  eventName: SiteEventKey,
  meta: SiteEventMeta,
  payload: RecordedSiteEvent<SiteEventKey>,
  retries = 3,
) {
  try {
    await writeSiteEvent(siteName, eventName, meta, payload);
  } catch (e) {
    if (retries <= 0) throw e;
    await writeSiteEventWithRetries(siteName, eventName, meta, payload, retries - 1);
  }
}

function saveSiteEvent<SiteEventKey extends keyof SiteEvent>(
  siteName: string,
  eventName: SiteEventKey,
  meta: SiteEventMeta,
  payload: RecordedSiteEvent<SiteEventKey>,
) {
  writeSiteEventWithRetries(siteName, eventName, meta, payload, 3)
    .then(() => {
      // event is saved, nothing to do here really.
    })
    .catch((e) => {
      console.error(
        "=== ERROR Saving Site Event ===: " +
          JSON.stringify({
            siteName,
            eventName,
            meta,
            payload,
          }),
      );
    });
}

export async function startSiteEvent<SiteEventKey extends keyof SiteEvent>(
  eventName: keyof SiteEvent,
  {
    siteName,
    user,
    apiToken,
    address,
  }: {
    siteName: string;
    user?: APIUser;
    apiToken?: string;
    address?: string[];
  },
): Promise<[(result: SiteEvent[SiteEventKey]) => void, (e: any) => void]> {
  type SE = SiteEvent[SiteEventKey];
  const startTime = Date.now();
  // check permission
  console.log("TODO: Check Permission,..", siteName, user, apiToken, address, eventName);

  // throw if bad permission.
  function resolve(eventResult: SE): void {
    saveSiteEvent(
      siteName,
      eventName,
      {},
      {
        eventName,
        meta: {},
        startTime,
        completeTime: Date.now(),
        siteName,
        payload: eventResult,
      },
    );
  }
  function reject(error: any): void {
    console.log("action failed!", error);
  }
  return [resolve, reject];
}
