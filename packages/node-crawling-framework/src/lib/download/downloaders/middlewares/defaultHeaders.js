const createDefaultHeadersMiddleware = (headers = {}) => {
  return {
    processRequest: target => next => req => {
      req.headers = {
        'User-Agent': 'Firefox/48.0',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en',
        ...headers
      };
      return next(req);
    }
  };
};

module.exports = createDefaultHeadersMiddleware;
