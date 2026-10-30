import { Router } from 'express';

import { listEntries, getEntry, deleteEntry } from '../lib/history.js';

const router = Router();

/** GET /api/history - list saved summaries (newest first). */
router.get('/', (req, res) => {
  res.json(listEntries());
});

/** GET /api/history/:id - fetch one summary. */
router.get('/:id', (req, res) => {
  const entry = getEntry(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Summary not found.' });
  res.json(entry);
});

/** DELETE /api/history/:id - remove a saved summary. */
router.delete('/:id', (req, res) => {
  const removed = deleteEntry(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Summary not found.' });
  res.json({ ok: true, id: req.params.id });
});

export default router;
