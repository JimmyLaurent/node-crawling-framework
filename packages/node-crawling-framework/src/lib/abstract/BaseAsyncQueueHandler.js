const Promise = require('bluebird');
const MemoryQueue = require('../queues/MemoryQueue');

class BaseAsyncQueueProcessor {
  constructor(
    queue,
    {
      processLoopIntervalMs = 5000,
      autoCloseOnIdle = false,
      processMethodName,
      ...rest
    } = {}
  ) {
    this.settings = {
      processLoopIntervalMs,
      autoCloseOnIdle,
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
    this.settings.delay = this.settings.delay || 0;
  }

  schedule() {
    return new Promise((resolve, reject) => {
      if (arguments.length > 0) {
        this.queue.enqueue(arguments, {
          resolve: (...args) => resolve(...args),
          reject: e => reject(e)
        });
        if (!this.running) {
          this.start();
        } else {
          this.processLoop();
        }
      } else {
        resolve();
      }
    });
  }

  process() {}

  processNext() {
    let next = this.queue.dequeue();
    let nextProcessJobArgs;
    let callbacks;
    if (next) {
      nextProcessJobArgs = next.args;
      callbacks = next.callbacks;
    }

    this.activeCount++;
    let process;
    if (nextProcessJobArgs) {
      process = this[this.processMethodName](...nextProcessJobArgs);
    } else {
      process = this[this.processMethodName]();
    }
    Promise.resolve(process)
      .then(result => {
        if (callbacks && callbacks.resolve) {
          callbacks.resolve(result);
        }
      })
      .catch(e => {
        if (callbacks && callbacks.reject) {
          callbacks.reject(e);
        }
      })
      .then(() => Promise.delay(this.settings.delay))
      .finally(() => {
        this.activeCount--;
        !this.queue.isEmpty() && this.processLoop();

        if (this.settings.autoCloseOnIdle && this.isIdle()) {
          this.close();
        }
      });
  }

  isIdle() {
    return !this.paused && this.activeCount === 0;
  }

  start() {
    let openPromises = this.openPromiseCallbacks.map(cb =>
      Promise.resolve(cb())
    );

    if (!this.running) {
      return Promise.all(openPromises).then(() => {
        this.closing = false;
        this.running = true;
        this.processLoop();
        return this.onClose();
      });
    }
    throw new Error('Queue processor already started');
  }

  pause() {
    this.paused = true;
  }

  unpause() {
    this.paused = false;
  }

  canProcessMore() {
    return !this.closing && !this.paused;
  }

  canQueueMore() {
    return this.queue.size < this.maxQueueSize;
  }

  processLoop() {
    this.scheduleNextProcessLoop();
    while (this.canProcessMore() && this.processNext()) {}
  }

  clearProcessLoop() {
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  scheduleNextProcessLoop() {
    this.clearProcessLoop();
    if (!this.loopTimeout) {
      this.loopTimeout = setTimeout(() => {
        this.loopTimeout = null;
        this.processLoop();
      }, this.settings.processLoopIntervalMs);
    }
  }

  addClosePromiseCallback(closePromiseCallback) {
    this.closePromiseCallbacks.push(closePromiseCallback);
  }

  addOpenPromiseCallback(openPromiseCallback) {
    this.openPromiseCallbacks.push(openPromiseCallback);
  }

  onClose() {
    if (!this.onClosePromise) {
      this.onClosePromise = new Promise(resolve => {
        this.closeCallback = () => resolve();
      });
    }
    return this.onClosePromise;
  }

  close() {
    this.closing = true;
    this.clearProcessLoop();
    let closePromises = this.closePromiseCallbacks.map(cb =>
      Promise.resolve(cb())
    );

    return Promise.all(closePromises).then(() => {
      this.running = false;
      if (this.closeCallback) {
        this.closeCallback();
      }
    });
  }
}

module.exports = BaseAsyncQueueProcessor;
