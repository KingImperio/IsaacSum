#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = 8899;
const server = app.listen(port, async () => {
  try {
    // Health check
    let res = await fetch(`http://localhost:${port}/api/health`);
    console.log('health:', await res.json());

    // Summarize pasted text with mock provider
    const sample = `The mitochondrion is the powerhouse of the cell. It generates ATP through cellular respiration. The Krebs cycle occurs in the matrix, while the electron transport chain is located in the inner mitochondrial membrane.`;
    res = await fetch(`http://localhost:${port}/api/summarize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: sample,
        options: { length: 'balanced', format: 'bullets' },
      }),
    });
    const data = await res.json();
    console.log('summarize status:', res.status);
    console.log('id:', data.id);
    console.log('preview:', (data.summary || '').slice(0, 80));

    // History
    res = await fetch(`http://localhost:${port}/api/history`);
    console.log('history count:', (await res.json()).length);

    console.log('\nSmoke test passed.');
  } catch (e) {
    console.error('Smoke test failed:', e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
