import test from 'node:test';
import assert from 'node:assert/strict';
import { topicPerformance, resultSummary } from '../src/insights.js';

const doc = { name: 'beam.md', sections: [
  { ref: 'Beam design', title: 'Beam design', level: 1, text: 'Overview.' },
  { ref: '1. Loads', title: '1. Loads', level: 2, text: 'Loads intro.' },
  { ref: '1.1 Dead loads', title: '1.1 Dead loads', level: 3, text: 'Dead.' },
  { ref: '1.2 Live loads', title: '1.2 Live loads', level: 3, text: 'Live.' },
  { ref: '2. Analysis', title: '2. Analysis', level: 2, text: 'Analysis.' },
  { ref: '2.1 Bending moment', title: '2.1 Bending moment', level: 3, text: 'Moment.' }
] };
const q = (id, source, marks = 1) => ({ id, type: marks > 1 ? 'written' : 'mcq', marks, source });
const attempt = {
  startedAt: 1000, submittedAt: 1000 + 28 * 60000 + 55000,
  questions: [q('a', '1.1 Dead loads'), q('b', '1.2 Live loads'), q('c', '2.1 Bending moment'), q('d', '2. Analysis', 5), q('e', 'Somewhere else')],
  grades: [{ id: 'a', awarded: 1 }, { id: 'b', awarded: 0 }, { id: 'c', awarded: 1 }, { id: 'd', awarded: 3 }, { id: 'e', awarded: 1 }]
};

test('questions count towards the chapter that holds their source section', () => {
  const t = topicPerformance(attempt, doc);
  assert.deepEqual(t.map(x => x.topic), ['Loads', 'Analysis', 'Somewhere else']);   // numbering stripped, document order, unmatched last
  const loads = t[0], analysis = t[1];
  assert.deepEqual([loads.earned, loads.total, loads.questions, loads.percent], [1, 2, 2, 50]);
  assert.deepEqual([analysis.earned, analysis.total, analysis.questions, analysis.percent], [4, 6, 2, 67]);
});

test('without the document, the source labels become the topics', () => {
  const t = topicPerformance(attempt, null);
  assert.equal(t.length, 5);
  assert.ok(t.some(x => x.topic === 'Dead loads' && x.percent === 100));
});

test('documents with several top headings use those headings as topics', () => {
  const flat = { name: 'notes.md', sections: [
    { ref: 'Loads', title: 'Loads', level: 1, text: 'x' }, { ref: 'Dead loads', title: 'Dead loads', level: 2, text: 'y' },
    { ref: 'Analysis', title: 'Analysis', level: 1, text: 'z' }] };
  const t = topicPerformance({ questions: [q('a', 'Dead loads'), q('b', 'Analysis')], grades: [{ id: 'a', awarded: 1 }] }, flat);
  assert.deepEqual(t.map(x => [x.topic, x.percent]), [['Loads', 100], ['Analysis', 0]]);
});

test('the summary counts full-mark answers and the time taken', () => {
  assert.deepEqual(resultSummary(attempt), { questions: 5, correct: 3, ms: 28 * 60000 + 55000 });
  assert.deepEqual(resultSummary({ questions: [], grades: [] }), { questions: 0, correct: 0, ms: 0 });
});
