import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, default: null },
  avatar: { type: String, default: '🎓' },
  grade_level: { type: String, default: 'B.Tech Computer Science' },
  created_at: { type: Date, default: Date.now },
  last_active: { type: Date, default: Date.now },
  baseline_brow: { type: Number, default: 0.005 },
  baseline_squint: { type: Number, default: 0.35 },
  preferred_tier: { type: String, default: 'tier3' },
}, { versionKey: false });

userSchema.methods.toJSON = function toJSON() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    grade_level: this.grade_level,
    created_at: this.created_at,
    last_active: this.last_active,
    baseline_brow: this.baseline_brow,
    baseline_squint: this.baseline_squint,
    preferred_tier: this.preferred_tier,
  };
};

const sessionSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  user_id: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  duration_seconds: { type: Number, default: 0 },
  avg_cognitive_load: { type: Number, default: 50 },
  time_in_flow_secs: { type: Number, default: 0 },
  time_in_overload_secs: { type: Number, default: 0 },
  time_in_boredom_secs: { type: Number, default: 0 },
  initial_tier: { type: String, default: 'tier3' },
  final_tier: { type: String, default: 'tier3' },
  adaptations_count: { type: Number, default: 0 },
  topics: { type: [String], default: [] },
  adaptation_log: { type: Array, default: [] },
  assessment_results: { type: Array, default: [] },
  quiz_score: { type: Number, default: 0 },
}, { versionKey: false });

sessionSchema.methods.toClient = function toClient() {
  return {
    id: this.id,
    user_id: this.user_id,
    subject: this.subject,
    created_at: this.created_at,
    duration_seconds: this.duration_seconds,
    avg_cognitive_load: Math.round(this.avg_cognitive_load * 10) / 10,
    time_in_flow_secs: this.time_in_flow_secs,
    time_in_overload_secs: this.time_in_overload_secs,
    time_in_boredom_secs: this.time_in_boredom_secs,
    initial_tier: this.initial_tier,
    final_tier: this.final_tier,
    adaptations_count: this.adaptations_count,
    topics: this.topics,
    adaptation_log: this.adaptation_log,
    assessment_results: this.assessment_results,
    quiz_score: this.quiz_score,
  };
};

const progressSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  topic_name: { type: String, required: true },
  highest_tier_reached: { type: String, default: 'tier3' },
  times_reviewed: { type: Number, default: 1 },
  last_reviewed: { type: Date, default: Date.now },
  mastery_score: { type: Number, default: 70 },
}, { versionKey: false });

progressSchema.methods.toClient = function toClient() {
  return {
    id: this._id,
    user_id: this.user_id,
    subject: this.subject,
    topic_name: this.topic_name,
    highest_tier_reached: this.highest_tier_reached,
    times_reviewed: this.times_reviewed,
    last_reviewed: this.last_reviewed,
    mastery_score: Math.round(this.mastery_score * 10) / 10,
  };
};

export const User = mongoose.model('User', userSchema);
export const LearningSession = mongoose.model('LearningSession', sessionSchema);
export const TopicProgress = mongoose.model('TopicProgress', progressSchema);

export async function seedDefaultUser() {
  const existing = await User.findOne({ id: 'usr_default' });
  if (existing) return existing;
  return User.create({
    id: 'usr_default',
    name: 'Prathamesh',
    email: 'prathamesh@cogflow.ai',
    avatar: '🚀',
    grade_level: 'B.Tech Computer Science',
    preferred_tier: 'tier3',
  });
}
