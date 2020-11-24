const fetch = require("node-fetch");
const argv = require("minimist")(process.argv.slice(2));

async function pull(siteName, apiKey) {
  console.log("pulling site..", siteName);
  const res = await fetch("http://localhost:3001/api/site-schema", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "aven" }),
  });
  const resp = await res.json();

  console.log("pull!", resp);
}

function handleCli(argv) {
  if (argv.h === true) {
    console.log(`
Aven CLI tool

Usage:
aven pull SITE_NAME

        `);
  }

  const action = argv._[0];
  if (action === "pull") {
    pull(argv._[1])
      .then(() => {
        console.log("done");
      })
      .catch((e) => {
        console.error("eerrorr", e);
      });
    return;
  }
  console.log("Command not found. Try -h");
  return;
}

handleCli(argv);
