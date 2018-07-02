const BaseMiddleware = require('../../abstract/BaseMiddleware');

class ItemProcessorManager extends BaseMiddleware {
  open() {
    return Promise.resolve();
  }

  process(item) {}

  close() {
    return Promise.resolve();
  }

  get logger() {
    return this.getLogger();
  }
}

module.exports = ItemProcessorManager;
