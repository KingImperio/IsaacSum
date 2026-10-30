import { useState, useEffect } from 'react';
import {
  summarize,
  listHistory,
  getSummary,
  deleteSummary,
  exportPdf,
  exportMarkdown,
} from './api.js';
import OptionsBar from './components/OptionsBar.jsx';
import SummaryCard from './components/SummaryCard.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';

const ACCEPT = '.pdf,.docx,.txt,.md';

export default function App() {
  const [tab, setTab] = useState('summarize');
  const [mode, setMode] = useState('upload'); // upload | paste

  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [options, setOptions] = useState({ length: 'balanced', format: 'bullets' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      setHistory(await listHistory());
    } catch (e) {
      setError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setText('');
      setError('');
    }
  }

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setText('');
      setError('');
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = { options };
      if (mode === 'upload' && file) payload.file = file;
      if (mode === 'paste') {
        if (!text.trim()) throw new Error('Paste some text to summarize.');
        payload.text = text;
      }
      if (mode === 'upload' && !file) throw new Error('Upload a file or switch to Paste Text.');

      const res = await summarize(payload);
      setResult(res);
      if (tab === 'history') loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openFromHistory(entry) {
    try {
      const full = await getSummary(entry.id);
      setResult(full);
      setTab('summarize');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeFromHistory(id) {
    try {
      await deleteSummary(id);
      setHistory((h) => h.filter((x) => x.id !== id));
      if (result?.id === id) setResult(null);
    } catch (e) {
      setError(e.message);
    }
  }

  const title = result?.source?.filename || 'Pasted text';

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="logo">📚</span>
          <div>
            <h1>IsaacSum</h1>
            <p>PDF & docs summary tool for students</p>
          </div>
        </div>
        <nav className="tabs">
          <button className={tab === 'summarize' ? 'active' : ''} onClick={() => setTab('summarize')}>
            Summarize
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            History
          </button>
        </nav>
      </header>

      {tab === 'summarize' && (
        <main className="grid">
          <section className="panel">
            <h2>New Summary</h2>

            <div className="mode-toggle">
              <button
                className={mode === 'upload' ? 'active' : ''}
                onClick={() => setMode('upload')}
              >
                Upload File
              </button>
              <button
                className={mode === 'paste' ? 'active' : ''}
                onClick={() => setMode('paste')}
              >
                Paste Text
              </button>
            </div>

            {mode === 'upload' && (
              <div
                className="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <input
                  type="file"
                  id="file"
                  accept={ACCEPT}
                  onChange={onFileChange}
                  hidden
                />
                <label htmlFor="file" className="dropzone-inner">
                  <strong>Click to upload</strong> or drag and drop
                  <div className="hint">PDF, DOCX, TXT, MD • up to 25 MB</div>
                  {file && <div className="file-name">📄 {file.name}</div>}
                </label>
              </div>
            )}

            {mode === 'paste' && (
              <textarea
                className="textarea"
                placeholder="Paste lecture notes, textbook excerpts, or any text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}

            <OptionsBar options={options} onChange={setOptions} />

            <button className="submit" onClick={onSubmit} disabled={loading}>
              {loading ? 'Summarizing…' : 'Generate Summary'}
            </button>

            {error && <div className="error">⚠️ {error}</div>}
          </section>

          <section className="panel">
            <h2>Result</h2>
            {!result && !loading && (
              <div className="empty">Upload a document or paste text to get started.</div>
            )}
            {loading && <div className="empty">Thinking...</div>}
            {result && (
              <SummaryCard
                entry={result}
                title={title}
                onExportMd={() => exportMarkdown({ title, content: result.summary })}
                onExportPdf={() => exportPdf({ title, content: result.summary })}
              />
            )}
          </section>
        </main>
      )}

      {tab === 'history' && (
        <main>
          <section className="panel">
            <div className="panel-header">
              <h2>Saved Summaries</h2>
              <button className="ghost" onClick={loadHistory}>
                Refresh
              </button>
            </div>
            <HistoryPanel
              items={history}
              loading={historyLoading}
              onOpen={openFromHistory}
              onDelete={removeFromHistory}
            />
          </section>
        </main>
      )}

      <footer className="footer">
        <span>IsaacSum · Built for students</span>
      </footer>
    </div>
  );
}
