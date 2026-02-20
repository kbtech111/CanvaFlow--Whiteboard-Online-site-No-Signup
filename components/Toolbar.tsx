
import React from 'react';
import { ToolType } from '../types';
import { 
  MousePointer2, 
  Pencil, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  ArrowUpRight, 
  Minus, 
  Type, 
  StickyNote, 
  Smile,
  Zap,
  Sparkles
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  darkMode: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect, darkMode }) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'smart', icon: Sparkles, label: 'Smart Shape' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'sticky', icon: StickyNote, label: 'Sticky Note' },
    { id: 'emoji', icon: Smile, label: 'Stamps' },
  ];

  return (
    <div className={`fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-2 rounded-2xl shadow-xl border z-50 transition-colors ${
      darkMode ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-zinc-200'
    } backdrop-blur-md`}>
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id as ToolType)}
            className={`p-3 rounded-xl transition-all group relative ${
              isActive 
                ? 'bg-blue-600 text-white shadow-md' 
                : `${darkMode ? 'text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100'}`
            }`}
            title={tool.label}
          >
            <Icon size={20} />
            <span className={`absolute left-full ml-3 px-2 py-1 rounded bg-zinc-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50`}>
              {tool.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Toolbar;
