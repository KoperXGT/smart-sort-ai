import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getFilePath: (file: File): string => webUtils.getPathForFile(file),
  
  // Ustawienia
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  
  // Pliki
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readDir: (path: string) => ipcRenderer.invoke('read-dir', path),
  
  // Watcher
  startWatching: (path: string) => ipcRenderer.invoke('start-watching', path),
  onDirChange: (callback: () => void) => {
    const subscription = (_event: any) => callback();
    ipcRenderer.on('dir-changed', subscription);
    return () => {
      ipcRenderer.removeListener('dir-changed', subscription);
    };
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}