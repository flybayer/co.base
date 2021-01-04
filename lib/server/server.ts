import { Response } from "express";
import { createServer } from "http";
import { Store, Subscription } from "./store";
import * as dotenv from "dotenv";
import next from "next";
import { parse } from "url";
import WebSocket from "ws";
import express from "express";
import cookieParser from "cookie-parser";
import { testOutput } from "./TestOutput";
import spawnAsync from "@expo/spawn-async";
import { database } from "../data/database";
import { flushEvents, SERVER_HOST, writeEvent } from "../data/HostEvent";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });

console.log("Starting Host " + SERVER_HOST);

const defaultPort = dev ? 3001 : 3000;
const port = process.env.PORT ? Number(process.env.PORT) : defaultPort;

const DEFAULT_DB_URL = "postgresql://user:pw@localhost:5992/db";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}

let closeServer: null | (() => Promise<void>) = null;

const sockets = new Map<number, WebSocket>();
const socketSubscriptions = new Map<number, Map<string, Subscription>>();

async function startServer() {
  const server = express();
  const handle = app.getRequestHandler();
  server.use(
    express.static(__dirname + "/public", {
      maxAge: "30d",
    }),
  );
  server.use(cookieParser());
  server.use((req: any, res: Response) => {
    const parsedUrl = parse(req.url, true);
    req.stores = {
      //asdf
    };
    return handle(req, res, parsedUrl);
  });
  const httpServer = createServer(server);

  const heartbeatInterval = setInterval(() => {
    writeEvent("Heartbeat", { socketCount: sockets.size });
  }, 30_000);

  closeServer = async () => {
    // fixme: todo: websocket shutdown /disconnections?
    await new Promise<void>((resolve, reject) => {
      clearInterval(heartbeatInterval);
      console.log("Closing HTTP server.");
      httpServer.close();
      const rejectTimeout = setTimeout(() => {
        console.log("HTTP server did not close within 10 seconds!");
        reject(new Error("HTTPCloseError"));
      }, 10_000);
      httpServer.on("close", () => {
        console.log("HTTP server did close.");
        clearTimeout(rejectTimeout);
        resolve();
      });
    });
  };
  const wss = new WebSocket.Server({
    server: httpServer,
  });
  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, () => {
      resolve();
    });
    httpServer.on("error", reject);
  });

  writeEvent("HostOpen", undefined);

  testOutput({ type: "ServerReady", port });
  dev && console.log(`> Ready on http://localhost:${port}`);

  let clientIdCount = 0;

  function clientSend(clientId: number, data: any) {
    const socket = sockets.get(clientId);
    if (!socket) throw new Error("no socket with this client id");
    socket.send(JSON.stringify(data));
  }

  function getStore(key: string): null | Store<unknown> {
    return null;
  }

  function handleSubscribe(clientId: number, key: string) {
    const store = getStore(key);
    if (!store) {
      throw new Error(`Invalid key in "${key}"`);
    }
    const startState = store.get();
    if (startState !== undefined) {
      clientSend(clientId, {
        t: "state",
        key,
        state: startState,
      });
    }
    const subscription = store.listen((state: any) => {
      clientSend(clientId, {
        t: "state",
        key,
        state,
      });
    });
    const clientSubs = socketSubscriptions.get(clientId);
    if (!clientSubs) {
      throw new Error("unexpected condition. we are subscribing while the socket is disconnected??");
    }
    clientSubs.set(key, subscription);
  }
  function handleUnsubscribe(clientId: number, key: string) {
    const store = getStore(key);
    if (!store) {
      throw new Error(`Invalid key in "${key}"`);
    }
    const clientSubs = socketSubscriptions.get(clientId);
    if (!clientSubs) {
      throw new Error("unexpected condition. we are unsubscribing while the socket is disconnected??");
    }
    const subscription = clientSubs.get(key);
    if (subscription) {
      subscription.close();
    }
    clientSubs.delete(key);
  }
  function handleMessage(clientId: number, message: any) {
    if (message.t === "sub") return handleSubscribe(clientId, message.key);
    if (message.t === "unsub") return handleUnsubscribe(clientId, message.key);
  }
  wss.on("connection", (socket: WebSocket) => {
    const clientId = clientIdCount++;
    sockets.set(clientId, socket);
    socketSubscriptions.set(clientId, new Map());
    writeEvent("SocketConnect", { clientId });
    clientSend(clientId, {
      t: "info",
      clientId,
      host: SERVER_HOST,
    });
    socket.on("message", (data: string) => {
      const msg = JSON.parse(data);
      handleMessage(clientId, msg);
    });
    socket.on("close", () => {
      sockets.delete(clientId);
      socketSubscriptions.delete(clientId);
      writeEvent("SocketDisconnect", { clientId });
    });
  });
}

async function prepareDockerDev() {
  if (!dev) return;
  console.log("Docker startup..");
  await spawnAsync("docker-compose", ["-f", "../../docker-compose.yml", "up", "-d"], {
    cwd: __dirname,
    stdio: "inherit",
  });
}

async function prepareDatabase() {
  if (!dev) return;
  console.log("Migrating db..");
  await spawnAsync("yarn", ["prisma", "migrate", "dev", "--preview-feature", "--skip-generate"], {
    cwd: __dirname,
    stdio: "inherit",
    env: {
      DATABASE_URL: DEFAULT_DB_URL,
      ...process.env,
    },
  });
}

async function runServer() {
  await prepareDockerDev();
  await prepareDatabase();
  await app.prepare();
  await startServer();
}

runServer().catch((err) => {
  console.error(err);
});

process.on("SIGHUP", () => {
  console.info("SIGHUP signal received.");
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  (async () => {
    writeEvent("HostClose", undefined);
    await flushEvents();
    if (closeServer) await closeServer();
    database.$disconnect();
  })()
    .then(() => {
      process.exit(0);
    })
    .catch((e) => {
      console.error("Error while shutting down server");
      // good luck finding this error in the production logs, lol!
      console.error(e);
      process.exit(1);
    });
});
