import React, { useState } from 'react';
import { ImageData } from '../types';
import { analyzeImageDifference, editImageWithGenAI } from '../services/geminiService';
import { Sparkles, AlertCircle, RefreshCw, Wand2, Download, X, ArrowLeft, ArrowRight } from 'lucide-react';

interface AIAnalyzerProps {
  leftImage: ImageData;
  rightImage: ImageData;
  onLoadToViewer: (base64: string, side: 'left' | 'right') => void;
}

type Tab = 'analyze' | 'edit';
type TargetImage = 'left' | 'right';

const PHOTO_PRESETS = [
  { label: "Seleccionar retoque...", prompt: "" },
  { label: "Corrección Exposición (+0.5 EV)", prompt: "Increase exposure slightly by 0.5 EV, brightening the image naturally." },
  { label: "Corrección Exposición (-0.5 EV)", prompt: "Decrease exposure slightly by 0.5 EV, darkening the image to recover highlights." },
  { label: "Aumentar Contraste (Punchy)", prompt: "Increase contrast to make shadows deeper and highlights brighter, giving a punchy look." },
  { label: "Contraste Suave (Matte)", prompt: "Reduce contrast slightly and lift the blacks for a matte, soft vintage look." },
  { label: "Balance de Blancos: Cálido", prompt: "Shift white balance towards warm, golden tones." },
  { label: "Balance de Blancos: Frío", prompt: "Shift white balance towards cool, blue tones." },
  { label: "Aumentar Saturación (Vibrance)", prompt: "Increase saturation and vibrance to make colors pop without oversaturating skin tones." },
  { label: "Desaturar (Muted Tones)", prompt: "Reduce saturation for a muted, cinematic look." },
  { label: "Máscara de Enfoque (Sharpen)", prompt: "Apply sharpening to enhance edges and details." },
  { label: "Reducción de Ruido", prompt: "Apply noise reduction to smooth out grain while keeping details." },
  { label: "Recuperar Sombras", prompt: "Lift the shadows to reveal details in dark areas." },
  { label: "Recuperar Luces Altas", prompt: "Dim the highlights to recover blown-out details." },
  { label: "Claridad (Clarity)", prompt: "Increase clarity and local contrast to enhance texture." },
  { label: "Eliminar Neblina (Dehaze)", prompt: "Remove haze and atmospheric fog to make the image clearer." },
  { label: "Viñeteado Sutil", prompt: "Add a subtle dark vignette around the corners to draw attention to the center." },
  { label: "Corrección Gamma (Brillo Medio)", prompt: "Adjust gamma to brighten midtones." },
  { label: "Rango Dinámico (HDR Natural)", prompt: "Maximize dynamic range, balancing extreme lights and darks naturally." },
  { label: "Suavizar Piel (Retrato)", prompt: "Softly smooth skin textures while keeping facial features sharp." },
  { label: "Realzar Detalles (Estructura)", prompt: "Enhance fine structure and micro-contrast." },
  { label: "Punto Negro (Black Point)", prompt: "Lower the black point to ensure true blacks." },
];

