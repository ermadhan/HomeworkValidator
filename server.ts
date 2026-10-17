import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function parseBase64Doc(input: string, fallbackMime = 'image/png') {
  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // If it starts with JVBERi0 (PDF magic bytes in base64)
  if (input.startsWith('JVBERi0')) {
    return { mimeType: 'application/pdf', data: input };
  }
  return { mimeType: fallbackMime, data: input };
}

interface RawDocInput {
  name?: string;
  dataUrl?: string;
  mimeType?: string;
}

function normalizeDocList(input: any): { mimeType: string; data: string; name?: string }[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  const results: { mimeType: string; data: string; name?: string }[] = [];

  for (const item of list) {
    if (!item) continue;
    if (typeof item === 'string') {
      const parsed = parseBase64Doc(item);
      results.push(parsed);
    } else if (typeof item === 'object') {
      const rawUrl = item.dataUrl || item.data || '';
      const docName = item.name;
      if (rawUrl) {
        const parsed = parseBase64Doc(rawUrl, item.mimeType || 'image/png');
        results.push({ ...parsed, name: docName });
      }
    }
  }
  return results;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Main evaluation endpoint mirroring the user's Python script
  app.post('/api/evaluate-homework', async (req, res) => {
    try {
      const {
        studentSheet,
        studentSheets,
        answerKey,
        answerKeys,
        questionPaper,
        questionPapers,
        strictness = 'standard',
        subject = 'General',
        chapter = '',
        description = '',
        date = '',
        customInstructions = '',
        modelName = 'gemini-3.8-flash',
      } = req.body;

      const studentDocs = normalizeDocList(studentSheets || studentSheet);
      const answerKeyDocs = normalizeDocList(answerKeys || answerKey);
      const questionPaperDocs = normalizeDocList(questionPapers || questionPaper);

      if (studentDocs.length === 0 || answerKeyDocs.length === 0) {
        return res.status(400).json({
          error: 'Missing required files: At least one student handwritten sheet/page and one answer key document (image or PDF) are required.',
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      let strictnessPrompt = '';
      if (strictness === 'lenient') {
        strictnessPrompt =
          'Strictness level: LENIENT. Award full or generous partial credit if the student clearly grasps the core concept, allowing for small arithmetic slip-ups, messy handwriting, or minor grammatical/spelling errors.';
      } else if (strictness === 'strict') {
        strictnessPrompt =
          'Strictness level: STRICT. Strictly enforce correct units, complete step-by-step working, correct algebraic notations, exact arithmetic, and accurate spelling of key terms.';
      } else {
        strictnessPrompt =
          'Strictness level: STANDARD. Evaluate each answer for semantic correctness. Allow minor spelling variations if core concept is right, but verify arithmetic and mathematical logic carefully.';
      }

      const promptInstructions = [
        "You are an expert primary school tutor in India evaluating a Grade 4 (Class 4) student's handwritten homework following the CBSE (Central Board of Secondary Education, India) and NCERT curriculum.",
        `Worksheet Subject: ${subject}.`,
        chapter ? `Chapter / Unit: ${chapter}.` : '',
        description ? `Assignment Description: ${description}.` : '',
        date ? `Evaluation Date: ${date}.` : '',
        'Student Profile: Class 4 student (approximately 9 years old).',
        strictnessPrompt,
        customInstructions ? `Special teacher/parent instructions: ${customInstructions}` : '',
        'Follow these CBSE primary education evaluation principles:',
        "1. Extract and read all questions from the school question worksheet (or answer key if question worksheet is not provided). Note the question numbers, mathematical equations, statements, and problem wording.",
        "2. Cross-reference with the teacher answer key to know the expected correct answer, units, scoring weights, and step requirements.",
        "3. Carefully decipher the handwritten responses and calculations from the student's completed sheet. Transcribe his handwriting accurately.",
        "4. Subject-Specific Evaluation Guidelines for Class 4:",
        "   - Mathematics: Step marking is mandatory: statement step + calculation step + final answer with units (₹, cm, m, km, kg, g, l, ml). Recognize Indian currency (₹ or Rs.) and numbering systems.",
        "   - English: Evaluate grammatical understanding (parts of speech, verb tenses, prepositions, collective nouns), reading comprehension, and punctuation. Allow natural 9-year-old phrasing if core grammatical intent is correct.",
        "   - Hindi: Transcribe Devanagari script accurately. Evaluate Vyakaran (संज्ञा, सर्वनाम, क्रिया, विಲೋम शब्द, लिंग, वचन, वाक्य प्रयोग). Forgive minor matra variations in standard/lenient mode unless it alters the meaning.",
        "   - Kannada: Transcribe Kannada script (ಕನ್ನಡ ಲಿಪಿ) and transliteration. Evaluate Varnamale, Gunithakshara (ಗುಣಿತಾಕ್ಷರ), Vattakshara (ಒತ್ತಕ್ಷರಗಳು), Viruddha Pada (ವಿರುದ್ಧ ಪದಗಳು), Swanta Vakya (ಸ್ವಂತ ವಾಕ್ಯ), and lesson comprehension.",
        "   - Science: Evaluate conceptual understanding of living things, plants (roots, leaves), animals and habitats, human body, food and nutrients, water cycle, and simple machines. Prioritize scientific reasoning over rigid terminology.",
        "   - Social Studies: Evaluate understanding of Indian geography (states, capitals, rivers, landforms), national symbols, community life, means of transport, and cardinal directions. Award credit for identifying key historical/geographical facts.",
        "   - Computer Science: Evaluate fundamental computing concepts (hardware vs software, input/output devices, storage, mouse/keyboard functions, desktop icons, basic logic/algorithms, and safe computer use).",
        '5. Award marks fairly (max_points per question, points_awarded, is_correct boolean). Award partial marks for correct steps even if the final calculation has a minor slip.',
        '6. Provide encouraging, supportive feedback for each question in a warm, motivating tone suitable for a 9-year-old boy, explaining where the mistake happened.',
        '7. Compute the overall total_score, max_total_score, and percentage.',
        '8. Write comprehensive summary_notes for the parents highlighting how their son performed, chapters or topics he mastered, and exact concepts to practice with him at home based on the CBSE Class 4 syllabus.',
        '9. List key strengths and areas_for_growth, and provide an assessment of handwriting_legibility.',
      ]
        .filter(Boolean)
        .join('\n');

      const contents: any[] = [{ text: promptInstructions }];

      if (questionPaperDocs.length > 0) {
        contents.push({
          text: `DOCUMENT SET 1: SCHOOL WORKSHEET / QUESTION PAPER (${questionPaperDocs.length} file/page(s) provided. Contains question statements, diagrams, and problem numbering):`,
        });
        questionPaperDocs.forEach((doc, idx) => {
          contents.push({
            text: `[School Worksheet File/Page ${idx + 1}${doc.name ? `: ${doc.name}` : ''}]`,
          });
          contents.push({
            inlineData: {
              mimeType: doc.mimeType,
              data: doc.data,
            },
          });
        });
      }

      contents.push({
        text: `DOCUMENT SET 2: TEACHER ANSWER KEY & RUBRIC (${answerKeyDocs.length} file/page(s) provided. Contains official reference answers and marking criteria):`,
      });
      answerKeyDocs.forEach((doc, idx) => {
        contents.push({
          text: `[Answer Key File/Page ${idx + 1}${doc.name ? `: ${doc.name}` : ''}]`,
        });
        contents.push({
          inlineData: {
            mimeType: doc.mimeType,
            data: doc.data,
          },
        });
      });

      contents.push({
        text: `DOCUMENT SET 3: STUDENT'S HANDWRITTEN ANSWER SHEETS (${studentDocs.length} file/page(s) provided. Carefully inspect all handwritten pages to transcribe and evaluate the son's work):`,
      });
      studentDocs.forEach((doc, idx) => {
        contents.push({
          text: `[Student Answer Sheet Page ${idx + 1}${doc.name ? `: ${doc.name}` : ''}]`,
        });
        contents.push({
          inlineData: {
            mimeType: doc.mimeType,
            data: doc.data,
          },
        });
      });

      // Map requested model to a verified modern Gemini model, preferring lightweight/lower quota models
      const validModels = [
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-pro-preview',
      ];
      let primaryModel = modelName;
      if (!primaryModel || !validModels.includes(primaryModel)) {
        if (primaryModel && (primaryModel.includes('lite') || primaryModel.includes('lower'))) {
          primaryModel = 'gemini-3.1-flash-lite';
        } else if (primaryModel && primaryModel.includes('pro')) {
          primaryModel = 'gemini-3.1-pro-preview';
        } else {
          primaryModel = 'gemini-3.1-flash-lite'; // Default to lower quota/resource model
        }
      }

      const candidateModels = [
        primaryModel,
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash',
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      let response: any = null;
      let lastErr: any = null;

      for (const targetModel of candidateModels) {
        try {
          console.log(`[evaluate-homework] Attempting evaluation using model: ${targetModel}`);
          response = await ai.models.generateContent({
            model: targetModel,
            contents,
            config: {
              temperature: 0.1,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  total_score: {
                    type: Type.NUMBER,
                    description: 'Total points scored by the student',
                  },
                  max_total_score: {
                    type: Type.NUMBER,
                    description: 'Total possible points',
                  },
                  percentage: {
                    type: Type.NUMBER,
                    description: 'Overall percentage grade (e.g. 85.0)',
                  },
                  summary_notes: {
                    type: Type.STRING,
                    description: 'High-level feedback for parents and teachers highlighting areas to review',
                  },
                  strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Key skills or topics the student executed well',
                  },
                  areas_for_growth: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Specific topics or concepts needing revision',
                  },
                  handwriting_legibility: {
                    type: Type.STRING,
                    description: "Assessment of student's handwriting clarity: 'Clear and easy to read', 'Fair / Readable', or 'Challenging to decipher'",
                  },
                  evaluations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question_number: {
                          type: Type.STRING,
                          description: "Question number or identifier, e.g., '1', '2a', 'Q3'",
                        },
                        question_text: {
                          type: Type.STRING,
                          description: 'The statement or math problem from the worksheet',
                        },
                        reference_answer: {
                          type: Type.STRING,
                          description: 'Correct answer from the answer key',
                        },
                        student_answer: {
                          type: Type.STRING,
                          description: "Transcribed answer from student's handwritten sheet",
                        },
                        is_correct: {
                          type: Type.BOOLEAN,
                          description: 'True if student answer is correct or semantically equivalent',
                        },
                        points_awarded: {
                          type: Type.NUMBER,
                          description: 'Points granted for this response',
                        },
                        max_points: {
                          type: Type.NUMBER,
                          description: 'Maximum possible points for this question',
                        },
                        feedback: {
                          type: Type.STRING,
                          description: 'Brief explanation of correctness or hints on mistakes and step-by-step guidance',
                        },
                        student_work_analysis: {
                          type: Type.STRING,
                          description: 'Pedagogical insight into the student handwritten steps or method used',
                        },
                      },
                      required: [
                        'question_number',
                        'question_text',
                        'reference_answer',
                        'student_answer',
                        'is_correct',
                        'points_awarded',
                        'max_points',
                        'feedback',
                      ],
                    },
                    description: 'Itemized breakdown of each question',
                  },
                },
                required: [
                  'total_score',
                  'max_total_score',
                  'percentage',
                  'summary_notes',
                  'evaluations',
                ],
              },
            },
          });

          if (response && response.text) {
            break; // Succeeded!
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(`[evaluate-homework] Model ${targetModel} encountered error:`, err?.message || err);
          // If model was 404 or quota exhausted, loop will try the next candidate (e.g. gemini-3.1-flash-lite)
        }
      }

      if (!response || !response.text) {
        throw lastErr || new Error('All model candidates failed to evaluate homework.');
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty response.');
      }

      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const report = JSON.parse(cleanJson);
      // Ensure annotations are stamped on the evaluation report
      report.subject = subject || report.subject || 'General';
      report.chapter = chapter || report.chapter || '';
      report.description = description || report.description || '';
      report.date = date || report.date || new Date().toISOString().split('T')[0];

      return res.json(report);
    } catch (error: any) {
      console.error('Error evaluating homework:', error);
      return res.status(500).json({
        error: error.message || 'Failed to evaluate homework with Gemini.',
      });
    }
  });

  // Practice generation endpoint for targeted remedial exercises
  app.post('/api/generate-practice', async (req, res) => {
    try {
      const { missedQuestions, subject = 'General' } = req.body;

      if (!missedQuestions || !Array.isArray(missedQuestions) || missedQuestions.length === 0) {
        return res.status(400).json({ error: 'No missed questions provided.' });
      }

      const prompt = `Based on these questions that a Grade 4 (Class 4) CBSE / State Board student in India struggled with in ${subject}:
${JSON.stringify(missedQuestions, null, 2)}

Create 3 targeted follow-up practice questions with step-by-step solutions and tutor tips tailored to a 9-year-old child following the CBSE / NCERT Class 4 curriculum (or Karnataka State / Savi Kannada curriculum if subject is Kannada). If the subject is Kannada, provide questions with Kannada script along with English explanations and transliterations. Use child-friendly explanations, Indian currency (₹) or standard units (cm, m, kg, ml) where applicable.`;

      let response: any = null;
      for (const practiceModel of ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash']) {
        try {
          response = await ai.models.generateContent({
            model: practiceModel,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING, description: 'The mathematical or conceptual topic' },
                    question: { type: Type.STRING, description: 'Practice problem text' },
                    hints: { type: Type.STRING, description: 'Helpful hint for the student' },
                    solution: { type: Type.STRING, description: 'Full step-by-step correct answer' },
                  },
                  required: ['concept', 'question', 'hints', 'solution'],
                },
              },
            },
          });
          if (response && response.text) break;
        } catch (err: any) {
          console.warn(`[generate-practice] Error with model ${practiceModel}:`, err?.message || err);
        }
      }

      if (!response || !response.text) {
        throw new Error('Failed to generate practice exercises with available models.');
      }

      let practiceJson = (response.text || '[]').trim();
      if (practiceJson.startsWith('```')) {
        practiceJson = practiceJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const practiceItems = JSON.parse(practiceJson || '[]');
      return res.json({ practiceItems });
    } catch (error: any) {
      console.error('Error generating practice:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate practice exercises.' });
    }
  });

  // Explicitly return JSON 404 for any unmatched /api/* route so it never serves HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route ${req.method} ${req.path} not found.`,
    });
  });

  // Global Express error handler to guarantee all server errors return JSON, never HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express server error:', err);
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({
      error: err.message || 'An unexpected server error occurred.',
    });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
