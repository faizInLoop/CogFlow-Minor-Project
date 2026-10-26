import { getContent } from '../data/subjects';

// ============================================================
// ContentRenderer — displays educational content at a given tier
// PLACEHOLDER: Currently renders from local data/subjects.js
// In production, this will call:
//   GET /api/content?topic={topicName}&tier={tier}
// Response: { content: "markdown string", tier_label: "..." }
// The component interface (props) stays identical.
// ============================================================

const TIER_META = {
  tier1: { label: 'Simplified',  color: 'var(--emerald)',      dot: '#10b981' },
  tier3: { label: 'Standard',    color: 'var(--indigo-light)', dot: '#6366f1' },
  tier5: { label: 'Expert',      color: 'var(--amber)',        dot: '#f59e0b' },
};

export default function ContentRenderer({ tier, topic, customContent = null, contentSource = null, rewrittenByClaude = false, readingEstimate = null }) {
  const meta = TIER_META[tier] || TIER_META.tier3;
  const rawContent = customContent || getContent(topic, tier);
  const actualWords = rawContent.split(/\s+/).filter(Boolean).length;
  const actualReadingEstimate = readingEstimate || { words: actualWords, minutes: Math.max(1, Math.round(actualWords / 130)) };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Tier + topic header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 16, marginBottom: 22,
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
            background: meta.dot,
            boxShadow: `0 0 8px ${meta.dot}80`,
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: '0.05em' }}>
            {meta.label.toUpperCase()}
          </span>
          {rewrittenByClaude ? (
            <span style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(99,102,241,0.25)', color: '#c7d2fe',
              border: '1px solid rgba(99,102,241,0.5)', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              ✨ Claude AI Rewritten
            </span>
          ) : contentSource === 'curated_topic_library' ? (
            <span style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(16,185,129,0.15)', color: '#6ee7b7',
              border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              📚 Curated Topic Content
            </span>
          ) : contentSource === 'document_extracted' ? (
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(6,182,212,0.12)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.25)', fontWeight: 700 }}>Document source</span>
          ) : contentSource === 'gemini_ai' || contentSource === 'claude_ai' ? (
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.18)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 700 }}>{contentSource === 'gemini_ai' ? 'Gemini generated' : 'Claude generated'}</span>
          ) : (
            <span className="placeholder-tag" style={{ fontSize: 10, padding: '2px 8px' }}>
              ⚙ RAG Adaptive Engine
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          📖 {topic}
        </span>
      </div>

      {/* Rendered content */}
      <div className="content-body">
        {formatContent(rawContent)}
      </div>
      {actualWords > 0 && <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>{actualReadingEstimate.words.toLocaleString()} words · estimated {actualReadingEstimate.minutes} min at 130 wpm</div>}
    </div>
  );
}

/* ─── Markdown-like renderer ─── */
function formatContent(raw) {
  const lines = raw.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    // H1 (## heading)
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: 22, fontWeight: 800, marginBottom: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {renderInline(line.replace('## ', ''))}
        </h2>
      );
    }
    // H2 (### heading)
    else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 10, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {renderInline(line.replace('### ', ''))}
        </h3>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} style={{
          borderLeft: '3px solid var(--indigo)',
          paddingLeft: 16, margin: '16px 0',
          color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7,
          background: 'rgba(99,102,241,0.04)', borderRadius: '0 8px 8px 0', padding: '12px 12px 12px 16px',
        }}>
          {renderInline(line.replace('> ', ''))}
        </blockquote>
      );
    }
    // Table (starts with |)
    else if (line.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(<MarkdownTable key={`table-${i}`} rows={tableLines} />);
      continue;
    }
    // Bullet list
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().replace(/^[-*] /, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '12px 0', paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '5px 0', color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.65 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', marginTop: 9, flexShrink: 0 }} />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    else if (/^\d+\./.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '12px 0', paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '7px 0', color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.65 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--indigo-light)',
              }}>{j + 1}</span>
              <span style={{ paddingTop: 2 }}>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    // Math / code block (lines starting with ** that contain equations)
    else if (line.startsWith('**') && (line.includes('=') || line.includes('≤') || line.includes('Σ') || line.includes('∫') || line.includes('→'))) {
      elements.push(
        <div key={i} style={{
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 8, padding: '12px 16px', margin: '12px 0',
          fontFamily: 'monospace', fontSize: 13.5, color: 'var(--indigo-light)',
          overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {line.replace(/\*\*/g, '')}
        </div>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
          {renderInline(line)}
        </p>
      );
    }

    i++;
  }

  return elements;
}

// Inline formatting: bold, code, italic
function renderInline(text) {
  // Split by bold (**...**), inline code (`...`), italic (*...*)
  const parts = [];
  const regex = /(\*\*.*?\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith('**')) {
      parts.push(<strong key={match.index} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('`')) {
      parts.push(<code key={match.index} style={{ fontFamily: 'monospace', background: 'rgba(99,102,241,0.12)', padding: '1px 6px', borderRadius: 4, fontSize: 13, color: 'var(--indigo-light)' }}>{raw.slice(1, -1)}</code>);
    } else if (raw.startsWith('*')) {
      parts.push(<em key={match.index} style={{ color: 'var(--text-secondary)' }}>{raw.slice(1, -1)}</em>);
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts.length > 0 ? parts : text;
}

// Markdown table renderer
function MarkdownTable({ rows }) {
  if (rows.length < 2) return null;
  const headers = rows[0].split('|').filter(Boolean).map(h => h.trim());
  const dataRows = rows.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()));

  return (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '10px 14px', fontWeight: 700,
                color: 'var(--text-primary)', fontSize: 12,
                background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border)',
                letterSpacing: '0.03em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '9px 14px', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', verticalAlign: 'middle',
                }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