export const AIAnalyzer: React.FC<AIAnalyzerProps> = ({ leftImage, rightImage, onLoadToViewer }) => {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  
  // Analysis State
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Edit State
  const [targetImage, setTargetImage] = useState<TargetImage>('right');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Shared Error
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!process.env.API_KEY) {
      setError("Se requiere API Key.");
      return;
    }
    setLoadingAnalysis(true);
    setError(null);
    try {
      const result = await analyzeImageDifference(leftImage, rightImage);
      setAnalysis(result);
    } catch (err) {
      setError("Error al conectar con Gemini.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleEdit = async () => {
    if (!process.env.API_KEY) {
      setError("Se requiere API Key.");
      return;
    }
    
    const promptToUse = selectedPreset || customPrompt;
    if (!promptToUse.trim()) {
      setError("Introduce un prompt o selecciona un ajuste.");
      return;
    }

    setLoadingEdit(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const sourceImage = targetImage === 'left' ? leftImage : rightImage;
      if (!sourceImage) throw new Error("Imagen no seleccionada");

      const resultUrl = await editImageWithGenAI(sourceImage, promptToUse);
      setGeneratedImage(resultUrl);
    } catch (err) {
      setError("Error generando la imagen. Intenta de nuevo.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `visio-edit-${Date.now()}.png`;
      a.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-4">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'analyze' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('analyze')}
        >
          Análisis
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'edit' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('edit')}
        >
          Edición Mágica
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* --- ANALYSIS TAB --- */}
        {activeTab === 'analyze' && (
          <div className="flex flex-col gap-4 h-full">
            {!analysis && !loadingAnalysis && (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-4 opacity-60">
                <Sparkles className="w-10 h-10 text-indigo-400 mb-3" />
                <p className="text-sm text-slate-300 mb-4">
                  Detecta diferencias sutiles y cambios de composición.
                </p>
                <button 
                  onClick={handleAnalyze}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                >
                  <Sparkles size={16} /> Analizar
                </button>
              </div>
            )}

            {loadingAnalysis && (
              <div className="flex flex-col items-center justify-center py-12 text-indigo-300">
                <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs">Analizando...</p>
              </div>
            )}

            {analysis && (
              <div className="prose prose-invert prose-sm max-w-none text-sm">
                <div className="whitespace-pre-wrap text-slate-300 font-light">
                  {analysis}
                </div>
                <button 
                  onClick={handleAnalyze}
                  className="mt-4 w-full py-2 border border-slate-600 rounded text-slate-400 hover:bg-slate-800 text-xs"
                >
                  Regenerar
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- EDIT TAB --- */}
        {activeTab === 'edit' && (
          <div className="flex flex-col gap-4 pb-4">
            {/* Image Selector */}
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 uppercase font-bold mb-2 block">Imagen Base</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTargetImage('left')}
                  className={`flex-1 py-2 rounded text-xs font-medium transition-all border ${targetImage === 'left' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-700 border-transparent text-slate-300'}`}
                >
                  Imagen A
                </button>
                <button 
                  onClick={() => setTargetImage('right')}
                  className={`flex-1 py-2 rounded text-xs font-medium transition-all border ${targetImage === 'right' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-700 border-transparent text-slate-300'}`}
                >
                  Imagen B
                </button>
              </div>
            </div>

            {/* Presets Dropdown */}
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Retoque Rápido</label>
              <select
                value={selectedPreset}
                onChange={(e) => {
                   setSelectedPreset(e.target.value);
                   if(e.target.value) setCustomPrompt(""); // Clear custom if preset selected
                }}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-sky-500 outline-none"
              >
                {PHOTO_PRESETS.map((p, i) => (
                  <option key={i} value={p.prompt}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase mb-1 block mt-2">O Instrucción Manual</label>
              <textarea
                value={customPrompt}
                onChange={(e) => {
                   setCustomPrompt(e.target.value);
                   if(e.target.value) setSelectedPreset(""); // Clear preset if custom typed
                }}
                placeholder="Ej: Añade más contraste y haz el cielo más azul..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none h-20"
              />
            </div>

            {/* Action Button */}
            <button 
              onClick={handleEdit}
              disabled={loadingEdit || (!customPrompt.trim() && !selectedPreset)}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-sky-900/20"
            >
              {loadingEdit ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
              {loadingEdit ? 'Procesando...' : 'Aplicar Cambios'}
            </button>

            {/* Result Area */}
            {generatedImage && (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-400 font-bold flex items-center gap-1"><Sparkles size={12}/> Resultado Listo</span>
                  <button onClick={() => setGeneratedImage(null)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                </div>
                
                <div className="rounded-lg overflow-hidden border border-slate-600 bg-black/40 mb-3">
                  <img src={generatedImage} alt="Generated" className="w-full h-auto object-contain max-h-64" />
                </div>

                {/* Load Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onLoadToViewer(generatedImage, 'left')}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-slate-600"
                  >
                    <ArrowLeft size={14} /> Cargar en A
                  </button>
                  <button 
                    onClick={() => onLoadToViewer(generatedImage, 'right')}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-slate-600"
                  >
                    Cargar en B <ArrowRight size={14} />
                  </button>
                  <button 
                     onClick={downloadImage}
                     className="col-span-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                   >
                     <Download size={14} /> Guardar Archivo
                   </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};