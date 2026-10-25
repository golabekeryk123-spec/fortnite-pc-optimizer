const { contextBridge, ipcRenderer } = require('electron');
const api = {};
for (const name of ['scanner', 'getTweakState', 'applyTweaks', 'undoTweaks', 'createRestorePoint', 'previewCleanup', 'runCleanup', 'diagnoseNetwork']) {
  api[name] = (...args) => ipcRenderer.invoke(`veyra:${name}`, ...args);
}
api.minimize = () => ipcRenderer.send('veyra:minimize');
api.close = () => ipcRenderer.send('veyra:close');
contextBridge.exposeInMainWorld('veyra', Object.freeze(api));
