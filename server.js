const express = require("express");
const { parse } = require("url");
const next = require("next");
const fs = require("fs-extra");
const spawn = require("@expo/spawn-async");
const { decode } = require("jwt-simple");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const cookieParser = require("cookie-parser");

const port = dev ? 3001 : 3000;

if (dev && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://user:pw@localhost:5432/db";
}

let authRouter = null;

async function prepareAuthRouter() {
  // are you ready to commit some sins? This is embarrassing..

  // we should be using the existing next+mdx enhanced infrastructure to read these files and this front matter..
  const pagesDirList = await fs.readdir("pages");
  const mdxPages = pagesDirList.filter((p) => p.match(/^(.*).mdx$/));
  const pages = {};
  await Promise.all(
    mdxPages.map(async (mdxFileName) => {
      const name = mdxFileName.slice(0, -4);
      const filePath = `pages/${mdxFileName}`;
      const fileData = await fs.readFile(filePath, {
        encoding: "utf8",
      });
      const frontMatch = fileData.match(/---\n(([^-].*\n)+)---/);
      const frontData = frontMatch && frontMatch[1];
      if (!frontData) {
        return;
      }
      const frontLines = frontData.split("\n");
      const meta = {};
      frontLines.forEach((line) => {
        const metaLine = line.match(/([^:]*):\s(.*)$/);
        if (metaLine) {
          let value = metaLine[2];
          try {
            value = JSON.parse(metaLine[2]);
          } catch (e) {}
          meta[metaLine[1]] = value;
        }
      });
      pages[name] = { name, meta };
    })
  );
  authRouter = (req, res, parsedUrl) => {
    const reqPage = req.path.slice(1);
    const page = pages[reqPage];
    // oh jeez, now based on page.meta.accessLevel, we need to check with the db to see if the user is authenticated for this page..
    if (page && page.meta.accessLevel) {
      const encodedJwt = req.cookies.AvenSession;
      let session = null;
      if (!encodedJwt) {
        res.redirect("/login");
      }
      try {
        session = decode(encodedJwt, process.env.JWT_SECRET);
      } catch (e) {
        console.error(e);
        res.redirect("/login");
      }
      console.log("VALID SESSION: ", session);
      return false;
    }
    return false;
  };
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
  await spawn(
    "node_modules/@prisma/cli/build/index.js",
    ["migrate", "up", "--experimental"],
    {
      env: {
        // relying on dotenv to pull this from .env.production.local
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL || "postgresql://user:pw@localhost:5432/db",
      },
    }
  );
}

async function startServer() {
  console.log("Setting up web server..");
  const server = express();
  const handle = app.getRequestHandler();
  server.use(
    express.static(__dirname + "/public", {
      maxAge: "30d",
    })
  );
  server.use(cookieParser());
  server.use((req, res) => {
    const parsedUrl = parse(req.url, true);
    if (authRouter && authRouter(req, res, parsedUrl)) return;
    return handle(req, res, parsedUrl);
  });
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}

async function runServer() {
  await prepareDockerDev();
  await prepareDatabase();
  await prepareAuthRouter();
  await app.prepare();
  await startServer();
}

runServer().catch((err) => {
  console.error(err);
});
