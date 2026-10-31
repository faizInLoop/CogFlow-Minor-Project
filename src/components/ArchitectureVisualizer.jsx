import { useState } from 'react';
import { Cpu, ShieldCheck, Database, Layers, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const NODES = [
  {
    id: 'vision',
    title: 'Tier 1: Biometric Edge Mesh',
    subtitle: 'Browser expression net',
    icon: <Cpu size={20} color="var(--indigo-light)" />,
    color: '#818cf8',
    stats: { latency: '12 ms', throughput: '60 FPS', privacy: '100% In-Memory' },
    details: [
      'Reads seven expression channels in the browser: angry, disgust, fear, happy, sad, surprise, and neutral.',
      'Builds the same 11-frame summary used to train the DAiSEE model.',
      'The camera stream never leaves the browser.',
    ]
  },
  {
    id: 'bilstm',
    title: 'Tier 2: Temporal Inference Engine',
    subtitle: 'DAiSEE TensorFlow.js classifier',
    icon: <Zap size={20} color="#34d399" />,
    color: '#34d399',
    stats: { latency: '18 ms', modelSize: '4.2 MB', window: '30s Sustained' },
    details: [
      'Classifies each 28-number expression window as flow, overload, or boredom.',
      'Waits for 30 seconds of the same state before suggesting an easier or harder lesson.',
      'Reports a probability for each of the three learning states.'
    ]
  },
  {
    id: 'rag',
    title: 'Tier 3: Dynamic Knowledge Synthesis',
    subtitle: 'Adaptive RAG Multi-Tier Engine',
    icon: <Database size={20} color="#fbbf24" />,
    color: '#fbbf24',
    stats: { levels: 'Tier 1, 3, 5', retrieval: '< 15 ms', format: 'Contextual Trees' },
    details: [
      'Retrieves curriculum documents chunked across three calibrated depth abstraction layers.',
      'Tier 1 provides bullet analogies; Tier 3 standard technical documentation; Tier 5 deep mathematical proofs.',
      'Adaptations are proposed as unobtrusive suggestions, preserving learner autonomy.'
    ]
  }
];

export default function ArchitectureVisualizer() {
  const [selectedNode, setSelectedNode] = useState('bilstm');

  const active = NODES.find(n => n.id === selectedNode) || NODES[0];

  const handleSelect = (id) => {
    sounds.playClick();
    setSelectedNode(id);
  };

  return (
    <div style={{
      background: 'rgba(10, 14, 26, 0.75)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '32px',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--indigo-light)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={13} />
          Distributed System Topology
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
          End-to-End Cognitive Feedback Pipeline
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
          Click any pipeline node to inspect runtime tensors, latency profiles, and isolation guarantees.
        </p>
      </div>

      {/* Nodes Row with connecting animated line */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24,
        position: 'relative'
      }}>
        {NODES.map((node) => {
          const isSelected = selectedNode === node.id;
          return (
            <div
              key={node.id}
              onClick={() => handleSelect(node.id)}
              style={{
                cursor: 'pointer',
                background: isSelected ? `${node.color}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? `${node.color}60` : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: isSelected ? `0 0 20px ${node.color}25` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${node.color}20`, border: `1px solid ${node.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {node.icon}
                </div>
                {isSelected && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: node.color, background: `${node.color}20`, padding: '2px 8px', borderRadius: 99 }}>
                    Active View
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                {node.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {node.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspector Panel for Selected Node */}
      <div style={{
        background: 'rgba(7,9,14,0.7)',
        border: `1px solid ${active.color}35`,
        borderRadius: 12,
        padding: '22px',
        transition: 'border-color 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: active.color, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{active.title}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {active.subtitle}</span>
          </div>

          {/* Metric Chips */}
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(active.stats).map(([k, v]) => (
              <span key={k} style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', color: '#c7d2fe', border: '1px solid var(--border)'
              }}>
                {k.toUpperCase()}: <strong style={{ color: '#fff' }}>{v}</strong>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.details.map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <CheckCircle2 size={14} color={active.color} style={{ flexShrink: 0, marginTop: 3 }} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

