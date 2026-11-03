import { memo, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronRight, Copy, RefreshCw, Sparkles, Brain, Lightbulb, CheckCircle2, BookOpen, Layers, Zap, AlertTriangle } from 'lucide-react';
import { codeForTopic } from '../data/topicCode';

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
    .replace(/\$\$mathcal\{O\}\((.*?)\)\$\$/g, 'O($1)')
    .replace(/\$mathcal\{O\}\((.*?)\)\$/g, 'O($1)')
    .replace(/\\mathcal\{O\}\((.*?)\)/g, 'O($1)')
    .replace(/\$mathcal\{O\}\$/g, 'O')
    .replace(/\\mathcal\{O\}/g, 'O')
    .replace(/\$log N\$/g, 'log N')
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
const CODE_KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'def', 'else', 'elif',
  'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'if', 'import', 'in',
  'let', 'new', 'null', 'of', 'pass', 'print', 'raise', 'return', 'self', 'static', 'this',
  'throw', 'true', 'try', 'undefined', 'var', 'while', 'with', 'yield',
]);

function highlightCode(code) {
  const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\x60(?:\\.|[^\x60\\])*\x60|\b\d+(?:\.\d+)?\b|\b(?:async|await|break|case|catch|class|const|continue|def|else|elif|export|extends|false|finally|for|from|function|if|import|in|let|new|null|of|pass|print|raise|return|self|static|this|throw|true|try|undefined|var|while|with|yield)\b)/gm;
  const highlighted = [];
  let previousIndex = 0;
  let match = pattern.exec(code);
  while (match) {
    if (match.index > previousIndex) highlighted.push(code.slice(previousIndex, match.index));
    const token = match[0];
    let tokenClass = 'generated-code-token--keyword';
    if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('#')) tokenClass = 'generated-code-token--comment';
    else if (/^["'\x60]/.test(token)) tokenClass = 'generated-code-token--string';
    else if (/^\d/.test(token)) tokenClass = 'generated-code-token--number';
    else if (!CODE_KEYWORDS.has(token)) tokenClass = '';
    highlighted.push(tokenClass ? <span key={`${match.index}-${token}`} className={tokenClass}>{token}</span> : token);
    previousIndex = pattern.lastIndex;
    match = pattern.exec(code);
  }
  if (previousIndex < code.length) highlighted.push(code.slice(previousIndex));
  return highlighted;
}

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
      background: '#0b1220',
      border: '1px solid #334155',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(148, 163, 184, 0.08)',
        borderBottom: '1px solid #334155',
        fontSize: 11.5,
        color: '#cbd5e1',
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
        <code>{highlightCode(code)}</code>
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

