const request = require('request-promise');
const BaseDownloader = require('./BaseDownloader');
const Response = require('../response/Response');

class RequestDownloader extends BaseDownloader {
  processRequest(req) {
    return request(
      Object.assign({ followAllRedirects: true }, req, {
        method: req.method,
        resolveWithFullResponse: true
      })
    );
  }

  processResponse(res, req) {
    return new Response(
      res.statusCode,
      res.body,
      res.request.uri.href,
      res.headers
    );
  }
}

module.exports = RequestDownloader;
