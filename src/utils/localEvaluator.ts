import Tesseract from 'tesseract.js';
import {
  EvaluationOptions,
  HomeworkEvaluationReport,
  PracticeItem,
  QuestionEvaluation,
  UploadedDocItem,
} from '../types/homework';

/**
 * Preprocess image data URL using an HTML5 Canvas to optimize contrast
 * and binarization for OCR text recognition.
 */
async function preprocessImageForOcr(dataUrl: string): Promise<string> {
  // If it's a PDF or we can't load it in Image, return raw dataUrl
  if (dataUrl.startsWith('data:application/pdf') || dataUrl.startsWith('JVBERi0')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Enhance contrast and convert to high-contrast grayscale for crisp OCR
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Grayscale luminance
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Apply contrast curve
          const contrast = 1.35;
          const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
          const adjusted = factor * (gray - 128) + 128;
          const clamped = Math.max(0, Math.min(255, adjusted));

          d[i] = clamped;
          d[i + 1] = clamped;
          d[i + 2] = clamped;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Run Open-Source OCR via Tesseract.js completely inside the browser.
 */
async function performOcr(
  docs: UploadedDocItem[],
  label: string,
  subject?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  if (docs.length === 0) return '';
  const textResults: string[] = [];
  const isKannada = subject?.toLowerCase().includes('kannada');
  const lang = isKannada ? 'kan+eng' : 'eng';

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    onProgress?.(`[Open Source OCR] Processing ${label} (Page ${i + 1} of ${docs.length})...`);

    try {
      const processedUrl = await preprocessImageForOcr(doc.dataUrl);
      let extracted = '';
      try {
        const res = await Tesseract.recognize(processedUrl, lang, {
          logger: (m) => {
            if (m.status === 'recognizing text' && m.progress) {
              const pct = Math.round(m.progress * 100);
              onProgress?.(`[Open Source OCR] Reading ${label} Page ${i + 1}: ${pct}%`);
            }
          },
        });
        extracted = res.data.text.trim();
      } catch (langErr) {
        // If kan+eng model fails to download, fallback to eng
        if (lang !== 'eng') {
          console.warn('[Local OCR] Retrying with default eng:', langErr);
          const fallbackRes = await Tesseract.recognize(processedUrl, 'eng');
          extracted = fallbackRes.data.text.trim();
        } else {
          throw langErr;
        }
      }

      if (extracted) {
        textResults.push(extracted);
      }
    } catch (err) {
      console.warn(`[Local OCR] Error recognizing doc ${doc.name}:`, err);
    }
  }

  return textResults.join('\n\n--- Page Break ---\n\n');
}

/**
 * Split text into individual questions and answers based on typical CBSE numbering:
 * 1., Q1, Q.1, 1), 2., Question 3, etc.
 */
interface ParsedQAPair {
  qNum: string;
  body: string;
}

function parseQuestionsFromText(text: string): ParsedQAPair[] {
  const lines = text.split('\n');
  const items: ParsedQAPair[] = [];
  let currentQ = '';
  let currentBody: string[] = [];

  // Regex for Q1, Q.1, 1., 1), Question 1, Problem 1
  const qRegex = /^(?:Q(?:uestion|\.)?\s*([0-9]+[a-z]?)|([0-9]+[a-z]?)\s*[\.\):-])/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(qRegex);
    if (match) {
      if (currentQ) {
        items.push({ qNum: currentQ, body: currentBody.join(' ').trim() });
      }
      currentQ = match[1] || match[2] || `Q${items.length + 1}`;
      // Remaining text on same line
      const remainder = line.replace(qRegex, '').trim();
      currentBody = remainder ? [remainder] : [];
    } else {
      if (currentQ) {
        currentBody.push(line);
      } else {
        // Line before any question number
        if (items.length === 0 && line.length > 5) {
          currentQ = '1';
          currentBody.push(line);
        }
      }
    }
  }

  if (currentQ && currentBody.length > 0) {
    items.push({ qNum: currentQ, body: currentBody.join(' ').trim() });
  }

  return items;
}

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase() ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

