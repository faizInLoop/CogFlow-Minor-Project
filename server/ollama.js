/**
 * Local lesson writer. Ollama must already be running on this machine.
 * Lessons are cached so the same topic is not generated twice.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
const cachePath = path.join(__dirname, 'data', 'lesson-cache.json');

const DEPTH = {
  tier1: {
    label: 'the easiest true explanation, in short sentences',
    words: '160 to 220 words',
    predict: 340,
  },
  tier3: {
    label: 'a clear explanation in plain words',
    words: '200 to 260 words',
    predict: 400,
  },
  tier5: {
    label: 'a precise explanation in plain words, with one real limit',
    words: '220 to 280 words',
    predict: 440,
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
  return ['lesson', 'v3', topic.trim().toLowerCase(), tier, angle || 'default'].join('|');
}

export function quizKey({ topic, tier, lesson }) {
  const anchor = (lesson || '').replace(/\s+/g, ' ').slice(0, 180).toLowerCase();
  return ['quiz', 'v2', topic.trim().toLowerCase(), tier, anchor].join('|');
}

export async function ollamaStatus() {
  try {
    const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { online: false, model: MODEL };
    const body = await res.json();
    const names = (body.models || []).map((item) => item.name);
    return { online: true, model: MODEL, installed: names.includes(MODEL), models: names };
  } catch {
    return { online: false, model: MODEL, installed: false, models: [] };
  }
}

function topicWords(topic) {
  return (topic.toLowerCase().match(/[a-z0-9]{4,}/g) || []).filter((word) => !['with', 'from', 'this', 'that', 'into'].includes(word));
}

export function lessonIsOnTopic(topic, text) {
  const body = (text || '').toLowerCase();
  if (body.length < 400) return false;
  if (/execution topology|universalcontroller|committed invariant|conceptual blueprint|lorem ipsum|as an ai/.test(body)) return false;
  const words = topicWords(topic);
  if (words.length === 0) return body.includes(topic.toLowerCase().slice(0, 12));
  const hits = words.filter((word) => body.includes(word));
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
  return [
    {
      role: 'system',
      content: 'You write a study note a student can trust. Use only standard facts. If a detail is uncertain, leave it out. Do not invent numbers, dates, people, or formulas. No diagrams, tables, questions, or preambles. Finish every sentence.',
    },
    {
      role: 'user',
      content: `Subject: ${subject || 'General study'}
Topic: ${topic}
Depth: ${depth.label}
Length: ${depth.words}

${angleNote(angle)}

Use exactly these headings, in this order:
## What it is
## Why it matters
## One example
## A common mistake

Under each heading, write the point first: one sentence of at most 20 words, in the easiest true words. Then write two or three more short sentences that explain that point. Name the real parts and what each one does. The example walks through one real case. The common mistake states the wrong claim and the correction.

Do not ask a question. Stay on "${topic}". End the common-mistake section with a complete sentence.

If "${topic}" is a procedure a programmer writes, add this section after the mistake, with one fenced example of at most 12 lines that matches the note. Do not invent a library. If it is not a program, stop. Do not add code.
## Code`,
    },
  ];
}

function reviewMessages(topic, draft) {
  return [
    {
      role: 'system',
      content: 'You edit a lesson before a student sees it. Delete anything uncertain, unfinished, or off topic. Reject an analogy that replaces the real definition. Return only the revised lesson. If the draft cannot be made accurate, start with the line REJECTED.',
    },
    {
      role: 'user',
      content: `Topic: ${topic}

Revise this draft.
- Keep a sentence only if it is standard knowledge about "${topic}".
- Delete invented numbers, dates, formulas, names, and code.
- Every section must be present, name the real concept, and end with a complete sentence.
- Delete slogans that do not state the fact.
- Use exactly these headings:
## What it is
## Why it matters
## One example
## Check yourself
## A common mistake

Draft:
${draft}`,
    },
  ];
}

export async function writeCheckedLesson({ subject, topic, tier, angle, signal }) {
  const key = lessonKey({ topic, tier, angle });
  const saved = cachedLesson(key);
  if (saved && lessonIsReady(topic, saved)) return saved;

  const depth = DEPTH[tier] || DEPTH.tier3;
  const raw = await collectChat(lessonMessages({ subject, topic, tier, angle }), {
    numPredict: depth.predict,
    signal,
  });
  const lesson = keepLesson(raw);
  if (!lessonIsReady(topic, lesson)) {
    throw new Error(`A clear note on “${topic}” was not ready, so it was not shown.`);
  }
  storeLesson(key, lesson);
  return lesson;
}

export async function* streamChat(messages, { numPredict = 420, signal } = {}) {
  const res = await fetch(`${HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      keep_alive: '30m',
      options: { temperature: 0.2, num_predict: numPredict, num_ctx: 2048 },
      messages,
    }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail.slice(0, 180) || `Ollama returned ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.error) throw new Error(msg.error);
      const piece = msg.message?.content || '';
      if (piece) yield piece;
    }
  }
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
