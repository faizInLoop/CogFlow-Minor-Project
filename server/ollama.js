/**
 * Local lesson writer. Ollama must already be running on this machine.
 * Lessons are cached so the same topic is not generated twice.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
for (const envPath of [path.join(projectRoot, '.env'), path.join(__dirname, '.env')]) {
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
}

const HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const cachePath = path.join(__dirname, 'data', 'lesson-cache.json');

const DEPTH = {
  tier1: {
    label: 'the easiest true explanation, in short sentences',
    words: '160 to 220 words',
    predict: 480,
  },
  tier3: {
    label: 'a clear explanation in plain words',
    words: '220 to 280 words',
    predict: 720,
  },
  tier5: {
    label: 'a precise explanation in plain words, with one real limit',
    words: '260 to 320 words',
    predict: 820,
  },
};

const REQUIRED_HEADINGS = [
  '## What it is',
  '## Why it matters',
  '## One example',
  '## A common mistake',
  '## Check yourself',
];
const OPTIONAL_CODE_HEADING = '## Code';

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(cache));
}

export function cachedLesson(key) {
  return readCache()[key] || null;
}

export function storeLesson(key, value) {
  const cache = readCache();
  cache[key] = value;
  writeCache(cache);
}

export function lessonKey({ topic, tier, angle }) {
  return ['lesson', 'v8', topic.trim().toLowerCase(), tier, angle || 'default'].join('|');
}

export function quizKey({ topic, tier, lesson }) {
  const anchor = (lesson || '').replace(/\s+/g, ' ').slice(0, 180).toLowerCase();
  return ['quiz', 'v2', topic.trim().toLowerCase(), tier, anchor].join('|');
}

export async function ollamaStatus() {
  try {
    const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { online: false, model: MODEL, providers: configuredProviderNames() };
    const body = await res.json();
    const names = (body.models || []).map((item) => item.name);
    return {
      online: true,
      model: MODEL,
      installed: names.includes(MODEL),
      models: names,
      providers: configuredProviderNames(),
    };
  } catch {
    return { online: false, model: MODEL, installed: false, models: [], providers: configuredProviderNames() };
  }
}

function providerConfigs() {
  const providers = [{
    name: 'Ollama',
    kind: 'ollama',
    endpoint: `${HOST}/api/chat`,
    model: MODEL,
  }];
  const groqKeys = [
    ...(process.env.GROQ_API_KEYS || '').split(','),
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
  ].map((key) => key?.trim()).filter(Boolean);

  for (const [index, key] of [...new Set(groqKeys)].entries()) {
    providers.push({
      name: `Groq key ${index + 1}`,
      kind: 'openai-compatible',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      key,
    });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
  if (openRouterKey?.trim()) {
    providers.push({
      name: 'OpenRouter',
      kind: 'openai-compatible',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: process.env.OPENROUTER_MODEL || 'openrouter/auto',
      key: openRouterKey.trim(),
    });
  }

  return providers;
}

export function configuredProviderNames() {
  return providerConfigs().map((provider) => provider.name);
}

function topicWords(topic) {
  const fillerWords = new Set([
    'about', 'after', 'again', 'also', 'although', 'among', 'and', 'any',
    'are', 'because', 'been', 'before', 'being', 'between', 'both', 'could',
    'describe', 'does', 'doing', 'down', 'each', 'explain', 'explained',
    'explaining', 'find', 'first', 'for', 'from', 'give', 'given', 'gives',
    'giving', 'have', 'having', 'help', 'helps', 'how', 'into', 'its', 'kind',
    'kinds', 'learn', 'make', 'makes', 'making', 'many', 'more', 'most',
    'much', 'need', 'needs', 'only', 'other', 'over', 'overview', 'same',
    'some', 'such', 'teach', 'than', 'that', 'their', 'them', 'then',
    'there', 'these', 'they', 'thing', 'things', 'this', 'those', 'through',
    'type', 'types', 'under', 'understand', 'uses', 'using', 'very', 'want',
    'what', 'when', 'where', 'which', 'while', 'with', 'work', 'works',
    'would', 'your', 'basics',
  ]);
  return (topic.toLowerCase().match(/[a-z0-9]{4,}/g) || []).filter((word) => !fillerWords.has(word));
}

function topicWordForms(word) {
  const forms = new Set([word]);
  if (word.endsWith('ies') && word.length > 4) forms.add(`${word.slice(0, -3)}y`);
  if (/(?:ches|shes|xes|zes|ses)$/.test(word) && word.length > 5) forms.add(word.slice(0, -2));
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 4) forms.add(word.slice(0, -1));
  return [...forms];
}

export function lessonIsOnTopic(topic, text) {
  const body = (text || '').toLowerCase();
  if (/lorem ipsum|as an ai language model|as an ai assistant/.test(body)) return false;
  const words = topicWords(topic);
  if (words.length === 0) return true;
  const hits = words.filter((word) => topicWordForms(word)
    .some((form) => new RegExp(`\\b${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body)));
  return hits.length >= Math.min(2, words.length);
}

function lessonSentences(text) {
  return text.split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').trim())
    .filter(Boolean)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function normalizedLessonText(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function hasLessonPlaceholder(text) {
  return /lorem ipsum|as an ai language model|as an ai assistant|\bTODO\b|insert (?:topic|example|content)|placeholder/i.test(text);
}

function lessonParts(text) {
  const cleaned = stripDiagrams(text);
  const withoutCodeBlocks = cleaned.replace(/```[\s\S]*?```/g, '');
  const headings = withoutCodeBlocks.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^#{1,6}\s/.test(line));
  const codeHeadingAt = cleaned.search(/^## Code\s*$/m);
  const prose = (codeHeadingAt >= 0 ? cleaned.slice(0, codeHeadingAt) : cleaned).trim();
  const sections = new Map(REQUIRED_HEADINGS.map((heading) => [heading, '']));
  const lines = prose.split(/\r?\n/);
  let currentHeading = null;
  for (const line of lines) {
    const heading = line.trim();
    if (sections.has(heading)) {
      currentHeading = heading;
      continue;
    }
    if (currentHeading) sections.set(currentHeading, `${sections.get(currentHeading)}\n${line}`);
  }
  return { cleaned, withoutCodeBlocks, headings, prose, sections };
}

export function lessonValidationError(topic, text) {
  const { cleaned, withoutCodeBlocks, headings, prose, sections } = lessonParts(text);
  if (!prose) return 'Lesson is empty.';
  if (/^#{3,6}\s/m.test(withoutCodeBlocks)) return 'Use only level-two headings (##).';
  const expectedHeadings = [...REQUIRED_HEADINGS];
  if (headings.includes(OPTIONAL_CODE_HEADING)) expectedHeadings.push(OPTIONAL_CODE_HEADING);
  if (headings.length !== expectedHeadings.length
    || !expectedHeadings.every((heading, index) => headings[index] === heading)) {
    return 'Required lesson headings are missing, duplicated, or out of order.';
  }

  const firstHeadingAt = prose.search(/^## /m);
  if (firstHeadingAt < 0 || prose.slice(0, firstHeadingAt).trim()) return 'Lesson must start with its first heading.';
  if (!lessonIsOnTopic(topic, prose)) return 'Lesson does not mention the requested topic.';
  if (hasLessonPlaceholder(prose)) return 'Lesson contains placeholder or model-introduction text.';

  const topicKey = normalizedLessonText(topic);
  const topicTerms = topicWords(topic).map(normalizedLessonText);
  const seenSentences = new Set();
  for (const heading of REQUIRED_HEADINGS) {
    const sentences = lessonSentences(sections.get(heading));
    const bulletLines = sections.get(heading).split(/\r?\n/)
      .map((line) => line.trim().match(/^[-*+]\s+(.+)$/)?.[1])
      .filter(Boolean)
      .map(normalizedLessonText);
    if (bulletLines.some((line) => line === topicKey || (topicTerms.length === 1 && line === topicTerms[0]))) {
      return 'Lesson repeats the topic title as a bullet.';
    }
    if (sentences.length < 2 || sentences.length > 4) {
      return `${heading.slice(3)} must contain 2–4 complete sentences (found ${sentences.length}).`;
    }

    for (const sentence of sentences) {
      const key = normalizedLessonText(sentence);
      const wordCount = sentence.match(/\b[\p{L}\p{N}'-]+\b/gu)?.length || 0;
      if (wordCount > 35) return `${heading.slice(3)} contains a sentence longer than 35 words.`;
      if (!/[.!?]["')\]]?$/.test(sentence)) return `${heading.slice(3)} contains an unfinished sentence.`;
      if (key === topicKey || seenSentences.has(key)) return 'Lesson repeats its topic title or a sentence.';
      seenSentences.add(key);
    }
  }

  const checkQuestions = lessonSentences(sections.get('## Check yourself'));
  if (checkQuestions.length < 2 || checkQuestions.length > 4
    || checkQuestions.some((sentence) => !/\?$/.test(sentence))) {
    return 'Check yourself must contain 2–4 answerable questions.';
  }

  const codeAt = cleaned.search(/^## Code\s*$/m);
  if (codeAt >= 0) {
    const code = cleaned.slice(codeAt).replace(/^## Code\s*/m, '').trim();
    const block = code.match(/```[^\n]*\n([\s\S]*?)```/);
    if (!block || block[1].split(/\r?\n/).length > 12) {
      return 'Code must contain one fenced example of at most 12 lines.';
    }
  }
  return null;
}

