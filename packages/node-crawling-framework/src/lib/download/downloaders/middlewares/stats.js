const { msToTime } = require('../../../utils/commonHelpers');

const createStatsMiddleware = () => {
  // TODO: refactor the way stats object is created ?
  let startTime;
  let interval;
  let rateInitTime;
  let rateReqCount = 0;

  return {
    open: target => next => req => {
      startTime = new Date().getTime();
      rateInitTime = new Date();
      return next(req);
    },
    processRequest: target => next => req => {
      if (!target.stats.requestCount) {
        target.stats.requestCount = 0;
      }
      if (!target.stats.requestMethodCount) {
        target.stats.requestMethodCount = {};
      }
      if (!target.stats.requestMethodCount[req.method.toUpperCase()]) {
        target.stats.requestMethodCount[req.method.toUpperCase()] = 0;
      }
      target.stats.requestCount++;
      target.stats.requestMethodCount[req.method.toUpperCase()]++;
      return next(req);
    },
    processResponse: target => next => (res, req) => {
      if (!target.stats.responseCount) {
        target.stats.responseCount = 0;
      }
      if (!target.stats.responseStatusCode) {
        target.stats.responseStatusCode = {};
      }
      if (!target.stats.responseStatusCode[res.statusCode]) {
        target.stats.responseStatusCode[res.statusCode] = 0;
      }
      target.stats.responseCount++;
      if (!interval) {
        interval = setInterval(() => {
          const now = new Date();
          rateReqCount = target.stats.responseCount - rateReqCount;
          const diferenceInMs = now - rateInitTime;

          const ratePerMin = Math.round(
            (rateReqCount / (diferenceInMs / 1000)) * 60
          );
          console.log('Rate: ' + ratePerMin + ' pages/min');
          console.log('ResponseCount:' + target.stats.responseCount);
          rateInitTime = new Date();
        }, 60000);
      }
      target.stats.responseStatusCode[res.statusCode]++;
      return next(res, req);
    },
    processError: target => next => e => {
      if (!target.stats.errorCount) {
        target.stats.errorCount = 0;
      }
      target.stats.errorCount++;
      return next(e);
    },
    close: downloader => next => e => {
      clearInterval(interval);
      downloader.logger.log(JSON.stringify(downloader.stats, null, 2));
      downloader.logger.log(
        'Time elapsed:' + msToTime(new Date().getTime() - startTime)
      );
      const now = new Date();
      const diferenceInMs = now - startTime;
      const ratePerMin = Math.round(
        (downloader.stats.responseCount / (diferenceInMs / 1000)) * 60
      );
      console.log('Rate: ' + ratePerMin + ' pages/min');
      return next(e);
    }
  };
};

module.exports = createStatsMiddleware;
