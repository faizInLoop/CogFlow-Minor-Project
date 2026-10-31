/**
 * CogFlow Backend API Service
 * Centralized HTTP client connecting to FastAPI backend on port 8000.
 */

const API_BASE = 'http://localhost:8000';

export async function getUsers() {
  try {
    const res = await fetch(`${API_BASE}/api/users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.warn('[API] getUsers error, falling back to local default:', err);
    return [{ id: 'usr_default', name: 'Prathamesh', avatar: '🚀', grade_level: 'B.Tech Computer Science' }];
  }
}

export async function getUser(userId = 'usr_default') {
  try {
    const res = await fetch(`${API_BASE}/api/users/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.warn('[API] getUser error, returning fallback:', err);
    return { id: 'usr_default', name: 'Prathamesh', avatar: '🚀', grade_level: 'B.Tech Computer Science', preferred_tier: 'tier3' };
  }
}

export async function createUser(userData) {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.user;
}

export async function updateUser(userId, updateData) {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.user;
}

export async function saveSession(sessionData) {
  try {
    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[API] saveSession error:', err);
    return { status: 'offline', session: sessionData };
  }
}

export async function getSessionHistory(userId = 'usr_default') {
  try {
    const res = await fetch(`${API_BASE}/api/users/${userId}/history`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    console.warn('[API] getSessionHistory error:', err);
    return [];
  }
}

export async function getUserProgress(userId = 'usr_default') {
  try {
    const res = await fetch(`${API_BASE}/api/users/${userId}/progress`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] getUserProgress error:', err);
    return { total_topics: 0, by_subject: {}, topics: [] };
  }
}

export async function getUserAnalytics(userId = 'usr_default') {
  try {
    const res = await fetch(`${API_BASE}/api/users/${userId}/analytics`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.analytics || {};
  } catch (err) {
    console.warn('[API] getUserAnalytics error:', err);
    return {
      total_sessions: 0,
      total_study_time_seconds: 0,
      avg_cognitive_load: 50.0,
      flow_state_percentage: 75.0,
      total_adaptations_mitigated: 0,
      topics_mastered_count: 0,
    };
  }
}


// ── On-The-Fly Dynamic Qwen AI Content & Quiz Services ──

export async function generateDynamicContent({ subject = 'Computer Science', topic, subtopic = null, tier = 'tier3', cognitive_state = 0, angle = 'default' }) {
  try {
    const res = await fetch(`${API_BASE}/api/generate-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, subtopic, tier, cognitive_state, angle }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] generateDynamicContent error:', err);
    return null;
  }
}

export async function generateDynamicQuiz({ topic, subtopic = null, tier = 'tier3', cognitive_load = 50.0, content_snippet = null }) {
  try {
    const res = await fetch(`${API_BASE}/api/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subtopic, tier, cognitive_load, content_snippet }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] generateDynamicQuiz error:', err);
    return null;
  }
}

export async function evaluateStudentAnswer({ topic, question, student_answer, tier = 'tier3' }) {
  try {
    const res = await fetch(`${API_BASE}/api/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, question, student_answer, tier }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] evaluateStudentAnswer error:', err);
    return null;
  }
}
