const { BaseSpider, Request } = require('node-crawling-framework');

class CssSpider extends BaseSpider {
  constructor() {
    super();
    this.startUrls = ['http://quotes.toscrape.com/js/'];
  }

  *startRequests(startUrls) {
    if (startUrls) {
      this.startUrls = startUrls;
    }

    const puppeteerEvaluate = () => {
      return injectJquery().then(() => {
        return jQuery('body').html();
      });
    };
    for (let url of this.startUrls) {
      yield this.addUrlMappingCallback(
        new Request(url, {
          metadata: {
            puppeteerEvaluate
          }
        })
      );
    }
  }

  *parse(response) {
    console.log(body);
  }
}

module.exports = CssSpider;
