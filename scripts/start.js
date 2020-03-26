const pathJoin = require('path').join;
const fs = require('fs');
const spawn = require('@expo/spawn-async');

const appName = process.argv[2];
const buildDir = pathJoin(__dirname, '../build');
const srcDir = pathJoin(__dirname, '../src');
const appConfigPath = pathJoin(srcDir, appName, 'app.json');
const appBuildDir = pathJoin(buildDir, appName);

const appConfig = JSON.parse(fs.readFileSync(appConfigPath));
const serverEntryPath = pathJoin(
  appBuildDir,
  'server',
  appName,
  appConfig.serverEntry,
);

async function run() {
  if (appName !== appConfig.name) {
    console.error(
      `App name does not match! Script provided "${appName}", but the ${appConfigPath} file specifies a name of "${appConfig.name}".`,
    );
    process.exit(1);
  }

  console.log(`⚙️  Aven Web Start`);
  console.log(`ℹ️  App Name: ${appName}`);
  console.log(`ℹ️  Entry: ${serverEntryPath}`);

  await spawn('node', [serverEntryPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  console.log('💡  Run complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
