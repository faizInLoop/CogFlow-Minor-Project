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
];

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
  return ['lesson', 'v7', topic.trim().toLowerCase(), tier, angle || 'default'].join('|');
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
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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
    'about', 'basics', 'describe', 'explain', 'from', 'into', 'learn',
    'kind', 'kinds', 'overview', 'teach', 'that', 'this', 'type', 'types',
    'them', 'understand', 'what', 'with', 'work', 'works',
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
  if (body.length < 400) return false;
  if (/execution topology|universalcontroller|committed invariant|conceptual blueprint|lorem ipsum|as an ai/.test(body)) return false;
  const words = topicWords(topic);
  if (words.length === 0) return body.includes(topic.toLowerCase().slice(0, 12));
  const hits = words.filter((word) => topicWordForms(word)
    .some((form) => new RegExp(`\\b${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body)));
  return hits.length >= Math.min(2, words.length);
}

function proseOnly(text) {
  const cleaned = keepLesson(text);
  const codeAt = cleaned.search(/\n## Code\b/i);
  return (codeAt >= 0 ? cleaned.slice(0, codeAt) : cleaned).trim();
}

export function lessonIsReady(topic, text) {
  const body = proseOnly(text);
  if (!lessonIsOnTopic(topic, body)) return false;
  if (!/[.!?]"?\s*$/.test(body)) return false;
  if (/```/.test(body)) return false;
  const headings = body.split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#{2,6}\s/.test(line));
  if (headings.length !== REQUIRED_HEADINGS.length
    || !REQUIRED_HEADINGS.every((heading, index) => headings[index] === heading)) return false;
  for (let index = 0; index < REQUIRED_HEADINGS.length; index += 1) {
    const heading = REQUIRED_HEADINGS[index];
    const start = body.indexOf(heading);
    if (start < 0) return false;
    const next = index + 1 < REQUIRED_HEADINGS.length
      ? body.indexOf(REQUIRED_HEADINGS[index + 1], start + heading.length)
      : body.length;
    if (next < 0 || next - start < heading.length + 70) return false;
  }
  return true;
}

function canonicalLesson(text) {
  const sections = new Map(REQUIRED_HEADINGS.map((heading) => [heading, []]));
  const aliases = new Map([
    ['what it is', REQUIRED_HEADINGS[0]],
    ['definition', REQUIRED_HEADINGS[0]],
    ['overview', REQUIRED_HEADINGS[0]],
    ['how it works', REQUIRED_HEADINGS[0]],
    ['why it matters', REQUIRED_HEADINGS[1]],
    ['why this matters', REQUIRED_HEADINGS[1]],
    ['importance', REQUIRED_HEADINGS[1]],
    ['one example', REQUIRED_HEADINGS[2]],
    ['example', REQUIRED_HEADINGS[2]],
    ['worked example', REQUIRED_HEADINGS[2]],
    ['a common mistake', REQUIRED_HEADINGS[3]],
    ['common mistake', REQUIRED_HEADINGS[3]],
    ['common mistakes', REQUIRED_HEADINGS[3]],
    ['misconception', REQUIRED_HEADINGS[3]],
    ['pitfalls', REQUIRED_HEADINGS[3]],
  ]);
  let currentSection = null;

  for (const line of stripDiagrams(text).split('\n')) {
    const heading = line.trim().match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const label = heading[1].replace(/[*_`]/g, '').trim().toLowerCase().replace(/[:.]+$/, '');
      if (/^(check yourself|code|code example|key takeaways)$/.test(label)) {
        currentSection = null;
        continue;
      }
      currentSection = aliases.get(label) || null;
      continue;
    }
    if (currentSection) sections.get(currentSection).push(line);
  }

  return REQUIRED_HEADINGS
    .map((heading) => `${heading}\n${sections.get(heading).join('\n').trim()}`)
    .join('\n\n');
}

function keepLesson(text) {
  const cleaned = stripDiagrams(text);
  const start = cleaned.indexOf('## What it is');
  return (start >= 0 ? cleaned.slice(start) : cleaned).trim();
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
      content: 'You are a patient teacher. Treat the topic as the learner’s full request, not a bag of keywords. Preserve and answer its requested action: explain how, compare, describe why, or solve. For “how it works,” teach the actual mechanism in order, not just its name or definition. Use only standard facts; leave out uncertain details. Do not invent numbers, dates, people, or formulas. Check each example result against its steps. Be concise and do not repeat an explanation. Do not add meta commentary about the lesson. No diagrams, tables, questions, preambles, or extra sections. Finish every sentence.',
    },
    {
      role: 'user',
      content: `Subject: ${subject || 'General study'}
Topic: ${topic}
Depth: ${depth.label}
${angleNote(angle)}

Write ${depth.words}. Use exactly these four headings, in this order:
## What it is
## Why it matters
## One example
## A common mistake

Answer the exact request in "${topic}" rather than silently changing it to a broader topic. Under each heading, explain the idea in complete, connected sentences. Name the real parts, the action each part takes, and what changes as a result; do not rely on a slogan or analogy alone. Use only the four headings above, once each, with their exact spelling.

If the request asks how something works, walk through its mechanism in order. In the example, show a concrete starting state and up to three important actions, including what each action returns or changes and why. Choose a tiny, direct example that demonstrates the mechanism; avoid extra algorithms or arithmetic that are not needed. Make the example detailed enough that a learner could trace it themselves. If the request asks to solve a problem, show the reasoning steps before the conclusion. The common-mistake section must correct one plausible misconception about the topic without adding unrelated uses. If you give a wrong-result example, reuse the exact setup above and state its correct result; do not introduce a second example.
${exampleGuidance}

Do not ask a question. Stay on "${topic}". End the common-mistake section with a complete sentence.

If "${topic}" is a procedure a programmer writes, add this section after the mistake, with one fenced example of at most 12 lines that matches the note. Do not invent a library. If it is not a program, stop. Do not add code.
## Code`,
    },
  ];
}

function repairMessages(topic, draft) {
  return [
    {
      role: 'system',
      content: 'You are a careful teacher editing an incomplete study note. Preserve correct, relevant explanations, but fix factual errors and finish any cut-off idea. Do not copy a wrong example. Return only the finished lesson, with the exact requested headings and no commentary, diagrams, extra headings, or unfinished sentences.',
    },
    {
      role: 'user',
      content: `The learner asked: "${topic}"

Rewrite this draft as a complete explanation that answers the learner's request. Keep the example small and factually consistent. Explain the steps and their result; do not use a game board, diagram, or long list of hypothetical moves. Use these four headings exactly once and in this order:
## What it is
## Why it matters
## One example
## A common mistake

Use at least two explanatory sentences under each heading. Finish every sentence. Do not add a question or any other heading.

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
      let lesson = canonicalLesson(raw);

      if (!lessonIsReady(topic, lesson)) {
        const repaired = await collectFromProvider(
          provider,
          repairMessages(topic, raw),
          options,
        );
        lesson = canonicalLesson(repaired);
      }

      if (!lessonIsReady(topic, lesson)) {
        throw new Error('Generated lesson did not pass the topic and completeness checks.');
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
      options: { temperature: 0.2, num_predict: numPredict, num_ctx: 2048 },
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
    throw new Error(`Provider returned HTTP ${res.status}.`);
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
