import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { User, LearningSession, TopicProgress } from './models.js';
import {
  adaptationPayload,
  buildDynamicContent,
  buildLessonResponse,
  buildQuiz,
  evaluateAnswer,
} from './content.js';
import { textFromUpload, topicsFromText } from './documents.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const metricsPath = path.join(__dirname, '..', 'public', 'models', 'cogflow', 'metrics.json');
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const TIERS = new Set(['tier1', 'tier3', 'tier5']);
const TIER_RANK = { tier1: 1, tier3: 3, tier5: 5 };

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString('hex')}`;
}

function sendError(res, error) {
  const status = error.status || 500;
  res.status(status).json({ status: 'error', detail: error.message || 'Request failed' });
}

router.get('/', (_req, res) => {
  res.json({
    message: 'CogFlow Engine is running',
    status: 'ok',
    stack: 'mern',
    inference: 'tensorflow.js',
  });
});

router.get('/api/ai-status', (_req, res) => {
  res.json({
    status: 'online',
    primary_provider: 'cogflow_curriculum',
    model: fs.existsSync(metricsPath) ? 'daisee-tfjs' : 'untrained',
    face: 'browser',
    frames_uploaded: false,
  });
});

router.get('/api/model-info', (_req, res) => {
  if (!fs.existsSync(metricsPath)) {
    res.status(404).json({ status: 'error', detail: 'Train the model with npm run train.' });
    return;
  }
  res.json({ status: 'success', metrics: JSON.parse(fs.readFileSync(metricsPath, 'utf8')) });
});

router.post('/api/adapt', (req, res) => {
  const state = Number(req.body?.cognitive_state);
  const level = Number(req.body?.current_level);
  if (!Number.isInteger(state) || state < 0 || state > 2) {
    res.status(422).json({ detail: 'cognitive_state must be 0, 1, or 2.' });
    return;
  }
  if (!Number.isInteger(level) || level < 1 || level > 5) {
    res.status(422).json({ detail: 'current_level must be from 1 to 5.' });
    return;
  }
  res.json(adaptationPayload(req.body));
});

router.post('/api/generate-lesson', (req, res) => {
  const topic = String(req.body?.topic || '').trim();
  if (!topic || topic.length > 160) {
    res.status(422).json({ detail: 'Enter a topic between 1 and 160 characters.' });
    return;
  }
  res.json(buildLessonResponse(topic));
});

router.post('/api/generate-content', (req, res) => {
  const topic = String(req.body?.topic || '').trim();
  if (!topic) {
    res.status(422).json({ detail: 'Topic is required.' });
    return;
  }
  const tier = TIERS.has(req.body?.tier) ? req.body.tier : 'tier3';
  res.json(buildDynamicContent({
    topic,
    subtopic: req.body?.subtopic ? String(req.body.subtopic) : null,
    tier,
    angle: req.body?.angle || 'default',
  }));
});

router.post('/api/generate-quiz', (req, res) => {
  const topic = String(req.body?.topic || '').trim();
  if (!topic) {
    res.status(422).json({ detail: 'Topic is required.' });
    return;
  }
  const tier = TIERS.has(req.body?.tier) ? req.body.tier : 'tier3';
  res.json(buildQuiz({
    topic,
    subtopic: req.body?.subtopic ? String(req.body.subtopic) : null,
    tier,
  }));
});

router.post('/api/evaluate-answer', (req, res) => {
  const topic = String(req.body?.topic || '').trim();
  const question = String(req.body?.question || '').trim();
  const studentAnswer = String(req.body?.student_answer || '').trim();
  if (!studentAnswer) {
    res.status(422).json({ detail: 'Answer text cannot be empty.' });
    return;
  }
  res.json(evaluateAnswer({
    topic,
    question,
    studentAnswer,
    tier: TIERS.has(req.body?.tier) ? req.body.tier : 'tier3',
  }));
});

router.post('/api/extract-topics', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ detail: 'Choose a PDF or TXT file.' });
      return;
    }
    const original = path.basename(req.file.originalname || 'upload')
      .replace(/[^\w.\- ()[\]]+/g, '_')
      .slice(0, 160);
    const text = await textFromUpload(original, req.file.buffer);
    if (text.trim().length < 80) {
      res.status(422).json({ detail: 'The file is too short, or the PDF has no selectable text.' });
      return;
    }
    const documentId = crypto.randomBytes(8).toString('hex');
    const topics = topicsFromText(text, original, documentId);
    if (topics.length === 0) {
      res.status(422).json({ detail: 'Could not identify useful sections in this document.' });
      return;
    }
    res.json({ status: 'success', document_id: documentId, filename: original, topics });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/users', async (_req, res, next) => {
  try {
    const users = await User.find().sort({ created_at: 1 });
    res.json({ status: 'success', users: users.map((user) => user.toJSON()) });
  } catch (error) {
    next(error);
  }
});

router.post('/api/users', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name || name.length > 100) {
      res.status(422).json({ detail: 'Name is required.' });
      return;
    }
    const user = await User.create({
      id: id('usr'),
      name,
      email: req.body?.email || `${name.toLowerCase().replace(/\s+/g, '')}@cogflow.ai`,
      avatar: req.body?.avatar || '🎓',
      grade_level: req.body?.grade_level || 'B.Tech Computer Science',
    });
    res.json({ status: 'success', user: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.get('/api/users/:userId', async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) {
      res.status(404).json({ detail: 'User not found' });
      return;
    }
    res.json({ status: 'success', user: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.put('/api/users/:userId', async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) {
      res.status(404).json({ detail: 'User not found' });
      return;
    }
    const fields = ['name', 'email', 'avatar', 'grade_level', 'baseline_brow', 'baseline_squint', 'preferred_tier'];
    for (const field of fields) {
      if (req.body?.[field] !== undefined && req.body[field] !== null) user[field] = req.body[field];
    }
    user.last_active = new Date();
    await user.save();
    res.json({ status: 'success', user: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

async function saveSession(req, res, next) {
  try {
    const body = req.body || {};
    const userId = String(body.user_id || 'usr_default');
    const subject = String(body.subject || '').trim();
    if (!subject) {
      res.status(422).json({ detail: 'Subject is required.' });
      return;
    }
    const duration = Math.max(0, Number(body.duration_seconds) || 0);
    const load = Number(body.avg_cognitive_load);
    const avgLoad = Number.isFinite(load) ? load : 50;
    let flow = Number(body.time_in_flow_secs) || 0;
    let overload = Number(body.time_in_overload_secs) || 0;
    let boredom = Number(body.time_in_boredom_secs) || 0;
    if (flow + overload + boredom === 0 && duration > 0) {
      if (avgLoad > 70) {
        overload = Math.round(duration * 0.6);
        flow = duration - overload;
      } else if (avgLoad < 35) {
        boredom = Math.round(duration * 0.6);
        flow = duration - boredom;
      } else {
        flow = Math.round(duration * 0.8);
        overload = Math.round(duration * 0.1);
        boredom = Math.max(0, duration - flow - overload);
      }
    }

    const topics = Array.isArray(body.topics) ? body.topics.map(String).slice(0, 40) : [];
    const adaptationLog = Array.isArray(body.adaptation_log) ? body.adaptation_log.slice(0, 200) : [];
    const finalTier = TIERS.has(body.final_tier) ? body.final_tier : 'tier3';
    const initialTier = TIERS.has(body.initial_tier) ? body.initial_tier : 'tier3';
    const quizScore = Number(body.quiz_score) || 0;

    const session = await LearningSession.create({
      id: id('ses'),
      user_id: userId,
      subject,
      duration_seconds: duration,
      avg_cognitive_load: avgLoad,
      time_in_flow_secs: flow,
      time_in_overload_secs: overload,
      time_in_boredom_secs: boredom,
      initial_tier: initialTier,
      final_tier: finalTier,
      adaptations_count: adaptationLog.length,
      topics,
      adaptation_log: adaptationLog,
      assessment_results: Array.isArray(body.assessment_results) ? body.assessment_results.slice(0, 40) : [],
      quiz_score: quizScore,
    });

    for (const topic of topics) {
      const existing = await TopicProgress.findOne({ user_id: userId, subject, topic_name: topic });
      const incomingMastery = quizScore > 0 ? quizScore : (finalTier === 'tier5' ? 90 : finalTier === 'tier1' ? 60 : 75);
      if (existing) {
        existing.times_reviewed += 1;
        existing.last_reviewed = new Date();
        if (TIER_RANK[finalTier] > TIER_RANK[existing.highest_tier_reached]) {
          existing.highest_tier_reached = finalTier;
        }
        existing.mastery_score = Math.min(100, quizScore > 0
          ? (existing.mastery_score * 0.4) + (quizScore * 0.6)
          : existing.mastery_score + 8);
        await existing.save();
      } else {
        await TopicProgress.create({
          user_id: userId,
          subject,
          topic_name: topic,
          highest_tier_reached: finalTier,
          times_reviewed: 1,
          last_reviewed: new Date(),
          mastery_score: incomingMastery,
        });
      }
    }

    await User.updateOne({ id: userId }, { $set: { last_active: new Date() } });
    res.json({ status: 'success', session: session.toClient(), message: 'Learning session saved to history' });
  } catch (error) {
    next(error);
  }
}

router.post('/api/sessions', saveSession);
router.post('/api/sessions/save', saveSession);

router.get('/api/users/:userId/history', async (req, res, next) => {
  try {
    const sessions = await LearningSession.find({ user_id: req.params.userId }).sort({ created_at: -1 }).limit(100);
    res.json({ status: 'success', count: sessions.length, history: sessions.map((session) => session.toClient()) });
  } catch (error) {
    next(error);
  }
});

router.get('/api/users/:userId/progress', async (req, res, next) => {
  try {
    const records = await TopicProgress.find({ user_id: req.params.userId }).sort({ last_reviewed: -1 });
    const bySubject = {};
    for (const record of records) {
      const client = record.toClient();
      if (!bySubject[record.subject]) bySubject[record.subject] = [];
      bySubject[record.subject].push(client);
    }
    res.json({
      status: 'success',
      total_topics: records.length,
      by_subject: bySubject,
      topics: records.map((record) => record.toClient()),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/api/users/:userId/analytics', async (req, res, next) => {
  try {
    const sessions = await LearningSession.find({ user_id: req.params.userId });
    const topics = await TopicProgress.countDocuments({ user_id: req.params.userId });
    const totalSessions = sessions.length;
    const totalStudyTime = sessions.reduce((sum, session) => sum + session.duration_seconds, 0);
    const avgLoad = totalSessions
      ? sessions.reduce((sum, session) => sum + session.avg_cognitive_load, 0) / totalSessions
      : 50;
    const flowSeconds = sessions.reduce((sum, session) => sum + session.time_in_flow_secs, 0);
    res.json({
      status: 'success',
      analytics: {
        total_sessions: totalSessions,
        total_study_time_seconds: totalStudyTime,
        avg_cognitive_load: Math.round(avgLoad * 10) / 10,
        flow_state_percentage: Math.round((flowSeconds / Math.max(1, totalStudyTime)) * 1000) / 10,
        total_adaptations_mitigated: sessions.reduce((sum, session) => sum + session.adaptations_count, 0),
        topics_mastered_count: topics,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
