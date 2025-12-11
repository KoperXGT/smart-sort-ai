import { X, HelpCircle, FolderOpen, UploadCloud, Cpu, BrainCircuit, ShieldCheck, History, FileCode, Sliders, RefreshCw } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-[700px] shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Nagłówek */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-400" /> 
            Centrum Pomocy
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Treść (Scrollowalna) */}
        <div className="p-6 overflow-y-auto space-y-8 text-gray-300 scrollbar-thin scrollbar-thumb-gray-600">
          
          {/* SEKJA 1: INSTRUKCJA KROK PO KROKU */}
          <section className="space-y-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Szybki Start</h4>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600 text-blue-400 font-bold text-sm">1</div>
              <div>
                <h4 className="text-white font-medium mb-1 flex items-center gap-2 text-sm">
                  <FolderOpen className="w-4 h-4 text-blue-400" /> Wybierz Katalog Roboczy
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Wskaż folder w panelu bocznym. To tam aplikacja będzie tworzyć strukturę i przenosić pliki.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600 text-blue-400 font-bold text-sm">2</div>
              <div>
                <h4 className="text-white font-medium mb-1 flex items-center gap-2 text-sm">
                  <UploadCloud className="w-4 h-4 text-blue-400" /> Wgraj Dokumenty
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Przeciągnij pliki lub całe foldery do strefy zrzutu. Obsługujemy PDF, Word, TXT oraz pliki kodu.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600 text-blue-400 font-bold text-sm">3</div>
              <div>
                <h4 className="text-white font-medium mb-1 flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-blue-400" /> Analiza i Akceptacja
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  AI zaproponuje nazwy i kategorie. Możesz je ręcznie edytować przed kliknięciem "Zatwierdź".
                </p>
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-700 w-full"></div>

          {/* SEKCJA 2: MOŻLIWOŚCI (FEATURE LIST) */}
          <section>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Możliwości Aplikacji</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* KAFELETEK 1 */}
              <div className="bg-gray-750/50 p-3 rounded-lg border border-gray-700 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-blue-300">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="font-semibold text-sm">Inteligentny Kontekst</span>
                </div>
                <p className="text-xs text-gray-400">
                  AI nie tylko czyta nazwy, ale analizuje treść dokumentów, aby zrozumieć ich sens (np. rozpoznaje fakturę po treści, a nie rozszerzeniu).
                </p>
              </div>

              {/* KAFELETEK 2 */}
              <div className="bg-gray-750/50 p-3 rounded-lg border border-gray-700 hover:border-green-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-green-400">
                  <History className="w-4 h-4" />
                  <span className="font-semibold text-sm">Bezpieczne Cofanie</span>
                </div>
                <p className="text-xs text-gray-400">
                  Popełniłeś błąd? Użyj historii operacji (ikona zegara), aby jednym kliknięciem przywrócić pliki na stare miejsce.
                </p>
              </div>

              {/* KAFELETEK 3 */}
              <div className="bg-gray-750/50 p-3 rounded-lg border border-gray-700 hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-sm">Prywatność i Szyfrowanie</span>
                </div>
                <p className="text-xs text-gray-400">
                  Twój klucz API jest szyfrowany lokalnie. Aplikacja nie wysyła Twoich plików na żadne zewnętrzne serwery poza API OpenAI.
                </p>
              </div>

              {/* KAFELETEK 4 */}
              <div className="bg-gray-750/50 p-3 rounded-lg border border-gray-700 hover:border-orange-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-orange-400">
                  <FileCode className="w-4 h-4" />
                  <span className="font-semibold text-sm">Wsparcie Formatów</span>
                </div>
                <p className="text-xs text-gray-400">
                  Obsługa dokumentów biurowych (PDF, DOCX) oraz plików programistycznych (Python, JS, C++, Java i inne).
                </p>
              </div>

              {/* KAFELETEK 5 */}
              <div className="bg-gray-750/50 p-3 rounded-lg border border-gray-700 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-cyan-400">
                  <RefreshCw className="w-4 h-4" />
                  <span className="font-semibold text-sm">Live Watcher</span>
                </div>
                <p className="text-xs text-gray-400">
                  Aplikacja obserwuje folder roboczy w czasie rzeczywistym. Jeśli dodasz lub usuniesz plik w systemie, zmiany od razu pojawią się w drzewie.
                </p>
              </div>

              {/* KAFELETEK 6 */}
              <div className="bg-gray-750/50 p-3 rounded-lg border border-gray-700 hover:border-pink-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-pink-400">
                  <Sliders className="w-4 h-4" />
                  <span className="font-semibold text-sm">Pełna Personalizacja</span>
                </div>
                <p className="text-xs text-gray-400">
                  W ustawieniach możesz zdefiniować własne instrukcje dla AI, np. "Faktury wrzucaj do folderu Koszty 2025".
                </p>
              </div>

            </div>
          </section>

        </div>

        {/* Stopka */}
        <div className="p-4 border-t border-gray-700 flex justify-end shrink-0 bg-gray-800/50 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};