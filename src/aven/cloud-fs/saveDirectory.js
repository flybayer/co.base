import fs from 'fs-extra';
const path = require('path');
const minimatch = require('minimatch');
const mime = require('mime');

type AbsolutePath = string;

type CloudStream<ValueDef> = {
  load: () => Promise<ValueDef>,
};
type CloudDoc<ValueDef> = {
  value: CloudStream<ValueDef>,
};

function scheduloid(actions: any, { onTaskQueueEmpty }) {
  const queuedActions = [];
  function dispatch(actionType: String, payload: any) {
    queuedActions.push({ actionType, payload });
    start();
  }
  let isRunning = false;
  function start() {
    if (!isRunning) {
      isRunning = true;
      run();
    }
  }
  function stop() {
    isRunning = false;
  }
  function run() {
    if (!isRunning) return;
    performStep()
      .then(() => {
        setTimeout(run, 0);
      })
      .catch(e => {
        console.error('Error performing shed step!', e);
        setTimeout(run, 0);
      });
  }
  async function performStep() {
    const action = queuedActions.shift();
    if (!action) {
      isRunning = false;
      onTaskQueueEmpty && onTaskQueueEmpty();
      return;
    }
    const actionFn = actions[action.actionType];
    await actionFn(action.payload);
  }
  return {
    start,
    stop,
    dispatch,
  };
}
function setFind(set, findFn) {
  for (const e of set) {
    if (findFn(e)) {
      return e;
    }
  }
}

export default async function saveDirectory(
  directory: AbsolutePath,
  doc: CloudDoc<any>,
) {
  const dirScanStack = [directory];
  const lastValue = await doc.value.load();
  const dirLists = {};
  const stats = {};
  const gitIgnores = new Set();
  const publishedBlocks = {};

  console.log('lastValue', lastValue);
  const sched = scheduloid(
    {
      scanDir: async directory => {
        const list = await fs.readdir(directory);
        list.forEach(childPath => {
          sched.dispatch('scanPath', path.join(directory, childPath));
        });
        try {
          const gitignore = await fs.readFile(
            path.join(directory, '.gitignore'),
          );
          String(gitignore)
            .split('\n')
            .forEach(ignoreLine => {
              if (ignoreLine === '') return;
              if (ignoreLine[0] === '#') return;
              gitIgnores.add(path.join(directory, ignoreLine));
            });
        } catch (e) {
          if (e.code !== 'ENOENT') {
            console.error('Error Reading gitIgnore!', e);
          }
        }
        dirLists[directory] = list;
        dirScanStack.push(directory);
      },
      scanPath: async inputPath => {
        const stat = await fs.stat(inputPath);
        const isDirectory = stat.isDirectory();
        const modeStr = `${parseInt(stat.mode.toString(8), 10)}`;
        const isGitBaseName = path.basename(inputPath) === '.git';
        const isIgnored =
          isGitBaseName ||
          !!setFind(gitIgnores, ignorePath => minimatch(inputPath, ignorePath));
        const isExecutable = !isDirectory && modeStr[3] % 2 === 1;
        stats[inputPath] = {
          isDirectory,
          isIgnored,
          isExecutable,
        };
        if (isDirectory && !isIgnored) {
          sched.dispatch('scanDir', inputPath);
        } else if (!isDirectory && !isIgnored) {
          sched.dispatch('publishFile', inputPath);
        }
      },
      publishFile: async filePath => {
        const fileData = await fs.readFile(filePath);
        let blockValue;
        try {
          blockValue = JSON.parse(fileData);
        } catch (e) {
          const contentType = mime.getType(filePath);
          blockValue = {
            contentType,
            type: 'BinaryFileHex',
            data: fileData.toString('hex'),
          };
        }
        const publishedBlock = await doc.publishValue(blockValue);
        publishedBlocks[filePath] = publishedBlock;
      },
      publishDir: async dirPath => {
        const list = dirLists[dirPath];
        const files = {};
        await Promise.all(
          list.map(async childPath => {
            const fullPath = path.join(dirPath, childPath);
            const pathStat = stats[fullPath];
            if (pathStat.isIgnored) {
              return;
            }
            files[childPath] = {
              ref: await publishedBlocks[fullPath]?.getReference(),
              isExecutable: pathStat.isExecutable,
              isDirectory: pathStat.isDirectory,
            };
          }),
        );
        const dirData = { files, type: 'Directory' };
        const publishedBlock = await doc.publishValue(dirData);
        publishedBlocks[dirPath] = publishedBlock;
        console.log(
          'PUBLISHING DIRRRRR',
          dirPath,
          JSON.stringify(dirData, null, 2),
        );
      },
      rollup: async action => {
        // scanRootDir.action
        console.log('rolll up', action);
      },
    },
    {
      onTaskQueueEmpty: () => {
        // console.log('HO HO HO', dirScanStack);
        if (dirScanStack.length > 1) {
          const publishDir = dirScanStack.pop();
          sched.dispatch('publishDir', publishDir);
        } else {
          // sched.dispatch('rollup', null);

          console.log('woahmg');
        }
      },
    },
  );

  sched.dispatch('scanDir', directory);
}
