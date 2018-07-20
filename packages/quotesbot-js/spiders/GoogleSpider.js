const { BaseSpider, Request } = require('node-crawling-framework');

class CssSpider extends BaseSpider {
  constructor() {
    super();
    this.startUrls = ['https://www.google.com/search?q=site:uptobox.com'];
  }

  *parse(response) {
    const results = response.scrape('.g .rc');
    for (let result of results) {
      yield {
        name: result.scrape('h3').text(),
        link: result.scrape('.r a').attr('href'),
        displayedLink: result.scrape('cite').text(),
        text: result.scrape('.s .st').text()
      };
    }
    let linklements = response.scrape('.navend .pn');
    if (linklements && linklements.length > 0) {
      let nextUrl = linklements.eq(linklements.length - 1).attr('href');
      if (nextUrl) {
        nextUrl = response.getAbsoluteUrl(nextUrl);
        yield new Request(nextUrl);
      }
    }
  }
}

module.exports = CssSpider;
