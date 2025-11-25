import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getFilePath: (file: File) => string;
      getSettings: () => Promise<{ apiKey?: string; rootDir?: string } | null>;
      saveSettings: (settings: { apiKey?: string; rootDir?: string }) => Promise<boolean>;
      selectDirectory: () => Promise<string | null>;
      readDir: (path: string) => Promise<any>; // Uproszczony typ any dla drzewa
      startWatching: (path: string) => Promise<boolean>;
      onDirChange: (callback: () => void) => () => void; // Zwraca funkcję void
    }
  }
}