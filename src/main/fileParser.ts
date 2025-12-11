import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { createRequire } from 'module';

// Native require (bez bundlera) do pdf-parse
const nativeRequire = createRequire(import.meta.url);
const isClass = (fn: any) => {
  if (typeof fn !== 'function') return false;
  const src = Function.prototype.toString.call(fn);
  return /^class\s/.test(src);
};
const flattenCandidates = (val: any) => [val, val?.default, val?.default?.default, val?.PDFParse, val?.default?.PDFParse];

let pdfLib: any;
try {
  pdfLib = nativeRequire('pdf-parse');
} catch (e) {
  console.error('Blad ladowania pdf-parse:', e);
}

const getPdfParser = (): null | ((buffer: Buffer) => Promise<any>) => {
  const candidates = flattenCandidates(pdfLib);

  // Funkcja bezklasowa (najprostszy przypadek)
  const fnCandidate = candidates.find((c) => typeof c === 'function' && !isClass(c)) as
    | ((buffer: Buffer) => Promise<any>)
    | undefined;
  if (fnCandidate) return fnCandidate;

  // Klasa PDFParse (wymaga "new")
  const classCandidate = candidates.find((c) => typeof c === 'function' && isClass(c)) as any;
  if (classCandidate) {
    const Parser = classCandidate;
    return async (buffer: Buffer) => {
      const instance = new Parser({ data: buffer });
      if (typeof instance.getText === 'function') {
        const res = await instance.getText();
        return { text: res?.text ?? '' };
      }
      throw new Error('pdf-parse: PDFParse nie ma metody getText');
    };
  }

  return null;
};

// Zwrot potencjalnej klasy do fallbacku
const getPdfClassCandidate = (): any => {
  const candidates = flattenCandidates(pdfLib);
  return candidates.find((c) => typeof c === 'function');
};

export const parseFileContent = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();

  // 1. Pliki tekstowe
  const textExtensions = [
      '.txt', '.md', '.json', '.csv', '.xml', '.log', '.env',
      '.py', '.js', '.ts', '.tsx', '.jsx',
      '.java', '.c', '.cpp', '.cs', '.h',
      '.html', '.css', '.scss', '.sql', '.yaml', '.yml'
  ];

  if (textExtensions.includes(ext)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // 2. PDF
  if (ext === '.pdf') {
    const parsePdf = getPdfParser();
    if (!parsePdf) {
      throw new Error('Nie znaleziono funkcji parsujacej PDF (pdf-parse).');
    }

    const dataBuffer = fs.readFileSync(filePath);
    let data;
    try {
      data = await parsePdf(dataBuffer);
    } catch (err: any) {
      // Je�>li "funkcja" okaza�a si�t klas� i rzuci�a TypeError o braku new
      if (err && typeof err.message === 'string' && err.message.includes('Class constructor')) {
        const ClassCandidate = getPdfClassCandidate();
        if (ClassCandidate) {
          const instance = new (ClassCandidate as any)({ data: dataBuffer });
          if (typeof instance.getText === 'function') {
            const res = await instance.getText();
            data = { text: res?.text ?? '' };
          } else {
            throw new Error('pdf-parse: klasa nie ma metody getText (fallback).');
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (!data || !data.text || data.text.trim().length === 0) {
      console.warn(`[OCR] Pusty PDF: ${filePath}`);
      return '';
    }

    return data.text.replace(/\s+/g, ' ').trim().substring(0, 15000);
  }

  // 3. Word (.docx)
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.substring(0, 8000);
  }

  return '';
};
