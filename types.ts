
export type ToolType = 
  | 'select' 
  | 'pen' 
  | 'marker' 
  | 'highlighter' 
  | 'eraser' 
  | 'rect' 
  | 'circle' 
  | 'arrow' 
  | 'line' 
  | 'text' 
  | 'sticky' 
  | 'emoji' 
  | 'laser' 
  | 'smart';

export interface CanvasSettings {
  color: string;
  strokeWidth: number;
  opacity: number;
  snapToGrid: boolean;
  showGrid: boolean;
  darkMode: boolean;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}
