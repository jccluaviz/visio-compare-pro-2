import React, { useState, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { ImageViewer } from './components/ImageViewer';
import { MetadataViewer } from './components/MetadataViewer';
import { Header } from './components/Header';
import { ComparisonMode, ImageData } from './types';
import { Info, Image as ImageIcon, Sparkles } from 'lucide-react';
import { AIAnalyzer } from './components/AIAnalyzer';
import exifr from 'exifr';

const App: React.FC = () => {
  const [leftImage, setLeftImage] = useState<ImageData | null>(null);
  const [rightImage, setRightImage] = useState<ImageData | null>(null);
  const [mode, setMode] = useState<ComparisonMode>(ComparisonMode.SLIDER);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [showAI, setShowAI] = useState<boolean>(false);

  // Handle file drop for left/right specific zones or global drop
  const handleImageLoad = async (file: File, side: 'left' | 'right') => {
    const url = URL.createObjectURL(file);
    
    // Parse EXIF data asynchronously
    let exifData = undefined;
    try {
      const output = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        ifd0: true, // Camera make/model usually here
      });
      
      if (output) {
        exifData = {
          make: output.Make,
          model: output.Model,
          dateTimeOriginal: output.DateTimeOriginal,
          exposureTime: output.ExposureTime,
          fNumber: output.FNumber,
          iso: output.ISO,
          focalLength: output.FocalLength,
          lensModel: output.LensModel,
          latitude: output.latitude,
          longitude: output.longitude
        };
      }
    } catch (error) {
      console.warn("Could not parse EXIF data", error);
    }

    const img = new Image();
    img.onload = () => {
      const imageData: ImageData = {
        id: crypto.randomUUID(),
        file,
        url,
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        exif: exifData
      };
      
      if (side === 'left') setLeftImage(imageData);
      else setRightImage(imageData);
    };
    img.src = url;
  };

  // Handle loading image from AI Generation (Base64)
  const handleLoadFromAI = async (base64Data: string, side: 'left' | 'right') => {
    try {
      // Convert Base64 to Blob/File
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const file = new File([blob], `ai_edit_${Date.now()}.png`, { type: 'image/png' });
      
      // Reuse existing load logic
      handleImageLoad(file, side);
    } catch (e) {
      console.error("Error loading AI image to canvas", e);
    }
  };

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (leftImage) URL.revokeObjectURL(leftImage.url);
      if (rightImage) URL.revokeObjectURL(rightImage.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasBothImages = !!leftImage && !!rightImage;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans">
      <Header 
        mode={mode} 
        setMode={setMode} 
        hasImages={hasBothImages} 
        toggleMetadata={() => setShowMetadata(!showMetadata)}
        showMetadata={showMetadata}
        toggleAI={() => setShowAI(!showAI)}
        showAI={showAI}
      />

      <main className="flex-1 relative overflow-hidden flex flex-row">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative z-10">
          {!hasBothImages ? (
            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 items-center justify-center">
              <DropZone 
                side="left" 
                image={leftImage} 
                onFileLoaded={(f) => handleImageLoad(f, 'left')} 
                onRemove={() => setLeftImage(null)}
              />
              <DropZone 
                side="right" 
                image={rightImage} 
                onFileLoaded={(f) => handleImageLoad(f, 'right')} 
                onRemove={() => setRightImage(null)}
              />
            </div>
          ) : (
            <div className="flex-1 relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden p-4">
               {/* Reset Button for Quick Access */}
               <button 
                  onClick={() => { setLeftImage(null); setRightImage(null); }}
                  className="absolute top-4 left-4 z-50 bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full text-xs text-white backdrop-blur-sm border border-slate-600 transition-colors"
                >
                  Reiniciar
                </button>

              <ImageViewer 
                leftImage={leftImage} 
                rightImage={rightImage} 
                mode={mode} 
              />
            </div>
          )}
        </div>

        {/* Sidebar for Metadata */}
        {showMetadata && (
          <aside className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col overflow-y-auto shadow-xl z-20 transition-all">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2 font-semibold text-sky-400">
              <Info size={18} />
              <h3>Detalles de Imagen</h3>
            </div>
            <div className="p-4 space-y-8">
              <MetadataViewer title="Imagen Izquierda (A)" image={leftImage} />
              <div className="w-full h-px bg-slate-700" />
              <MetadataViewer title="Imagen Derecha (B)" image={rightImage} />
            </div>
          </aside>
        )}

        {/* Sidebar for AI Analysis */}
        {showAI && hasBothImages && (
          <aside className="w-96 bg-slate-900 border-l border-indigo-500/30 flex flex-col overflow-y-auto shadow-2xl z-30 transition-all absolute right-0 top-0 bottom-0">
             <div className="p-4 border-b border-indigo-500/30 bg-indigo-900/20 flex items-center gap-2 font-semibold text-indigo-300">
              <Sparkles size={18} />
              <h3>Análisis Inteligente (Gemini)</h3>
            </div>
            <div className="p-4 flex-1">
              <AIAnalyzer 
                leftImage={leftImage} 
                rightImage={rightImage} 
                onLoadToViewer={handleLoadFromAI}
              />
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default App;