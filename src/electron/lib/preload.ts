// preload.ts
// Electron preload script for secure IPC communication between renderer and main process.
// Exposes a limited API to the renderer via contextBridge for sending, receiving, and invoking IPC events.

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose protected IPC methods to the renderer process via window.api.
 * - send: Send asynchronous messages to main process
 * - receive: Listen for messages from main process
 * - invoke: Send and await responses from main process
 */
contextBridge.exposeInMainWorld(
  "api", {
    /**
     * Sends an asynchronous IPC message to the main process.
     * @param channel IPC channel name
     * @param args Arguments to send
     */
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args);
    },
    /**
     * Registers a listener for IPC messages from the main process.
     * @param channel IPC channel name
     * @param func Callback to handle received arguments
     */
    receive: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    /**
     * Sends an IPC message and returns a promise for the response.
     * @param channel IPC channel name
     * @param args Arguments to send
     * @returns Promise resolving with response
     */
    invoke: (channel, args) => ipcRenderer.invoke(channel, args),
  }
);



