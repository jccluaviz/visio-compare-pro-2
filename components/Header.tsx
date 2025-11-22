
import React from 'react';
import { ComparisonMode } from '../types';
import { 
  Columns, 
  SquareStack, 
  SlidersHorizontal, 
  Divide, 
  Info, 
  Sparkles, 
  Eye, 
  Search, 
  ShieldAlert 
} from 'lucide-react';

interface HeaderProps {
  mode: ComparisonMode;
  setMode: (mode: ComparisonMode) => void;
  hasImages: boolean;
  showMetadata: boolean;
  toggleMetadata: () => void;
  showAI: boolean;
  toggleAI: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  mode, 
  setMode, 
  hasImages, 
  showMetadata, 
  toggleMetadata,
  showAI,
  toggleAI
}) => {
  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shadow-md z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sky-500/20 shadow-lg">
          V
        </div>
        <h1 className="font-bold text-xl tracking-tight text-slate-100 hidden md:block">Visio<span className="text-sky-400">Compare</span> <span className="text-xs text-slate-500 align-top ml-1">PRO</span></h1>
      </div>

      <div className="flex-1 max-w-4xl flex items-center justify-center gap-2 overflow-x-auto px-4 scrollbar-hide">
        <div className="bg-slate-900/50 p-1 rounded-lg border border-slate-700 flex gap-1">
          <ToolButton 
            active={mode === ComparisonMode.SLIDER} 
            onClick={() => setMode(ComparisonMode.SLIDER)}
            icon={<SlidersHorizontal size={16} />}
            label="Deslizar"
            disabled={!hasImages}
          />
          <ToolButton 
            active={mode === ComparisonMode.SIDE_BY_SIDE} 
            onClick={() => setMode(ComparisonMode.SIDE_BY_SIDE)}
            icon={<Columns size={16} />}
            label="Lado a Lado"
            disabled={!hasImages}
          />
          <ToolButton 
            active={mode === ComparisonMode.BLINK} 
            onClick={() => setMode(ComparisonMode.BLINK)}
            icon={<Eye size={16} />}
            label="Parpadeo"
            disabled={!hasImages}
          />
          <ToolButton 
            active={mode === ComparisonMode.LOUPE} 
            onClick={() => setMode(ComparisonMode.LOUPE)}
            icon={<Search size={16} />}
            label="Lupa"
            disabled={!hasImages}
          />
           <div className="w-px bg-slate-700 mx-1 my-1"></div>
          <ToolButton 
            active={mode === ComparisonMode.OVERLAY} 
            onClick={() => setMode(ComparisonMode.OVERLAY)}
            icon={<SquareStack size={16} />}
            label="Opacidad"
            disabled={!hasImages}
          />
          <ToolButton 
            active={mode === ComparisonMode.DIFFERENCE} 
            onClick={() => setMode(ComparisonMode.DIFFERENCE)}
            icon={<Divide size={16} />}
            label="Diferencia"
            disabled={!hasImages}
          />
           <ToolButton 
            active={mode === ComparisonMode.ELA} 
            onClick={() => setMode(ComparisonMode.ELA)}
            icon={<ShieldAlert size={16} />}
            label="Forense (ELA)"
            disabled={!hasImages}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleAI}
          disabled={!hasImages}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
            showAI 
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]' 
              : 'text-slate-400 hover:text-indigo-400 border-transparent hover:bg-slate-700'
          } ${!hasImages ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Análisis IA"
        >
          <Sparkles size={18} />
          <span className="hidden lg:inline font-medium text-sm">IA</span>
        </button>

        <button
          onClick={toggleMetadata}
          disabled={!hasImages}
          className={`p-2 rounded-lg transition-colors border ${
            showMetadata 
              ? 'bg-slate-700 text-sky-400 border-slate-600' 
              : 'text-slate-400 hover:text-slate-100 border-transparent hover:bg-slate-700'
          } ${!hasImages ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Ver detalles"
        >
          <Info size={20} />
        </button>
      </div>
    </header>
  );
};

const ToolButton = ({ active, onClick, icon, label, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
      ${active 
        ? 'bg-slate-700 text-sky-400 shadow-sm ring-1 ring-slate-600' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }
      ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
    `}
    title={label}
  >
    {icon}
    <span className="hidden xl:inline">{label}</span>
  </button>
);
