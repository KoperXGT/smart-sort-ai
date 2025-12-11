import { app, shell, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { MetadataManager } from './metadataManager';
import { parseFileContent } from './fileParser';
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import OpenAI from 'openai';

// --- ZMIENNE GLOBALNE ---
const metadataManager = new MetadataManager();
let fileWatcher: any = null;
const configPath = path.join(app.getPath('userData'), 'config.json');

// --- KONFIGURACJA LIMITÓW ---
const CONCURRENCY_LIMIT = 5;

// --- FUNKCJE POMOCNICZE (DRZEWO PLIKÓW) ---
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
    title: "SmartSort AI",
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

// --- FUNKCJA AI (NOWY, UNIWERSALNY PROMPT) ---
// Zaktualizowana funkcja AI
async function analyzeContentWithAI(text: string, apiKey: string, customInstructions: string = '') {
  if (!text || text.trim().length < 10) return null;

  const openai = new OpenAI({ apiKey });
  const currentYear = new Date().getFullYear();

  // Budowanie System Promptu z "wstrzyknięciem"
  const systemPrompt = `Jesteś Ekspertem Archiwizacji Osobistej. 
          
          ZASADY KATEGORYZACJI:
          1. Określ główny obszar (np. Finanse, Edukacja, Praca, Dom, Zdrowie).
          2. Zaproponuj podfolder.
          3. Używaj separatora "/" (slash).

          ZASADY NAZEWNICTWA:
          - Format: "Temat_Bez_Rozszerzenia".
          - Dokumenty z datą -> "RRRR-MM-DD_Temat".
          - Dokumenty bez daty -> "Temat".

          ${customInstructions ? `
          --- DODATKOWE INSTRUKCJE UŻYTKOWNIKA (WAŻNE!) ---
          ${customInstructions}
          --------------------------------------------------
          ` : ''}

          Zwróć JSON:
          {
            "summary": "Info",
            "category": "Kategoria/Podkategoria",
            "suggestedName": "Nazwa",
            "metadata": { "type": "string", "tags": [], "attributes": {} }
          }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Rok: ${currentYear}. Treść:\n\n${text}` }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    return content ? JSON.parse(content) : null;

  } catch (error) {
    console.error("OpenAI Error:", error);
    return null;
  }
}

// --- POMOCNIK: PROCESOWANIE RÓWNOLEGŁE (Concurrency Pool) ---
async function processWithConcurrency<T>(
  items: string[], 
  concurrency: number, 
  task: (item: string) => Promise<T>
): Promise<T[]> {
  const results: T[] = [];
  const queue = [...items];
  
  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        try {
          const result = await task(item);
          results.push(result);
        } catch (e) {
          console.error("Critical worker error", e);
        }
      }
    }
  };

  const workers = Array(Math.min(items.length, concurrency))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  
  return results;
}

// --- LOGIKA SZYFROWANIA ---
function encryptApiKey(plainKey: string): string {
  try {
    if (!plainKey) return '';
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(plainKey).toString('hex');
    }
    return plainKey;
  } catch (e) {
    console.error('Błąd szyfrowania:', e);
    return '';
  }
}

function decryptApiKey(encryptedHex: string): string {
  try {
    if (!encryptedHex) return '';
    if (safeStorage.isEncryptionAvailable()) {
      const buffer = Buffer.from(encryptedHex, 'hex');
      return safeStorage.decryptString(buffer);
    }
    return encryptedHex;
  } catch (e) {
    console.warn('Nie udało się odszyfrować klucza (możliwa zmiana maszyny).');
    return '';
  }
}


app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.smartsort.ai')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ODCZYT USTAWIEŃ (Z ODSZYFROWYWANIEM)
  ipcMain.handle('get-settings', () => {
    try {
      if (!fs.existsSync(configPath)) return {}; 
      
      const data = fs.readFileSync(configPath, 'utf-8');
      const settings = JSON.parse(data);

      if (settings.apiKey) {
        settings.apiKey = decryptApiKey(settings.apiKey);
      }
      
      return settings;
    } catch (error) {
      console.error('Błąd odczytu ustawień:', error);
      return {};
    }
  });

  // ZAPIS USTAWIEŃ (Z SZYFROWANIEM)
  ipcMain.handle('save-settings', async (_event, newSettings) => {
    try {
      let currentSettings: any = {};
      if (fs.existsSync(configPath)) {
        try {
          currentSettings = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (e) {}
      }

      if (newSettings.apiKey) {
        newSettings.apiKey = encryptApiKey(newSettings.apiKey);
      }

      const finalSettings = { ...currentSettings, ...newSettings };

      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

      fs.writeFileSync(configPath, JSON.stringify(finalSettings, null, 2));
      return true;
    } catch (error) {
      console.error('Błąd zapisu:', error);
      return false;
    }
  });

  // WYBÓR FOLDERU
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // SKANOWANIE
  ipcMain.handle('read-dir', (_event, path) => getFileTree(path));

  // WYBÓR WIELU DOKUMENTÓW (OKNO)
  ipcMain.handle('select-documents', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Dokumenty', extensions: ['pdf', 'docx', 'txt', 'jpg', 'png'] }
      ]
    });
    if (result.canceled) return [];
    return result.filePaths;
  });

