import path from 'node:path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

export function isSupported(filename) {
  return SUPPORTED_EXTENSIONS.includes(path.extname(String(filename)).toLowerCase());
}

/** Extract plain text from a document buffer. */
export async function extractText(buffer, ext) {
  switch (String(ext).toLowerCase()) {
    case '.pdf': {
      const data = await pdfParse(buffer);
      return clean(data.text);
    }
    case '.docx': {
      const { value } = await mammoth.extractRawText({ buffer });
      return clean(value);
    }
    case '.txt':
    case '.md':
      return clean(buffer.toString('utf8'));
    default:
      throw new Error(
        `Unsupported file type "${ext}". Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`
      );
  }
}

function clean(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