export function lessonIsReady(topic, text) {
  return lessonValidationError(topic, text) === null;
}

function mustTryNextProvider(validationError) {
  return /level-two headings|does not mention the requested topic|placeholder|repeats its topic title|repeats the topic title as a bullet|repeats a sentence/i
    .test(validationError || '');
}

export function stripDiagrams(text) {
  return (text || '')
    .replace(/```text[\s\S]*?```/gi, '')
    .split('\n')
    .filter((line) => (line.match(/[┌┐└┘│─├┤┬┴┼╔╗╚╝║═]/g) || []).length < 2)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function angleNote(angle) {
  if (angle === 'visual_metaphor') return 'In the example, use one everyday comparison. Keep it in prose.';
  if (angle === 'production_failure') return 'The common-mistake section should name one real misunderstanding of this topic.';
  if (angle === 'code_deepdive') return 'Do not add code. Explain the mechanism in words.';
  return 'The example must be one real case of this topic.';
}

export function lessonMessages({ subject, topic, tier, angle }) {
  const depth = DEPTH[tier] || DEPTH.tier3;
  const exampleGuidance = /\b(?:stack|stacks|lifo)\b/i.test(topic)
    ? 'For this stack topic, demonstrate the data structure directly: start empty, push 5, push 10, then pop. State that pop returns 10 and leaves [5]. Do not use a function-call stack as the only example or claim that a stack operation pushes the entire program state.'
    : /\bminimax\b/i.test(topic)
      ? 'For minimax, show a tiny game-tree calculation with terminal scores: a MIN node chooses the smaller child score, then a MAX node chooses the larger backed-up score. Do not invent a sequence of tic-tac-toe moves or draw a board.'
    : '';
  return [
    {
      role: 'system',
      content: 'You are a patient teacher. Treat the topic as the learner’s full request, not a bag of keywords. Preserve the requested action: explain how, compare, describe why, or solve. For “how it works,” teach the actual mechanism in order, not just its name or definition. Use standard facts, avoid uncertain details, and check examples against their steps. Every sentence adds new information. Return only the lesson with no diagrams, tables, preamble, or meta commentary.',
    },
    {
      role: 'user',
      content: `Subject: ${subject || 'General study'}
Topic: ${topic}
Depth: ${depth.label}
${angleNote(angle)}

Write ${depth.words}. Start with exactly these five headings, in this order:
## What it is
## Why it matters
## One example
## A common mistake
## Check yourself

Answer the exact request in "${topic}" rather than changing it to a broader topic. Under each of the first four headings, write exactly two distinct, short, complete sentences, each no longer than 35 words, and put them on separate lines. Under Check yourself, write exactly two concise questions answerable from this explanation, one per line. The lesson must have ten prose sentences before optional code; do not leave a section with only one sentence.

Name the real parts, the action each part takes, and what changes as a result; do not rely on a slogan or analogy alone. Use only the five headings above, once each, with their exact spelling. Do not use any heading deeper than ##, repeat a sentence or the topic title as a sentence or bullet, or include placeholder text.

If the request asks how something works, walk through its mechanism in order. In the example, show a concrete starting state and up to three important actions, including what each action returns or changes and why. Choose a tiny, direct example that demonstrates the mechanism; avoid extra algorithms or arithmetic that are not needed. If the request asks to solve a problem, show the reasoning steps before the conclusion. The common-mistake section must correct one plausible misconception about the topic without adding unrelated uses. If you give a wrong-result example, reuse the exact setup above and state its correct result; do not introduce a second example.
${exampleGuidance}

Stay on "${topic}". End every sentence and section completely.

Only when "${topic}" is a procedure a programmer writes, add a final ## Code section with one fenced example of at most 12 lines that matches the note. Do not invent a library. Otherwise omit the Code heading. Every heading line must start with exactly two # characters; a ### heading is invalid.`,
    },
  ];
}

function repairMessages(topic, draft, validationError) {
  return [
    {
      role: 'system',
      content: 'You are a careful teacher. Discard the draft structure and repeated text; rewrite the lesson from scratch in the requested format. Do not quote the draft, answer its check questions, or add any material after the lesson.',
    },
    {
      role: 'user',
      content: `The learner asked: "${topic}"
The previous draft failed validation: ${validationError}

Rewrite this draft from scratch to answer the learner's exact request. Treat it only as a source of facts, not as a format to copy. Keep one small, factually consistent example. Use exactly these five headings once, in this order:
## What it is
## Why it matters
## One example
## A common mistake
## Check yourself

Write exactly two distinct complete sentences under each of the first four headings, each no longer than 35 words and on its own line. Write exactly two short answerable questions under Check yourself, one per line. Do not leave a section with only one sentence, repeat sentences or the topic title, add any other heading, use a heading deeper than ##, or write answers after the questions.

Draft to repair:
${draft}`,
    },
  ];
}

export async function writeCheckedLesson({ subject, topic, tier, angle, signal }) {
  const key = lessonKey({ topic, tier, angle });
  const saved = cachedLesson(key);
  if (saved && lessonIsReady(topic, saved)) return { content: saved, provider: 'Cache' };

  const depth = DEPTH[tier] || DEPTH.tier3;
  const providers = providerConfigs();
  const failures = [];

  for (const provider of providers) {
    try {
      const options = { numPredict: depth.predict, signal };
      const raw = await collectFromProvider(
        provider,
        lessonMessages({ subject, topic, tier, angle }),
        options,
      );
      let lesson = stripDiagrams(raw);
      let validationError = lessonValidationError(topic, lesson);

      if (validationError) {
        if (mustTryNextProvider(validationError)) throw new Error(validationError);
        const repaired = await collectFromProvider(
          provider,
          repairMessages(topic, raw, validationError),
          options,
        );
        lesson = stripDiagrams(repaired);
        validationError = lessonValidationError(topic, lesson);
      }

      if (validationError) {
        throw new Error(validationError);
      }

      storeLesson(key, lesson);
      return { content: lesson, provider: provider.name };
    } catch (error) {
      if (signal?.aborted) throw error;
      const detail = error instanceof Error ? error.message : 'Unknown provider failure.';
      failures.push(`${provider.name}: ${detail}`);
      console.warn(`[AI] ${provider.name} could not prepare “${topic}”: ${detail}`);
    }
  }

  const cloudConfigured = providers.length > 1;
  const recovery = cloudConfigured
    ? 'All configured lesson providers failed.'
    : 'Only local Ollama is configured. Add GROQ_API_KEY, GROQ_API_KEY_2, or OPENROUTER_API_KEY to the project .env file to enable cloud fallbacks.';
  const error = new Error(`${recovery} ${failures.join(' ')}`);
  error.code = 'AI_PROVIDERS_FAILED';
  throw error;
}

async function* streamProviderChat(provider, messages, { numPredict = 420, signal } = {}) {
  const local = provider.kind === 'ollama';
  const headers = { 'Content-Type': 'application/json' };
  if (!local) headers.Authorization = `Bearer ${provider.key}`;

  const body = local
    ? {
      model: provider.model,
      stream: true,
      keep_alive: '30m',
      options: {
        temperature: 0.2,
        repeat_penalty: 1.15,
        repeat_last_n: 128,
        num_predict: numPredict,
        num_ctx: 2048,
      },
      messages,
    }
    : {
      model: provider.model,
      stream: true,
      temperature: 0.2,
      max_tokens: numPredict,
      messages,
    };

  const res = await fetch(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    if (local) {
      const detail = await res.text();
      throw new Error(detail.slice(0, 180) || `Ollama returned ${res.status}`);
    }
    let detail = '';
    try {
      const body = await res.json();
      detail = body.error?.message || '';
    } catch {
      detail = '';
    }
    throw new Error(detail ? `Provider returned HTTP ${res.status}: ${detail}` : `Provider returned HTTP ${res.status}.`);
  }
  if (!res.body) throw new Error('Provider returned an empty response stream.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      pending += decoder.decode();
      if (pending.trim()) yield* parseProviderLine(pending, local);
      break;
    }
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() || '';
    for (const line of lines) {
      yield* parseProviderLine(line, local);
    }
  }
}

