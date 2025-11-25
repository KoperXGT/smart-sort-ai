import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { AnalysisPanel } from './components/AnalysisPanel';
import { SettingsModal } from './components/SettingsModal';

function App(): JSX.Element {
  // --- Stan Globalny Aplikacji ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState<File | null>(null);

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

  return (
    <div className="h-screen w-full bg-gray-950 text-white flex flex-col font-sans overflow-hidden">
      
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Przekazujemy stan w dół do komponentów */}
          <Dropzone file={file} setFile={setFile} />
          <AnalysisPanel file={file} />
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSave={handleSaveKey}
      />
    </div>
  );
}

export default App;