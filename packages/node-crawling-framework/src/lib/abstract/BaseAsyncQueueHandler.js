const Promise = require('bluebird');
const MemoryQueue = require('../queues/MemoryQueue');
const EventEmitter = require('events');

class BaseAsyncQueueProcessor extends EventEmitter {
  constructor(
    queue,
    {
      processLoopIntervalMs = 5000,
      autoCloseOnIdle = false,
      delay = 0,
      processMethodName,
      ...rest
    } = {}
  ) {
    super();
    this.settings = {
      processLoopIntervalMs,
      autoCloseOnIdle,
      delay,
      ...rest
    };
    this.maxQueueSize = Infinity;
    this.loopTimeout = null;
    this.closePromiseCallbacks = [];
    this.openPromiseCallbacks = [];
    this.paused = false;
    this.running = false;
    this.closing = false;
    this.activeCount = 0;
    this.queue = queue || new MemoryQueue();
    this.processMethodName = processMethodName || 'process';
  }

  async process() {}

  doProcess({ args = [] }) {
    this.activeCount++;
    this.emit('process', args);
    const process = Promise.resolve(this[this.processMethodName](...args));
    process
      .then(result => this.emit('success', result, ...args))
      .catch(error => this.emit('error', error))
      .then(() => Promise.delay(this.settings.delay))
      .finally(async () => {
        if (--this.activeCount === 0 && (await this.queue.isEmpty())) {
          this.emit('drained');
        }
        this.processLoop();
      });
  }

  async processNext() {
    const next = await this.queue.dequeue();
    if (next) {
      this.doProcess(next);
      return true;
    } else {
      return await this.scheduleNext();
    }
  }

  async schedule() {
    if (arguments.length === 0) {
      throw new Error('AsyncQueueHandler: nothing to schedule');
    }
    await this.queue.enqueue(arguments);
    if (this.running) {
      this.processLoop();
    }
  }

  async scheduleNext() {
    return false;
  }

  async isIdle() {
    return (
      !this.paused && this.activeCount === 0 && (await this.queue.isEmpty())
    );
  }

  async start() {
    if (!this.running) {
      await this.open();
      this.running = true;
      this.closing = false;
      this.processLoop();
      return null;
    }
    throw new Error('Async queue handler already started');
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.processLoop();
  }

  canProcessMore() {
    return this.running && !this.closing && !this.paused;
  }

  canQueueMore() {
    return this.queue.size < this.maxQueueSize;
  }

  async processLoop() {
    while (this.canProcessMore() && (await this.processNext())) {}
  }

  addOpenPromiseCallback(openPromiseCallback) {
    this.openPromiseCallbacks.push(openPromiseCallback);
  }

  async open() {
    const openPromises = this.openPromiseCallbacks.map(cb =>
      Promise.resolve(cb())
    );
    return await Promise.all(openPromises).then(() => this.emit('started'));
  }

  addClosePromiseCallback(closePromiseCallback) {
    this.closePromiseCallbacks.push(closePromiseCallback);
  }

  async onClose() {
    if (this.running) {
      if (!this.onClosePromise) {
        this.onClosePromise = new Promise(resolve => {
          this.on('closed', () => resolve());
        });
      }
      return this.onClosePromise;
    }
  }

  async close() {
    if (!this.closing) {
      this.closing = true;
      let closePromises = this.closePromiseCallbacks.map(cb =>
        Promise.resolve(cb())
      );

      return await Promise.all(closePromises).then(() => {
        this.running = false;
        this.emit('closed');
      });
    }
  }
}

module.exports = BaseAsyncQueueProcessor;
