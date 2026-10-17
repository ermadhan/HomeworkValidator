import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  Zap,
  BookOpen,
  Calendar,
  Bookmark,
  FileText,
  Cpu,
} from 'lucide-react';
import { EvaluationOptions } from '../types/homework';

interface GradingConfigBarProps {
  options: EvaluationOptions;
  onChangeOptions: (options: EvaluationOptions) => void;
  onEvaluate: () => void;
  isLoading: boolean;
  canEvaluate: boolean;
}

export const GradingConfigBar: React.FC<GradingConfigBarProps> = ({
  options,
  onChangeOptions,
  onEvaluate,
  isLoading,
  canEvaluate,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const subjects = [
    'English',
    'Hindi',
    'Kannada',
    'Mathematics',
    'Social Studies',
    'Computer Science',
    'Science',
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* CBSE Class 4 Context Tag */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            CBSE Class 4 (NCERT) Grading Engine
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 hidden sm:inline">
            Step marking (statement + working + ₹ / SI units) & child-friendly encouragement
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              options.modelName === 'open-source-local'
                ? 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold'
                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
            }`}
          >
            {options.modelName === 'open-source-local'
              ? '⚡ Active: Open-Source Local Engine (100% Offline / Zero-Cloud)'
              : `Active Model: ${options.modelName}`}
          </span>
        </div>
      </div>

      {/* Row 1: Evaluation Annotation Fields (Subject, Chapter, Date, Description) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
        {/* Subject Annotation */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center">
            <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Subject <span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            value={options.subject}
            onChange={(e) => onChangeOptions({ ...options, subject: e.target.value })}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter / Topic Annotation */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center">
            <Bookmark className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Chapter / Unit
          </label>
          <input
            type="text"
            placeholder="e.g. Chapter 4: The Junk Seller"
            value={options.chapter || ''}
            onChange={(e) => onChangeOptions({ ...options, chapter: e.target.value })}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Evaluation Date Annotation */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Evaluation Date
          </label>
          <input
            type="date"
            value={options.date || new Date().toISOString().split('T')[0]}
            onChange={(e) => onChangeOptions({ ...options, date: e.target.value })}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Worksheet Description Annotation */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Description / Task Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Money calculations & perimeter word problems"
            value={options.description || ''}
            onChange={(e) => onChangeOptions({ ...options, description: e.target.value })}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Row 2: Strictness, Model Selection & Action Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Left: Strictness level & Model selection */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Grading Strictness
            </label>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              {(['lenient', 'standard', 'strict'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeOptions({ ...options, strictness: mode })}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                    options.strictness === mode
                      ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection in config bar for quick access */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-1 text-slate-500" />
              AI Model (Quota Tier)
            </label>
            <select
              value={options.modelName}
              onChange={(e) =>
                onChangeOptions({
                  ...options,
                  modelName: e.target.value as EvaluationOptions['modelName'],
                })
              }
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="open-source-local">
                ⚡ Open Source Local Engine (Tesseract.js - 100% Offline / No Quota)
              </option>
              <option value="gemini-3.1-flash-lite">
                gemini-3.1-flash-lite (Lower Model / Quota Saver)
              </option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Standard Multimodal)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Stable Latest)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Reasoning)</option>
            </select>
          </div>

          {/* Advanced toggle */}
          <div className="self-end pb-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {showAdvanced ? 'Hide Custom Rubric' : 'Custom Rubric Notes'}
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Submit Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onEvaluate}
            disabled={!canEvaluate || isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md ${
              canEvaluate && !isLoading
                ? options.modelName === 'open-source-local'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-200 hover:shadow-emerald-300 scale-100 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-200 hover:shadow-indigo-300 scale-100 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                <span>
                  {options.modelName === 'open-source-local'
                    ? 'Running Local Tesseract OCR...'
                    : 'Evaluating Handwritten Sheet...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 text-amber-200" />
                <span>
                  {options.modelName === 'open-source-local'
                    ? 'Grade with Open-Source OCR (Offline)'
                    : 'Validate & Grade Homework'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Drawer: Custom Instructions */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Teacher Instructions / Rubric Rules
            </label>
            <input
              type="text"
              placeholder="e.g. Deduct 0.5 points if units are missing. Award full credit for simplified fractions."
              value={options.customInstructions || ''}
              onChange={(e) => onChangeOptions({ ...options, customInstructions: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col justify-center text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 flex items-center mb-0.5">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Vision Processing Pipeline
            </span>
            <span>
              Annotated with subject, chapter, description & date → Multi-page OCR → Mathematical & step-marking evaluation → Custom parent notes.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
