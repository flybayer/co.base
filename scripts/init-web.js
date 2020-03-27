const pathJoin = require('path').join;
const fs = require('fs-extra');
const spawn = require('@expo/spawn-async');
const appName = process.argv[2];
const srcDir = pathJoin(__dirname, '../src');
const appConfigPath = appName && pathJoin(srcDir, appName, 'app.json');
const templateDir = pathJoin(srcDir, 'aven/pilot');
const prompts = require('prompts');

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
  const { appName } = await prompts([
    {
      type: 'text',
      name: 'appName',
      message: 'App name? New folder under `src/` (snake-case-recommended)',
      validate: value => {
        if (value.match(/ /)) return 'Cannot have a space in the app name';
        return true;
      },
    },
  ]);
  const { appNameTitle, domain } = await prompts([
    {
      type: 'text',
      name: 'appNameTitle',
      message: 'App name? (in TitleCase)',
      validate: value => {
        if (value.match(/ /)) return 'Cannot have a space in the app name';
        return true;
      },
      initial: appName
        .split('-')
        .map(a => a[0].toUpperCase() + a.slice(1))
        .join(''),
    },

    { type: 'text', name: 'domain', message: 'Domain name?' },
  ]);

  const appSrc = pathJoin(srcDir, appName);
  if (await fs.exists(appSrc)) {
    console.log(
      `🚨 Cannot create app because a directory already exists at ${appSrc}`,
    );
    process.exit(1);
  }
  const sourceFiles = await fs.readdir(templateDir);

  await fs.mkdirp(appSrc);
  await Promise.all(
    sourceFiles.map(async sourceFile => {
      const sourceCode = await fs.readFile(pathJoin(templateDir, sourceFile), {
        encoding: 'utf8',
      });
      const outputSource = sourceCode.replace('Pilot', appNameTitle);
      const outputFile = sourceFile.replace('Pilot', appNameTitle);
      await fs.writeFile(pathJoin(appSrc, outputFile), outputSource);
    }),
  );
  await fs.writeFile(
    pathJoin(appSrc, 'app.json'),
    JSON.stringify(
      {
        name: appName,
        domain,
        clientEntry: `${appNameTitle}Client.js`,
        serverEntry: `${appNameTitle}Server.js`,
      },
      null,
      2,
    ),
  );

  console.log(`💡 Created new web app in ${appSrc}`);
  console.log('ℹ️  To develop the app:');
  console.log('');
  console.log('yarn dev ' + appName);
  console.log('');
  console.log('ℹ️  To build and run production mode:');
  console.log('');
  console.log('yarn build ' + appName);
  console.log('yarn start ' + appName);
  console.log('');
  console.log('Happy hacking!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
