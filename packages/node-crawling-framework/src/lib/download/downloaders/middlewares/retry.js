const createRetryMiddleware = ({maxRetryTimes = 3}) => {
  return {
    processRequest: downloader => next => req => {
      if (!req.retryTimes) {
        req.retryTimes = 1;
      }
      const retryLoop = () =>
        next(req).then(res => {
          if (res.statusCode > 300 || res.statusCode < 200) {
            if (req.retryTimes < maxRetryTimes) {
              req.retryTimes++;
              downloader.processResponse(res, req);
              return retryLoop();
            }
          }
          return res;
        });
      return retryLoop();
    }
  };
};

module.exports = createRetryMiddleware;
