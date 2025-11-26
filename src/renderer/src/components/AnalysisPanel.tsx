import { useState } from 'react';
import { AlertCircle, Cpu, Layers, Loader2 } from 'lucide-react';

interface AnalysisPanelProps {
  files: string[];
}

export const AnalysisPanel = ({ files }: AnalysisPanelProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    setResults([]); // Reset poprzednich wyników
    
    try {
      // Wywołanie backendu
      const data = await window.api.analyzeFiles(files);
      console.log('Wyniki AI:', data);
      setResults(data);
    } catch (error) {
      console.error("Błąd analizy:", error);
      alert("Błąd analizy. Sprawdź klucz API w ustawieniach.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-3/5 p-6 bg-gray-950 flex flex-col">
      <h2 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">2. Analiza i Sugestie</h2>
      
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col items-center relative overflow-hidden overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"></div>

        {files.length > 0 ? (
          <div className="space-y-6 max-w-md w-full animate-in slide-in-from-bottom-4 duration-500 w-full">
             
             {/* PRZYCISK START */}
             {!isAnalyzing && results.length === 0 && (
               <>
                 <div className="text-left space-y-2">
                   <p className="text-gray-400 text-sm">Dokumenty w kolejce: {files.length}</p>
                 </div>
                 <button 
                   onClick={handleAnalyze}
                   className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                   <Cpu className="w-5 h-5" />
                   Rozpocznij Sortowanie
                 </button>
               </>
             )}

             {/* LOADING */}
             {isAnalyzing && (
               <div className="text-center py-10">
                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                 <p className="text-gray-300 font-medium">Sztuczna inteligencja czyta Twoje pliki...</p>
                 <p className="text-gray-500 text-xs mt-2">To może potrwać kilka sekund.</p>
               </div>
             )}

             {/* WYNIKI (Prosta lista na razie) */}
             {results.length > 0 && (
               <div className="space-y-3 w-full">
                 <h3 className="text-green-400 font-bold text-sm">Wyniki Analizy:</h3>
                 {results.map((res, idx) => (
                   <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-700 text-left text-xs">
                     <p className="font-bold text-gray-300 truncate mb-1">{res.path.split(/[/\\]/).pop()}</p>
                     {res.status === 'success' ? (
                       <div className="space-y-1 text-gray-400">
                         <p>📂 Folder: <span className="text-white">{res.data.category}</span></p>
                         <p>🏷️ Nazwa: <span className="text-white">{res.data.suggestedName}</span></p>
                         <p>💡 Info: {res.data.summary}</p>
                       </div>
                     ) : (
                       <p className="text-red-400">Błąd: {res.error}</p>
                     )}
                   </div>
                 ))}
                 <button 
                   onClick={() => setResults([])} 
                   className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                 >
                   Wróć
                 </button>
               </div>
             )}

          </div>
        ) : (
          // Stan pusty (bez zmian)
          <div className="opacity-50 select-none text-center mt-10">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Layers className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 font-medium">Kolejka pusta</p>
          </div>
        )}
      </div>
    </div>
  );
};