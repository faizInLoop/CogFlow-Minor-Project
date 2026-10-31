import { memo, useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Copy, Sparkles } from 'lucide-react';
import { codeForTopic, topicCanHaveCode } from '../data/topicCode';

// ============================================================
// ContentRenderer — Displays Educational Content & Visual Diagrams
// Features Interactive Diagrammatic Studio, SVG Vector Blueprints,
// Client-Side Downloads (SVG/PNG/MD), and Clean LaTeX parsing.
// ============================================================

const TIER_META = {
  tier1: { label: 'Simplified',  color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', dot: '#10b981' },
  tier3: { label: 'Standard',    color: 'var(--theme-accent, #818cf8)', bg: 'var(--theme-accent-bg, rgba(99,102,241,0.12))', border: 'var(--theme-accent-border, rgba(99,102,241,0.25))', dot: 'var(--theme-accent, #6366f1)' },
  tier5: { label: 'Expert',      color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
};

// ─────────────────────────────────────────────────────────────
// LaTeX & Mathematical Expression Cleaner
// ─────────────────────────────────────────────────────────────
function cleanLatex(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\$\$\mathcal\{O\}\((.*?)\)\$\$/g, 'O($1)')
    .replace(/\$\mathcal\{O\}\((.*?)\)\$/g, 'O($1)')
    .replace(/\\mathcal\{O\}\((.*?)\)/g, 'O($1)')
    .replace(/\$\mathcal\{O\}\$/g, 'O')
    .replace(/\\mathcal\{O\}/g, 'O')
    .replace(/\$\log N\$/g, 'log N')
    .replace(/\\log N/g, 'log N')
    .replace(/\\log_2 N/g, 'log₂ N')
    .replace(/\\Omega\((.*?)\)/g, 'Ω($1)')
    .replace(/\\Theta\((.*?)\)/g, 'Θ($1)')
    .replace(/\$\text\{(.*?)\}\$/g, '$1')
    .replace(/\\text\{(.*?)\}/g, '$1')
    .replace(/\\mathbf\{(.*?)\}/g, '$1')
    .replace(/\\quad/g, ' ')
    .replace(/\\approx/g, '≈')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\sum/g, '∑')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\infty/g, '∞')
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1 / $2')
    .replace(/\\sqrt\{(.*?)\}/g, '√($1)')
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\$(.*?)\$/g, '$1');
}

// Complexity & Mathematical Badge Component
function ComplexityBadge({ text }) {
  const clean = cleanLatex(text);
  let color = 'var(--text-secondary)';
  let bg = 'rgba(255,255,255,0.04)';
  let border = 'rgba(255,255,255,0.08)';

  if (/O\(1\)|∑F\s*=\s*0|First Law/i.test(clean)) {
    color = '#34d399';
    bg = 'rgba(52,211,153,0.12)';
    border = 'rgba(52,211,153,0.3)';
  } else if (/O\(log\s*N\)|F\s*=\s*m|v\s*=/i.test(clean)) {
    color = '#38bdf8';
    bg = 'rgba(56,189,248,0.12)';
    border = 'rgba(56,189,248,0.3)';
  } else if (/O\(N\)/i.test(clean) && !/log/i.test(clean)) {
    color = '#fbbf24';
    bg = 'rgba(245,158,11,0.12)';
    border = 'rgba(245,158,11,0.3)';
  } else if (/O\(N\^2\)|O\(N²\)|worst/i.test(clean)) {
    color = '#fb7185';
    bg = 'rgba(244,63,94,0.12)';
    border = 'rgba(244,63,94,0.3)';
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      color,
      background: bg,
      border: `1px solid ${border}`
    }}>
      {clean}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Curated Educational Visual Asset Resolver (Zero Ads / Zero Watermark)
