const createConsoleMiddleware = () => {
  return {
    process: itemProcessorManager => next => item => {
      console.log(JSON.stringify(item));
      return next(item);
    }
  };
};

module.exports = createConsoleMiddleware;
