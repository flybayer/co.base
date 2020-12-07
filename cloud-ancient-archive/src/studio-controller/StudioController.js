import {
  startFSStorageSource,
  connectSourceGit,
  saveDirectory,
} from '@aven/cloud-fs';
import { createCloud } from '@aven/cloud-core';
import { mountElectronApp } from '@aven/electron';
import { mainSourceProvider } from '@aven/cloud-electron';
import * as appConfig from './app.json';

const { app, BrowserWindow } = require('electron');
const path = require('path');

// suppress a warning:
app.allowRendererProcessReuse = true;

let mainWindow = null;

async function startApp() {
  const storageSource = await startFSStorageSource({
    dataDir: process.env['DATA_DIR'] || 'studio.data',
    domain: 'studio.aven.io',
  });
  const cloud = createCloud({
    source: storageSource,
    domain: 'studio.aven.io',
  });
  mainSourceProvider('StudioSource', () => mainWindow, cloud);
  createMainWindow();
  await saveDirectory(process.cwd(), cloud.get('AvenRepo'));
  // await connectSourceGit(
  //   storageSource,
  //   'studio.aven.io',
  //   'AvenRepo',
  //   process.cwd(),
  // );
  // Open the DevTools:
  // mainWindow.webContents.openDevTools();
  return () => {
    console.log('closing?!?!');
  };
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true, // maybe this is a bad practice? It is needed to make require statements work on the client code.
    },
  });
  mountElectronApp(mainWindow, appConfig, {});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app
  .whenReady()
  .then(startApp)
  .then(closeApp => {
    console.log('Done Starting App');
  })
  .catch(e => {
    console.error('Error Starting App');
    console.error(e);
  });

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
