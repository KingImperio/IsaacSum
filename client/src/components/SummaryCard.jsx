import { useState } from 'react';

export default function SummaryCard({ entry, title, onExportMd, onExportPdf }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(entry.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const created = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : null;

  return (
    <div className="summary-card">
      <div className="summary-header">
        <div>
          <h3>{title}</h3>
          {created && <div className="meta">Saved {created}</div>}
          {entry.source?.size && (
            <div className="meta">{(entry.source.size / 1024).toFixed(1)} KB</div>
          )}
        </div>
        <div className="actions">
          <button onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
          <button onClick={onExportMd}>Export .MD</button>
          <button onClick={onExportPdf}>Export .PDF</button>
        </div>
      </div>
      <article className="summary-body">
        <pre>{entry.summary}</pre>
      </article>
    </div>
  );
}
