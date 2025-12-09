// electron/preload.js
const { contextBridge } = require('electron');

// Expose minimal APIs if needed later.
// For now, React will call backend over HTTP directly.
contextBridge.exposeInMainWorld('electronAPI', {});
