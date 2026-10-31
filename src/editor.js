// Code editor for Smarty Code: CodeMirror 6 (MIT), loaded only when the screen opens.
let cm = null;
const load = () => (cm ??= Promise.all([import('codemirror'), import('@codemirror/lang-javascript'), import('@codemirror/lang-python'), import('@codemirror/lang-cpp'), import('@codemirror/lang-java'), import('@codemirror/theme-one-dark'), import('@codemirror/view'), import('@codemirror/state')])
  .then(([c, js, py, cpp, java, dark, view, st]) => ({ c, js, py, cpp, java, dark, view, st })));
const views = new WeakMap();
export async function mountEditor(host, { code, lang, dark, onChange }) {
  const L = await load(), { EditorView, basicSetup } = L.c;
  const langExt = lang === 'python' ? L.py.python() : lang === 'java' ? L.java.java() : lang === 'c' || lang === 'cpp' ? L.cpp.cpp() : L.js.javascript();
  views.get(host)?.destroy();
  const v = new EditorView({ parent: host, doc: code, extensions: [basicSetup, langExt, L.st.EditorState.tabSize.of(4), ...(dark ? [L.dark.oneDark] : []),
    EditorView.lineWrapping, EditorView.contentAttributes.of({ 'aria-label': 'Code editor', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
    EditorView.updateListener.of(u => { if (u.docChanged) onChange(u.state.doc.toString()); })] });
  views.set(host, v); return v;
}