function* parseProviderLine(line, local) {
  const trimmed = line.trim();
  if (!trimmed) return;

  if (local) {
    const message = JSON.parse(trimmed);
    if (message.error) throw new Error(message.error);
    const content = message.message?.content || '';
    if (content) yield content;
    return;
  }

  if (!trimmed.startsWith('data:')) return;
  const data = trimmed.slice(5).trim();
  if (!data || data === '[DONE]') return;
  const message = JSON.parse(data);
  const content = message.choices?.[0]?.delta?.content;
  if (typeof content === 'string' && content) yield content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text) yield part.text;
    }
  }
}

async function collectFromProvider(provider, messages, options) {
  let text = '';
  for await (const piece of streamProviderChat(provider, messages, options)) text += piece;
  if (!text.trim()) throw new Error('Provider returned no lesson text.');
  return text;
}

export async function* streamChat(messages, options = {}) {
  const errors = [];
  for (const provider of providerConfigs()) {
    try {
      const pieces = [];
      for await (const piece of streamProviderChat(provider, messages, options)) {
        pieces.push(piece);
      }
      if (pieces.length === 0) throw new Error('Provider returned no response text.');
      yield* pieces;
      return;
    } catch (error) {
      if (options.signal?.aborted) throw error;
      const detail = error instanceof Error ? error.message : 'Unknown provider failure.';
      errors.push(`${provider.name}: ${detail}`);
      console.warn(`[AI] ${provider.name} request failed: ${detail}`);
    }
  }
  throw new Error(`All configured AI providers failed. ${errors.join(' ')}`);
}