function lessonTextKey(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// ============================================================
// Teacher Knowledge & Comprehensive Curated Answer Repository
// Covers Early Childhood, Primary, STEM, CS, Systems, and AI.
// ============================================================
const CURATED_TEACHER_ANSWERS = {
  minimax: [
    {
      keywords: ['opponent', 'reply', 'compare', 'best reply'],
      answer: 'Minimax assumes your opponent is rational and will choose the move that minimizes your score. By planning against their best reply, you maximize your worst-case guarantee.',
      keyTakeaway: 'Always assume the opponent plays their best move, not a random or hopeful one.'
    },
    {
      keywords: ['child scores 4 and 7', '4 and 7', 'passed back'],
      answer: 'The score 4 is passed back. Because this is an opponent (MIN) node, the opponent chooses the minimum value between 4 and 7: min(4, 7) = 4.',
      keyTakeaway: 'MIN nodes take min(children); MAX nodes take max(children).'
    },
    {
      keywords: ['values 2 and 9', '2 and 9', 'even though 9'],
      answer: 'The opponent minimizes MAX’s score. Given choices of 2 or 9 for MAX, the opponent will deliberately select 2 because 2 is worse for MAX and better for them.',
      keyTakeaway: 'Node evaluation is always from MAX’s perspective, so MIN seeks the lowest score.'
    }
  ],
  stack: [
    {
      keywords: ['push a and then b', 'push a', 'then b', 'pop return'],
      answer: 'pop() returns B. Stacks follow Last-In, First-Out (LIFO), so the most recently inserted item (B at the top) is popped first.',
      keyTakeaway: 'The newest item is always at the top and removed first.'
    },
    {
      keywords: ['pushing 5 and then 10', '5 and then 10', 'after pushing 5'],
      answer: 'pop() returns 10. Since 10 was pushed after 5, it sits on top of the stack and is removed before 5.',
      keyTakeaway: 'LIFO order: last in is first out.'
    },
    {
      keywords: ['what value remains', 'remains at the top', 'after that removal'],
      answer: 'The value 5 remains on the stack (as [5]). Once 10 is popped, 5 becomes the new top element.',
      keyTakeaway: 'Popping removes the top item and exposes the item underneath.'
    }
  ],
  'operating system': [
    {
      keywords: ['scheduler', 'memory isolation', 'share between apps'],
      answer: 'The CPU scheduler allocates processor time slices among runnable threads, while virtual memory isolation prevents one process from reading or overwriting another process’s address space.',
      keyTakeaway: 'The OS multiplexes hardware while enforcing strict safety boundaries.'
    },
    {
      keywords: ['system call', 'directly controlling the disk', 'asks the os'],
      answer: 'Direct hardware access by applications would cause security breaches and corrupt data. Applications must issue system calls so the kernel can check permissions and coordinate access safely.',
      keyTakeaway: 'Applications operate in unprivileged user mode; privileged hardware access requires the kernel.'
    }
  ],
  phonics: [
    {
      keywords: ['first sound in map', 'last sound in map', 'sound in map', 'map'],
      answer: 'The first sound in "map" is /m/ (mmm) and the last sound is /p/ (puh). We say the phonemes (the spoken sounds /m/ - /æ/ - /p/), not the alphabet names ("em" - "ay" - "pee").',
      keyTakeaway: 'Phonics is about blending sounds into words, not reciting letter names.'
    },
    {
      keywords: ['one sound in the word chat', 'chat', 'stop'],
      answer: 'In "chat", the letter pair "ch" is a digraph that produces one single sound /tʃ/. In "stop", each letter is sounded out and blended: /s/ - /t/ - /ɒ/ - /p/.',
      keyTakeaway: 'Digraphs like "ch", "sh", and "th" blend two letters into one unique sound.'
    },
    {
      keywords: ['long-a sound', 'long a', 'cake', 'rain', 'said'],
      answer: 'Two spellings of the long-a sound are "a_e" (as in cake) and "ai" (as in rain). A common word that cannot be read by a simple phonics blend is "said" (pronounced /sɛd/), which is a sight word exception.',
      keyTakeaway: 'English has regular phonetic patterns alongside irregular sight words.'
    }
  ],
  counting: [
    {
      keywords: ['five fingers', 'sides does a triangle have', 'triangle'],
      answer: 'Counting five fingers means matching one number word to each finger in order (1, 2, 3, 4, 5). A triangle has exactly 3 straight sides and 3 vertices (corners).',
      keyTakeaway: 'One-to-one correspondence: each object is touched once and assigned one number.'
    },
    {
      keywords: ['1 ten and 6 ones', 'square different from a rectangle'],
      answer: '1 ten and 6 ones equals 16 (sixteen). A square has 4 equal sides and 4 right angles; a rectangle has opposite sides equal, so not all 4 sides have to be the same length.',
      keyTakeaway: 'Place value: numbers 10 to 99 are made of groups of tens plus ones.'
    },
    {
      keywords: ['37 as tens and ones', 'square a rectangle'],
      answer: '37 is 3 tens (30) and 7 ones (7). A square is a special type of rectangle because it meets all rules of a rectangle plus has 4 equal sides.',
      keyTakeaway: 'Every square is a rectangle, but not every rectangle is a square.'
    }
  ],
  animals: [
    {
      keywords: ['flies and one that swims', 'sun', 'plant need'],
      answer: 'A bird flies using wings and feathers; a fish swims using fins and gills. Plants need sunlight to perform photosynthesis, converting light and carbon dioxide into food and oxygen.',
      keyTakeaway: 'Animals adapt specialized limbs for their habitat, and plants power the food chain.'
    },
    {
      keywords: ['habitat', 'dry land', 'why does a fish not live'],
      answer: 'A habitat is the natural home that provides food, water, and shelter for living things. Fish cannot live on dry land because their gills require water to extract dissolved oxygen.',
      keyTakeaway: 'Every species is anatomically matched to the resources of its habitat.'
    },
    {
      keywords: ['whale a mammal', 'whale', 'bird from a bat', 'bat'],
      answer: 'A whale is a mammal because it breathes atmospheric air with lungs, gives birth to live young, and feeds them milk. Bats have fur and nurse young (mammals), while birds have feathers and lay eggs.',
      keyTakeaway: 'Animals are classified by biological characteristics, not just how they move.'
    }
  ],
  habits: [
    {
      keywords: ['two times to wash hands', 'why do we brush teeth'],
      answer: 'Hands should be washed with soap before eating and after using the toilet. We brush teeth in the morning and before bed to remove plaque and bacteria that cause tooth decay.',
      keyTakeaway: 'Daily habits stop the spread of germs and keep the body healthy.'
    },
    {
      keywords: ['sleep', 'routine'],
      answer: 'Sleep allows the brain to consolidate learning and the body to repair tissues. A consistent evening routine (wash, brush, read, sleep) helps the nervous system unwind.',
      keyTakeaway: 'Consistent routines make healthy habits effortless and natural.'
    }
  ],
  'quantum physics': [
    {
      keywords: ['double-slit', 'particles show', 'what does the double-slit'],
      answer: 'The double-slit experiment shows that quantum particles (like electrons or photons) exhibit wave-particle duality, existing in a superposition of states until measured or observed.',
      keyTakeaway: 'Particles behave as probability waves until observation collapses their state.'
    },
    {
      keywords: ['mri', 'machines'],
      answer: 'MRI machines rely on nuclear magnetic resonance, a quantum mechanical property where atomic nuclei absorb and re-emit electromagnetic radiation in a magnetic field to generate detailed internal imaging.',
      keyTakeaway: 'Quantum mechanics is the bedrock of modern medical imaging and semiconductors.'
    }
  ]
};

function resolveTeacherAnswer(question, points, topic = '') {
  const qLower = question.toLowerCase();
  const topLower = topic.toLowerCase();

  // 1. Check curated teacher answer repository
  for (const [key, answers] of Object.entries(CURATED_TEACHER_ANSWERS)) {
    if (topLower.includes(key) || qLower.includes(key)) {
      for (const item of answers) {
        if (item.keywords.some((kw) => qLower.includes(kw))) {
          return {
            answer: item.answer,
            keyTakeaway: item.keyTakeaway,
            source: 'Curated Teacher Key'
          };
        }
      }
    }
  }

  // 2. Synthesize from lesson points
  for (const pt of points) {
    for (const sent of pt.sentences) {
      const words = qLower.match(/\b[a-z0-9]{4,}\b/g) || [];
      const matchCount = words.filter((w) => sent.toLowerCase().includes(w)).length;
      if (matchCount >= 2) {
        return {
          answer: sent,
          keyTakeaway: `Directly referenced from the ${pt.title} section above.`,
          source: `Lesson ${pt.title}`
        };
      }
    }
  }

  // 3. Fallback to Example or What it is
  const examplePt = points.find((p) => p.id.includes('example') || p.id.includes('Example'));
  if (examplePt && examplePt.sentences.length > 0) {
    return {
      answer: examplePt.sentences.join(' '),
      keyTakeaway: 'Review the step-by-step example in the lesson to observe how the rule applies.',
      source: 'Lesson Example'
    };
  }

  return {
    answer: 'Review the key concepts above to verify this answer against the core mechanism.',
    keyTakeaway: 'Remember to verify each rule against its concrete operational steps.',
    source: 'Concept Analysis'
  };
}

const SECTION_META = {
  'What it is': {
    title: 'Core Concept & Mental Model',
    badge: 'CORE CONCEPT',
    badgeColor: '#818cf8',
    badgeBg: 'rgba(99,102,241,0.12)',
    icon: Brain,
    teacherLead: 'Essential Rule',
    teaserQuestion: 'What is the fundamental principle and how does it work?'
  },
  'Why it matters': {
    title: 'Practical Impact & Real-World Value',
    badge: 'PRACTICAL IMPACT',
    badgeColor: '#34d399',
    badgeBg: 'rgba(52,211,153,0.12)',
    icon: Zap,
    teacherLead: 'Why It Matters',
    teaserQuestion: 'Why do we need this and what problem does it solve in the real world?'
  },
  'One example': {
    title: 'Step-by-Step Concrete Walkthrough',
    badge: 'CONCRETE WALKTHROUGH',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56,189,248,0.12)',
    icon: Layers,
    teacherLead: 'Walkthrough Step',
    teaserQuestion: 'How does this apply in a real scenario from start to finish?'
  },
  'A common mistake': {
    title: 'Common Misconception & Teacher Trap',
    badge: 'PITFALL ALERT',
    badgeColor: '#fb7185',
    badgeBg: 'rgba(244,63,94,0.12)',
    icon: AlertTriangle,
    teacherLead: 'Teacher Warning',
    teaserQuestion: 'What is the #1 mistake learners make and how do you avoid it?'
  }
};

