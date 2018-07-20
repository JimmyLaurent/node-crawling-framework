const BaseSpider = require('../BaseSpider');
const Response = require('../../../../download/response/Response');
const Request = require('../../../../download/request/Request');
const createfilterDomainsMiddleware = require('../../middlewares/filterDomains');

describe('Depth middleware', () => {
  it('should filter domains based on allowedDomains list', async () => {
    const filterDomainsMiddleware = createfilterDomainsMiddleware();
    const spider = {
      allowedDomains: ['alowed1.com', 'alowed2.com'],
      logger: { log: jest.fn() }
    };
    const spiderScrapeFn = function*(response) {
      yield { text: 'testItemNotFiltered' };
      yield new Request(`http://filtered1.com`);
      yield new Request(`http://alowed1.com/whatever/?do=stuff&index=1`);
      yield new Request(`http://alowed2.com`);
      yield new Request(`http://filtered2.com`);
    };
    let it = filterDomainsMiddleware.scrape(spider)(spiderScrapeFn)(
      new Response(200, 'body')
    );

    const results = [];
    for (let result of it) {
      results.push(result);
    }
    expect(results.length).toBe(3);
    expect(results[0]).toEqual({ text: 'testItemNotFiltered' });
    expect(results[1].url).toEqual(
      'http://alowed1.com/whatever/?do=stuff&index=1'
    );
    expect(results[2].url).toEqual('http://alowed2.com');
  });

  it('should not filter when allowedDomains is undefined', async () => {
    const filterDomainsMiddleware = createfilterDomainsMiddleware();
    const spider = {
      logger: { log: jest.fn() }
    };
    const spiderScrapeFn = function*(response) {
      yield { text: 'testItemNotFiltered' };
      yield new Request(`http://alowed1.com/whatever/?do=stuff&index=1`);
      yield new Request(`http://alowed2.com`);
    };

    let it = filterDomainsMiddleware.scrape(spider)(spiderScrapeFn)(
      new Response(200, 'body')
    );

    const results = [];
    for (let result of it) {
      results.push(result);
    }
    expect(results.length).toBe(3);
    expect(results[0]).toEqual({ text: 'testItemNotFiltered' });
    expect(results[1].url).toEqual(
      'http://alowed1.com/whatever/?do=stuff&index=1'
    );
    expect(results[2].url).toEqual('http://alowed2.com');
  });
});
