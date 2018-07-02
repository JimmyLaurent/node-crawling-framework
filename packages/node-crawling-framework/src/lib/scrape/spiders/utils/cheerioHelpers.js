const cheerio = require('cheerio');

function loadCheerioFromReponse(response) {
  const contentType = response.headers['content-type'];
  const xmlMode =
    contentType.includes('text/xml') || contentType.includes('application/xml');
  return cheerio.load(response.body, { xmlMode });
}

module.exports = { loadCheerioFromReponse };
