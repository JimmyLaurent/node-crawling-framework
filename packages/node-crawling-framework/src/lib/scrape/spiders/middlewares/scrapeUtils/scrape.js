// function addEs6LikeMap($) {
//   const oringinalMap = $.prototype.map;
//   $.prototype.map = function(fn) {
//     return oringinalMap
//       .call(this, function(i, el) {
//         return fn.call(this, el, i);
//       })
//       .get();
//   };
// }

function attribute($el, attr) {
  switch (attr) {
    case 'html':
      return $el.html();
    case 'text':
      return $el.text();
    default:
      return $el.attr(attr);
  }
}

function addCheerioObjectIterator($results, $) {
  $results[Symbol.iterator] = function() {
    return {
      currentIndex: 0,
      results: $results.get(),
      next() {
        if (this.currentIndex < this.results.length) {
          return {
            done: false,
            value: $(this.results[this.currentIndex++])
          };
        } else {
          return { done: true };
        }
      }
    };
  };
  return $results;
}

function addScrapeMethod($) {
  $.prototype.scrape = function(inputSelector) {
    try {
      let selectorRegex = /^([^@]*)(?:@\s*([\w-_:]+))?$/;
      const m = selectorRegex.exec(inputSelector) || [];
      let selector = inputSelector;
      if (m.length === 3 && m[2]) {
        return attribute(this.find(m[1]), m[2]);
      } else {
        const cheerioResults = $(this.find(selector));
        return addCheerioObjectIterator(cheerioResults, $);
      }
    } catch (e) {
      return;
    }
  };
}

module.exports = { addScrapeMethod };
