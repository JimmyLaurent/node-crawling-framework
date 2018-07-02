const fingerprint = require('../../utils/fingerprint');

class RequestFilter {
  constructor() {
    this.fingerprints = new Set();
  }

  mustFilter(request) {
    const requestFingerprint = fingerprint(request);
    if (this.fingerprints.has(requestFingerprint)) {
      return true;
    }
    this.fingerprints.add(requestFingerprint);
    return false;
  }

  close() {
    return Promise.resolve();
  }
}

module.exports = RequestFilter;
