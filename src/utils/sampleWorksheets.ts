import { SampleWorksheet } from '../types/homework';

/**
 * Generates an authentic looking CBSE Class 4 worksheet image on an HTML5 canvas
 * and returns it as a data URL.
 */
function createWorksheetImage(
  type: 'student' | 'answerKey' | 'questionPaper',
  subject: 'math' | 'evs' | 'english' | 'kannada'
): string {
  const width = 800;
  const height = 1100;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - realistic notebook paper or printed exam sheet
  if (type === 'student') {
    ctx.fillStyle = '#fdfcf7'; // soft cream ruled notebook paper
  } else if (type === 'answerKey') {
    ctx.fillStyle = '#f8fafc'; // crisp teacher answer key
  } else {
    ctx.fillStyle = '#ffffff'; // clean white printed school test paper
  }
  ctx.fillRect(0, 0, width, height);

  // Lined paper effect for student worksheet (classic Indian four-line or single-line notebook)
  if (type === 'student') {
    // Red left margin line
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(90, 0);
    ctx.lineTo(90, height);
    ctx.stroke();

    // Light blue notebook horizontal lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let y = 140; y < height - 40; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Header banner / title block
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';

  if (type === 'student') {
    ctx.fillText('NAME: Aarav Sharma', 110, 50);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('CLASS: 4-B (CBSE)   DATE: 12/10/2026', 460, 50);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    if (subject === 'math') ctx.fillText('Subject: Mathematics - Chapter Review', 110, 85);
    if (subject === 'evs') ctx.fillText('Subject: Science - Periodic Assessment', 110, 85);
    if (subject === 'english') ctx.fillText('Subject: English - Grammar & Comprehension', 110, 85);
    if (subject === 'kannada') ctx.fillText('Subject: Kannada (ಸವಿ ಕನ್ನಡ) - Class 4', 110, 85);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(105, 105, 620, 1);
  } else if (type === 'answerKey') {
    // Teacher stamp banner
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('CBSE CLASS 4 - TEACHER ANSWER KEY & MARKING SCHEME', 60, 50);

    ctx.fillStyle = '#475569';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('NCERT CURRICULUM • MAXIMUM MARKS: 10 • STEP-MARKING MANDATORY', 60, 75);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 90);
    ctx.lineTo(740, 90);
    ctx.stroke();
  } else {
    // Blank school question paper
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('DELHI PUBLIC SCHOOL - PRIMARY WING (CBSE AFFILIATED)', width / 2, 45);
    ctx.font = '14px serif';
    ctx.fillText('Class IV Assessment Worksheet (Session 2026-27)', width / 2, 70);
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 90);
    ctx.lineTo(740, 90);
    ctx.stroke();
  }

  // Question and Answer contents for Class 4 CBSE
  if (subject === 'math') {
    const mathQuestions = [
      {
        num: '1',
        prompt: 'Rohan buys 1 notebook for ₹45.50 and 2 pencils for ₹12.50. What is the total amount spent?',
        pts: '2 marks',
        ref: 'Total cost = ₹45.50 + ₹12.50 = ₹58.00  (1 mark for addition statement, 1 mark for correct sum with ₹ unit).',
        studentAns: 'Cost of notebook = ₹ 45.50\nCost of pencils  = ₹ 12.50\nTotal = 45.50 + 12.50 = ₹ 58.00',
        isCorrect: true,
      },
      {
        num: '2',
        prompt: 'Convert 4 metres 75 centimetres into centimetres (cm). Show your conversion steps.',
        pts: '2 marks',
        ref: '1 m = 100 cm.  So 4 m = 400 cm.  Total = 400 cm + 75 cm = 475 cm.',
        studentAns: '1 m = 100 cm\n4 m = 400 cm\n400 + 75 = 475 cm',
        isCorrect: true,
      },
      {
        num: '3',
        prompt: 'A square playground has each side of length 15 metres. Find the boundary length (perimeter) of the playground.',
        pts: '2 marks',
        ref: 'Perimeter of square = 4 × side = 4 × 15 m = 60 metres (or 15 + 15 + 15 + 15 = 60 m).',
        studentAns: 'Boundary = 15 + 15 + 15 + 15\n= 60 m',
        isCorrect: true,
      },
      {
        num: '4',
        prompt: 'There are 72 marbles to be shared equally among 6 children. How many marbles will each child get?',
        pts: '2 marks',
        ref: 'Total marbles = 72. Number of children = 6.  Each child gets = 72 ÷ 6 = 12 marbles.',
        studentAns: '72 ÷ 6 = 12 marbles for each child.',
        isCorrect: true,
      },
      {
        num: '5',
        prompt: 'A water jug contains 1 litre of juice. How many 250 millilitre (ml) glasses can be filled completely?',
        pts: '2 marks',
        ref: '1 litre = 1000 ml.  Number of glasses = 1000 ÷ 250 = 4 glasses.',
        studentAns: '1 litre = 1000 ml\n1000 ÷ 250 = 5 glasses   (Mistake: calculated 5 instead of 4!)',
        isCorrect: false,
      },
    ];

    let startY = 145;
    mathQuestions.forEach((q) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`Q${q.num} [${q.pts}]:`, type === 'student' ? 110 : 60, startY);

      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(q.prompt, type === 'student' ? 110 : 60, startY + 22);

      if (type === 'student') {
        ctx.fillStyle = '#1e40af'; // Blue fountain pen ink
        ctx.font = 'italic 15px "Comic Sans MS", "Caveat", cursive, sans-serif';

        const lines = q.studentAns.split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, 130, startY + 54 + idx * 22);
        });

        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.strokeRect(125, startY + 36, 580, lines.length * 24 + 16);
      } else if (type === 'answerKey') {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`[CBSE MARKING RUBRIC]: ${q.ref}`, 80, startY + 50);
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(80, startY + 45, 640, 65);
        ctx.setLineDash([]);
      }

      startY += 175;
    });
  } else if (subject === 'evs') {
    const evsQuestions = [
      {
        num: '1',
        prompt: 'Name any two animals whose ears can be seen, and two animals whose ears cannot be seen.',
        pts: '2 marks',
        ref: 'Ears can be seen: Elephant, Dog (or Cow, Deer). Ears cannot be seen: Bird/Sparrow, Snake, Lizard.',
        studentAns: 'Ears seen: Elephant, Cat\nEars not seen: Pigeon, Lizard',
        isCorrect: true,
      },
      {
        num: '2',
        prompt: 'Why do birds have different types of beaks? Give one example.',
        pts: '2 marks',
        ref: 'Birds have different beaks based on the food they eat (seeds, nectar, fish, insects). Example: Eagle/Hawk has sharp hooked beak for tearing meat, or Duck has flat beak for catching fish.',
        studentAns: 'Birds have different beaks to eat different kinds of food.\nExample: Woodpecker has sharp beak to make holes in trees.',
        isCorrect: true,
      },
      {
        num: '3',
        prompt: 'What are two differences between tap roots and fibrous roots? Give one plant example of each.',
        pts: '3 marks',
        ref: 'Taproot: One main thick root with smaller side roots (Example: Carrot, Mustard, Neem). Fibrous root: Bundle of thin roots of equal size arising from stem base (Example: Grass, Wheat, Rice).',
        studentAns: 'Tap root has one big main root (e.g. Carrot).\nFibrous root has bunch of thin roots (e.g. Grass).',
        isCorrect: true,
      },
      {
        num: '4',
        prompt: 'Write two simple habits through which we can save drinking water at our home.',
        pts: '3 marks',
        ref: '1) Turn off tap while brushing teeth. 2) Collect RO reject water/water used for washing vegetables for plants and cleaning. 3) Repair leaking taps.',
        studentAns: '1. Close tap while brushing teeth.\n2. Wash cars with hose pipe everyday.   (Mistake: using hose pipe wastes water!)',
        isCorrect: false,
      },
    ];

    let startY = 150;
    evsQuestions.forEach((q) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`Q${q.num} [${q.pts}]:`, type === 'student' ? 110 : 60, startY);

      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(q.prompt, type === 'student' ? 110 : 60, startY + 22);

      if (type === 'student') {
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'italic 15px "Comic Sans MS", "Caveat", cursive, sans-serif';
        const lines = q.studentAns.split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, 130, startY + 54 + idx * 22);
        });
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.strokeRect(125, startY + 36, 580, lines.length * 24 + 18);
      } else if (type === 'answerKey') {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`[CBSE RUBRIC]: ${q.ref}`, 80, startY + 50);
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(80, startY + 45, 640, 75);
        ctx.setLineDash([]);
      }

      startY += 215;
    });
  } else if (subject === 'kannada') {
    // Kannada (Savi Kannada Class 4 / ಸವಿ ಕನ್ನಡ ೪ನೇ ತರಗತಿ)
    const kannadaQuestions = [
      {
        num: '1',
        prompt: 'ಕೆಳಗಿನ ಪದಕ್ಕೆ ವಿರುದ್ಧ ಪದವನ್ನು ಬರೆಯಿರಿ (Write opposite word): ದೊಡ್ಡ (Dodda = Big) × ______',
        pts: '2 marks',
        ref: 'ಚಿಕ್ಕ ಅಥವಾ ಸಣ್ಣ (Chikka / Sanna = Small).',
        studentAns: 'ದೊಡ್ಡ × ಚಿಕ್ಕ (Chikka)',
        isCorrect: true,
      },
      {
        num: '2',
        prompt: 'ಈ ಕೆಳಗಿನ ಪದದಲ್ಲಿರುವ ಒತ್ತಕ್ಷರವನ್ನು ಗುರುತಿಸಿ ಬರೆಯಿರಿ: "ಪುಸ್ತಕ" (Pustaka)',
        pts: '2 marks',
        ref: '\'ಸ್ತ\' - \'ತ\' ಒತ್ತಕ್ಷರ (Ta-vattakshara in \'sta\').',
        studentAns: 'ಸ್ತ (ತ - ಒತ್ತಕ್ಷರ)',
        isCorrect: true,
      },
      {
        num: '3',
        prompt: 'ಖಾಲಿ ಬಿಟ್ಟ ಸ್ಥಳವನ್ನು ಸರಿಯಾದ ಪದದಿಂದ ತುಂಬಿರಿ: ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ _________.',
        pts: '2 marks',
        ref: 'ಬೆಂಗಳೂರು (Bengaluru).',
        studentAns: 'ಮೈಸೂರು (Student slip: wrote Mysuru instead of Bengaluru!)',
        isCorrect: false,
      },
      {
        num: '4',
        prompt: '\'ಶಾಲೆ\' (School) ಪದವನ್ನು ಬಳಸಿ ಅರ್ಥಪೂರ್ಣ ಸ್ವಂತ ವಾಕ್ಯ ಬರೆಯಿರಿ.',
        pts: '4 marks',
        ref: 'ಅರ್ಥಪೂರ್ಣ ವಾಕ್ಯ. ಉದಾ: "ನಾನು ಪ್ರತಿದಿನ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಶಾಲೆಗೆ ಹೋಗುತ್ತೇನೆ."',
        studentAns: 'ನಾನು ಪ್ರತಿದಿನ ನನ್ನ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಶಾಲೆಗೆ ಹೋಗುತ್ತೇನೆ.',
        isCorrect: true,
      },
    ];

    let startY = 150;
    kannadaQuestions.forEach((q) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`Q${q.num} [${q.pts}]:`, type === 'student' ? 110 : 60, startY);

      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(q.prompt, type === 'student' ? 110 : 60, startY + 22);

      if (type === 'student') {
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'italic 15px "Comic Sans MS", "Caveat", system-ui, cursive, sans-serif';
        const lines = q.studentAns.split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, 130, startY + 54 + idx * 22);
        });
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.strokeRect(125, startY + 36, 580, lines.length * 24 + 18);
      } else if (type === 'answerKey') {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`[CBSE / STATE RUBRIC]: ${q.ref}`, 80, startY + 50);
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(80, startY + 45, 640, 75);
        ctx.setLineDash([]);
      }

      startY += 215;
    });
  } else {
    // English (Marigold Class 4)
    const englishQuestions = [
      {
        num: '1',
        prompt: 'Identify the Collective Noun in the sentence: "A flock of birds flew across the sky."',
        pts: '2 marks',
        ref: 'Collective Noun: "flock" (refers to a group of birds).',
        studentAns: 'Collective Noun = flock',
        isCorrect: true,
      },
      {
        num: '2',
        prompt: 'Fill in the blank with the correct preposition: "The puppy was sleeping _____ the table." (under / above / between)',
        pts: '2 marks',
        ref: 'under',
        studentAns: 'under',
        isCorrect: true,
      },
      {
        num: '3',
        prompt: 'Change the underlined verb into the Simple Past Tense: "Riya WRITES a letter to her grandmother."',
        pts: '3 marks',
        ref: 'writes -> wrote. ("Riya wrote a letter to her grandmother.")',
        studentAns: 'writes -> writed   (Grammar mistake: irregular verb past tense is "wrote", not "writed")',
        isCorrect: false,
      },
      {
        num: '4',
        prompt: 'Make a meaningful sentence of your own using the word: "Delighted".',
        pts: '3 marks',
        ref: 'Acceptable grammatically correct sentence showing joy/happiness. E.g., "I was delighted to receive a prize on sports day."',
        studentAns: 'Sentence: Aarav was delighted when his father gave him a new story book.',
        isCorrect: true,
      },
    ];

    let startY = 150;
    englishQuestions.forEach((q) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`Q${q.num} [${q.pts}]:`, type === 'student' ? 110 : 60, startY);

      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(q.prompt, type === 'student' ? 110 : 60, startY + 22);

      if (type === 'student') {
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'italic 15px "Comic Sans MS", "Caveat", cursive, sans-serif';
        const lines = q.studentAns.split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, 130, startY + 54 + idx * 22);
        });
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.strokeRect(125, startY + 36, 580, lines.length * 24 + 18);
      } else if (type === 'answerKey') {
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`[CBSE RUBRIC]: ${q.ref}`, 80, startY + 50);
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(80, startY + 45, 640, 75);
        ctx.setLineDash([]);
      }

      startY += 215;
    });
  }

  // Footer stamp
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('CBSE Class IV Evaluation Engine • NCERT Aligned • Step-Marking Verification', 110, height - 20);

  return canvas.toDataURL('image/png');
}

