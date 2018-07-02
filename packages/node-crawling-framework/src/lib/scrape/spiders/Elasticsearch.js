const elasticsearch = require('elasticsearch');
const Request = require('../../download/request/Request');
const BaseSpider = require('./BaseSpider');
const { msToTime } = require('../../utils/commonHelpers');

class Elasticsearch extends BaseSpider {
  constructor() {
    super();
    this.esConfig = null;
    this.indexName = '';
    this.typeName = '';
    this.scroll = '200s';
    this.bufferSize = 50;
    this.body = {
      query: {
        match_all: {}
      }
    };
  }

  open() {
    this.assertConfig();
    this.esClient = new elasticsearch.Client(this.esConfig);
    super.open();
  }

  assertConfig() {
    if (!this.esConfig) {
      throw new Error('Missing elasticsearch general config (esConfig)');
    }
    if (!this.indexName) {
      throw new Error('Missing elasticsearch index name (indexName)');
    }
    if (!this.typeName) {
      throw new Error('Missing elasticsearch type name (typeName)');
    }
  }

  *parse(response, metadata) {
    throw new Error(
      'Elasticsearch spider: you must implement the parse method'
    );
  }

  *createRequestsFromItem(item) {
    let source = item._source;
    yield new Request(source.url, { metadata: source });
  }

  *createRequestsFromItems(items) {
    for (let item of items) {
      yield* this.createRequestsFromItem(item);
    }
  }

  *startRequests() {
    let startTime = new Date().getTime();
    let response = yield this.esClient.search({
      index: this.indexName,
      type: this.typeName,
      scroll: this.scroll,
      size: this.bufferSize,
      body: this.body
    });

    if (!response || !response.hits || !response.hits.hits) {
      this.logger.log(
        'ES Spider: No result returned from elastic search query'
      );
      return;
    }

    let count = response.hits.hits.length;
    yield* this.createRequestsFromItems(response.hits.hits);
    this.logger.log('ES Spider: ' + count + ' items successfully feeded');
    this.logger.log(
      'ES Spider: Time elapsed:' + msToTime(new Date().getTime() - startTime)
    );

    while (count < response.hits.total) {
      response = yield this.esClient.scroll({
        scrollId: response._scroll_id,
        scroll: this.scroll
      });

      yield* this.createRequestsFromItems(response.hits.hits);
      count += response.hits.hits.length;
      this.logger.log('ES Spider: ' + count + ' items successfully feeded');
      this.logger.log(
        'ES Spider: time elapsed ' + msToTime(new Date().getTime() - startTime)
      );
    }
    this.logger.log('ES Spider: all items successfully feeded');
  }

  close() {
    return this.esClient.close();
  }
}

module.exports = Elasticsearch;
