const { BaseSpider } = require('node-crawling-framework');

class CssSpider extends BaseSpider {
  constructor() {
    super();
    this.startUrls = ['http://books.toscrape.com/index.html'];
    //this.startUrls = ['http://localhost:8080/index.html'];
  }

  *parse(response) {
    yield {
      url: response.url,
      title: response.scrape('title').text()
    };
    yield* response.scrapeRequests({ selector: 'a' });
  }
}

module.exports = CssSpider;