function stringSimilarity(s1: string, s2: string): number {
  const norm1 = s1.trim().toLowerCase();
  const norm2 = s2.trim().toLowerCase();
  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  const maxLen = Math.max(norm1.length, norm2.length);
  const dist = levenshteinDistance(norm1, norm2);
  return 1 - dist / maxLen;
}

/**
 * Extract numbers and units from text (e.g. "₹250", "150 cm", "40 kg")
 */
interface ExtractedValue {
  num: number;
  unit: string;
}

function extractValues(text: string): ExtractedValue[] {
  const results: ExtractedValue[] = [];
  // Match currency, numbers, and standard CBSE units
  const regex = /(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*(₹|rs\.?|cm|m|km|kg|g|l|ml|sq\s*cm|sq\s*m|rupees)?/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) {
        let unit = (match[2] || '').toLowerCase().trim();
        if (text.includes('₹') || text.toLowerCase().includes('rs')) {
          unit = '₹';
        }
        results.push({ num: val, unit });
      }
    }
  }
  return results;
}

/**
 * Evaluate an individual question pair according to CBSE Class 4 criteria
 */
function gradeQuestionPair(
  qNum: string,
  questionText: string,
  refAnswer: string,
  studentAnswer: string,
  strictness: EvaluationOptions['strictness']
): QuestionEvaluation {
  const maxPoints = 2; // Standard 2 points per CBSE Class 4 question

  // Check empty submission
  if (!studentAnswer.trim()) {
    return {
      question_number: qNum,
      question_text: questionText || `Question ${qNum}`,
      reference_answer: refAnswer || 'See teacher marking key',
      student_answer: '[No response transcribed by OCR]',
      is_correct: false,
      points_awarded: 0,
      max_points: maxPoints,
      feedback: 'No answer was identified on the handwritten sheet for this question.',
      student_work_analysis: 'The student appears to have skipped this question.',
    };
  }

  // 1. Numerical Comparison
  const refVals = extractValues(refAnswer);
  const studVals = extractValues(studentAnswer);

  let isCorrect = false;
  let pointsAwarded = 0;
  let feedback = '';
  let analysis = '';

  if (refVals.length > 0 && studVals.length > 0) {
    const target = refVals[refVals.length - 1];
    const studFinal = studVals[studVals.length - 1];

    const numMatch = Math.abs(target.num - studFinal.num) < 0.001;
    const unitMatch = !target.unit || target.unit === studFinal.unit;

    if (numMatch && unitMatch) {
      isCorrect = true;
      pointsAwarded = maxPoints;
      feedback = `Excellent! Exact calculation and proper units (${target.unit || 'number'}) recorded.`;
      analysis = 'Demonstrates complete mathematical clarity and accurate execution.';
    } else if (numMatch && !unitMatch) {
      if (strictness === 'lenient') {
        isCorrect = true;
        pointsAwarded = maxPoints;
        feedback = 'Great job! The numerical calculation is correct (units were omitted or slightly varied).';
      } else if (strictness === 'strict') {
        isCorrect = false;
        pointsAwarded = 1.0;
        feedback = `Partial credit (1/${maxPoints}). Calculation ${target.num} is correct, but required unit '${target.unit}' was missing.`;
      } else {
        isCorrect = true;
        pointsAwarded = 1.5;
        feedback = `Very good! Final value ${target.num} is correct. Remember to include the unit '${target.unit}'.`;
      }
      analysis = 'The arithmetic working is sound, but unit discipline needs slight reinforcement.';
    } else {
      // Numbers don't match - check for step marks
      const intermediateMatch = studVals.some((v) => refVals.some((r) => Math.abs(r.num - v.num) < 0.001));
      if (intermediateMatch || studentAnswer.length > 8) {
        pointsAwarded = strictness === 'strict' ? 0.5 : 1.0;
        isCorrect = false;
        feedback = `Partial credit awarded for effort and working. Expected: ${refAnswer}. Student calculated: ${studentAnswer}. Check arithmetic carefully.`;
        analysis = 'Understands the problem setup, but encountered an arithmetic or transcription slip in the final step.';
      } else {
        pointsAwarded = 0;
        isCorrect = false;
        feedback = `Incorrect. Expected answer is ${refAnswer}. Review the question statement.`;
        analysis = 'Concept requires guided revision and re-practice.';
      }
    }
  } else {
    // 2. Text / Semantic Comparison (EVS / English / Conceptual)
    const sim = stringSimilarity(refAnswer, studentAnswer);
    const threshold = strictness === 'lenient' ? 0.6 : strictness === 'strict' ? 0.88 : 0.72;

    if (sim >= threshold || studentAnswer.toLowerCase().includes(refAnswer.toLowerCase().trim())) {
      isCorrect = true;
      pointsAwarded = maxPoints;
      feedback = 'Correct! Expresses the key idea accurately in clear wording.';
      analysis = 'Strong conceptual grasp of the curriculum topic.';
    } else if (sim >= 0.45) {
      isCorrect = false;
      pointsAwarded = strictness === 'strict' ? 0.5 : 1.0;
      feedback = `Partially correct. Key concept is partially understood, but key terms were omitted. Expected: ${refAnswer}.`;
      analysis = 'Shows emerging understanding; encourage including exact terminology.';
    } else {
      isCorrect = false;
      pointsAwarded = 0;
      feedback = `Needs review. Expected answer: ${refAnswer}. Student wrote: ${studentAnswer}.`;
      analysis = 'Topic needs structured review with teacher notes.';
    }
  }

  return {
    question_number: qNum,
    question_text: questionText || `Question ${qNum}`,
    reference_answer: refAnswer,
    student_answer: studentAnswer,
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
    max_points: maxPoints,
    feedback,
    student_work_analysis: analysis,
  };
}

