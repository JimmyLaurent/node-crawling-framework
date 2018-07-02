const Request = require('../../../../download/request/Request');
const { getRegexpInstance } = require('../../../../utils/commonHelpers');
const Url = require('url');
const defaultDeniedExtensions = require('./deniedExtensions');
const path = require('path').posix;

function matchDeniedExtensions(url, denyExtensions) {
  let extension = path.extname(url);
  if (extension) {
    if (extension.startsWith('.')) {
      extension = extension.substr(1);
    }
    return !denyExtensions.includes(extension);
  }
  return true;
}

function matchAllowUrls(url, allowUrlsRegexes) {
  return (
    allowUrlsRegexes.length === 0 ||
    allowUrlsRegexes.findIndex(r => r.test(url)) === -1
  );
}

function matchDenyUrls(url, denyUrlsRegexes) {
  return (
    denyUrlsRegexes.length === 0 ||
    denyUrlsRegexes.findIndex(r => r.test(url)) !== -1
  );
}

function matchAllowDomains(url, allowDomainsRegexes) {
  const parsedUrl = Url.parse(url);
  return (
    allowDomainsRegexes.length === 0 ||
    allowDomainsRegexes.includes(parsedUrl.hostname)
  );
}

function matchDenyDomains(url, denyDomains) {
  const parsedUrl = Url.parse(url);
  return !denyDomains.includes(parsedUrl.hostname);
}

function extractUrls(
  $,
  {
    selector = '',
    allowUrls = [],
    denyUrls = [],
    allowDomains = [],
    denyDomains = [],
    scopes = ['html'],
    tags = ['a', 'area'],
    attributes = ['href'],
    denyExtensions = defaultDeniedExtensions,
    unique = true,
    onlyFirstMatch = false
  }
) {
  const allowUrlsRegexes = allowUrls.map(getRegexpInstance);
  const denyUrlsRegexes = denyUrls.map(getRegexpInstance);
  const allowDomainsRegexes = allowDomains.map(getRegexpInstance);
  const denyDomainsRegexes = denyDomains.map(getRegexpInstance);
  const urls = unique ? new Set() : [];
  const tagsSelector = $(selector || tags.join(',')).get();
  if (tagsSelector.length > 0) {
    const scopesElements = scopes.map(s => $(s));
    for (let scope of scopesElements) {
      for (let tag of tagsSelector) {
        for (let attribute of attributes) {
          let url = $(scope)
            .find(tag)
            .attr(attribute);
          if (!url) {
            continue;
          }
          url = $.response.getAbsoluteUrl(url);
          if (
            matchDeniedExtensions(url, denyExtensions) &&
            matchAllowUrls(url, allowUrlsRegexes) &&
            matchDenyUrls(url, denyUrlsRegexes) &&
            matchAllowDomains(url, allowDomainsRegexes) &&
            matchDenyDomains(url, denyDomainsRegexes)
          ) {
            if (onlyFirstMatch) {
              return url;
            }
            if (unique) {
              urls.add(url);
            } else {
              urls.push(url);
            }
          }
        }
      }
    }
  }

  if (onlyFirstMatch) {
    return;
  }
  return unique ? [...urls] : urls;
}

function addScrapeUrlMethod($) {
  $.prototype.scrapeUrl = function(extractOptions) {
    try {
      return extractUrls($, { ...extractOptions, onlyFirstMatch: true });
    } catch (e) {
      return;
    }
  };
}

function addScrapeUrlsMethod($) {
  $.prototype.scrapeUrls = function(extractOptions) {
    try {
      return extractUrls($, extractOptions);
    } catch (e) {
      return;
    }
  };
}

function addScrapeRequestMethod($) {
  $.prototype.scrapeRequest = function(extractOptions, requestOptions) {
    const url = this.scrapeUrl(extractOptions);
    if (url) {
      return new Request(url, requestOptions);
    }
  };
}

function addScrapeRequestsMethod($) {
  $.prototype.scrapeRequests = function*(extractOptions, requestOptions) {
    const urls = this.scrapeUrls(extractOptions);
    for (let url of urls) {
      yield new Request(url, requestOptions);
    }
  };
}

module.exports = {
  addScrapeUrlMethod,
  addScrapeUrlsMethod,
  addScrapeRequestMethod,
  addScrapeRequestsMethod
};
