import React, { useState } from 'react';
import { X, Sparkles, Terminal, Laptop, HelpCircle, Check, Copy, ExternalLink, Play } from 'lucide-react';

interface WindowsInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsInstructionsModal: React.FC<WindowsInstructionsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'online' | 'python' | 'electron'>('online');
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const pythonSnippet = `python evaluate_homework.py \\
  --paper "C:\\Worksheets\\school_math_worksheet.pdf" \\
  --key "C:\\Worksheets\\teacher_answer_key.pdf" \\
  --student "C:\\Worksheets\\son_page1.jpg" "C:\\Worksheets\\son_page2.jpg"`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Running Options for Windows & AI Studio</h3>
              <p className="text-xs text-slate-300">
                How to run online in browser or locally on your Windows PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('online')}
            className={`pb-3 px-3 border-b-2 transition-all ${
              activeTab === 'online'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Web App in Browser (Recommended)
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`pb-3 px-3 border-b-2 transition-all ${
              activeTab === 'python'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            2. Standalone Windows Python CLI
          </button>
          <button
            onClick={() => setActiveTab('electron')}
            className={`pb-3 px-3 border-b-2 transition-all ${
              activeTab === 'electron'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            3. Windows Desktop Executable (.exe)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-slate-700">
          {activeTab === 'online' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950 text-sm">Direct Browser Workflow & Offline Engine</h4>
                  <p className="text-xs text-indigo-900 mt-1">
                    You don't need to install anything on your Windows computer! You can run online or use the built-in <strong>Open Source Local Engine (Tesseract.js)</strong> which works 100% offline with zero cloud API keys and zero quota limits.
                  </p>
                </div>
              </div>

              <ol className="list-decimal list-inside space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="pl-1">
                  <strong>Slot 1 (School Worksheet with Questions):</strong> Take a photo or upload the PDF/image sent by your son's teacher or school.
                </li>
                <li className="pl-1">
                  <strong>Slot 2 (Answer Key & Solutions):</strong> Upload the official answer sheet or textbook solutions.
                </li>
                <li className="pl-1">
                  <strong>Slot 3 (Son's Handwritten Answers):</strong> Snap a clear photo of your son's worksheet with your smartphone, or let him write directly on the built-in <strong>"Draw Handwriting"</strong> canvas!
                </li>
                <li className="pl-1">
                  Click <strong>"Validate & Grade Homework"</strong>. Within seconds, Gemini scans the handwriting, matches each question, grades the work, and highlights exactly what to review.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600">
                A complete standalone CLI tool named <code>evaluate_homework.py</code> is generated and included directly in this repository root.
              </p>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Step 1: Install packages on Windows</span>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto">
pip install google-genai pillow pydantic
                </pre>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Step 2: Set your API key in CMD / PowerShell</span>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto">
set GEMINI_API_KEY=your_key_here     # In Windows CMD
$env:GEMINI_API_KEY="your_key_here"  # In Windows PowerShell
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Step 3: Run against your 3 files</span>
                  <button
                    onClick={() => copyToClipboard(pythonSnippet)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    Copy Command
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'electron' && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-600">
                To create a native double-clickable Windows installer (<code>.exe</code>) for your son and family:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700">
                <li>Download or clone this folder onto your Windows PC.</li>
                <li>Install dependencies by opening terminal in folder and running:
                  <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-xs font-mono mt-1">npm install</pre>
                </li>
                <li>Set your <code>GEMINI_API_KEY</code> in a <code>.env</code> file.</li>
                <li>Package into a native Windows executable with:
                  <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-xs font-mono mt-1">npx electron-builder --windows</pre>
                </li>
                <li>The executable is generated in the <code>dist/</code> folder ready for everyday offline/desktop use!</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Full instructions also saved in <code className="font-semibold text-slate-700">/WINDOWS_DESKTOP_SETUP.md</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
