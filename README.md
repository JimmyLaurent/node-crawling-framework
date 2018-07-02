# node-crawling-framework

Current stage: aplha (Work in progress)

"node-crawling-framework" is a crawling & scraping framework for NodeJs heavily inspired by [Scrapy](https://scrapy.org/).

A node job server is also in motion (kinda scrapyd equivalent based on BullJs).

## Features (not fully tested and finalized)

The core is working: Crawler, Scraper, Spider, item processors (pipeline), DownloadManager, downloader.

- Modular and easily extendable architecture through middlewares and class inheritance: 
  * add your own middlewares for spiders, item-processors, and downloaders.
  * extend framework spiders and get some features for free.

- DownloadManager: delay and concurency limit settings,
- RequestDownloader: downloader based on request package,
- Downloader middlewares: 
  * cookie: handle cookie storage between requests,
  * defaultHeaders: add default headers to each request,
  * retry: retry requests on error,
  * stats: collect some stats during the crawling (requests & errors count, ...)
- Spiders:
  * BaseSpider: every spider must inherhit from this one,
  * Sitemap: parse sitemap and feed the spider with found urls,
  * Elasticsearch: feed spider urls with elasticsearch
- Spider middlewares:
  * cheerio: cheerio helper on response to get a cheerio object,
  * scrapeUtils: cheerio + some helpers to facilitate the scraping (methods: scrape, scrapeUrl, scrapeRequest, ...),
  * filterDomains: filter non authorized domains
- Item processor middlewares:
  * printConsole: log items to the console,
  * jsonLineFileExporter: write scraped items to a json file, one line = one json (easier to parse atferwards, smaller memory footprint),
  * logger: log items to the logger,
  * elasticsearchExporter: export items to elasticsearch
- Logger: configurable logger (default: console)

## Project example

See [Quotesbot](https://github.com/jimmylaurent/quotesbot)

## Spider example

```js
const { BaseSpider } = require('node-crawling-framework');

class CssSpider extends BaseSpider {
  constructor() {
    super();
    this.startUrls = ['http://quotes.toscrape.com'];
  }

  *parse(response) {
    const quotes = response.scrape('div.quote');
    for (let quote of quotes) {
      yield {
        text: quote.scrape('span.text').text(),
        author: quote.scrape('small.author').text(),
        tags: quote.scrape('div.tags > a.tag').text()
      };
    }
    yield response.scrapeRequest({ selector: '.next > a' });
  }
}

module.exports = CssSpider;
```

## Crawler configuration example

```js
module.exports = {
  settings: {
    maxDownloadConcurency: 1, // maximum download concurrency, default: 1
    filterDuplicateRequests: true, // filter already scraped requests, default: true
    delay: 100, // delay in ms between requests, default: 0
    maxConcurrentScraping: 500, // maximum concurrent scraping, default: 500
    maxConcurrentItemsProcessingPerResponse: 100, // maximum concurrent item processing per response, default: 100
    autoCloseOnIdle: true // auto close crawler when crawling is finished, default:true
  },
  logger: null, // logger, must implement console interface, default: console
  spider: {
    type: '', // spider to use for crawling, search spider in ${cwd} or ${cwd}/spiders, can also be a class definition object
    options: {}, // spider constructor args
    middlewares: {
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
    type: 'RequestDownloader', // downloader to use, can also be a class definition object
    options: {}, // downloader constructor args
    middlewares: {
      stats: {}, // give some stats about requests, ex: number of requests/errors
      retry: {}, // retry on failed requests
      cookie: {} // store cookie between requests
    }
  }
};

```

## Crawler instantiation example

```js
const { createCrawler } = require('node-crawling-framework');

const config = require('./config');
const crawler = createCrawler(config, 'CssSpider');

crawler.crawl().then(() => {
  console.log('✨  Crawling done');
});

```

## TODO list

- Add unit tests
- Add documentation
- Add MongoDb feeder/exporter
- Make some benchmarks ?
- Finish formRequest scraping ( add clickables elements)
- Add Puppeteer downloader
- Split plugins/middlewares in packages
- Command line tool, "nfc-cli"
  * scaffolding: create project (with wizard), spider, any middleware
  * crawl: launch crawl
  * deploy: deploy to node-job-server
