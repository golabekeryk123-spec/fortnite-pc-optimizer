const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createEngine } = require('./engine.cjs');
const { diagnoseNetwork } = require('./network.cjs');

let mainWindow;
const rendererPath = path.join(__dirname, '..', 'dist', 'index.html');
const trustedRenderer = pathToFileURL(rendererPath).href;

if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(() => {
  if (process.platform !== 'win32') {
    dialog.showErrorBox('Veyra — Windows wymagany', 'Zmiany systemowe są dostępne wyłącznie w Windows 10 i 11. Podgląd interfejsu uruchom poleceniem npm run dev.');
    app.quit();
    return;
  }
  const engine = createEngine({ userDataPath: app.getPath('userData') });
  engine.diagnoseNetwork = () => diagnoseNetwork();
  const operations = ['scanner', 'getTweakState', 'applyTweaks', 'undoTweaks', 'createRestorePoint', 'previewCleanup', 'runCleanup', 'diagnoseNetwork'];
  for (const operation of operations) {
    ipcMain.handle(`veyra:${operation}`, async (event, ...args) => {
      if (event.sender !== mainWindow?.webContents || event.senderFrame !== mainWindow.webContents.mainFrame || event.senderFrame.url !== trustedRenderer) {
        throw new Error('Niezaufane źródło żądania.');
      }
      const expectedArgs = ['applyTweaks', 'undoTweaks', 'runCleanup'].includes(operation) ? 1 : 0;
      if (args.length !== expectedArgs) throw new Error('Nieprawidłowe argumenty operacji.');
      return engine[operation](...args);
    });
  }
  mainWindow = new BrowserWindow({
    width: 1440, height: 960, minWidth: 860, minHeight: 640,
    backgroundColor: '#101312', title: 'Veyra', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => { if (url !== trustedRenderer) event.preventDefault(); });
  mainWindow.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => callback({
    responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"] },
  }));
  ipcMain.on('veyra:minimize', (event) => { if (event.sender === mainWindow.webContents) mainWindow.minimize(); });
  ipcMain.on('veyra:close', (event) => { if (event.sender === mainWindow.webContents) mainWindow.close(); });
  mainWindow.loadFile(rendererPath);
});
app.on('window-all-closed', () => app.quit());
