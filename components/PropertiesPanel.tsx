
import React from 'react';
import { CanvasSettings, ToolType } from '../types';
import { COLORS, FONTS } from '../constants';
import { 
  Bold, 
  Italic, 
  Type as TypeIcon,
  Smile
} from 'lucide-react';

interface PropertiesPanelProps {
  settings: CanvasSettings;
  setSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
  activeTool: ToolType;
  onEmojiStamp: (emoji: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ settings, setSettings, activeTool, onEmojiStamp }) => {
  const isDrawing = ['pen', 'marker', 'highlighter', 'rect', 'circle', 'line', 'text', 'smart'].includes(activeTool);
  const isText = activeTool === 'text';
  const isEmoji = activeTool === 'emoji';

  if (!isDrawing && !isEmoji) return null;

  const emojis = ['👍', '❤️', '🔥', '✨', '⭐', '✅', '❌', '❓', '💡', '🚀', '🎯', '💯'];

  return (
    <div className={`fixed right-6 top-20 w-64 p-5 rounded-2xl shadow-xl border z-50 animate-in fade-in slide-in-from-right-4 duration-200 ${
      settings.darkMode ? 'bg-zinc-800/90 border-zinc-700 text-white' : 'bg-white/90 border-zinc-200 text-black'
    } backdrop-blur-md`}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Properties</h3>
      
      {/* Color Picker */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-3 block">Color</label>
        <div className="grid grid-cols-5 gap-2">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => setSettings(prev => ({ ...prev, color }))}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                settings.color === color ? 'border-blue-500' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input 
            type="color" 
            value={settings.color}
            onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent cursor-pointer"
          />
        </div>
      </div>

      {/* Thickness / Size Slider */}
      {!isEmoji && (
        <div className="mb-6">
          <label className="flex justify-between text-sm font-medium mb-3">
            <span>Size</span>
            <span className="text-zinc-400">{settings.strokeWidth}px</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={isText ? settings.fontSize : settings.strokeWidth}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (isText) setSettings(prev => ({ ...prev, fontSize: val }));
              else setSettings(prev => ({ ...prev, strokeWidth: val }));
            }}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      )}

      {/* Text Specific Settings */}
      {isText && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Font Family</label>
            <select 
              value={settings.fontFamily}
              onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
              className={`w-full p-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none ${
                settings.darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'
              }`}
            >
              {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSettings(prev => ({ ...prev, isBold: !prev.isBold }))}
              className={`flex-1 p-2 rounded-lg border flex items-center justify-center transition-colors ${
                settings.isBold ? 'bg-blue-100 text-blue-600 border-blue-200' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Bold size={18} />
            </button>
            <button 
              onClick={() => setSettings(prev => ({ ...prev, isItalic: !prev.isItalic }))}
              className={`flex-1 p-2 rounded-lg border flex items-center justify-center transition-colors ${
                settings.isItalic ? 'bg-blue-100 text-blue-600 border-blue-200' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Italic size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Stamps */}
      {isEmoji && (
        <div>
          <label className="text-sm font-medium mb-3 block">Stamps</label>
          <div className="grid grid-cols-4 gap-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => onEmojiStamp(emoji)}
                className="w-10 h-10 text-2xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opacity Setting */}
      {!isEmoji && !isText && (
        <div className="mt-6 border-t pt-4 dark:border-zinc-700">
          <label className="flex justify-between text-sm font-medium mb-3">
            <span>Opacity</span>
            <span className="text-zinc-400">{Math.round(settings.opacity * 100)}%</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={settings.opacity}
            onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
