import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { AnalysisPanel } from './components/AnalysisPanel';
import { SettingsModal } from './components/SettingsModal';
import { Toaster, Toast } from './components/Toaster';
import { HelpModal } from './components/HelpModal';
import { HistoryModal } from './components/HistoryModal';

function App(): JSX.Element {
  // --- Stan Globalny Aplikacji ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      // Używamy nowej metody getSettings
      const settings = await window.api.getSettings();
      if (settings?.apiKey) {
        setApiKey(settings.apiKey);
      }
    };
    loadSettings();
  }, []);

  const handleSaveKey = async () => {
    // Używamy nowej metody saveSettings (scala z istniejącymi, więc nie usunie rootDir)
    await window.api.saveSettings({ apiKey });
    setIsSettingsOpen(false);
  };

  const addToast = (type: Toast['type'], title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);

    // Auto-usuwanie po 5 sekundach
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Efekt nasłuchujący zdarzeń z backendu (Watcher)
  useEffect(() => {
    const removeListener = window.api.onSyncEvent((type, path) => {
      const fileName = path.split(/[/\\]/).pop();

      if (type === 'new') {
        addToast('new', 'Wykryto nowy plik', `Dodano do indeksu: ${fileName}`);
      } else if (type === 'missing') {
        addToast('missing', 'Plik usunięty', `Usunięto z indeksu: ${fileName}`);
      }
    });

    return () => removeListener();
  }, []);

  return (
    <div className="h-screen w-full bg-gray-950 text-white flex flex-col font-sans overflow-hidden">
      
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)} 
      />

      <div className="flex flex-1 overflow-hidden">
        
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Przekazujemy stan w dół do komponentów */}
          <Dropzone
            files={files} 
            setFiles={setFiles} 
            onAnalyze={() => console.log('Tu będzie start analizy')}
          />
          <AnalysisPanel files={files} />
        </div>
      </div>

      <Toaster toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSave={handleSaveKey}
      />

      <HelpModal
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
    </div>
  );
}

export default App;