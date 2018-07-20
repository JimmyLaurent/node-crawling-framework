const BaseDownloader = require('./BaseDownloader');
const RequestDownloader = require('./RequestDownloader');
const DownloaderMiddlewares = require('./middlewares');

module.exports = {
  Downloaders: { RequestDownloader },
  BaseDownloader,
  DownloaderMiddlewares
};
