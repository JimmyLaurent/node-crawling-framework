class MemoryQueue {
  constructor() {
    this.queue = [];
  }

  async enqueue(args, callbacks) {
    return this.queue.push({ args, callbacks });
  }

  async dequeue() {
    return this.queue.shift();
  }

  async isEmpty() {
    return this.queue.length === 0;
  }

  get size() {
    return this.queue.length;
  }
}

module.exports = MemoryQueue;
