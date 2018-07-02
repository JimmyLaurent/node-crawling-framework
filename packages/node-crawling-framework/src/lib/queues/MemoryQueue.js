class MemoryQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(args, callbacks) {
    this.queue.push({ args, callbacks });
  }

  dequeue() {
    return this.queue.pop();
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  get size() {
    return this.queue.length;
  }
}

module.exports = MemoryQueue;
