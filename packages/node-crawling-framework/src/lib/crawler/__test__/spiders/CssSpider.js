const BaseSpider = require('../../../scrape/spiders/BaseSpider');

class CssSpider extends BaseSpider {
  constructor(urls) {
    super();
    this.startUrls = urls;
  }

  *parse(response) {
    yield {
      url: response.url,
      title: response.scrape('title').text()
    };
    //yield* response.scrapeRequests({ selector: 'a' });
  }
}

module.exports = CssSpider;
