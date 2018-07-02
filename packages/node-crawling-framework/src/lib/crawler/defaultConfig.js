module.exports = {
  spider: {
    type: '',
    options: {},
    middlewares: {
      scrapeUtils: {},
      filterDomains: {}
    }
  },
  itemProcessor: {
    middlewares: {
      jsonLineFileExporter: {},
      logger: {}
    }
  },
  downloader: {
    type: 'RequestDownloader',
    options: {},
    middlewares: {
      stats: {},
      retry: {},
      cookie: {}
    }
  }
};
