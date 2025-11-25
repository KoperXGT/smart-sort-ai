import { AlertCircle, Cpu } from 'lucide-react';

interface AnalysisPanelProps {
  file: File | null;
}

export const AnalysisPanel = ({ file }: AnalysisPanelProps) => {
  return (
    <div className="h-3/5 p-6 bg-gray-950 flex flex-col">
      <h2 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Analiza i Sugestie</h2>
      
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"></div>

        {file ? (
          <div className="space-y-6 max-w-md w-full animate-in slide-in-from-bottom-4 duration-500">
             <div className="text-left space-y-2">
               <p className="text-gray-400 text-sm">Status analizy:</p>
               <div className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full absolute top-0 left-0 animate-ping opacity-75"></div>
                  </div>
                  <span className="text-gray-300 text-sm font-medium">Oczekiwanie na start...</span>
               </div>
             </div>

             <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
               <Cpu className="w-5 h-5" />
               Uruchom Inteligentną Analizę
             </button>
          </div>
        ) : (
          <div className="opacity-50 select-none">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 font-medium">Oczekiwanie na plik...</p>
            <p className="text-gray-700 text-sm mt-1 max-w-xs mx-auto">Wgraj dokument w sekcji powyżej, aby zobaczyć magię AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};