// ─────────────────────────────────────────────────────────────
export function getEducationalImageUrl(topic, customUrl) {
  if (customUrl && !customUrl.includes('pollinations.ai')) return customUrl;
  const t = (topic || '').toLowerCase();
  
  if (t.includes('phonics') || t.includes('alphabet') || t.includes('lkg') || t.includes('ukg') || t.includes('rhyme') || t.includes('letter')) {
    return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('math') || t.includes('number') || t.includes('add') || t.includes('subtract') || t.includes('algebra') || t.includes('calculus')) {
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('solar') || t.includes('space') || t.includes('planet') || t.includes('astronomy') || t.includes('moon') || t.includes('star')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('plant') || t.includes('nature') || t.includes('animal') || t.includes('water') || t.includes('biology') || t.includes('cell')) {
    return 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('physics') || t.includes('newton') || t.includes('force') || t.includes('motion') || t.includes('gravity')) {
    return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('chemistry') || t.includes('atom') || t.includes('molecule') || t.includes('bond') || t.includes('reaction')) {
    return 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('ai') || t.includes('machine learning') || t.includes('neural') || t.includes('transformer') || t.includes('llm')) {
    return 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80';
  }
  if (t.includes('finance') || t.includes('economics') || t.includes('market') || t.includes('money')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';
  }
  return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80';
}

