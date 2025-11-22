import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ImageData } from '../types';

interface DropZoneProps {
  side: 'left' | 'right';
  image: ImageData | null;
  onFileLoaded: (file: File) => void;
  onRemove: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ side, image, onFileLoaded, onRemove }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileLoaded(file);
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileLoaded(e.target.files[0]);
    }
  };

  if (image) {
    return (
      <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden border-2 border-slate-600 bg-slate-800 group shadow-lg">
        <img 
          src={image.url} 
          alt={`Loaded ${side}`} 
          className="w-full h-full object-contain p-2"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button 
            onClick={onRemove}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            title="Quitar imagen"
          >
            <X size={24} />
          </button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-slate-300">
          {image.width}x{image.height}
        </div>
        <div className="absolute top-2 left-2 bg-blue-500 px-2 py-1 rounded text-xs font-bold text-white uppercase shadow-sm">
          {side === 'left' ? 'Imagen A' : 'Imagen B'}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full h-64 md:h-96 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${isDragOver 
          ? 'border-sky-400 bg-sky-400/10 scale-[1.02]' 
          : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-500'
        }
      `}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleInputChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <div className="p-4 bg-slate-700/50 rounded-full mb-4 text-sky-400">
        <Upload size={32} />
      </div>
      <h3 className="text-lg font-medium text-slate-200 mb-1">
        {side === 'left' ? 'Cargar Imagen A' : 'Cargar Imagen B'}
      </h3>
      <p className="text-sm text-slate-400 text-center max-w-[200px]">
        Arrastra un archivo aquí o haz clic para seleccionar
      </p>
    </div>
  );
};