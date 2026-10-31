import { uuid } from './platform.js';

export const QUESTION_COUNT = 20;
export const EXAM_MINUTES = 30;

export function validateQuestions(items, count = QUESTION_COUNT) {
  if (!Array.isArray(items) || items.length !== count) throw Error(`Expected exactly ${count} questions`);
  const ids = new Set();
  let mcq = 0, written = 0;
  const out = items.map((q, i) => {
    if (!q || !['mcq', 'written'].includes(q.type) || typeof q.prompt !== 'string' || q.prompt.trim().length < 12) throw Error('Invalid question ' + (i + 1));
    const id = String(q.id || 'q' + (i + 1));
    if (ids.has(id)) throw Error('Duplicate question');
    ids.add(id);
    const marks = Number(q.marks);
    if (!Number.isInteger(marks) || marks < 1 || marks > 10) throw Error('Invalid marks');
    const source = String(q.source || '');
    if (!source.trim()) throw Error('Missing document evidence reference');
    const solution = String(q.solution || '');
    if (solution.trim().length < 8) throw Error('Missing model solution');
    const rubric = String(q.rubric || '');
    if (q.type === 'written' && rubric.trim().length < 8) throw Error('Missing written rubric');
    let options = null, correct = null;
    if (q.type === 'mcq') {
      mcq++;
      if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(x => typeof x !== 'string' || !x.trim())) throw Error('MCQ requires 4 options');
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) throw Error('Invalid MCQ key');
      options = q.options.map(String);
      correct = q.correct;
    } else written++;
    return { id, type: q.type, prompt: q.prompt.trim(), marks, source, solution, rubric, options, correct };
  });
  if (mcq !== 10 || written !== 10) throw Error('Mixed examination requires 10 MCQ and 10 written questions');
  return out;
}

export function gradeMCQ(questions, answers) {
  return questions.filter(q => q.type === 'mcq').map(q => {
    const a = answers[q.id];
    const ok = a !== undefined && a !== '' && Number(a) === q.correct; // '' must not count as option 0
    return { id: q.id, awarded: ok ? q.marks : 0, max: q.marks, method: 'answer key', feedback: ok ? 'Correct answer.' : 'See the model solution.' };
  });
}

export function makeAttempt(documentId, questions, answers, startedAt, endedAt, grades, documentName = '') {
  const total = questions.reduce((a, q) => a + q.marks, 0);
  const earned = grades.reduce((a, g) => a + g.awarded, 0);
  return {
    id: uuid(), documentId, documentName, questions, answers, startedAt, submittedAt: endedAt, grades, total, earned,
    percent: total ? Math.round(100 * earned / total) : 0,
    provisional: grades.some(g => g.method === 'AI provisional' || g.method === 'self assessment pending')
  };
}

export function isDue(startedAt, durationMinutes = EXAM_MINUTES, now = Date.now()) { return now >= startedAt + durationMinutes * 60000; }
