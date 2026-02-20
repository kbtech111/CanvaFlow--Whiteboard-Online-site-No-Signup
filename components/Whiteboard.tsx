
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ToolType, CanvasSettings } from '../types';
import { GRID_SIZE } from '../constants';

// Declare fabric on window since we use CDN
declare const fabric: any;

interface WhiteboardProps {
  activeTool: ToolType;
  settings: CanvasSettings;
  onZoomChange: (zoom: number) => void;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

const Whiteboard = forwardRef(({ activeTool, settings, onZoomChange, onTypingStatusChange }: WhiteboardProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<any>(null);
  const historyRef = useRef<string[]>([]);
  const futureRef = useRef<string[]>([]);
  const isUpdatingHistory = useRef(false);

  const applyBackgroundSettings = (canvas: any, theme: CanvasSettings) => {
    if (!canvas) return;
    const bgColor = theme.darkMode ? '#18181b' : '#fafafa';
    canvas.backgroundColor = bgColor;
    
    if (theme.showGrid) {
      const gridCanvas = document.createElement('canvas');
      gridCanvas.width = GRID_SIZE;
      gridCanvas.height = GRID_SIZE;
      const ctx = gridCanvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = theme.darkMode ? '#27272a' : '#e4e4e7';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, GRID_SIZE);
        ctx.lineTo(GRID_SIZE, GRID_SIZE);
        ctx.lineTo(GRID_SIZE, 0);
        ctx.stroke();
      }
      
      canvas.setBackgroundImage(gridCanvas.toDataURL(), canvas.renderAll.bind(canvas), {
        repeat: 'repeat',
        originX: 'left',
        originY: 'top'
      });
    } else {
      canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    }
    canvas.requestRenderAll();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = new fabric.Canvas('whiteboard-canvas', {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      enableRetinaScaling: true,
    });

    canvasRef.current = canvas;

    const saved = localStorage.getItem('canvas_data');
    if (saved) {
      canvas.loadFromJSON(saved, () => {
        applyBackgroundSettings(canvas, settings);
        historyRef.current = [JSON.stringify(canvas.toJSON())];
      });
    } else {
      historyRef.current = [JSON.stringify(canvas.toJSON())];
      applyBackgroundSettings(canvas, settings);
    }

    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        canvasRef.current.requestRenderAll();
      }
    };
    window.addEventListener('resize', handleResize);

    canvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.05) zoom = 0.05;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      onZoomChange(zoom * 100);
    });

    const handleHistory = () => {
      if (!isUpdatingHistory.current) {
        const json = JSON.stringify(canvas.toJSON());
        if (historyRef.current[historyRef.current.length - 1] !== json) {
          historyRef.current.push(json);
          if (historyRef.current.length > 50) historyRef.current.shift();
          futureRef.current = [];
          localStorage.setItem('canvas_data', json);
        }
      }
    };

    canvas.on('object:added', handleHistory);
    canvas.on('object:modified', handleHistory);
    canvas.on('object:removed', handleHistory);
    
    canvas.on('text:editing:entered', () => onTypingStatusChange?.(true));
    canvas.on('text:editing:exited', () => onTypingStatusChange?.(false));
    canvas.on('selection:cleared', () => onTypingStatusChange?.(false));

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const isDrawing = ['pen', 'marker', 'highlighter', 'eraser', 'smart'].includes(activeTool);
    canvas.isDrawingMode = isDrawing;
    canvas.selection = activeTool === 'select';
    canvas.skipTargetFind = activeTool !== 'select' && activeTool !== 'eraser';
    
    if (activeTool !== 'select') {
      canvas.discardActiveObject().requestRenderAll();
    }

    if (isDrawing) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      if (activeTool === 'eraser') {
        canvas.freeDrawingBrush.color = settings.darkMode ? '#18181b' : '#fafafa';
        canvas.freeDrawingBrush.width = settings.strokeWidth * 5;
      } else {
        canvas.freeDrawingBrush.width = settings.strokeWidth;
        const hex = settings.color;
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        
        if (activeTool === 'marker') {
          canvas.freeDrawingBrush.color = `rgba(${r},${g},${b},0.5)`;
        } else if (activeTool === 'highlighter') {
          canvas.freeDrawingBrush.color = `rgba(${r},${g},${b},0.2)`;
          canvas.freeDrawingBrush.width = settings.strokeWidth * 6;
        } else {
          canvas.freeDrawingBrush.color = settings.color;
        }
      }
    }

    applyBackgroundSettings(canvas, settings);

    const handlePathCreated = (opt: any) => {
      if (activeTool === 'smart') {
        const path = opt.path;
        canvas.remove(path);
        detectAndCreateSmartShape(path);
      }
    };

    canvas.on('path:created', handlePathCreated);
    return () => canvas.off('path:created', handlePathCreated);
  }, [activeTool, settings.color, settings.strokeWidth, settings.darkMode, settings.showGrid]);

  const detectAndCreateSmartShape = (pathObj: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const path = pathObj.path;
    const { width, height, left, top } = pathObj;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Heuristics setup
    const points = path.map((segment: any) => ({ x: segment[1], y: segment[2] })).filter((p: any) => p.x !== undefined);
    if (points.length < 3) return;

    // 1. Calculate Perimeter & Area Coverage
    let pathLength = 0;
    for (let i = 1; i < points.length; i++) {
      pathLength += Math.sqrt(Math.pow(points[i].x - points[i-1].x, 2) + Math.pow(points[i].y - points[i-1].y, 2));
    }
    const distStartEnd = Math.sqrt(Math.pow(points[0].x - points[points.length-1].x, 2) + Math.pow(points[0].y - points[points.length-1].y, 2));
    const isClosed = distStartEnd < (pathLength * 0.2);

    // 2. Detect direction changes (corners)
    let corners = 0;
    for (let i = 2; i < points.length - 2; i++) {
      const v1 = { x: points[i].x - points[i-2].x, y: points[i].y - points[i-2].y };
      const v2 = { x: points[i+2].x - points[i].x, y: points[i+2].y - points[i].y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot / mag)));
      if (angle > 0.8) corners++;
    }

    // 3. Detect Waves (Y-axis oscillation)
    let ySwitches = 0;
    for (let i = 1; i < points.length - 1; i++) {
      if ((points[i].y > points[i-1].y && points[i].y > points[i+1].y) || 
          (points[i].y < points[i-1].y && points[i].y < points[i+1].y)) {
        ySwitches++;
      }
    }

    const ratio = width / height;
    let finalShape;

    // Decision Logic
    if (ySwitches > 6 && !isClosed) {
      // Wave detected
      const wavePath = [];
      for (let i = 0; i < 5; i++) {
        const x = left + (width / 5) * i;
        wavePath.push(`M ${x} ${centerY} Q ${x + width/10} ${centerY - height/2} ${x + width/5} ${centerY}`);
      }
      finalShape = new fabric.Path(wavePath.join(' '), {
        fill: 'transparent', stroke: settings.color, strokeWidth: settings.strokeWidth
      });
    } else if (!isClosed && pathLength > distStartEnd * 2) {
      // Scribble, keep it
      canvas.add(pathObj);
      return;
    } else if (!isClosed) {
      // Line
      finalShape = new fabric.Line([points[0].x, points[0].y, points[points.length-1].x, points[points.length-1].y], {
        stroke: settings.color, strokeWidth: settings.strokeWidth
      });
    } else if (corners >= 3 && corners <= 5 && ratio > 0.4 && ratio < 2.5) {
      // Rectangle or Diamond or Triangle
      if (corners === 3) {
        finalShape = new fabric.Triangle({
          left, top, width, height, fill: 'transparent', stroke: settings.color, strokeWidth: settings.strokeWidth
        });
      } else {
        finalShape = new fabric.Rect({
          left, top, width, height, fill: 'transparent', stroke: settings.color, strokeWidth: settings.strokeWidth
        });
      }
    } else {
      // Default to Circle/Ellipse
      finalShape = new fabric.Ellipse({
        left: centerX, top: centerY, rx: width / 2, ry: height / 2,
        fill: 'transparent', stroke: settings.color, strokeWidth: settings.strokeWidth,
        originX: 'center', originY: 'center'
      });
    }

    if (finalShape) {
      canvas.add(finalShape);
      canvas.setActiveObject(finalShape);
      canvas.requestRenderAll();
    }
  };

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (historyRef.current.length > 1) {
        isUpdatingHistory.current = true;
        const current = historyRef.current.pop();
        if (current) futureRef.current.push(current);
        const last = historyRef.current[historyRef.current.length - 1];
        canvasRef.current.loadFromJSON(last, () => {
          applyBackgroundSettings(canvasRef.current, settings);
          canvasRef.current.requestRenderAll();
          isUpdatingHistory.current = false;
          localStorage.setItem('canvas_data', last);
        });
      }
    },
    redo: () => {
      if (futureRef.current.length > 0) {
        isUpdatingHistory.current = true;
        const next = futureRef.current.pop();
        if (next) {
          historyRef.current.push(next);
          canvasRef.current.loadFromJSON(next, () => {
            applyBackgroundSettings(canvasRef.current, settings);
            canvasRef.current.requestRenderAll();
            isUpdatingHistory.current = false;
            localStorage.setItem('canvas_data', next);
          });
        }
      }
    },
    clearCanvas: () => {
      if (window.confirm('Clear all drawings?')) {
        canvasRef.current.clear();
        applyBackgroundSettings(canvasRef.current, settings);
        const json = JSON.stringify(canvasRef.current.toJSON());
        historyRef.current = [json];
        futureRef.current = [];
        localStorage.setItem('canvas_data', json);
      }
    },
    deleteSelected: () => {
      const activeObjects = canvasRef.current.getActiveObjects();
      if (activeObjects.length) {
        canvasRef.current.remove(...activeObjects);
        canvasRef.current.discardActiveObject().requestRenderAll();
      }
    },
    selectAll: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.discardActiveObject();
      const objects = canvas.getObjects().filter((obj: any) => !obj.isBackground && obj.selectable !== false);
      if (objects.length > 0) {
        const selection = new fabric.ActiveSelection(objects, { canvas });
        canvas.setActiveObject(selection);
        canvas.requestRenderAll();
      }
    },
    export: (format: string) => {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL({ format: format === 'pdf' ? 'png' : format, multiplier: 2 });
      if (format === 'pdf') {
        const { jsPDF } = (window as any).jspdf;
        const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
        pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('whiteboard.pdf');
      } else {
        const link = document.createElement('a');
        link.download = `whiteboard.${format}`;
        link.href = dataURL;
        link.click();
      }
    },
    addEmoji: (emoji: string) => {
      const center = canvasRef.current.getCenter();
      const text = new fabric.Text(emoji, { fontSize: 64, left: center.left, top: center.top, originX: 'center', originY: 'center' });
      canvasRef.current.add(text).setActiveObject(text).requestRenderAll();
    },
    triggerImport: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (f: any) => {
          canvasRef.current.loadFromJSON(f.target.result, () => {
            applyBackgroundSettings(canvasRef.current, settings);
            const json = JSON.stringify(canvasRef.current.toJSON());
            historyRef.current = [json];
            futureRef.current = [];
            localStorage.setItem('canvas_data', json);
          });
        };
        reader.readAsText(file);
      };
      input.click();
    },
    saveToJSON: () => {
      const json = JSON.stringify(canvasRef.current.toJSON());
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'whiteboard.json';
      link.click();
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const handleMouseDown = (opt: any) => {
      if (canvas.isDrawingMode || canvas.isDragging) return;
      
      if (opt.target) {
        if (activeTool === 'eraser') {
          canvas.remove(opt.target);
          return;
        }

        const currentTime = new Date().getTime();
        const lastClickTime = canvas.lastClickTime || 0;
        if (currentTime - lastClickTime < 300) {
          if (opt.target.type === 'itext') {
            opt.target.enterEditing();
          }
        }
        canvas.lastClickTime = currentTime;
        return;
      }

      if (['select', 'laser', 'eraser', 'smart'].includes(activeTool)) return;

      const pointer = canvas.getPointer(opt.e);
      let shape: any;

      switch (activeTool) {
        case 'rect':
          shape = new fabric.Rect({ left: pointer.x, top: pointer.y, width: 150, height: 100, fill: 'transparent', stroke: settings.color, strokeWidth: settings.strokeWidth });
          break;
        case 'circle':
          shape = new fabric.Circle({ left: pointer.x, top: pointer.y, radius: 50, fill: 'transparent', stroke: settings.color, strokeWidth: settings.strokeWidth });
          break;
        case 'line':
          shape = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], { stroke: settings.color, strokeWidth: settings.strokeWidth });
          break;
        case 'text':
          shape = new fabric.IText('Type here...', { left: pointer.x, top: pointer.y, fontFamily: settings.fontFamily, fontSize: settings.fontSize, fill: settings.color });
          break;
        case 'sticky':
          shape = new fabric.IText('Sticky Note\nDouble click to edit', {
            left: pointer.x, top: pointer.y,
            fontSize: 18,
            padding: 20,
            textAlign: 'center',
            backgroundColor: '#fef08a',
            fontFamily: 'Inter',
            width: 160,
            height: 160,
            splitByGrapheme: true,
            shadow: 'rgba(0,0,0,0.1) 5px 5px 10px'
          });
          break;
      }

      if (shape) {
        canvas.add(shape).setActiveObject(shape);
        if (activeTool === 'text' || activeTool === 'sticky') {
          shape.enterEditing();
          shape.selectAll();
        }
        canvas.requestRenderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    return () => canvas.off('mouse:down', handleMouseDown);
  }, [activeTool, settings.color, settings.strokeWidth, settings.fontFamily, settings.fontSize]);

  return (
    <div ref={containerRef} className="w-full h-full relative no-select bg-zinc-100 dark:bg-zinc-900">
      <canvas id="whiteboard-canvas" />
    </div>
  );
});

export default Whiteboard;
