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
  analyzeFiles: (paths: string[]) => ipcRenderer.invoke('analyze-files', paths),
  
  // Watcher
  startWatching: (path: string) => ipcRenderer.invoke('start-watching', path),
  onDirChange: (callback: () => void) => {
    const subscription = (_event: any) => callback();
    ipcRenderer.on('dir-changed', subscription);
    return () => {
      ipcRenderer.removeListener('dir-changed', subscription);
    };
  },
  onSyncEvent: (callback: (type: 'missing' | 'new', path: string) => void) => {
    // Nasłuchujemy dwóch różnych zdarzeń z Main i mapujemy je na jeden callback
    const missingListener = (_e: any, path: string) => callback('missing', path);
    const newFileListener = (_e: any, path: string) => callback('new', path);

    ipcRenderer.on('file-missing', missingListener);
    ipcRenderer.on('new-file-detected', newFileListener);

    // Funkcja czyszcząca (usuwa oba nasłuchiwacze)
    return () => {
      ipcRenderer.removeListener('file-missing', missingListener);
      ipcRenderer.removeListener('new-file-detected', newFileListener);
    };
  },
  selectDocuments: () => ipcRenderer.invoke('select-documents'),
  processPaths: (paths: string[]) => ipcRenderer.invoke('process-paths', paths)
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