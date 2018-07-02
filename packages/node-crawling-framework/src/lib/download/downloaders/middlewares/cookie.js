const request = require('request');

const createCookieMiddleware = cookie => {
  return {
    processRequest: target => {
      const cookieJar = request.jar();
      return next => req => {
        req.jar = cookieJar;
        return next(req);
      };
    }
  };
};

module.exports = createCookieMiddleware;
