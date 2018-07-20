class Response {
  constructor(statusCode, body, url, headers = {}) {
    this.statusCode = statusCode;
    this.body = body;
    this.url = url;
    this.headers = headers;
  }

  get metadata() {
    return this.request.metadata;
  }
}

module.exports = Response;
