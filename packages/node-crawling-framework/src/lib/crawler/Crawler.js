const DownloadManager = require('../download/DownloadManager');
const Scraper = require('../scrape/Scraper');
const BaseAsyncQueueHandler = require('../abstract/BaseAsyncQueueHandler');

class Crawler extends BaseAsyncQueueHandler {
  constructor(spider, settings) {
    settings = {
      autoCloseOnIdle: true,
      maxConcurrentItemsProcessingPerResponse: 100,
      ...settings
    };
    super(null, settings);
    this.spider = spider;
    this.scraper = new Scraper(this);
    this.logger = console;
    this.spider.getLogger = () => this.logger;
    this.scraper.itemProcessor.getLogger = () => this.logger;
    this.scraper.getLogger = () => this.logger;
    this.downloadManager = new DownloadManager({
      filterDuplicateRequests: true,
      delay: 0,
      ...settings
    });
    this.downloadManager.getLogger = () => this.logger;
    this.initPromiseCallbacks();
  }

  get itemProcessor() {
    return this.scraper.itemProcessor;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  setDownloader(downloader) {
    downloader.getLogger = () => this.logger;
    this.downloadManager.setDownloader(downloader);
  }

  initPromiseCallbacks() {
    [() => this.itemProcessor.open(), () => this.spider.open()].map(cb =>
      this.addOpenPromiseCallback(cb)
    );

    [
      () => this.scraper.close(),
      () => this.downloadManager.close(),
      () => this.spider.close()
    ].map(cb => this.addClosePromiseCallback(cb));
  }

  isIdle() {
    return (
      this.downloadManager.isIdle() &&
      this.scraper.isIdle() &&
      super.isIdle() &&
      !this.scheduleNextStartRequest()
    );
  }

  process(request) {
    if (request) {
      return this.downloadManager.schedule(request).then(response => {
        if (response) {
          response.request = request;
          return this.scraper.schedule(response);
        }
        return false;
      });
    }
    return this.scheduleNextStartRequest();
  }

  scheduleNextStartRequest(next) {
    //TODO: document and unit test the generator async stuffs
    if (!this.pendingStartRequestPromise) {
      if (!next) {
        next = this.startRequestsIterator.next();
      }
      if (!next.done) {
        if (!next.value) {
          return this.scheduleNextStartRequest();
        } else if (next.value.then) {
          this.pendingStartRequestPromise = true;
          return next.value
            .then(result => {
              this.pendingStartRequestPromise = false;
              next = this.startRequestsIterator.next(result);
              return this.scheduleNextStartRequest(next);
            })
            .catch(e => this.startRequestsIterator.throw(e));
        } else {
          return this.schedule(next.value);
        }
      }
    }

    return false;
  }

  canProcessMore() {
    return super.canProcessMore() && this.downloadManager.canQueueMore();
  }

  crawl() {
    // TODO: check if it's already crawling
    this.startRequestsIterator = this.spider.startRequests(...arguments);
    return this.start();
  }
}

module.exports = Crawler;
