import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import summarizeRoutes from './routes/summarize.js';
import historyRoutes from './routes/history.js';
import exportRoutes from './routes/export.js';
import { DATA_DIR, UPLOAD_DIR, SERVER_ROOT } from './lib/paths.js';

// Make sure runtime directories exist.
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'isaacsum', provider: process.env.AI_PROVIDER || 'anthropic' });
});

app.use('/api/summarize', summarizeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/export', exportRoutes);

// Serve the built React client in production.
const clientDist = path.join(SERVER_ROOT, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET serves index.html.
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

export default app;
