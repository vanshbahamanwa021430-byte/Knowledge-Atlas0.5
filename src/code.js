// Smarty Code: a guided coding-practice loop (Plan → Test first → Implement → Review → Verify → Remember).
// The step-by-step workflow idea is inspired by the ECC agent harness (affaan-m/ECC, MIT); this is original code.
// Pure helpers only (unit-tested): problem bank, test cases, harnesses, result checks, hint ladder, concept traces.
export const STEPS = [
  ['plan', 'Plan', 'Break the problem into small steps'],
  ['test', 'Test first', 'Write the cases your code must pass'],
  ['code', 'Implement', 'Write the code'],
  ['review', 'Review', 'Bugs, style, complexity, security'],
  ['verify', 'Verify', 'Run the tests'],
  ['remember', 'Remember', 'Save what you learned']
];
export const MODES = [
  ['solve', 'Solve a problem', 'DSA practice by topic and difficulty'],
  ['learn', 'Learn a concept', 'Short lesson, then a tiny exercise'],
  ['debug', 'Debug my code', 'Find and fix the bug, with hints first'],
  ['explain', 'Explain this code', 'Line by line, at your level'],
  ['interview', 'Interview prep', 'Timed problem, think aloud, then review']
];
export const LANGS = {
  javascript: { label: 'JavaScript', run: 'device' },
  python: { label: 'Python', run: 'device' },
  c: { label: 'C', run: 'remote' },
  cpp: { label: 'C++', run: 'remote' },
  java: { label: 'Java', run: 'remote' }
};
export const HINT_LADDER = ['nudge', 'hint', 'pseudo', 'solution'];
export const HINT_LABEL = { nudge: 'Nudge', hint: 'Hint', pseudo: 'Pseudo-code', solution: 'Solution' };
export const nextHint = level => HINT_LADDER[Math.min(HINT_LADDER.length - 1, HINT_LADDER.indexOf(level) + 1)] || 'nudge';

