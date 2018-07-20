const Promise = require('bluebird');
const DownloadManager = require('../DownloadManager');
const BaseDownloader = require('../downloaders/BaseDownloader');
const Request = require('../request/Request');

class DelayDownloader extends BaseDownloader {
  constructor() {
    super();
    this.callOrder = [];
  }

  download(request) {
    return Promise.delay(request.metadata.delay).then(() => {
      this.callOrder.push(request.metadata.id);
      return this.callOrder;
    });
  }
}

async function getDownloadManager(settings, requestFilter) {
  const downloadManager = new DownloadManager(settings, requestFilter);
  const delayDownloader = new DelayDownloader();
  downloadManager.getLogger = () => console;
  downloadManager.setDownloader(delayDownloader);
  return downloadManager;
}

// test filter, filterSetting, dontFilter flag

describe('DownloadManager', () => {
  it('schedule should throw when downloader is not set', async () => {
    const downloadManager = new DownloadManager();

    expect(() =>
      downloadManager.schedule(new Request('http://url1.com'))
    ).toThrow(new Error('DownloadManager: downloader not loaded'));
  });

  it('schedule should throw when trying to schedule something different than a request', async () => {
    const downloadManager = await getDownloadManager();

    expect(() => downloadManager.schedule('http://url1.com')).toThrow(
      new Error('DownloaderManager: schedule only accepts requests objects')
    );
  });

  it('schedule should filter when requestFilter say so and the filtering is activated', async () => {
    const requestFilter = { mustFilter: () => true };
    const downloadManager = await getDownloadManager(
      { filterDuplicateRequests: true },
      requestFilter
    );

    await downloadManager.schedule(new Request('http://url1.com'));

    expect(downloadManager.queue.queue.length).toBe(0);
  });

  it('schedule should not filter when filtering is desactivated', async () => {
    const requestFilter = { mustFilter: () => true };
    const downloadManager = await getDownloadManager(
      { filterDuplicateRequests: false },
      requestFilter
    );

    await downloadManager.schedule(new Request('http://url1.com'));

    expect(downloadManager.queue.queue.length).toBe(1);
  });

  it('schedule should not filter when dontFilter flag is set', async () => {
    const requestFilter = { mustFilter: () => true };
    const downloadManager = await getDownloadManager(
      { filterDuplicateRequests: false },
      requestFilter
    );

    await downloadManager.schedule(
      new Request('http://url1.com', { dontFilter: true })
    );

    expect(downloadManager.queue.queue.length).toBe(1);
  });

  it('schedule should call requestFilter.mustFilter even if there is dontFilter flag', async () => {
    const mustFilter = jest.fn().mockReturnValueOnce(true);
    const requestFilter = { mustFilter };
    const downloadManager = await getDownloadManager(
      { filterDuplicateRequests: true },
      requestFilter
    );

    await downloadManager.schedule(
      new Request('http://url1.com', { dontFilter: true })
    );

    expect(mustFilter.mock.calls.length).toBe(1);
    expect(downloadManager.queue.queue.length).toBe(1);
  });

  it('schedule not should call requestFilter.mustFilter when filtering is desactivated', async () => {
    const mustFilter = jest.fn().mockReturnValueOnce(true);
    const requestFilter = { mustFilter };
    const downloadManager = await getDownloadManager(
      { filterDuplicateRequests: false },
      requestFilter
    );

    await downloadManager.schedule(
      new Request('http://url1.com', { dontFilter: true })
    );

    expect(mustFilter.mock.calls.length).toBe(0);
    expect(downloadManager.queue.queue.length).toBe(1);
  });

  it('queue download', async () => {
    const downloadManager = await getDownloadManager();

    await downloadManager.schedule(
      new Request('http://url1.com', { metadata: { id: 1, delay: 50 } })
    );

    await Promise.all([
      downloadManager.start(),
      new Promise(resolve => {
        downloadManager.on('drained', () => {
          expect(downloadManager.downloader.callOrder).toEqual([1]);
          resolve();
        });
      })
    ]);
  });

  it('download concurrent', async () => {
    const downloadManager = await getDownloadManager({
      maxDownloadConcurency: 3
    });

    await downloadManager.schedule(
      new Request('http://url1.com', { metadata: { id: 1, delay: 50 } })
    );
    await downloadManager.schedule(
      new Request('http://url2.com', { metadata: { id: 2, delay: 100 } })
    );
    await downloadManager.schedule(
      new Request('http://url3.com', { metadata: { id: 3, delay: 25 } })
    );

    await Promise.all([
      downloadManager.start(),
      new Promise(resolve => {
        downloadManager.on('drained', () => {
          expect(downloadManager.downloader.callOrder).toEqual([3, 1, 2]);
          resolve();
        });
      })
    ]);
  });

  it('download concurrent limit', async () => {
    const downloadManager = await getDownloadManager({
      maxDownloadConcurency: 2
    });

    await downloadManager.schedule(
      new Request('http://url1.com', { metadata: { id: 1, delay: 100 } })
    );
    await downloadManager.schedule(
      new Request('http://url2.com', { metadata: { id: 2, delay: 75 } })
    );
    await downloadManager.schedule(
      new Request('http://url3.com', { metadata: { id: 3, delay: 50 } })
    );

    await Promise.all([
      downloadManager.start(),
      new Promise(resolve => {
        downloadManager.on('drained', () => {
          expect(downloadManager.downloader.callOrder).toEqual([2, 1, 3]);
          resolve();
        });
      })
    ]);
  });

  it('download sequentially', async () => {
    const downloadManager = await getDownloadManager();
    await downloadManager.schedule(
      new Request('http://url1.com', { metadata: { id: 1, delay: 50 } })
    );
    await downloadManager.schedule(
      new Request('http://url2.com', { metadata: { id: 2, delay: 25 } })
    );
    await downloadManager.schedule(
      new Request('http://url3.com', { metadata: { id: 3, delay: 25 } })
    );
    await Promise.all([
      downloadManager.start(),
      new Promise(resolve => {
        downloadManager.on('drained', () => {
          expect(downloadManager.downloader.callOrder).toEqual([1, 2, 3]);
          resolve();
        });
      })
    ]);
  });
});
