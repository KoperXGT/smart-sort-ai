import { useState, useEffect } from 'react';
import { Settings, X, Save, Eye, EyeOff, MessageSquarePlus } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (type: 'success' | 'missing', title: string, message: string) => void;
}

export const SettingsModal = ({ isOpen, onClose, onShowToast }: SettingsModalProps) => {
  const [apiKey, setApiKey] = useState('');
  const [customInstructions, setCustomInstructions] = useState(''); // NOWE
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ładowanie ustawień przy otwarciu
  useEffect(() => {
    if (isOpen) {
      window.api.getSettings().then((settings) => {
        if (settings) {
          if (settings.apiKey) setApiKey(settings.apiKey);
          if (settings.customInstructions) setCustomInstructions(settings.customInstructions);
        }
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.api.saveSettings({ apiKey, customInstructions });
      onShowToast('success', 'Ustawienia', 'Zapisano pomyślnie.');
      onClose();
    } catch (e) {
      console.error(e);
      onShowToast('missing', 'Błąd', 'Nie udało się zapisać ustawień.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-[500px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" /> Ustawienia
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* SEKCJA 1: API KEY */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">OpenAI API Key</label>
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"} 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-3 pr-10 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-sm"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                type="button"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SEKCJA 2: PERSONALIZACJA AI (NOWE) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-green-400" />
              Własne instrukcje dla AI (Opcjonalne)
            </label>
            <textarea 
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Np.: Wszystkie faktury za paliwo wrzucaj do folderu 'Samochód'. Nazwy plików mają być pisane małymi literami."
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg p-3 text-white text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all resize-none leading-relaxed"
            />
            <p className="text-xs text-gray-500 mt-2">
              Tutaj możesz zdefiniować specyficzne reguły, których AI ma przestrzegać podczas sortowania Twoich plików.
            </p>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-wait text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save className="w-4 h-4" /> 
            {isSaving ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
          </button>
        </div>
      </div>
    </div>
  );
};