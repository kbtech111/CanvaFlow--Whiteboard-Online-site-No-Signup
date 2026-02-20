
import React, { useState } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Maximize2, 
  Grid, 
  Moon, 
  Sun,
  FileJson,
  ChevronDown
} from 'lucide-react';
import { CanvasSettings } from '../types';

interface TopbarProps {
  onNew: () => void;
  onExport: (format: string) => void;
  onImport: () => void;
  onTogglePresentation: () => void;
  settings: CanvasSettings;
  setSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
}

const Topbar: React.FC<TopbarProps> = ({ 
  onNew, 
  onExport, 
  onImport, 
  onTogglePresentation, 
  settings, 
  setSettings 
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className={`h-14 flex items-center justify-between px-4 border-b z-50 transition-colors ${
      settings.darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">CanvasFlow</span>
        </div>
        
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-2" />

        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">
          <Plus size={16} />
          New
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export
            <ChevronDown size={14} />
          </button>
          
          {showExportMenu && (
            <div className={`absolute top-full left-0 mt-1 w-40 rounded-xl shadow-xl border overflow-hidden backdrop-blur-md z-50 ${
              settings.darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'
            }`}>
              <button onClick={() => { onExport('png'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors text-sm">PNG Image</button>
              <button onClick={() => { onExport('jpeg'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors text-sm">JPG Image</button>
              <button onClick={() => { onExport('pdf'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors text-sm">PDF Document</button>
            </div>
          )}
        </div>

        <button onClick={onImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">
          <Upload size={16} />
          Import
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
          className={`p-2 rounded-lg transition-colors ${
            settings.showGrid ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title="Toggle Grid"
        >
          <Grid size={18} />
        </button>
        
        <button 
          onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          onClick={onTogglePresentation}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <Maximize2 size={16} />
          Present
        </button>
      </div>
    </div>
  );
};

export default Topbar;
