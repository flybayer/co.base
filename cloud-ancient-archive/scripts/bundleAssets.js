const fetch = require('node-fetch');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const appDistName = process.argv[2];
const clientMainFile = process.argv[3];

const child = spawn(
  'node',
  ['./node_modules/@react-native-community/cli/build/bin.js', 'start'],
  {
    env: process.env,
  },
);
child.on('exit', code => {
  console.log('Metro closed with code: ' + code);
});
child.stdout.on('data', data => {
  if (data.indexOf('Welcome to React Native!') !== -1) {
    fetch(`http://localhost:8081/src/${clientMainFile}.assets?platform=web`)
      .then(resp => {
        return resp.json();
      })
      .then(async assets => {
        const assetManifestPath = `dist/${appDistName}/server/AssetManifest.json`;
        await fs.mkdirp(`dist/${appDistName}/public/static`);
        await Promise.all(
          assets.map(async asset => {
            await fs.copy(
              asset.files[0],
              `dist/${appDistName}/public/static/${asset.hash}.${asset.type}`,
            );
          }),
        );
        await fs.writeFile(assetManifestPath, JSON.stringify(assets));
      })
      .catch(e => {
        console.error(e);
        process.exitCode = 2;
      })
      .finally(() => {
        setTimeout(() => {
          process.exit(0);
        }, 5000);
      });
  }
});
child.stderr.on('data', data => {
  console.error('! ' + data);
  process.exitCode = 1;
});
