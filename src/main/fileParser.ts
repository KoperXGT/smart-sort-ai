import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { createRequire } from 'module'; // 1. Importujemy natywny moduł Node.js

// 2. Tworzymy "czystą" funkcję require, która omija Vite/Webpack
const nativeRequire = createRequire(import.meta.url);

// 3. Ładujemy pdf-parse używając natywnego mechanizmu
// To gwarantuje, że dostaniemy dokładnie to, co jest w node_modules
const pdf = nativeRequire('pdf-parse');

export const parseFileContent = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    // 1. Pliki tekstowe
    if (['.txt', '.md', '.json', '.csv', '.xml', '.log', '.py', '.js', '.ts', '.html', '.css'].includes(ext)) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    // 2. PDF
    if (ext === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        
        // Teraz wywołujemy 'pdf' załadowane przez nativeRequire
        const data = await pdf(dataBuffer);

        if (!data || !data.text || data.text.trim().length === 0) {
          console.warn(`[OCR Warning] Pusty PDF: ${filePath}`);
          return ''; 
        }

        return data.text.replace(/\s+/g, ' ').trim().substring(0, 8000);
      } catch (pdfError) {
        console.error('Błąd parsowania PDF:', pdfError);
        return '';
      }
    }

    // 3. Word (.docx)
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.substring(0, 8000);
    }

    return ''; 
  } catch (error) {
    console.error(`Błąd odczytu pliku ${filePath}:`, error);
    return '';
  }
};