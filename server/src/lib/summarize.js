/**
 * Summarization engine.
 *
 * Providers (selected with AI_PROVIDER):
 *   - anthropic : Claude via the Anthropic Messages API
 *   - openai    : GPT via the OpenAI Chat Completions API
 *   - mock      : offline extractive summarizer (no API key; for local testing)
 */

const SYSTEM_PROMPT = `You are IsaacSum, a summarization assistant built for students. You produce accurate, well-structured summaries of source documents. Rules:
- Never invent facts, numbers, or claims that are not in the source document.
- Highlight key definitions, formulas, dates, people, and the main arguments.
- Favor clarity over completeness; the reader is a student studying the material.
- Always start with a one-line TL;DR.`;

const LENGTHS = {
  concise: 'Summarize in roughly 120-180 words.',
  balanced: 'Summarize in roughly 250-350 words.',
  detailed: 'Summarize in roughly 450-600 words, covering every major section of the document.',
};

const FORMATS = {
  bullets: 'Use a short heading, then bullet points grouped under bold sub-headings where helpful.',
  paragraphs: 'Write flowing paragraphs with clear transitions.',
};

export const OPTION_DEFAULTS = { length: 'balanced', format: 'bullets' };

/** Build the user prompt sent to the model. */
export function buildUserPrompt(text, options = {}) {
  return `${LENGTHS[options.length] || LENGTHS.balanced}
${FORMATS[options.format] || FORMATS.bullets}

<document>
${text}
</document>

Return only the summary itself, with no preamble.`;
}

/** Summarize `text` with the configured provider. */
export async function summarizeText(text, options = {}, config = {}) {
  const provider = (config.provider || process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const userPrompt = buildUserPrompt(text, options);

  switch (provider) {
    case 'anthropic':
      return callAnthropic(userPrompt, options);
    case 'openai':
      return callOpenAI(userPrompt, options);
    case 'mock':
      return extractiveSummary(text, options);
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}". Use "anthropic", "openai", or "mock".`);
  }
}

async function callAnthropic(userPrompt, options) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to server/.env, or set AI_PROVIDER=mock to test offline.'
    );
  }

  const maxTokens =
    options.length === 'detailed' ? 1200 : options.length === 'concise' ? 500 : 800;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body.slice(0, 400)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('Anthropic returned an empty summary.');
  return text;
}

async function callOpenAI(userPrompt, options) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to server/.env, or set AI_PROVIDER=mock to test offline.'
    );
  }

  const maxTokens =
    options.length === 'detailed' ? 1200 : options.length === 'concise' ? 500 : 800;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body.slice(0, 400)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim?.() || '';
  if (!text) throw new Error('OpenAI returned an empty summary.');
  return text;
}

/* ------------------------------------------------------------------ */
/* Offline extractive summarizer (mock provider / dev tool)            */
/* ------------------------------------------------------------------ */

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'they', 'would',
  'there', 'their', 'which', 'were', 'been', 'when', 'what', 'also', 'into',
  'such', 'some', 'than', 'then', 'them', 'these', 'those', 'over', 'more',
  'most', 'other', 'using', 'used', 'each', 'many', 'much', 'will', 'your',
  'about', 'because', 'after', 'before', 'between', 'during', 'while', 'where',
]);

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

/**
 * Simple frequency-based extractive summarizer: picks the highest-scoring
 * sentences (scored by shared important-word frequency) and returns them in
 * their original order. Intended for offline testing, not production quality.
 */
export function extractiveSummary(text, options = {}) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 'No text found to summarize.';

  const target =
    options.length === 'concise' ? 5 : options.length === 'detailed' ? 12 : 8;

  const freq = Object.create(null);
  for (const sentence of sentences) {
    for (const word of tokenize(sentence)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  const scored = sentences.map((sentence, index) => ({
    index,
    sentence,
    score: scoreSentence(sentence, freq) / Math.sqrt(tokenize(sentence).length + 1),
  }));

  scored.sort((a, b) => b.score - a.score);
  const picked = scored
    .slice(0, Math.min(target, scored.length))
    .sort((a, b) => a.index - b.index);

  if (options.format === 'paragraphs') {
    return ['**TL;DR**', 'Offline extractive summary (mock provider).', '', picked.map((p) => p.sentence).join(' ')].join('\n');
  }
  return ['**TL;DR** — offline extractive summary (mock provider).', '', ...picked.map((p) => `- ${p.sentence}`)].join('\n');
}

function tokenize(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

function scoreSentence(sentence, freq) {
  return tokenize(sentence).reduce((sum, word) => sum + (freq[word] || 0), 0);
}
