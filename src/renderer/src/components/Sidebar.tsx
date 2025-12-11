import { useState, useEffect, useMemo } from 'react';
import { Folder, FileText, FolderPlus, Settings2, ChevronRight, ChevronDown, Loader2, Search, ExternalLink, FolderOpen } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

// --- LOGIKA FILTROWANIA DRZEWA ---
// Rekurencyjna funkcja, która zwraca kopię drzewa zawierającą tylko pasujące elementy
const filterTree = (node: FileNode, query: string): FileNode | null => {
  if (!query) return node; // Brak zapytania -> zwracamy wszystko

  const lowerQuery = query.toLowerCase();
  
  // Jeśli to plik i nazwa pasuje -> zwracamy go
  if (!node.isDirectory) {
    return node.name.toLowerCase().includes(lowerQuery) ? node : null;
  }

  // Jeśli to folder -> filtrujemy dzieci
  if (node.children) {
    const filteredChildren = node.children
      .map(child => filterTree(child, query))
      .filter((child): child is FileNode => child !== null);

    // Zwracamy folder tylko jeśli:
    // 1. Sam pasuje do nazwy
    // 2. LUB ma w środku pasujące dzieci
    if (node.name.toLowerCase().includes(lowerQuery) || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
  }

  return null;
};

// --- KOMPONENT WĘZŁA (Z OBSŁUGĄ INTERAKCJI) ---
const FileTreeNode = ({ 
  node, 
  level = 0, 
  forceOpen = false,
  onContextMenu,
  onDoubleClick
}: { 
  node: FileNode; 
  level?: number;
  forceOpen?: boolean; // Czy wymusić otwarcie (przy wyszukiwaniu)
  onContextMenu: (e: React.MouseEvent, path: string) => void;
  onDoubleClick: (path: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingLeft = level * 12 + 8;

  // Jeśli forceOpen jest true (wyszukiwanie), zawsze trzymaj otwarte
  const isExpanded = forceOpen || isOpen;

  if (!node.isDirectory) {
    return (
      <div 
        onDoubleClick={() => onDoubleClick(node.path)}
        onContextMenu={(e) => onContextMenu(e, node.path)}
        className="flex items-center gap-2 py-1.5 hover:bg-gray-800 rounded cursor-pointer text-gray-400 hover:text-blue-300 transition-colors select-none"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate text-sm">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1.5 hover:bg-gray-800 rounded cursor-pointer text-gray-300 hover:text-white transition-colors group select-none"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
        )}
        <Folder className={`w-4 h-4 shrink-0 ${isExpanded ? 'text-blue-400' : 'text-blue-500/70'}`} />
        <span className="truncate text-sm font-medium">{node.name}</span>
      </div>
      
      {isExpanded && node.children && (
        <div className="animate-in slide-in-from-left-2 duration-200 fade-in">
          {node.children.map((child) => (
            <FileTreeNode 
              key={child.path} 
              node={child} 
              level={level + 1} 
              forceOpen={forceOpen}
              onContextMenu={onContextMenu}
              onDoubleClick={onDoubleClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNY KOMPONENT ---
export const Sidebar = () => {
  const [rootDir, setRootDir] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stan Menu Kontekstowego { visible, x, y, path }
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  // Zamykanie menu po kliknięciu gdziekolwiek
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const loadDirectoryStructure = async (path: string) => {
    try {
      setIsLoading(true);
      const structure = await window.api.readDir(path);
      setTree(structure || null);
    } catch (error) {
      console.error("Błąd drzewa:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      } catch (e) { setIsLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (!rootDir) return;
    const removeListener = window.api.onDirChange(() => loadDirectoryStructure(rootDir));
    return () => removeListener();
  }, [rootDir]);

  const handleSelectFolder = async () => {
    const path = await window.api.selectDirectory();
    if (path) {
      setRootDir(path);
      setIsLoading(true);
      await window.api.saveSettings({ rootDir: path });
      await loadDirectoryStructure(path);
      await window.api.startWatching(path);
    }
  };

  // Obliczamy przefiltrowane drzewo w locie
  const displayedTree = useMemo(() => {
    if (!tree) return null;
    return filterTree(tree, searchQuery);
  }, [tree, searchQuery]);

  // Handler prawego przycisku myszy
  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault(); // Blokujemy systemowe menu
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path: path
    });
  };

  // Handler dwukliku
  const handleDoubleClick = (path: string) => {
    window.api.openFile(path);
  };

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex h-full relative">
      
      {/* HEADER + SEARCH */}
      <div className="p-3 border-b border-gray-800 bg-gray-900/50 shrink-0 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate mr-2">
            {rootDir ? 'Katalog Roboczy' : 'Brak Katalogu'}
          </h2>
          {rootDir && (
            <button onClick={handleSelectFolder} title="Zmień folder" className="text-gray-500 hover:text-white hover:bg-gray-800 p-1 rounded transition-colors">
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pasek Wyszukiwania */}
        {rootDir && (
          <div className="relative">
            <input 
              type="text"
              placeholder="Szukaj plików..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-1.5 pl-8 pr-2 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
          </div>
        )}
      </div>

      {/* DRZEWO PLIKÓW */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 p-2 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Wczytywanie...</span>
          </div>
        ) : !rootDir ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
              <FolderPlus className="w-8 h-8 text-gray-500" />
            </div>
            <button onClick={handleSelectFolder} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors w-full">
              Wybierz Katalog
            </button>
          </div>
        ) : displayedTree ? (
          <div className="space-y-1">
            <FileTreeNode 
              node={displayedTree} 
              forceOpen={searchQuery.length > 0} // Jak szukamy, to otwieramy wszystko
              onContextMenu={handleContextMenu}
              onDoubleClick={handleDoubleClick}
            />
          </div>
        ) : (
          <div className="text-center py-6 px-4 text-gray-500 text-xs">
             Brak wyników wyszukiwania.
          </div>
        )}
      </div>
      
      {/* STOPKA ŚCIEŻKI */}
      {rootDir && <div className="p-2 border-t border-gray-800 bg-gray-900 text-[10px] text-gray-600 truncate px-4 shrink-0" title={rootDir}>{rootDir}</div>}

      {/* MENU KONTEKSTOWE (Floating) */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => window.api.openFile(contextMenu.path)}
            className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            Otwórz plik
          </button>
          <button 
            onClick={() => window.api.showInFolder(contextMenu.path)}
            className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          >
            <FolderOpen className="w-3.5 h-3.5 text-yellow-500" />
            Pokaż w eksploratorze
          </button>
        </div>
      )}
    </div>
  );
};