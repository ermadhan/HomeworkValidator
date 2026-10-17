import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Columns,
  ListFilter,
  FileCheck,
  FileQuestion,
  Edit3,
  Calendar,
  Bookmark,
  FileText,
  Tag,
} from 'lucide-react';
import { HomeworkEvaluationReport, QuestionEvaluation, UploadedDocItem } from '../types/homework';

interface EvaluationReportViewProps {
  report: HomeworkEvaluationReport;
  studentSheets: UploadedDocItem[];
  answerKeys: UploadedDocItem[];
  questionPapers: UploadedDocItem[];
  onUpdateReport: (updated: HomeworkEvaluationReport) => void;
  onGeneratePractice: (missedQuestions: QuestionEvaluation[]) => void;
  isGeneratingPractice: boolean;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  report,
  studentSheets,
  answerKeys,
  questionPapers,
  onUpdateReport,
  onGeneratePractice,
  isGeneratingPractice,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [activeTab, setActiveTab] = useState<'breakdown' | 'splitView'>('breakdown');
  const [activeScanView, setActiveScanView] = useState<'student' | 'key' | 'worksheet'>('student');
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Calculate letter grade
  const getLetterGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (pct >= 80) return { grade: 'B', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (pct >= 70) return { grade: 'C', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (pct >= 60) return { grade: 'D', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { grade: 'F', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  const letter = getLetterGrade(report.percentage);

  // Missed questions for remedial practice
  const missedQuestions = report.evaluations.filter(
    (e) => !e.is_correct || e.points_awarded < e.max_points
  );

  // Filtered list
  const filteredEvaluations = report.evaluations.filter((item) => {
    if (filter === 'correct') return item.is_correct;
    if (filter === 'incorrect') return !item.is_correct || item.points_awarded < item.max_points;
    return true;
  });

  // Teacher manual point adjustment
  const handlePointChange = (index: number, newPoints: number) => {
    const updatedEvaluations = [...report.evaluations];
    const item = updatedEvaluations[index];
    const clampedPoints = Math.max(0, Math.min(item.max_points, newPoints));

    updatedEvaluations[index] = {
      ...item,
      points_awarded: clampedPoints,
      is_correct: clampedPoints === item.max_points,
    };

    const newTotal = updatedEvaluations.reduce((sum, q) => sum + q.points_awarded, 0);
    const newMax = updatedEvaluations.reduce((sum, q) => sum + q.max_points, 0);
    const newPct = newMax > 0 ? (newTotal / newMax) * 100 : 0;

    onUpdateReport({
      ...report,
      evaluations: updatedEvaluations,
      total_score: Number(newTotal.toFixed(1)),
      max_total_score: Number(newMax.toFixed(1)),
      percentage: Number(newPct.toFixed(1)),
    });
  };

  const copyReportSummary = () => {
    const lines = [
      '========================================',
      '       HOMEWORK EVALUATION REPORT       ',
      '========================================',
      `Subject: ${report.subject || 'Not specified'}`,
      report.chapter ? `Chapter / Unit: ${report.chapter}` : '',
      report.description ? `Description: ${report.description}` : '',
      `Date: ${report.date || new Date().toISOString().split('T')[0]}`,
      '----------------------------------------',
      `Score: ${report.total_score} / ${report.max_total_score} (${report.percentage.toFixed(1)}%)`,
      `Summary Notes: ${report.summary_notes}`,
      '',
      'ITEMIZED BREAKDOWN:',
      ...report.evaluations.map((item) => {
        const mark = item.is_correct ? '✅ CORRECT' : '❌ INCORRECT';
        return `[Q${item.question_number}] ${mark} (${item.points_awarded}/${item.max_points} pts)
  Worksheet Question: ${item.question_text}
  Expected Key: ${item.reference_answer}
  Son's Answer: ${item.student_answer}
  Feedback: ${item.feedback}
----------------------------------------`;
      }),
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Score & Parent Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Annotation Header Strip (Subject, Chapter, Date, Description) */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 font-bold border border-indigo-400/30">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                {report.subject || 'Class 4 Evaluation'}
              </span>

              {report.chapter && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 font-semibold border border-emerald-400/30">
                  <Bookmark className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  {report.chapter}
                </span>
              )}

              {report.engineType === 'open-source-local' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/50">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
                  Open-Source OCR (Offline / Zero Quota)
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                {report.date || new Date().toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          {report.description && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-start space-x-2 text-xs text-slate-300">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{report.description}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Score & Letter Grade */}
          <div className="flex items-center space-x-5">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-indigo-100 flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {report.percentage.toFixed(0)}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xl font-bold text-slate-900">
                  {report.total_score} / {report.max_total_score} Points
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${letter.color}`}
                >
                  Grade {letter.grade}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Validated against school worksheet and answer key
              </p>

              {report.handwriting_legibility && (
                <div className="mt-2 inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  Handwriting: <strong className="ml-1 text-slate-800">{report.handwriting_legibility}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {missedQuestions.length > 0 && (
              <button
                onClick={() => onGeneratePractice(missedQuestions)}
                disabled={isGeneratingPractice}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs hover:from-purple-500 hover:to-indigo-500 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {isGeneratingPractice ? 'Generating Practice...' : 'Targeted Practice for Son'}
              </button>
            )}

            <button
              onClick={copyReportSummary}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" /> Copy Report
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" /> Print Summary
            </button>
          </div>
        </div>

        {/* Parent Summary Notes */}
        <div className="mt-6 bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Guidance & Notes for Parents
            </h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-sans">
            {report.summary_notes}
          </p>

          {/* Strengths & Growth badges */}
          {(report.strengths || report.areas_for_growth) && (
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.strengths && report.strengths.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Strong Concepts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.strengths.map((str, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium"
                      >
                        {str}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {report.areas_for_growth && report.areas_for_growth.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Need Practice at Home
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.areas_for_growth.map((str, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-medium"
                      >
                        {str}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Switcher & Question Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        {/* Filter buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Questions ({report.evaluations.length})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'correct'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Correct ({report.evaluations.filter((e) => e.is_correct).length})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'incorrect'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-red-700'
            }`}
          >
            Mistakes to Review ({missedQuestions.length})
          </button>
        </div>

        {/* Split View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 rounded-lg flex items-center transition-all ${
              activeTab === 'breakdown'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 mr-1.5" />
            Itemized List
          </button>
          <button
            onClick={() => setActiveTab('splitView')}
            className={`px-3 py-1.5 rounded-lg flex items-center transition-all ${
              activeTab === 'splitView'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5 mr-1.5" />
            Side-by-Side Scans
          </button>
        </div>
      </div>

      {/* Split view vs Normal view */}
      <div
        className={
          activeTab === 'splitView'
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'
            : 'space-y-4'
        }
      >
        {/* Left Column in Split View: Document Switcher */}
        {activeTab === 'splitView' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs sticky top-20">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Original Scans & Papers
              </h4>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-medium">
                <button
                  onClick={() => {
                    setActiveScanView('student');
                    setSelectedDocIndex(0);
                  }}
                  className={`px-2 py-1 rounded-md transition-all ${
                    activeScanView === 'student' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Son's Answers ({studentSheets.length})
                </button>
                <button
                  onClick={() => {
                    setActiveScanView('worksheet');
                    setSelectedDocIndex(0);
                  }}
                  className={`px-2 py-1 rounded-md transition-all ${
                    activeScanView === 'worksheet' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Worksheet ({questionPapers.length})
                </button>
                <button
                  onClick={() => {
                    setActiveScanView('key');
                    setSelectedDocIndex(0);
                  }}
                  className={`px-2 py-1 rounded-md transition-all ${
                    activeScanView === 'key' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Answer Key ({answerKeys.length})
                </button>
              </div>
            </div>

            {/* If multiple files exist in the selected category, show page selector pills */}
            {(() => {
              const currentList =
                activeScanView === 'student'
                  ? studentSheets
                  : activeScanView === 'worksheet'
                  ? questionPapers
                  : answerKeys;

              if (currentList.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No documents uploaded in this category.
                  </div>
                );
              }

              const safeIndex = Math.min(selectedDocIndex, currentList.length - 1);
              const activeDoc = currentList[safeIndex];

              return (
                <div className="space-y-3">
                  {currentList.length > 1 && (
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                      {currentList.map((doc, idx) => (
                        <button
                          key={doc.id || idx}
                          onClick={() => setSelectedDocIndex(idx)}
                          className={`px-2.5 py-1 rounded-md font-semibold text-[11px] whitespace-nowrap transition-all ${
                            safeIndex === idx
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {doc.name || `Page ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-[650px] flex items-center justify-center">
                    {activeDoc.mimeType === 'application/pdf' ? (
                      <iframe
                        src={activeDoc.dataUrl}
                        title={activeDoc.name || 'PDF Preview'}
                        className="w-full h-full border-none"
                      />
                    ) : (
                      <div className="w-full h-full overflow-y-auto flex items-center justify-center p-2">
                        <img
                          src={activeDoc.dataUrl}
                          alt={activeDoc.name || 'Document scan'}
                          className="max-w-full h-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Itemized Questions List */}
        <div className="space-y-4 flex-1">
          {filteredEvaluations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
              No questions found for the selected filter.
            </div>
          ) : (
            filteredEvaluations.map((item, idx) => {
              const originalIndex = report.evaluations.findIndex(
                (q) => q.question_number === item.question_number
              );
              const isFullScore = item.points_awarded === item.max_points;
              const isZeroScore = item.points_awarded === 0;

              return (
                <div
                  key={item.question_number}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    isFullScore
                      ? 'border-emerald-200/80 hover:border-emerald-300'
                      : isZeroScore
                      ? 'border-red-200/80 hover:border-red-300'
                      : 'border-amber-200/80 hover:border-amber-300'
                  }`}
                >
                  {/* Question Header & Points */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      {isFullScore ? (
                        <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-5 h-5" />
                        </span>
                      ) : isZeroScore ? (
                        <span className="p-1 rounded-full bg-red-100 text-red-700">
                          <XCircle className="w-5 h-5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded-full bg-amber-100 text-amber-700">
                          <AlertCircle className="w-5 h-5" />
                        </span>
                      )}

                      <h4 className="text-base font-bold text-slate-900">
                        Question {item.question_number}
                      </h4>

                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isFullScore
                            ? 'bg-emerald-50 text-emerald-800'
                            : isZeroScore
                            ? 'bg-red-50 text-red-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {isFullScore
                          ? 'Correct'
                          : isZeroScore
                          ? 'Incorrect'
                          : 'Partial Credit'}
                      </span>
                    </div>

                    {/* Points Stepper with Teacher Override */}
                    <div className="flex items-center space-x-2 self-start sm:self-auto bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                      <span className="text-xs text-slate-500 font-medium">Score:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.max_points}
                        step="0.5"
                        value={item.points_awarded}
                        onChange={(e) =>
                          handlePointChange(originalIndex, parseFloat(e.target.value) || 0)
                        }
                        className="w-12 text-center text-xs font-bold bg-white border border-slate-300 rounded-md py-0.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        title="Manual score override: adjust points awarded"
                      />
                      <span className="text-xs text-slate-500 font-medium">
                        / {item.max_points} pts
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Worksheet Problem Statement
                    </span>
                    <p className="text-sm font-semibold text-slate-800 font-sans">
                      {item.question_text}
                    </p>
                  </div>

                  {/* Answer Comparison Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Expected Answer */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Expected
                        Answer (Key)
                      </span>
                      <p className="text-xs font-mono font-medium text-emerald-950 whitespace-pre-wrap">
                        {item.reference_answer}
                      </p>
                    </div>

                    {/* Son's Handwritten Transcribed Answer */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center mb-1">
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-600" /> Son's Handwritten
                        Answer
                      </span>
                      <p className="text-xs font-mono font-medium text-blue-950 whitespace-pre-wrap">
                        {item.student_answer || '(No answer detected)'}
                      </p>
                    </div>
                  </div>

                  {/* Tutor Feedback */}
                  {item.feedback && (
                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 font-semibold">Tutor Explanation: </strong>
                        <span>{item.feedback}</span>
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Analysis if present */}
                  {item.student_work_analysis && (
                    <div className="mt-2 text-[11px] text-slate-500 italic pl-6">
                      Step breakdown: {item.student_work_analysis}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
