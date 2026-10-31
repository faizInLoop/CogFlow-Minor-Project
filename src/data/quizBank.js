/**
 * CogFlow Curated Assessment Bank
 * Comprehensive conceptual MCQs and active recall typing evaluation prompts
 * across Computer Science, Machine Learning, Systems, and more.
 */

export const QUIZ_BANK = {
  // ─── Data Structures ───
  'Data Structures': {
    mcqs: [
      {
        id: 'ds-q1',
        question: 'Why does accessing an element in an Array by index take O(1) time, while in a Linked List it takes O(n)?',
        options: [
          'Arrays are stored in contiguous memory allowing direct offset calculation (base_address + index * size), whereas linked lists require pointer chasing.',
          'Arrays use binary search internally to find elements, while linked lists use linear search.',
          'Linked lists have memory overhead from pointers that slows down CPU cache, but both have O(1) mathematical access.',
          'Arrays are allocated on the stack while linked lists are always allocated in disk storage.'
        ],
        correctIndex: 0,
        explanation: 'Contiguous memory layout allows the CPU to calculate the exact physical memory address in a single instruction: address = base + (index * sizeof(type)). Linked list nodes are scattered across the heap, requiring traversing pointers one by one.'
      },
      {
        id: 'ds-q2',
        question: 'When resizing a dynamic array from capacity N to 2N, copying elements takes O(N) time. Why is the insertion amortized O(1)?',
        options: [
          'The operating system copies the memory in parallel hardware threads at zero CPU cost.',
          'The expensive O(N) resize happens exponentially infrequently, so the total cost of N insertions is ~3N operations, giving O(1) average per insertion.',
          'Only the last element is moved to the new array, leaving previous elements in virtual memory pages.',
          'Amortized analysis only applies when using SSD storage instead of RAM.'
        ],
        correctIndex: 1,
        explanation: 'By the accounting/aggregate method: doubling the capacity means an O(N) copy only happens after N preceding O(1) insertions. Distributing the resize cost over all insertions yields an amortized cost of O(1) per operation.'
      },
      {
        id: 'ds-q3',
        question: 'What is the primary cause of Hash Table search degrading from O(1) average to O(n) worst case?',
        options: [
          'The array size becoming larger than CPU L3 cache.',
          'High collision clustering where many distinct keys hash to the same bucket, creating long linear chains.',
          'Using cryptographic hash functions like SHA-256 instead of MurmurHash.',
          'Garbage collection pauses in modern runtime engines.'
        ],
        correctIndex: 1,
        explanation: 'When the hash function produces many collisions (or an adversary deliberately picks colliding keys), all items end up in a single bucket chain. Traversing that chain degrades search to a linear scan of O(n).'
      }
    ],
    typingPrompt: {
      question: 'Explain the core trade-off between an Array and a Doubly Linked List in terms of CPU Cache Locality vs. Insertion/Deletion at an arbitrary position.',
      sampleGoodPoints: [
        'Arrays have spatial cache locality (fetching one element loads adjacent elements into 64-byte CPU cache line).',
        'Linked lists cause pointer chasing and cache misses because nodes are non-contiguous in the heap.',
        'Linked lists allow O(1) node splice if the pointer to the node is already known, while arrays require O(n) element shifting.',
        'Linked lists have pointer overhead (16 bytes per node on 64-bit architecture).'
      ],
      rubricKeywords: ['cache locality', 'cache line', 'pointer chasing', 'contiguous', 'shift', 'O(1)', 'O(n)', 'heap']
    }
  },

  // ─── Algorithms ───
  'Algorithms': {
    mcqs: [
      {
        id: 'algo-q1',
        question: 'What invariant must hold for Binary Search to guarantee O(log n) time complexity?',
        options: [
          'The input data must be unique with no duplicates.',
          'The input elements must be arranged in a monotonic (sorted) sequence with random access.',
          'The array length must be an exact power of two.',
          'The elements must be stored in a balanced binary search tree.'
        ],
        correctIndex: 1,
        explanation: 'Binary Search requires the search space to be monotonic (sorted) and support O(1) midpoint access, allowing each comparison to eliminate half of the remaining candidate elements.'
      },
      {
        id: 'algo-q2',
        question: 'What differentiates Dynamic Programming from pure Divide-and-Conquer (like Merge Sort)?',
        options: [
          'Dynamic Programming uses recursion while Divide-and-Conquer can only use iterative loops.',
          'Dynamic Programming addresses overlapping subproblems through memoization/tabulation, avoiding redundant re-computation.',
          'Divide-and-Conquer guarantees polynomial time while Dynamic Programming is NP-Complete.',
          'Dynamic Programming only works for graph shortest path problems.'
        ],
        correctIndex: 1,
        explanation: 'Divide-and-Conquer divides problems into independent subproblems (like sorting left and right halves). Dynamic Programming is specifically designed for overlapping subproblems where the same state would otherwise be solved exponentially many times.'
      },
      {
        id: 'algo-q3',
        question: 'Why does Dijkstra’s algorithm fail or produce incorrect results when a graph has negative edge weights?',
        options: [
          'It causes an infinite loop in the priority queue data structure.',
          'Its greedy choice property assumes that adding an edge to a shortest path can never decrease the path length, which negative weights violate.',
          'Negative numbers cannot be represented as keys in a binary min-heap.',
          'Dijkstra requires undirected graphs only.'
        ],
        correctIndex: 1,
        explanation: 'Dijkstra permanently marks a vertex as visited once extracted from the priority queue, assuming its shortest distance is finalized. A negative edge encountered later could reveal an even shorter path to an already finalized vertex, breaking the greedy invariant.'
      }
    ],
    typingPrompt: {
      question: 'Compare QuickSort and MergeSort: explain their worst-case time complexities, why QuickSort is often faster in practice, and what role cache locality plays.',
      sampleGoodPoints: [
        'MergeSort is O(n log n) worst-case; QuickSort is O(n^2) worst-case with bad pivot choice.',
        'QuickSort sorts in-place (O(log n) stack space) with tight contiguous inner loops and excellent cache locality.',
        'MergeSort requires O(n) auxiliary allocation and memory copying, causing more cache thrashing.',
        'Randomized pivoting or median-of-three mitigates QuickSort worst-case.'
      ],
      rubricKeywords: ['in-place', 'O(n log n)', 'O(n^2)', 'pivot', 'cache locality', 'auxiliary memory', 'partition']
    }
  },

  // ─── Operating Systems ───
  'Operating Systems': {
    mcqs: [
      {
        id: 'os-q1',
        question: 'What is the primary difference between a Process and a Thread in modern operating systems?',
        options: [
          'Processes are managed by hardware while threads are managed purely in user-space software.',
          'A process has its own isolated virtual address space and file descriptors, while threads within the same process share that address space and memory.',
          'Threads cannot be scheduled across multiple CPU cores simultaneously.',
          'Processes cannot communicate with each other under any circumstances.'
        ],
        correctIndex: 1,
        explanation: 'A process is the unit of resource allocation (isolated virtual address space, file table, memory maps). A thread is the unit of CPU execution (own program counter, registers, stack) sharing its parent process memory space.'
      },
      {
        id: 'os-q2',
        question: 'Why does a Context Switch between two different processes take significantly longer than between two threads of the same process?',
        options: [
          'Processes require spinning the hard drive before registers are swapped.',
          'Switching processes requires invalidating or switching the MMU Page Table base register (CR3), causing TLB (Translation Lookaside Buffer) flushes and cache misses.',
          'Thread stacks are stored in CPU L1 cache while process stacks are in swap space.',
          'Operating systems run security virus scans during every process context switch.'
        ],
        correctIndex: 1,
        explanation: 'Switching processes switches the virtual address space (updating the CR3 register on x86). This flushes or invalidates entries in the TLB, meaning subsequent memory accesses incur expensive multi-level page table walks.'
      },
      {
        id: 'os-q3',
        question: 'Which of the following conditions is NOT one of the four Coffman conditions necessary for a Deadlock to occur?',
        options: [
          'Mutual Exclusion',
          'Hold and Wait',
          'Circular Wait',
          'Preemptive Scheduling'
        ],
        correctIndex: 3,
        explanation: 'The four Coffman conditions are: 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption (resources cannot be forcibly confiscated), 4. Circular Wait. Preemption actually prevents deadlock!'
      }
    ],
    typingPrompt: {
      question: 'Explain how Virtual Memory and Demand Paging protect processes from each other, and what happens step-by-step during a Page Fault.',
      sampleGoodPoints: [
        'Virtual memory maps contiguous virtual addresses to arbitrary physical frames via page tables with hardware permission bits (R/W/X).',
        'When a process accesses a page not present in RAM (present bit = 0), CPU triggers a page fault interrupt (trap) to the OS kernel.',
        'Kernel inspects faulting address in CR2 register; if valid, allocates a physical frame and reads page from disk/swap.',
        'Kernel updates page table entry, sets present bit = 1, flushes TLB, and resumes the faulting instruction.'
      ],
      rubricKeywords: ['page table', 'page fault', 'trap', 'present bit', 'TLB', 'virtual address', 'physical frame', 'swap']
    }
  },

  // ─── Computer Networks ───
  'Computer Networks': {
    mcqs: [
      {
        id: 'cn-q1',
        question: 'What is the purpose of the 3-Way Handshake (SYN, SYN-ACK, ACK) in TCP connection establishment?',
        options: [
          'To encrypt the payload using symmetric public keys before data transmission begins.',
          'To synchronize initial sequence numbers (ISNs) bidirectionally and confirm both endpoints can send and receive data.',
          'To negotiate DNS IP mappings between client and ISP gateway.',
          'To measure the physical cable distance between the client and server.'
        ],
        correctIndex: 1,
        explanation: 'TCP needs reliable bidirectional byte streams. The 3-way handshake allows both client and server to establish their starting Initial Sequence Numbers (ISNs) and verify that both transmission and reception paths are operational.'
      },
      {
        id: 'cn-q2',
        question: 'How does TCP Slow Start and Congestion Avoidance prevent network collapse?',
        options: [
          'It permanently drops packet speed to the slowest router on the global internet.',
          'It starts with a small Congestion Window (CWND) and doubles it exponentially every RTT until a threshold (ssthresh), then increases linearly until packet loss signals network saturation.',
          'It forces clients to wait for a centralized satellite signal before transmitting packets.',
          'It discards all UDP packets on the local subnet.'
        ],
        correctIndex: 1,
        explanation: 'TCP probes network capacity dynamically: CWND doubles every RTT during Slow Start (exponential growth) until ssthresh, then switches to additive increase (linear growth). Packet loss causes multiplicative decrease, maintaining fair throughput.'
      },
      {
        id: 'cn-q3',
        question: 'Why does HTTP/3 switch from TCP to QUIC running over UDP?',
        options: [
          'UDP is completely encrypted by internet service providers by default.',
          'To eliminate Head-of-Line (HoL) blocking at the transport layer, allowing individual streams to suffer packet loss without stalling other multiplexed streams.',
          'Because modern operating systems removed TCP support from their network kernels.',
          'UDP guarantees that packets never arrive out of order.'
        ],
        correctIndex: 1,
        explanation: 'In HTTP/2 over TCP, if a single packet is lost, the entire TCP connection stalls until retransmission (Head-of-Line blocking). QUIC implements independent streams over UDP, so packet loss on one stream does not block any other stream.'
      }
    ],
    typingPrompt: {
      question: 'What happens from the moment you type "https://example.com" in your browser and press Enter until the HTML renders on your screen? Explain DNS, TCP, TLS, and HTTP.',
      sampleGoodPoints: [
        'Browser checks local cache, then issues recursive DNS query to resolve example.com to an IP address.',
        'Client initiates TCP 3-way handshake (SYN, SYN-ACK, ACK) on port 443.',
        'TLS 1.3 handshake negotiates cipher suites, authenticates server certificate, and establishes symmetric session keys.',
        'Browser sends HTTP GET request; server responds with HTTP 200 and HTML payload, which browser parses into DOM/CSSOM tree.'
      ],
      rubricKeywords: ['DNS resolution', 'TCP handshake', 'TLS', 'port 443', 'HTTP GET', 'DOM', 'symmetric encryption', 'IP']
    }
  },

  // ─── DBMS ───
  'DBMS': {
    mcqs: [
      {
        id: 'db-q1',
        question: 'Why are B+ Trees predominantly chosen over balanced BSTs (like AVL or Red-Black trees) for on-disk database indexing?',
        options: [
          'B+ Trees require zero memory and execute directly on the network card.',
          'B+ Trees have huge node fan-out (hundreds of keys per node), minimizing expensive disk block I/O operations, and leaf nodes are linked sequentially for efficient range scans.',
          'BSTs cannot store string or timestamp data types.',
          'B+ Trees automatically encrypt all table rows at rest.'
        ],
        correctIndex: 1,
        explanation: 'Disk reads occur in 4KB-16KB blocks. A BST node has fan-out 2, requiring O(log2 N) random disk seeks. B+ Trees have fan-out in the hundreds, keeping tree height to 3-4 levels (O(log_B N) seeks), while leaf-level pointers enable fast sequential range scans without re-traversing the tree.'
      },
      {
        id: 'db-q2',
        question: 'In ACID properties, what does "Isolation" guarantee and what problem does MVCC (Multi-Version Concurrency Control) solve?',
        options: [
          'Isolation guarantees that data is physically stored in separate geographic continents; MVCC prevents hard drives from running out of sectors.',
          'Isolation guarantees concurrent transactions execute without interfering with one another; MVCC allows readers to never block writers and writers to never block readers by maintaining versioned row snapshots.',
          'Isolation guarantees no table has foreign keys; MVCC enforces strict serial single-threaded execution.',
          'Isolation prevents network packet sniffing during database backup.'
        ],
        correctIndex: 1,
        explanation: 'Isolation ensures concurrent transactions appear to execute sequentially. MVCC eliminates read/write lock contention: when a transaction updates a row, it creates a new version with transaction timestamp (xmin/xmax), allowing readers to access the older consistent snapshot without blocking.'
      },
      {
        id: 'db-q3',
        question: 'Under the CAP Theorem, why can a distributed database system in a partitioned network NOT be both Strongly Consistent (C) and Fully Available (A)?',
        options: [
          'Network cables lose electric voltage during partitions.',
          'If a network partition splits nodes into isolated groups, updating one group means the other group cannot receive the update: the system must either reject writes (sacrificing A) or return stale data (sacrificing C).',
          'Distributed databases cannot use TCP/IP under partitions.',
          'ACID transactions are strictly prohibited in cloud hosting.'
        ],
        correctIndex: 1,
        explanation: 'When network partitions (P) occur, messages between split nodes are dropped. To guarantee Consistency (C), a node must block until it knows all nodes agree (sacrificing Availability). To remain Available (A), it must accept writes and serve reads locally, risking divergence (sacrificing Consistency).'
      }
    ],
    typingPrompt: {
      question: 'Explain the difference between a B+ Tree index and a Log-Structured Merge Tree (LSM-Tree). Which is better for write-heavy workloads vs. read-heavy workloads, and why?',
      sampleGoodPoints: [
        'B+ Trees do in-place updates on disk pages, which is read-optimized but causes random I/O write amplification.',
        'LSM-Trees buffer writes sequentially in memory (MemTable) and append to Write-Ahead Log (WAL), flushing immutable SSTables to disk.',
        'LSM-Trees provide superior write throughput because all writes are sequential appends.',
        'LSM-Trees pay a penalty on point reads (may need to check multiple SSTables via Bloom filters) and background compaction overhead.'
      ],
      rubricKeywords: ['B+ Tree', 'LSM-Tree', 'MemTable', 'SSTable', 'WAL', 'write-heavy', 'read-heavy', 'sequential write', 'random I/O', 'compaction']
    }
  },

  // ─── OOP Concepts ───
  'OOP Concepts': {
    mcqs: [
      {
        id: 'oop-q1',
        question: 'In object-oriented design, what does the "Liskov Substitution Principle" (L in SOLID) state?',
        options: [
          'Objects of a superclass should be replaceable with objects of its subclasses without breaking application correctness or violating expectations.',
          'Classes should always be declared final to prevent subclassing.',
          'Every class must implement at least two separate interfaces.',
          'Inheritance must always be preferred over object composition.'
        ],
        correctIndex: 0,
        explanation: 'LSP requires that subtypes must be substitutable for their base types. A subclass should not strengthen preconditions, weaken postconditions, or throw unexpected exceptions that break callers expecting base class contracts.'
      },
      {
        id: 'oop-q2',
        question: 'How does runtime (dynamic) polymorphism typically work under the hood in compiled languages like C++?',
        options: [
          'The compiler copies the whole source code into every object instance.',
          'Each polymorphic class has a virtual method table (vtable) storing function pointers; each object instance contains a hidden vptr pointing to this table.',
          'Method calls are sent as JSON text strings over localhost IPC sockets.',
          'Hardware CPU registers dynamically guess the target function.'
        ],
        correctIndex: 1,
        explanation: 'Dynamic polymorphism uses a vtable: an array of function pointers per class. An object with virtual methods includes a vptr pointer (typically at offset 0). Calling a virtual method resolves to dereferencing vptr -> index in vtable -> jump to function address.'
      }
    ],
    typingPrompt: {
      question: 'Explain the principle of "Composition over Inheritance". Provide a real-world software architecture example where inheritance creates rigid coupling and composition solves it.',
      sampleGoodPoints: [
        'Inheritance creates tight compile-time coupling ("is-a") where child classes inherit irrelevant or fragile parent internals.',
        'Composition ("has-a") decouples behavior by injecting interchangeable interfaces/components at runtime.',
        'Example: A Game Entity or Payment Gateway system where combining behaviors (e.g. CanFly, CanShoot, StripePayment, PayPalPayment) avoids class explosion.',
        'Enables easier unit testing via mock dependencies.'
      ],
      rubricKeywords: ['composition', 'inheritance', 'is-a', 'has-a', 'coupling', 'flexibility', 'interface', 'dependency injection']
    }
  },

  // ─── System Design ───
  'System Design': {
    mcqs: [
      {
        id: 'sd-q1',
        question: 'What is the primary benefit of Consistent Hashing with virtual nodes in distributed caching clusters (like Memcached or DynamoDB)?',
        options: [
          'It completely eliminates the need for cache expiration timestamps.',
          'When a cache node is added or removed, only K/N keys need to be remapped on average (where K is total keys, N is nodes), preventing cascading cache stampedes.',
          'It encrypts all network packets using RSA 4096-bit keys.',
          'It forces every cache server to store an identical copy of the entire dataset.'
        ],
        correctIndex: 1,
        explanation: 'Traditional modular hashing (hash(key) % N) invalidates almost 100% of keys whenever N changes. Consistent hashing maps keys and nodes onto a circular ring (0 to 2^32-1). Adding/removing a node only shifts keys adjacent on the ring (~K/N keys), while virtual nodes ensure balanced distribution.'
      },
      {
        id: 'sd-q2',
        question: 'In distributed messaging architectures, what fundamental trade-off exists between "At-least-once" delivery and "Exactly-once" processing?',
        options: [
          'At-least-once delivery requires fiber-optic quantum repeaters.',
          'At-least-once requires message producers/consumers to handle duplicate deliveries using idempotency keys or unique transaction IDs, whereas native exactly-once requires expensive two-phase commit overhead.',
          'Exactly-once processing can only be achieved if messages are shorter than 128 bytes.',
          'At-least-once delivery discards all failed network packets without retries.'
        ],
        correctIndex: 1,
        explanation: 'Due to network drops and unacknowledged retries, distributed message queues (Kafka, SQS) provide at-least-once delivery. To achieve end-to-end exactly-once semantics, applications implement idempotent consumers (deduplication tables, unique transaction IDs).'
      }
    ],
    typingPrompt: {
      question: 'Design a distributed rate-limiting service (e.g., 100 requests per minute per user). Compare the Token Bucket and Sliding Window Log algorithms, and explain how to handle distributed concurrency using Redis.',
      sampleGoodPoints: [
        'Token Bucket adds tokens at a fixed rate up to capacity; allows bursts, has O(1) memory and time per check.',
        'Sliding Window Log stores exact timestamps of each request in a sorted set (ZSET); perfectly accurate but higher memory footprint O(N).',
        'In distributed settings, race conditions occur between read and increment.',
        'Redis Lua scripts execute atomically on the single Redis thread, preventing race conditions without heavy distributed locks.'
      ],
      rubricKeywords: ['Token Bucket', 'Sliding Window', 'rate limit', 'Redis', 'Lua script', 'atomic', 'concurrency', 'race condition']
    }
  },

  // ─── Machine Learning ───
  'ML Fundamentals': {
    mcqs: [
      {
        id: 'ml-q1',
        question: 'In the Bias-Variance tradeoff, what symptom characterizes a model suffering from High Variance?',
        options: [
          'High training error and high test error (Underfitting).',
          'Near-zero training error but high test error, showing extreme sensitivity to small fluctuations in training data (Overfitting).',
          'A model with too few parameters such as a linear classifier on non-linear data.',
          'Zero irreducible error regardless of dataset noise.'
        ],
        correctIndex: 1,
        explanation: 'High variance indicates the model is overly complex and memorizes noise in the training set rather than the underlying generalizable distribution. It achieves near-perfect training loss but fails to generalize to unseen test data.'
      },
      {
        id: 'ml-q2',
        question: 'Why do we need a separate Validation set in addition to Training and Test sets?',
        options: [
          'To feed the model twice as much data during backpropagation gradient updates.',
          'To tune hyperparameters (learning rate, regularization, tree depth) without data leakage contaminating the final unbiased test evaluation.',
          'Because GPUs cannot allocate memory without a 3-way partition.',
          'To convert continuous numbers into discrete categorical labels.'
        ],
        correctIndex: 1,
        explanation: 'Tuning hyperparameters on the test set causes data leakage—the test set is no longer an unbiased measure of real-world generalization. The validation set is used for model selection, keeping the test set pristine.'
      }
    ],
    typingPrompt: {
      question: 'Explain how Gradient Descent works to minimize a loss function, and describe the differences between Batch GD, Stochastic GD (SGD), and Mini-batch GD.',
      sampleGoodPoints: [
        'Gradient Descent iteratively updates weights in the opposite direction of the gradient: w = w - alpha * grad(L).',
        'Batch GD computes gradients across the entire dataset: stable but slow and memory-intensive for large datasets.',
        'SGD computes gradient using 1 sample per step: fast and escapes shallow local minima, but has noisy fluctuations.',
        'Mini-batch GD balances both by computing gradients over small batches (e.g. 32-256), leveraging vectorized GPU SIMD parallelism.'
      ],
      rubricKeywords: ['gradient', 'learning rate', 'loss function', 'batch size', 'vectorization', 'GPU', 'convergence', 'overfitting']
    }
  },

  // ─── Supervised Learning ───
  'Supervised Learning': {
    mcqs: [
      {
        id: 'sl-q1',
        question: 'In Logistic Regression, what role does the Sigmoid function σ(z) = 1 / (1 + e^(-z)) play?',
        options: [
          'It forces linear model parameters to sum to zero.',
          'It maps any real-valued linear score (-∞, +∞) into a calibrated probability between 0 and 1.',
          'It calculates the inverse of the feature covariance matrix.',
          'It eliminates the need for computing gradients during training.'
        ],
        correctIndex: 1,
        explanation: 'The linear hypothesis z = w^T x + b can produce any real number. The sigmoid function maps this to (0, 1), representing the conditional probability P(Y=1|X), optimized via Binary Cross-Entropy loss.'
      },
      {
        id: 'sl-q2',
        question: 'What is the "Kernel Trick" in Support Vector Machines (SVM)?',
        options: [
          'Running the SVM model inside the Linux OS kernel for higher I/O throughput.',
          'Implicitly computing the inner product of data points in a high-dimensional feature space without ever explicitly calculating coordinates in that space.',
          'Randomly dropping features during tree splits like Random Forests.',
          'Compressing support vectors into 8-bit quantized integers.'
        ],
        correctIndex: 1,
        explanation: 'By Mercer\'s theorem, if K(x, z) satisfies certain positive semi-definite conditions, computing K(x, z) gives the exact dot product φ(x)·φ(z) in a transformed high-dimensional space in O(d) time, avoiding the computational explosion of explicit transformation.'
      }
    ],
    typingPrompt: {
      question: 'Explain how a Random Forest reduces the variance of individual Decision Trees through Bagging and Feature Subsampling.',
      sampleGoodPoints: [
        'Individual decision trees are low bias but high variance (prone to deep overfitting).',
        'Bootstrap Aggregation (Bagging) trains B trees on random subsamples drawn with replacement.',
        'Random feature subsampling at each split decorrelates the trees, preventing a single dominant feature from dominating all trees.',
        'Averaging or majority voting across uncorrelated trees reduces variance by a factor of ~1/B without increasing bias.'
      ],
      rubricKeywords: ['decision tree', 'variance', 'bagging', 'bootstrap', 'decorrelate', 'subsampling', 'ensemble', 'majority vote']
    }
  },

  // ─── Deep Learning ───
  'Deep Learning': {
    mcqs: [
      {
        id: 'dl-q1',
        question: 'Why does the Vanishing Gradient Problem occur in deep neural networks with Sigmoid or Tanh activations?',
        options: [
          'Sigmoid functions output negative values that cancel out during summation.',
          'The derivative of Sigmoid maxes out at 0.25; by the chain rule, multiplying many fractions < 1 causes gradients to exponentially decay toward zero in early layers.',
          'GPU matrix multiplication loses precision after 3 layers.',
          'The learning rate automatically drops to zero after 10 epochs.'
        ],
        correctIndex: 1,
        explanation: 'In backpropagation, gradients are multiplied via the chain rule: dL/dw_1 = (dL/dy) * ... * (dy_2/dy_1). Since Sigmoid derivative σ\'(z) ≤ 0.25, chaining L layers shrinks gradients by (0.25)^L, preventing early layer weights from updating.'
      },
      {
        id: 'dl-q2',
        question: 'What is the core architectural advantage of the Self-Attention mechanism in Transformers compared to recurrent RNNs?',
        options: [
          'Transformers require no matrix multiplications and run entirely on CPU.',
          'Self-Attention computes pairwise token relationships in O(1) sequential steps, allowing full parallelization across the sequence length and eliminating vanishing gradient over long distances.',
          'Transformers only process text from right to left.',
          'Attention weights are static constants defined before training begins.'
        ],
        correctIndex: 1,
        explanation: 'RNNs process tokens sequentially step-by-step (O(n) sequential path), creating training bottlenecks and forgetting long-range dependencies. Self-Attention computes Q*K^T in parallel across all tokens at once with direct O(1) path length between any two tokens.'
      }
    ],
    typingPrompt: {
      question: 'Explain the Query, Key, and Value (Q, K, V) intuition in Transformer Self-Attention: how are attention weights computed, and what is the role of the Softmax and scaling factor 1/sqrt(d_k)?',
      sampleGoodPoints: [
        'Q represents what a token is looking for; K represents what a token contains; V represents the actual information to pass.',
        'Similarity is computed via dot product Q * K^T; scaling by 1/sqrt(d_k) prevents large dot products from pushing Softmax into near-zero gradient saturation.',
        'Softmax normalizes dot products into a probability distribution summing to 1 across all tokens.',
        'Final representation is the weighted sum of Value vectors: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k)) * V.'
      ],
      rubricKeywords: ['Query', 'Key', 'Value', 'dot product', 'softmax', 'scaling factor', 'gradient saturation', 'weighted sum']
    }
  },

  // ─── Mathematics: Calculus ───
  'Calculus': {
    mcqs: [
      {
        id: 'calc-q1',
        question: 'What is the geometric and physical interpretation of the Gradient vector ∇f(x) for a multivariable function f: R^n -> R?',
        options: [
          'It points in the direction of steepest descent and its magnitude is always 1.',
          'It points in the direction of maximum rate of increase (steepest ascent), and its magnitude equals that instantaneous rate of change.',
          'It represents the total enclosed volume under the curve.',
          'It computes the discrete difference between integer points.'
        ],
        correctIndex: 1,
        explanation: 'The gradient vector ∇f = [∂f/∂x1, ..., ∂f/∂xn]^T points in the direction of steepest ascent on the multi-dimensional manifold. In optimization, we take steps in the negative gradient direction (-∇f) to find minima.'
      },
      {
        id: 'calc-q2',
        question: 'Under what condition does the second-derivative test (or Hessian matrix H) guarantee that a critical point (where ∇f = 0) is a strict Local Minimum?',
        options: [
          'When all eigenvalues of the Hessian matrix are negative.',
          'When the Hessian matrix is Positive Definite (all eigenvalues > 0).',
          'When the determinant of the Hessian is zero.',
          'When the trace of the Hessian is negative.'
        ],
        correctIndex: 1,
        explanation: 'A critical point is a local minimum if the curvature is positive in every direction, which mathematically means the Hessian matrix of second partial derivatives is Positive Definite (x^T H x > 0 for all x ≠ 0).'
      }
    ],
    typingPrompt: {
      question: 'State the Fundamental Theorem of Calculus and explain why differentiation and integration are inverse operations using a velocity-distance physical intuition.',
      sampleGoodPoints: [
        'Part 1: The derivative of the accumulation function d/dx ∫_a^x f(t)dt = f(x).',
        'Part 2: If F\'(x) = f(x), then ∫_a^b f(x)dx = F(b) - F(a).',
        'Physical intuition: Velocity is the derivative of position (instantaneous rate of change).',
        'Integrating velocity over time accumulates all incremental displacements, recovering the total distance traveled.'
      ],
      rubricKeywords: ['Fundamental Theorem', 'derivative', 'integral', 'accumulation', 'rate of change', 'velocity', 'displacement', 'inverse']
    }
  },

  // ─── Mathematics: Linear Algebra ───
  'Linear Algebra': {
    mcqs: [
      {
        id: 'la-q1',
        question: 'What does an Eigenvector v and Eigenvalue λ satisfy for a square matrix A (Av = λv)?',
        options: [
          'Multiplying matrix A by v changes the vector into an orthogonal perpendicular plane.',
          'Matrix A scales vector v by factor λ along its own span without altering its direction (except possibly reversing it if λ < 0).',
          'Vector v must always have all zero entries.',
          'The eigenvalue λ must always equal the determinant of A.'
        ],
        correctIndex: 1,
        explanation: 'An eigenvector represents a principal axis along which the linear transformation acts purely as a scalar stretch or compression by factor λ, without rotating the vector out of its line of span.'
      },
      {
        id: 'la-q2',
        question: 'Why is Singular Value Decomposition (SVD): A = U Σ V^T fundamental in Machine Learning (e.g. PCA, Latent Semantic Analysis)?',
        options: [
          'It works only on square invertible matrices.',
          'By the Eckart-Young-Mirsky theorem, truncating SVD to the top k singular values gives the mathematically optimal rank-k approximation of matrix A under the Frobenius norm.',
          'It converts floating-point numbers into boolean values.',
          'It replaces neural network backpropagation entirely.'
        ],
        correctIndex: 1,
        explanation: 'SVD decomposes any arbitrary m x n matrix into orthogonal rotations and scaling singular values. Keeping the top k largest singular values minimizes reconstruction error, forming the basis of PCA, data compression, and low-rank matrix factorization (LoRA).'
      }
    ],
    typingPrompt: {
      question: 'Explain how Principal Component Analysis (PCA) uses the covariance matrix and eigendecomposition to perform dimensionality reduction while preserving maximum variance.',
      sampleGoodPoints: [
        'Center the dataset to zero mean and compute the empirical covariance matrix C = (1/n) X^T X.',
        'Compute the eigenvectors and eigenvalues of C.',
        'The eigenvectors with the largest eigenvalues represent the orthogonal directions of maximum variance in the data.',
        'Projecting high-dimensional data onto the top k eigenvectors minimizes reconstruction error and drops redundant or noisy dimensions.'
      ],
      rubricKeywords: ['covariance matrix', 'eigenvector', 'eigenvalue', 'variance', 'projection', 'dimensionality reduction', 'orthogonal']
    }
  }
};