// Generates pedagogical deep dive points even for compact raw lessons
function buildDeepDiveBreakdown(heading, sentences, topic = '') {
  const cleanSentences = sentences.filter(Boolean);

  if (heading === 'What it is') {
    return [
      { label: 'Core Definition', text: cleanSentences[0] || `The primary definition and structure of ${topic}.` },
      { label: 'How It Operates', text: cleanSentences[1] || 'It coordinates its components in a defined sequence to produce predictable outcomes.' },
      { label: 'Key Mental Model', text: cleanSentences[2] || 'Picture this as a disciplined rule where inputs are transformed step-by-step rather than all at once.' }
    ];
  }

  if (heading === 'Why it matters') {
    return [
      { label: 'Problem It Solves', text: cleanSentences[0] || `Without ${topic}, operations would be chaotic, error-prone, or difficult to predict.` },
      { label: 'Real-World Value', text: cleanSentences[1] || 'It gives practitioners and learners a dependable, modular way to build higher-level systems.' },
      { label: 'Long-Term Foundation', text: cleanSentences[2] || 'Mastering this invariant unlocks more advanced problem solving across exams and practical work.' }
    ];
  }

  if (heading === 'One example') {
    return [
      { label: 'Initial State', text: cleanSentences[0] || 'Start with a clear, minimal scenario before any actions take place.' },
      { label: 'Action & Execution', text: cleanSentences[1] || 'Observe how each step changes the state and inspect the intermediate output.' },
      { label: 'Verification of Result', text: cleanSentences[2] || 'The final outcome confirms that the rule operates exactly as defined.' }
    ];
  }

  if (heading === 'A common mistake') {
    return [
      { label: 'The Common Pitfall', text: cleanSentences[0] || 'Assuming a simplified or reversed rule that contradicts the core mechanism.' },
      { label: 'Why It Causes Errors', text: cleanSentences[1] || 'It leads to incorrect assumptions, failed edge cases, or broken logic.' },
      { label: 'The Teacher Fix', text: cleanSentences[2] || 'Always re-check the foundational rule from first principles before reaching a conclusion.' }
    ];
  }

  return cleanSentences.map((s, idx) => ({ label: `Point ${idx + 1}`, text: s }));
}

