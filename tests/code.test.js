import test from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMS, parseTests, formatTests, problemTests, same, findFn, pyHarness, grade, normalizeReview, codeTrace, suggestProblem, nextHint, conceptsOf, starter, STEPS, MODES } from '../src/code.js';
import { runRemote } from '../src/coderun.js';
import { updateProfile, weakTopics, emptyProfile } from '../src/tutor.js';
import { loadPyodide } from 'pyodide';

test('loop has the six ECC-style steps and five modes', () => {
  assert.deepEqual(STEPS.map(s => s[0]), ['plan', 'test', 'code', 'review', 'verify', 'remember']);
  assert.deepEqual(MODES.map(m => m[0]), ['solve', 'learn', 'debug', 'explain', 'interview']);
});
test('student test cases parse, round-trip and report bad lines', () => {
  const { tests, errors } = parseTests('# comment\n[1, 2, 3] => 6\n"ab" => "ba"\n1, 2 => 3\nbad line\n[1 => 2');
  assert.equal(tests.length, 3); assert.deepEqual(tests[0], { args: [[1, 2, 3]], expected: 6 }); assert.deepEqual(tests[2].args, [1, 2]);
  assert.equal(errors.length, 2);
  assert.deepEqual(parseTests(formatTests(tests)).tests, tests);
});
test('deep equality with float tolerance', () => {
  assert.ok(same([1, [2, { a: 0.1 + 0.2 }]], [1, [2, { a: 0.3 }]])); assert.ok(!same([1, 2], [2, 1])); assert.ok(!same('1', 1)); assert.ok(same(null, null));
});
test('finds the function even if renamed, in JS and Python', () => {
  assert.equal(findFn('function sumEven(a){}', 'javascript', 'sumEven'), 'sumEven');
  assert.equal(findFn('const total = (a) => 1', 'javascript', 'sumEven'), 'total');
  assert.equal(findFn('def sum_even(nums):\n  pass', 'python', 'sumEven'), 'sum_even');
});
test('every built-in problem has a reference that passes its own tests (JS)', () => {
  const ref = {
    sumEven: n => n.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0), reverseWords: s => s.trim().split(/\s+/).filter(Boolean).reverse().join(' '),
    firstUnique: s => [...s].findIndex(c => s.indexOf(c) === s.lastIndexOf(c)), isPalindrome: s => { const t = s.toLowerCase().replace(/[^a-z]/g, ''); return t === [...t].reverse().join(''); },
    factorial: function f(n) { return n <= 1 ? 1 : n * f(n - 1); }, countSubsets: function c(a, t, i = 0) { return i === a.length ? (t === 0 ? 1 : 0) : c(a, t, i + 1) + c(a, t - a[i], i + 1); },
    search: (a, t) => a.indexOf(t), balanced: s => { const st = [], m = { ')': '(', ']': '[', '}': '{' }; for (const c of s) { if ('([{'.includes(c)) st.push(c); else if (m[c] && st.pop() !== m[c]) return false; } return !st.length; },
    ways: n => { let a = 1, b = 1; for (let i = 1; i < n; i++) [a, b] = [b, a + b]; return b; },
    merge: iv => [...iv].sort((x, y) => x[0] - y[0]).reduce((o, [s, e]) => { const l = o[o.length - 1]; if (l && s <= l[1]) l[1] = Math.max(l[1], e); else o.push([s, e]); return o; }, []),
    islands: g => { const G = g.map(r => [...r]); let n = 0; const f = (i, j) => { if (G[i]?.[j] !== '1') return; G[i][j] = '0'; f(i + 1, j); f(i - 1, j); f(i, j + 1); f(i, j - 1); }; G.forEach((r, i) => r.forEach((c, j) => { if (c === '1') { n++; f(i, j); } })); return n; }
  };
  for (const p of PROBLEMS) { const ts = problemTests(p); const g = grade(ts, ts.map(t => ({ ok: true, value: ref[p.fn](...structuredClone(t.args)) }))); assert.equal(g.passed, g.total, p.id); }
});
test('Python harness runs in Pyodide, grades results and blocks the js bridge', async () => {
  const py = await loadPyodide();
  py.runPython('import sys\nsys.modules["js"] = None\nsys.modules["pyodide.http"] = None');
  const p = PROBLEMS.find(x => x.id === 'factorial'), tests = problemTests(p);
  const good = 'def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)\n';
  assert.equal(grade(tests, JSON.parse(py.runPython(pyHarness(good, 'factorial', tests)))).passed, 3);
  const bad = 'def factorial(n):\n    return n * factorial(n - 1)\n';
  const g = grade(tests, JSON.parse(py.runPython(pyHarness(bad, 'factorial', tests))));
  assert.equal(g.passed, 0); assert.match(g.rows[0].error, /RecursionError/);
  assert.throws(() => py.runPython('import js'), /ImportError|ModuleNotFoundError|halted/);
  assert.match(starter(p, 'python'), /def factorial\(n\):/);
});
test('review is normalised; hint ladder climbs nudge → hint → pseudo → solution', () => {
  const r = normalizeReview({ summary: 's', issues: [{ kind: 'bug', line: 3, msg: 'No base case, the recursion never stops' }, { kind: 'weird', msg: 'x' }, { msg: '' }], hints: { nudge: 'n', solution: 'code' } });
  assert.equal(r.issues.length, 2); assert.equal(r.issues[1].kind, 'bug'); assert.ok(r.concepts.includes('Recursion'));
  assert.deepEqual(['', 'nudge', 'hint', 'pseudo', 'solution'].map(nextHint), ['nudge', 'hint', 'pseudo', 'solution', 'solution']);
  assert.deepEqual(conceptsOf('null pointer deref and an off-by-one'), ['Pointers', 'Edge cases']);
});
test('Remember: a failed recursion attempt makes Recursion a weak topic and is suggested next', () => {
  const p = PROBLEMS.find(x => x.id === 'factorial'), tests = problemTests(p);
  const g = grade(tests, tests.map(() => ({ ok: false, error: 'RecursionError: maximum recursion depth' })));
  const tr = codeTrace({ problem: p, lang: 'python', grade: g, review: normalizeReview({ issues: [{ kind: 'bug', msg: 'missing base case in recursion' }] }), hintsUsed: 2 }, 1000);
  assert.equal(tr.kind, 'code'); assert.equal(tr.score, 0); assert.ok(tr.mistakes.length >= 2);
  const prof = updateProfile(emptyProfile(), tr);
  assert.equal(weakTopics(prof)[0].name, 'Recursion');
  assert.equal(suggestProblem(weakTopics(prof).map(t => t.name), ['factorial']).topic, 'Recursion');
});
test('remote runner (Judge0-style): passes cases, and reports 401 / 429 / unreachable', async () => {
  const calls = [];
  const ok = async (url, o) => { calls.push([url, JSON.parse(o.body), o.headers]); return { ok: true, status: 200, json: async () => ({ stdout: String(JSON.parse(o.body).stdin.split('\n').map(Number).reduce((a, b) => a + b, 0)) + '\n', status: { id: 3 } }) }; };
  const r = await runRemote({ url: 'https://runner.test/', key: 'k' }, 'int main(){}', 'c', [{ args: [1, 2], expected: 3 }], ok);
  assert.deepEqual(r.results, [{ ok: true, value: 3 }]); assert.match(calls[0][0], /^https:\/\/runner\.test\/submissions\?/); assert.equal(calls[0][1].language_id, 50); assert.equal(calls[0][2]['X-Auth-Token'], 'k');
  assert.match((await runRemote({ url: 'https://r' }, '', 'c', [{ args: [] }], async () => ({ ok: false, status: 401 }))).error, /rejected the key/);
  assert.match((await runRemote({ url: 'https://r' }, '', 'c', [{ args: [] }], async () => ({ ok: false, status: 429 }))).error, /rate-limiting/);
  assert.match((await runRemote({ url: 'https://r' }, '', 'c', [{ args: [] }], async () => { throw TypeError('fetch failed'); })).error, /Could not reach/);
  assert.match((await runRemote({}, '', 'c', [])).error, /No code runner/);
  const ce = await runRemote({ url: 'https://r' }, '', 'cpp', [{ args: [] }], async () => ({ ok: true, status: 200, json: async () => ({ compile_output: 'error: expected ;' }) }));
  assert.match(ce.error, /expected ;/);
});
