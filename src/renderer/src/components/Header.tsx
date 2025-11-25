import { useState } from 'react';
import { Cpu, MoreVertical, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header = ({ onOpenSettings }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-2">
        <Cpu className="w-6 h-6 text-blue-500" />
        <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          SmartSort AI
        </h1>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button 
                onClick={() => { onOpenSettings(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Ustawienia
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};