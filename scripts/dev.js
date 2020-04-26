const pathJoin = require('path').join;
const fs = require('fs-extra');
const spawn = require('@expo/spawn-async');
const appName = process.argv[2];
const srcDir = pathJoin(__dirname, '../src');
const appConfigPath = appName && pathJoin(srcDir, appName, 'app.json');
const appSrcDir = appName && pathJoin(srcDir, appName);
const buildDir = pathJoin(__dirname, '../build');
const appBuildDir = pathJoin(buildDir, appName);

const appConfig = appConfigPath && JSON.parse(fs.readFileSync(appConfigPath));

async function startDevServer() {
  spawn(
    'node',
    [
      pathJoin(
        __dirname,
        '../node_modules/@react-native-community/cli/build/bin.js',
      ),
      'start',
      '--reset-cache',
    ],
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

const APP_TYPES = {
  node: {
    runDevApp: async function runDevApp() {
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
      console.log(
        `ℹ️ Starting server at: ${pathJoin(appSrcDir, appConfig.serverEntry)}`,
      );
    },
  },
  electron: {
    runDevApp: async function runDevApp() {
      await spawn(
        pathJoin(__dirname, '../node_modules/.bin/babel'),
        ['--copy-files', '-d', pathJoin(appBuildDir, 'dist'), 'src'],
        {
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'web-production' },
        },
      );
      await fs.writeFile(
        pathJoin(appBuildDir, 'dist', appName, 'package.json'),
        JSON.stringify(
          {
            main: appConfig.electronEntry,
          },
          null,
          2,
        ),
      );
      await spawn(
        pathJoin(__dirname, '../node_modules/.bin/electron'),
        [pathJoin(appBuildDir, 'dist', appName)],
        {
          stdio: 'inherit',
        },
      );
    },
  },
};

async function runMainApp() {
  const appType = appConfig.type || 'node';
  const appTypeDef = APP_TYPES[appType];
  return appTypeDef.runDevApp();
}

async function run() {
  if (!appName) {
    return startDevServer();
  }
  await maybeStartDevServer();
  await runMainApp();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
