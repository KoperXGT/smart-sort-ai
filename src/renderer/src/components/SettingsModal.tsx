import { useState } from 'react';
import { Settings, X, Save, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onSave: () => void;
}

export const SettingsModal = ({ isOpen, onClose, apiKey, setApiKey, onSave }: SettingsModalProps) => {
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-96 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" /> Ustawienia
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">OpenAI API Key</label>
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"} 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-3 pr-10 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                type="button"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Klucz jest zapisywany tylko lokalnie.</p>
          </div>
          <button 
            onClick={onSave}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" /> Zapisz
          </button>
        </div>
      </div>
    </div>
  );
};