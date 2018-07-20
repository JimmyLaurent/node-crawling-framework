const { BaseDownloader, Response } = require('node-crawling-framework');
const genericPool = require('generic-pool');
const launchPuppeteer = require('./puppeteer');
const { hideWebDriver, injectScriptInjector } = require('./utils');

class PuppeteerDownloader extends BaseDownloader {
  constructor({maxDownloadConcurency} = {}) {
    super();
    this.maxPagePoolSize = maxDownloadConcurency || 50;
  }

  async open() {
    this.browser = await launchPuppeteer({
      headless: true,
      proxyUrl: process.env.HTTP_PROXY
    });
    this.browserPagePool = genericPool.createPool(
      {
        create: async () => await this.browser.newPage(),
        destroy: () => {}
      },
      {
        min: 0,
        max: this.maxPagePoolSize,
        maxWaitingClients: 50
      }
    );
  }

  async processRequest(req) {
    const meta = req.metadata;
    const page = await this.browserPagePool.acquire();
    try {
      const response = await page.goto(req.url, {
        //waitUntil: 'networkidle0',
        timeout: req.metadata.timeout || 10000
      });
      await hideWebDriver(page);
      await injectScriptInjector(page);

      // Add to meta api
      // meta.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])
      // meta.waitForFunction(pageFunction[, options[, ...args]])
      // meta.waitForNavigation(options)
      // meta.waitForSelector(selector[, options])
      // meta.waitForXPath(xpath[, options])

      let body;
      if (meta.puppeteerEvaluate) {
        body = await page.evaluate(
          meta.puppeteerEvaluate,
          meta.puppeteerEvaluateArgs
        );
      } else {
        body = await page.content();
      }

      const headers = response.headers();
      const statusCode = response.status();
      const url = response.url();

      return {
        body,
        headers,
        statusCode,
        url
      };
    } finally {
      await this.browserPagePool.release(page);
    }
  }

  processResponse(res, req) {
    return new Response(res.statusCode, res.body, res.url, res.headers);
  }

  async close() {
    await this.browserPagePool.drain();
    await this.browserPagePool.clear();
    await this.browser.close();
  }
}

module.exports = PuppeteerDownloader;
