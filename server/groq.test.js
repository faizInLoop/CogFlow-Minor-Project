import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonIsReady, lessonKey, lessonMessages, lessonValidationError, repairMessages } from './groq.js';
import { authoredLesson } from '../shared/lessons.js';

const goodLesson = `## What it is
A stack is a container that lets you add and remove items from one accessible end, called the top. Its last-in, first-out rule means the newest item is removed before older items.

The top identifies the only position where ordinary stack operations change the collection. This simple restriction makes the order of returned items predictable without searching through every entry.

## Why it matters
Stacks are useful when a task must reverse the order in which items were received. They also model nested work that must finish before the earlier work can continue.

The rule gives programs a clear way to save unfinished operations and resume them in reverse order. A stack is a good choice when access to older items is not needed immediately.

## One example
Start empty, then push 5 and 10; the top is now 10 because it was added last.
Calling pop returns 10 and leaves [5], showing that insertion and removal happen at the same end.

## A common mistake
A stack is not a container where the oldest item is always removed first. That behavior describes a queue, which uses a different removal order.

Reading an item does not necessarily remove it, because a peek operation can report the top without changing the stack. Confusing peek with pop leads to incorrect state tracking.

## Check yourself
Which value does pop return after pushing 5 and then 10? What value remains at the top after that removal?`;

const llmLesson = `## What it is
An LLM, or large language model, learns patterns in text and uses them to generate a likely continuation. It processes text as tokens and predicts the next token from the context it has received.

The model's learned parameters capture statistical relationships rather than a searchable copy of every source. Its output is generated step by step, with each new token influencing what comes next.

## Why it matters
LLMs can summarize documents, answer questions, and draft text through one flexible interface. They are useful when language is the main way people provide information or ask for help.

Their fluent answers can still contain mistakes because likely wording is not the same as verified fact. Important claims should be checked against reliable sources.

## One example
A user can ask an LLM to explain how a water cycle works in simple language, and the model uses the prompt and learned patterns to compose an explanation.
If asked for a shorter version, it can preserve the central idea while changing the response; the result depends on the instruction and conversation context.

## A common mistake
An LLM does not reason or verify every statement in the same way a person or a calculation tool can. A confident tone alone is not evidence that an answer is accurate.

It also does not necessarily remember a conversation after the session ends. Memory depends on how the application stores and supplies previous messages.

## Check yourself
What does an LLM predict one step at a time? Why should a reader verify an important claim from its answer?`;

test('accepts a complete lesson with the required sections', () => {
  assert.equal(lessonValidationError('stack', goodLesson), null);
});

test('rejects headings deeper than level two', () => {
  const lesson = goodLesson.replace('## One example', '### One example');
  assert.equal(lessonIsReady('stack', lesson), false);
});

test('rejects duplicated sentences within a section', () => {
  const firstSentence = 'A stack is a container that lets you add and remove items from one accessible end, called the top.';
  const lesson = goodLesson.replace(
    'Its last-in, first-out rule means the newest item is removed before older items.',
    firstSentence,
  );
  assert.equal(lessonIsReady('stack', lesson), false);
});

test('rejects the topic title repeated as a bullet', () => {
  const lesson = goodLesson.replace('## What it is\n', '## What it is\n- Stack.\n');
  assert.equal(lessonIsReady('stack', lesson), false);
  assert.match(lessonValidationError('stack', lesson), /topic title as a bullet/);
});

test('validates structure without requiring topic words to appear verbatim', () => {
  assert.equal(lessonValidationError('expain the working of a LLM', llmLesson), null);
});

test('uses the same dynamic lesson prompt for different learner requests', () => {
  const firstRequest = 'Explain quantum entanglement using a new example.';
  const secondRequest = 'Compare REST APIs with GraphQL for a small app.';
  const firstMessages = lessonMessages({
    subject: 'Physics',
    topic: firstRequest,
    tier: 'tier3',
    angle: 'default',
  });
  const secondMessages = lessonMessages({
    subject: 'Physics',
    topic: secondRequest,
    tier: 'tier3',
    angle: 'default',
  });
  assert.ok(firstMessages[1].content.includes(firstRequest));
  assert.ok(secondMessages[1].content.includes(secondRequest));
  assert.equal(
    firstMessages[1].content.split(firstRequest).join('<REQUEST>'),
    secondMessages[1].content.split(secondRequest).join('<REQUEST>'),
  );
});

test('uses materially different tier instructions and separate refreshed cache keys', () => {
  const topic = 'Explain how a stack data structure works';
  const prompts = Object.fromEntries(['tier1', 'tier3', 'tier5'].map((tier) => [tier, lessonMessages({
    subject: 'Computer Science', topic, tier, angle: 'default',
  })[1].content]));

  assert.match(prompts.tier1, /SIMPLIFIED/);
  assert.match(prompts.tier1, /beginner-friendly/);
  assert.match(prompts.tier1, /short sentences/);
  assert.match(prompts.tier1, /fundamentals/);
  assert.match(prompts.tier3, /STANDARD/);
  assert.match(prompts.tier3, /technical terms/);
  assert.match(prompts.tier3, /moderate depth/);
  assert.match(prompts.tier5, /EXPERT/);
  assert.match(prompts.tier5, /internal operation/);
  assert.match(prompts.tier5, /edge cases, limitations, trade-offs, or complexity/);
  assert.notEqual(prompts.tier1, prompts.tier3);
  assert.notEqual(prompts.tier3, prompts.tier5);

  const keys = ['tier1', 'tier3', 'tier5'].map((tier) => lessonKey({ topic, tier, angle: 'default' }));
  assert.equal(new Set(keys).size, 3);
  assert.ok(keys.every((key) => key.startsWith('lesson|v9|')));
});

test('preserves the selected tier when a lesson draft needs repair', () => {
  const draft = 'A short draft that missed the lesson structure.';
  const simplifiedRepair = repairMessages('Explain stacks', 'tier1', 'default', draft, 'Missing headings.')[1].content;
  const expertRepair = repairMessages('Explain stacks', 'tier5', 'default', draft, 'Missing headings.')[1].content;

  assert.match(simplifiedRepair, /SIMPLIFIED/);
  assert.match(simplifiedRepair, /beginner-friendly/);
  assert.match(expertRepair, /EXPERT/);
  assert.match(expertRepair, /internal operation/);
  assert.notEqual(simplifiedRepair, expertRepair);
});

test('does not substitute Standard authored content for an unavailable tier', () => {
  assert.equal(authoredLesson('minimax', 'tier_unknown'), null);
});

test('explains which section failed validation', () => {
  const lesson = goodLesson.replace(
    /## What it is[\s\S]*?\n\n## Why it matters/,
    '## What it is\n\n## Why it matters',
  );
  assert.match(lessonValidationError('stack', lesson), /What it is must contain 1–4 complete sentences/);
});
