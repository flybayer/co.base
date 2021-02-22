import { SERVER_HOST } from "../data/HostEvent";

const dev = process.env.NODE_ENV !== "production";

console.log("Starting Host " + SERVER_HOST);

async function runServer() {
  console.log("--A");
  console.log("--B");
  console.log("--C");
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
    // cleanup stuffs
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
