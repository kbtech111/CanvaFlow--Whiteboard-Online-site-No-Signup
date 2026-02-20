
import React, { useState, useEffect, useRef } from 'react';
import Whiteboard from './components/Whiteboard';
import Toolbar from './components/Toolbar';
import Topbar from './components/Topbar';
import PropertiesPanel from './components/PropertiesPanel';
import { ToolType, CanvasSettings } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<CanvasSettings>({
    color: COLORS[0],
    strokeWidth: 3,
    opacity: 1,
    snapToGrid: false,
    showGrid: true,
    darkMode: false,
    fontSize: 24,
    fontFamily: 'Inter',
    isBold: false,
    isItalic: false,
  });
  
  const [presentationMode, setPresentationMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const whiteboardRef = useRef<any>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('canvas_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('canvas_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts if typing in ANY input or fabric text object
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      if (isTyping || isInputFocused) return;

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          whiteboardRef.current?.undo();
        } else if (key === 'y') {
          e.preventDefault();
          whiteboardRef.current?.redo();
        } else if (key === 's') {
          e.preventDefault();
          whiteboardRef.current?.saveToJSON();
        } else if (key === 'a') {
          e.preventDefault();
          whiteboardRef.current?.selectAll();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        whiteboardRef.current?.deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${settings.darkMode ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-black'}`}>
      {!presentationMode && (
        <Topbar 
          onNew={() => whiteboardRef.current?.clearCanvas()}
          onExport={(format) => whiteboardRef.current?.export(format)}
          onImport={() => whiteboardRef.current?.triggerImport()}
          onTogglePresentation={() => setPresentationMode(true)}
          settings={settings}
          setSettings={setSettings}
        />
      )}

      <div className="flex-1 relative flex overflow-hidden">
        {!presentationMode && (
          <Toolbar 
            activeTool={activeTool} 
            onToolSelect={setActiveTool} 
            darkMode={settings.darkMode}
          />
        )}

        <div className="flex-1 relative overflow-hidden">
          <Whiteboard 
            ref={whiteboardRef}
            activeTool={activeTool} 
            settings={settings}
            onZoomChange={setZoom}
            onTypingStatusChange={setIsTyping}
          />
        </div>

        {!presentationMode && (activeTool !== 'select' || isTyping) && (
          <PropertiesPanel 
            settings={settings} 
            setSettings={setSettings} 
            activeTool={activeTool}
            onEmojiStamp={(emoji) => whiteboardRef.current?.addEmoji(emoji)}
          />
        )}
        
        {presentationMode && (
          <button 
            onClick={() => setPresentationMode(false)}
            className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
          >
            Exit Presentation
          </button>
        )}

        <div className="fixed bottom-4 left-4 px-3 py-1 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-md border border-zinc-200 dark:border-zinc-700 text-xs font-medium z-40">
          {Math.round(zoom)}%
        </div>
      </div>
    </div>
  );
};

export default App;
