/**
 * CogFlow Backend API Service
 * Centralized HTTP client connecting to FastAPI backend on port 8000.
 */

const API_BASE = 'http://localhost:8000';

export async function extractTopics(file) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_BASE}/api/extract-topics`, { method: 'POST', body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || `Upload failed (${response.status})`);
  return data;
}

export async function generateLesson(topic, sourceText = null, sourceReference = null) {
  const response = await fetch(`${API_BASE}/api/generate-lesson`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, source_text: sourceText, source_reference: sourceReference }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || `Lesson generation failed (${response.status})`);
  return data;
}

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

export async function adaptContent(adaptationData) {
  try {
    const res = await fetch(`${API_BASE}/api/adapt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adaptationData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] adaptContent error, falling back to local curriculum:', err);
    return null;
  }
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
