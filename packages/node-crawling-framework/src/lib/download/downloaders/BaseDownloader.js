const Promise = require('bluebird');
const BaseMiddleware = require('../../abstract/BaseMiddleware');

class BaseDownloader extends BaseMiddleware {
  constructor() {
    super();
    this.stats = {};
  }

  open() {
    return Promise.resolve();
  }

  download(req) {
    return Promise.resolve(
      // wrap to bluebird promise
      this.processRequest(req)
        .then(res => this.processResponse(res, req))
        .catch(e => this.processError(e))
    );
  }

  processRequest(req) {}

  processResponse(res, req) {}

  processError(e) {
    // console.error(e);
    // console.error(e.stack);
  }

  get logger() {
    return this.getLogger();
  }

  close() {
    return Promise.resolve();
  }
}

module.exports = BaseDownloader;
