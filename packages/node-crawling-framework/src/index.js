const BaseSpider = require('./lib/scrape/spiders/BaseSpider');
const Spiders = require('./lib/scrape/spiders');
const Crawler = require('./lib/crawler/Crawler');
const crawlerManager = require('./lib/crawler/crawlerCreator');
const Request = require('./lib/download/request/Request');
const Response = require('./lib/download/response/Response');
const ItemProcessorMiddlewares = require('./lib/scrape/item-processor/middlewares');
const {
  Downloaders,
  BaseDownloader,
  DownloaderMiddlewares
} = require('./lib/download/downloaders');

module.exports = {
  BaseDownloader,
  BaseSpider,
  Spiders,
  Crawler,
  crawlerManager,
  createCrawler: (...args) => crawlerManager.createCrawler(...args),
  Request,
  Response,
  ItemProcessorMiddlewares,
  Downloaders,
  DownloaderMiddlewares
};
