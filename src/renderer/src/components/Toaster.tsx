import { X, FilePlus, FileWarning } from 'lucide-react';

// Typ pojedynczego powiadomienia
export interface Toast {
  id: number;
  type: 'missing' | 'new' | 'success' | 'info';
  title: string;
  message: string;
}

interface ToasterProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

export const Toaster = ({ toasts, removeToast }: ToasterProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 flex gap-3 animate-in slide-in-from-right duration-300 relative overflow-hidden group"
        >
          {/* Pasek koloru po lewej */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 
            ${toast.type === 'missing' ? 'bg-red-500' : 
              toast.type === 'new' ? 'bg-blue-500' : 
              toast.type === 'success' ? 'bg-green-500' : 'bg-gray-500'}`} 
          />

          {/* Ikona */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'missing' && <FileWarning className="w-5 h-5 text-red-400" />}
            {toast.type === 'new' && <FilePlus className="w-5 h-5 text-blue-400" />}
            {toast.type === 'success' && <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />}
          </div>

          {/* Treść */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{toast.title}</h4>
            <p className="text-xs text-gray-400 mt-0.5 break-words">{toast.message}</p>
          </div>

          {/* Przycisk zamknięcia */}
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-white transition-colors self-start"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};