/**
 * Helper to fetch or generate fallback assessment for any topic
 */
export function getTopicAssessment(topicName) {
  if (QUIZ_BANK[topicName]) {
    return QUIZ_BANK[topicName];
  }

  // Generic fallback if topic is custom
  return {
    mcqs: [
      {
        id: `${topicName}-q1`,
        question: `What is the primary architectural principle governing ${topicName}?`,
        options: [
          `Optimizing computational throughput while maintaining correctness and systemic invariants.`,
          `Minimizing physical disk space by deleting redundant state representations.`,
          `Replacing all algorithms with static linear look-up tables.`,
          `Executing all instructions in sequential single-threaded hardware mode.`
        ],
        correctIndex: 0,
        explanation: `In ${topicName}, the core engineering goal is balancing theoretical correctness, asymptotic bounds, and system efficiency.`
      },
      {
        id: `${topicName}-q2`,
        question: `Which trade-off is most prominent when scaling ${topicName} in production environments?`,
        options: [
          `Memory overhead and cache efficiency versus algorithmic time complexity.`,
          `Monolithic source code length versus physical display resolution.`,
          `Network packet MTU size versus cooling fan speed.`,
          `Number of developer comments versus compiler optimization flags.`
        ],
        correctIndex: 0,
        explanation: `System scaling requires continually balancing memory footprint, spatial locality, and computational bounds.`
      }
    ],
    typingPrompt: {
      question: `Summarize the foundational principles of ${topicName}. What problem does it solve, what are its trade-offs, and where is it used in production?`,
      sampleGoodPoints: [
        `Clear definition of the core abstraction and its purpose.`,
        `Analysis of performance bounds (time and memory complexity).`,
        `Practical edge cases and production engineering applications.`
      ],
      rubricKeywords: ['efficiency', 'complexity', 'trade-off', 'performance', 'production', 'architecture']
    }
  };
}
