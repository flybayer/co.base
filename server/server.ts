import { Request, Response } from "express";
import { createServer } from "http";
import { Store, Subscription } from "./store";
import * as dotenv from "dotenv";
import next from "next";
import { parse } from "url";
import WebSocket from "ws";
import express from "express";
import spawn from "@expo/spawn-async";
import cookieParser from "cookie-parser";

dotenv.config();
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });

const port = dev ? 3001 : 3000;

const DEFAULT_DB_URL = "postgresql://user:pw@localhost:5992/db";

async function startServer() {
  console.log("Setting up web server..");
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

  const wss = new WebSocket.Server({
    server: httpServer,
  });
  await new Promise((resolve, reject) => {
    httpServer.listen(port, resolve);
    httpServer.on("error", reject);
  });

  console.log(`> Ready on http://localhost:${port}`);

  let clientIdCount = 0;

  const sockets = new Map<number, WebSocket>();
  const socketSubscriptions = new Map<number, Map<string, Subscription>>();

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

    socket.on("message", (data: string) => {
      const msg = JSON.parse(data);
      handleMessage(clientId, msg);
    });
    socket.on("close", () => {
      sockets.delete(clientId);
      socketSubscriptions.delete(clientId);
    });
  });
}

async function prepareDockerDev() {
  if (!dev) return;
  console.log("Docker startup..");
  const { output } = await spawn("docker-compose", ["up", "-d"], {
    cwd: __dirname,
  });
  console.log(output.join("\n"));
}

async function prepareDatabase() {
  console.log("Migrating database..");
  await spawn("node_modules/@prisma/cli/build/index.js", ["migrate", "up", "--experimental", "--auto-approve"], {
    env: {
      // relying on dotenv to pull this from .env.production.local
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || DEFAULT_DB_URL,
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
