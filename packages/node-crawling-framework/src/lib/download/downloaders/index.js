const BaseDownloader = require('./BaseDownloader');
const RequestDownloader = require('./RequestDownloader');
const DownloaderMiddlewares = require('./middlewares');

module.exports = {
  Downloaders: { BaseDownloader, RequestDownloader },
  DownloaderMiddlewares
};
