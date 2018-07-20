const Request = require('../../../download/request/Request');

const createDepthMiddleware = ({ maxDepth: inputMaxDepth = 3 }) => {
  let maxDepth = inputMaxDepth;
  return {
    scrape: spider => next => {
      return function*(response) {
        if (!response.metadata.depth) {
          response.metadata.depth = 0;
        }
        const depth = response.metadata.depth + 1;
        const results = next(response);
        for (let result of results) {
          if (Request.isRequest(result)) {
            result.metadata.depth = depth;
            if (depth > maxDepth) {
              spider.logger.log(
                `Depth middleware: reached the max depth, filter "${
                  result.url
                }"`
              );
            } else {
              yield result;
            }
          } else {
            yield result;
          }
        }
      };
    }
  };
};

module.exports = createDepthMiddleware;
