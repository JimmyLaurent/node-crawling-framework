const { BaseSpider } = require('node-crawling-framework');

class CssSpider extends BaseSpider {
  constructor() {
    super();
    this.startUrls = ['http://quotes.toscrape.com/js/'];
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
