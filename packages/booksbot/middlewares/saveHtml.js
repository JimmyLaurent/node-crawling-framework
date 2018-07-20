const path = require('path');
const fs = require('fs-extra');

const createSaveHtmlMiddleware = () => {
  return {
    processResponse: target => next => (res, req) => {
      let filenamePath = '.' + req.url.replace('http://books.toscrape.com', '');
      fs.ensureDirSync(path.dirname(filenamePath));
      fs.writeFileSync(filenamePath, res.body);

      return next(res, req);
    }
  };
};

module.exports = createSaveHtmlMiddleware;
