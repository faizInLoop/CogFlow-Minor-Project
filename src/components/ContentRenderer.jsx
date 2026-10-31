import { useState, useMemo, useRef, useEffect, memo } from 'react';
import { 
  Sparkles, BookOpen, Quote, ChevronRight, Layers, Copy, Check, 
  Activity, ArrowRight, Database, Cpu, HardDrive, RefreshCw, Eye, Info,
  Maximize2, Minimize2, Image as ImageIcon, Workflow, Compass, Atom, Orbit, 
  ShieldCheck, Download, FileText, Share2
} from 'lucide-react';
import { getContent } from '../data/subjects';

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
function CanvasFlowchart({ nodes, activeIndex, onSelectNode, onCanvasReady }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (onCanvasReady) onCanvasReady(canvas);
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement ? canvas.parentElement.clientWidth - 40 : 800;
    const height = 240;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let packetProgress = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const nodeCount = nodes.length;
      const paddingX = 20;
      const gap = Math.max(16, Math.min(30, (width - paddingX * 2 - nodeCount * 170) / (nodeCount - 1)));
      const cardWidth = Math.max(150, Math.min(190, (width - paddingX * 2 - gap * (nodeCount - 1)) / nodeCount));
      const cardHeight = 155;
      const startY = (height - cardHeight) / 2;
      const totalWidth = nodeCount * cardWidth + (nodeCount - 1) * gap;
      const startX = Math.max(paddingX, (width - totalWidth) / 2);

      // 1. Draw connecting tracks and animated data packets
      for (let i = 0; i < nodeCount - 1; i++) {
        const x1 = startX + i * (cardWidth + gap) + cardWidth;
        const y1 = startY + cardHeight / 2;
        const x2 = startX + (i + 1) * (cardWidth + gap);
        const y2 = y1;

        // Base dashed track
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.28)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated glowing data particle
        packetProgress = (packetProgress + 0.003) % 1;
        const px = x1 + (x2 - x1) * packetProgress;
        ctx.beginPath();
        ctx.arc(px, y1, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Directional Chevron
        ctx.beginPath();
        ctx.moveTo(x2 - 7, y1 - 4);
        ctx.lineTo(x2 - 1, y1);
        ctx.lineTo(x2 - 7, y1 + 4);
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 2. Draw Stage Cards
      nodes.forEach((node, i) => {
        const x = startX + i * (cardWidth + gap);
        const y = startY;
        const isSelected = i === activeIndex;

        // Card body
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, 14);
        ctx.fillStyle = isSelected ? '#151724' : '#0e1017';
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#818cf8' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = isSelected ? 2 : 1;
        if (isSelected) {
          ctx.shadowColor = 'rgba(99, 102, 241, 0.45)';
          ctx.shadowBlur = 14;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Step tag pill
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 14, 54, 18, 5);
        ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fill();

        ctx.fillStyle = isSelected ? '#a5b4fc' : '#64748b';
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText(`STEP 0${i + 1}`, x + 17, y + 27);

        // Icon
        ctx.font = '16px system-ui, Apple Color Emoji, Segoe UI Emoji';
        ctx.fillText(node.icon || '⚡', x + cardWidth - 28, y + 29);

        // Node Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12.5px Inter, system-ui, sans-serif';
        const parts = (node.label || '').split('. ');
        const displayLabel = parts[1] || parts[0];
        const words = displayLabel.split(' ');
        const line1 = words.slice(0, 2).join(' ');
        const line2 = words.slice(2, 4).join(' ');
        ctx.fillText(line1, x + 12, y + 60);
        if (line2) ctx.fillText(line2, x + 12, y + 78);

        // Subtitle / invariant
        ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
        ctx.font = '10px monospace';
        const formulaStr = (node.formula || '').slice(0, 22);
        ctx.fillText(formulaStr, x + 12, y + 104);

        // Progress bar indicator
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 124, cardWidth - 24, 4, 2);
        ctx.fillStyle = isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [nodes, activeIndex, onCanvasReady]);

  // Click handler to select node on canvas
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const nodeCount = nodes.length;
    const width = canvas.clientWidth;
    const paddingX = 20;
    const gap = Math.max(16, Math.min(30, (width - paddingX * 2 - nodeCount * 170) / (nodeCount - 1)));
    const cardWidth = Math.max(150, Math.min(190, (width - paddingX * 2 - gap * (nodeCount - 1)) / nodeCount));
    const totalWidth = nodeCount * cardWidth + (nodeCount - 1) * gap;
    const startX = Math.max(paddingX, (width - totalWidth) / 2);

    nodes.forEach((_, i) => {
      const x = startX + i * (cardWidth + gap);
      if (clickX >= x && clickX <= x + cardWidth) {
        onSelectNode(i);
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      title="Interactive Canvas Flowchart: Click any stage to inspect"
      style={{
        width: '100%',
        height: 240,
        display: 'block',
        cursor: 'pointer'
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Interactive Diagrammatic Studio & Vector Suite
// ─────────────────────────────────────────────────────────────
function InteractiveDiagramSuite({ topic, tier, customImageUrl, fullContent }) {
  const [selectedNode, setSelectedNode] = useState(0);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'blueprint'
  const [showAiImage, setShowAiImage] = useState(false);
  const activeCanvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');
  const svgRef = useRef(null);

  // Pedagogical domain model supporting all curricula
  const diagramData = useMemo(() => {
    const t = (topic || '').toLowerCase();

    // 0. Adversarial Search, Minimax & Game Theory
    if (t.includes('minimax') || t.includes('game tree') || t.includes('alpha-beta') || t.includes('alpha beta') || t.includes('adversarial') || t.includes('game theory') || t.includes('chess') || t.includes('search tree')) {
      return {
        title: `${topic} — Adversarial Search & Decision Pipeline`,
        category: 'Game Theory & Search Architecture',
        nodes: [
          { label: '1. Root Game State', sub: 'Initial Position S_0', formula: 'Utility v = 0', desc: 'Current board configuration and legal move generator for the active player.', icon: '♟️' },
          { label: '2. Game Tree Expansion', sub: 'Branching Factor b^d', formula: 'DFS Traversal', desc: 'Recursive depth-first traversal generating possible future moves across game plies.', icon: '🌳' },
          { label: '3. Min/Max Payoffs', sub: 'Adversarial Valuation', formula: 'max(children) / min', desc: 'Propagates terminal leaf evaluations up the tree assuming optimal opponent play.', icon: '⚖️' },
          { label: '4. Alpha-Beta Cutoff', sub: 'Pruning Optimization', formula: 'α ≥ β Bound', desc: 'Prunes redundant branches where α >= β, reducing time complexity from O(b^d) to O(b^{d/2}).', icon: '⚡' }
        ]
      };
    }


    // 1. Physics / Newton's Laws / Mechanics
    if (t.includes('newton') || t.includes('motion') || t.includes('gravity') || t.includes('gravitation') || t.includes('force') || t.includes('physics') || t.includes('mechanic') || t.includes('momentum') || t.includes('velocity')) {
      return {
        title: 'Newtonian Dynamics & Gravitational Field Schema',
        category: 'Physics & Mechanics',
        nodes: [
          { label: '1. Inertia & Mass', sub: 'First Law: ∑F = 0', formula: 'v = constant', desc: 'A body maintains zero acceleration and uniform velocity unless acted upon by an external net unbalanced force vector.', icon: '🛑' },
          { label: '2. Force & Acceleration', sub: 'Second Law: F = m·a', formula: 'F = dp/dt', desc: 'Dynamic net force directly accelerates mass; acceleration is collinear with applied net force and inversely proportional to inertial mass.', icon: '🚀' },
          { label: '3. Action & Reaction', sub: 'Third Law: F_AB = -F_BA', formula: 'Equal & Opposite', desc: 'Forces invariably occur in reciprocal collinear pairs. No isolated force can exist in nature without generating an equal and opposite reaction.', icon: '⚖️' },
          { label: '4. Universal Gravitation', sub: 'Inverse Square Law', formula: 'F_g = G·(m1·m2)/r²', desc: 'Universal gravitational attraction between masses governs planetary orbits, trajectory curvature, and gravitational spacetime wells.', icon: '🌌' }
        ]
      };
    }

    // 2. Data Structures & Memory Hierarchy
    if (t.includes('data structure') || t.includes('memory') || t.includes('array') || t.includes('tree') || t.includes('hash') || t.includes('stack') || t.includes('queue') || t.includes('algorithm')) {
      return {
        title: 'Memory Hierarchy & Computational Invariants',
        category: 'Computer Systems',
        nodes: [
          { label: 'CPU Registers', sub: 'L1/L2 Cache (0.5ns)', formula: 'O(1) Access', desc: 'Ultra-fast hardware registers storing active pointer references and scalar operands.', icon: '⚡' },
          { label: 'Cache Line (64B)', sub: 'Spatial Locality', formula: 'Continuous RAM', desc: 'Hardware pulls 64-byte aligned contiguous chunks into L3 cache lines to minimize memory bus wait states.', icon: '📦' },
          { label: 'Primary RAM', sub: 'Page Table & TLB', formula: 'O(1) Amortized', desc: 'Virtual memory pages (4KB) mapped to physical frames via MMU translation and TLB caching.', icon: '🧠' },
          { label: 'Disk / NVMe WAL', sub: 'Storage Persistence', formula: 'Durable fsync', desc: 'Write-ahead log buffer flushed via atomic fsync for durable ACID consistency guarantees.', icon: '💾' }
        ]
      };
    }

    // 3. Modern AI, Deep Learning & Transformers
    if (t.includes('ai') || t.includes('machine learning') || t.includes('transformer') || t.includes('neural') || t.includes('llm') || t.includes('model')) {
      return {
        title: 'Transformer Attention & Tensor Flow Engine',
        category: 'Machine Learning',
        nodes: [
          { label: 'Token Projections', sub: 'Input Embedding Space', formula: 'd_model Dimensions', desc: 'High-dimensional vector representations capturing semantic, lexical, and positional relationships.', icon: '🔤' },
          { label: 'Multi-Head Attention', sub: 'Q, K, V Matrices', formula: 'Softmax(QK^T / √d_k)V', desc: 'Scales dot-product affinity matrices to compute dynamic context weights across token sequences.', icon: '🔍' },
          { label: 'Feed-Forward (FFN)', sub: 'SwiGLU & Non-Linearity', formula: 'Intermediate Expansion', desc: 'Expands intermediate dimension (4x d_model) for factual knowledge retrieval and synthesis.', icon: '⚙️' },
          { label: 'Softmax Logits', sub: 'Probability Distribution', formula: 'Temperature Scaling', desc: 'Final linear projection converted to probability distribution over token vocabulary.', icon: '📊' }
        ]
      };
    }

    // 4. Early Foundations / Phonics / Kindergarten (LKG & UKG)
    if (t.includes('phonics') || t.includes('alphabet') || t.includes('lkg') || t.includes('ukg') || t.includes('rhyme') || t.includes('letter') || t.includes('sound')) {
      return {
        title: 'Wonder Discovery Map & Phonics Journey',
        category: 'Early Foundations',
        nodes: [
          { label: '1. Listen & Echo', sub: 'Letter Sounds (A-Z)', formula: 'Clear Sounds', desc: 'Listening carefully to musical letter sounds and echoing them with big joyful smiles!', icon: '🔤' },
          { label: '2. Blending Fun', sub: 'Sound Friends (C-A-T)', formula: 'Word Building', desc: 'Connecting single letter sounds like colorful puzzle blocks to make real words!', icon: '🧩' },
          { label: '3. Rhyme & Rhythm', sub: 'Word Echoes', formula: 'Fun Rhymes', desc: 'Noticing matching sound families like Cat, Hat, Bat and singing along!', icon: '🎵' },
          { label: '4. Star Reader!', sub: 'Story Adventure', formula: 'Mastery Star 🌟', desc: 'Reading real sentences with proud confidence and collecting your superpower badge!', icon: '🌟' }
        ]
      };
    }

    // 5. Biology, Photosynthesis & Natural Life
    if (t.includes('cell') || t.includes('bio') || t.includes('photosynthesis') || t.includes('dna') || t.includes('gene') || t.includes('plant') || t.includes('animal')) {
      return {
        title: 'Cellular Energetics & Bio-Molecular Cycle',
        category: 'Biology & Life Sciences',
        nodes: [
          { label: '1. Influx & Absorption', sub: 'Lipid Bilayer & Sunlight', formula: 'Selective Influx', desc: 'Nutrients, sunlight photons, or chemical signals cross the semi-permeable cell boundary.', icon: '☀️' },
          { label: '2. Catalytic Synthesis', sub: 'Enzymatic Transition', formula: 'Active Sites', desc: 'Biological catalysts lower activation energy barriers to power synthesis smoothly.', icon: '🔬' },
          { label: '3. Chemical Energy', sub: 'ATP / ADP Energy Cycle', formula: 'ADP + Pi → ATP', desc: 'Potential energy stored in high-energy chemical bonds powers active cellular work.', icon: '⚡' },
          { label: '4. Cellular Growth', sub: 'Homeostatic Balance', formula: 'Equilibrium', desc: 'Sustains metabolic balance, replication, and biological vitality across generations.', icon: '🌱' }
        ]
      };
    }

    // 6. Universal First-Principles Model
    return {
      title: `${topic} — Architecture & Operational Blueprint`,
      category: 'First-Principles Blueprint',
      nodes: [
        { label: '1. Boundary Invariant', sub: 'Initial State & Protocol', formula: 'Input Invariant', desc: 'System boundary conditions verified to enforce safety and deterministic outcomes.', icon: '📥' },
        { label: '2. Core Transformation', sub: 'State Engine Mechanics', formula: 'Transformation', desc: 'Applies deterministic transitions and preserves system structural invariants.', icon: '⚙️' },
        { label: '3. Optimization Path', sub: 'Low-Latency Pipeline', formula: 'Scalability', desc: 'Processes payloads efficiently while minimizing overhead and cognitive latency.', icon: '⚡' },
        { label: '4. Stable Outcome', sub: 'Durable Commitment', formula: 'Verified State', desc: 'Committed equilibrium state delivered with predictable, reliable outcomes.', icon: '✅' }
      ]
    };
  }, [topic]);

  const activeNode = diagramData.nodes[selectedNode] || diagramData.nodes[0];
  const illustrationUrl = useMemo(() => getEducationalImageUrl(topic, customImageUrl), [topic, customImageUrl]);

  // Client-Side Download: Diagram SVG
  const handleDownloadSvg = () => {
    const filename = `${topic.replace(/[^a-zA-Z0-9_-]/g, '_')}-Diagram.svg`;
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="1000" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090c"/>
      <stop offset="100%" stop-color="#14141c"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="500" fill="url(#bgGrad)" rx="16"/>
  <text x="40" y="50" fill="#ffffff" font-family="system-ui, sans-serif" font-size="22" font-weight="bold">${diagramData.title}</text>
  <text x="40" y="78" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">${diagramData.category} · CogFlow Architecture Studio</text>
  
  <!-- Flow Line -->
  <line x1="80" y1="230" x2="920" y2="230" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,6" opacity="0.4"/>
  
  <!-- 4 Stage Blocks -->
  ${diagramData.nodes.map((node, i) => {
    const x = 50 + i * 230;
    return `
    <g transform="translate(${x}, 150)">
      <rect width="210" height="160" rx="12" fill="#181a24" stroke="#6366f1" stroke-width="1.5"/>
      <text x="16" y="32" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">${node.formula}</text>
      <text x="16" y="58" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">${node.label}</text>
      <text x="16" y="80" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11.5">${node.sub}</text>
      <text x="16" y="110" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="10.5" width="180">${node.desc.slice(0, 55)}...</text>
    </g>
    `;
  }).join('')}
  
  <text x="40" y="460" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">Generated dynamically by CogFlow AI · Vector Format · High-Resolution Educational Model</text>
</svg>`;

    triggerFileDownload(filename, svgContent, 'image/svg+xml;charset=utf-8');
    setDownloadNotice('✅ Vector SVG Diagram downloaded!');
    setTimeout(() => setDownloadNotice(''), 3500);
  };

  // Client-Side Download: High-Res Diagram PNG (Exports live Canvas or 1200x630 Vector Blueprint)
  const handleDownloadPng = () => {
    // If on active Canvas Flowchart view, export live canvas frame directly
    if (viewMode === 'canvas' && activeCanvasRef.current) {
      try {
        const liveUrl = activeCanvasRef.current.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = liveUrl;
        a.download = `${topic.replace(/[^a-zA-Z0-9_-]/g, '_')}-Flowchart-Canvas.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadNotice('✅ Interactive Canvas Flowchart exported as PNG!');
        setTimeout(() => setDownloadNotice(''), 3500);
        return;
      } catch (err) {
        console.warn('Live canvas export fallback to presentation canvas', err);
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = '#09090c';
    ctx.fillRect(0, 0, 1200, 630);

    // Title & Category
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.fillText(diagramData.title, 50, 65);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText(`${diagramData.category} · CogFlow Architecture Studio`, 50, 100);

    // Draw 4 cards
    diagramData.nodes.forEach((node, i) => {
      const x = 50 + i * 275;
      const y = 170;
      ctx.fillStyle = '#14141c';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, 255, 230, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(node.formula, x + 20, y + 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText(node.label, x + 20, y + 75);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText(node.sub, x + 20, y + 105);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(node.desc.slice(0, 32), x + 20, y + 145);
      ctx.fillText(node.desc.slice(32, 65), x + 20, y + 168);
    });

    // Watermark footer
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText('CogFlow AI Universal Adaptive Learning · Open Source Architecture Model', 50, 580);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `${topic.replace(/[^a-zA-Z0-9_-]/g, '_')}-Diagram.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadNotice('✅ High-Resolution PNG Diagram downloaded!');
    setTimeout(() => setDownloadNotice(''), 3500);
  };

  // Client-Side Download: Full Markdown Study Notes
  const handleDownloadNotes = () => {
    const filename = `${topic.replace(/[^a-zA-Z0-9_-]/g, '_')}-StudyGuide.md`;
    const studyDoc = `# ${topic} — Complete Study Guide & Architecture Notes
**Curriculum Domain**: ${diagramData.category}
**Adaptive Tier**: ${tier.toUpperCase()}
**Generated by**: CogFlow Universal Adaptive Learning Engine

---

## 1. Executive Conceptual Overview
${diagramData.title}

### Core Architectural Stages:
${diagramData.nodes.map(n => `- **${n.label}** (${n.sub}): ${n.desc} [Invariant: \`${n.formula}\`]`).join('\n')}

---

## 2. Complete Lesson Synthesis
${fullContent || 'Detailed conceptual synthesis provided in CogFlow Cockpit.'}

---
*Exported directly from CogFlow Cockpit for offline study and revision.*
`;

    triggerFileDownload(filename, studyDoc, 'text/markdown;charset=utf-8');
    setDownloadNotice('✅ Full Markdown Study Guide downloaded!');
    setTimeout(() => setDownloadNotice(''), 3500);
  };

  return (
    <div style={{
      margin: '22px 0 30px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4), 0 0 25px var(--theme-accent-bg, rgba(99,102,241,0.1))',
      transition: 'all 0.3s ease'
    }}>
      {/* ── Top Diagrammatic Suite Toolbar ── */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Title & Domain Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--theme-accent-bg, rgba(99,102,241,0.15))',
            border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.3))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--theme-accent, #818cf8)'
          }}>
            <Workflow size={17} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              {diagramData.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Interactive Visual Studio · {diagramData.category}
            </div>
          </div>
        </div>

        {/* Center: Mode Tabs + User-Requested On-Demand AI Image Generator Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '2px',
            gap: 2
          }}>
            <button
              onClick={() => setViewMode('canvas')}
              style={{
                all: 'unset',
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: viewMode === 'canvas' ? 700 : 500,
                padding: '4px 11px',
                borderRadius: 6,
                background: viewMode === 'canvas' ? 'var(--theme-accent-bg)' : 'transparent',
                color: viewMode === 'canvas' ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ Canvas Flowchart
            </button>
            <button
              onClick={() => setViewMode('blueprint')}
              style={{
                all: 'unset',
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: viewMode === 'blueprint' ? 700 : 500,
                padding: '4px 11px',
                borderRadius: 6,
                background: viewMode === 'blueprint' ? 'var(--theme-accent-bg)' : 'transparent',
                color: viewMode === 'blueprint' ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              📐 Vector Blueprint
            </button>
          </div>

          {/* User Button: On-Demand Image Generation */}
          <button
            onClick={() => setShowAiImage(prev => !prev)}
            title="Generate and view AI educational illustration on demand"
            className={`btn ${showAiImage ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{
              fontSize: 11.5,
              gap: 6,
              padding: '4px 12px',
              borderRadius: 8,
              fontWeight: 700,
              border: showAiImage ? '1px solid var(--theme-accent, #818cf8)' : '1px solid var(--border)',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={13} style={{ color: showAiImage ? '#ffffff' : 'var(--theme-accent, #818cf8)' }} />
            <span>{showAiImage ? '✕ Hide Concept Image' : '✨ Generate Concept Image'}</span>
          </button>
        </div>

        {/* Right: Client-Side Download Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleDownloadSvg}
            title="Download clean Vector SVG diagram directly"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, gap: 5, padding: '4px 9px', borderRadius: 6 }}
          >
            <Download size={12} />
            <span>SVG</span>
          </button>

          <button
            onClick={handleDownloadPng}
            title="Download 1200x630 high-resolution PNG diagram"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, gap: 5, padding: '4px 9px', borderRadius: 6 }}
          >
            <ImageIcon size={12} />
            <span>PNG</span>
          </button>

          <button
            onClick={handleDownloadNotes}
            title="Download full Markdown study guide & notes"
            className="btn btn-primary btn-sm"
            style={{ fontSize: 11, gap: 5, padding: '4px 10px', borderRadius: 6 }}
          >
            <FileText size={12} />
            <span>Notes (.md)</span>
          </button>
        </div>
      </div>

      {/* Download Alert Toast */}
      {downloadNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '6px 18px',
          fontSize: 12,
          fontWeight: 700,
          color: '#34d399',
          textAlign: 'center'
        }}>
          {downloadNotice}
        </div>
      )}

      {/* ── Optional High-Res AI Image (Shown ONLY if user clicked 'Generate Concept Image') ── */}
      {showAiImage && (
        <div style={{
          position: 'relative',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {!imageLoaded && (
            <div style={{
              height: 260,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'var(--bg-secondary)'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--theme-accent, #818cf8)',
                animation: 'spin 0.9s linear infinite'
              }} />
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Generating high-resolution concept illustration for {topic}...
              </span>
            </div>
          )}

          <img
            src={illustrationUrl}
            alt={`Generated AI Concept Model for ${topic}`}
            onLoad={() => setImageLoaded(true)}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.4s ease'
            }}
          />

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '8px 18px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: '#ffffff'
          }}>
            <span>Visual Concept Generated on demand for <strong>{topic}</strong></span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>4K Scientific Vector Model</span>
          </div>
        </div>
      )}

      {/* ── View Mode 1: Interactive HTML5 Canvas Flowchart (Default) ── */}
      {viewMode === 'canvas' && (
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HTML5 Canvas Flowchart · Click any stage to inspect invariants
            </span>
            <span style={{ fontSize: 11, color: 'var(--theme-accent, #818cf8)', fontWeight: 700 }}>
              Active Stage: {selectedNode + 1} of {diagramData.nodes.length}
            </span>
          </div>

          {/* Real HTML5 Canvas Engine */}
          <CanvasFlowchart 
            nodes={diagramData.nodes} 
            activeIndex={selectedNode} 
            onSelectNode={setSelectedNode} 
            onCanvasReady={(c) => { activeCanvasRef.current = c; }}
          />

          {/* Active Node Detailed Inspector Card */}
          <div style={{
            marginTop: 14,
            padding: '14px 18px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Info size={18} style={{ color: 'var(--theme-accent, #818cf8)', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)', marginRight: 8, fontSize: 13.5 }}>{activeNode.label}:</strong>
              {activeNode.desc}
            </div>
          </div>
        </div>
      )}

      {/* ── View Stage 1: Interactive Vector Blueprint ── */}
      {viewMode === 'blueprint' && (
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Click any block to inspect invariants & mechanics
            </span>
            <span style={{ fontSize: 11, color: 'var(--theme-accent, #818cf8)', fontWeight: 700 }}>
              Node {selectedNode + 1} of {diagramData.nodes.length}
            </span>
          </div>

          {/* Interactive Node Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16
          }}>
            {diagramData.nodes.map((node, i) => {
              const isSelected = selectedNode === i;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedNode(i)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    padding: '14px 16px',
                    background: isSelected 
                      ? 'var(--theme-accent-bg, rgba(99,102,241,0.18))' 
                      : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${isSelected ? 'var(--theme-accent, #818cf8)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isSelected ? '0 0 16px var(--theme-accent-bg, rgba(99,102,241,0.25))' : 'none',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{node.icon}</span>
                    <ComplexityBadge text={node.formula} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: isSelected ? 'var(--theme-accent, #818cf8)' : 'var(--text-muted)' }}>
                    {node.sub}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Inspector Box for Active Node */}
          <div style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Info size={18} style={{ color: 'var(--theme-accent, #818cf8)', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)', marginRight: 8, fontSize: 13.5 }}>{activeNode.label}:</strong>
              {activeNode.desc}
            </div>
          </div>
        </div>
      )}

      {/* ── View Stage 2: Operational Flowchart Pipeline ── */}
      {viewMode === 'flowchart' && (
        <div style={{ padding: '24px 20px', overflowX: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            minWidth: 700,
            padding: '12px 10px'
          }}>
            {diagramData.nodes.map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{node.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--theme-accent, #818cf8)', textTransform: 'uppercase' }}>
                      Step 0{i + 1}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {node.sub}
                  </div>
                </div>

                {i < diagramData.nodes.length - 1 && (
                  <ArrowRight size={18} style={{ color: 'var(--theme-accent, #818cf8)', opacity: 0.6, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 12 }}>
            Deterministic State Sequence: Each state transition guarantees structural invariants without loss.
          </div>
        </div>
      )}

      {/* ── View Stage 3: Curated High-Res Concept Visual Model ── */}
      {viewMode === 'illustration' && (
        <div style={{ position: 'relative', background: 'var(--bg-secondary)', minHeight: 280, maxHeight: 420, overflow: 'hidden' }}>
          {!imageLoaded && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'var(--bg-secondary)'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--theme-accent, #818cf8)',
                animation: 'spin 0.9s linear infinite'
              }} />
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Loading high-resolution scientific model...</span>
            </div>
          )}

          <img
            src={illustrationUrl}
            alt={`Curated Visual Model for ${topic}`}
            onLoad={() => setImageLoaded(true)}
            style={{
              width: '100%',
              height: '340px',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '10px 18px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11.5, color: '#ffffff'
          }}>
            <span>Curated Scientific Asset for <strong>{topic}</strong></span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>100% Free CDN · Zero Ads</span>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Markdown Image tag: ![alt](url)
    if (/^!\[(.*?)\]\((.*?)\)/.test(trimmed)) {
      const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
      const alt = match[1] || 'Educational Diagram';
      const rawSrc = match[2];
      const safeSrc = rawSrc.includes('pollinations.ai') ? getEducationalImageUrl(alt) : rawSrc;
      elements.push(
        <figure key={`fig-${i}`} style={{
          margin: '24px 0',
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          <img src={safeSrc} alt={alt} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} loading="lazy" />
          {alt && (
            <figcaption style={{
              padding: '10px 16px',
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Sparkles size={12} style={{ color: 'var(--theme-accent, #818cf8)' }} />
              {alt}
            </figcaption>
          )}
        </figure>
      );
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

// ─────────────────────────────────────────────────────────────
// Main ContentRenderer Component
// ─────────────────────────────────────────────────────────────
function ContentRenderer({
  tier,
  topic,
  customVersions = null,
  activeOverrideText = null,
  contentSource = null,
  imageUrl = null,
}) {
  const meta = TIER_META[tier] || TIER_META.tier3;
  const rawContent = activeOverrideText || (customVersions && customVersions[tier]) || getContent(topic, tier);

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
            {contentSource === 'ollama_qwen_dynamic' ? 'Dynamic Qwen 2.5 Local AI' : 'Cognitive Adaptive Engine'}
          </span>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {topic}
        </div>
      </div>

      {/* ── Interactive Diagrammatic Studio & Vector Suite ── */}
      <InteractiveDiagramSuite 
        topic={topic} 
        tier={tier} 
        customImageUrl={imageUrl} 
        fullContent={rawContent} 
      />

      {/* ── Formatted Body Content ── */}
      <div style={{ fontSize: 15, lineHeight: 1.75 }}>
        {formatContent(rawContent)}
      </div>
    </article>
  );
}


export default memo(ContentRenderer);
