// Exposes one narrow function to the page: POST JSON to an AI endpoint via the main process.
// The main process is not bound by browser CORS, so self-hosted AI routers work without config.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlasNative', {
  // A local AI server (http://localhost / 127.0.0.1) is the only plain-http target the main process accepts.
  postJson: (url, headers, body, timeout) => ipcRenderer.invoke('ai:post', { url, headers, body, timeout, local: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(String(url)) }),
  // Past-paper pages and PDFs (checked again in the main process).
  getUrl: (url, as, timeout) => ipcRenderer.invoke('net:get', { url, as, timeout }),
  // Google sign-in through the system browser (loopback), for optional Drive sync.
  googleToken: (clientId, scope, consent = false, desktop = {}) => ipcRenderer.invoke('google:token', { clientId, scope, consent: !!consent, desktopClientId: desktop.clientId || '', desktopSecret: desktop.secret || '' })
});
