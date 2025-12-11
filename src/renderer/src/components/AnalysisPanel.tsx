import { useState } from 'react';
import { AlertCircle, Cpu, Layers, Loader2, CheckCircle, ArrowRight, FolderEdit, FileSignature } from 'lucide-react';

interface AnalysisPanelProps {
  files: string[];
}

export const AnalysisPanel = ({ files }: AnalysisPanelProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // --- LOGIKA EDYCJI ---
  // Ta funkcja pozwala edytować wyniki AI przed zatwierdzeniem
  const handleResultChange = (index: number, field: 'category' | 'suggestedName', value: string) => {
    setResults(prevResults => {
      const newResults = [...prevResults];
      // Aktualizujemy konkretne pole w obiekcie data
      if (newResults[index] && newResults[index].data) {
        newResults[index].data[field] = value;
      }
      return newResults;
    });
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setResults([]);
    setIsFinished(false);
    
    try {
      const data = await window.api.analyzeFiles(files);
      setResults(data);
    } catch (error) {
      console.error("Błąd analizy:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = async () => {
    setIsMoving(true);
    // Wysyłamy do backendu to, co jest aktualnie w stanie 'results' (nawet jeśli użytkownik to zmienił)
    const tasks = results
      .filter(r => r.status === 'success')
      .map(r => ({
        originalPath: r.path,
        category: r.data.category,
        suggestedName: r.data.suggestedName,
        metadata: r.data.metadata
      }));

    if (tasks.length === 0) {
        setIsMoving(false);
        return;
    }

    try {
      await window.api.applyOrganization(tasks);
      setIsFinished(true);
      setResults([]); 
    } catch (error) {
      console.error("Błąd przenoszenia:", error);
      alert("Wystąpił błąd podczas przenoszenia plików.");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="h-3/5 p-6 bg-gray-950 flex flex-col">
      <h2 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">2. Weryfikacja i Akcja</h2>
      
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col items-center relative overflow-hidden overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"></div>

        {/* EKRAN SUKCESU */}
        {isFinished ? (
           <div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-300">
             <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
               <CheckCircle className="w-8 h-8 text-green-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Gotowe!</h3>
             <p className="text-gray-400 text-sm text-center max-w-xs">
               Pliki zostały przeniesione zgodnie z Twoimi ustaleniami.
             </p>
             <button 
               onClick={() => setIsFinished(false)}
               className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-medium"
             >
               Sortuj kolejne pliki
             </button>
           </div>
        ) : files.length > 0 || results.length > 0 ? (
          <div className="space-y-6 max-w-md w-full animate-in slide-in-from-bottom-4 duration-500 w-full">
             
             {/* START */}
             {!isAnalyzing && results.length === 0 && (
               <>
                 <div className="text-left space-y-2">
                   <p className="text-gray-400 text-sm">Dokumenty w kolejce: {files.length}</p>
                 </div>
                 <button 
                   onClick={handleAnalyze}
                   className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                 >
                   <Cpu className="w-5 h-5" />
                   Analizuj i Sugeruj
                 </button>
               </>
             )}

             {/* LOADING */}
             {(isAnalyzing || isMoving) && (
               <div className="text-center py-10">
                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                 <p className="text-gray-300 font-medium">
                   {isAnalyzing ? 'AI przygotowuje propozycje...' : 'Wdrażanie zmian...'}
                 </p>
               </div>
             )}

             {/* WYNIKI DO EDYCJI */}
             {!isMoving && results.length > 0 && (
               <div className="space-y-4 w-full">
                 <div className="flex justify-between items-center px-1">
                    <h3 className="text-blue-400 font-bold text-sm">Zweryfikuj propozycje:</h3>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Możesz edytować pola</span>
                 </div>
                 
                 <div className="max-h-80 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-700 pb-2">
                   {results.map((res, idx) => (
                     <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-left text-xs relative group hover:border-blue-500/30 transition-colors">
                       
                       {/* Nazwa oryginalna (tylko do info) */}
                       <div className="mb-3 pb-2 border-b border-gray-700/50">
                          <p className="text-[10px] text-gray-500 uppercase">Oryginał</p>
                          <p className="font-medium text-gray-300 truncate" title={res.path}>
                            {res.path.split(/[/\\]/).pop()}
                          </p>
                       </div>

                       {res.status === 'success' ? (
                         <div className="space-y-3">
                           {/* Edycja Kategorii */}
                           <div>
                             <label className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                               <FolderEdit className="w-3 h-3 text-blue-400" />
                               Folder Docelowy
                             </label>
                             <input 
                               type="text"
                               value={res.data.category}
                               onChange={(e) => handleResultChange(idx, 'category', e.target.value)}
                               className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-blue-100 focus:border-blue-500 focus:outline-none transition-colors font-mono text-xs"
                             />
                           </div>

                           {/* Edycja Nazwy */}
                           <div>
                             <label className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                               <FileSignature className="w-3 h-3 text-green-400" />
                               Nowa Nazwa
                             </label>
                             <input 
                               type="text"
                               value={res.data.suggestedName}
                               onChange={(e) => handleResultChange(idx, 'suggestedName', e.target.value)}
                               className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-green-100 focus:border-green-500 focus:outline-none transition-colors font-mono text-xs"
                             />
                           </div>
                         </div>
                       ) : (
                         <p className="text-red-400 flex items-center gap-2">
                           <AlertCircle className="w-4 h-4" /> 
                           Błąd: {res.error}
                         </p>
                       )}
                     </div>
                   ))}
                 </div>

                 <div className="flex gap-3 pt-2 bg-gray-900 z-10 sticky bottom-0">
                   <button 
                     onClick={() => setResults([])} 
                     className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors border border-gray-700"
                   >
                     Odrzuć
                   </button>
                   <button 
                     onClick={handleApply}
                     className="flex-[2] py-2.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-semibold shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                   >
                     <ArrowRight className="w-4 h-4" />
                     Zatwierdź Zmiany
                   </button>
                 </div>
               </div>
             )}
          </div>
        ) : (
          <div className="opacity-50 select-none text-center mt-10">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Layers className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 font-medium">Brak plików do weryfikacji</p>
          </div>
        )}
      </div>
    </div>
  );
};