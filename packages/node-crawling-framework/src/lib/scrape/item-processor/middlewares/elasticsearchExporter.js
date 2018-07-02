const elasticsearch = require('elasticsearch');

const createElasticsearchMiddleware = ({
  esConfig,
  state,
  getBulkActionForItem,
  bufferSize = 200
}) => {
  let localState = state;
  let buffer = [];
  if (!esConfig) {
    throw new Error(
      'Elasticsearch middleware: missing elasticsearch general configuration (esConfig)'
    );
  }
  if (!getBulkActionForItem) {
    throw new Error(
      `Elasticsearch middleware: missing "getBulkActionForItem" method`
    );
  }
  const getBulkActionForItemFn = getBulkActionForItem;
  const bufferSizeSetting = bufferSize;
  let esClient;
  return {
    open: itemProcessorManager => next => () => {
      itemProcessorManager.logger.log('ES Middleware: Instantiating client');
      esClient = new elasticsearch.Client(esConfig);
      return next();
    },
    process: itemProcessorManager => next => item => {
      const bulkAction = getBulkActionForItemFn(item, localState);
      if (bulkAction) {
        buffer = buffer.concat(bulkAction);
      }
      const promise = Promise.resolve();
      if (buffer.length >= bufferSizeSetting) {
        itemProcessorManager.logger.log('ES Middleware: Sending items');
        promise.then(() =>
          esClient.bulk({ body: buffer }).then(() => {
            buffer = [];
          })
        );
      }
      return promise.then(() => next(item));
    },
    close: itemProcessorManager => next => () => {
      const promise = Promise.resolve();
      if (buffer.length > 0) {
        itemProcessorManager.logger.log('ES Middleware: Sending last items');
        promise.then(() => esClient.bulk({ body: buffer }));
      }
      return promise.then(() => {
        itemProcessorManager.logger.log('ES Middleware: closing client');
        esCllient.close();
        return next();
      });
    }
  };
};

module.exports = createElasticsearchMiddleware;
