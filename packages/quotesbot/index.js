const { createCrawler } = require('node-crawling-framework');

const config = require('./config');
const crawler = createCrawler(config, 'CssSpider');

crawler.crawl().then(() => {
  console.log('✨  Crawling done');
});
