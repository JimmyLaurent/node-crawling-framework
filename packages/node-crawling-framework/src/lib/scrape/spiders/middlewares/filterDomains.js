const Url = require('url');
const { loadCheerioFromReponse } = require('../utils/cheerioHelpers');
const Request = require('../../../download/request/Request');

function isAllowedUrl(url, allowedDomains) {
  if (allowedDomains && allowedDomains.length > 0) {
    const parsedUrl = Url.parse(url);
    let isAllowed = allowedDomains.includes(parsedUrl.hostname);
    if (!isAllowed) {
      return {
        result: false,
        reason: `"${parsedUrl.hostname}" is not in the allowed domains list`
      };
    }
  }
  return { result: true };
}

const createfilterDomainsMiddleware = () => {
  return {
    scrape: spider => next => {
      return function*(response) {
        response.cheerio = () => loadCheerioFromReponse(response);
        const results = next(response);
        for (let result of results) {
          if (Request.isRequest(result) && !result.dontFilter) {
            let isAllowedUrlResult = isAllowedUrl(
              result.url,
              spider.allowedDomains
            );
            if (isAllowedUrlResult.result) {
              yield result;
            } else {
              spider.logger.log(
                `FilterDomains middleware: "${result.url}" filtered (${
                  isAllowedUrlResult.reason
                })`
              );
            }
          } else {
            yield result;
          }
        }
      };
    }
  };
};

module.exports = createfilterDomainsMiddleware;
