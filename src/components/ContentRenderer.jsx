import { Sparkles, BookOpen, Quote, ChevronRight, Layers } from 'lucide-react';
import { getContent } from '../data/subjects';

// ============================================================
// ContentRenderer — displays educational content at a given tier
// Clean, high-readability typography with dynamic tier accents
// ============================================================

const TIER_META = {
  tier1: { label: 'Simplified',  color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', dot: '#10b981' },
  tier3: { label: 'Standard',    color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', dot: '#6366f1' },
  tier5: { label: 'Expert',      color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
};

export default function ContentRenderer({ tier, topic, customVersions = null, activeOverrideText = null, contentSource = null }) {
  const meta = TIER_META[tier] || TIER_META.tier3;
  const rawContent = activeOverrideText || (customVersions && customVersions[tier]) || getContent(topic, tier);
  const isQwen = contentSource?.includes('ollama') || contentSource?.includes('qwen');

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Tier + topic header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 16, marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: meta.dot,
            boxShadow: `0 0 10px ${meta.dot}`,
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: meta.color,
            padding: '3px 8px',
            borderRadius: 6,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
          }}>
            {meta.label} Tier
          </span>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            background: isQwen ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
            color: isQwen ? '#a5b4fc' : 'var(--text-muted)',
            border: `1px solid ${isQwen ? 'rgba(99, 102, 241, 0.4)' : 'var(--border)'}`,
            letterSpacing: '0.03em',
          }}>
            <Sparkles size={11} style={{ color: isQwen ? '#818cf8' : 'var(--indigo-light)' }} />
            {isQwen ? '⚡ Qwen 2.5 Local AI' : (customVersions ? 'Custom Syllabus' : 'RAG Engine v2.4')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <BookOpen size={14} style={{ color: 'var(--indigo-light)' }} />
          <span>{topic}</span>
        </div>
      </div>

      {/* Rendered content */}
      <div className="content-body" style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
        {formatContent(rawContent)}
      </div>
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
        <h2 key={i} style={{
          fontSize: 22,
          fontWeight: 800,
          marginTop: elements.length === 0 ? 0 : 28,
          marginBottom: 16,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          fontFamily: 'Space Grotesk, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--gradient-brand)', display: 'inline-block' }} />
          {renderInline(line.replace('## ', ''))}
        </h2>
      );
    }
    // H2 (### heading)
    else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{
          fontSize: 16,
          fontWeight: 700,
          marginTop: 22,
          marginBottom: 10,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          {renderInline(line.replace('### ', ''))}
        </h3>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} style={{
          borderLeft: '3px solid var(--indigo)',
          paddingLeft: 18, margin: '20px 0',
          color: 'var(--text-primary)', fontSize: 14.5, lineHeight: 1.7,
          background: 'rgba(99,102,241,0.05)',
          borderRadius: '0 10px 10px 0',
          padding: '14px 18px',
          border: '1px solid rgba(99,102,241,0.15)',
          borderLeftWidth: 3,
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
        <ul key={`ul-${i}`} style={{ margin: '14px 0', paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.65 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo-light)', marginTop: 9, flexShrink: 0, boxShadow: '0 0 6px var(--indigo)' }} />
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
        <ol key={`ol-${i}`} style={{ margin: '14px 0', paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '7px 0', color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.65 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: 'var(--indigo-light)',
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
          background: 'rgba(7,9,14,0.7)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 8, padding: '12px 18px', margin: '14px 0',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13.5, color: '#c7d2fe',
          overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
        }}>
          {line.replace(/\*\*/g, '')}
        </div>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 14 }}>
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
      parts.push(<code key={match.index} style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', padding: '1px 6px', borderRadius: 4, fontSize: 13, color: '#c7d2fe' }}>{raw.slice(1, -1)}</code>);
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
    <div style={{ overflowX: 'auto', margin: '18px 0', borderRadius: 10, border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '10px 14px', fontWeight: 700,
                color: 'var(--text-primary)', fontSize: 12,
                borderBottom: '1px solid var(--border)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '10px 14px', color: 'var(--text-secondary)',
                  borderTop: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle',
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
