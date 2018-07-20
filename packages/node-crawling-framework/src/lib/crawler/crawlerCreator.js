const path = require('path');
const Crawler = require('./Crawler');
const defaultConfig = require('./defaultConfig');

// TODO: refactor this class

class CrawlerCreator {
  constructor(spiderResolvePath = 'spiders') {
    this.spiderResolvePath = spiderResolvePath;
    this.downloadersResolvePath = path.join(
      __dirname,
      '../download/downloaders'
    );
    this.downloaderMiddlewaresResolvePath = path.join(
      __dirname,
      '../download/downloaders/middlewares'
    );
    this.itemProcessorMiddlewaresResolvePath = path.join(
      __dirname,
      '../scrape/item-processor/middlewares'
    );
    this.spiderMiddlewaresResolvePath = path.join(
      __dirname,
      '../scrape/spiders/middlewares'
    );
  }

  setSpiderResolvePath(spiderResolvePath) {
    this.spiderResolvePath = spiderResolvePath;
  }

  resolveSpider(spider) {
    const paths = [
      path.join(path.dirname(process.argv[1]), 'spiders'),
      path.dirname(process.argv[1]),
      process.cwd(),
      path.join(process.cwd(), 'spiders'),
      this.spiderResolvePath
    ];

    try {
      const modulePath = require.resolve(spider, {
        paths
      });
      return require(modulePath);
    } catch (e) {
      throw new Error(`Spider "${spider}" not found : ${e.message}
      Searched in path: ${paths}`);
    }
  }

  resolveSpiderMiddleware(spiderMiddleware) {
    try {
      return require(path.resolve(
        this.spiderMiddlewaresResolvePath,
        spiderMiddleware
      ));
    } catch (e) {
      throw new Error(`Spider middleware "${spiderMiddleware}" not found`);
    }
  }

  resolveDownloader(downloader) {
    try {
      return require(path.resolve(this.downloadersResolvePath, downloader));
    } catch (e) {
      throw new Error(`Downloader "${downloader}" not found`);
    }
  }

  resolveDownloaderMiddleware(downloaderMiddleware) {
    try {
      return require(path.resolve(
        this.downloaderMiddlewaresResolvePath,
        downloaderMiddleware
      ));
    } catch (e) {
      throw new Error(
        `Downloader middleware "${downloaderMiddleware}" not found`
      );
    }
  }

  resolveItemProcessorMiddleware(middleware) {
    try {
      return require(path.resolve(
        this.itemProcessorMiddlewaresResolvePath,
        middleware
      ));
    } catch (e) {
      throw new Error(`Item processor middleware "${middleware}" not found`);
    }
  }

  instantiateSpiderMiddleware(middlewareName, options) {
    try {
      const middleware = this.resolveSpiderMiddleware(middlewareName);
      return middleware(options);
    } catch (e) {
      throw new Error(`Couldn't load "${middlewareName}" spider middleware`);
    }
  }

  instantiateSpiderMiddlewares(middlewaresObj) {
    return Object.keys(middlewaresObj).map(middlewareName =>
      this.instantiateSpiderMiddleware(
        middlewareName,
        middlewaresObj[middlewareName]
      )
    );
  }

  loadSpiderMiddlewares(middlewares) {
    if (middlewares) {
      if (Array.isArray(middlewares)) {
        return middlewares;
      }
      if (typeof middlewares === 'object') {
        return this.instantiateSpiderMiddlewares(middlewares);
      }
      throw new Error('Wrong spider middlewares type');
    }
    return [];
  }

  instantiateSpider(Spider, options) {
    try {
      return new Spider(options);
    } catch (e) {
      throw new Error("Couldn't instantiate spider " + e.stack);
    }
  }

  createSpider(config) {
    const spiderConfig = config.spider;
    if (!spiderConfig || !spiderConfig.type) {
      throw new Error('Spider configuration missing or incomplete');
    }
    let spider;
    if (typeof spiderConfig.type === 'string') {
      const Spider = this.resolveSpider(spiderConfig.type);
      spider = new Spider(spiderConfig.options);
    } else {
      spider = this.instantiateSpider(spiderConfig.type, spiderConfig.options);
    }

    const middlewares = this.loadSpiderMiddlewares(config.spider.middlewares);
    middlewares.map(m => spider.use(m));

    return spider;
  }

