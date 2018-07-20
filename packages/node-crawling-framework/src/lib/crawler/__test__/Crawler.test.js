const path = require('path');
const crawlerManager = require('../crawlerCreator');
const { spawn } = require('child_process');
const BaseSpider = require('../../scrape/spiders/BaseSpider');
const Request = require('../../download/request/Request');
const Promise = require('bluebird');
const localServerUrl = 'http://localhost:8082';
class Spider extends BaseSpider {}

const createMockItemProcessorMiddleware = items => {
  let itemsArray = items;
  return {
    process: itemProcessorManager => next => item => {
      itemsArray.push(item);
      return next(item);
    }
  };
};

const config = {
  settings: {
    maxDownloadConcurency: 1,
    delay: 0
  },
  spider: {
    type: '',
    options: {},
    middlewares: {
      //scrapeUtils: {}
    }
  },
  itemProcessor: {
    middlewares: {}
  },
  downloader: {
    type: 'RequestDownloader',
    options: {},
    middlewares: {}
  }
};

describe('Crawling integration tests', () => {
  let proc;
  let crawler;
  let items;
  beforeAll(async () => {
    proc = spawn('node', ['staticServer.js'], {
      shell: true,
      cwd: path.join(path.dirname(__filename), 'mock-server')
    });
  });

  afterAll(() => {
    proc.kill();
  });

  beforeEach(() => {
    const localConfig = Object.assign({}, config);
    items = [];
    localConfig.itemProcessor.middlewares.mock = () =>
      createMockItemProcessorMiddleware(items);
    crawler = crawlerManager.createCrawler(localConfig, Spider);
  });

  it('request body should be passed to the spider', async () => {
    const urls = [`${localServerUrl}/quotes/1.html`];
    let body;
    crawler.spider.parse = function*(response) {
      body = response.body;
    };

    await crawler.crawl(urls);

    expect(body).toMatch('<title>Quotes to Scrape 1</title>');
  });

  it('should send yielded items to item processor pipeline and follow requests', async () => {
    const urls = [`${localServerUrl}/quotes/1.html`];
    crawler.spider.parse = function*(response) {
      const regex = /<title>(.+)<\/title>/gm;
      const match = regex.exec(response.body);
      yield {
        title: match[1]
      };
      yield new Request(`${localServerUrl}/quotes/2.html`);
    };

    await crawler.crawl(urls);

    expect(items).toEqual([
      {
        title: 'Quotes to Scrape 1'
      },
      {
        title: 'Quotes to Scrape 2'
      }
    ]);
  });

  it('should wait after startRequests() promises', async () => {
    crawler.spider.startRequests = function*(urls) {
      for (let url of urls) {
        let resolvedUrl = yield new Promise(resolve => {
          setTimeout(() => {
            resolve(url);
          }, 100);
        });
        yield new Request(resolvedUrl);
      }
    };
    crawler.spider.parse = function*(response) {
      const regex = /<title>(.+)<\/title>/gm;
      const match = regex.exec(response.body);
      yield {
        title: match[1]
      };
    };
    const urls = [
      `${localServerUrl}/quotes/1.html`,
      `${localServerUrl}/quotes/2.html`
    ];

    await crawler.crawl(urls);

    expect(items).toEqual([
      {
        title: 'Quotes to Scrape 1'
      },
      {
        title: 'Quotes to Scrape 2'
      }
    ]);
  });

  it('should throw when statRequests yield a promise which end rejected', async () => {
    let error;
    crawler.spider.startRequests = function*() {
      try {
        yield new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Error while getting start request'));
          }, 20);
        });
      }
      catch(e) {
        error = e;
      }
    };

    await crawler.crawl();

    expect(error).toEqual(new Error('Error while getting start request'));
  });
});
