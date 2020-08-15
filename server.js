const express = require("express");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });

const port = dev ? 3001 : 3000;

async function startServer() {
  const server = express();
  const handle = app.getRequestHandler();
  server.get(
    "/",
    express.static(__dirname + "/public", {
      maxAge: "14d",
    })
  );
  server.get("*", (req, res) => {
    const parsedUrl = parse(req.url, true);
    // const { pathname, query } = parsedUrl;
    return handle(req, res, parsedUrl);
  });
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}

async function runServer() {
  await app.prepare();
  await startServer();
}

runServer().catch((err) => {
  console.error(err);
});
