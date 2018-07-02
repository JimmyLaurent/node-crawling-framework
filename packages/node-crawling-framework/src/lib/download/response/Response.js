class Response {
  constructor(statusCode, body, url, headers = {}, metadata = {}) {
    this.statusCode = statusCode;
    this.body = body;
    this.url = url;
    this.headers = headers;
    this.metadata = metadata;
  }
}

module.exports = Response;
