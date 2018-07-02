const fs = require('fs');
const path = require('path');

const createJsonLineMiddleware = ({ filePath = 'results.json' }) => {
  let fileFullPath = path.resolve(filePath);
  return {
    open: itemProcessorManager => next => () => {
      return next();
    },
    process: itemProcessorManager => next => item => {
      return new Promise((resolve, reject) => {
        fs.appendFile(fileFullPath, JSON.stringify(item) + '\n', err => {
          if (err) {
            reject(err);
          }
          resolve(next(item));
        });
      });
    },
    close: itemProcessorManager => next => () => {
      return next();
    }
  };
};

module.exports = createJsonLineMiddleware;
