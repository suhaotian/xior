import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import xior, { Xior as XiorInstance } from 'xior';
import MockPlugin from 'xior/plugins/mock';

let instance: XiorInstance;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior;
  mock = new MockPlugin(instance);
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin replyOnce tests', () => {
  it('supports chaining', function () {
    mock.onGet('/foo').replyOnce(200).onAny('/foo').replyOnce(500).onPost('/foo').replyOnce(201);

    assert.equal(mock.handlers['get']?.length, 2);
    assert.equal(mock.handlers['post']?.length, 2);
  });

  it('replies as normally on the first call', function () {
    mock.onGet('/foo').replyOnce(200, {
      foo: 'bar',
    });

    return instance.get('/foo').then(function (response) {
      assert.equal(response.status, 200);
      assert.equal(response.data.foo, 'bar');
    });
  });

  it('replies only once', async function () {
    let called = false;
    mock.onGet('/foo').replyOnce(200);

    let error: any;
    await instance
      .get('/foo')
      .then(function () {
        called = true;
        return instance.get('/foo');
      })
      .catch(function (err) {
        error = err;
      });
    assert.equal(called, true);
    assert.equal(error.response.status, 404);
  });

  it('replies only once when used with onAny', async function () {
    let called = false;
    mock.onAny('/foo').replyOnce(200);

    let error: any;
    await instance
      .get('/foo')
      .then(function () {
        called = true;
        return instance.get('/foo');
      })
      .catch(function (err) {
        error = err;
      });
    assert.equal(called, true);
    assert.equal(error.response.status, 404);
  });

  it('replies only once when using request body matching', async function () {
    let called = false;
    const body = 'abc';
    mock.onPost('/onceWithBody', body).replyOnce(200);

    let error: any;
    await instance
      .post('/onceWithBody', body)
      .then(function () {
        called = true;
        return instance.post('/onceWithBody', body);
      })
      .catch(function (err) {
        error = err;
      });

    assert.equal(called, true);
    assert.equal(error.response.status, 404);
  });

  it('replies only once when using a function that returns a response', function () {
    mock
      .onGet('/foo')
      .replyOnce(function () {
        return [200];
      })
      .onGet('/foo')
      .replyOnce(function () {
        return [202];
      });

    return instance
      .get('/foo')
      .then(function (response) {
        assert.equal(response.status, 200);
        return instance.get('/foo');
      })
      .then(function (response) {
        assert.equal(response.status, 202);
      });
  });
});
