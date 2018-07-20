const BaseSpider = require('../BaseSpider');
const Response = require('../../../../download/response/Response');
const Request = require('../../../../download/request/Request');
const createDepthMiddleware = require('../../middlewares/depth');

describe('Depth middleware', () => {
  it('should stop returning request when maxDepth is reached', async () => {
    let maxDepth = 3;
    const depthMiddleware = createDepthMiddleware({ maxDepth });
    const spider = { logger: { log: jest.fn() } };
    const response = new Response(200, 'testBody');
    const request = new Request('http://url.com');
    response.request = request;
    let urlIndex = 0;
    const spiderScrapeFn = function*(response) {
      yield { index: urlIndex };
      yield new Request(`http://url${urlIndex++}.com`);
    };
    const getNext = it => it.next().value;
    let it = depthMiddleware.scrape(spider)(spiderScrapeFn)(response);

    const results = [];
    for (let i = 0; i < maxDepth; i++) {
      results.push(getNext(it));
      let responseResult = new Response(200, 'testBody');
      responseResult.request = getNext(it);
      it = depthMiddleware.scrape(spider)(spiderScrapeFn)(responseResult);
    }

    results.push(getNext(it));
    let filteredResult = getNext(it);
    expect(filteredResult).toBe(undefined);
    expect(spider.logger.log.mock.calls[0][0]).toBe(
      'Depth middleware: reached the max depth, filter "http://url3.com"'
    );
    expect(results).toEqual([
      { index: 0 },
      { index: 1 },
      { index: 2 },
      { index: 3 }
    ]);
  });

  it('should not filter on the number of requests', async () => {
    let maxDepth = 1;
    const depthMiddleware = createDepthMiddleware({ maxDepth });
    const spider = { logger: { log: jest.fn() } };
    const response = new Response(200, 'testBody');
    const request = new Request('http://url.com');
    response.request = request;
    let urlIndex = 0;
    const spiderScrapeFn = function*(response) {
      yield new Request(`http://url${urlIndex++}.com`);
      yield new Request(`http://url${urlIndex++}.com`);
      yield new Request(`http://url${urlIndex++}.com`);
      yield new Request(`http://url${urlIndex++}.com`);
    };

    let it = depthMiddleware.scrape(spider)(spiderScrapeFn)(response);

    const requests = [];
    for (let request of it) {
      requests.push(request);
    }
    const requestUrls = requests.map(r => r.url);
    expect(requestUrls).toEqual([
      'http://url0.com',
      'http://url1.com',
      'http://url2.com',
      'http://url3.com'
    ]);
  });
});
