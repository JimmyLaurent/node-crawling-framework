const BaseSpider = require('./BaseSpider');
const Request = require('../../download/request/Request');
const { loadCheerioFromReponse } = require('./utils/cheerioHelpers');
const { getRegexpInstance, parseDate } = require('../../utils/commonHelpers');

class Sitemap extends BaseSpider {
  constructor() {
    super();
    this.sitemapFollow = [];
  }

  open() {
    this._sitemapFollow = this.sitemapFollow.map(getRegexpInstance);
    super.open();
  }

  *startRequests({
    fromDate,
    toDate,
    fromPriority,
    toPriority,
    acceptSitemapWithoutDate = false,
    acceptSitemapWithoutPriority = false
  } = {}) {
    this.fromDate = fromDate ? parseDate(fromDate) : parseDate(this.fromDate);
    this.toDate = toDate ? parseDate(toDate) : parseDate(this.toDate);
    this.acceptSitemapWithoutDate = acceptSitemapWithoutDate;
    this.acceptSitemapWithoutPriority = acceptSitemapWithoutPriority;
    this.fromPriority = fromPriority || this.fromPriority;
    this.toPriority = toPriority || this.toPriority;

    for (let url of this.sitemapUrls) {
      yield new Request(url, {
        callback: this.parseSitemap
      });
    }
  }

  respectDateRules(dateStr) {
    if (!dateStr) {
      return this.acceptSitemapWithoutDate;
    }
    const date = parseDate(dateStr, '', false);
    if (this.fromDate && date < this.fromDate) {
      return false;
    }
    if (this.toDate && date > this.toDate) {
      return false;
    }
    return true;
  }

  respoectPriorityRules(priority) {
    try {
      priority = parseFloat(priority);
    } catch (e) {
      priority = null;
    }
    if (!priority) {
      return this.acceptSitemapWithoutPriority;
    }
    if (this.fromPriority && priority <= this.fromPriority) {
      return false;
    }
    if (this.toPriority && priority >= this.toPriority) {
      return false;
    }
    return true;
  }

  *parseSitemap(response) {
    const $ = loadCheerioFromReponse(response);

    const sitemaps = $('sitemap').toArray();
    if (sitemaps.length > 0) {
      for (let sitemap of sitemaps) {
        const sitemapUrl = $(sitemap)
          .find('loc')
          .text();
        const lastmod = $(sitemap)
          .find('lastmod')
          .text();
        const priority = $(sitemap)
          .find('priority')
          .text();
        if (
          this.respoectPriorityRules(priority) &&
          this.respectDateRules(lastmod) &&
          this._sitemapFollow.findIndex(r => r.test(sitemapUrl)) !== -1
        ) {
          yield new Request(sitemapUrl, {
            callback: this.parseSitemap
          });
        }
      }
    } else {
      const urls = $('url').toArray();
      for (let url of urls) {
        const pageUrl = $(url)
          .find('loc')
          .text();

        const lastmod = $(url)
          .find('lastmod')
          .text();
        const priority = $(url)
          .find('priority')
          .text();

        if (
          this.respoectPriorityRules(priority) &&
          this.respectDateRules(lastmod)
        ) {
          yield new Request(pageUrl, {
            metadata: { lastmod }
          });
        }
      }
    }
  }

  *parse(response, metadata) {
    throw new Error('Sitemap spider: you must implement the parse method');
  }
}

module.exports = Sitemap;
