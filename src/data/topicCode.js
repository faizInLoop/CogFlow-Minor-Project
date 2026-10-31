/**
 * Short examples for topics that are actually programs.
 * A topic that is not listed here has no code on the study screen.
 */

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const SNIPPETS = [
  {
    test: /data structure|memory hierarchy/,
    label: 'Python',
    code: `# Index i is one address calculation, so it is O(1).
address = base + i * item_size
value = memory[address]

# The same index in a linked list is a walk of i steps.
node = head
for _ in range(i):
    node = node.next
value = node.value`,
  },
  {
    test: /algorithm|complexity/,
    label: 'Python',
    code: `# Binary search halves a sorted list. It is O(log n).
# The list must already be in order.
def binary_search(items, target):
    lo, hi = 0, len(items) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return None`,
  },
  {
    test: /operating system|kernel/,
    label: 'Python',
    code: `# A process has its own address space.
# process_a.memory[0x1000] is not process_b.memory[0x1000]

# Threads of one process share that space.
shared = {"counter": 0}

def thread_one():
    shared["counter"] += 1

def thread_two():
    shared["counter"] += 1

# Reading a file is a system call: the program asks,
# and the kernel performs the read.`,
  },
  {
    test: /machine learning/,
    label: 'Python',
    code: `# Fit on the training examples only.
# The test examples stay out, so they can show overfitting.
train_loss = loss(model(train_x), train_y)
test_error = loss(model(test_x), test_y)`,
  },
  {
    test: /deep learning|neural network/,
    label: 'Python',
    code: `# One unit: a weighted sum, then ReLU.
# Without the nonlinear step, stacked layers stay one linear function.
def unit(inputs, weights, bias):
    total = bias
    for value, weight in zip(inputs, weights):
        total += value * weight
    return total if total > 0 else 0`,
  },
];

export function codeForTopic(topic) {
  const name = normalize(topic);
  const found = SNIPPETS.find((item) => item.test.test(name));
  return found ? { label: found.label, code: found.code } : null;
}

export function topicCanHaveCode(topic) {
  return /algorithm|data structure|array|linked list|hash|sort|binary search|operating system|kernel|thread|network|protocol|machine learning|neural|transformer|kubernetes|cryptograph|oauth|sql|python|javascript|compiler|recursion|database|cache|programming|function/.test(normalize(topic));
}
