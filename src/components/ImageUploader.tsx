import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  FileQuestion,
  FileText,
  X,
  Camera,
  Eye,
  PenTool,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  FileCode,
} from 'lucide-react';
import { SampleWorksheet, UploadedDocItem } from '../types/homework';
import { optimizeImageForUpload } from '../utils/imageOptimizer';

interface ImageUploaderProps {
  studentSheets: UploadedDocItem[];
  answerKeys: UploadedDocItem[];
  questionPapers: UploadedDocItem[];
  onSetStudentSheets: (updater: UploadedDocItem[] | ((prev: UploadedDocItem[]) => UploadedDocItem[])) => void;
  onSetAnswerKeys: (updater: UploadedDocItem[] | ((prev: UploadedDocItem[]) => UploadedDocItem[])) => void;
  onSetQuestionPapers: (updater: UploadedDocItem[] | ((prev: UploadedDocItem[]) => UploadedDocItem[])) => void;
  onOpenCanvas: () => void;
  samples: SampleWorksheet[];
  onSelectSample: (sample: SampleWorksheet) => void;
  selectedSampleId: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  studentSheets,
  answerKeys,
  questionPapers,
  onSetStudentSheets,
  onSetAnswerKeys,
  onSetQuestionPapers,
  onOpenCanvas,
  samples,
  onSelectSample,
  selectedSampleId,
}) => {
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; mimeType: string } | null>(null);

  const questionPaperInputRef = useRef<HTMLInputElement>(null);
  const answerKeyInputRef = useRef<HTMLInputElement>(null);
  const studentInputRef = useRef<HTMLInputElement>(null);

  const processUploadedFiles = async (
    files: FileList | File[],
    appendItems: (newItems: UploadedDocItem[]) => void
  ) => {
    const fileArray = Array.from(files);
    const newItems: UploadedDocItem[] = [];

    for (const file of fileArray) {
      try {
        const { dataUrl, mimeType } = await optimizeImageForUpload(file);
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          dataUrl,
          mimeType,
          sizeBytes: file.size,
        });
      } catch (err) {
        console.error('Failed to process uploaded file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      appendItems(newItems);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (updater: (prev: UploadedDocItem[]) => UploadedDocItem[]) => void
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    processUploadedFiles(e.target.files, (newItems) => {
      setter((prev) => [...prev, ...newItems]);
    });
    e.target.value = '';
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setter: (updater: (prev: UploadedDocItem[]) => UploadedDocItem[]) => void
  ) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    processUploadedFiles(e.dataTransfer.files, (newItems) => {
      setter((prev) => [...prev, ...newItems]);
    });
  };

  const removeItem = (
    id: string,
    setter: (updater: (prev: UploadedDocItem[]) => UploadedDocItem[]) => void
  ) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Sample Presets Banner */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Quick Test with Pre-Loaded Worksheets (CBSE Class 4)
              </h3>
              <p className="text-xs text-slate-500">
                Click any sample to load sample question sheets, answer keys, and student handwritten answers.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {samples.map((s) => {
            const isSelected = selectedSampleId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSample(s)}
                className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {s.gradeLevel}
                    </span>
                    {isSelected && (
                      <span className="text-indigo-600 text-xs font-semibold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Loaded
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{s.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                </div>
                <div className="mt-3 text-[11px] font-medium text-indigo-600 flex items-center">
                  Use this sample →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3 Dedicated Upload Slots: Worksheet, Answer Key, Son's Answers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* SLOT 1: School Question Worksheet (Images or PDF) */}
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span className="font-semibold text-sm text-slate-900">Worksheet with Questions</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
              {questionPapers.length} {questionPapers.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <p className="text-xs text-slate-500 mb-3">
              The blank worksheet or question paper from school. Accepts multiple photos or a <strong>PDF document</strong>.
            </p>

            {/* List of uploaded files */}
            {questionPapers.length > 0 && (
              <div className="space-y-2 mb-3 max-h-56 overflow-y-auto pr-1">
                {questionPapers.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {item.mimeType === 'application/pdf' ? (
                        <span className="p-1.5 rounded-lg bg-red-100 text-red-600 font-bold text-[10px] shrink-0">
                          PDF
                        </span>
                      ) : (
                        <img
                          src={item.dataUrl}
                          alt="thumb"
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {item.name || `Question Page ${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.mimeType === 'application/pdf' ? 'PDF Document' : 'Image Scan'}{' '}
                          {item.sizeBytes ? `• ${formatFileSize(item.sizeBytes)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() =>
                          setPreviewDoc({
                            title: item.name || `Question Page ${idx + 1}`,
                            url: item.dataUrl,
                            mimeType: item.mimeType,
                          })
                        }
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id, onSetQuestionPapers)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-white"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload dropzone / trigger */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, onSetQuestionPapers)}
              onClick={() => questionPaperInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                questionPapers.length > 0 ? 'min-h-[100px]' : 'min-h-[170px]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <FileQuestion className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {questionPapers.length > 0 ? '+ Add More Pages / PDF' : 'Upload School Worksheet'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF or Image files (PNG, JPG)</p>
            </div>

            <input
              type="file"
              ref={questionPaperInputRef}
              onChange={(e) => handleInputChange(e, onSetQuestionPapers)}
              accept="image/*,application/pdf"
              multiple
              className="hidden"
            />
          </div>
        </div>

        {/* SLOT 2: Teacher Answer Key & Rubric (Images or PDF) */}
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span className="font-semibold text-sm text-slate-900">Answer Key & Solutions</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              {answerKeys.length} {answerKeys.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <p className="text-xs text-slate-500 mb-3">
              Official answer key, solutions, or rubric. Accepts single/multi-page images or <strong>PDF documents</strong>.
            </p>

            {/* List of uploaded files */}
            {answerKeys.length > 0 && (
              <div className="space-y-2 mb-3 max-h-56 overflow-y-auto pr-1">
                {answerKeys.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {item.mimeType === 'application/pdf' ? (
                        <span className="p-1.5 rounded-lg bg-red-100 text-red-600 font-bold text-[10px] shrink-0">
                          PDF
                        </span>
                      ) : (
                        <img
                          src={item.dataUrl}
                          alt="thumb"
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {item.name || `Answer Key Page ${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.mimeType === 'application/pdf' ? 'PDF Document' : 'Image Scan'}{' '}
                          {item.sizeBytes ? `• ${formatFileSize(item.sizeBytes)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() =>
                          setPreviewDoc({
                            title: item.name || `Answer Key Page ${idx + 1}`,
                            url: item.dataUrl,
                            mimeType: item.mimeType,
                          })
                        }
                        className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-white"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id, onSetAnswerKeys)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-white"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload dropzone / trigger */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, onSetAnswerKeys)}
              onClick={() => answerKeyInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                answerKeys.length > 0 ? 'min-h-[100px]' : 'min-h-[170px]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <FileCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {answerKeys.length > 0 ? '+ Add More Pages / PDF' : 'Upload Answer Key'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF or Image files (PNG, JPG)</p>
            </div>

            <input
              type="file"
              ref={answerKeyInputRef}
              onChange={(e) => handleInputChange(e, onSetAnswerKeys)}
              accept="image/*,application/pdf"
              multiple
              className="hidden"
            />
          </div>
        </div>

        {/* SLOT 3: Son's Handwritten Answers (Multiple Photos or PDF or Canvas) */}
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span className="font-semibold text-sm text-slate-900">Son's Handwritten Answers</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
              {studentSheets.length} {studentSheets.length === 1 ? 'page' : 'pages'}
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <p className="text-xs text-slate-500 mb-3">
              Photo(s) of your son's notebook pages or scanned <strong>multi-page PDF</strong>.
            </p>

            {/* List of uploaded files */}
            {studentSheets.length > 0 && (
              <div className="space-y-2 mb-3 max-h-56 overflow-y-auto pr-1">
                {studentSheets.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {item.mimeType === 'application/pdf' ? (
                        <span className="p-1.5 rounded-lg bg-red-100 text-red-600 font-bold text-[10px] shrink-0">
                          PDF
                        </span>
                      ) : (
                        <img
                          src={item.dataUrl}
                          alt="thumb"
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {item.name || `Answer Page ${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.mimeType === 'application/pdf' ? 'PDF Document' : 'Handwritten Page'}{' '}
                          {item.sizeBytes ? `• ${formatFileSize(item.sizeBytes)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() =>
                          setPreviewDoc({
                            title: item.name || `Answer Page ${idx + 1}`,
                            url: item.dataUrl,
                            mimeType: item.mimeType,
                          })
                        }
                        className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-white"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id, onSetStudentSheets)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-white"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload dropzone / trigger */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, onSetStudentSheets)}
              className={`border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                studentSheets.length > 0 ? 'min-h-[100px]' : 'min-h-[170px]'
              }`}
              onClick={() => studentInputRef.current?.click()}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {studentSheets.length > 0 ? '+ Add More Pages / PDF' : "Upload Son's Answers"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Select multiple page photos or PDF file</p>

              <div className="mt-3 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => studentInputRef.current?.click()}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Browse Photos / PDF
                </button>
                <button
                  type="button"
                  onClick={onOpenCanvas}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-2xs"
                >
                  <PenTool className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Draw Answers
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={studentInputRef}
              onChange={(e) => handleInputChange(e, onSetStudentSheets)}
              accept="image/*,application/pdf"
              multiple
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Preview Modal supporting Images & PDFs */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800 text-sm">{previewDoc.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                  {previewDoc.mimeType === 'application/pdf' ? 'PDF' : 'IMAGE'}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 p-2">
              {previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                  className="w-full h-full border-none rounded-lg bg-white shadow-inner"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
