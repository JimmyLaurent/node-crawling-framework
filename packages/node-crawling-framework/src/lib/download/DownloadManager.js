const BaseAsyncQueueProcessor = require('../abstract/BaseAsyncQueueHandler');
const RequestFilter = require('./request/RequestFilter');
const Request = require('./request/Request');

class DownloadManager extends BaseAsyncQueueProcessor {
  constructor(settings, requestFilter) {
    super(null, {
      maxDownloadConcurency: 1,
      maxDownloadQueueSize: 50,
      filterDuplicateRequests: true,
      ...settings,
      processMethodName: 'download',
      autoCloseOnIdle: false
    });
    this.requestFilter = requestFilter || new RequestFilter();
    this.addClosePromiseCallback(() => this.requestFilter.close());
    this.maxConcurency = this.settings.maxDownloadConcurency;
    this.maxQueueSize = this.settings.maxDownloadQueueSize;
  }

  get logger() {
    return this.getLogger();
  }

  setDownloader(downloader) {
    this.downloader = downloader;
    this.addOpenPromiseCallback(() => this.downloader.open());
    this.addClosePromiseCallback(() => this.downloader.close());
  }

  download(request) {
    return this.downloader.download(request);
  }

  canProcessMore() {
    return this.activeCount < this.maxConcurency;
  }

  schedule(request) {
    if (!this.downloader) {
      throw new Error('DownloadManager: downloader not loaded');
    }
    if (!Request.isRequest(request)) {
      throw new Error(
        'DownloaderManager: schedule only accepts requests objects'
      );
    }
    if (
      this.settings.filterDuplicateRequests &&
      this.requestFilter.mustFilter(request) &&
      !request.dontFilter
    ) {
      this.logger.log(`Url ${request.url} filtered`);
      return Promise.resolve(false);
    }
    return super.schedule(request);
  }
}

module.exports = DownloadManager;
