const fs = require('fs-extra');
const pathJoin = require('path').join;
const mime = require('mime');

export default function createFSClient({ client }) {
  async function uploadFile({ filePath, doc }) {
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
    const block = doc.getBlockOfValue(blockValue);
    await block.put();
    return block;
  }

  async function uploadFolder({ folderPath, doc }) {
    const filesInDir = await fs.readdir(folderPath);
    const fileList = await Promise.all(
      filesInDir.map(async fileName => {
        const filePath = pathJoin(folderPath, fileName);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          return await uploadFolder({ folderPath: filePath, doc });
        } else {
          return await uploadFile({ filePath, doc });
        }
      }),
    );
    const files = {};
    await Promise.all(
      filesInDir.map(async (fileName, index) => {
        files[fileName] = await fileList[index].getReference();
      }),
    );
    const folderObj = { files, type: 'Folder' };
    const block = doc.getBlockOfValue(folderObj);
    await block.put();
    return block;
  }

  async function putFolder({ folderPath, name }) {
    const doc = client.get(name);
    const folderBlock = await uploadFolder({
      folderPath,
      doc,
    });
    const id = folderBlock.getId();
    await doc.putBlock(folderBlock);
    return { id, name };
  }

  return { ...client, uploadFile, uploadFolder, putFolder };
}
