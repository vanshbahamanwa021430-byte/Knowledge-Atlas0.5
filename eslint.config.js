import js from '@eslint/js';
import globals from 'globals';
export default [
  { ignores: ['dist*/**', 'android/**', 'node_modules/**', 'release/**', 'out/**'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.browser, google: 'readonly', __EDITION__: 'readonly', __PUBLIC__: 'readonly' } } },
  { files: ['scripts/**/*.{js,mjs}', 'tests/**/*.{js,mjs}'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser } } },
  { files: ['electron/**/*.cjs', '**/*.cjs'], languageOptions: { sourceType: 'commonjs', globals: globals.node } },
  { files: ['proxy/**/*.{js,gs}'], languageOptions: { sourceType: 'script', globals: { ...globals.browser, PropertiesService: 'readonly', ContentService: 'readonly', UrlFetchApp: 'readonly', CacheService: 'readonly', LockService: 'readonly', Utilities: 'readonly', Logger: 'readonly' } }, rules: { 'no-redeclare': ['error', { builtinGlobals: false }] } },
  { files: ['proxy/worker.js'], languageOptions: { sourceType: 'module', globals: globals.serviceworker } },
  { rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }], 'no-useless-escape': 'off', 'no-control-regex': 'off', 'no-regex-spaces': 'off', 'no-misleading-character-class': 'off', 'no-cond-assign': ['error', 'except-parens'] } },
];
