import { Router } from 'express';
import multer from 'multer';

import { extractText, isSupported } from '../lib/extractText.js';
import { summarizeText, OPTION_DEFAULTS } from '../lib/summarize.js';
import { addEntry } from '../lib/history.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (isSupported(file.originalname)) return cb(null, true);
    cb(new Error('Unsupported file type. Allowed: .pdf, .docx, .txt, .md'));
  },
});

const MAX_TEXT_CHARS = 100_000; // keep request payloads sane

function parseOptions(input) {
  if (!input) return { ...OPTION_DEFAULTS };
  if (typeof input === 'object') return { ...OPTION_DEFAULTS, ...input };
  try {
    return { ...OPTION_DEFAULTS, ...(JSON.parse(String(input)) || {}) };
  } catch {
    throw new Error('Invalid options JSON.');
  }
}

/**
 * POST /api/summarize
 * Accepts multipart/form-data (file/text/options) or application/json (text/options).
 */
router.post('/', (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return upload.single('file')(req, res, next);
  }
  next();
}, async (req, res) => {
  try {
    let text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    let source = null;

    if (req.file) {
      source = { filename: req.file.originalname, size: req.file.size };
      text = await extractText(req.file.buffer, extnameOf(req.file.originalname));
      if (!text) {
        return res.status(422).json({
          error: `Could not extract any text from "${req.file.originalname}". The file may be scanned images or empty.`,
        });
      }
    }

    if (!text) {
      return res.status(400).json({
        error: 'Nothing to summarize. Upload a PDF/DOCX/TXT file or paste some text.',
      });
    }

    let options;
    try {
      options = parseOptions(req.body.options);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);

    const summary = await summarizeText(text, options);
    const entry = addEntry({ source, options, summary });
    res.json(entry);
  } catch (err) {
    const status = err instanceof multer.MulterError ? 400 : 500;
    res.status(status).json({ error: err.message || 'Summarization failed.' });
  }
});

function extnameOf(filename) {
  const dot = String(filename).lastIndexOf('.');
  return dot === -1 ? '' : String(filename).slice(dot).toLowerCase();
}

export default router;