// INTELIGENTNE SKANOWANIE (Pliki + Foldery -> Tylko Pliki)
  ipcMain.handle('process-paths', (_event, filePaths: string[]) => {
    const allFiles: string[] = [];

    const scanRecursively = (currentPath: string) => {
      try {
        if (!currentPath) return;
        
        const stats = fs.statSync(currentPath);
        if (stats.isFile()) {
          if (!path.basename(currentPath).startsWith('.')) {
            allFiles.push(currentPath);
          }
        } else if (stats.isDirectory()) {
          const items = fs.readdirSync(currentPath);
          items.forEach(item => {
            if (!item.startsWith('.') && item !== 'node_modules') {
              scanRecursively(path.join(currentPath, item));
            }
          });
        }
      } catch (e) {
        console.warn(`[Main] Błąd dostępu do: ${currentPath}`, e);
      }
    };

    filePaths.forEach(p => scanRecursively(p));
    return allFiles;
  });

  // WATCHER
  ipcMain.handle('start-watching', (_event, dirPath) => {
    if (fileWatcher) fileWatcher.close();
    fileWatcher = chokidar.watch(dirPath, { ignoreInitial: true, depth: 3 });
    fileWatcher.on('all', (eventName, filePath) => {
      BrowserWindow.getAllWindows().forEach(win => win.webContents.send('dir-changed'));

      if (eventName === 'unlink') {
        const meta = metadataManager.getFile(filePath);
        if (meta) {
          //console.log(`[Sync] Wykryto usunięcie zindeksowanego pliku: ${filePath}`);
          BrowserWindow.getAllWindows().forEach(win => win.webContents.send('file-missing', filePath));
        }
      } 
      else if (eventName === 'add') {
        const meta = metadataManager.getFile(filePath);
        if (!meta) {
          //console.log(`[Sync] Wykryto nowy, niezindeksowany plik: ${filePath}`);
          BrowserWindow.getAllWindows().forEach(win => 
            win.webContents.send('new-file-detected', filePath)
          );
        }
      }
    });
    return true;
  });

  // WYKONANIE ORGANIZACJI (PRZENOSZENIE PLIKÓW)
  ipcMain.handle('apply-organization', async (_event, tasks: any[]) => {
    //console.log(`[Main] Przenoszenie ${tasks.length} plików...`);
    const results: any[] = [];
    
    // Pobieramy rootDir z ustawień
    let rootDir = '';
    try {
      if (fs.existsSync(configPath)) {
        const settings = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        rootDir = settings.rootDir;
      }
    } catch (e) { console.error(e); }

    if (!rootDir) return { success: false, message: 'Brak katalogu roboczego w ustawieniach!' };

    for (const task of tasks) {
      // task to obiekt: { originalPath, category, suggestedName }
      try {
        if (!fs.existsSync(task.originalPath)) {
          results.push({ path: task.originalPath, status: 'error', error: 'Plik źródłowy nie istnieje' });
          continue;
        }

        // 1. Budujemy ścieżkę docelową
        // rootDir + Kategoria (np. Finanse/Faktury)
        const targetDir = path.join(rootDir, task.category);
        
        // 2. Tworzymy foldery (jeśli nie istnieją)
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // 3. Obsługa duplikatów nazw
        let finalName = task.suggestedName;
        let targetPath = path.join(targetDir, finalName);
        let counter = 1;

        // Dopóki plik istnieje, dodajemy _1, _2 itd.
        while (fs.existsSync(targetPath)) {
          const ext = path.extname(task.suggestedName);
          const name = path.basename(task.suggestedName, ext);
          finalName = `${name}_${counter}${ext}`;
          targetPath = path.join(targetDir, finalName);
          counter++;
        }

        // 4. Przenoszenie (Rename)
        fs.renameSync(task.originalPath, targetPath);
        
        // 5. Aktualizacja bazy metadanych (MetadataManager)
        // Usuwamy stary wpis i dodajemy nowy
        metadataManager.removeFile(task.originalPath);
        metadataManager.addOrUpdateFile(targetPath, {
          type: task.metadata.type,
          tags: task.metadata.tags || [],
          attributes: task.metadata.attributes || {}
        });

        metadataManager.addHistory({
          fileName: path.basename(task.originalPath),
          originalPath: task.originalPath,
          newPath: targetPath
        });

        results.push({ path: task.originalPath, status: 'success', newPath: targetPath });

      } catch (error: any) {
        console.error(`Błąd przenoszenia ${task.originalPath}:`, error);
        results.push({ path: task.originalPath, status: 'error', error: error.message });
      }
    }

    return { success: true, results };
  });

  // HISTORIA I UNDO
  
  ipcMain.handle('get-history', () => {
    return metadataManager.getHistory();
  });

  ipcMain.handle('undo-operation', async (_event, historyId: string) => {
    const entry = metadataManager.getHistoryEntry(historyId);
    if (!entry) return { success: false, message: 'Nie znaleziono wpisu w historii' };

    try {
      if (!fs.existsSync(entry.newPath)) {
        return { success: false, message: 'Plik został już usunięty lub przeniesiony ręcznie.' };
      }

      if (fs.existsSync(entry.originalPath)) {
        return { success: false, message: 'W starej lokalizacji istnieje już plik o tej nazwie.' };
      }

      fs.renameSync(entry.newPath, entry.originalPath);

      const currentMeta = metadataManager.getFile(entry.newPath);
      metadataManager.removeFile(entry.newPath);
      
      if (currentMeta) {
        metadataManager.addOrUpdateFile(entry.originalPath, {
            type: currentMeta.type,
            tags: currentMeta.tags,
            attributes: currentMeta.attributes
        });
      }

      metadataManager.removeHistoryEntry(historyId);

      return { success: true };

    } catch (error: any) {
      console.error('Błąd undo:', error);
      return { success: false, message: error.message };
    }
  });

  // ANALIZA PLIKÓW
  ipcMain.handle('analyze-files', async (_event, filePaths: string[]) => {
    //console.log(`[Main] Start analizy ${filePaths.length} plików. Limit wątków: ${CONCURRENCY_LIMIT}`);

    let apiKey = '';
    let customInstructions = '';
    try {
      if (fs.existsSync(configPath)) {
        const settings = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (settings.apiKey) apiKey = decryptApiKey(settings.apiKey);
        if (settings.customInstructions) customInstructions = settings.customInstructions;
      }
    } catch (e) { console.error(e); }

    if (!apiKey) throw new Error('Brak klucza API!');

    const analyzeSingleFile = async (filePath: string) => {
      try {
        const text = await parseFileContent(filePath);
        if (!text) {
          return { path: filePath, status: 'error', error: 'Brak tekstu / OCR' };
        }

        const aiData = await analyzeContentWithAI(text, apiKey, customInstructions);

        if (aiData) {
          // Normalizacja Kategorii
          if (aiData.category) {
            aiData.category = aiData.category
              .replace(/\s*->\s*/g, '/')
              .replace(/\\/g, '/');
          }

          // STRAŻNIK ROZSZERZEŃ (Naprawa problemu .docx -> .json)
          const originalExt = path.extname(filePath); // np. .docx
          let newName = aiData.suggestedName;

          // Jeśli AI mimo zakazu dodało rozszerzenie, usuwamy je
          if (path.extname(newName)) {
              newName = path.parse(newName).name;
          }

          // Doklejamy ORYGINALNE rozszerzenie
          aiData.suggestedName = `${newName}${originalExt}`;

          return { path: filePath, status: 'success', data: aiData };
        } else {
          return { path: filePath, status: 'error', error: 'Błąd AI' };
        }
      } catch (err: any) {
        return { path: filePath, status: 'error', error: err.message };
      }
    };

    const results = await processWithConcurrency(filePaths, CONCURRENCY_LIMIT, analyzeSingleFile);
    
    //console.log(`[Main] Zakończono analizę ${results.length} plików.`);
    return results;
  });
  
  // Zwraca listę niezindeksowanych plików w folderze roboczym
  ipcMain.handle('check-folder-status', (_event, _rootDir) => {
     // Tutaj prosta logika:
     // 1. Pobierz wszystkie pliki z dysku (getFileTree)
     // 2. Pobierz wszystkie pliki z bazy (metadataManager)
     // 3. Porównaj i zwróć różnice
     // To zadanie dla Ciebie na później, na razie można zwrócić prosty raport z healthCheck
     return metadataManager.performHealthCheck();
  });

  // Ręczne czyszczenie
  ipcMain.handle('cleanup-metadata', () => {
    return metadataManager.cleanUp();
  });

  // OPERACJE SYSTEMOWE NA PLIKACH
  
  ipcMain.handle('open-file', (_event, path) => {
    shell.openPath(path);
  });

  ipcMain.handle('show-in-folder', (_event, path) => {
    shell.showItemInFolder(path);
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})