import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonIsOnTopic, lessonIsReady, lessonValidationError } from './ollama.js';

const goodLesson = `## What it is
A stack is a container that lets you add and remove items from one accessible end, called the top. Its last-in, first-out rule means the newest item is removed before older items.

The top identifies the only position where ordinary stack operations change the collection. This simple restriction makes the order of returned items predictable without searching through every entry.

## Why it matters
Stacks are useful when a task must reverse the order in which items were received. They also model nested work that must finish before the earlier work can continue.

The rule gives programs a clear way to save unfinished operations and resume them in reverse order. A stack is a good choice when access to older items is not needed immediately.

## One example
Start with an empty stack, then push 5 followed by 10. The top is now 10 because it was added after 5.

Calling pop returns 10 and leaves [5] as the remaining stack. The returned value confirms that removal happens at the same end used for insertion.

## A common mistake
A stack is not a container where the oldest item is always removed first. That behavior describes a queue, which uses a different removal order.

Reading an item does not necessarily remove it, because a peek operation can report the top without changing the stack. Confusing peek with pop leads to incorrect state tracking.

## Check yourself
Which value does pop return after pushing 5 and then 10? What value remains at the top after that removal?`;

test('accepts a complete lesson with the required sections', () => {
  assert.equal(lessonIsReady('stack', goodLesson), true);
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

test('does not treat request wording as part of the subject', () => {
  assert.equal(lessonIsOnTopic('How does a stack work?', 'A stack uses last-in, first-out ordering.'), true);
});

test('does not reject a relevant answer only because it is concise', () => {
  assert.equal(lessonIsOnTopic('stack', 'A stack stores values.'), true);
});

test('explains which section failed validation', () => {
  const lesson = goodLesson.replace(
    /## What it is[\s\S]*?\n\n## Why it matters/,
    '## What it is\nA stack is a container.\n\n## Why it matters',
  );
  assert.match(lessonValidationError('stack', lesson), /What it is must contain 2–4 complete sentences/);
});
