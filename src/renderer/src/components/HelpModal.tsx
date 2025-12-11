import { X, HelpCircle, FolderOpen, UploadCloud, Cpu, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-[600px] shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Nagłówek */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-400" /> 
            Jak korzystać z programu?
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Treść (Scrollowalna) */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-300">
          
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600 text-blue-400 font-bold">1</div>
            <div>
              <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-400" />
                Wybierz Katalog Roboczy
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                W panelu bocznym po lewej stronie kliknij przycisk <b>"Wybierz Katalog"</b>. 
                To tutaj aplikacja będzie tworzyć nowe foldery (np. <i>Finanse</i>, <i>Dom</i>) i przenosić Twoje pliki.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600 text-blue-400 font-bold">2</div>
            <div>
              <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                Wgraj Dokumenty
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Przeciągnij pliki (PDF, DOCX, TXT) lub całe foldery do strefy <b>"Wgraj dokumenty"</b>. 
                Możesz też kliknąć w strefę zrzutu, aby otworzyć eksplorator plików.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600 text-blue-400 font-bold">3</div>
            <div>
              <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Uruchom Analizę AI
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Kliknij przycisk <b>"Rozpocznij Sortowanie"</b>. Sztuczna inteligencja przeanalizuje treść plików 
                i zaproponuje dla nich nowe nazwy oraz kategorie.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600 text-blue-400 font-bold">4</div>
            <div>
              <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                Zweryfikuj i Zatwierdź
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Zobaczysz listę propozycji. Możesz <b>ręcznie edytować</b> nazwy folderów i plików, jeśli propozycja AI Ci nie odpowiada. 
                Gdy wszystko jest gotowe, kliknij <b>"Zatwierdź i Przenieś"</b>.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-200">
              ℹ️ <b>Wskazówka:</b> Pamiętaj, aby w ustawieniach (ikona trzech kropek) wpisać swój klucz API OpenAI, inaczej analiza nie zadziała.
            </p>
          </div>

        </div>

        {/* Stopka */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
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