const _ = require('underscore');
const { parseType, parsedTypeCheck } = require('type-check');

const checkParamOrThrow = (value, name, type, errorMessage) => {
  if (!errorMessage)
    errorMessage = `Parameter "${name}" of type ${type} must be provided`;

  const allowedTypes = parseType(type);

  // This is workaround since Buffer doesn't seem to be possible to define using options.customTypes.
  const allowsBuffer = allowedTypes.filter(item => item.type === 'Buffer')
    .length;
  const allowsFunction = allowedTypes.filter(item => item.type === 'Function')
    .length;

  if (allowsBuffer && Buffer.isBuffer(value)) return;
  if (allowsFunction && _.isFunction(value)) return;

  // This will ignore Buffer type.
  if (!parsedTypeCheck(allowedTypes, value)) {
    throw new Error(errorMessage);
  }
};

// Block image downloading
const blockExternalResources = async page => {
  await page.setRequestInterception(true);
  const block_ressources = [
    'image',
    'stylesheet',
    'media',
    'font',
    'texttrack',
    'object',
    'beacon',
    'csp_report',
    'imageset'
  ];
  page.on('request', request => {
    //if (request.resourceType() === 'image')
    if (block_ressources.indexOf(request.resourceType) > 0) request.abort();
    else request.continue();
  });
};

function scriptInjector() {
  window.loadScript = function(url, stopIfFindObject) {
    return new Promise((resolve, reject) => {
      if (stopIfFindObject && window[stopIfFindObject]) {
        return resolve('Library already loaded');
      }
      var script = document.createElement('script');
      script.src = url;
      var head = document.getElementsByTagName('head')[0],
        done = false;
      script.onload = script.onreadystatechange = function() {
        if (
          !done &&
          (!this.readyState ||
            this.readyState == 'loaded' ||
            this.readyState == 'complete')
        ) {
          done = true;
          resolve();
          script.onload = script.onreadystatechange = null;
          head.removeChild(script);
        }
      };
      head.appendChild(script);
    });
  };
  window.injectJquery = function() {
    return loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js'
    );
  };

  window.injectLodash = function() {
    return loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.10/lodash.min.js'
    );
  };
  console.log('loaded');
}

const injectScriptInjector = async page => {
  await page.evaluate(scriptInjector);
};

const hideWebDriver = async page => {
  checkParamOrThrow(page, 'page', 'Object');

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
  });

  await page.evaluateOnNewDocument(() => {
    var modifiedNavigator; // eslint-disable-line no-var
    try {
      if (Navigator.prototype.hasOwnProperty('webdriver')) {
        // eslint-disable-line no-prototype-builtins
        modifiedNavigator = Navigator.prototype;
      } else {
        modifiedNavigator = Object.create(window.navigator);
        Object.defineProperty(window, 'navigator', {
          value: modifiedNavigator,
          configurable: false,
          enumerable: true,
          writable: false
        });
      }
      Object.defineProperties(modifiedNavigator, {
        webdriver: {
          configurable: true,
          get: function() {
            // eslint-disable-line object-shorthand
            return false;
          }
        }
      });
      // Date.prototype.getTimezoneOffset = function () { return -4 * 60; };
    } catch (e) {
      console.error(e);
    }
  });
};

module.exports = {
  checkParamOrThrow,
  hideWebDriver,
  injectScriptInjector,
  blockExternalResources
};