export function getSampleWorksheets(): SampleWorksheet[] {
  return [
    {
      id: 'cbse-class4-math',
      title: 'Class 4 Mathematics: Money, Length & Division',
      subject: 'Mathematics',
      chapter: 'Ch 4, 10 & 11: Money, Fields & Fences, Tables & Shares',
      description: 'Money word problems (₹), Length conversion (m to cm), Perimeter of square field & Equal sharing division.',
      date: new Date().toISOString().split('T')[0],
      gradeLevel: 'Class 4 (CBSE)',
      icon: 'Calculator',
      studentSheets: [
        {
          id: 'sample-math-student-1',
          name: 'Aarav_Math_Homework_Page1.png',
          dataUrl: createWorksheetImage('student', 'math'),
          mimeType: 'image/png',
        },
      ],
      answerKeys: [
        {
          id: 'sample-math-key-1',
          name: 'CBSE_Class4_Math_AnswerKey.png',
          dataUrl: createWorksheetImage('answerKey', 'math'),
          mimeType: 'image/png',
        },
      ],
      questionPapers: [
        {
          id: 'sample-math-paper-1',
          name: 'DPS_Class4_Math_Worksheet.png',
          dataUrl: createWorksheetImage('questionPaper', 'math'),
          mimeType: 'image/png',
        },
      ],
    },
    {
      id: 'cbse-class4-kannada',
      title: 'Class 4 Kannada: Grammar & Sentences (ಸವಿ ಕನ್ನಡ)',
      subject: 'Kannada',
      chapter: 'ಪಾಠ ೧ & ೪: ಕನ್ನಡ ನಾಡು, ಪರಿಸರ ಮತ್ತು ವ್ಯಾಕರಣ (Varnamale & Vattakshara)',
      description: 'Opposite words (ವಿರುದ್ಧ ಪದಗಳು), Vattakshara (ಒತ್ತಕ್ಷರ), State capital & Own sentence writing (ಸ್ವಂತ ವಾಕ್ಯ).',
      date: new Date().toISOString().split('T')[0],
      gradeLevel: 'Class 4 (Savi Kannada)',
      icon: 'Languages',
      studentSheets: [
        {
          id: 'sample-kan-student-1',
          name: 'Aarav_Kannada_Homework_Page1.png',
          dataUrl: createWorksheetImage('student', 'kannada'),
          mimeType: 'image/png',
        },
      ],
      answerKeys: [
        {
          id: 'sample-kan-key-1',
          name: 'Class4_Savi_Kannada_AnswerKey.png',
          dataUrl: createWorksheetImage('answerKey', 'kannada'),
          mimeType: 'image/png',
        },
      ],
      questionPapers: [
        {
          id: 'sample-kan-paper-1',
          name: 'Karnataka_Class4_Kannada_Worksheet.png',
          dataUrl: createWorksheetImage('questionPaper', 'kannada'),
          mimeType: 'image/png',
        },
      ],
    },
    {
      id: 'cbse-class4-science',
      title: 'Class 4 Science: Animals, Plants & Water Resources',
      subject: 'Science',
      chapter: 'Living World: Plant Roots, Bird Beaks & Water Conservation',
      description: 'Animal ears identification, Bird beaks function, Taproot vs Fibrous root system & Water conservation.',
      date: new Date().toISOString().split('T')[0],
      gradeLevel: 'Class 4 (CBSE)',
      icon: 'Atom',
      studentSheets: [
        {
          id: 'sample-evs-student-1',
          name: 'Aarav_Science_Answers_Page1.png',
          dataUrl: createWorksheetImage('student', 'evs'),
          mimeType: 'image/png',
        },
      ],
      answerKeys: [
        {
          id: 'sample-evs-key-1',
          name: 'CBSE_Class4_Science_MarkingScheme.png',
          dataUrl: createWorksheetImage('answerKey', 'evs'),
          mimeType: 'image/png',
        },
      ],
      questionPapers: [
        {
          id: 'sample-evs-paper-1',
          name: 'School_Science_Assessment_Worksheet.png',
          dataUrl: createWorksheetImage('questionPaper', 'evs'),
          mimeType: 'image/png',
        },
      ],
    },
    {
      id: 'cbse-class4-english',
      title: 'Class 4 English: Grammar & Sentences',
      subject: 'English',
      chapter: 'Grammar Unit: Nouns, Prepositions & Verb Tenses',
      description: 'Collective nouns, Prepositions (under/between), Irregular past tense verbs & vocabulary sentence writing.',
      date: new Date().toISOString().split('T')[0],
      gradeLevel: 'Class 4 (CBSE)',
      icon: 'BookOpen',
      studentSheets: [
        {
          id: 'sample-eng-student-1',
          name: 'Aarav_English_Homework.png',
          dataUrl: createWorksheetImage('student', 'english'),
          mimeType: 'image/png',
        },
      ],
      answerKeys: [
        {
          id: 'sample-eng-key-1',
          name: 'Class4_English_Grammar_Solutions.png',
          dataUrl: createWorksheetImage('answerKey', 'english'),
          mimeType: 'image/png',
        },
      ],
      questionPapers: [
        {
          id: 'sample-eng-paper-1',
          name: 'English_Chapter_Test_Paper.png',
          dataUrl: createWorksheetImage('questionPaper', 'english'),
          mimeType: 'image/png',
        },
      ],
    },
  ];
}
