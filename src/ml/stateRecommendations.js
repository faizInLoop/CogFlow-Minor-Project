export const STATE_TO_TIER = Object.freeze({
  flow: 'tier3',
  overload: 'tier1',
  boredom: 'tier5',
});

const TRANSITION_COPY = Object.freeze({
  'flow:overload': {
    title: 'Feeling a little overloaded?',
    message: 'We noticed a change in your learning state. Would you like to switch to Simplified content for easier explanations?',
  },
  'flow:boredom': {
    title: 'Ready for a deeper challenge?',
    message: 'You seem comfortable with the current material. Would you like to explore Expert-level content with more depth and complexity?',
  },
  'overload:flow': {
    title: "You're back in Flow!",
    message: 'Your learning state has improved. Would you like to return to Standard content?',
  },
  'overload:boredom': {
    title: 'Ready to explore more?',
    message: 'Your learning state has shifted. Would you like to try Expert content with more depth and challenge?',
  },
  'boredom:flow': {
    title: 'Settling into Flow?',
    message: 'Your learning state has changed. Would you like to return to Standard content for a balanced pace?',
  },
  'boredom:overload': {
    title: 'Would an easier explanation help?',
    message: 'Your learning state has shifted. Would you like to switch to Simplified content and take the material step by step?',
  },
});

const TIER_LABELS = Object.freeze({ tier1: 'Simplified', tier3: 'Standard', tier5: 'Expert' });

export function getStateTransitionRecommendation(fromState, toState, activeTier = null) {
  const copy = TRANSITION_COPY[`${fromState}:${toState}`];
  const tier = STATE_TO_TIER[toState];
  if (!copy || !tier || tier === activeTier) return null;
  return { fromState, toState, tier, tierLabel: TIER_LABELS[tier], ...copy };
}
