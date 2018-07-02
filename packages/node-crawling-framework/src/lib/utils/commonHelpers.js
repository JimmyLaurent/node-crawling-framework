function getRegexpInstance(regex) {
  if (regex instanceof RegExp) {
    return regex;
  } else if (typeof regex === 'string') {
    return new RegExp(regex);
  }
  throw new Error('Regex invalid');
}

function parseDate(dateStr, name, throwOnError = true) {
  if (dateStr) {
    try {
      return new Date(Date.parse(dateStr));
    } catch (e) {
      if (throwOnError) {
        throw new Error(`Could 't parse date "${name}"`);
      }
    }
  }
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
}

module.exports = { getRegexpInstance, parseDate, msToTime };
