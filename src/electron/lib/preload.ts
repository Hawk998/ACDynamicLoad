import { contextBridge, ipcRenderer } from 'electron';


// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {
    // IPC Kommunikation
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args);
    },
    receive: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    invoke: (channel, args) => ipcRenderer.invoke(channel, args),
    
}
);



