const pathJoin = require('path').join;
const fs = require('fs');
const spawn = require('@expo/spawn-async');

const appName = process.argv[2];
const buildDir = pathJoin(__dirname, '../build');
const srcDir = pathJoin(__dirname, '../src');
const appConfigPath = pathJoin(srcDir, appName, 'app.json');
const appBuildDir = pathJoin(buildDir, appName);

const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

async function run() {}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
