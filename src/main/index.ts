import { app, shell, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'

// --- ZMIENNE GLOBALNE ---
let fileWatcher: chokidar.FSWatcher | null = null;
const configPath = path.join(app.getPath('userData'), 'config.json');

// --- FUNKCJE POMOCNICZE (DRZEWO PLIKÓW) ---
// (Ta część jest identyczna jak w poprzedniej działającej wersji)
const getFileTree = (dirPath: string) => {
  try {
    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);
    const node = { name, path: dirPath, isDirectory: stats.isDirectory(), children: [] as any[] };

    if (stats.isDirectory()) {
      try {
        const items = fs.readdirSync(dirPath);
        const filteredItems = items.filter(item => 
          !item.startsWith('.') && 
          item !== 'node_modules' &&
          item !== '$RECYCLE.BIN' &&
          item !== 'System Volume Information'
        );
        node.children = filteredItems.map(child => {
          const childPath = path.join(dirPath, child);
          try { return getFileTree(childPath); } catch (e) { return null; }
        }).filter(Boolean);
      } catch (e) { console.warn(`Brak dostępu: ${dirPath}`); }
    }
    return node;
  } catch (error) { return null; }
};

// --- OKNO GŁÓWNE ---
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => { mainWindow.show() })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- LOGIKA SZYFROWANIA ---
// Pomocnicze funkcje, żeby nie zaśmiecać handlerów
function encryptApiKey(plainKey: string): string {
  try {
    if (!plainKey) return '';
    if (safeStorage.isEncryptionAvailable()) {
      // Szyfrujemy i zamieniamy na format HEX (czytelny w JSON)
      return safeStorage.encryptString(plainKey).toString('hex');
    }
    return plainKey; // Fallback (rzadko)
  } catch (e) {
    console.error('Błąd szyfrowania:', e);
    return '';
  }
}

function decryptApiKey(encryptedHex: string): string {
  try {
    if (!encryptedHex) return '';
    if (safeStorage.isEncryptionAvailable()) {
      // Zamieniamy HEX z powrotem na bufor i odszyfrowujemy
      const buffer = Buffer.from(encryptedHex, 'hex');
      return safeStorage.decryptString(buffer);
    }
    return encryptedHex;
  } catch (e) {
    // Jeśli nie uda się odszyfrować (np. przeniesiono plik na inny komputer),
    // zwracamy pusty string, żeby wymusić ponowne wpisanie klucza.
    console.warn('Nie udało się odszyfrować klucza (możliwa zmiana maszyny).');
    return '';
  }
}


app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.smartsort.ai')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 1. ODCZYT USTAWIEŃ (Z ODSZYFROWYWANIEM)
  ipcMain.handle('get-settings', () => {
    try {
      if (!fs.existsSync(configPath)) return {}; 
      
      const data = fs.readFileSync(configPath, 'utf-8');
      const settings = JSON.parse(data);

      // Jeśli w pliku jest klucz, próbujemy go odszyfrować przed wysłaniem do frontendu
      if (settings.apiKey) {
        settings.apiKey = decryptApiKey(settings.apiKey);
      }
      
      return settings;
    } catch (error) {
      console.error('Błąd odczytu ustawień:', error);
      return {};
    }
  });

  // 2. ZAPIS USTAWIEŃ (Z SZYFROWANIEM)
  ipcMain.handle('save-settings', async (_event, newSettings) => {
    try {
      // Najpierw czytamy to, co już jest na dysku
      let currentSettings: any = {};
      if (fs.existsSync(configPath)) {
        try {
          currentSettings = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (e) {}
      }

      // Jeśli przychodzi nowy klucz API (tekst jawny), musimy go zaszyfrować
      if (newSettings.apiKey) {
        newSettings.apiKey = encryptApiKey(newSettings.apiKey);
      }

      // Scalamy stare z nowym (nadpisując tylko to, co się zmieniło)
      const finalSettings = { ...currentSettings, ...newSettings };

      // Upewniamy się, że katalog istnieje
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

      // Zapisujemy ładnego JSONa
      fs.writeFileSync(configPath, JSON.stringify(finalSettings, null, 2));
      return true;
    } catch (error) {
      console.error('Błąd zapisu:', error);
      return false;
    }
  });

  // 3. WYBÓR FOLDERU
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // 4. SKANOWANIE
  ipcMain.handle('read-dir', (_event, path) => getFileTree(path));

  // 5. WATCHER
  ipcMain.handle('start-watching', (event, dirPath) => {
    if (fileWatcher) fileWatcher.close();
    fileWatcher = chokidar.watch(dirPath, { ignoreInitial: true, depth: 3 });
    fileWatcher.on('all', () => {
      BrowserWindow.getAllWindows().forEach(win => win.webContents.send('dir-changed'));
    });
    return true;
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})