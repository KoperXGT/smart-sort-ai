import { app, safeStorage } from 'electron';
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

export class MetadataManager {
  private dbPath: string;
  private data: Record<string, FileMeta> = {}; // Kluczem jest ścieżka do pliku

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'metadata.json');
    this.load();
  }

  // Ładowanie bazy z dysku
  private load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Błąd ładowania bazy metadanych:', e);
      this.data = {};
    }
  }

  // Zapis bazy na dysk
  private save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Błąd zapisu bazy metadanych:', e);
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
    const stats = fs.statSync(filePath);

    this.data[filePath] = {
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
    return this.data[filePath];
  }

  public removeFile(filePath: string) {
    if (this.data[filePath]) {
      delete this.data[filePath];
      this.save();
    }
  }

  public getAllFiles() {
    return this.data;
  }

  // --- SYNC LOGIC (Health Check) ---
  
  // Sprawdza spójność bazy z rzeczywistością
  public performHealthCheck() {
    const report = {
      missingFiles: [] as string[],
      orphanedMetadata: 0
    };

    // 1. Sprawdź czy pliki z bazy istnieją
    for (const filePath in this.data) {
      if (!fs.existsSync(filePath)) {
        report.missingFiles.push(filePath);
      }
    }

    return report;
  }

  // Czyszczenie bazy z nieistniejących plików
  public cleanUp() {
    const report = this.performHealthCheck();
    report.missingFiles.forEach(path => {
      delete this.data[path];
    });
    this.save();
    return report.missingFiles.length;
  }
}