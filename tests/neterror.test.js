import test from 'node:test';
import assert from 'node:assert/strict';
import { networkError } from '../src/net.js';
import { shouldFallback } from '../src/ai.js';

test('custom endpoint failures name the real cause', () => {
  const lh = networkError('http://localhost:3001/v1/chat/completions', Error('Failed to connect to localhost/127.0.0.1:3001'), { native: true });
  assert.match(lh, /means this phone itself/);
  assert.match(networkError('http://my.server:3001/v1', TypeError('Failed to fetch'), { pageProtocol: 'https:' }), /HTTPS, so the browser blocks plain http/);
  assert.match(networkError('https://nope.example/v1', Error('Unable to resolve host "nope.example"'), { native: true }), /could not be found \(DNS\)/);
  assert.match(networkError('http://192.168.1.5:3001/v1', Error('Failed to connect to /192.168.1.5:3001'), { native: true }), /refused/);
  assert.match(networkError('https://x.example/v1', TypeError('Failed to fetch'), { pageProtocol: 'https:' }), /CORS/);
  assert.match(networkError('https://x.example/v1', Object.assign(Error('x'), { name: 'AbortError' })), /timed out/);
  assert.match(networkError('https://x.example/v1', Error('SSL handshake aborted'), { native: true }), /certificate/);
});
test('real-cause messages still trigger the provider fallback', () => {
  assert.ok(shouldFallback(Error(networkError('http://localhost:3001/v1', Error('refused'), { native: true }))));
  assert.ok(shouldFallback(Error(networkError('https://x.example/v1', TypeError('Failed to fetch'), {}))));
});
