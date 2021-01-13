import { databaseUrl } from "./config";

import pg from "pg";

const pgClient = new pg.Client({
  connectionString: databaseUrl,
});

const channelSubscriptions = new Map<string, Map<number, (value: any) => void>>();

function handleNotification(channel: string, payload: any) {
  channelSubscriptions.get(channel)?.forEach((handler) => {
    handler(payload);
  });
}

async function listen(channelName: string) {
  await pgClient.query(`LISTEN "${channelName}";`, []);
}
async function unlisten(channelName: string) {
  await pgClient.query(`UNLISTEN "${channelName}";`, []);
}

export function subscribeNotifications<V>(channelName: string, handlerId: number, handler: (value: V) => void): void {
  const wasSubscribed = channelSubscriptions.size > 0;
  let channelSubs = channelSubscriptions.get(channelName);
  if (!channelSubs) {
    channelSubs = new Map();
    channelSubscriptions.set(channelName, channelSubs);
  }
  channelSubs.set(handlerId, handler);
  if (!wasSubscribed) {
    listen(channelName).catch((e) => {
      console.error("Error listening to channel!");
      console.error(e);
    });
  }
}

export function unsubscribeNotifications<V>(channelName: string, handlerId: number): void {
  let channelSubs = channelSubscriptions.get(channelName);
  if (!channelSubs) {
    channelSubs = new Map();
    channelSubscriptions.set(channelName, channelSubs);
  }
  channelSubs.delete(handlerId);
  if (channelSubs.size === 0) {
    unlisten(channelName).catch((e) => {
      console.error("Error unlistening to channel!");
      console.error(e);
    });
  }
}

export async function connectClient(): Promise<void> {
  await pgClient.connect();
}

export async function dataNotify(channelName: string, payload: any): Promise<void> {
  await connectClient();
  await pgClient.query(`NOTIFY "${channelName}", '${Buffer.from(JSON.stringify(payload)).toString("base64")}';`, []);
}

export async function connectNotifications(): Promise<void> {
  pgClient.connect();
  pgClient.on("notification", (msg) => {
    const payload = msg.payload && JSON.parse(Buffer.from(msg.payload, "base64").toString("utf8"));
    handleNotification(msg.channel, payload);
  });
  pgClient.on("error", (e) => {
    console.error("pg client error...", e);
  });
}
export async function disconnectNotifications(): Promise<void> {
  await pgClient.end();
}
