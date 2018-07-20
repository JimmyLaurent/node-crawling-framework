const BaseSpider = require('../BaseSpider');
const Response = require('../../../download/response/Response');
const Request = require('../../../download/request/Request');

class Spider extends BaseSpider {
  constructor(methodsMapping) {
    super();
    this.methodsMapping = methodsMapping;
  }
}

describe('BaseSpider', () => {
  it('startRequests should return urls with callback from mapping', async () => {
    let methodsMapping = [
      { path: 'url.com', method: 'parse' },
      { path: 'test.com', method: 'test' }
    ];
    let urls = ['http://testurl.com', 'http://test.com'];

    const spider = new Spider(methodsMapping, urls);
    spider.test = 'test';
    await spider.open();

    const it = spider.startRequests(urls);
    const requests = [];
    for (let request of it) {
      requests.push(request);
    }

    expect(requests.length).toBe(2);
    expect(requests[0].url).toBe('http://testurl.com');
    expect(requests[0].callback).toBe(spider.parse);
    expect(requests[1].url).toBe('http://test.com');
    expect(requests[1].callback).toBe(spider.test);
  });

  it('scrape should scrape and assign callbacks to requests results', async () => {
    let methodsMapping = [
      { path: 'url.com', method: 'parseUrl' },
      { path: 'test.com', method: 'parseTest' }
    ];
    let urls = ['http://testurl.com', 'http://test.com'];

    const spider = new Spider(methodsMapping, urls);
    spider.parseTest = function*(response) {
      yield { body: response.body };
      yield new Request('http://url.com');
    };
    spider.parseUrl = 'parseUrlFn';
    await spider.open();

    const response = new Response(200, 'test');
    response.request = new Request('http://test.com', {
      callback: spider.parseTest
    });

    const it = spider.scrape(response);
    const results = [];
    for (let result of it) {
      results.push(result);
    }

    expect(results.length).toBe(2);
    expect(results[0].body).toBe('test');
    expect(results[1].url).toBe('http://url.com');
    expect(results[1].callback).toBe(spider.parseUrl);
  });
});
