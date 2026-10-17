import React from 'react';
import { Sparkles, GraduationCap, RefreshCw, FileText, PenTool, CheckCircle2, Laptop } from 'lucide-react';
import { EvaluationOptions } from '../types/homework';

interface HeaderProps {
  onReset: () => void;
  onOpenCanvas: () => void;
  onOpenWindowsGuide: () => void;
  selectedModel: EvaluationOptions['modelName'];
  onChangeModel: (model: EvaluationOptions['modelName']) => void;
  hasResults: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenCanvas,
  onOpenWindowsGuide,
  selectedModel,
  onChangeModel,
  hasResults,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Homework AI</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-500" />
                  Vision Grader
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Automated Handwritten Sheet Transcription & Answer Key Validation
              </p>
            </div>
          </div>

          {/* Right action controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Model Selector with Open Source and Cloud Options */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
              <span className="px-2 text-slate-500 font-medium hidden md:inline">Engine:</span>
              <button
                onClick={() => onChangeModel('open-source-local')}
                className={`px-2 py-1 rounded-md font-medium transition-all flex items-center ${
                  selectedModel === 'open-source-local'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50/60 font-semibold'
                }`}
                title="100% Client-side Open Source OCR (Tesseract.js). No cloud, zero quota, runs completely offline!"
              >
                <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
                Open Source (No Quota)
              </button>
              <button
                onClick={() => onChangeModel('gemini-3.1-flash-lite')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Lightweight, lower quota/resource usage model (recommended if hitting quota limits)"
              >
                3.1 Flash-Lite
              </button>
              <button
                onClick={() => onChangeModel('gemini-3.8-flash')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Gemini 3.8 Flash multimodal model"
              >
                3.8 Flash
              </button>
            </div>

            {/* Standalone Windows app guide button */}
            <button
              onClick={onOpenWindowsGuide}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
              title="How to run as standalone Windows app or in browser"
            >
              <Laptop className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
              <span className="hidden sm:inline">Windows /</span> Setup
            </button>

            {/* Scribble canvas button */}
            <button
              onClick={onOpenCanvas}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
              title="Draw or scribble handwritten math/text on an interactive notebook canvas"
            >
              <PenTool className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span className="hidden sm:inline">Draw</span> Handwriting
            </button>

            {/* Reset button if active */}
            {hasResults && (
              <button
                onClick={onReset}
                className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                New Grade
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
