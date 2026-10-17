import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Eraser,
  Pen,
  Check,
  Palette,
  Sparkles,
  Download,
} from 'lucide-react';

interface HandwritingCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsStudentSheet: (dataUrl: string) => void;
}

export const HandwritingCanvasModal: React.FC<HandwritingCanvasModalProps> = ({
  isOpen,
  onClose,
  onSaveAsStudentSheet,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1e40af'); // blue ink
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas with ruled notebook background
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 750;
      canvas.height = 1000;

      // Draw notebook paper
      drawNotebookBackground(ctx, canvas.width, canvas.height);

      // Save initial state
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const drawNotebookBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Soft paper background
    ctx.fillStyle = '#fdfcf7';
    ctx.fillRect(0, 0, width, height);

    // Margin line
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, height);
    ctx.stroke();

    // Ruled lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let y = 110; y < height - 20; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Name & Header header
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('NAME: ____________________', 100, 45);
    ctx.fillText('DATE: ________________', 520, 45);
    ctx.font = 'italic 13px system-ui, sans-serif';
    ctx.fillText('Handwritten Student Homework Scratchpad', 100, 75);
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    setIsDrawing(true);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#fdfcf7' : color;
    ctx.lineWidth = isEraser ? 24 : lineWidth;
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot to history (cap at 20 steps)
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-19), currentState]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // remove current
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawNotebookBackground(ctx, canvas.width, canvas.height);
    const blankState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, blankState]);
  };

  const insertMathPrompt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('1. Solve: 3/4 + 2/3 = ?', 100, 145);
    ctx.fillText('2. Multiply: 142 × 18 = ?', 100, 285);
    ctx.fillText('3. Area of 12m × 8m rectangle = ?', 100, 425);
    ctx.fillText('4. Solve for x: 3x + 7 = 28', 100, 565);

    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 12px system-ui, sans-serif';
    ctx.fillText('(Write your handwritten solutions below each prompt)', 100, 170);

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, snapshot]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveAsStudentSheet(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Pen className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Handwritten Student Sheet Scratchpad
              </h3>
              <p className="text-xs text-slate-500">
                Scribble math calculations or answers with mouse, stylus, or touch!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Use as Student Sheet
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tools & Colors */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEraser(false)}
              className={`p-2 rounded-lg flex items-center font-medium transition-all ${
                !isEraser
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Pen Tool"
            >
              <Pen className="w-4 h-4 mr-1" /> Pen
            </button>

            <button
              onClick={() => setIsEraser(true)}
              className={`p-2 rounded-lg flex items-center font-medium transition-all ${
                isEraser
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4 mr-1" /> Eraser
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Ink color picker */}
            <div className="flex items-center space-x-1.5">
              {[
                { hex: '#1e40af', label: 'Blue ink' },
                { hex: '#0f172a', label: 'Black ink' },
                { hex: '#475569', label: 'Pencil grey' },
                { hex: '#dc2626', label: 'Red ink' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setColor(c.hex);
                    setIsEraser(false);
                  }}
                  title={c.label}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c.hex && !isEraser
                      ? 'ring-2 ring-indigo-500 scale-110 shadow-xs'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Stroke size */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-400 text-[11px]">Size:</span>
              {[2, 3, 5].map((w) => (
                <button
                  key={w}
                  onClick={() => setLineWidth(w)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${
                    lineWidth === w && !isEraser
                      ? 'bg-slate-200 text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {w === 2 ? 'S' : w === 3 ? 'M' : 'L'}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={insertMathPrompt}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium"
              title="Add sample questions to write answers under"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Add Math Prompts
            </button>
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={clearCanvas}
              className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-medium"
            >
              Clear Page
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-200/60 p-4 flex items-center justify-center">
          <div className="shadow-lg border border-slate-300 rounded-sm bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none"
              style={{ width: '600px', height: '800px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
