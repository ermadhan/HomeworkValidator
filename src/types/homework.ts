export interface UploadedDocItem {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes?: number;
  previewUrl?: string; // image thumbnail for display (especially if PDF)
}

export interface QuestionEvaluation {
  question_number: string;
  question_text: string;
  reference_answer: string;
  student_answer: string;
  is_correct: boolean;
  points_awarded: number;
  max_points: number;
  feedback: string;
  student_work_analysis?: string;
}

export interface HomeworkEvaluationReport {
  subject?: string;
  chapter?: string;
  description?: string;
  date?: string;
  total_score: number;
  max_total_score: number;
  percentage: number;
  summary_notes: string;
  strengths?: string[];
  areas_for_growth?: string[];
  handwriting_legibility?: string;
  engineType?: 'gemini' | 'open-source-local';
  evaluations: QuestionEvaluation[];
}

export interface EvaluationOptions {
  strictness: 'standard' | 'lenient' | 'strict';
  subject: string;
  chapter?: string;
  description?: string;
  date?: string;
  customInstructions?: string;
  modelName:
    | 'open-source-local'
    | 'gemini-3.1-flash-lite'
    | 'gemini-3.8-flash'
    | 'gemini-flash-latest'
    | 'gemini-3.1-pro-preview';
}

export interface PracticeItem {
  concept: string;
  question: string;
  hints: string;
  solution: string;
}

export interface SampleWorksheet {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  description: string;
  date?: string;
  gradeLevel: string;
  icon: string;
  studentSheets: UploadedDocItem[];
  answerKeys: UploadedDocItem[];
  questionPapers?: UploadedDocItem[];
}
