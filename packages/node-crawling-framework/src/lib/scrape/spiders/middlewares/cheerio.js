const { loadCheerioFromReponse } = require('../utils/cheerioHelpers');

const createCheerioMiddleware = () => {
  return {
    scrape: spider => next => response => {
      try {
        response.cheerio = () => loadCheerioFromReponse(response);
        return next(response);
      } catch (e) {
        spider.logger.error('Error while loading html in cheerio');
      }
    }
  };
};

module.exports = createCheerioMiddleware;
