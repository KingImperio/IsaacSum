import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the server/ directory. */
export const SERVER_ROOT = path.resolve(__dirname, '..');

/** Runtime data directory (history JSON store). */
export const DATA_DIR = path.join(SERVER_ROOT, 'data');

/** Temporary upload directory. */
export const UPLOAD_DIR = path.join(SERVER_ROOT, 'uploads');
