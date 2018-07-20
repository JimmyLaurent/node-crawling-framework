const PuppeteerDownloader = require('ncf-puppeteer');

module.exports = {
  settings: {
    maxDownloadConcurency: 1, // maximum download concurrency, default: 1
    filterDuplicateRequests: true, // filter already scraped requests, default: true
    delay: 600, // delay in ms between requests, default: 0
    maxConcurrentScraping: 500, // maximum concurrent scraping, default: 500
    maxConcurrentItemsProcessingPerResponse: 100, // maximum concurrent item processing per response, default: 100
    autoCloseOnIdle: true // auto close crawler when crawling is finished, default:true
  },
  logger: null, // logger, must implement console interface, default: console
  spider: {
    type: '', // spider to use for crawling, search spider in ${cwd} or ${cwd}/spiders, can also be a class definition object
    options: {}, // spider constructor args
    middlewares: {
      depth: { maxDepth: 20 },
      scrapeUtils: {}, // add utils methods to the response, ex: "response.scrape()"
      filterDomains: {} // avoid unwanted domain requests from being scheduled
    }
  },
  itemProcessor: {
    middlewares: {
      jsonLineFileExporter: {}, // write scraped items to a json file, one line = one json (easier to parse atferwards, smaller memory footprint)
      logger: {} // log scraped items through the crawler logger
    }
  },
  downloader: {
    type: PuppeteerDownloader, // downloader to use, can also be a class definition object
    options: {}, // downloader constructor args
    middlewares: {
      stats: {}, // give some stats about requests, ex: number of requests/errors
      retry: {}, // retry on failed requests
      cookie: {} // store cookie between requests
    }
  }
};
