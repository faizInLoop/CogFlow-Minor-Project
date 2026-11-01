import assert from 'node:assert/strict';
import test from 'node:test';
import { getCachedDynamicContent, streamDynamicContent } from './api.js';

test('reuses tier lessons in memory and session storage', async () => {
  const storage = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const previousFetch = globalThis.fetch;
  let requestCount = 0;
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  globalThis.fetch = async () => {
    requestCount += 1;
    return new Response(`${JSON.stringify({
      type: 'done',
      content: `Lesson ${requestCount}`,
      provider: 'Test provider',
      content_source: 'test',
    })}\n`);
  };

  try {
    const request = { subject: 'Cache test', topic: 'tier switching', tier: 'tier1' };
    const first = await streamDynamicContent(request);
    await streamDynamicContent({ ...request, tier: 'tier3' });
    const returned = await streamDynamicContent(request);

    assert.equal(requestCount, 2);
    assert.equal(returned.content, first.content);
    assert.equal(returned.cached, true);
    assert.equal(getCachedDynamicContent(request).content, first.content);
    assert.ok(storage.has('cogflow_lesson_cache'));
    const reloadedApi = await import(`./api.js?fresh=${Date.now()}`);
    assert.equal(reloadedApi.getCachedDynamicContent(request).content, first.content);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousStorage) {
      Object.defineProperty(globalThis, 'sessionStorage', previousStorage);
    } else {
      delete globalThis.sessionStorage;
    }
  }
});
