import { useState, Dispatch, SetStateAction } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';

interface DropzoneProps {
  files: string[];
  setFiles: Dispatch<SetStateAction<string[]>>;
}

export const Dropzone = ({ files, setFiles }: DropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- LOGIKA DODAWANIA PLIKÓW ---

  const handlePaths = async (rawPaths: string[]) => {
    setIsProcessing(true);
    try {
      const result = await window.api.processPaths(rawPaths);
      
      const flatFiles = Array.isArray(result) ? result : [];
      
      if (flatFiles.length === 0) {
        console.warn('Backend nie zwrócił żadnych plików.');
      }
      setFiles((prev: string[]) => Array.from(new Set([...prev, ...flatFiles])));
    } catch (error) {
      console.error("Błąd przetwarzania plików:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // NAPRAWA: Używamy bezpiecznej metody z preloadera do wyciągnięcia ścieżki
      const filesArray = Array.from(e.dataTransfer.files);
      const paths = filesArray.map((f: File) => window.api.getFilePath(f));
      
      //console.log('Frontend: Wykryte ścieżki:', paths); // Debug: Zobaczysz czy nie są puste

      // Filtrujemy, żeby nie wysłać przypadkiem pustych stringów
      const validPaths = paths.filter(p => p && p.length > 0);
      
      if (validPaths.length > 0) {
        await handlePaths(validPaths);
      } else {
        console.error('Frontend: Nie udało się odczytać ścieżek plików.');
      }
    }
  }
  
  const handleClick = async () => {
    const selectedPaths = await window.api.selectDocuments();
    if (selectedPaths.length > 0) {
      await handlePaths(selectedPaths);
    }
  };

  const removeFile = (pathToRemove: string) => {
    setFiles(files.filter(f => f !== pathToRemove));
  };

  // --- RENDEROWANIE ---

  // Pomocnik do wyświetlania samej nazwy pliku ze ścieżki
  const getFileName = (path: string) => path.split(/[/\\]/).pop();

  return (
    <div className="h-2/5 p-6 border-b border-gray-800 bg-gray-900/30 flex flex-col relative">
      <h2 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">1. Wgraj dokumenty</h2>

      {/* STREFA ZRZUTU / LISTA */}
      <div 
        onClick={handleClick} // Kliknięcie otwiera eksplorator
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        className={`
          flex-1 border-2 border-dashed rounded-xl transition-all relative overflow-hidden flex flex-col
          ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[0.99]' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 cursor-pointer'}
        `}
      >
        {files.length === 0 ? (
          // STAN PUSTY
          <div className="flex-1 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className={`p-4 rounded-full bg-gray-800/50 mb-4 transition-transform ${isDragging ? 'scale-110 text-blue-400' : 'text-gray-400'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-gray-300 font-medium">Kliknij lub przeciągnij pliki</p>
            <p className="text-gray-600 text-sm mt-1">Obsługujemy też całe foldery!</p>
            {isProcessing && <p className="text-blue-400 text-xs mt-2 animate-pulse">Przetwarzanie...</p>}
          </div>
        ) : (
          // LISTA PLIKÓW
          <div className="flex flex-col h-full">
            {/* Scrollowalna lista */}
            <div 
              className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700"
              onClick={(e) => e.stopPropagation()} // Żeby kliknięcie w puste miejsce na liście nie otwierało eksploratora
            >
              {files.map((path) => (
                <div key={path} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 group animate-in slide-in-from-bottom-2 fade-in">
                  <div className="p-2 bg-gray-900 rounded text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate font-medium" title={path}>{getFileName(path)}</p>
                    <p className="text-[10px] text-gray-500 truncate">{path}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(path); }}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Przycisk dodawania kolejnych na dole listy */}
              <div 
                onClick={handleClick}
                className="flex items-center justify-center gap-2 p-3 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="text-xs font-medium">Dodaj więcej plików...</span>
              </div>
            </div>

            {/* Stopka z podsumowaniem */}
            <div className="p-3 bg-gray-900/80 border-t border-gray-800 flex justify-between items-center shrink-0">
              <span className="text-xs text-gray-400">
                Wybrano: <strong className="text-white">{files.length}</strong> plików
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setFiles([]); }}
                className="text-xs text-red-400 hover:underline"
              >
                Wyczyść wszystko
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};