// Concepts that mistakes are recorded under (Smarty's learner profile uses them as topics).
export const CONCEPTS = ['Arrays', 'Strings', 'Hashing', 'Two pointers', 'Recursion', 'Sorting', 'Binary search', 'Stacks and queues', 'Linked lists', 'Pointers', 'Trees', 'Graphs', 'Dynamic programming', 'Big-O complexity', 'Edge cases', 'Input validation'];
const CONCEPT_WORDS = [
  [/recurs|base case|stack overflow|call stack/i, 'Recursion'], [/pointer|null deref|segfault|dangling|malloc|free\(/i, 'Pointers'],
  [/off[- ]by[- ]one|boundary|empty (input|array|list)|edge case/i, 'Edge cases'], [/O\(n\^?2\)|quadratic|complexit|too slow|time limit/i, 'Big-O complexity'],
  [/hash ?map|dictionary|set\b/i, 'Hashing'], [/two pointers?|sliding window/i, 'Two pointers'], [/binary search|mid ?=/i, 'Binary search'],
  [/linked list|\.next\b/i, 'Linked lists'], [/sort/i, 'Sorting'], [/memo|dynamic programming|\bdp\b|subproblem/i, 'Dynamic programming'],
  [/tree|bst|inorder|preorder/i, 'Trees'], [/graph|bfs|dfs|adjacen/i, 'Graphs'], [/stack|queue/i, 'Stacks and queues'],
  [/injection|eval\(|sanitiz|untrusted|validate/i, 'Input validation'], [/string|substring|char/i, 'Strings'], [/array|index/i, 'Arrays']
];
export function conceptsOf(text, given = []) {
  const out = new Set(given.filter(c => CONCEPTS.includes(c)));
  for (const [re, c] of CONCEPT_WORDS) if (re.test(String(text || ''))) out.add(c);
  return [...out].slice(0, 4);
}

// Original practice problems. Tests: args (array) → expected (JSON value).
export const PROBLEMS = [
  { id: 'sum-even', title: 'Sum of even numbers', topic: 'Arrays', level: 'easy', fn: 'sumEven', params: ['nums'],
    text: 'Return the sum of the even numbers in the list nums.', tests: [[[[1, 2, 3, 4]], 6], [[[]], 0], [[[-2, 5]], -2]] },
  { id: 'reverse-words', title: 'Reverse the words', topic: 'Strings', level: 'easy', fn: 'reverseWords', params: ['s'],
    text: 'Return the words of s in reverse order, separated by single spaces. Ignore extra spaces.', tests: [[['hello world'], 'world hello'], [['  a  b c '], 'c b a'], [[''], '']] },
  { id: 'first-unique', title: 'First unique character', topic: 'Hashing', level: 'easy', fn: 'firstUnique', params: ['s'],
    text: 'Return the index of the first character of s that appears only once, or -1.', tests: [[['aabcb'], 3], [['aabb'], -1], [['z'], 0]] },
  { id: 'is-palindrome', title: 'Palindrome check', topic: 'Two pointers', level: 'easy', fn: 'isPalindrome', params: ['s'],
    text: 'Return true if s reads the same forwards and backwards, ignoring case and non-letters.', tests: [[['Race car'], true], [['abc'], false], [[''], true]] },
  { id: 'factorial', title: 'Factorial (recursive)', topic: 'Recursion', level: 'easy', fn: 'factorial', params: ['n'],
    text: 'Return n! using recursion. factorial(0) is 1.', tests: [[[0], 1], [[5], 120], [[10], 3628800]] },
  { id: 'power-set-size', title: 'Count subsets with sum', topic: 'Recursion', level: 'medium', fn: 'countSubsets', params: ['nums', 'target'],
    text: 'Return how many subsets of nums add up to target.', tests: [[[[1, 2, 3], 3], 2], [[[], 0], 1], [[[5], 1], 0]] },
  { id: 'binary-search', title: 'Binary search', topic: 'Binary search', level: 'medium', fn: 'search', params: ['nums', 'target'],
    text: 'nums is sorted ascending. Return the index of target, or -1. Aim for O(log n).', tests: [[[[1, 3, 5, 7, 9], 7], 3], [[[1, 3], 2], -1], [[[], 4], -1]] },
  { id: 'valid-brackets', title: 'Balanced brackets', topic: 'Stacks and queues', level: 'medium', fn: 'balanced', params: ['s'],
    text: 'Return true if every (, [ and { in s is closed in the right order.', tests: [[['([]{})'], true], [['(]'], false], [['(('], false]] },
  { id: 'climb-stairs', title: 'Climbing stairs', topic: 'Dynamic programming', level: 'medium', fn: 'ways', params: ['n'],
    text: 'You climb 1 or 2 steps at a time. Return the number of ways to reach step n.', tests: [[[1], 1], [[2], 2], [[10], 89]] },
  { id: 'merge-intervals', title: 'Merge intervals', topic: 'Sorting', level: 'hard', fn: 'merge', params: ['intervals'],
    text: 'Merge all overlapping [start, end] intervals and return them sorted by start.', tests: [[[[[1, 3], [2, 6], [8, 10]]], [[1, 6], [8, 10]]], [[[[1, 4], [4, 5]]], [[1, 5]]], [[[]], []]] },
  { id: 'islands', title: 'Number of islands', topic: 'Graphs', level: 'hard', fn: 'islands', params: ['grid'],
    text: "grid is a list of strings of '1' (land) and '0' (water). Return the number of islands (4-directional).", tests: [[[['110', '010', '001']], 2], [[['000']], 0], [[[]], 0]] }
];
export const problemsBy = ({ topic = '', level = '' } = {}) => PROBLEMS.filter(p => (!topic || p.topic === topic) && (!level || p.level === level));
export const TOPICS = [...new Set(PROBLEMS.map(p => p.topic))];

// Starter code for a problem in a language.
export function starter(p, lang) {
  const a = p.params.join(', ');
  if (lang === 'python') return `def ${snake(p.fn)}(${a}):\n    # ${p.text}\n    pass\n`;
  if (lang === 'javascript') return `function ${p.fn}(${a}) {\n  // ${p.text}\n}\n`;
  if (lang === 'java') return `class Solution {\n  // ${p.text}\n  static Object ${p.fn}(${p.params.map(x => 'Object ' + x).join(', ')}) {\n    return null;\n  }\n}\n`;
  return `// ${p.text}\n#include <stdio.h>\n\nint main(void) {\n  return 0;\n}\n`;
}
export const snake = s => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());

// Test cases the student writes, one per line: `args => expected`, both JSON. E.g. `[1,2] => 3` or `"ab" => "ba"`.
export function parseTests(text) {
  const tests = [], errors = [];
  String(text || '').split('\n').forEach((line, i) => {
    const l = line.trim(); if (!l || l.startsWith('#') || l.startsWith('//')) return;
    const k = l.lastIndexOf('=>'); if (k < 0) { errors.push(`Line ${i + 1}: use  arguments => expected`); return; }
    try {
      const args = JSON.parse('[' + l.slice(0, k).trim() + ']'), expected = JSON.parse(l.slice(k + 2).trim());
      tests.push({ args, expected });
    } catch { errors.push(`Line ${i + 1}: arguments and expected value must be JSON (strings in "double quotes")`); }
  });
  return { tests, errors };
}
export const formatTests = tests => tests.map(t => `${t.args.map(a => JSON.stringify(a)).join(', ')} => ${JSON.stringify(t.expected)}`).join('\n');
export const problemTests = p => p.tests.map(([args, expected]) => ({ args, expected }));

// Deep equality on JSON-like values (numbers compared with a small tolerance).
export function same(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9 || (Number.isNaN(a) && Number.isNaN(b));
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => same(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') { const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return same(ka, kb) && ka.every(k => same(a[k], b[k])); }
  return a === b;
}
// Names the function the student wrote, so the runner can call it even if they renamed it.
export function findFn(code, lang, wanted) {
  const re = lang === 'python' ? /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm : /(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g;
  const names = []; let m; while ((m = re.exec(code))) names.push(m[1] || m[2]);
  const w = lang === 'python' ? snake(wanted || '') : wanted;
  return names.includes(w) ? w : names.includes(wanted) ? wanted : names[names.length - 1] || w || '';
}
// Python harness (runs inside Pyodide): defines the code, then runs each case and returns JSON results.
export function pyHarness(code, fn, tests) {
  return `${code}\n\nimport json as __j\n__r = []\nfor __a in __j.loads(${JSON.stringify(JSON.stringify(tests.map(t => t.args)))}):\n    try:\n        __r.append({"ok": True, "value": ${fn}(*__a)})\n    except Exception as __e:\n        __r.append({"ok": False, "error": type(__e).__name__ + ": " + str(__e)})\n__j.dumps(__r)\n`;
}
// Grades runner output against the cases.
export function grade(tests, results) {
  const rows = tests.map((t, i) => { const r = results[i] || { ok: false, error: 'No result' }; return { args: t.args, expected: t.expected, got: r.ok ? r.value : undefined, error: r.ok ? '' : r.error, pass: !!r.ok && same(r.value, t.expected) }; });
  return { rows, passed: rows.filter(r => r.pass).length, total: rows.length };
}

// AI review → checked shape. Hints are released one rung at a time; the solution is withheld until asked.
export function normalizeReview(obj) {
  const kinds = ['bug', 'style', 'complexity', 'security'];
  const issues = (Array.isArray(obj?.issues) ? obj.issues : []).map(x => ({ kind: kinds.includes(x?.kind) ? x.kind : 'bug', line: Number.isInteger(x?.line) ? x.line : null, msg: String(x?.msg || x?.message || '').slice(0, 400) })).filter(x => x.msg).slice(0, 12);
  const h = obj?.hints || {};
  return { summary: String(obj?.summary || '').slice(0, 600), issues, complexity: String(obj?.complexity || '').slice(0, 80),
    hints: { nudge: String(h.nudge || ''), hint: String(h.hint || ''), pseudo: String(h.pseudo || ''), solution: String(h.solution || obj?.solution || '') },
    concepts: conceptsOf(issues.map(i => i.msg).join(' '), Array.isArray(obj?.concepts) ? obj.concepts : []) };
}
// Learner-profile trace in Smarty's shape: each concept is a topic row, failed cases and review bugs are mistakes,
// so weak concepts (recursion, pointers…) show up in Smarty's profile and get practice first.
export function codeTrace({ problem, lang, grade: g, review, hintsUsed = 0 }, at = Date.now()) {
  const passed = g?.passed || 0, total = g?.total || 0, ok = total ? passed / total : 0;
  const concepts = [...new Set([problem?.topic, ...(review?.concepts || [])].filter(Boolean))].slice(0, 4);
  const right = ok === 1 && hintsUsed < 3 ? 1 : 0;
  const mistakes = [...(g?.rows || []).filter(r => !r.pass).slice(0, 3).map(r => ({ topic: problem?.topic || 'Edge cases', prompt: `${problem?.title || 'Code'}: input ${JSON.stringify(r.args).slice(0, 120)}`, note: r.error || `expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.got)}`.slice(0, 200) })),
    ...(review?.issues || []).filter(x => x.kind === 'bug' || x.kind === 'security').slice(0, 3).map(x => ({ topic: conceptsOf(x.msg)[0] || problem?.topic || 'Edge cases', prompt: problem?.title || 'Code', note: x.msg.slice(0, 200) }))];
  return { id: `code-${at}-${Math.random().toString(36).slice(2, 7)}`, kind: 'code', at, topic: problem?.title || 'Code', summary: `${LANGS[lang]?.label || lang}: ${passed}/${total} tests, ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}`, steps: [], score: Math.round(ok * 100),
    topics: concepts.map(c => ({ topic: c, right, total: 1 })), mistakes, docId: null };
}
// Picks the next problem: weakest concept first, then the next difficulty up.
export function suggestProblem(weak = [], done = []) {
  const left = PROBLEMS.filter(p => !done.includes(p.id));
  for (const w of weak) { const p = left.find(x => x.topic === w); if (p) return p; }
  return left[0] || PROBLEMS[0];
}
