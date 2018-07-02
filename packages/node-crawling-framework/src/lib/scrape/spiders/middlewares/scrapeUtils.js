const url = require('url');
const { loadCheerioFromReponse } = require('../utils/cheerioHelpers');
const { addScrapeFormRequestMethod } = require('./scrapeUtils/form');
const { addScrapeMethod } = require('./scrapeUtils/scrape');
const {
  addScrapeUrlMethod,
  addScrapeUrlsMethod,
  addScrapeRequestMethod,
  addScrapeRequestsMethod
} = require('./scrapeUtils/urls');



const createScrapeUtilsMiddleware = () => {
  return {
    scrape: spider => next => response => {
      try {
        let $;
        function getCheerioFromResponse() {
          if (!$) {
            $ = loadCheerioFromReponse(response);
            $.response = response;
            addScrapeMethod($);
            addScrapeUrlMethod($);
            addScrapeUrlsMethod($);
            addScrapeRequestMethod($);
            addScrapeRequestsMethod($);
            addScrapeFormRequestMethod($);
          }

          return $;
        }
        response.cheerio = () => getCheerioFromResponse();
        response.getRootElement = () => getCheerioFromResponse().root();
        response.getAbsoluteUrl = link => {
          if (!/^[a-z][a-z0-9+.-]*:/.test(url)) {
            return url.resolve(response.url, link);
          }
          return url;
        };
        response.unloadCheerio = () => {
          $ = null;
        };

        response.scrape = (...args) => {
          return response.getRootElement().scrape(...args);
        };

        response.scrapeUrl = extractOptions => {
          return response.getRootElement().scrapeUrl(extractOptions);
        };

        response.scrapeUrls = extractOptions => {
          return response.getRootElement().scrapeUrls(extractOptions);
        };

        response.scrapeRequest = (extractOptions, requestOptions) => {
          return response
            .getRootElement()
            .scrapeRequest(extractOptions, requestOptions);
        };

        response.scrapeRequests = function*(extractOptions, requestOptions) {
          yield response
            .getRootElement()
            .scrapeRequests(extractOptions, requestOptions);
        };

        response.scrapeFormRequest = (identifier, formData, requestOptions) => {
          return response
            .getRootElement()
            .scrapeFormRequest(identifier, formData, requestOptions);
        };

        return next(response);
      } catch (e) {
        spider.logger.error('Error while loading html in cheerio');
      }
    }
  };
};

module.exports = createScrapeUtilsMiddleware;
