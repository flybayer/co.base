const fs = require('fs-extra');
const net = require('net');

async function isSocketInUse(socketPath) {
  return new Promise((resolve, reject) => {
    const clientSocket = new net.Socket();
    clientSocket.on('error', e => {
      if (e.code === 'ECONNREFUSED') {
        resolve(false);
      } else {
        reject(e);
      }
    });
    clientSocket.connect({ path: socketPath }, () => {
      clientSocket.unref();
      resolve(true);
    });
  });
}

async function listen(server, listenLocation) {
  return new Promise((resolve, reject) => {
    server.listen(listenLocation, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export default async function startServer(server, listenLocation) {
  try {
    await listen(server, listenLocation);
  } catch (e) {
    if (e.code !== 'EADDRINUSE') {
      throw e;
    }
    if (await isSocketInUse(listenLocation)) {
      throw e;
    }
    await fs.unlink(listenLocation);
    await listen(server, listenLocation);
  }
}
