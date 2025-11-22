import React from 'react';
import { ImageData } from '../types';
import { FileType, Maximize, HardDrive, Calendar, Camera, Aperture, Timer, MapPin, Sliders } from 'lucide-react';

interface MetadataViewerProps {
  title: string;
  image: ImageData | null;
}

export const MetadataViewer: React.FC<MetadataViewerProps> = ({ title, image }) => {
  if (!image) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | number | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to format exposure time (e.g. 0.0166 -> 1/60)
  const formatExposure = (time: number | undefined) => {
    if (!time) return '--';
    if (time >= 1) return `${time}s`;
    return `1/${Math.round(1/time)}`;
  };

  const hasExif = !!image.exif && (!!image.exif.make || !!image.exif.iso || !!image.exif.fNumber);
  const hasGPS = !!image.exif?.latitude && !!image.exif?.longitude;

  return (
    <div className="text-sm font-sans">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${title.includes('Izquierda') ? 'bg-sky-500' : 'bg-emerald-500'}`}></div>
        <h4 className="font-bold text-slate-100">{title}</h4>
      </div>
      
      {/* Basic File Info */}
      <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-700/50">
        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Archivo</h5>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400">
              <Maximize size={14} />
              <span>Resolución</span>
            </div>
            <span className="text-slate-200 font-mono">{image.width} x {image.height}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400">
              <HardDrive size={14} />
              <span>Tamaño</span>
            </div>
            <span className="text-slate-200">{formatSize(image.size)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400">
              <FileType size={14} />
              <span>Formato</span>
            </div>
            <span className="text-slate-200 uppercase">{image.type.split('/')[1] || 'Unknown'}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={14} />
              <span>Modificado</span>
            </div>
            <span className="text-slate-200 text-xs">{formatDate(image.lastModified)}</span>
          </div>
        </div>
      </div>

      {/* Camera / EXIF Data */}
      {hasExif && (
        <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-700/50">
          <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Camera size={12} /> Cámara
          </h5>
          
          <div className="mb-3">
             <div className="text-slate-200 font-medium">{image.exif?.make} {image.exif?.model}</div>
             {image.exif?.lensModel && (
               <div className="text-slate-400 text-xs truncate" title={image.exif.lensModel}>{image.exif.lensModel}</div>
             )}
             {image.exif?.dateTimeOriginal && (
               <div className="text-slate-500 text-xs mt-1">Captura: {formatDate(image.exif.dateTimeOriginal)}</div>
             )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800 rounded p-2 flex flex-col items-center text-center">
               <Aperture size={14} className="text-sky-400 mb-1" />
               <span className="text-xs text-slate-400">Apertura</span>
               <span className="text-slate-200 font-mono">{image.exif?.fNumber ? `f/${image.exif.fNumber}` : '--'}</span>
            </div>
            <div className="bg-slate-800 rounded p-2 flex flex-col items-center text-center">
               <Timer size={14} className="text-sky-400 mb-1" />
               <span className="text-xs text-slate-400">Tiempo</span>
               <span className="text-slate-200 font-mono">{formatExposure(image.exif?.exposureTime)}</span>
            </div>
            <div className="bg-slate-800 rounded p-2 flex flex-col items-center text-center">
               <Sliders size={14} className="text-sky-400 mb-1" />
               <span className="text-xs text-slate-400">ISO</span>
               <span className="text-slate-200 font-mono">{image.exif?.iso || '--'}</span>
            </div>
          </div>
          
          {image.exif?.focalLength && (
             <div className="mt-2 text-xs text-center text-slate-400">
               Distancia Focal: <span className="text-slate-200">{image.exif.focalLength}mm</span>
             </div>
          )}
        </div>
      )}

      {/* Location Data */}
      {hasGPS && (
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
          <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <MapPin size={12} /> Ubicación
          </h5>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-300">
              <div>Lat: {image.exif?.latitude?.toFixed(6)}</div>
              <div>Lon: {image.exif?.longitude?.toFixed(6)}</div>
            </div>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${image.exif?.latitude},${image.exif?.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
              Ver Mapa
            </a>
          </div>
        </div>
      )}
    </div>
  );
};