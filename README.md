# IsaacSum

PDF & docs summary tool for students. Upload a PDF, DOCX, TXT, or Markdown file (or paste text), choose your summary length/style, and get an AI-generated summary. Save history, copy, and export to Markdown or PDF.

## Features

- **Multi-format support** — Upload `.pdf`, `.docx`, `.txt`, or `.md` files, or just paste text.
- **Configurable summaries** — Choose length (`concise`, `balanced`, `detailed`) and format (`bullet points`, `paragraphs`).
- **AI-powered or offline** — Use Anthropic (Claude) or OpenAI (GPT) via API keys, or run in `mock` mode with an offline extractive summarizer for testing.
- **History** — Every summary is saved locally (newest first) with preview, source info, and options.
- **Export** — Copy to clipboard, download as `.md`, or export as a clean `.pdf`.
- **Single-server deployment** — The Express server can serve the built React app.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Extraction:** `pdf-parse` (PDF), `mammoth` (DOCX)
- **PDF Export:** `pdfkit`
- **Storage:** Local JSON file (`server/data/history.json`)

## Quick Start

### 1) Install dependencies

From the repo root:

```bash
npm run setup
# or: npm --prefix server install && npm --prefix client install
```

### 2) Configure environment

Copy the example env and add your API key if using a real provider:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=8787
# anthropic | openai | mock
AI_PROVIDER=anthropic

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

For offline/local testing with no API key, set `AI_PROVIDER=mock`.

### 3) Run in development

Run server and client in separate terminals:

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

- Client: http://localhost:5173 (proxies `/api` to the server)
- Server: http://localhost:8787

### 4) Build & run (production)

```bash
npm run build
npm start
```

Then open http://localhost:8787.

## Scripts

| Script | Description |
| --- | --- |
| `npm run setup` | Install server and client dependencies |
| `npm run dev:server` | Start Express API with nodemon |
| `npm run dev:client` | Start Vite dev server |
| `npm run build` | Build React app to `client/dist` |
| `npm start` | Run Express server (serves API + built client) |
| `npm run test:files` | Generate sample PDF/TXT in `server/testdata/` |
| `npm run test:smoke` | Smoke test the API using mock provider |

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check + current provider |
| `POST` | `/api/summarize` | Summarize file upload (`file`) or pasted text (`text`). Body/options as multipart or JSON. |
| `GET` | `/api/history` | List saved summaries (newest first, with previews) |
| `GET` | `/api/history/:id` | Get full summary entry |
| `DELETE` | `/api/history/:id` | Delete a history entry |
| `POST` | `/api/export/pdf` | Export `{ title, content }` as a downloadable PDF |

## Project Structure

```text
IsaacSum/
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── components/    # OptionsBar, SummaryCard, HistoryPanel
│   │   ├── api.js         # API client helpers
│   │   ├── App.jsx
│   │   └── styles.css
│   └── vite.config.js
├── server/                # Express backend
│   ├── scripts/           # Dev/test utilities
│   ├── src/
│   │   ├── lib/           # extractText, summarize, history, paths
│   │   ├── routes/        # summarize, history, export
│   │   ├── app.js
│   │   └── index.js
│   ├── data/              # history.json (gitignored)
│   └── uploads/           # temp uploads (gitignored)
└── package.json           # Root scripts
```

## Notes & Tips

- **Large documents:** Text is trimmed to ~100,000 chars before summarization to keep requests reasonable.
- **Scanned PDFs:** Text extraction works best with text-based PDFs. Image-only (scanned) PDFs won't yield much text.
- **Model availability:** Anthropic/OpenAI model names change over time. If you get a model error, check your provider's docs and update `ANTHROPIC_MODEL`/`OPENAI_MODEL`.
- **Data is local:** History lives in `server/data/history.json` on disk. No external database required.

## License

MIT
