// ============================================================
// CogFlow Universal Learning Universe
// Covers Early Childhood (LKG/UKG), Primary (1-5), Middle/High School (6-12),
// Computer Systems, AI, Cloud, Cybersecurity, Math, Finance & Humanities.
// Also supports on-the-fly custom subject synthesis for ANY grade or domain.
// ============================================================

export const SUBJECTS = [
  // ── 1. EARLY CHILDHOOD: LKG & UKG ──
  {
    id: 'lkg-ukg',
    name: 'Early Foundations (LKG & UKG)',
    category: 'early-school',
    gradeLevel: 'LKG / UKG (Ages 3-5)',
    icon: '👶',
    color: 'emerald',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.22), rgba(16,185,129,0.12))',
    border: 'rgba(52,211,153,0.35)',
    desc: 'Fun phonics, alphabet sounds, numbers 1-50, colors, animals, and friendly nature stories.',
    topics: [
      {
        id: 'lkg-phonics',
        name: 'Alphabet Sounds & Phonics Adventures',
        subtopics: ['Letter Sounds A to Z', 'Vowels vs Consonants', 'Simple 3-Letter Words (CAT, DOG)', 'Fun Rhymes & Word Echoes']
      },
      {
        id: 'lkg-numbers',
        name: 'Counting, Numbers 1 to 50 & Shapes',
        subtopics: ['Counting from 1 to 20', 'Circles, Squares & Triangles', 'Comparing Big vs Small', 'Counting with Colorful Fruit']
      },
      {
        id: 'lkg-animals',
        name: 'Animals, Nature & Our Wonderful World',
        subtopics: ['Farm Animals & Friendly Pets', 'Wild Jungle Animals', 'Rainbow Colors & Sky', 'Seasons: Sunny, Rainy & Windy']
      },
      {
        id: 'lkg-habits',
        name: 'Daily Good Habits & Healthy Routines',
        subtopics: ['Brushing Teeth & Washing Hands', 'Healthy Fruits & Vegetables', 'Sharing & Saying Please & Thank You', 'Bedtime Stories & Rest']
      }
    ]
  },

  // ── 2. PRIMARY SCHOOL: CLASS 1 TO 5 ──
  {
    id: 'school-primary',
    name: 'Primary School (Class 1 to 5)',
    category: 'early-school',
    gradeLevel: 'Class 1 to 5 (Ages 6-10)',
    icon: '🎒',
    color: 'amber',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(217,119,6,0.12))',
    border: 'rgba(245,158,11,0.35)',
    desc: 'Foundational mathematics, the solar system, plant life, and exciting science adventures.',
    topics: [
      {
        id: 'prim-math',
        name: 'Math Explorers: Addition, Subtraction & Tables',
        subtopics: ['Two-Digit & Three-Digit Addition', 'Subtraction with Borrowing', 'Multiplication Tables 2 through 10', 'Word Problems & Real-World Buying']
      },
      {
        id: 'prim-solar',
        name: 'The Solar System & Space Wonders',
        subtopics: ['The Sun & 8 Orbiting Planets', 'Day & Night: Earth’s Rotation', 'The Moon Phases & Orbit', 'Gravity & Floating in Space']
      },
      {
        id: 'prim-nature',
        name: 'Plants, Photosynthesis & Animal Habitats',
        subtopics: ['Parts of a Plant (Root, Stem, Leaf)', 'How Plants Make Food with Sunlight', 'Carnivores, Herbivores & Omnivores', 'Food Chains in Nature']
      },
      {
        id: 'prim-water',
        name: 'The Amazing Water Cycle & Weather',
        subtopics: ['Evaporation: Water to Vapor', 'Condensation: Making Clouds', 'Precipitation: Rain, Snow & Hail', 'Why Saving Water Matters']
      }
    ]
  },

  // ── 3. MIDDLE & HIGH SCHOOL: CLASS 6 TO 12 ──
  {
    id: 'school-high',
    name: 'Secondary & High School (Class 6 to 12)',
    category: 'high-school',
    gradeLevel: 'Class 6 to 12 (Ages 11-18)',
    icon: '🔬',
    color: 'cyan',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(14,165,233,0.12))',
    border: 'rgba(56,189,248,0.35)',
    desc: 'Physics mechanics, chemical bonding, cellular biology, and algebraic foundations.',
    topics: [
      {
        id: 'hs-physics',
        name: 'Newton’s Laws of Motion & Gravitation',
        subtopics: ['Inertia & Newton’s First Law', 'F = ma & Momentum Conservation', 'Action & Reaction Pairs', 'Universal Law of Gravitation']
      },
      {
        id: 'hs-chemistry',
        name: 'Atoms, Chemical Bonds & Periodic Table',
        subtopics: ['Protons, Neutrons & Electron Orbitals', 'Ionic vs Covalent Bonding', 'Acids, Bases & pH Scales', 'Chemical Reactions & Stoichiometry']
      },
      {
        id: 'hs-biology',
        name: 'Cell Biology & Human Anatomy',
        subtopics: ['Plant vs Animal Cells (Mitochondria, Nucleus)', 'The Circulatory System: Heart & Blood Flow', 'DNA, Genes & Mendelian Inheritance', 'Respiration & Cellular Energy']
      },
      {
        id: 'hs-math',
        name: 'Algebra, Trigonometry & Geometry',
        subtopics: ['Linear & Quadratic Equations', 'Pythagorean Theorem & Right Triangles', 'Trigonometric Ratios (Sin, Cos, Tan)', 'Coordinate Geometry & Straight Lines']
      }
    ]
  },

  // ── 4. COMPUTER SCIENCE & CORE SYSTEMS ──
  {
    id: 'cs-systems',
    name: 'Computer Science & Core Systems',
    category: 'systems-tech',
    gradeLevel: 'University & Staff Engineering',
    icon: '💻',
    color: 'indigo',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.12))',
    border: 'rgba(99,102,241,0.35)',
    desc: 'Low-level hardware, memory hierarchies, operating systems, networking, and algorithms.',
    topics: [
      {
        id: 'ds',
        name: 'Data Structures & Memory Hierarchy',
        subtopics: [
          'Contiguous Arrays & Cache Line Locality',
          'Singly & Doubly Linked Lists (Sentinel Nodes)',
          'Amortized Dynamic Array Resizing',
          'Balanced BSTs (AVL, Red-Black Trees)',
          'Hash Tables & Robin Hood Open Addressing',
          'B+ Trees & Disk Page Fanout',
          'Priority Queues & Binary/Fibonacci Heaps',
          'Lock-Free Michael-Scott Queues & CAS'
        ]
      },
      {
        id: 'algo',
        name: 'Algorithms & Complexity Theory',
        subtopics: [
          'Asymptotic Notations & Master Theorem',
          'Divide & Conquer (QuickSort & MergeSort)',
          'Dynamic Programming & Memoization',
          'Greedy Paradigms & Exchange Arguments',
          'Graph Traversals: BFS, DFS & Topo Sort',
          'Shortest Paths: Dijkstra, Bellman-Ford & A*',
          'Network Flow: Ford-Fulkerson & Edmonds-Karp',
          'NP-Completeness, Reductions & Bounds'
        ]
      },
      {
        id: 'os',
        name: 'Operating Systems & Kernel Internals',
        subtopics: [
          'Processes, Threads & Hardware Context Switching',
          'CPU Scheduling: MLFQ & Linux CFS Scheduler',
          'Virtual Memory, 4-Level Paging & TLB Shootdowns',
          'Page Fault Traps & Demand Paging Mechanisms',
          'Concurrency: Mutexes, Semaphores & Locks',
          'Deadlocks: Coffman Conditions & Banker Algorithm',
          'Linux Kernel Read-Copy-Update (RCU)',
          'Asynchronous Zero-Copy I/O: io_uring & eBPF'
        ]
      },
      {
        id: 'cn',
        name: 'Computer Networks & Modern Protocols',
        subtopics: [
          'OSI 7-Layer vs TCP/IP Protocol Stack',
          'TCP Handshakes, Flow Control & BBR Congestion',
          'UDP, QUIC & HTTP/3 Transport Mechanics',
          'DNS Hierarchical Resolution & Anycast Routing',
          'BGP Inter-Domain Autonomous Systems & Peering',
          'TLS 1.3 Cryptographic Handshake & 0-RTT',
          'Network Address Translation (NAT) & WireGuard'
        ]
      }
    ]
  },

  // ── 5. MODERN AI & MACHINE LEARNING ──
  {
    id: 'ai-ml',
    name: 'Modern AI & Machine Learning',
    category: 'systems-tech',
    gradeLevel: 'Research & Applied ML',
    icon: '🧠',
    color: 'violet',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.12))',
    border: 'rgba(168,85,247,0.35)',
    desc: 'Foundations of statistical learning, neural networks, transformers, LLMs, and agents.',
    topics: [
      {
        id: 'ml-basics',
        name: 'Machine Learning Mathematical Foundations',
        subtopics: ['Linear Regression & Ordinary Least Squares', 'Gradient Descent, Momentum & Adam Optimizer', 'Loss Surfaces, Cross-Entropy & Regularization', 'Bias-Variance Tradeoff & Generalization Bounds']
      },
      {
        id: 'dl',
        name: 'Deep Learning & Neural Networks',
        subtopics: ['Multilayer Perceptrons & Backprop AutoDiff', 'Convolutional Networks & Spatial Invariance', 'Residual Connections & Gradient Highway Mechanics', 'Batch Normalization, LayerNorm & RMSNorm']
      },
      {
        id: 'transformers',
        name: 'Transformers & Large Language Models',
        subtopics: ['Scaled Dot-Product & Multi-Head Self-Attention', 'FlashAttention: IO-Aware Tiling & SRAM Access', 'Rotary Positional Embeddings (RoPE) & SwiGLU', 'KV Caching, PagedAttention & Speculative Decoding', 'LoRA & QLoRA Parameter-Efficient Fine-Tuning']
      },
      {
        id: 'agents-rl',
        name: 'Autonomous AI Agents & Reinforcement Learning',
        subtopics: ['Markov Decision Processes (MDPs) & Bellman Equations', 'PPO (Proximal Policy Optimization) & Policy Gradients', 'ReAct Planning, Tool Calling & Self-Reflection Loops', 'Multi-Agent Consensus & Memory Vector Architectures']
      }
    ]
  },

  // ── 6. CLOUD & DISTRIBUTED SYSTEMS ──
  {
    id: 'cloud-dist',
    name: 'Cloud Infrastructure & Distributed Systems',
    category: 'systems-tech',
    gradeLevel: 'Cloud Architecture & DevOps',
    icon: '☁️',
    color: 'cyan',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(59,130,246,0.12))',
    border: 'rgba(6,182,212,0.35)',
    desc: 'Consensus protocols, high-availability clusters, Kubernetes, and distributed streaming.',
    topics: [
      {
        id: 'consensus',
        name: 'Distributed Consensus & CAP Theorem',
        subtopics: ['CAP Theorem Proof & PACELC Classifications', 'Raft Consensus: Leader Election & Log Replication', 'Paxos: Synod Protocol & Multi-Paxos Invariants', 'Vector Clocks, CRDTs & Eventual Consistency']
      },
      {
        id: 'k8s',
        name: 'Kubernetes Internal Control Plane Architecture',
        subtopics: ['API Server, etcd Consistency & Optimistic Concurrency', 'Kubelet, CRI-O Container Runtimes & cgroups v2', 'Service Meshes: Envoy Proxy & eBPF Cilium CNI', 'Operator Pattern & Custom Resource Definitions (CRDs)']
      },
      {
        id: 'streaming',
        name: 'Distributed Event Streaming & LSM-Trees',
        subtopics: ['Kafka Partition Logs & Zero-Copy DMA Sendfile', 'LSM-Trees: MemTable, Write-Ahead Log (WAL) & SSTables', 'Compaction Strategies: Leveled vs Size-Tiered', 'Exactly-Once Semantics (EOS) & 2-Phase Commit']
      }
    ]
  },

  // ── 7. CYBERSECURITY & APPLIED CRYPTOGRAPHY ──
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & Applied Cryptography',
    category: 'systems-tech',
    gradeLevel: 'Security Engineering',
    icon: '🛡️',
    color: 'rose',
    gradient: 'linear-gradient(135deg, rgba(244,63,94,0.25), rgba(239,68,68,0.12))',
    border: 'rgba(244,63,94,0.35)',
    desc: 'Cryptographic primitives, zero-knowledge proofs, binary exploitation, and zero-trust.',
    topics: [
      {
        id: 'crypto',
        name: 'Applied Cryptography & Primitives',
        subtopics: ['AES-GCM Authenticated Encryption & Galois Counter', 'Elliptic Curve Cryptography: Curve25519 & Ed25519', 'Diffie-Hellman Key Exchange & Ephemeral Forward Secrecy', 'Zero-Knowledge Proofs: zk-SNARKs & Polynomial Commitments']
      },
      {
        id: 'web-sec',
        name: 'Web Security, Identity & OAuth2 Architecture',
        subtopics: ['OAuth2 Authorization Code Flow with PKCE', 'OpenID Connect (OIDC) & Signed JWT Validation', 'Cross-Site Scripting (XSS) & Content Security Policy (CSP)', 'Cross-Site Request Forgery (CSRF) & SameSite Cookies']
      },
      {
        id: 'binary-sec',
        name: 'Systems & Memory Exploitation Defenses',
        subtopics: ['Stack Buffer Overflows & Return-Oriented Programming (ROP)', 'Address Space Layout Randomization (ASLR)', 'Control Flow Integrity (CFI) & Intel CET Shadow Stacks', 'Linux Namespaces, Seccomp-BPF & Container Isolation']
      }
    ]
  },

  // ── 8. FINANCE, MARKETS & ECONOMICS ──
  {
    id: 'finance-econ',
    name: 'Finance, Economics & Markets',
    category: 'humanities',
    gradeLevel: 'Personal Wealth & Economics',
    icon: '📈',
    color: 'emerald',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.12))',
    border: 'rgba(52,211,153,0.35)',
    desc: 'Stock market fundamentals, compound interest, personal investing, and macroeconomics.',
    topics: [
      {
        id: 'fin-investing',
        name: 'Stock Market Mechanics & Equities',
        subtopics: ['Shares, IPOs & What Drives Stock Prices', 'Index Funds, ETFs vs Individual Stock Picking', 'Bull Markets, Bear Markets & Dollar-Cost Averaging', 'Reading Balance Sheets: Revenue, Debt & Cash Flow']
      },
      {
        id: 'fin-macro',
        name: 'Macroeconomics, Inflation & Central Banks',
        subtopics: ['How Money Works: The Fractional Reserve System', 'Inflation: CPI, Purchasing Power & Currency Value', 'Interest Rates & Federal Reserve Policies', 'Recessions, Economic Cycles & Supply/Demand']
      },
      {
        id: 'fin-personal',
        name: 'Personal Wealth Building & Compounding',
        subtopics: ['The Rule of 72 & The Power of Compound Growth', 'Emergency Funds, High-Yield Savings & Debt Management', 'Asset Allocation: Stocks, Real Estate, Bonds & Gold', 'Tax-Advantaged Accounts & Retirement Planning']
      }
    ]
  },

  // ── 9. WORLD HISTORY, ARTS & PHILOSOPHY ──
  {
    id: 'arts-history',
    name: 'World History, Arts & Philosophy',
    category: 'humanities',
    gradeLevel: 'General & Lifelong Learning',
    icon: '🏛️',
    color: 'amber',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(180,83,9,0.12))',
    border: 'rgba(251,191,36,0.35)',
    desc: 'Ancient civilizations, stoic mental models, philosophy of mind, and artistic eras.',
    topics: [
      {
        id: 'hist-civilizations',
        name: 'Ancient Civilizations & Foundations',
        subtopics: ['Mesopotamia & The Invention of Writing', 'Ancient Egypt: Pyramids, Nile & Pharaohs', 'The Roman Republic to Roman Empire', 'The Silk Road & Ancient Cultural Trade']
      },
      {
        id: 'phil-logic',
        name: 'Philosophy & Cognitive Mental Models',
        subtopics: ['Socratic Questioning & First-Principles Reasoning', 'Stoicism: Marcus Aurelius, Epictetus & Inner Resilience', 'Utilitarianism vs Deontological Ethics', 'Epistemology: How Do We Actually Know What Is True?']
      },
      {
        id: 'arts-music',
        name: 'Music Theory & Visual Arts Evolution',
        subtopics: ['The Chromatic Scale, Intervals & Chords', 'Rhythm, Meter & Syncopation', 'Renaissance Perspective vs Modernist Abstraction', 'The Science of Sound Waves & Harmonics']
      }
    ]
  }
];

