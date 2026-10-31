import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../src/ocr.js', import.meta.url), 'utf8');
// needsOcr is copied by evaluating its one-line definition (ocr.js imports a browser-only module).
const needsOcr = eval(src.match(/export const needsOcr = ([^\n]+);/)[1]);
test('OCR is triggered only when a PDF has no real text layer', () => {
  assert.equal(needsOcr('', 3), true); assert.equal(needsOcr('  \n 12 ', 1), true);
  assert.equal(needsOcr('a'.repeat(100), 5), true); assert.equal(needsOcr('Kinetic energy is half m v squared. '.repeat(10), 2), false);
});
test('OCR assets ship with the app for offline use', () => {
  for (const f of ['worker.min.js', 'tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'eng.traineddata']) assert.ok(fs.existsSync(new URL('../public/ocr/' + f, import.meta.url)), f);
});
test('old "OCR not included" error is gone', () => { assert.doesNotMatch(fs.readFileSync(new URL('../src/documents.js', import.meta.url), 'utf8'), /not included/); });