export async function collectChat(messages, options) {
  let text = '';
  for await (const piece of streamChat(messages, options)) text += piece;
  return text;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(raw);
}

export async function writeQuiz({ topic, tier, lesson, signal }) {
  const source = (lesson || '').trim();
  if (source.length < 400) throw new Error('Questions are written from the checked lesson, so they wait until that lesson is ready.');
  const key = quizKey({ topic, tier, lesson: source });
  const saved = cachedLesson(key);
  if (saved) return saved;

  const depth = tier === 'tier1' ? 'beginner' : tier === 'tier5' ? 'advanced' : 'standard';
  const excerpt = source.slice(0, 3500);
  const text = await collectChat([
    {
      role: 'system',
      content: 'You write fair questions using only the supplied lesson. Do not add facts that are not in the lesson. Return only JSON.',
    },
    {
      role: 'user',
      content: `Topic: ${topic}
Level: ${depth}

Lesson:
${excerpt}

Write exactly 3 questions that a student can answer from this lesson. Each wrong option must be a plausible mistake about the same topic. Mark only one correct option.

{"mcqs":[{"question":"","options":["","","",""],"correctIndex":0,"explanation":"Use one fact from the lesson to say why the correct option is right."}],"typingPrompt":{"question":"Explain ${topic} in your own words, using the example from the lesson.","rubricKeywords":["example"]}}`,
    },
  ], { numPredict: 900, signal });

  let quiz = normalizeQuiz(topic, extractJson(text));
  const checked = await collectChat([
    {
      role: 'system',
      content: 'You check study questions. Fix a wrong answer key. Delete a question you cannot verify from the lesson. Return only JSON in the same shape.',
    },
    {
      role: 'user',
      content: `Lesson:\n${excerpt}\n\nQuestions:\n${JSON.stringify(quiz)}\n\nReturn the corrected JSON. Every explanation must match the marked option and the lesson.`,
    },
  ], { numPredict: 900, signal });
  quiz = normalizeQuiz(topic, extractJson(checked));
  if (quiz.mcqs.length < 3) throw new Error('The questions could not be checked against the lesson, so they were not shown.');
  storeLesson(key, quiz);
  return quiz;
}

