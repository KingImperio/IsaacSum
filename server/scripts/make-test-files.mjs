#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'testdata');
fs.mkdirSync(outDir, { recursive: true });

const text = `Photosynthesis

Photosynthesis is the process by which green plants, algae, and some bacteria use sunlight to synthesize foods with the help of chlorophyll. It takes place in the chloroplasts, primarily in the leaves of plants.

Equation (simplified): 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2

Stages:
1. Light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH.
2. Light-independent reactions (Calvin Cycle) occur in the stroma and use ATP/NADPH to fix CO2 into glucose.

Factors affecting rate: light intensity, carbon dioxide concentration, temperature, and water availability.

Importance: Photosynthesis produces oxygen for aerobic life and forms the base of most food chains.`;

// Write TXT
fs.writeFileSync(path.join(outDir, 'photosynthesis.txt'), text);

// Write PDF
const pdfPath = path.join(outDir, 'photosynthesis.pdf');
const doc = new PDFDocument({ margin: 56 });
const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);
doc.fontSize(18).text('Photosynthesis');
doc.moveDown();
doc.fontSize(11).text(text, { lineGap: 2 });
doc.end();
await new Promise((r) => stream.on('finish', r));

console.log('Created test files in server/testdata/:');
console.log(' - photosynthesis.txt');
console.log(' - photosynthesis.pdf');
console.log('\nNote: .DOCX files are harder to generate; mammoth can read any valid .docx.');
