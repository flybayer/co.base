const pathJoin = require('path').join;
const fs = require('fs');
const spawn = require('@expo/spawn-async');

const appName = process.argv[2];
const buildDir = pathJoin(__dirname, '../build');
const srcDir = pathJoin(__dirname, '../src');
const appConfigPath = pathJoin(srcDir, appName, 'app.json');
const appBuildDir = pathJoin(buildDir, appName);

const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

async function run() {
  if (appName !== appConfig.name) {
    console.error(
      `App name does not match! Script provided "${appName}", but the ${appConfigPath} file specifies a name of "${appConfig.name}".`,
    );
    process.exit(1);
  }

  console.log(`⚙️  Aven Web Build`);
  console.log(`ℹ️  App Name: ${appName}`);
  console.log(`ℹ️  Client Entry: ${appConfig.clientEntry}`);
  console.log(`ℹ️  Build Dest: ${appBuildDir}`);

  console.log(`🗑  Cleaning build dest`);
  // rm -rf build/APP_NAME
  await spawn(pathJoin(__dirname, '../node_modules/.bin/rimraf'), [
    appBuildDir,
  ]);

  console.log(`⚙️  Babel building server source`);
  // cross-env NODE_ENV=web-production yarn babel -d dist/pilot/server src
  await spawn(
    pathJoin(__dirname, '../node_modules/.bin/babel'),
    ['--copy-files', '-d', pathJoin(appBuildDir, 'server'), 'src'],
    {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'web-production' },
    },
  );

  // mkdirp dist/pilot/client dist/pilot/public
  await spawn(pathJoin(__dirname, '../node_modules/.bin/mkdirp'), [
    pathJoin(appBuildDir, 'client'),
    pathJoin(appBuildDir, 'public'),
  ]);

  console.log(`⚙️  Metro bundling client`);
  // react-native bundle --entry-file src/APP_NAME/CLIENT_ENTRY --dev false --platform web --reset-cache --bundle-output dist/APP_NAME/public/main.js --assets-dest dist/APP_NAME/client
  await spawn(
    pathJoin(__dirname, '../node_modules/.bin/react-native'),
    [
      'bundle',
      '--entry-file',
      pathJoin(srcDir, appName, appConfig.clientEntry),
      '--dev',
      'false',
      '--platform',
      'web',
      '--reset-cache',
      '--bundle-output',
      pathJoin(appBuildDir, 'public/main.js'),
      '--assets-dest',
      pathJoin(appBuildDir, 'client'),
    ],
    {
      stdio: 'inherit',
    },
  );

  console.log('💡  Build complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
