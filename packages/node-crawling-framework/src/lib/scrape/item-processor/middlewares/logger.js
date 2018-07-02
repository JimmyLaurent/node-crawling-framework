const createLoggerMiddleware = () => {
  return {
    process: itemProcessorManager => next => item => {
      itemProcessorManager.logger.log(JSON.stringify(item));
      return next(item);
    }
  };
};

module.exports = createLoggerMiddleware;