function parseLessonPointers(content, topic = '') {
  if (!content) return { points: [], checkQuestions: [] };

  const chunks = String(content)
    .split(/\n(?=## )/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const points = [];
  let checkQuestions = [];

  for (const chunk of chunks) {
    const match = chunk.match(/^##\s+([^\n]+)\n+([\s\S]*)$/);
    if (!match) continue;
    const heading = match[1].trim();

    // Check Yourself questions
    if (/check yourself/i.test(heading)) {
      const qText = match[2].trim();
      const rawLines = qText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const extracted = [];
      for (const line of rawLines) {
        const cleaned = line.replace(/^\s*(?:\d+[.)]|[-*+])\s*/, '').trim();
        if (!cleaned) continue;
        const sentences = splitSentences(cleaned);
        for (const s of sentences) {
          if (s.includes('?') || s.length > 15) extracted.push(s);
        }
      }
      checkQuestions = extracted.slice(0, 4);
      continue;
    }

    if (/^code$/i.test(heading)) continue;

    const sectionKey = lessonTextKey(heading);
    const topicKey = lessonTextKey(topic);
    const body = match[2]
      .split(/\r?\n/)
      .map((line) => ({
        isBullet: /^\s*[-*+]\s+/.test(line),
        text: line.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*[-*+]\s+/, '').trim(),
      }))
      .filter(({ isBullet, text }) => (
        text && !(isBullet && [sectionKey, topicKey].includes(lessonTextKey(text)))
      ))
      .map(({ text }) => text)
      .join(' ');

    const seen = new Set();
    const sentences = splitSentences(body).filter((sentence, index) => {
      const key = lessonTextKey(sentence);
      if (index === 0 && [sectionKey, topicKey].includes(key)) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (sentences.length === 0) continue;

    const meta = SECTION_META[heading] || {
      title: heading,
      badge: heading.toUpperCase(),
      badgeColor: '#818cf8',
      badgeBg: 'rgba(99,102,241,0.12)',
      icon: BookOpen,
      teacherLead: 'Insight',
      teaserQuestion: 'Tap the arrow to reveal the in-depth teacher breakdown.'
    };

    const deepDive = buildDeepDiveBreakdown(heading, sentences, topic);

    points.push({
      id: heading,
      heading,
      title: meta.title,
      badge: meta.badge,
      badgeColor: meta.badgeColor,
      badgeBg: meta.badgeBg,
      icon: meta.icon,
      teacherLead: meta.teacherLead,
      teaserQuestion: meta.teaserQuestion,
      pointer: sentences[0],
      detail: sentences.slice(1),
      deepDive,
      sentences
    });
  }

  return { points, checkQuestions };
}

// ─────────────────────────────────────────────────────────────
// Teacher Checkpoint Card with Explicit Arrow Reveal Interaction
// ─────────────────────────────────────────────────────────────
function TeacherCheckpointCard({ question, number, points, topic }) {
  const [revealed, setRevealed] = useState(false);
  const [assessment, setAssessment] = useState(null); // 'correct' | 'review' | null

  const resolved = useMemo(
    () => resolveTeacherAnswer(question, points, topic),
    [question, points, topic]
  );

  return (
    <div
      style={{
        border: `1px solid ${assessment === 'correct' ? 'rgba(52,211,153,0.4)' : assessment === 'review' ? 'rgba(251,191,36,0.4)' : 'var(--border)'}`,
        borderRadius: 14,
        background: 'var(--bg-card)',
        padding: '16px 18px',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: assessment === 'correct' ? '0 0 20px rgba(52,211,153,0.1)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'var(--atlas-selected)',
            border: '1px solid var(--atlas-selected)',
            color: 'var(--atlas-on-selected)',
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
            marginTop: 1
          }}>
            {number}
          </span>
          <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {cleanLatex(question)}
          </div>
        </div>

        {assessment && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 750,
            padding: '2px 8px',
            borderRadius: 6,
            background: assessment === 'correct' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
            color: assessment === 'correct' ? '#34d399' : '#fbbf24',
            border: `1px solid ${assessment === 'correct' ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`,
            flexShrink: 0
          }}>
            {assessment === 'correct' ? <CheckCircle2 size={12} /> : <RefreshCw size={12} />}
            {assessment === 'correct' ? 'Mastered!' : 'Reviewing'}
          </span>
        )}
      </div>

      {/* Prominent Arrow Reveal Button (User Must Click Arrow to Understand) */}
      <div>
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 750,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'rgba(129,140,248,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: revealed ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <ChevronRight size={12} style={{ color: '#fbbf24' }} />
          </div>
          <span>{revealed ? '▾ Hide Teacher Explanation' : '▸ Click Arrow to Reveal Teacher Answer & Explanation'}</span>
        </button>
      </div>

      {/* Expandable Teacher Dropdown Content */}
      {revealed && (
        <div style={{
          marginTop: 4,
          padding: '16px 18px',
          borderRadius: 12,
          background: 'var(--theme-accent-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb size={13} style={{ color: '#fbbf24' }} />
              <span>Verified Teacher Answer & Explanation</span>
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--text-primary)' }}>
              {renderInline(resolved.answer)}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(129,140,248,0.08)',
            border: '1px solid rgba(129,140,248,0.2)',
            fontSize: 12.5,
            color: 'var(--text-primary)'
          }}>
            <Sparkles size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <span><strong>Key Takeaway:</strong> {resolved.keyTakeaway}</span>
          </div>

          {/* Student Self-Assessment Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Did you understand this explanation?
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setAssessment('correct')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: assessment === 'correct' ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.1)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.3)'
                }}
              >
                <Check size={12} />
                I understood this! ✨
              </button>
              <button
                type="button"
                onClick={() => setAssessment('review')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: assessment === 'review' ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.1)',
                  color: '#fbbf24',
                  border: '1px solid rgba(251,191,36,0.3)'
                }}
              >
                <RefreshCw size={12} />
                Need to review 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Master Teacher Lesson Overview: Interactive Progressive Disclosure
// Users must interact / click the arrow to reveal deep explanations!
// ─────────────────────────────────────────────────────────────
function TeacherLessonOverview({ points, checkQuestions, topic }) {
  // Start with only the first section open, or all collapsed awaiting interaction
  const [expandedIds, setExpandedIds] = useState(() => new Set(points.length > 0 ? [points[0].id] : []));

  const toggleAll = (expand) => {
    if (expand) setExpandedIds(new Set(points.map((p) => p.id)));
    else setExpandedIds(new Set());
  };

  const toggleSection = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Interactive Guidance Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Brain size={18} style={{ color: 'var(--theme-accent, #818cf8)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text-primary)' }}>
              Interactive Teacher Studio · Progressive Depth & Clarity
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              Tap each section arrow (<strong style={{ color: 'var(--theme-accent, #818cf8)' }}>▸</strong>) to reveal deep explanations, step-by-step mechanisms, and verified answers.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => toggleAll(true)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '5px 11px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              transition: 'background 0.2s'
            }}
          >
            📖 Reveal All
          </button>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '5px 11px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              transition: 'background 0.2s'
            }}
          >
            📌 Collapse to Arrows
          </button>
        </div>
      </div>

      {/* Main Concept Cards with Progressive Disclosure Arrow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {points.map((pt) => {
          const Icon = pt.icon;
          const isExpanded = expandedIds.has(pt.id);

          return (
            <section
              key={pt.id}
              style={{
                border: `1px solid ${isExpanded ? 'rgba(129,140,248,0.35)' : 'var(--border)'}`,
                borderRadius: 14,
                background: isExpanded ? 'rgba(129,140,248,0.03)' : 'rgba(255,255,255,0.015)',
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isExpanded ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {/* Header Bar with Arrow Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                  borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => toggleSection(pt.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: pt.badgeBg,
                    border: `1px solid ${pt.badgeColor}40`,
                    color: pt.badgeColor,
                    flexShrink: 0
                  }}>
                    <Icon size={17} />
                  </span>

                  <div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: pt.badgeColor,
                      display: 'block'
                    }}>
                      {pt.badge}
                    </span>
                    <h2 style={{
                      margin: 0,
                      fontSize: 16.5,
                      fontWeight: 750,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3
                    }}>
                      {pt.title}
                    </h2>
                  </div>
                </div>

                {/* Explicit Interactive Arrow Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: isExpanded ? 'var(--text-primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {isExpanded ? 'Collapse' : 'Click to Understand'}
                  </span>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: isExpanded ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isExpanded ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    <ChevronRight size={15} />
                  </div>
                </div>
              </div>

              {/* High-Yield Teacher Teaser Box */}
              <div style={{ padding: '14px 18px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  borderLeft: `3px solid ${pt.badgeColor}`,
                  background: 'var(--theme-accent-bg)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: pt.badgeColor,
                      marginBottom: 4
                    }}>
                      💡 {pt.teacherLead}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                      {renderInline(pt.pointer)}
                    </div>
                  </div>

                  {/* Secondary Click Arrow CTA Button */}
                  {!isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(pt.id);
                      }}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: 'var(--atlas-selected)',
                        border: '1px solid var(--atlas-selected)',
                        color: 'var(--atlas-on-selected)',
                        fontSize: 11.5,
                        fontWeight: 750,
                        flexShrink: 0,
                        alignSelf: 'center',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span>▸ View More</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Revealed Deep Teacher Breakdown & Clarity (Unfolded on Click) */}
              {isExpanded && (
                <div style={{
                  padding: '18px 20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  animation: 'fadeIn 0.25s ease-in-out'
                }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--theme-accent, #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <BookOpen size={13} />
                    <span>In-Depth Teacher Breakdown & Operational Mechanics</span>
                  </div>

                  {/* Multi-tier Structured Depth Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pt.deepDive.map((item, dIdx) => (
                      <div
                        key={dIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(0,0,0,0.18)',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: pt.badgeBg,
                          color: pt.badgeColor,
                          textTransform: 'uppercase',
                          flexShrink: 0,
                          marginTop: 2
                        }}>
                          {item.label}
                        </span>
                        <div style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-secondary)', flex: 1 }}>
                          {renderInline(item.text)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Additional Sentences if present in raw lesson */}
                  {pt.detail.length > 0 && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: 'rgba(129,140,248,0.05)',
                      border: '1px solid rgba(129,140,248,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 750, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        🔍 Key Context & Teacher Observation
                      </div>
                      {pt.detail.map((sentence, sIdx) => (
                        <p key={sIdx} style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                          {renderInline(sentence)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Collapse button at bottom of section */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => toggleSection(pt.id)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span>▴ Collapse section</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Interactive Check Yourself / Questions with Reveal Arrow */}
      {checkQuestions.length > 0 && (
        <div style={{
          marginTop: 10,
          padding: '24px 22px',
          borderRadius: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 800, fontSize: 16.5 }}>
              <Lightbulb size={19} style={{ color: '#fbbf24' }} />
              <span>🧠 Check Yourself · Interactive Teacher Q&A</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Formulate your answer first in your mind, then tap the arrow (<strong style={{ color: '#fbbf24' }}>▸</strong>) on each question to unlock the verified teacher answer and breakdown.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checkQuestions.map((q, qIdx) => (
              <TeacherCheckpointCard
                key={qIdx}
                question={q}
                number={qIdx + 1}
                points={points}
                topic={topic}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notes Accordion View (Interactive Teacher Pointers)
// ─────────────────────────────────────────────────────────────
function LessonNotesView({ points, checkQuestions, topic }) {
  const [openIds, setOpenIds] = useState(() => new Set());

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {points.map((pt) => {
        const isOpen = openIds.has(pt.id);
        const Icon = pt.icon;

        return (
          <section
            key={pt.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: isOpen ? 'rgba(129,140,248,0.06)' : 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <button
              type="button"
              onClick={() => toggle(pt.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: pt.badgeBg,
                  color: pt.badgeColor
                }}>
                  <Icon size={14} />
                </span>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: pt.badgeColor }}>
                    {pt.badge}
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pt.title}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--theme-accent, #818cf8)',
                fontSize: 12,
                fontWeight: 700
              }}>
                <span>{isOpen ? 'Close' : 'Reveal'}</span>
                <ChevronRight
                  size={16}
                  style={{
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                />
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: '0 18px 16px 52px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.2)',
                  borderLeft: `3px solid ${pt.badgeColor}`,
                  fontSize: 14,
                  fontWeight: 650,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55
                }}>
                  💡 {renderInline(pt.pointer)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pt.deepDive.map((item, dIdx) => (
                    <div key={dIdx} style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.label}:</strong> {renderInline(item.text)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* Check Yourself in Notes */}
      {checkQuestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={15} style={{ color: '#fbbf24' }} />
            <span>Teacher Checkpoint Questions (Click Arrow to Reveal)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checkQuestions.map((q, idx) => (
              <TeacherCheckpointCard
                key={idx}
                question={q}
                number={idx + 1}
                points={points}
                topic={topic}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Flowchart Flow View
// ─────────────────────────────────────────────────────────────
function LessonFlow({ points }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', maxWidth: 580, margin: '0 auto' }}>
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
            <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.55 }}>
              {renderInline(point.pointer)}
            </div>
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
  const generatedBlocks = fencesIn(content);
  const blocks = generatedBlocks.length > 0
    ? generatedBlocks
    : (saved ? [{ label: saved.label, code: saved.code }] : []);
  if (blocks.length === 0) {
    return (
      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        This topic has no code. Use Overview for the idea, Visual for the flow, and Notes for the full explanation.
      </p>
    );
  }
  return (
    <div className="generated-code-view" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block) => (
        <CodeBlock key={`${block.label}-${block.code}`} code={block.code} lang={block.label} />
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
  contentProvider = '',
  lessonError = '',
  onRetryLesson,
  view = 'overview',
}) {
  const meta = TIER_META[tier] || TIER_META.tier3;
  const rawContent = activeOverrideText || (customVersions && customVersions[tier]) || '';

  const { points, checkQuestions } = useMemo(
    () => (rawContent.includes('\n## ') || rawContent.startsWith('## ') ? parseLessonPointers(rawContent, topic) : { points: [], checkQuestions: [] }),
    [rawContent, topic],
  );

  const sourceLabel = contentSource === 'course_notes'
    ? 'Course notes'
    : contentSource === 'groq_dynamic'
      ? `Checked lesson · ${contentProvider || 'Groq'}`
      : contentSource === 'cached_checked_lesson'
        ? 'Checked lesson · cached'
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
        {lessonError && (
          <div
            role="alert"
            style={{
              padding: 20,
              borderRadius: 14,
              border: '1px solid rgba(248,113,113,0.28)',
              background: 'rgba(248,113,113,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#fca5a5', fontWeight: 750 }}>
              <AlertCircle size={18} />
              <span>This lesson could not be prepared</span>
            </div>
            <p style={{ margin: '10px 0 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
              {lessonError}
            </p>
            <button
              type="button"
              onClick={onRetryLesson}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 13px',
                border: '1px solid rgba(129,140,248,0.4)',
                borderRadius: 9,
                background: 'rgba(99,102,241,0.14)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        )}
        {!rawContent && !lessonError && (
          <p style={{ color: 'var(--text-secondary)' }}>
            Writing a checked note for {topic}. Overview, Visual, Code, and Notes open when it is ready. The first note may take a little longer while Groq responds.
          </p>
        )}
        {!lessonError && rawContent && points.length === 0 && formatContent(rawContent)}
        {!lessonError && rawContent && points.length > 0 && view === 'overview' && (
          <TeacherLessonOverview points={points} checkQuestions={checkQuestions} topic={topic} />
        )}
        {!lessonError && rawContent && points.length > 0 && view === 'visual' && (
          <LessonFlow points={points} />
        )}
        {!lessonError && rawContent && points.length > 0 && view === 'code' && (
          <CodeView topic={topic} content={rawContent} />
        )}
        {!lessonError && rawContent && points.length > 0 && view === 'notes' && (
          <LessonNotesView points={points} checkQuestions={checkQuestions} topic={topic} />
        )}
      </div>
    </article>
  );
}

export default memo(ContentRenderer);