export function getSubjectById(id) {
  return SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
}

export function createCustomUniversalSubject(name, gradeLevel, customTopics = []) {
  const cleanId = `custom-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  return {
    id: cleanId,
    name: name,
    category: 'custom',
    gradeLevel: gradeLevel || 'Custom Grade Level',
    icon: '✨',
    color: 'indigo',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))',
    border: 'rgba(129,140,248,0.4)',
    desc: `Custom curriculum for ${name} tailored to ${gradeLevel || 'all levels'}.`,
    isCustom: true,
    topics: customTopics.length > 0 ? customTopics : [
      {
        id: `${cleanId}-mod1`,
        name: `Module 1: Foundations of ${name}`,
        subtopics: ['Core Concepts & Definitions', 'Visual Intuition & Mental Model', 'Primary Rules & Mechanics']
      },
      {
        id: `${cleanId}-mod2`,
        name: `Module 2: Practical Application & Methods`,
        subtopics: ['Step-by-Step Problem Solving', 'Real-World Examples & Scenarios', 'Common Pitfalls & Mistakes']
      },
      {
        id: `${cleanId}-mod3`,
        name: `Module 3: Advanced Mastery & Analysis`,
        subtopics: ['Deep Invariants & Edge Cases', 'Comparative Trade-offs', 'Self-Assessment & Synthesis']
      }
    ]
  };
}

export function getContent(topic = 'Core Concept', tier = 'tier3') {
  return `## ${topic} — Dynamic Foundations & Overview

### 1. Conceptual Blueprint
**${topic}** is a foundational learning module. It provides structured principles, intuitive mental models, and verified real-world outcomes.

### 2. Operational Mechanics & Execution Flow
1. **Starting Boundary**: Input conditions and foundations are verified.
2. **State Transformation**: Concepts or operations are applied progressively.
3. **Outcome Delivery**: Verified knowledge is committed into working memory.

### 3. Efficiency & Complexity Matrix
| Dimension | Best Case | Average Case | Worst Case | Space Complexity |
|---|---|---|---|---|
| Execution Pace | O(1) | O(1) or O(log N) | O(N) | O(1) auxiliary |
| Memory Footprint | O(1) | O(1) amortized | O(N) | O(N) total |
`;
}
