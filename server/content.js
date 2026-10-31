/**
 * Fast lesson, quiz, and answer responses.
 * These return immediately so the learning screen never waits on a model server.
 * Optional Ollama rewrite is attempted only when it answers inside a short budget.
 */

const TIER_ORDER = ['tier1', 'tier3', 'tier5'];

function words(text) {
  return (text.match(/\b[\w'-]+\b/g) || []).length;
}

function estimates(versions) {
  return Object.fromEntries(
    Object.entries(versions).map(([tier, body]) => [
      tier,
      { words: words(body), minutes: Math.max(1, Math.round(words(body) / 180)) },
    ])
  );
}

function kindOf(topic) {
  const text = (topic || '').toLowerCase();
  if (/phonics|alphabet|lkg|ukg|rhyme|nursery|letter sound|number|shape|animal|habit/.test(text)) return 'early';
  if (/newton|force|motion|gravity|velocity|acceleration|momentum|physics/.test(text)) return 'physics';
  if (/photosynthesis|cell|dna|atom|molecule|chemistry|biology|reaction/.test(text)) return 'science';
  if (/history|rome|egypt|philosophy|music|ethics|geography|civics/.test(text)) return 'humanities';
  if (/fraction|algebra|geometry|calculus|equation|math/.test(text)) return 'math';
  return 'systems';
}

function lessonFor(topic, tier) {
  const kind = kindOf(topic);
  if (kind === 'early') {
    if (tier === 'tier5') {
      return `## ${topic} — a deeper look\n\n### What stays the same\n${topic} still starts with one clear idea a child can see, hear, or count. The deeper version asks why that idea keeps working when the example changes.\n\n### Try a harder version\n- Change one piece of the example and predict what happens.\n- Explain the idea without using the picture.\n- Teach it to someone younger in three short steps.\n\n### Check\nA strong answer names the rule, gives one example, and says what would break the rule.`;
    }
    if (tier === 'tier1') {
      return `## ${topic}\n\n### Look and try\n${topic} is something we can see, say, or count together.\n\n- Point to one example.\n- Say its name out loud.\n- Find one more example nearby.\n\n### A tiny story\nImagine a friendly guide who practices ${topic} one small step at a time. Each try adds a star. Missing a step is fine. We try again.\n\n### Together\n1. Look.\n2. Say it.\n3. Smile and repeat once.\n\nThe goal is a clear, happy first memory of ${topic}, not a long explanation.`;
    }
    return `## ${topic}\n\n### The idea\n${topic} connects a sound, a picture, or a count to a meaning. We learn it by noticing a pattern and using it again.\n\n### Steps\n1. Name what you see.\n2. Match it to one rule.\n3. Use the rule on a new example.\n\n### Why it matters\nOnce the pattern is familiar, harder lessons in school can build on ${topic} instead of starting from zero.`;
  }

  if (kind === 'physics') {
    const core = `## ${topic}\n\n### What the law says\n${topic} describes how force, mass, and motion stay consistent. A change in motion means a net force. If the forces cancel, the motion stays the same.\n\n### Picture\n\`\`\`text\n[ forces on the object ] -> [ net force ] -> [ change in motion ]\n\`\`\`\n\n### Use it\nDraw the object, mark each push or pull, then ask which ones cancel. What is left is the net force that changes the motion.`;
    if (tier === 'tier1') {
      return `## ${topic} in plain words\n\n### Everyday picture\nThink of pushing a trolley. A harder push changes its speed faster. A heavier trolley needs more push for the same change. ${topic} is that relationship.\n\n### Three checks\n- What is being pushed or pulled?\n- Are the pushes balanced?\n- Does the speed or direction change?\n\nIf nothing unbalanced is pushing, the motion does not change by itself.`;
    }
    if (tier === 'tier5') {
      return `## ${topic} — quantitative view\n\n### Relation\nNet force equals mass times acceleration. Weight near Earth is mass times gravitational acceleration. Momentum changes at a rate equal to the net force.\n\n### Limits\nThese relations assume a chosen frame and forces you actually counted. Leaving out friction, drag, or a normal force makes the prediction miss.\n\n### Check yourself\n- Which force pair is an interaction, and which force is only on the object you are studying?\n- What changes if mass stays constant but the net force doubles?\n\n${core}`;
    }
    return core;
  }

  if (tier === 'tier1') {
    return `## ${topic} — the simple picture\n\n### The problem it solves\n${topic} is a way to keep an idea organized so you can use it again without holding every detail in your head.\n\n### Analogy\nTreat ${topic} like labeled boxes. Each box has one job. You find the right box instead of searching a pile.\n\n### Walk through\n1. Name the input.\n2. Apply the rule for ${topic}.\n3. Check the result still makes sense.\n\nStart with the smallest version of ${topic} that still works. Add detail only after that version is clear.`;
  }
  if (tier === 'tier5') {
    return `## ${topic} — limits and trade-offs\n\n### What has to stay true\nA correct use of ${topic} preserves its invariant: the result is still valid after the operation, including when an input is missing or too large.\n\n### Trade-off\nFaster lookup usually costs more memory or more careful updates. A simpler design is often the right one until measurement shows a real bottleneck.\n\n### Failure\n${topic} fails in practice when growth is unbounded, when two updates race, or when an edge case was never stated. Name the limit before you optimize.\n\n### Check\n- What is the usual cost, and what is the worst case?\n- Which assumption, if broken, makes the explanation false?`;
  }
  return `## ${topic}\n\n### Core idea\n${topic} is a repeatable method. You can explain it as inputs, a rule, and a result.\n\n### Shape\n\`\`\`text\n[ input ] -> [ ${topic} ] -> [ result you can check ]\n\`\`\`\n\n### How to study it\n1. State the rule in one sentence.\n2. Work one example by hand.\n3. Change one input and predict the new result.\n4. Say which case would break a careless version.\n\n### Practice standard\nA good explanation of ${topic} names the rule, one example, and one limit. Memorizing a definition without the example is not enough.`;
}

export function buildLessonVersions(topic) {
  const clean = (topic || 'this topic').trim().slice(0, 160);
  const versions = {
    tier1: lessonFor(clean, 'tier1'),
    tier3: lessonFor(clean, 'tier3'),
    tier5: lessonFor(clean, 'tier5'),
  };
  return versions;
}

export function buildLessonResponse(topic) {
  const versions = buildLessonVersions(topic);
  return {
    status: 'success',
    topic,
    versions,
    content_source: 'cogflow_curriculum',
    model: 'cogflow-mern',
    reading_estimates: estimates(versions),
  };
}

export function buildDynamicContent({ topic, subtopic, tier, angle }) {
  const focus = subtopic && subtopic !== topic ? `${topic} — ${subtopic}` : topic;
  let content = lessonFor(focus, tier);
  if (angle === 'code_deepdive' && kindOf(topic) === 'systems') {
    content += `\n\n### A small sketch\n\`\`\`text\nread input\napply ${topic}\nwrite result only if the check passes\n\`\`\``;
  }
  return {
    status: 'success',
    topic,
    subtopic: subtopic || topic,
    tier,
    content,
    content_source: 'cogflow_curriculum',
    model: 'cogflow-mern',
    cached: false,
  };
}

function quizFor(topic, tier) {
  const kind = kindOf(topic);
  if (kind === 'early') {
    return {
      mcqs: [
        {
          id: 'q1',
          question: `Which activity best matches practicing ${topic}?`,
          options: [
            'Look, name one example, and find another',
            'Skip the example and memorize a long definition',
            'Change the subject before naming anything',
            'Guess without looking',
          ],
          correctIndex: 0,
          explanation: `${topic} sticks when a learner can point to an example and name it.`,
        },
        {
          id: 'q2',
          question: `What should you do if the first try at ${topic} is wrong?`,
          options: [
            'Stop forever',
            'Look again and try one more clear example',
            'Hide the example',
            'Rush to a harder topic',
          ],
          correctIndex: 1,
          explanation: 'A missed try is part of practice. One more clear example is the right next step.',
        },
        {
          id: 'q3',
          question: `A good first memory of ${topic} includes which piece?`,
          options: [
            'One example you can see or say',
            'Only a silent guess',
            'Ten unrelated facts',
            'No example at all',
          ],
          correctIndex: 0,
          explanation: 'The first goal is one clear example, not a pile of unrelated facts.',
        },
      ],
      typingPrompt: {
        question: `Explain ${topic} the way you would teach it to a younger student. Use one example.`,
        sampleGoodPoints: ['Names the idea', 'Uses one concrete example', 'Uses simple words'],
        rubricKeywords: [topic.toLowerCase(), 'example', 'look', 'name', 'try'],
      },
    };
  }

  const depth = tier === 'tier5'
    ? 'a limit or a case where a careless explanation fails'
    : tier === 'tier1'
      ? 'the everyday meaning'
      : 'the main rule and one example';

  return {
    mcqs: [
      {
        id: 'q1',
        question: `What is the most useful way to explain ${topic}?`,
        options: [
          `State the rule, give one example, and name ${depth}`,
          'Repeat the title without an example',
          'List unrelated tools',
          'Skip the rule and only describe a feeling',
        ],
        correctIndex: 0,
        explanation: `An explanation of ${topic} needs a rule and a checkable example.`,
      },
      {
        id: 'q2',
        question: `Which change best tests whether you understand ${topic}?`,
        options: [
          'Change one input and predict the new result before looking it up',
          'Read the title again and stop',
          'Replace the topic with a different subject',
          'Remove the example so only the name remains',
        ],
        correctIndex: 0,
        explanation: 'Prediction on a changed example shows the rule is understood.',
      },
      {
        id: 'q3',
        question: `When is a shorter explanation of ${topic} the better one?`,
        options: [
          'When the shorter version still states the rule and the example correctly',
          'When it removes the example to save time',
          'When it adds extra claims that were not checked',
          'When it avoids saying what the result depends on',
        ],
        correctIndex: 0,
        explanation: 'Shorter is better only when the rule and the example survive.',
      },
    ],
    typingPrompt: {
      question: `In your own words, explain ${topic}. Include the rule, one example, and one limit.`,
      sampleGoodPoints: [
        `Defines ${topic}`,
        'Walks through one example',
        'Names a limit or a common miss',
      ],
      rubricKeywords: [topic.toLowerCase(), 'example', 'because', 'limit', 'rule', 'result'],
    },
  };
}

export function buildQuiz({ topic, subtopic, tier }) {
  const focus = subtopic || topic;
  const body = quizFor(focus, tier);
  return {
    status: 'success',
    topic,
    subtopic: focus,
    tier,
    generator: 'cogflow_curriculum',
    ...body,
  };
}

export function evaluateAnswer({ topic, question, studentAnswer, tier }) {
  const answer = studentAnswer.trim();
  const lower = answer.toLowerCase();
  const tokens = answer.split(/\s+/).filter(Boolean);
  const topicHit = lower.includes((topic || '').toLowerCase().slice(0, 24));
  const hasBecause = /because|therefore|so that|which means|for example|for instance/.test(lower);
  const hasExample = /for example|e\.g\.|such as|instance|imagine|suppose/.test(lower);
  const hasLimit = /however|limit|unless|fails|edge|trade-?off|except|cannot|can't/.test(lower);
  let score = 35;
  if (tokens.length >= 25) score += 15;
  if (tokens.length >= 50) score += 10;
  if (tokens.length >= 90) score += 5;
  if (topicHit) score += 10;
  if (hasBecause) score += 10;
  if (hasExample) score += 10;
  if (hasLimit) score += 10;
  if (tier === 'tier5' && !hasLimit) score -= 8;
  score = Math.max(20, Math.min(96, score));

  let verdict = 'Needs Review';
  if (score >= 85) verdict = 'Mastery';
  else if (score >= 70) verdict = 'Proficient';
  else if (score >= 55) verdict = 'Partially Proficient';

  const covered = [];
  if (topicHit) covered.push(`Mentions ${topic}`);
  if (hasBecause) covered.push('Gives a reason');
  if (hasExample) covered.push('Uses an example');
  if (hasLimit) covered.push('Names a limit');

  const missing = [];
  if (!hasExample) missing.push('Add one concrete example.');
  if (!hasBecause) missing.push('Say why the rule leads to the result.');
  if (!hasLimit) missing.push('Name one case where the simple explanation stops working.');

  return {
    status: 'success',
    evaluator: 'cogflow_rubric',
    score,
    verdict,
    strengths: covered.length
      ? `The answer includes ${covered.join(', ').toLowerCase()}.`
      : 'The answer is a start. It needs a clearer rule and example.',
    key_points_covered: covered,
    missing_or_misunderstood: missing,
    constructive_feedback: `On the question “${question}”, aim for three parts: the rule of ${topic}, one example, and one limit. Length alone does not raise the score.`,
  };
}

export function adaptTier(currentTier, cognitiveState) {
  let index = TIER_ORDER.indexOf(currentTier);
  if (index < 0) index = 1;
  if (cognitiveState === 1) index = Math.max(0, index - 1);
  else if (cognitiveState === 2) index = Math.min(TIER_ORDER.length - 1, index + 1);
  return TIER_ORDER[index];
}

const LEVEL_TO_TIER = { 1: 'tier1', 2: 'tier1', 3: 'tier3', 4: 'tier5', 5: 'tier5' };

export function adaptationPayload(body) {
  const currentTier = body.current_tier || LEVEL_TO_TIER[body.current_level] || 'tier3';
  const next = body.target_tier || adaptTier(currentTier, body.cognitive_state);
  const topic = body.topic || 'Core idea';
  const content = body.curated_content && body.curated_content.trim().length > 40
    ? body.curated_content
    : lessonFor(topic, next);
  const level = next === 'tier1' ? 1 : next === 'tier5' ? 5 : 3;
  const action = body.cognitive_state === 1
    ? 'Simplified Content (Overload Mitigated)'
    : body.cognitive_state === 2
      ? 'Increased Depth (Boredom Challenged)'
      : 'Maintained Pace (Flow State)';
  return {
    status: 'success',
    action_taken: action,
    new_level: level,
    new_tier: next,
    original_rag_text: content,
    content,
    content_source: 'cogflow_curriculum',
  };
}
