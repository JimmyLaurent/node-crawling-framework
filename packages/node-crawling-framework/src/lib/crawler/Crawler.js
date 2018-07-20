const DownloadManager = require('../download/DownloadManager');
const Scraper = require('../scrape/Scraper');
const BaseAsyncQueueHandler = require('../abstract/BaseAsyncQueueHandler');
const Promise = require('bluebird');

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
    this.downloadManager = new DownloadManager({
      filterDuplicateRequests: true,
      delay: 0,
      ...settings
    });
    this.downloadManager.on('drained', () => this.closeIfIdle());
    this.downloadManager.on('success', (...args) =>
      this.handleDownloadOutput(...args)
    );
    this.scraper.on('drained', () => this.closeIfIdle());
    this.logger = console;
    this.spider.getLogger = this.getLoggerFn;
    this.scraper.itemProcessor.getLogger = this.getLoggerFn;
    this.scraper.getLogger = this.getLoggerFn;
    this.downloadManager.getLogger = this.getLoggerFn;
    this.initPromiseCallbacks();
  }

  get itemProcessor() {
    return this.scraper.itemProcessor;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  get getLoggerFn() {
    return () => this.logger;
  }

  setDownloader(downloader) {
    downloader.getLogger = () => this.logger;
    this.downloadManager.setDownloader(downloader);
  }

  initPromiseCallbacks() {
    [
      () => this.scraper.start(),
      () => this.downloadManager.start(),
      () => this.itemProcessor.open(),
      () => this.spider.open()
    ].map(cb => this.addOpenPromiseCallback(cb));

    [
      () => this.clearProcessLoop(),
      () => this.scraper.close(),
      () => this.downloadManager.close(),
      () => this.spider.close()
    ].map(cb => this.addClosePromiseCallback(cb));
  }

  async isIdle() {
    return (
      this.pendingStartRequestPromise !== true &&
      (await this.downloadManager.isIdle()) &&
      (await this.scraper.isIdle()) &&
      (await super.isIdle())
    );
  }

  async process(request) {
    await this.downloadManager.schedule(request);
  }

  handleDownloadOutput(response, request) {
    if (response) {
      response.request = request;
      this.scraper.schedule(response);
    }
    return false;
  }

  async scheduleNext(next) {
    //TODO: document and unit test the generator async stuffs
    if (this.startRequestsIterator && !this.pendingStartRequestPromise) {
      if (!next) {
        next = this.startRequestsIterator.next();
      }
      if (!next.done) {
        if (!next.value) {
          return this.scheduleNext();
        } else if (next.value.then) {
          this.pendingStartRequestPromise = true;
          return next.value
            .then(result => {
              this.pendingStartRequestPromise = false;
              next = this.startRequestsIterator.next(result);
              return this.scheduleNext(next);
            })
            .catch(e => {
              this.pendingStartRequestPromise = false;
              this.startRequestsIterator.throw(e);
              return this.scheduleNext();
            });
        } else {
          return this.schedule(next.value);
        }
      } else {
        this.startRequestsIterator = null;
      }
    }

    if (
      this.startRequestsIterator === null &&
      !this.pendingStartRequestPromise
    ) {
      this.closeIfIdle();
      return false;
    } else {
      return await Promise.delay(100).then(() => this.scheduleNext());
    }
  }

  canProcessMore() {
    return (
      this.pendingStartRequestPromise !== true &&
      super.canProcessMore() &&
      this.downloadManager.canQueueMore()
    );
  }

  async crawl() {
    // TODO: if start startRequestsIterator exists, concat iterators, possible race condition ?
    this.startRequestsIterator = this.spider.startRequests(...arguments);
    await this.start();
    return await this.onClose();
  }

  async closeIfIdle() {
    if (this.settings.autoCloseOnIdle && (await this.isIdle())) {
      this.close();
      return;
    }
  }

  clearProcessLoop() {
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  async processLoop() {
    if (!this.closing) {
      this.scheduleNextProcessLoop();
      while (this.canProcessMore() && (await this.processNext())) {}
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
}

module.exports = Crawler;
