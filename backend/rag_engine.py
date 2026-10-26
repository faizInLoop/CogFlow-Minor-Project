"""
CogFlow RAG & Adaptive Knowledge Engine
======================================
Stores and retrieves tiered educational content based on student cognitive state.
Supports topic-specific content retrieval across 5 difficulty levels (mapped to 3 UI tiers:
  Level 1-2: Simplified / Tier 1
  Level 3:   Standard / Tier 3
  Level 4-5: Expert / Tier 5
"""

from typing import Optional, Tuple, Dict, Any

try:
    import chromadb
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False


LEVEL_TO_TIER = {
    1: "tier1",
    2: "tier1",
    3: "tier3",
    4: "tier5",
    5: "tier5",
}

TIER_TO_LEVEL = {
    "tier1": 1,
    "tier3": 3,
    "tier5": 5,
}

TOPIC_KNOWLEDGE_BASE: Dict[str, Dict[int, str]] = {
    "Data Structures": {
        1: "## 🟢 Data Structures — The Big Picture (Simplified)\n\nData structures are simply organized ways to store and retrieve data efficiently in computer memory.\n\n- **Array**: Items side-by-side in memory like numbered post-office boxes. Instant lookup with an index.\n- **Linked List**: Nodes chained together with pointers. Easy to insert or delete without shifting whole arrays.\n- **Stack & Queue**: Stacks are LIFO (Last In, First Out). Queues are FIFO (First In, First Out).\n- **Trees & Graphs**: Hierarchical and networked relationships connecting complex entities.",
        2: "## 🟢 Data Structures — Linear Structures & Basic Complexity\n\nLinear data structures form the backbone of memory management and algorithm design:\n\n- Arrays provide O(1) random access by index.\n- Linked lists avoid continuous memory allocation hurdles.\n- Dynamic arrays double their capacity amortizing insertion costs.",
        3: "## 🔵 Data Structures — Core Implementations (Standard)\n\nData structures define the relationship between data items, access patterns, and algorithm performance.\n\n### Primary Categories\n1. **Contiguous**: Arrays, matrices, lookup tables.\n2. **Linked**: Singly/doubly linked lists, trees, graphs.\n3. **Abstract Data Types (ADTs)**: Stacks, queues, heaps, hash maps.\n\n### Performance Trade-offs\n- Arrays: O(1) read, O(n) insert/delete.\n- Linked Lists: O(n) read, O(1) insert at head.\n- Hash Tables: Average O(1) search and insert.",
        4: "## 🟡 Data Structures — Advanced Trees & Cache Locality\n\nAdvanced structures balance lookup complexity against hardware memory hierarchy and spatial cache locality.\n\n- **Self-Balancing BSTs (AVL / Red-Black)**: Guarantee O(log n) worst-case search and insert.\n- **B-Trees & B+ Trees**: Optimized for disk and block-storage reads with broad branching factors.\n- **Tries**: Efficient prefix search for string keys.",
        5: "## 🟡 Data Structures — Theoretical Complexity & Hardware Bounds (Expert)\n\nRigorous analysis of memory layout, amortized bounds, and pointer-indirection penalties.\n\n### Theoretical Bounds\n- Cache coherence and false sharing in concurrent data structures.\n- Cache-oblivious algorithms and van Emde Boas layouts minimizing cache misses.\n- Lower bounds: Omega(n log n) comparison-based bounds vs O(n) integer sorting bounds."
    },
    "Algorithms": {
        1: "## 🟢 Algorithms — Step-by-Step Problem Solving (Simplified)\n\nAn algorithm is just a clear, step-by-step recipe to solve a specific problem.\n\n- **Searching**: Looking for an item (e.g., checking names one by one vs dividing a phonebook in half).\n- **Sorting**: Putting items in order from smallest to largest.\n- **Efficiency**: Choosing the fastest recipe so the computer does not freeze.",
        2: "## 🟢 Algorithms — Divide and Conquer Fundamentals\n\nBreaking large challenges into smaller sub-problems makes complex tasks manageable:\n\n- Binary search cuts search space in half at every step: O(log n).\n- Merge sort splits lists into single elements and reassembles them sorted.",
        3: "## 🔵 Algorithms — Design Paradigms & Complexity (Standard)\n\nAlgorithms are evaluated by their asymptotic time and space complexity using Big-O notation.\n\n### Core Paradigms\n1. **Divide and Conquer**: Merge Sort, Quick Sort, Binary Search.\n2. **Greedy Algorithms**: Dijkstra's shortest path, Kruskal's MST.\n3. **Dynamic Programming**: Memoization and tabulation for overlapping subproblems (Knapsack, LCS).",
        4: "## 🟡 Algorithms — Graph Traversal & Dynamic Programming\n\nAdvanced algorithmic techniques optimize constrained search and state transitions:\n\n- Bellman-Ford: Handles negative edge weights and detects negative cycles.\n- Floyd-Warshall: Computes all-pairs shortest paths in O(V^3).\n- Topological Sort & Strongly Connected Components (Tarjan's algorithm).",
        5: "## 🟡 Algorithms — P vs NP & Advanced Complexity Theory (Expert)\n\nFormal classification of computational tractability and reduction techniques.\n\n- Reductions: Polynomial-time reductions (Cook-Levin theorem, 3-SAT to Vertex Cover).\n- Approximation algorithms and randomized algorithms with bounded error margins.\n- Master Theorem bounds and amortized analysis with the potential method."
    },
    "ML Fundamentals": {
        1: "## 🟢 Machine Learning — Learning from Data (Simplified)\n\nImagine teaching a child to recognize fruits by showing pictures rather than describing mathematical equations.\n\n- **Supervised**: Learning with teacher-provided answers.\n- **Unsupervised**: Finding clusters and groups on its own.\n- **Evaluation**: Testing the model on pictures it has never seen before.",
        2: "## 🟢 ML Fundamentals — Training & Overfitting\n\nKey rules for successful machine learning models:\n\n- Split data into training and test sets.\n- Prevent overfitting: do not let the model memorize the training noise.\n- Measure performance with accuracy, precision, and recall.",
        3: "## 🔵 Machine Learning — Core Concepts & Trade-offs (Standard)\n\nMachine learning algorithms optimize an objective loss function over empirical observations.\n\n### The Bias-Variance Tradeoff\n- **High Bias (Underfitting)**: Model is too simple to capture patterns.\n- **High Variance (Overfitting)**: Model captures training noise.\n- **Regularization (L1/L2)**: Constrains parameter weights to prevent over-complexity.",
        4: "## 🟡 Machine Learning — Loss Formulations & Gradient Optimization\n\nMathematical optimization of empirical risk across parameter spaces:\n\n- Stochastic Gradient Descent (SGD) with momentum and adaptive learning rates (Adam, RMSProp).\n- Convex vs non-convex loss surfaces.\n- Cross-entropy loss vs Mean Squared Error and maximum likelihood estimation.",
        5: "## 🟡 Machine Learning — Statistical Learning Theory & Generalization Bounds (Expert)\n\nTheoretical guarantees on generalization and model capacity.\n\n- Vapnik-Chervonenkis (VC) dimension and Rademacher complexity.\n- PAC (Probably Approximately Correct) learning framework.\n- Generalization bounds and implicit regularization in overparameterized deep networks."
    },
    "Operating Systems": {
        1: "## 🟢 Operating Systems — The Computer's Traffic Controller (Simplified)\n\nAn Operating System is the master software managing hardware and user applications.\n\n- **Process**: An active running program.\n- **Memory**: The workspace where programs keep their active notes.\n- **File System**: The organized filing cabinet on your disk.",
        2: "## 🟢 Operating Systems — CPU Scheduling & Multitasking\n\nHow the CPU switches between applications so smoothly:\n\n- Round Robin: Giving each task a fair turn in round-robin fashion.\n- Virtual Memory: Giving each application the illusion of private memory space.",
        3: "## 🔵 Operating Systems — Processes, Threads & Concurrency (Standard)\n\nThe OS abstracts physical hardware through process management, virtual memory, and device drivers.\n\n### Concurrency & Synchronization\n- Processes possess isolated address spaces; threads share memory within a process.\n- Race conditions arise without mutexes, semaphores, or condition variables.\n- Deadlock conditions: Mutual exclusion, hold and wait, no preemption, circular wait.",
        4: "## 🟡 Operating Systems — Paging, Page Replacement & Inter-Process Comm\n\nDeep memory architecture and hardware-assisted virtualization:\n\n- Multi-level page tables, TLB (Translation Lookaside Buffer) hits and misses.\n- Page replacement algorithms: LRU, Clock, Optimal algorithm.\n- IPC: Unix domain sockets, shared memory segments, message queues.",
        5: "## 🟡 Operating Systems — Kernel Architecture & Concurrency Primitives (Expert)\n\nMonolithic vs microkernel design, lockless algorithms, and hardware virtualization.\n\n- Read-Copy-Update (RCU) mechanisms for scalable concurrent read access.\n- Hardware virtualization extensions (Intel VT-x, nested paging, EPT).\n- Real-time scheduling guarantees (Rate Monotonic, Earliest Deadline First)."
    }
}


