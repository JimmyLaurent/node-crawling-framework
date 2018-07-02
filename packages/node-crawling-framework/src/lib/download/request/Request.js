class Request {
  constructor(url, options = {}) {
    this.url = url;
    //TODO: Extract common request interface: method, formdata, callback, callback arguments, and leave the rest in metadata
    Object.assign(this, options);
    this.method = this.method || 'GET';
  }

  static isRequest(value) {
    return value && value.constructor && value.constructor.name === 'Request';
  }
}

module.exports = Request;