  createDownloader(type, options) {
    if (typeof type === 'string') {
      const Downloader = this.resolveDownloader(type);
      return new Downloader(options);
    }
    return this.instantiateDownloader(type, options);
  }

  instantiateDownloader(Downloader, options) {
    try {
      return new Downloader(options);
    } catch (e) {
      throw new Error("Couldn't instantiate downloader");
    }
  }

  instantiateDownloaderMiddleware(middlewareName, options) {
    try {
      const middleware = this.resolveDownloaderMiddleware(middlewareName);
      return middleware(options);
    } catch (e) {
      throw new Error(`Couldn't load "${middlewareName}" download middleware`);
    }
  }

  instantiateDownloaderMiddlewares(middlewaresObj) {
    return Object.keys(middlewaresObj).map(middlewareName => {
      if (typeof middlewaresObj[middlewareName] === 'function') {
        return middlewaresObj[middlewareName]();
      } else {
        return this.instantiateDownloaderMiddleware(
          middlewareName,
          middlewaresObj[middlewareName]
        );
      }
    });
  }

  loadDownloaderMiddlewares(middlewares) {
    if (middlewares) {
      if (Array.isArray(middlewares)) {
        return middlewares;
      }
      if (typeof middlewares === 'object') {
        return this.instantiateDownloaderMiddlewares(middlewares);
      }
      throw new Error('Wrong downloader middlewares type');
    }
    return [];
  }

  loadDownloader(config) {
    const downloaderConfig = config.downloader;
    if (!downloaderConfig || !downloaderConfig.type) {
      throw new Error('Downloader configuration missing or incomplete');
    }
    const downloader = this.createDownloader(
      downloaderConfig.type,
      downloaderConfig.options
    );
    const middlewares = this.loadDownloaderMiddlewares(
      config.downloader.middlewares
    );
    middlewares.map(m => downloader.use(m));
    return downloader;
  }

  instantiateItemProcessorMiddleware(middlewareName, options) {
    try {
      const middleware = this.resolveItemProcessorMiddleware(middlewareName);
      return middleware(options);
    } catch (e) {
      throw new Error(
        `Couldn't load "${middlewareName}" item processor middleware`
      );
    }
  }

  instantiateItemProcessorMiddlewares(middlewaresObj) {
    return Object.keys(middlewaresObj).map(middlewareName => {
      if (typeof middlewaresObj[middlewareName] === 'function') {
        return middlewaresObj[middlewareName]();
      } else {
        return this.instantiateItemProcessorMiddleware(
          middlewareName,
          middlewaresObj[middlewareName]
        );
      }
    });
  }

  loadItemProcessorMiddlewares(middlewares) {
    if (middlewares) {
      if (Array.isArray(middlewares)) {
        return middlewares;
      }
      if (typeof middlewares === 'object') {
        return this.instantiateItemProcessorMiddlewares(middlewares);
      }
      throw new Error('Wrong item processor middlewares type');
    }
    return [];
  }

  createCrawlerFromConfig(config) {
    if (!config) {
      throw new Error('Configuration missing');
    }
    const spider = this.createSpider(config);
    const crawler = new Crawler(spider, config.settings);
    const downloader = this.loadDownloader(config);
    crawler.setDownloader(downloader);

    if (config.itemProcessor && config.itemProcessor.middlewares) {
      const itemProcessorMiddlewares = this.loadItemProcessorMiddlewares(
        config.itemProcessor.middlewares
      );
      itemProcessorMiddlewares.map(m => crawler.itemProcessor.use(m));
    }

    return crawler;
  }

  createCrawlerConfig(spiderType, spiderOptions = {}, overideConfig = {}) {
    const config = Object.assign({}, defaultConfig, overideConfig, {
      spider: {
        ...defaultConfig.spider,
        type: spiderType,
        options: spiderOptions
      }
    });
    return config;
  }

  createCrawler(config, spiderType, spiderOptions) {
    config.spider = config.spider || {};
    config.spider.type = spiderType;
    config.spider.options = spiderOptions;

    const crawler = this.createCrawlerFromConfig(config);
    if (config.logger) {
      crawler.setLogger(logger);
    }
    return crawler;
  }
}

module.exports = new CrawlerCreator();
