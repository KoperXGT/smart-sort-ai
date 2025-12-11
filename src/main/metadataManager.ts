import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto'; // Do generowania hashy plików

// Typy danych
export interface FileMeta {
  path: string;
  hash: string; // Hash pozwala rozpoznać plik nawet jak zmieni nazwę
  type: string; // 'invoice', 'contract', 'unknown'
  tags: string[];
  attributes: Record<string, any>; // Elastyczne dane
  lastModified: number;
}

export interface HistoryEntry {
  id: string;           // Unikalne ID akcji
  timestamp: number;    // Kiedy to zrobiono
  fileName: string;     // Nazwa pliku (do wyświetlenia)
  originalPath: string; // Skąd zabraliśmy (A)
  newPath: string;      // Gdzie daliśmy (B)
}

export class MetadataManager {
  private dbPath: string;
  private data: { files: Record<string, FileMeta>; history: HistoryEntry[] } = {
    files: {},
    history: []
  };

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'metadata.json');
    this.load();
  }

  // Ładowanie bazy z dysku
  private load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Migracja danych (jeśli wcześniej plik miał inną strukturę)
        if (parsed.files) {
          this.data = parsed;
        } else {
          // Stara wersja (bez klucza 'files') - naprawiamy
          this.data = { files: parsed, history: [] };
        }
      }
    } catch (e) {
      console.error('Błąd ładowania bazy:', e);
      this.data = { files: {}, history: [] };
    }
  }

  // Zapis bazy na dysk
  private save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Błąd zapisu bazy:', e);
    }
  }

  // Generowanie hasha pliku (Unikalny odcisk palca)
  public generateFileHash(filePath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (e) {
      return '';
    }
  }

  // --- CRUD Operations ---

  public addOrUpdateFile(filePath: string, aiResult: any) {
    const hash = this.generateFileHash(filePath);
    let stats;
    try { stats = fs.statSync(filePath); } catch(e) { stats = { mtimeMs: Date.now() }; }

    this.data.files[filePath] = {
      path: filePath,
      hash: hash,
      type: aiResult.type || 'unknown',
      tags: aiResult.tags || [],
      attributes: aiResult.attributes || {},
      lastModified: stats.mtimeMs
    };
    this.save();
  }

  public getFile(filePath: string) {
    return this.data.files[filePath];
  }

  public removeFile(filePath: string) {
    if (this.data.files[filePath]) {
      delete this.data.files[filePath];
      this.save();
    }
  }

  public getAllFiles() {
    return this.data;
  }

  public addHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(), // Generujemy unikalne ID
      timestamp: Date.now()
    };
    // Dodajemy na początek listy (najnowsze na górze)
    this.data.history.unshift(newEntry);
    
    // Ograniczamy historię do np. ostatnich 50 akcji (żeby plik nie puchł)
    if (this.data.history.length > 50) {
      this.data.history = this.data.history.slice(0, 50);
    }
    this.save();
  }

  public getHistory() {
    return this.data.history;
  }

  public getHistoryEntry(id: string) {
    return this.data.history.find(h => h.id === id);
  }

  public removeHistoryEntry(id: string) {
    this.data.history = this.data.history.filter(h => h.id !== id);
    this.save();
  }

  // --- SYNC LOGIC (Health Check) ---
  
  // Sprawdza spójność bazy z rzeczywistością
  public performHealthCheck() {
    const report = { missingFiles: [] as string[] };
    for (const filePath in this.data.files) {
      if (!fs.existsSync(filePath)) report.missingFiles.push(filePath);
    }
    return report;
  }

  public cleanUp() {
    const report = this.performHealthCheck();
    report.missingFiles.forEach(path => delete this.data.files[path]);
    this.save();
    return report.missingFiles.length;
  }
}