class RAGEngine:
    def __init__(self):
        print("Initializing Knowledge & Vector Store...")
        self.documents = {
            1: "Level 1 (Easiest): Atoms are like tiny building blocks. Everything around us is made of atoms.",
            2: "Level 2 (Simple): Atoms are the basic units of matter. They have a center called a nucleus and smaller electrons.",
            3: "Level 3 (Normal): An atom consists of a positively charged nucleus surrounded by a cloud of negatively charged electrons.",
            4: "Level 4 (Advanced): In the quantum mechanical model, electrons do not have precise orbits but exist in probabilistic orbitals.",
            5: "Level 5 (Complex): The Schrödinger wave equation governs atomic systems, defining the probabilistic electron density distribution."
        }
        
        self.collection = None
        if HAS_CHROMADB:
            try:
                self.client = chromadb.Client()
                self.collection = self.client.create_collection(name="cogflow_content")
                self._populate_initial_data()
            except Exception as e:
                print(f"ChromaDB init warning ({e}), using in-memory store.")

    def _populate_initial_data(self):
        documents = list(self.documents.values())
        ids = ["lvl1", "lvl2", "lvl3", "lvl4", "lvl5"]
        metadatas = [{"level": 1}, {"level": 2}, {"level": 3}, {"level": 4}, {"level": 5}]
        self.collection.add(documents=documents, metadatas=metadatas, ids=ids)  # type: ignore
        print("[RAG] Success! Study material loaded across 5 difficulty levels.")

    def adapt_content(
        self,
        current_level: int,
        cognitive_state: int,
        topic: Optional[str] = None,
        current_tier: Optional[str] = None,
        target_tier: Optional[str] = None,
        curated_content: Optional[str] = None
    ) -> Tuple[str, int, str, str]:
        """
        Adapts lesson content according to student's cognitive state.
        
        cognitive_state:
            0 = Flow (Maintain current pace)
            1 = Overload (Simplify: step down difficulty)
            2 = Boredom (Challenge: step up difficulty)
            
        Returns:
            Tuple of (adapted_content, new_level, new_tier, content_source)
        """
        # Determine new level
        new_level = current_level
        if cognitive_state == 1:    # Overload -> simplify
            new_level = max(1, current_level - 1)
        elif cognitive_state == 2:  # Boredom -> increase depth
            new_level = min(5, current_level + 1)

        # Map new level to UI tier
        if target_tier and target_tier in ("tier1", "tier3", "tier5"):
            new_tier = target_tier
        else:
            new_tier = LEVEL_TO_TIER.get(new_level, "tier3")

        # 1. If curated content for the target tier is directly supplied by frontend, use it
        if curated_content and len(curated_content.strip()) > 0:
            return curated_content, new_level, new_tier, "curated_topic_library"

        # 2. Check topic-specific knowledge base
        if topic and topic in TOPIC_KNOWLEDGE_BASE:
            topic_levels = TOPIC_KNOWLEDGE_BASE[topic]
            content = topic_levels.get(new_level) or topic_levels.get(3) or list(topic_levels.values())[0]
            return content, new_level, new_tier, "curated_topic_library"

        # 3. Check ChromaDB collection if active
        if self.collection:
            try:
                results = self.collection.get(where={"level": new_level})
                if results and results.get("documents"):
                    return results["documents"][0], new_level, new_tier, "rag_vector_store"
            except Exception:
                pass

        # 4. Fallback in-memory documents
        fallback = self.documents.get(new_level, "Content not found.")
        return fallback, new_level, new_tier, "rag_fallback_store"
