import { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

interface DropzoneProps {
  file: File | null;
  setFile: (file: File | null) => void;
}

export const Dropzone = ({ file, setFile }: DropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="h-2/5 p-6 border-b border-gray-800 bg-gray-900/30 flex flex-col relative">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        className={`
          flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group
          ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[0.99]' : 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/50'}
          ${file ? 'border-green-500/30 bg-green-500/5' : ''}
        `}
      >
        {!file ? (
          <div className="text-center pointer-events-none">
            <div className={`p-4 rounded-full bg-gray-800/50 mb-4 mx-auto w-fit transition-transform group-hover:scale-110 ${isDragging ? 'bg-blue-500/20' : ''}`}>
              <FileText className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
            <p className="text-gray-300 font-medium">Przeciągnij dokument tutaj</p>
            <p className="text-gray-600 text-sm mt-1">PDF, DOCX, TXT</p>
          </div>
        ) : (
          <div className="text-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-lg">{file.name}</p>
            <p className="text-gray-500 text-sm mb-4">{(file.size / 1024).toFixed(2)} KB</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="px-4 py-1.5 rounded-full bg-gray-800 hover:bg-red-500/10 hover:text-red-400 text-gray-400 text-sm transition-all border border-gray-700 hover:border-red-500/30"
            >
              Zmień plik
            </button>
          </div>
        )}
      </div>
    </div>
  );
};