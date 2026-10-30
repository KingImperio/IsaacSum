import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { DATA_DIR } from './paths.js';

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_ENTRIES = 200;

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(entries) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2));
}

/** Add a summary to the history store (newest first). */
export function addEntry({ source = null, options = {}, summary }) {
  const entries = readAll();
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source, // { filename, size } or null (pasted text)
    options,
    summary,
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  writeAll(entries);
  return entry;
}

/** List entries with a short preview instead of the full summary. */
export function listEntries() {
  return readAll().map((entry) => ({
    ...entry,
    preview: entry.summary.slice(0, 160),
    summary: undefined,
  }));
}

export function getEntry(id) {
  return readAll().find((entry) => entry.id === id) || null;
}

/** Delete an entry. Returns true when an entry was removed. */
export function deleteEntry(id) {
  const entries = readAll();
  const next = entries.filter((entry) => entry.id !== id);
  if (next.length === entries.length) return false;
  writeAll(next);
  return true;
}
