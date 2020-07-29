const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = dev ? 3001 : 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    // followed instructions from here: https://nextjs.org/docs/advanced-features/custom-server
    const parsedUrl = parse(req.url, true);
    // const { pathname, query } = parsedUrl;
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
