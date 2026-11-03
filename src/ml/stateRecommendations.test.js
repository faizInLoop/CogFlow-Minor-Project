import assert from 'node:assert/strict';
import test from 'node:test';
import { getStateTransitionRecommendation, STATE_TO_TIER } from './stateRecommendations.js';

test('maps every meaningful state transition to the state tier', () => {
  const cases = [
    ['flow', 'overload', 'tier1', 'Feeling a little overloaded?'],
    ['flow', 'boredom', 'tier5', 'Ready for a deeper challenge?'],
    ['overload', 'flow', 'tier3', "You're back in Flow!"],
    ['overload', 'boredom', 'tier5', 'Ready to explore more?'],
    ['boredom', 'flow', 'tier3', 'Settling into Flow?'],
    ['boredom', 'overload', 'tier1', 'Would an easier explanation help?'],
  ];

  for (const [from, to, tier, title] of cases) {
    const recommendation = getStateTransitionRecommendation(from, to);
    assert.equal(recommendation.tier, tier);
    assert.equal(recommendation.title, title);
    assert.ok(recommendation.message.length > 20);
  }
});

test('does not suggest for repeated or unknown states', () => {
  assert.equal(getStateTransitionRecommendation('flow', 'flow'), null);
  assert.equal(getStateTransitionRecommendation('unknown', 'flow'), null);
  assert.equal(getStateTransitionRecommendation('flow', 'unknown'), null);
});

test('does not repeat a suggestion when its tier is already active', () => {
  assert.equal(getStateTransitionRecommendation('flow', 'overload', 'tier1'), null);
  assert.equal(getStateTransitionRecommendation('overload', 'flow', 'tier3'), null);
  assert.equal(getStateTransitionRecommendation('flow', 'boredom', 'tier3')?.tier, 'tier5');
});

test('keeps the requested default state-to-tier mapping', () => {
  assert.deepEqual(STATE_TO_TIER, { flow: 'tier3', overload: 'tier1', boredom: 'tier5' });
});
