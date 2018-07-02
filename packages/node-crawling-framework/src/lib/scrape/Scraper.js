const Promise = require('bluebird');
const BaseAsyncQueueHandler = require('../abstract/BaseAsyncQueueHandler');
const ItemProcessorManager = require('./item-processor/ItemProcessorManager');
const Request = require('../download/request/Request');

class Scraper extends BaseAsyncQueueHandler {
  // TODO: refactor and don't pass crawler instance here
  constructor(crawler) {
    super(null, {
      maxConcurrentScraping: 500,
      maxConcurrentItemsProcessingPerResponse: 100,
      ...crawler.settings,
      processMethodName: 'scrape',
      autoCloseOnIdle: false
    });
    this.crawler = crawler;
    this.spider = crawler.spider;
    this.itemProcessor = new ItemProcessorManager();
    this.addClosePromiseCallback(() => this.itemProcessor.close());
    this.activeCount = 0;
  }

  scrape(response) {
    if (response) {
      let scrapeResponseIterator = this.spider.scrape(response);
      return this.handleSpiderOutput(scrapeResponseIterator, response);
    }
  }

  handleSpiderOutput(iterator, response) {
    try {
      const itemProcessPromises = [];
      let item = iterator.next();
      while (!item.done && item.value) {
        itemProcessPromises.push(
          Promise.resolve(item.value).then(value =>
            this.processSpiderOutput(value)
          )
        );
        item = iterator.next();
      }
      return Promise.map(itemProcessPromises, x => x, {
        concurrency: this.settings.maxConcurrentItemsProcessingPerResponse
      }).then(() => {
        // Fix MEMORY LEAK
        // TODO: Find better fix, response.release() ?
        response.unloadCheerio && response.unloadCheerio();
        response.scrape = null;
        response = null;
      });
    } catch (e) {
      this.handleSpiderError(e, response);
    }
  }

  processSpiderOutput(value) {
    if (Request.isRequest(value)) {
      return this.crawler.schedule(value);
    }
    return this.itemProcessor.process(value);
  }

  handleSpiderError(e, response) {
    this.logger.error(`Spider error while processing "${response.request.url}"
Error: ${e.message}
Stack: ${e.stack}
    `);
  }

  canProcessMore() {
    return this.activeCount <= this.settings.maxConcurrentScraping;
  }

  get logger() {
    return this.getLogger();
  }
}

module.exports = Scraper;
