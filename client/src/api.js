const BASE = '/api';

export async function summarize({ file, text, options }) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (text) formData.append('text', text);
  formData.append('options', JSON.stringify(options));

  const res = await fetch(`${BASE}/summarize`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export async function listHistory() {
  const res = await fetch(`${BASE}/history`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function getSummary(id) {
  const res = await fetch(`${BASE}/history/${id}`);
  if (!res.ok) throw new Error('Failed to load summary');
  return res.json();
}

export async function deleteSummary(id) {
  const res = await fetch(`${BASE}/history/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete summary');
  return res.json();
}

export async function exportPdf({ title, content }) {
  const res = await fetch(`${BASE}/export/pdf`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error('Failed to export PDF');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(title)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function exportMarkdown({ title, content }) {
  const blob = new Blob([`# ${title}\n\n${content}\n`], { type: 'text/markdown' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(title)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function slug(str) {
  return (
    String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'isaacsum-summary'
  );
}
