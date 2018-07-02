const BaseSpider = require('./lib/scrape/spiders/BaseSpider');
const Spiders = require('./lib/scrape/spiders');
const Crawler = require('./lib/crawler/Crawler');
const crawlerManager = require('./lib/crawler/crawlerCreator');
const Request = require('./lib/download/request/Request');
const ItemProcessorMiddlewares = require('./lib/scrape/item-processor/middlewares');
const { Downloaders, DownloaderMiddlewares } = require('./lib/download/downloaders');

module.exports = {
  BaseSpider,
  Spiders,
  Crawler,
  crawlerManager,
  createCrawler: (...args) => crawlerManager.createCrawler(...args),
  Request,
  ItemProcessorMiddlewares,
  Downloaders,
  DownloaderMiddlewares
};
