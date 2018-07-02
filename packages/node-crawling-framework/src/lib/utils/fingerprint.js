const normalizeUrl = require('normalize-url');
const sha1 = require('sha1');

function fingerprintRequest(request) {
  let uniqueStr = request.method + normalizeUrl(request.url);
  return sha1(uniqueStr);
}

module.exports = fingerprintRequest;
