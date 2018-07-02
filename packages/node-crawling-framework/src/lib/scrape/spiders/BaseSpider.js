const BaseMiddleware = require('../../abstract/BaseMiddleware');
const Request = require('../../download/request/Request');
const { getRegexpInstance } = require('../../utils/commonHelpers');

class BaseSpider extends BaseMiddleware {
  constructor() {
    super();
    this.startUrls = [];
    this.methodsMapping = [{ path: '[^]+', method: 'parse' }];
    this.autobind();
  }

  open() {
    this._methodsMapping = this.methodsMapping.map(r => ({
      path: getRegexpInstance(r.path),
      method: r.method
    }));
  }

  *startRequests(startUrls) {
    if (startUrls) {
      this.startUrls = startUrls;
    }
    for (let url of this.startUrls) {
      yield this.addUrlMappingCallback(new Request(url));
    }
  }

  *parse(response) {}

  autobind() {
    const exludedKeys = ['constructor', 'autobind'];
    let currentProto = this;
    while (currentProto.constructor.name !== 'BaseSpider') {
      for (const key of Object.getOwnPropertyNames(
        currentProto.constructor.prototype
      )) {
        const val = this[key];
        if (!exludedKeys.includes(key) && typeof val === 'function') {
          exludedKeys.push(key);
          this[key] = val.bind(this);
        }
      }
      currentProto = currentProto.__proto__;
    }
  }

  addUrlMappingCallback(request) {
    if (request.callback) {
      return request;
    }
    const route = this._methodsMapping.find(r => r.path.test(request.url));
    if (route) {
      request.callback = this[route.method];
      return request;
    }
    return false;
  }

  *scrape(response) {
    const results = this._scrape(response);
    for (let result of results) {
      if (Request.isRequest(result)) {
        let resultMapped = this.addUrlMappingCallback(result);
        if (!resultMapped) {
          this.logger.log(
            `Spider: no matching mapping found for url "${response.request.url}"`
          );
          return;
        }
      }
      yield result;
    }
  }

  *_scrape(response) {
    const { request } = response;
    this.logger.log(`Spider: parsing "${request.url}"`);
    if (request.callback) {
      yield* request.callback(response, request.metadata);
    } else {
      yield* this.parse(response, request.metadata);
    }
  }

  get logger() {
    return this.getLogger();
  }

  close() {
    return Promise.resolve();
  }
}

module.exports = BaseSpider;
