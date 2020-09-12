const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const attachStoreServer = require("./cloud-docs/attachStoreServer");
const stores = require("./stores");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    if (storeServer && storeServer.handleHTTP(parsedUrl, req, res)) return;
    handle(req, res, parsedUrl);
  });

  const storeServer = attachStoreServer(httpServer, stores);

  const serverPort = 3000;

  await new Promise((resolve, reject) => {
    httpServer.listen(serverPort, (err) => {
      if (err) reject(err);
      else resolve();
    });
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
