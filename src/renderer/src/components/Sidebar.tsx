import { useState, useEffect } from 'react';
import { Folder, FileText, FolderPlus, Settings2, ChevronRight, ChevronDown, Loader2, AlertCircle } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

// --- KOMPONENT WĘZŁA (Bez zmian) ---
const FileTreeNode = ({ node, level = 0 }: { node: FileNode; level?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingLeft = level * 12 + 8;

  if (!node.isDirectory) {
    return (
      <div className="flex items-center gap-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-gray-400 hover:text-gray-200 transition-colors" style={{ paddingLeft: `${paddingLeft}px` }}>
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate text-sm">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-gray-300 hover:text-white transition-colors group select-none" style={{ paddingLeft: `${paddingLeft}px` }}>
        {isOpen ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
        <Folder className={`w-4 h-4 shrink-0 ${isOpen ? 'text-blue-400' : 'text-blue-500/70'}`} />
        <span className="truncate text-sm font-medium">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div className="animate-in slide-in-from-left-2 duration-200 fade-in">
          {node.children.map((child) => <FileTreeNode key={child.path} node={child} level={level + 1} />)}
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNY SIDEBAR ---
export const Sidebar = () => {
  const [rootDir, setRootDir] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Domyślnie ładujemy przy starcie
  const [isError, setIsError] = useState(false);

  // Funkcja pobierająca drzewo
  const loadDirectoryStructure = async (path: string) => {
    try {
      setIsLoading(true);
      setIsError(false);
      const structure = await window.api.readDir(path)

      if (structure) {
        setTree(structure);
      } else {
        setIsError(true);
      }
    } catch (error) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicjalizacja
  useEffect(() => {
    const init = async () => {
      try {
        const settings = await window.api.getSettings();

        if (settings && settings.rootDir) {
          setRootDir(settings.rootDir);
          await loadDirectoryStructure(settings.rootDir);
          await window.api.startWatching(settings.rootDir);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Frontend: Błąd w init:", e);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // OBSERWATOR ZMIAN
  useEffect(() => {
    if (!rootDir) return;
    const removeListener = window.api.onDirChange(() => {
      loadDirectoryStructure(rootDir);
    });
    return () => { removeListener(); };
  }, [rootDir]);

  // WYBÓR FOLDERU
  const handleSelectFolder = async () => {
    const path = await window.api.selectDirectory();
    if (path) {
      setRootDir(path);
      setIsLoading(true); // Włączamy spinner od razu
      
      // Zapisujemy
      await window.api.saveSettings({ rootDir: path });
      
      // Ładujemy
      await loadDirectoryStructure(path);
      await window.api.startWatching(path);
    }
  };

  // RENDEROWANIE
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-2 text-gray-500 animate-in fade-in">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs">Wczytywanie...</span>
        </div>
      );
    }

    if (!rootDir) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
            <FolderPlus className="w-8 h-8 text-gray-500" />
          </div>
          <div>
            <p className="text-gray-300 font-medium">Wybierz Folder</p>
            <p className="text-gray-500 text-xs mt-1">Gdzie mamy robić porządki?</p>
          </div>
          <button onClick={handleSelectFolder} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors w-full">
            Wybierz Katalog
          </button>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-6 px-4">
           <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
           <p className="text-red-400 text-sm font-medium">Nie można odczytać folderu</p>
           <button onClick={() => loadDirectoryStructure(rootDir)} className="mt-2 text-xs bg-gray-800 border border-gray-700 px-3 py-1 rounded">Spróbuj ponownie</button>
        </div>
      );
    }

    if (tree) return <div className="space-y-1"><FileTreeNode node={tree} /></div>;
    return null;
  };

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex h-full">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center shrink-0">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate mr-2">
          {rootDir ? 'Katalog Roboczy' : 'Start'}
        </h2>
        {rootDir && (
          <button onClick={handleSelectFolder} title="Zmień folder" className="text-gray-500 hover:text-white hover:bg-gray-800 p-1 rounded transition-colors">
            <Settings2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 p-2">
        {renderContent()}
      </div>
      {rootDir && <div className="p-2 border-t border-gray-800 bg-gray-900 text-[10px] text-gray-600 truncate px-4 shrink-0" title={rootDir}>{rootDir}</div>}
    </div>
  );
};