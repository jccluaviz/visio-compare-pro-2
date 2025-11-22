import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageData, ComparisonMode } from '../types';
import { calculateDifference, generateELA } from '../services/imageProcessing';
import { ZoomIn, ZoomOut, Move, MousePointer2, ShieldAlert } from 'lucide-react';

interface ImageViewerProps {
  leftImage: ImageData;
  rightImage: ImageData;
  mode: ComparisonMode;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ leftImage, rightImage, mode }) => {
  // -- Common State --
  const [sliderPosition, setSliderPosition] = useState(50);
  const [opacity, setOpacity] = useState(50);
  
  // -- Blink State --
  const [blinkActive, setBlinkActive] = useState(false); // false = A, true = B
  const [blinkSpeed, setBlinkSpeed] = useState(500); // ms

  // -- Zoom & Pan State --
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // -- Loupe State --
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // -- Processed Images State --
  const [diffUrl, setDiffUrl] = useState<string | null>(null);
  const [elaUrlA, setElaUrlA] = useState<string | null>(null);
  const [elaUrlB, setElaUrlB] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isDraggingSlider = useRef(false);

  // -- Effects --

  // Reset Zoom/Pan on mode change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [mode]);

  // Blink Timer
  useEffect(() => {
    if (mode !== ComparisonMode.BLINK) return;
    const interval = setInterval(() => {
      setBlinkActive(prev => !prev);
    }, blinkSpeed);
    return () => clearInterval(interval);
  }, [mode, blinkSpeed]);

  // Difference Calculation
  useEffect(() => {
    if (mode === ComparisonMode.DIFFERENCE) {
      setIsProcessing(true);
      calculateDifference(leftImage, rightImage)
        .then(url => { setDiffUrl(url); setIsProcessing(false); })
        .catch(err => { console.error(err); setIsProcessing(false); });
    } else {
      if (diffUrl) { URL.revokeObjectURL(diffUrl); setDiffUrl(null); }
    }
  }, [mode, leftImage, rightImage]);

  // ELA Calculation
  useEffect(() => {
    if (mode === ComparisonMode.ELA) {
      setIsProcessing(true);
      Promise.all([
        generateELA(leftImage),
        generateELA(rightImage)
      ]).then(([urlA, urlB]) => {
        setElaUrlA(urlA);
        setElaUrlB(urlB);
        setIsProcessing(false);
      });
    } else {
      // Cleanup
      if (elaUrlA) URL.revokeObjectURL(elaUrlA);
      if (elaUrlB) URL.revokeObjectURL(elaUrlB);
      setElaUrlA(null); 
      setElaUrlB(null);
    }
  }, [mode, leftImage, rightImage]);

  // -- Event Handlers --

  // Zoom Handler (Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (mode === ComparisonMode.SLIDER || mode === ComparisonMode.LOUPE) return; // Zoom disabled for these for simplicity
    
    e.preventDefault(); // prevent window scroll
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(1, zoom + delta * 10), 8); // Max 8x, Min 1x
    setZoom(newZoom);
    
    if (newZoom === 1) setPan({ x: 0, y: 0 });
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === ComparisonMode.SLIDER) {
      isDraggingSlider.current = true;
    } else if (zoom > 1) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingSlider.current = false;
    setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Slider Logic
    if (mode === ComparisonMode.SLIDER && isDraggingSlider.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPosition((x / rect.width) * 100);
      return;
    }

    // Pan Logic
    if (isPanning && zoom > 1) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Loupe Logic
    if (mode === ComparisonMode.LOUPE && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Common Styles
  const transformStyle: React.CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
    transformOrigin: 'center center',
    cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
  };

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    userSelect: 'none',
  };

  // --- Zoom Controls Component ---
  const ZoomControls = () => {
    if (mode === ComparisonMode.SLIDER || mode === ComparisonMode.LOUPE) return null;
    return (
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur p-1 rounded-lg border border-slate-600 flex flex-col gap-1 z-50">
        <button className="p-2 hover:bg-slate-700 rounded text-sky-400" onClick={() => setZoom(Math.min(zoom + 0.5, 8))} title="Zoom In">
          <ZoomIn size={20} />
        </button>
        <div className="text-xs text-center font-mono text-slate-400 py-1">{Math.round(zoom * 100)}%</div>
        <button className="p-2 hover:bg-slate-700 rounded text-sky-400" onClick={() => setZoom(Math.max(zoom - 0.5, 1))} title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        {zoom > 1 && (
          <button className="p-2 hover:bg-slate-700 rounded text-red-400 mt-1 border-t border-slate-700" onClick={() => { setZoom(1); setPan({x:0, y:0}); }} title="Reset">
            <Move size={20} />
          </button>
        )}
      </div>
    );
  };

  // --- RENDERERS ---

  if (mode === ComparisonMode.SIDE_BY_SIDE) {
    return (
      <div 
        className="w-full h-full flex gap-1 overflow-hidden relative" 
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex-1 relative bg-slate-900/50 border-r border-slate-700 overflow-hidden">
           <div className="w-full h-full" style={transformStyle}>
             <img src={leftImage.url} alt="A" style={imageStyle} />
           </div>
           <span className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 text-xs rounded pointer-events-none">Imagen A</span>
        </div>
        <div className="flex-1 relative bg-slate-900/50 overflow-hidden">
           <div className="w-full h-full" style={transformStyle}>
             <img src={rightImage.url} alt="B" style={imageStyle} />
           </div>
           <span className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded pointer-events-none">Imagen B</span>
        </div>
        <ZoomControls />
      </div>
    );
  }

  if (mode === ComparisonMode.BLINK) {
    return (
      <div 
        className="w-full h-full relative overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        <div className="w-full h-full relative" style={transformStyle}>
          {blinkActive ? (
             <img src={rightImage.url} alt="B" style={imageStyle} />
          ) : (
             <img src={leftImage.url} alt="A" style={imageStyle} />
          )}
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-sky-500/30 z-50 flex items-center gap-3">
          <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${!blinkActive ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-400'}`}>A</span>
          <input 
            type="range" 
            min="100" 
            max="1000" 
            step="50"
            value={blinkSpeed} 
            onChange={(e) => setBlinkSpeed(Number(e.target.value))}
            className="w-32 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${blinkActive ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-400'}`}>B</span>
          <span className="text-xs text-slate-400 w-12 text-right">{blinkSpeed}ms</span>
        </div>
        <ZoomControls />
      </div>
    );
  }

  if (mode === ComparisonMode.LOUPE) {
    return (
      <div 
        ref={containerRef}
        className="w-full h-full relative overflow-hidden cursor-none bg-slate-900"
        onMouseMove={handleMouseMove}
      >
        {/* Base Image (A) */}
        <img src={leftImage.url} alt="Base" style={imageStyle} className="opacity-50 grayscale-[0.5]" />
        
        {/* Loupe */}
        <div 
          className="absolute w-64 h-64 rounded-full border-4 border-sky-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-none z-50 bg-black"
          style={{
            left: mousePos.x - 128,
            top: mousePos.y - 128,
          }}
        >
          <div className="relative w-full h-full overflow-hidden">
            <img 
              src={rightImage.url} 
              alt="Loupe Content"
              style={{
                position: 'absolute',
                width: containerRef.current ? containerRef.current.offsetWidth : 0,
                height: containerRef.current ? containerRef.current.offsetHeight : 0,
                maxWidth: 'none',
                left: -mousePos.x + 128, // Offset to match position
                top: -mousePos.y + 128,
                objectFit: 'contain'
              }} 
            />
            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-full h-px bg-sky-500"></div>
              <div className="h-full w-px bg-sky-500 absolute"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-slate-200 px-4 py-2 rounded-full text-sm pointer-events-none backdrop-blur-sm flex items-center gap-2">
          <MousePointer2 size={16} />
          Mueve el cursor para revelar la Imagen B con detalle
        </div>
      </div>
    );
  }

  if (mode === ComparisonMode.ELA) {
    return (
      <div className="w-full h-full flex gap-1 bg-slate-950">
        {isProcessing && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80">
              <span className="text-sky-400 flex gap-2"><div className="animate-spin">⚙️</div> Analizando compresión...</span>
           </div>
        )}
        <div className="flex-1 flex flex-col relative border-r border-slate-800">
           <div className="flex-1 relative overflow-hidden">
             {elaUrlA && <img src={elaUrlA} alt="ELA A" className="w-full h-full object-contain" />}
           </div>
           <div className="h-8 bg-slate-900 flex items-center justify-center text-xs text-slate-400 border-t border-slate-800">
              ELA Imagen A
           </div>
        </div>
        <div className="flex-1 flex flex-col relative">
           <div className="flex-1 relative overflow-hidden">
             {elaUrlB && <img src={elaUrlB} alt="ELA B" className="w-full h-full object-contain" />}
           </div>
           <div className="h-8 bg-slate-900 flex items-center justify-center text-xs text-slate-400 border-t border-slate-800">
              ELA Imagen B
           </div>
        </div>
        
        <div className="absolute top-4 right-4 max-w-xs bg-slate-900/90 backdrop-blur border border-red-500/30 p-4 rounded-lg shadow-xl text-xs text-slate-300">
          <strong className="text-red-400 block mb-1 flex items-center gap-2"><ShieldAlert size={14}/> Análisis de Nivel de Error</strong>
          Las áreas brillantes indican mayor nivel de error de compresión. Si un objeto brilla mucho más que el fondo, podría haber sido insertado digitalmente.
        </div>
      </div>
    );
  }

  if (mode === ComparisonMode.SLIDER) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full h-full cursor-ew-resize overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-800"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <img src={rightImage.url} alt="B" style={imageStyle} />
        <span className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 text-sm rounded pointer-events-none z-0">B</span>

        <div 
          className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-sky-500 bg-slate-800"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={leftImage.url} 
            alt="A" 
            style={{ 
              ...imageStyle, 
              width: `${100 / (sliderPosition / 100)}%`,
              maxWidth: 'none'
            }} 
          />
           <span className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-sm rounded pointer-events-none">A</span>
        </div>

        <div 
          className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center pointer-events-none z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-sky-500 shadow-xl border-2 border-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
               <path d="m9 18 6-6-6-6"/>
               <path d="m15 18-6-6 6-6"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (mode === ComparisonMode.OVERLAY) {
    return (
      <div className="w-full h-full relative flex flex-col">
        <div className="flex-1 relative overflow-hidden bg-slate-800">
          <img src={leftImage.url} alt="A" style={{...imageStyle, zIndex: 1}} />
          <img 
            src={rightImage.url} 
            alt="B" 
            style={{
              ...imageStyle, 
              zIndex: 2, 
              opacity: opacity / 100
            }} 
          />
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur px-6 py-3 rounded-full border border-slate-600 shadow-xl w-64">
           <div className="flex justify-between text-xs text-slate-400 mb-1">
             <span>A (0%)</span>
             <span>Mezcla</span>
             <span>B (100%)</span>
           </div>
           <input 
             type="range" 
             min="0" 
             max="100" 
             value={opacity} 
             onChange={(e) => setOpacity(Number(e.target.value))}
             className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
           />
        </div>
      </div>
    );
  }

  if (mode === ComparisonMode.DIFFERENCE) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
        {isProcessing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-sky-400">Calculando diferencias...</span>
            </div>
          </div>
        )}
        {diffUrl ? <img src={diffUrl} alt="Diff" className="w-full h-full object-contain" /> : !isProcessing && <div className="text-red-400">Error generando diferencia</div>}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded text-sm text-slate-300 pointer-events-none">
          Los píxeles resaltados indican diferencias. Negro = Idéntico.
        </div>
      </div>
    );
  }

  return null;
};