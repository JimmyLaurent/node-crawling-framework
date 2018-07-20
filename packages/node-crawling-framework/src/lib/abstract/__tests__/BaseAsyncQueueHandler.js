const BaseAsyncQueueHandler = require('../BaseAsyncQueueHandler');
const Promise = require('bluebird');

class DelayAsyncQueue extends BaseAsyncQueueHandler {
  constructor(settings) {
    super(null, { autoCloseOnIdle: true, ...settings });
    this.callOrder = [];
    this.callNumber = 0;
  }

  process(id, delay) {
    this.callNumber++;
    return Promise.delay(delay).then(() => {
      this.callOrder.push(id);
      return this.callOrder;
    });
  }
}

describe('BaseAsyncQueueHandler', () => {
  it('queue should not be idle when one job is scheduled', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.schedule(1, 25);

    const isIdle = await delayAsyncQueue.isIdle();

    expect(isIdle).toBe(false);
  });

  it('queue should not be idle when paused', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.pause();

    const isIdle = await delayAsyncQueue.isIdle();

    expect(isIdle).toBe(false);
  });

  it('queue should be idle when empty', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    await delayAsyncQueue.start();

    const isIdle = await delayAsyncQueue.isIdle();

    expect(isIdle).toBe(true);
  });

  it('queue should be idle when all jobs have been processed', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();

    await delayAsyncQueue.start();
    await delayAsyncQueue.schedule(1, 10);

    await new Promise(resolve => {
      delayAsyncQueue.on('drained', async () => {
        const isIdle = await delayAsyncQueue.isIdle();
        expect(isIdle).toBe(true);
        resolve();
      });
    });
  });

  it('queue should not be idle when a job is beeing processed', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    await delayAsyncQueue.schedule(1, 500);
    delayAsyncQueue.start();

    await new Promise(resolve =>
      delayAsyncQueue.on('process', async () => {
        const isIdle = await delayAsyncQueue.isIdle();

        expect(isIdle).toBe(false);
        resolve();
      })
    );
  });

  it('queue should not call proccess when queue is empty', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.start();

    await Promise.delay(50);

    expect(delayAsyncQueue.callNumber).toBe(0);
  });

  it('processNext should be call only one time if it returns false', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.start();
    delayAsyncQueue.processNext = jest.fn();
    delayAsyncQueue.processNext.mockReturnValueOnce(false);

    await Promise.delay(50);

    expect(delayAsyncQueue.processNext.mock.calls.length).toBe(1);
  });

  it('processNext should not be called when canProcessMore returns false', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.start();
    delayAsyncQueue.processNext = jest.fn();
    delayAsyncQueue.canProcessMore = jest.fn();
    delayAsyncQueue.canProcessMore.mockReturnValueOnce(false);

    await Promise.delay(50);

    expect(delayAsyncQueue.processNext.mock.calls.length).toBe(0);
  });

  it('queue should not process more items when paused', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.process = jest.fn();

    await delayAsyncQueue.start();
    await delayAsyncQueue.schedule(1);
    await Promise.delay(200);
    delayAsyncQueue.pause();
    await delayAsyncQueue.schedule(2);
    await Promise.delay(200);

    expect(delayAsyncQueue.process.mock.calls.length).toBe(1);
  });

  it('queue should resume when resumed', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.process = jest.fn();

    delayAsyncQueue.start();
    delayAsyncQueue.schedule(1);
    await Promise.delay(0);
    delayAsyncQueue.pause();
    delayAsyncQueue.schedule(2);
    delayAsyncQueue.resume();
    await Promise.delay(0);

    expect(delayAsyncQueue.process.mock.calls.length).toBe(2);
  });

  it('queue should call open promises when starting', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.process = jest.fn();
    let calledNumber = 0;

    const p1 = () => {
      return new Promise(resolve => {
        calledNumber++;
        resolve();
      });
    };
    const p2 = () => {
      return new Promise(resolve => {
        calledNumber++;
        resolve();
      });
    };
    delayAsyncQueue.addOpenPromiseCallback(p1);
    delayAsyncQueue.addOpenPromiseCallback(p2);
    delayAsyncQueue.start();

    await new Promise(resolve => {
      delayAsyncQueue.on('started', async () => {
        expect(calledNumber).toBe(2);
        resolve();
      });
    });
  });

  it('queue should call close promises when stopping', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.process = jest.fn();
    let calledNumber = 0;

    const p1 = () => {
      return new Promise(resolve => {
        calledNumber++;
        resolve();
      });
    };
    const p2 = () => {
      return new Promise(resolve => {
        calledNumber++;
        resolve();
      });
    };
    delayAsyncQueue.start();
    delayAsyncQueue.addClosePromiseCallback(p1);
    delayAsyncQueue.addClosePromiseCallback(p2);

    await delayAsyncQueue.close();

    expect(calledNumber).toBe(2);
  });

  it('onClose should resolve when the queue is closed', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();

    delayAsyncQueue.start();
    await Promise.delay(0);
    await Promise.all([delayAsyncQueue.close(), delayAsyncQueue.onClose()]);
  });

  it('customProcessMethod should be calle when set', async () => {
    const delayAsyncQueue = new DelayAsyncQueue({
      processMethodName: 'customProcessMethod'
    });

    delayAsyncQueue.start();
    delayAsyncQueue.schedule(1);
    delayAsyncQueue.customProcessMethod = jest.fn();

    await Promise.delay(50);
    expect(delayAsyncQueue.customProcessMethod.mock.calls.length).toBe(1);
  });

  it('customProcessMethod should be calle when set', async () => {
    const delayAsyncQueue = new DelayAsyncQueue({
      processMethodName: 'customProcessMethod'
    });

    delayAsyncQueue.start();
    delayAsyncQueue.schedule(1);
    delayAsyncQueue.customProcessMethod = jest.fn();

    await Promise.delay(50);
    expect(delayAsyncQueue.customProcessMethod.mock.calls.length).toBe(1);
  });

  it('should emit an error when an error is encountered while processing', done => {
    const delayAsyncQueue = new DelayAsyncQueue();

    delayAsyncQueue.process = () => {
      return Promise.reject(new Error('error while processing'));
    };

    delayAsyncQueue.start();
    delayAsyncQueue.schedule(1);

    delayAsyncQueue.on('error', error => {
      expect(error).toEqual(new Error('error while processing'));
      done();
    });
  });

  it('should throw when starting a queue already started', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();

    await delayAsyncQueue.start();

    await expect(delayAsyncQueue.start()).rejects.toEqual(
      new Error('Async queue handler already started')
    );
  });

  it('should throw when trying to schedule without item', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();

    await expect(delayAsyncQueue.schedule()).rejects.toEqual(
      new Error('AsyncQueueHandler: nothing to schedule')
    );
  });

  it('canQueueMore should return true when queue is not full', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.maxQueueSize = 1;

    expect(delayAsyncQueue.canQueueMore()).toBe(true);
  });

  it('canQueueMore should return false when queue is full', async () => {
    const delayAsyncQueue = new DelayAsyncQueue();
    delayAsyncQueue.maxQueueSize = 1;

    delayAsyncQueue.schedule(1);

    expect(delayAsyncQueue.canQueueMore()).toBe(false);
  });
});