// ─────────────────────────────────────────────────────────────
// Client-Side File Download Utilities
// ─────────────────────────────────────────────────────────────
export function triggerFileDownload(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// HTML5 Canvas Flowchart & Dynamic Architecture Engine
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Code Block with Syntax Highlighting & Copy
// ─────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      margin: '18px 0',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid var(--border)',
        fontSize: 11.5,
        color: 'var(--text-muted)',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: copied ? '#34d399' : 'var(--text-secondary)',
            fontSize: 11,
            transition: 'color 0.2s',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <pre style={{
        margin: 0,
        padding: '16px',
        overflowX: 'auto',
        fontSize: 13,
        lineHeight: 1.6,
        fontFamily: "'JetBrains Mono', monospace",
        color: '#e2e8f0',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Markdown Table Renderer with KaTeX cell parsing
// ─────────────────────────────────────────────────────────────
function MarkdownTable({ lines }) {
  if (!lines || lines.length < 2) return null;

  const parseRow = (line) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(c => c.trim());

  const headers = parseRow(lines[0]);
  const dataRows = lines.slice(2).map(parseRow);

  return (
    <div style={{
      margin: '22px 0',
      overflowX: 'auto',
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'var(--bg-card)'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '12px 16px', fontWeight: 800,
                color: 'var(--text-primary)', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase'
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((r, i) => (
            <tr key={i} style={{
              borderBottom: i === dataRows.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'}
            >
              {r.map((c, j) => (
                <td key={j} style={{ padding: '11px 16px', color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                  {renderInline(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Format Inline Elements
// ─────────────────────────────────────────────────────────────
function renderInline(text) {
  if (typeof text !== 'string') return text;
  const parts = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\$\$.*?\$\$|\$.*?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleanLatex(text.substring(lastIndex, match.index)));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{cleanLatex(token.slice(2, -2))}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{cleanLatex(token.slice(1, -1))}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const inner = cleanLatex(token.slice(1, -1));
      parts.push(<ComplexityBadge key={match.index} text={inner} />);
    } else if (token.startsWith('$') && token.endsWith('$')) {
      parts.push(<ComplexityBadge key={match.index} text={cleanLatex(token)} />);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(cleanLatex(text.substring(lastIndex)));
  }

  return parts;
}

// ─────────────────────────────────────────────────────────────
// Content Body Parser (Markdown + Images + Tables + Quotes)
// ─────────────────────────────────────────────────────────────
function formatContent(content) {
  if (!content) return null;
  const cleaned = content
    .replace(/```text[\s\S]*?```/gi, '')
    .split('\n')
    .filter((line) => (line.match(/[┌┐└┘│─├┤┬┴┼╔╗╚╝║═]/g) || []).length < 2)
    .join('\n');
  const lines = cleaned.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (/^!\[/.test(trimmed)) {
      i++;
      continue;
    }

    // Code blocks (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <CodeBlock key={`code-${i}`} code={codeLines.join('\n')} lang={lang} />
      );
      continue;
    }

    // Markdown Tables (| col | col |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(<MarkdownTable key={`table-${i}`} lines={tableLines} />);
      continue;
    }

    // Headers (H1, H2, H3)
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} style={{
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginTop: 28,
          marginBottom: 12,
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ width: 4, height: 22, borderRadius: 2, background: 'var(--theme-accent, #818cf8)' }} />
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} style={{
          fontSize: 'clamp(18px, 2.4vw, 22px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginTop: 26,
          marginBottom: 12,
          letterSpacing: '-0.015em',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--theme-accent, #818cf8)' }} />
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} style={{
          fontSize: 'clamp(15px, 1.8vw, 17px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: 20,
          marginBottom: 8,
        }}>
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquotes (> Quote)
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} style={{
          margin: '18px 0',
          padding: '12px 18px',
          borderLeft: '3px solid var(--theme-accent, #818cf8)',
          background: 'var(--theme-accent-bg, rgba(99,102,241,0.08))',
          borderRadius: '0 8px 8px 0',
          color: 'var(--text-primary)',
          fontSize: 14,
          lineHeight: 1.6,
        }}>
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Bullet lists (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{
          margin: '14px 0',
          paddingLeft: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          color: 'var(--text-secondary)'
        }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.65 }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists (1. 2.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{
          margin: '14px 0',
          paddingLeft: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          color: 'var(--text-secondary)'
        }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.65 }}>
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} style={{
        margin: '12px 0',
        lineHeight: 1.7,
        color: 'var(--text-secondary)',
        fontSize: 14.5,
      }}>
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.?!])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

const SECTION_LABEL = {
  'What it is': 'What it is',
  'Why it matters': 'Why it matters',
  'One example': 'Example',
  'A common mistake': 'Common mistake',
};

function shortPointer(sentence) {
  const text = sentence.replace(/\s+/g, ' ').trim();
  if (text.length <= 118) return { pointer: text, clipped: false };
  const slice = text.slice(0, 108);
  const comma = slice.lastIndexOf(',');
  const space = slice.lastIndexOf(' ');
  const at = comma > 50 ? comma : space;
  const pointer = `${(at > 40 ? text.slice(0, at) : slice).replace(/[,:;]$/, '').trim()}…`;
  return { pointer, clipped: true };
}

function parseLessonPoints(content) {
  return String(content)
    .split(/\n(?=## )/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(/^##\s+([^\n]+)\n+([\s\S]*)$/);
      if (!match) return null;
      const heading = match[1].trim();
      if (/check yourself|^code$/i.test(heading)) return null;
      const sentences = splitSentences(match[2]);
      if (sentences.length === 0) return null;
      const { pointer, clipped } = shortPointer(sentences[0]);
      const detail = clipped ? sentences : sentences.slice(1);
      return {
        id: heading,
        title: SECTION_LABEL[heading] || heading,
        pointer,
        detail,
      };
    })
    .filter(Boolean);
}

function LessonPoints({ content, startClosed = false }) {
  const points = useMemo(() => parseLessonPoints(content), [content]);
  const [openIds, setOpenIds] = useState(() => new Set());

  useEffect(() => {
    setOpenIds(new Set(!startClosed && points[0] ? [points[0].id] : []));
  }, [content, points, startClosed]);

  if (points.length === 0) return formatContent(content);

  const toggle = (id) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {points.map((point) => {
        const canOpen = point.detail.length > 0;
        const open = canOpen && openIds.has(point.id);
        return (
          <section
            key={point.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: open ? 'rgba(129,140,248,0.06)' : 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => { if (canOpen) toggle(point.id); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                textAlign: 'left',
                cursor: canOpen ? 'pointer' : 'default',
                background: 'transparent',
                border: 'none',
                padding: '13px 14px',
                color: 'var(--text-primary)',
              }}
            >
              <ChevronRight
                size={16}
                style={{
                  flexShrink: 0,
                  marginTop: 3,
                  color: 'var(--theme-accent, #818cf8)',
                  transform: open ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  opacity: canOpen ? 1 : 0.35,
                }}
              />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
                >
                  {point.title}
                </span>
                <span style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.45, letterSpacing: '-0.01em' }}>
                  {point.pointer}
                </span>
              </span>
            </button>
            {open && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '0 16px 14px 40px',
              }}>
                {point.detail.map((sentence) => (
                  <p key={sentence} style={{
                    margin: 0,
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    color: 'var(--text-secondary)',
                  }}>
                    {renderInline(sentence)}
                  </p>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Overview({ points }) {
  const [lead, ...rest] = points;
  return (
    <div>
      <p style={{ margin: '0 0 18px', fontSize: 20, lineHeight: 1.45, fontWeight: 650, letterSpacing: '-0.02em' }}>
        {lead.pointer}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rest.map((point) => (
          <div key={point.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{
              flexShrink: 0,
              width: 118,
              paddingTop: 3,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#a5b4fc',
            }}
            >
              {point.title}
            </span>
            <span style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{point.pointer}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonFlow({ points }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', maxWidth: 560, margin: '0 auto' }}>
      {points.map((point, index) => (
        <div key={point.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '100%',
            border: '1px solid rgba(129,140,248,0.35)',
            borderRadius: 14,
            padding: '14px 16px',
            background: 'rgba(129,140,248,0.07)',
          }}
          >
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#a5b4fc',
            }}
            >
              {index + 1}. {point.title}
            </div>
            <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.55 }}>{point.pointer}</div>
          </div>
          {index < points.length - 1 && (
            <div aria-hidden="true" style={{ height: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 2, flex: 1, background: 'rgba(129,140,248,0.6)' }} />
              <div style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '7px solid rgba(129,140,248,0.85)',
              }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function fencesIn(content) {
  const blocks = [];
  const pattern = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let match = pattern.exec(content);
  while (match) {
    const code = match[2].trim();
    if (code) blocks.push({ label: match[1] || 'code', code });
    match = pattern.exec(content);
  }
  return blocks;
}

function CodeView({ topic, content }) {
  const saved = codeForTopic(topic);
  const blocks = saved
    ? [{ label: saved.label, code: saved.code }]
    : (topicCanHaveCode(topic) ? fencesIn(content) : []);
  if (blocks.length === 0) {
    return (
      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        This topic has no code. Use Overview for the idea, Visual for the flow, and Notes for the full explanation.
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block) => (
        <pre key={block.code} style={{
          margin: 0,
          padding: '16px 18px',
          borderRadius: 12,
          overflowX: 'auto',
          background: 'rgba(0,0,0,0.28)',
          border: '1px solid var(--border)',
          color: '#e2e8f0',
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
        >
          <div style={{
            marginBottom: 8,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#a5b4fc',
            fontFamily: 'inherit',
          }}
          >
            {block.label}
          </div>
          {block.code}
        </pre>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main ContentRenderer Component
// ─────────────────────────────────────────────────────────────
function ContentRenderer({
  tier,
  topic,
  customVersions = null,
  activeOverrideText = null,
  contentSource = null,
  view = 'overview',
}) {
  const meta = TIER_META[tier] || TIER_META.tier3;
  const rawContent = activeOverrideText || (customVersions && customVersions[tier]) || '';
  const points = useMemo(
    () => (rawContent.includes('\n## ') || rawContent.startsWith('## ') ? parseLessonPoints(rawContent) : []),
    [rawContent],
  );
  const sourceLabel = contentSource === 'course_notes'
    ? 'Course notes'
    : contentSource === 'ollama_qwen_dynamic'
    ? 'Checked lesson'
    : contentSource === 'uploaded_syllabus'
      ? 'From your notes'
      : contentSource === 'writing'
        ? 'Writing this lesson'
        : contentSource === 'error'
          ? 'Lesson unavailable'
          : 'Lesson';

  return (
    <article style={{ color: 'var(--text-primary)', maxWidth: 860, margin: '0 auto' }}>
      {/* Top Source Pill & Tier Meta Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 99,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
            fontSize: 11,
            fontWeight: 800,
            color: meta.color,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot }} />
            {meta.label} Tier
          </span>

          <span style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Sparkles size={12} style={{ color: 'var(--theme-accent, #818cf8)' }} />
            {sourceLabel}
          </span>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {topic}
        </div>
      </div>

      <div style={{ fontSize: 15, lineHeight: 1.75 }}>
        {!rawContent && (
          <p style={{ color: 'var(--text-secondary)' }}>
            Writing the note for {topic}. Overview, Visual, Code, and Notes open when it is ready. A custom topic takes about a minute on this computer.
          </p>
        )}
        {rawContent && points.length === 0 && formatContent(rawContent)}
        {rawContent && points.length > 0 && view === 'overview' && <Overview points={points} />}
        {rawContent && points.length > 0 && view === 'visual' && <LessonFlow points={points} />}
        {rawContent && points.length > 0 && view === 'code' && <CodeView topic={topic} content={rawContent} />}
        {rawContent && points.length > 0 && view === 'notes' && <LessonPoints content={rawContent} startClosed />}
      </div>
    </article>
  );
}


export default memo(ContentRenderer);
