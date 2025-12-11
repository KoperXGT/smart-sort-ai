import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getFilePath: (file: File) => string;
      getSettings: () => Promise<{ apiKey?: string; rootDir?: string } | null>;
      saveSettings: (settings: { apiKey?: string; rootDir?: string }) => Promise<boolean>;
      selectDirectory: () => Promise<string | null>;
      readDir: (path: string) => Promise<any>;
      startWatching: (path: string) => Promise<boolean>;
      onDirChange: (callback: () => void) => () => void;
      onSyncEvent: (callback: (type: 'missing' | 'new', path: string) => void) => () => void;
      selectDocuments: () => Promise<string[]>;
      processPaths: (paths: string[]) => Promise<string[]>;
      analyzeFiles: (paths: string[]) => Promise<any[]>;
      applyOrganization: (tasks: any[]) => Promise<{ success: boolean; results: any[] }>;
      getHistory: () => Promise<any[]>;
      undoOperation: (id: string) => Promise<{ success: boolean; message?: string }>;
    }
  }
}