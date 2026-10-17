import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { GradingConfigBar } from './components/GradingConfigBar';
import { EvaluationReportView } from './components/EvaluationReportView';
import { HandwritingCanvasModal } from './components/HandwritingCanvasModal';
import { PracticeModal } from './components/PracticeModal';
import { WindowsInstructionsModal } from './components/WindowsInstructionsModal';
import {
  HomeworkEvaluationReport,
  EvaluationOptions,
  PracticeItem,
  QuestionEvaluation,
  SampleWorksheet,
  UploadedDocItem,
} from './types/homework';
import { getSampleWorksheets } from './utils/sampleWorksheets';
import {
  evaluateWithLocalEngine,
  generateLocalPracticeExercises,
} from './utils/localEvaluator';
import { AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [samples, setSamples] = useState<SampleWorksheet[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Arrays of documents for multiple files / PDFs
  const [studentSheets, setStudentSheets] = useState<UploadedDocItem[]>([]);
  const [answerKeys, setAnswerKeys] = useState<UploadedDocItem[]>([]);
  const [questionPapers, setQuestionPapers] = useState<UploadedDocItem[]>([]);

  const [options, setOptions] = useState<EvaluationOptions>({
    strictness: 'standard',
    subject: 'Mathematics',
    chapter: 'Ch 4, 10 & 11: The Junk Seller, Fields & Fences, Tables & Shares',
    description: 'Money word problems (₹), Length conversion (m to cm) & Perimeter',
    date: new Date().toISOString().split('T')[0],
    customInstructions: '',
    modelName: 'gemini-3.1-flash-lite',
  });

  const [report, setReport] = useState<HomeworkEvaluationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isWindowsGuideOpen, setIsWindowsGuideOpen] = useState(false);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);

  // Initialize sample worksheets on mount
  useEffect(() => {
    try {
      const generatedSamples = getSampleWorksheets();
      setSamples(generatedSamples);

      // Pre-select the Math sample so the user can test in 1 click
      if (generatedSamples.length > 0) {
        const first = generatedSamples[0];
        setSelectedSampleId(first.id);
        setStudentSheets(first.studentSheets);
        setAnswerKeys(first.answerKeys);
        setQuestionPapers(first.questionPapers || []);
        setOptions((prev) => ({ ...prev, subject: first.subject }));
      }
    } catch (err) {
      console.error('Failed to generate initial sample worksheets:', err);
    }
  }, []);

  const handleSelectSample = (sample: SampleWorksheet) => {
    setSelectedSampleId(sample.id);
    setStudentSheets(sample.studentSheets);
    setAnswerKeys(sample.answerKeys);
    setQuestionPapers(sample.questionPapers || []);
    setOptions((prev) => ({
      ...prev,
      subject: sample.subject,
      chapter: sample.chapter || '',
      description: sample.description || '',
      date: sample.date || new Date().toISOString().split('T')[0],
    }));
    setReport(null);
    setError(null);
  };

  const handleReset = () => {
    setStudentSheets([]);
    setAnswerKeys([]);
    setQuestionPapers([]);
    setSelectedSampleId(null);
    setReport(null);
    setError(null);
  };

  const handleCanvasSave = (dataUrl: string) => {
    const newItem: UploadedDocItem = {
      id: `canvas-${Date.now()}`,
      name: `Handwritten_Draw_Page_${studentSheets.length + 1}.png`,
      dataUrl,
      mimeType: 'image/png',
    };
    setStudentSheets((prev) => [...prev, newItem]);
    setSelectedSampleId(null);
  };

  const handleEvaluateWithLocal = async () => {
    if (studentSheets.length === 0 || answerKeys.length === 0) {
      setError('Please provide at least one student handwritten sheet/page and one answer key (image or PDF).');
      return;
    }

    setOptions((prev) => ({ ...prev, modelName: 'open-source-local' }));
    setIsLoading(true);
    setError(null);
    setLoadingStep('Initializing Open-Source Tesseract.js OCR engine (100% offline)...');

    try {
      const localReport = await evaluateWithLocalEngine(
        { ...options, modelName: 'open-source-local' },
        { studentSheets, answerKeys, questionPapers },
        (step) => setLoadingStep(step)
      );
      setReport(localReport);
      setTimeout(() => {
        const reportElement = document.getElementById('evaluation-report-section');
        if (reportElement) {
          reportElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Local OCR Evaluation error:', err);
      setError(err.message || 'Failed to complete local OCR evaluation.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleEvaluate = async () => {
    if (studentSheets.length === 0 || answerKeys.length === 0) {
      setError('Please provide at least one student handwritten sheet/page and one answer key (image or PDF).');
      return;
    }

    // If Open Source Local Engine is selected, run client-side without cloud
    if (options.modelName === 'open-source-local') {
      await handleEvaluateWithLocal();
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep('Uploading documents & PDF pages to Gemini Vision pipeline...');

    // Progress step animation sequence
    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Deciphering student handwritten working across pages...');
    }, 1500);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Cross-referencing answers with teacher key & rubric...');
    }, 3200);

    const stepTimer3 = setTimeout(() => {
      setLoadingStep('Formulating comprehensive grading report and tutor feedback...');
    }, 5500);

    try {
      const payload = JSON.stringify({
        studentSheets,
        answerKeys,
        questionPapers,
        strictness: options.strictness,
        subject: options.subject,
        chapter: options.chapter,
        description: options.description,
        date: options.date,
        customInstructions: options.customInstructions,
        modelName: options.modelName,
      });

      let response = await fetch('/api/evaluate-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      // If server returned warmup HTML or 502/503 during restart, wait 2 seconds and retry once
      let contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        const initialText = await response.clone().text().catch(() => '');
        if (
          initialText.includes('warmup') ||
          initialText.includes('<!doctype') ||
          response.status === 502 ||
          response.status === 503
        ) {
          setLoadingStep('Backend service is warming up, reconnecting in 2 seconds...');
          await new Promise((r) => setTimeout(r, 2000));
          response = await fetch('/api/evaluate-homework', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
          contentType = response.headers.get('content-type') || '';
        }
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!response.ok || !contentType.includes('application/json')) {
        let errorMsg = `Evaluation failed (status ${response.status})`;
        if (contentType.includes('application/json')) {
          const data = await response.json().catch(() => ({}));
          errorMsg = data.error || errorMsg;
        } else {
          const rawText = await response.text().catch(() => '');
          if (rawText.includes('warmup') || rawText.includes('<!doctype') || rawText.includes('<html')) {
            errorMsg =
              'The AI evaluation server is currently warming up or restarting. Please click "Validate & Grade Homework" again in a few moments.';
          } else if (rawText) {
            errorMsg = rawText.slice(0, 180);
          }
        }
        throw new Error(errorMsg);
      }

      const reportData: HomeworkEvaluationReport = await response.json();
      setReport(reportData);

      // Scroll smoothly down to the report
      setTimeout(() => {
        const reportElement = document.getElementById('evaluation-report-section');
        if (reportElement) {
          reportElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setError(
        err.message ||
          'An error occurred while evaluating the homework scan. You can switch to the Open-Source Local Engine below (no cloud quota required).'
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleGeneratePractice = async (missedQuestions: QuestionEvaluation[]) => {
    setIsGeneratingPractice(true);
    setIsPracticeOpen(true);
    setPracticeItems([]);

    // If using open-source local engine, generate practice completely locally
    if (report?.engineType === 'open-source-local' || options.modelName === 'open-source-local') {
      const localItems = generateLocalPracticeExercises(missedQuestions, options.subject);
      setPracticeItems(localItems);
      setIsGeneratingPractice(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missedQuestions,
          subject: options.subject,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        console.warn('Cloud practice generation failed, falling back to local practice generator');
        const fallbackItems = generateLocalPracticeExercises(missedQuestions, options.subject);
        setPracticeItems(fallbackItems);
        return;
      }

      const data = await response.json();
      setPracticeItems(
        data.practiceItems && data.practiceItems.length > 0
          ? data.practiceItems
          : generateLocalPracticeExercises(missedQuestions, options.subject)
      );
    } catch (err: any) {
      console.warn('Practice generation network error, using local practice generator:', err);
      const fallbackItems = generateLocalPracticeExercises(missedQuestions, options.subject);
      setPracticeItems(fallbackItems);
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        onOpenCanvas={() => setIsCanvasOpen(true)}
        onOpenWindowsGuide={() => setIsWindowsGuideOpen(true)}
        selectedModel={options.modelName}
        onChangeModel={(model) => setOptions((prev) => ({ ...prev, modelName: model }))}
        hasResults={!!report}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="text-sm">🇮🇳</span>
            <span>CBSE Class 4 (NCERT Syllabus) • AI Homework Grader</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Grade & Evaluate Your Son's Homework in Seconds
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Upload the <strong>School Question Worksheet</strong> (PDF or Photos), the <strong>Teacher Answer Key</strong> (PDF or Photos), and multiple pages of your <strong>Son's Handwritten Answers</strong>. Gemini deciphers his handwriting across pages, verifies calculations, awards CBSE step-marks, and generates practice problems for home revision.
          </p>
        </div>

        {/* Error Alert with 1-Click Open-Source Fallback */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 text-red-900 text-xs sm:text-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-1">Evaluation Notice / Cloud Model Limit</strong>
                  <p className="text-red-700 leading-relaxed">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-700 font-bold ml-2 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-white/90 border border-red-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="text-xs text-slate-700 space-y-0.5">
                <strong className="text-emerald-800 flex items-center font-bold text-sm">
                  <Sparkles className="w-4 h-4 mr-1 text-emerald-600" />
                  Instant Solution: Use 100% Open-Source Local OCR Engine
                </strong>
                <p className="text-slate-600">
                  Runs Tesseract.js directly inside your browser. Requires <strong>zero cloud APIs</strong>, <strong>zero external keys</strong>, and <strong>never exhausts quota</strong>!
                </p>
              </div>
              <button
                onClick={() => handleEvaluateWithLocal()}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
                Evaluate with Open-Source Engine
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Upload / Pick Worksheets */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mr-2">
                1
              </span>
              Worksheet Files & Photos
            </h2>
            <span className="text-xs text-slate-500">
              Upload multiple photos or PDFs for each category
            </span>
          </div>

          <ImageUploader
            studentSheets={studentSheets}
            answerKeys={answerKeys}
            questionPapers={questionPapers}
            onSetStudentSheets={setStudentSheets}
            onSetAnswerKeys={setAnswerKeys}
            onSetQuestionPapers={setQuestionPapers}
            onOpenCanvas={() => setIsCanvasOpen(true)}
            samples={samples}
            onSelectSample={handleSelectSample}
            selectedSampleId={selectedSampleId}
          />
        </section>

        {/* Step 2: Grading Settings & Submit */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mr-2">
                2
              </span>
              Grading Rubric & Strictness
            </h2>
            <span className="text-xs text-slate-500">Configure evaluation parameters</span>
          </div>

          <GradingConfigBar
            options={options}
            onChangeOptions={setOptions}
            onEvaluate={handleEvaluate}
            isLoading={isLoading}
            canEvaluate={studentSheets.length > 0 && answerKeys.length > 0}
          />
        </section>

        {/* Loading Overlay & Animation */}
        {isLoading && (
          <div className="bg-white border border-indigo-100 rounded-3xl p-8 sm:p-12 text-center shadow-lg shadow-indigo-50/50 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-lg font-bold text-slate-900">
                Evaluating Student Homework
              </h3>
              <p className="text-xs sm:text-sm text-indigo-600 font-medium animate-pulse">
                {loadingStep || 'Processing documents and handwriting with Gemini Vision...'}
              </p>
              <p className="text-xs text-slate-400">
                Multi-page recognition • Semantic answer matching • Step marks calculation
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Evaluation Results Dashboard */}
        {report && (
          <section id="evaluation-report-section" className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mr-2">
                    3
                  </span>
                  Homework Evaluation Report
                </h2>
                <p className="text-xs text-slate-500">
                  Detailed score breakdown, handwritten transcription, and parent notes
                </p>
              </div>
            </div>

            <EvaluationReportView
              report={report}
              studentSheets={studentSheets}
              answerKeys={answerKeys}
              questionPapers={questionPapers}
              onUpdateReport={setReport}
              onGeneratePractice={handleGeneratePractice}
              isGeneratingPractice={isGeneratingPractice}
            />
          </section>
        )}
      </main>

      {/* Handwriting Canvas Scratchpad Modal */}
      <HandwritingCanvasModal
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSaveAsStudentSheet={handleCanvasSave}
      />

      {/* Remedial Practice Modal */}
      <PracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        practiceItems={practiceItems}
        isLoading={isGeneratingPractice}
      />

      {/* Standalone Windows & App Guide Modal */}
      <WindowsInstructionsModal
        isOpen={isWindowsGuideOpen}
        onClose={() => setIsWindowsGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Homework AI • CBSE Class 4 Homework Grader & Practice Engine</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Model: {options.modelName}</span>
            <span>•</span>
            <span>Multimodal Vision & PDF Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
