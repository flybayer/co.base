import next from "next";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { parse } from "url";
import attachStoreServer from "../cloud-docs/attachStoreServer";
import stores from "../stores/server";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();

  const server = express();

  server.use("*", (req: Request, res: Response<any>, next: () => void) => {
    const parsedUrl = parse(req.url, true);
    if (storeServer && storeServer.handleHTTP(parsedUrl, req, res)) return;
    handle(req, res, parsedUrl);
  });

  const httpServer = createServer(server);
  const storeServer = attachStoreServer(httpServer, stores);

  const serverPort = 3000;

  await new Promise((resolve, reject) => {
    httpServer.listen(serverPort, resolve);
    httpServer.on("error", reject);
  });

  return { serverPort };
}

startServer()
  .then(({ serverPort }) => {
    console.log(`> Ready on http://localhost:${serverPort}`);
  })
  .catch((err) => {
    console.error("Error Starting Server");
    console.error(err);
  });
