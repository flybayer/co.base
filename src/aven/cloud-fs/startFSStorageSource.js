import { BehaviorSubject } from 'rxjs-compat';
import { createGenericDataSource } from '@aven/cloud-core';
import { Err, getIdOfValue } from '@aven/utils';
import { streamOf } from '@aven/stream';

const fs = require('fs-extra');
const pathJoin = require('path').join;

async function readFSDoc(dataDir, name) {
  try {
    const docsDir = pathJoin(dataDir, 'docs');
    const docPath = pathJoin(docsDir, name);
    const childList = await fs.readdir(docPath);
    const children = {};
    const childrenSet = new Set();
    let id = undefined;
    await Promise.all(
      childList.map(async child => {
        if (child === '__document.json') {
          const docFile = await fs.readFile(
            pathJoin(docPath, '__document.json'),
          );
          const docData = JSON.parse(docFile);
          id = docData.id;
          return;
        }
        children[child] = await readFSDoc(dataDir, pathJoin(name, child));
        childrenSet.add(child);
      }),
    );
    return {
      children,
      childrenSet,
      id,
    };
  } catch (e) {
    throw new Err('FS Error in readFSDoc', 'FSStorageReadError', {
      dataDir,
      name,
      error: e,
    });
  }
}

async function writeFSBlock(dataDir, value) {
  try {
    const blocksDir = pathJoin(dataDir, 'blocks');
    const { id, size, blockData } = getIdOfValue(value);
    const blockPath = pathJoin(blocksDir, id);
    if (!(await fs.exists(blockPath))) {
      await fs.writeFile(blockPath, blockData);
    }
    return { id };
  } catch (e) {
    throw new Err('FS Error in writeFSBlock', 'FSStorageWriteBlockError', {
      dataDir,
      value,
      error: e,
    });
  }
}

async function readFSBlock(dataDir, id) {
  const blocksDir = pathJoin(dataDir, 'blocks');
  const blockPath = pathJoin(blocksDir, id);
  const blockData = await fs.readFile(blockPath);
  return JSON.parse(blockData);
}

async function hasFSBlock(dataDir, id) {
  if (id == null) {
    return false;
  }
  const blocksDir = pathJoin(dataDir, 'blocks');
  const blockPath = pathJoin(blocksDir, id);
  const hasBlock = await fs.exists(blockPath);
  return hasBlock;
}

async function readFSBlockList(dataDir) {
  try {
    const blocksDir = pathJoin(dataDir, 'blocks');
    return await fs.readdir(blocksDir);
  } catch (e) {
    throw new Err('FS Error in readFSBlockList', 'FSReadBlockList', {
      dataDir,
      error: e,
    });
  }
}

async function writeFSDoc(dataDir, name, id) {
  try {
    const docsDir = pathJoin(dataDir, 'docs');
    const docPath = pathJoin(docsDir, name);
    await fs.mkdirp(docPath);
    const docFilePath = pathJoin(docPath, '__document.json');
    await fs.writeFile(docFilePath, JSON.stringify({ id }));
  } catch (e) {
    throw new Err('FS Error in writeFSDoc', 'FSWriteDoc', {
      dataDir,
      name,
      id,
      error: e,
    });
  }
}

async function destroyFSDoc(dataDir, name) {
  const docsDir = pathJoin(dataDir, 'docs');
  const docPath = pathJoin(docsDir, name);
  await fs.remove(docPath);
}

async function moveFSDoc(dataDir, prevName, newName) {
  const docsDir = pathJoin(dataDir, 'docs');
  const sourcePath = pathJoin(docsDir, prevName);
  const destPath = pathJoin(docsDir, newName);
  await fs.move(sourcePath, destPath);
}

export default async function startFSStorageSource(opts = {}) {
  const sourceDomain = opts.domain;
  let dataDir = opts.dataDir;

  if (!dataDir) {
    throw new Error(
      'Cannot start a FS data source without specifying a dataDir to store data files',
    );
  }

  if (!sourceDomain) {
    throw new Error(
      'Cannot start a FS data source without specifying a domain',
    );
  }

  const blocksDir = pathJoin(dataDir, 'blocks');
  const docsDir = pathJoin(dataDir, 'docs');

  await fs.mkdirp(blocksDir);
  await fs.mkdirp(docsDir);

  // FS data source needs sync access to docs, and will handle blocks on a file-by-file basis. we start by reading all docs:
  const docState = await readFSDoc(dataDir, '');

  const isConnected = new BehaviorSubject(true);
  const [connectedStream] = streamOf(true, 'DocIsConnected');

  async function getBlock(blockId) {
    return await readFSBlock(dataDir, blockId);
  }

  async function getAllBlockIds() {
    return await readFSBlockList(dataDir);
  }

  async function commitBlock(value) {
    return await writeFSBlock(dataDir, value);
  }

  async function commitBlockId(id) {
    // we just need to make sure we have this block.
    if (!(await hasFSBlock(dataDir, id))) {
      throw new Error(`Cannot find block with id "${id}"`);
    }
  }

  async function commitDoc(name, id) {
    await writeFSDoc(dataDir, name, id);
  }

  async function commitDocDestroy(name) {
    await destroyFSDoc(dataDir, name);
  }

  async function commitDocMove(name, newName) {
    await moveFSDoc(dataDir, name, newName);
  }
  return createGenericDataSource({
    id: opts.id,
    domain: sourceDomain,
    docState,

    getBlock,
    getAllBlockIds,

    commitBlock,
    commitBlockId,
    commitDoc,
    commitDocDestroy,
    commitDocMove,

    connected: connectedStream,
    isConnected,
  });
}
