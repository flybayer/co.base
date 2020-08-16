const express = require("express");
const { parse } = require("url");
const next = require("next");
const spawn = require("@expo/spawn-async");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });

const port = dev ? 3001 : 3000;

async function prepareDatabase() {
  console.log("Migrating database..");
  await spawn(
    "node_modules/@prisma/cli/build/index.js",
    ["migrate", "up", "--experimental"],
    {
      // env: {// relying on dotenv to pull this from .env.production.local
      //   DATABASE_URL: process.env.DATABASE_URL,
      // }
    }
  );
}

async function startServer() {
  console.log("Setting up web server..");
  const server = express();
  const handle = app.getRequestHandler();
  server.get(
    "/",
    express.static(__dirname + "/public", {
      maxAge: "14d",
    })
  );
  server.use((req, res) => {
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
  await prepareDatabase();
  await app.prepare();
  await startServer();
}

runServer().catch((err) => {
  console.error(err);
});
