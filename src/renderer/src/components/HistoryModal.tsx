import { useState, useEffect } from 'react';
import { X, History, RotateCcw, FileClock, ArrowRight } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal = ({ isOpen, onClose }: HistoryModalProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadHistory = async () => {
    const data = await window.api.getHistory();
    setHistory(data);
  };

  useEffect(() => {
    if (isOpen) loadHistory();
  }, [isOpen]);

  const handleUndo = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await window.api.undoOperation(id);
      if (result.success) {
        await loadHistory(); // Odśwież listę
      } else {
        alert(`Błąd: ${result.message}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-[600px] shadow-2xl max-h-[80vh] flex flex-col">
        
        {/* Nagłówek */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-orange-400" /> 
            Historia Operacji
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak historii operacji.</p>
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="bg-gray-900 border border-gray-700 p-4 rounded-lg flex items-center justify-between group hover:border-orange-500/30 transition-colors">
                
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-1">
                    <span className="truncate max-w-[150px]">{entry.fileName}</span>
                    <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded-full">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate max-w-[180px] text-red-400/70 line-through" title={entry.originalPath}>
                      {entry.originalPath.split(/[/\\]/).pop()}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-600" />
                    <span className="truncate max-w-[180px] text-green-400" title={entry.newPath}>
                      {entry.newPath.split(/[/\\]/).pop()}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handleUndo(entry.id)}
                  disabled={loadingId === entry.id}
                  className="p-2 bg-gray-800 hover:bg-orange-600 hover:text-white text-gray-400 rounded-lg transition-colors disabled:opacity-50"
                  title="Cofnij zmianę"
                >
                  <RotateCcw className={`w-4 h-4 ${loadingId === entry.id ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};