/**
 * 100% Client-Side Open-Source Homework Evaluation Engine
 * Requires ZERO cloud API calls, ZERO external keys, and has ZERO quota limits!
 */
export async function evaluateWithLocalEngine(
  options: EvaluationOptions,
  docs: {
    studentSheets: UploadedDocItem[];
    answerKeys: UploadedDocItem[];
    questionPapers: UploadedDocItem[];
  },
  onProgress?: (step: string) => void
): Promise<HomeworkEvaluationReport> {
  onProgress?.('Initializing Open Source Tesseract OCR engine (zero-cloud / offline)...');

  // Step 1: Run local OCR on Teacher Answer Key
  onProgress?.('Extracting text and solutions from Teacher Answer Key...');
  const keyText = await performOcr(docs.answerKeys, 'Answer Key', options.subject, onProgress);

  // Step 2: Run local OCR on Question Paper (if provided)
  let qpText = '';
  if (docs.questionPapers.length > 0) {
    onProgress?.('Extracting problem statements from Question Worksheet...');
    qpText = await performOcr(docs.questionPapers, 'Question Paper', options.subject, onProgress);
  }

  // Step 3: Run local OCR on Student Handwritten Sheet
  onProgress?.('Deciphering student handwriting using optical character recognition...');
  const studentText = await performOcr(docs.studentSheets, 'Student Handwritten Sheet', options.subject, onProgress);

  onProgress?.('Parsing questions and applying CBSE Class 4 step-marking rules...');

  // Parse questions from key and student submission
  const keyPairs = parseQuestionsFromText(keyText);
  const studentPairs = parseQuestionsFromText(studentText);
  const qpPairs = qpText ? parseQuestionsFromText(qpText) : [];

  // If OCR couldn't detect numbered lists (e.g. single problem or unnumbered sheet),
  // fallback to full text comparison as Q1
  if (keyPairs.length === 0) {
    keyPairs.push({ qNum: '1', body: keyText || 'Teacher Reference Solution' });
  }
  if (studentPairs.length === 0) {
    studentPairs.push({ qNum: '1', body: studentText || '[Handwritten text extracted by OCR]' });
  }

  const evaluations: QuestionEvaluation[] = [];

  keyPairs.forEach((keyItem, idx) => {
    // Find matching student answer by question number or by order
    const studItem =
      studentPairs.find((s) => s.qNum === keyItem.qNum) ||
      studentPairs[idx] || { qNum: keyItem.qNum, body: '' };

    const qpItem = qpPairs.find((q) => q.qNum === keyItem.qNum) || qpPairs[idx];

    const evaluation = gradeQuestionPair(
      keyItem.qNum,
      qpItem ? qpItem.body : `Question ${keyItem.qNum}`,
      keyItem.body,
      studItem.body,
      options.strictness
    );

    evaluations.push(evaluation);
  });

  // Calculate scores
  const totalScore = evaluations.reduce((sum, e) => sum + e.points_awarded, 0);
  const maxScore = evaluations.reduce((sum, e) => sum + e.max_points, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  // Determine strengths & growth areas
  const strengths: string[] = [];
  const areasForGrowth: string[] = [];

  const correctCount = evaluations.filter((e) => e.is_correct).length;
  if (correctCount > 0) {
    strengths.push(`Successfully solved ${correctCount} of ${evaluations.length} worksheet problems.`);
    strengths.push('Shows clear foundational step working for Class 4 level arithmetic and questions.');
  } else {
    strengths.push('Shows earnest effort in attempting all assigned worksheet problems.');
  }

  const incorrectCount = evaluations.length - correctCount;
  if (incorrectCount > 0) {
    areasForGrowth.push(
      `Revise ${incorrectCount} question(s) with special attention to arithmetic precision and units (₹, cm, m, kg).`
    );
    areasForGrowth.push('Practice multi-step word problem formulation and double-checking final statements.');
  } else {
    strengths.push('Exceptional mastery across all evaluated homework problems!');
  }

  // Summary notes for parents
  const summaryNotes = `The student achieved a score of ${totalScore} out of ${maxScore} (${percentage.toFixed(
    1
  )}%) on this Class 4 ${options.subject} assignment evaluated via the Open-Source OCR Engine. ${
    percentage >= 80
      ? 'He has demonstrated solid conceptual mastery of the chapter.'
      : percentage >= 60
      ? 'Good foundational grasp shown, with a few calculations or units requiring revision.'
      : 'Targeted home review is recommended on step statements and unit conversions.'
  } Evaluated with 100% offline open-source OCR (zero cloud quota consumed).`;

  return {
    subject: options.subject,
    chapter: options.chapter || 'Class 4 Unit',
    description: options.description || 'Evaluated via Open-Source Local OCR Engine',
    date: options.date || new Date().toISOString().split('T')[0],
    total_score: Math.round(totalScore * 10) / 10,
    max_total_score: maxScore,
    percentage: Math.round(percentage * 10) / 10,
    summary_notes: summaryNotes,
    strengths,
    areas_for_growth: areasForGrowth,
    handwriting_legibility: 'Readable (Processed by Open Source OCR)',
    engineType: 'open-source-local',
    evaluations,
  };
}

/**
 * Generate 3 remedial practice questions locally without any cloud models
 */
export function generateLocalPracticeExercises(
  missedQuestions: QuestionEvaluation[],
  subject: string
): PracticeItem[] {
  const items: PracticeItem[] = [];

  missedQuestions.slice(0, 3).forEach((q, idx) => {
    const vals = extractValues(q.reference_answer + ' ' + q.question_text);
    const primaryNum = vals.length > 0 ? vals[0].num : (idx + 1) * 25;
    const unit = vals.length > 0 && vals[0].unit ? vals[0].unit : '₹';

    if (subject.toLowerCase().includes('kannada')) {
      const kannadaDrills = [
        {
          concept: 'ಕನ್ನಡ - ವಿರುದ್ಧ ಪದಗಳು (Opposite Words)',
          question: 'ಕೆಳಗಿನ ಪದಕ್ಕೆ ವಿರುದ್ಧ ಪದವನ್ನು ಬರೆಯಿರಿ: "ಬೆಳಕು" (Belaku = Light) × ______',
          hints: 'ಕತ್ತಲೆ (Kattale = Darkness) ಅಥವಾ ಕತ್ತಲು.',
          solution: 'ಬೆಳಕು × ಕತ್ತಲೆ (Light × Darkness).',
        },
        {
          concept: 'ಕನ್ನಡ - ಒತ್ತಕ್ಷರ ಅಭ್ಯಾಸ (Vattakshara Practice)',
          question: '"ಅಮ್ಮ" (Amma) ಮತ್ತು "ಹಳ್ಳಿ" (Halli) ಪದಗಳಲ್ಲಿರುವ ಒತ್ತಕ್ಷರಗಳನ್ನು ಗುರುತಿಸಿ ಬರೆಯಿರಿ.',
          hints: 'ಮ-ವತ್ತು ಮತ್ತು ಳ-ವತ್ತು ಗಮನಿಸಿ.',
          solution: '"ಅಮ್ಮ" ಪದದಲ್ಲಿ \'ಮ\' ಒತ್ತಕ್ಷರ (ಮ್ಮ), "ಹಳ್ಳಿ" ಪದದಲ್ಲಿ \'ಳ\' ಒತ್ತಕ್ಷರ (ಳ್ಳಿ) ಇದೆ.',
        },
        {
          concept: 'ಕನ್ನಡ - ಸ್ವಂತ ವಾಕ್ಯ ರಚನೆ (Sentence Writing)',
          question: '"ಸ್ನೇಹಿತ" (Sneitha = Friend) ಪದವನ್ನು ಬಳಸಿ ಒಂದು ಅರ್ಥಪೂರ್ಣ ಸ್ವಂತ ವಾಕ್ಯ ರಚಿಸಿ.',
          hints: 'ನಿಮ್ಮ ಗೆಳೆಯನ ಅಥವಾ ಗೆಳತಿಯ ಹೆಸರನ್ನು ಸೇರಿಸಿ ಸರಳ ವಾಕ್ಯ ಬರೆಯಿರಿ.',
          solution: 'ಉದಾಹರಣೆ: "ರಾಹುಲ್ ನನ್ನ ಪ್ರೀತಿಯ ಸ್ನೇಹಿತ." (Rahul is my dear friend).',
        },
      ];
      items.push(kannadaDrills[idx % kannadaDrills.length]);
    } else if (subject.toLowerCase().includes('hindi')) {
      const hindiDrills = [
        {
          concept: 'Hindi - विलोम शब्द (Opposite Words)',
          question: 'निम्नलिखित शब्दों के विलोम शब्द लिखिए: 1) दिन × ______  2) सच × ______',
          hints: 'रात, झूठ',
          solution: '1) दिन × रात (Day × Night)\n2) सच × झूठ (Truth × Lie)',
        },
        {
          concept: 'Hindi - संज्ञा पहचानिए (Identify Noun)',
          question: 'इस वाक्य में संज्ञा शब्द पहचानिए: "रोहन गेंद से खेल रहा है।"',
          hints: 'किसी व्यक्ति, वस्तु या स्थान के नाम को संज्ञा कहते हैं।',
          solution: 'संज्ञा शब्द: "रोहन" (व्यक्तिवाचक संज्ञा) और "गेंद" (वस्तुवाचक संज्ञा)।',
        },
        {
          concept: 'Hindi - वाक्य बनाइए (Make a Sentence)',
          question: '"पेड़" शब्द का प्रयोग करके एक सुंदर वाक्य बनाइए।',
          hints: 'पेड़ हमें छाया और फल देते हैं।',
          solution: 'वाक्य: पेड़ हमें स्वच्छ हवा, छाया और मीठे फल देते हैं।',
        },
      ];
      items.push(hindiDrills[idx % hindiDrills.length]);
    } else if (subject.toLowerCase().includes('computer')) {
      const csDrills = [
        {
          concept: 'Computer Science - Input & Output Devices',
          question: 'Identify which of these are INPUT devices and which are OUTPUT devices: 1) Keyboard 2) Monitor 3) Mouse 4) Printer',
          hints: 'Input devices send data to CPU; Output devices display/print results.',
          solution: 'Input Devices: Keyboard, Mouse.\nOutput Devices: Monitor, Printer.',
        },
        {
          concept: 'Computer Science - Keyboard Shortcuts',
          question: 'What shortcut keys are used for: 1) Save a file 2) Copy text 3) Paste text?',
          hints: 'Use the Ctrl key on your keyboard.',
          solution: '1) Save: Ctrl + S\n2) Copy: Ctrl + C\n3) Paste: Ctrl + V.',
        },
        {
          concept: 'Computer Science - Hardware vs Software',
          question: 'What is the main difference between Hardware and Software? Give one example of each.',
          hints: 'Hardware can be touched physically; software is a program run on hardware.',
          solution: 'Hardware: Physical parts you can touch (e.g. Mouse, Monitor, CPU).\nSoftware: Programs/apps that run on computer (e.g. MS Paint, Notepad, Tux Paint).',
        },
      ];
      items.push(csDrills[idx % csDrills.length]);
    } else if (subject.toLowerCase().includes('social')) {
      const sstDrills = [
        {
          concept: 'Social Studies - Indian Geography & Capitals',
          question: 'What is the national capital of India? Name any two coastal states of India.',
          hints: 'New Delhi is the capital. Coastal states border Arabian Sea or Bay of Bengal.',
          solution: 'National Capital: New Delhi.\nCoastal States: Karnataka, Maharashtra, Tamil Nadu, Kerala, Gujarat.',
        },
        {
          concept: 'Social Studies - Directions on a Map',
          question: 'What are the four cardinal directions on a map? Which direction is at the top of a map?',
          hints: 'North, South, East, West.',
          solution: 'Four directions: North (N), South (S), East (E), West (W).\nThe top of a map always points towards NORTH.',
        },
        {
          concept: 'Social Studies - National Symbols of India',
          question: 'Name the: 1) National Animal 2) National Bird 3) National Flower of India.',
          hints: 'Tiger, Peacock, Lotus.',
          solution: '1) National Animal: Bengal Tiger\n2) National Bird: Indian Peacock\n3) National Flower: Lotus.',
        },
      ];
      items.push(sstDrills[idx % sstDrills.length]);
    } else if (subject.toLowerCase().includes('science')) {
      const scienceDrills = [
        {
          concept: 'Science - Parts of a Plant',
          question: 'Name two main functions of roots in a green plant.',
          hints: 'Think about how plants get water from the soil and stay upright.',
          solution: '1) Roots anchor the plant firmly in the soil.\n2) Roots absorb water and essential minerals from the soil for the plant.',
        },
        {
          concept: 'Science - States of Matter',
          question: 'What are the three states of matter? Give one example for each using water.',
          hints: 'Solid, Liquid, Gas.',
          solution: 'Three states of matter:\n1) Solid: Ice\n2) Liquid: Water\n3) Gas: Water vapor / steam.',
        },
        {
          concept: 'Science - Living Things & Habitats',
          question: 'Why do aquatic animals like fish have gills instead of lungs?',
          hints: 'Gills help absorb dissolved oxygen from water.',
          solution: 'Fish have gills to breathe oxygen dissolved in water, which allows them to live underwater.',
        },
      ];
      items.push(scienceDrills[idx % scienceDrills.length]);
    } else if (subject.toLowerCase().includes('math') || unit === '₹') {
      const newNum1 = primaryNum * 2;
      const newNum2 = Math.round(primaryNum * 1.5);

      items.push({
        concept: `${subject} - Practice Drill ${idx + 1}`,
        question: `Rohan bought 3 notebooks for ${unit} ${newNum1} and a pencil box for ${unit} ${newNum2}. How much total money did Rohan spend?`,
        hints: `Add the two amounts together: ${newNum1} + ${newNum2}. Don't forget to write ${unit} in your final answer!`,
        solution: `Step 1: Cost of notebooks = ${unit} ${newNum1}\nStep 2: Cost of pencil box = ${unit} ${newNum2}\nTotal = ${newNum1} + ${newNum2} = ${unit} ${
          newNum1 + newNum2
        }.`,
      });
    } else {
      // English & General
      const englishDrills = [
        {
          concept: 'English - Collective Nouns',
          question: 'Fill in the blank with a collective noun: "A ______ of wolves roamed through the forest." (pack / herd / flock)',
          hints: 'Wolves hunt in a group called a pack.',
          solution: 'Answer: "A pack of wolves roamed through the forest."',
        },
        {
          concept: 'English - Irregular Past Tense Verbs',
          question: 'Write the Simple Past Tense for these verbs: 1) go -> ______  2) see -> ______  3) eat -> ______',
          hints: 'went, saw, ate.',
          solution: '1) go -> went\n2) see -> saw\n3) eat -> ate.',
        },
        {
          concept: 'English - Sentence Formulation',
          question: 'Make a meaningful sentence of your own using the adjective "Generous".',
          hints: 'Generous means kind and willing to share.',
          solution: 'Example: "The generous king distributed food and warm clothes to all the poor villagers."',
        },
      ];
      items.push(englishDrills[idx % englishDrills.length]);
    }
  });

  // If fewer than 3 missed questions, fill up with subject fundamentals
  while (items.length < 3) {
    if (subject.toLowerCase().includes('kannada')) {
      items.push({
        concept: 'ಕನ್ನಡ - ವರ್ಣಮಾಲೆ ಅಭ್ಯಾಸ (Varnamale Drill)',
        question: 'ಕನ್ನಡ ವರ್ಣಮಾಲೆಯಲ್ಲಿರುವ ಒಟ್ಟು ಅಕ್ಷರಗಳ ಸಂಖ್ಯೆ ಎಷ್ಟು? (How many letters in Kannada alphabet?)',
        hints: 'ಸ್ವರಗಳು + ಯೋಗವಾಹಗಳು + ವ್ಯಂಜನಗಳು = ೪೯ (49).',
        solution: 'ಕನ್ನಡ ವರ್ಣಮಾಲೆಯಲ್ಲಿ ಒಟ್ಟು ೪೯ (49) ಅಕ್ಷರಗಳಿವೆ.',
      });
    } else if (subject.toLowerCase().includes('computer')) {
      items.push({
        concept: 'Computer Science - What is CPU?',
        question: 'What is the full form of CPU and why is it called the brain of the computer?',
        hints: 'Central Processing Unit.',
        solution: 'CPU stands for Central Processing Unit. It is called the brain of the computer because it processes all instructions and controls all parts.',
      });
    } else if (subject.toLowerCase().includes('social')) {
      items.push({
        concept: 'Social Studies - Our Country India',
        question: 'Which is the largest desert in India and where is it located?',
        hints: 'Thar Desert in Rajasthan.',
        solution: 'The Thar Desert (Great Indian Desert), located in Rajasthan.',
      });
    } else if (subject.toLowerCase().includes('science')) {
      items.push({
        concept: 'Science - Food & Nutrition',
        question: 'Why do our bodies need Carbohydrates and Proteins? Give one food source for each.',
        hints: 'Carbohydrates give energy (rice/wheat), Proteins help in body growth (milk/pulses/eggs).',
        solution: 'Carbohydrates provide instant energy (e.g. Rice, Potatoes).\nProteins help in body building and cell repair (e.g. Pulses, Milk, Eggs).',
      });
    } else if (subject.toLowerCase().includes('hindi')) {
      items.push({
        concept: 'Hindi - लिंग बदलिए (Change the Gender)',
        question: 'लिंग बदलिए: 1) लड़का -> ______  2) मोर -> ______',
        hints: 'लड़की, मोरनी',
        solution: '1) लड़का -> लड़की\n2) मोर -> मोरनी',
      });
    } else {
      items.push({
        concept: 'Class 4 Unit Conversion Drill',
        question: 'Convert 4 metres and 60 centimetres into centimetres.',
        hints: 'Remember: 1 metre = 100 centimetres.',
        solution: '4 m = 4 × 100 = 400 cm.\n400 cm + 60 cm = 460 cm.',
      });
    }
  }

  return items;
}