function normalizeQuiz(topic, parsed) {
  const mcqs = (parsed.mcqs || []).slice(0, 3).map((item, index) => ({
    id: `q${index + 1}`,
    question: String(item.question || '').trim(),
    options: (item.options || []).slice(0, 4).map((option) => String(option).trim()),
    correctIndex: Number(item.correctIndex),
    explanation: String(item.explanation || '').trim(),
  })).filter((item) => (
    item.question.length > 20
    && item.options.length === 4
    && item.options.every((option) => option.length > 2)
    && Number.isInteger(item.correctIndex)
    && item.correctIndex >= 0
    && item.correctIndex <= 3
    && item.explanation.length > 20
  ));
  return {
    mcqs,
    typingPrompt: {
      question: String(parsed.typingPrompt?.question || '').trim() || `Explain ${topic} in your own words and use one example from the lesson.`,
      rubricKeywords: Array.isArray(parsed.typingPrompt?.rubricKeywords)
        ? parsed.typingPrompt.rubricKeywords.map((item) => String(item)).slice(0, 5)
        : topicWords(topic).slice(0, 4),
    },
  };
}

export async function gradeAnswer({ topic, question, studentAnswer, lesson, signal }) {
  const source = (lesson || '').trim().slice(0, 3500);
  if (source.length < 400) {
    throw new Error('The lesson is not ready, so this answer cannot be checked yet.');
  }
  const text = await collectChat([
    {
      role: 'system',
      content: 'You check a student answer against one lesson. Do not add outside facts. Do not praise an answer that misses the lesson or contradicts it. If you are unsure, say what is missing instead of inventing a score explanation. Return only JSON.',
    },
    {
      role: 'user',
      content: `Topic: ${topic}
Question: ${question}
Lesson: ${source}
Student answer: ${studentAnswer}

Return JSON:
{"score":70,"verdict":"Partially Proficient","strengths":"","missing_or_misunderstood":[""],"constructive_feedback":""}

score is an integer from 0 to 100. verdict is one of: Needs Review, Partially Proficient, Proficient, Mastery.
The feedback must refer to this lesson and this answer.`,
    },
  ], { numPredict: 360, signal });

  const parsed = extractJson(text);
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
  if (!Number.isFinite(score)) throw new Error('The answer could not be checked.');
  const missing = Array.isArray(parsed.missing_or_misunderstood)
    ? parsed.missing_or_misunderstood.map((item) => String(item)).filter(Boolean).slice(0, 4)
    : [];
  const feedback = String(parsed.constructive_feedback || '').trim();
  if (!feedback) throw new Error('The answer could not be checked.');
  return {
    status: 'success',
    evaluator: 'lesson-check',
    score,
    verdict: ['Needs Review', 'Partially Proficient', 'Proficient', 'Mastery'].includes(parsed.verdict)
      ? parsed.verdict
      : (score >= 85 ? 'Mastery' : score >= 70 ? 'Proficient' : score >= 55 ? 'Partially Proficient' : 'Needs Review'),
    strengths: String(parsed.strengths || '').trim(),
    key_points_covered: [],
    missing_or_misunderstood: missing,
    constructive_feedback: feedback,
  };
}

export function predictFor(tier) {
  return (DEPTH[tier] || DEPTH.tier3).predict;
}
