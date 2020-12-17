#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handleCli } = require("./dist/shell.js");

handleCli(process.argv);
