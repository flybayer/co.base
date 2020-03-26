const pathJoin = require('path').join;
const fs = require('fs');
const spawn = require('@expo/spawn-async');
const appName = process.argv[2];
const srcDir = pathJoin(__dirname, '../src');
const appConfigPath = appName && pathJoin(srcDir, appName, 'app.json');
const appSrcDir = appName && pathJoin(srcDir, appName);

const appConfig = appConfigPath && JSON.parse(fs.readFileSync(appConfigPath));

async function startDevServer() {
  spawn(
    pathJoin(__dirname, '../node_modules/.bin/react-native'),
    ['start', '--reset-cache'],
    {
      stdio: 'inherit',
    },
  );
}

async function maybeStartDevServer() {
  try {
    await spawn('curl', ['localhost:8081'], {});
    console.log('ℹ️  Metro Server is already running.');
  } catch (e) {
    console.log('ℹ️  Starting Metro Server..');
    await startDevServer();
  }
}

async function run() {
  if (!appName) {
    return startDevServer();
  }
  await maybeStartDevServer();
  console.log(
    `ℹ️ Starting server at: ${pathJoin(appSrcDir, appConfig.serverEntry)}`,
  );
  spawn(
    pathJoin(__dirname, '../node_modules/.bin/babel-node'),
    [pathJoin(appSrcDir, appConfig.serverEntry)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        BABEL_ENV: 'web-development',
        NODE_ENV: 'development',
      },
    },
  );
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
