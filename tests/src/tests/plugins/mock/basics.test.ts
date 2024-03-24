import assert from 'node:assert';
import { after, before, describe, it, beforeEach, afterEach } from 'node:test';
import { XiorError, xior, XiorResponse, isXiorError } from 'xior';
import MockPlugin from 'xior/plugins/mock';

import { startServer } from '../../server';

let close: Function;
const port = 7882;
const baseURL = `http://localhost:${port}`;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

let instance: xior;
let mock: MockPlugin;

beforeEach(function () {
  instance = xior.create({ baseURL });
  mock = new MockPlugin(instance);
});

afterEach(function () {
  mock.restore();
});

describe('xior mock plguin basics tests', () => {
  it('correctly sets the plugin on the xior instance', async () => {
    assert.equal((instance as any).P.length, 1);
  });

  it('calls interceptors', async () => {
    instance.interceptors.response.use(
      function (config) {
        return config.data;
      },
      function (error) {
        return Promise.reject(error);
      }
    );

    mock.onGet('/foo').reply(200, {
      foo: 'bar',
    });

    const res = await instance.get('/foo');
    assert.strictEqual(res.data.foo, 'bar');
  });

  it('supports all verbs', function () {
    assert.equal(typeof mock.onGet, 'function');
    assert.equal(typeof mock.onPost, 'function');
    assert.equal(typeof mock.onPut, 'function');
    assert.equal(typeof mock.onHead, 'function');
    assert.equal(typeof mock.onDelete, 'function');
    assert.equal(typeof mock.onPatch, 'function');
    assert.equal(typeof mock.onOptions, 'function');
  });

  it('mocks requests', async () => {
    mock.onGet('/foo').reply(200, {
      foo: 'bar',
    });

    return instance.get('/foo').then(function (response) {
      assert.equal(response.status, 200);
      assert.equal(response.data.foo, 'bar');
    });
  });

  it('can return headers', function () {
    mock.onGet('/foo').reply(
      200,
      {},
      {
        foo: 'bar',
      }
    );

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get('foo'), 'bar');
    });
  });

  it('accepts a callback that returns a response', function () {
    mock.onGet('/foo').reply(function () {
      return [200, { foo: 'bar' }];
    });

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.foo, 'bar');
    });
  });

  it('accepts a callback that returns an axios request', async function () {
    mock
      .onGet('/bar')
      .reply(200, { foo: 'bar' })
      .onGet('/foo')
      .reply(async function () {
        return instance.get('/bar');
      });

    await instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.config.url, '/bar');
      assert.strictEqual(response.data.foo, 'bar');
    });
  });

  it('matches on a regex', function () {
    mock.onGet(/\/fo+/).reply(200);

    return instance.get('/foooooooooo').then(function (response) {
      assert.strictEqual(response.status, 200);
    });
  });

  it('can pass query params for get to match to a handler', async function () {
    mock.onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } }).reply(200);

    const res = await instance.get('/withParams', { params: { bar: 'foo', foo: 'bar' } });

    assert.strictEqual(res.status, 200);
  });

  it('can pass ata to options for delete to match to a handler', function () {
    mock.onDelete('/withParams', { data: { bar: 2 }, params: { foo: 1 } }).reply(200);

    return instance
      .delete('/withParams', { params: { foo: 1 }, data: { bar: 2 } })
      .then(function (response) {
        assert.strictEqual(response.status, 200);
      });
  });

  it('can pass query params for head to match to a handler', function () {
    mock.onHead('/withParams', { params: { foo: 'bar', bar: 'foo' } }).reply(200);

    return instance
      .head('/withParams', { params: { bar: 'foo', foo: 'bar' } })
      .then(function (response) {
        assert.strictEqual(response.status, 200);
      });
  });

  it('can pass query params to match to a handler with uppercase method', async function () {
    mock.onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } }).reply(200);

    const res = await instance.request({
      method: 'GET',
      url: '/withParams',
      params: { foo: 'bar', bar: 'foo' },
    });

    assert.strictEqual(res.status, 200);
  });

  it('does not match when parameters are wrong', async function () {
    mock.onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } }).reply(200);
    let errorStatus = 0;
    await instance
      .get('/withParams', { params: { foo: 'bar', bar: 'other' } })
      .catch(function (error) {
        errorStatus = error.response.status;
      });
    assert.strictEqual(errorStatus, 404);
  });

  it('does not match when parameters are wrong', async function () {
    mock.onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } }).reply(200);

    let errorStatus = 0;
    await instance.get('/withParams').catch(function (error) {
      errorStatus = error.response.status;
    });
    assert.strictEqual(errorStatus, 404);
  });

  it('matches when parameters were not expected', function () {
    mock.onGet('/withParams').reply(200);
    return instance
      .get('/withParams', { params: { foo: 'bar', bar: 'foo' } })
      .then(function (response) {
        assert.strictEqual(response.status, 200);
      });
  });

  it('can pass a body to match to a handler', function () {
    mock.onPost('/withBody', { body: { is: 'passed' }, in: true }).reply(200);

    return instance
      .post('/withBody', { body: { is: 'passed' }, in: true })
      .then(function (response) {
        assert.strictEqual(response.status, 200);
      });
  });

  it('does not match when body is wrong', async function () {
    const body = { body: { is: 'passed' }, in: true };
    mock.onPatch('/wrongObjBody', body).reply(200);

    let errorStatus = 0;
    await instance.patch('/wrongObjBody', { data: { wrong: 'body' } }).catch(function (error) {
      errorStatus = error.response.status;
    });
    assert.strictEqual(errorStatus, 404);
  });

  it('does not match when string body is wrong', async function () {
    mock.onPatch('/wrongStrBody', 'foo').reply(200);

    let errorStatus = 0;
    await instance.patch('/wrongStrBody', 'bar').catch(function (error) {
      errorStatus = error.response.status;
    });
    assert.strictEqual(errorStatus, 404);
  });

  it('can pass headers to match to a handler', function () {
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Header-test': 'test-header',
    };

    mock.onPost('/withHeaders', undefined, { headers }).reply(200);

    return instance.post('/withHeaders', undefined, { headers }).then(function (response) {
      assert.strictEqual(response.status, 200);
    });
  });

  it('does not match when request header is wrong', async function () {
    const headers = { 'Header-test': 'test-header' };
    mock.onPatch('/wrongObjHeader', undefined, { headers }).reply(200);

    let errorStatus = 0;
    await instance
      .patch('/wrongObjHeader', undefined, {
        headers: { 'Header-test': 'wrong-header' },
      })
      .catch(function (error) {
        errorStatus = error.response.status;
      });
    assert.strictEqual(errorStatus, 404);
  });

  it('passes the config to the callback', function () {
    mock.onGet(/\/products\/\d+/).reply(function (config) {
      return [200, {}, { RequestedURL: config.url }];
    });

    return instance.get('/products/25').then(function (response) {
      assert.strictEqual(response.headers.get('RequestedURL'), '/products/25');
    });
  });

  it('handles post requests', function () {
    mock.onPost('/foo').reply(function (config) {
      return [200, config.data.bar];
    });

    return instance.post('/foo', { bar: 'baz' }).then(function (response) {
      assert.strictEqual(response.data, 'baz');
    });
  });

  it('works when using baseURL', function () {
    instance.defaults.baseURL = 'http://www.example.org';

    mock.onGet('/foo').reply(200);

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
    });
  });

  it('allows using an absolute URL when a baseURL is set', function () {
    instance.defaults.baseURL = 'http://www.example.org';

    mock.onAny().reply(function (config) {
      return [200, config.url];
    });

    return instance.get('http://www.foo.com/bar').then(function (response) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data, 'http://www.foo.com/bar');
    });
  });

  it('allows mocks to match on the result of concatenating baseURL and url', function () {
    instance.defaults.baseURL = 'http://www.example.org/api/v1/';

    mock.onGet('http://www.example.org/api/v1/foo').reply(200);

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
    });
  });

  it('allows mocks to match on the result of concatenating baseURL and url with a regex', function () {
    instance.defaults.baseURL = 'http://www.example.org/api/v1/';

    mock.onGet(/\/api\/v1\/foo$/).reply(200);

    return instance.get('/foo').then(function (response) {
      assert.strictEqual(response.status, 200);
    });
  });

  it('allows multiple consecutive requests for the mocked url', function () {
    mock.onGet('/foo').reply(200);

    return instance
      .get('/foo')
      .then(function () {
        return instance.get('/foo');
      })
      .then(function (response) {
        assert.strictEqual(response.status, 200);
      });
  });

  it('returns a 404 when no matching url is found', async function () {
    let errorStatus = 0;
    await instance.get('/foo').catch(function (error) {
      errorStatus = error.response.status;
    });
    assert.strictEqual(errorStatus, 404);
  });

  it('rejects when the status is >= 300', async function () {
    mock.onGet('/moo').reply(500);

    let errorStatus = 0;
    await instance.get('/moo').catch(function (error) {
      errorStatus = error.response.status;
    });
    assert.strictEqual(errorStatus, 500);
  });

  it('rejects the promise with an error when the status is >= 300', async function () {
    mock.onGet('/foo').reply(500);

    let error: any = {};
    await instance.get('/foo').catch(function (err) {
      error = err;
    });
    assert.strictEqual(isXiorError(error), true);
    assert.strictEqual(/request failed/i.test(error.message), true);
  });

  it('handles errors thrown as expected', async function () {
    mock.onGet('/foo').reply(function () {
      throw new Error('bar');
    });

    let error: any = {};
    await instance.get('/foo').catch(function (err) {
      error = err;
    });
    assert.strictEqual(error instanceof Error, true);
    assert.strictEqual(error.message, 'bar');
  });

  it('resets the registered mock handlers', function () {
    mock.onGet('/foo').reply(200);
    assert.equal(mock.handlers['get'] && mock.handlers['get'].length > 0, true);

    mock.reset();
    assert.equal(mock.handlers['get'], undefined);
  });

  it('resets the history', function () {
    mock.onAny('/foo').reply(200);

    return instance.get('/foo').then(function (response) {
      mock.reset();
      assert.equal(mock.history['get'], undefined);
    });
  });

  it('resets only the registered mock handlers, not the history', function () {
    mock.onAny('/foo').reply(200);
    assert.equal(mock.handlers['get'] && mock.handlers['get']?.length > 0, true);
    assert.equal(mock.history['get'], undefined);

    return instance.get('/foo').then(function (response) {
      mock.resetHandlers();
      assert.equal(mock.history['get']?.length === 1, true);
      assert.equal(mock.handlers['get'], undefined);
    });
  });

  it('does not fail if reset is called after restore', function () {
    mock.restore();
    let hasError = false;
    try {
      mock.reset();
    } catch (e) {
      hasError = true;
    }
    assert.equal(hasError, false);
  });

  it('can chain calls to add mock handlers', function () {
    mock.onGet('/foo').reply(200).onAny('/bar').reply(404).onPost('/baz').reply(500);

    assert.equal(mock.handlers['get']?.length, 2);
    assert.equal(mock.handlers['patch']?.length, 1);
    assert.equal(mock.handlers['post']?.length, 2);
  });

  it('allows to delay responses', function () {
    mock.restore();
    mock = new MockPlugin(instance, { delayResponse: 1 });

    mock.onGet('/foo').reply(200);

    return instance.get('/foo').then(function (response) {
      assert.equal(response.status, 200);
    });
  });

  it('allows to delay error responses', async function () {
    mock.restore();
    mock = new MockPlugin(instance, { delayResponse: 1 });

    mock.onGet('/foo').reply(500);
    let error: any = {};
    await instance.get('/foo').catch(function (err) {
      error = err;
    });

    assert.equal(error.response.status, 500);
  });

  it('allows to delay responses when the response promise is rejected', async function () {
    mock.restore();
    mock = new MockPlugin(instance, { delayResponse: 1 });
    // mock.onAny()
    mock.onGet('/foo').reply(function (config) {
      return Promise.reject('error');
    });
    let error: any = {};
    await instance.get('/foo').catch(function (message) {
      error = message;
    });
    assert.equal(error, 'error');
  });

  it('allows delay in millsecond per request', async function () {
    mock.restore();
    mock = new MockPlugin(instance);
    const start = new Date().getTime();
    const firstDelay = 100;
    const secondDelay = 500;
    const success = 200;

    const fooOnDelayResponds = mock.onGet('/foo').withDelayInMs(firstDelay);
    fooOnDelayResponds(success);
    const barOnDelayResponds = mock.onGet('/bar').withDelayInMs(secondDelay);
    barOnDelayResponds(success);

    await Promise.all([
      instance.get('/foo').then(function (response) {
        const end = new Date().getTime() + 1; // fix  github actions
        const totalTime = end - start;

        assert.equal(response.status, success);
        assert.equal(
          totalTime >= firstDelay,
          true,
          `totalTime${totalTime} >= firstDelay${firstDelay} == true`
        );
      }),
      instance.get('/bar').then(function (response) {
        const end = new Date().getTime() + 1;
        const totalTime = end - start;

        assert.equal(response.status, success);
        assert.equal(
          totalTime >= secondDelay,
          true,
          `totalTime${totalTime} >= secondDelay${secondDelay} == true`
        );
      }),
    ]);
  });

  it('overrides global delay if request per delay is provided and respects global delay if otherwise', async function () {
    const start = new Date().getTime();
    const requestDelay = 100;
    const globalDelay = 500;
    const success = 200;
    mock.restore();
    mock = new MockPlugin(instance, { delayResponse: globalDelay });

    const fooOnDelayResponds = mock.onGet('/foo').withDelayInMs(requestDelay);
    fooOnDelayResponds(success);
    mock.onGet('/bar').reply(success);

    await Promise.all([
      instance.get('/foo').then(function (response) {
        const end = new Date().getTime() + 1;
        const totalTime = end - start;

        assert.equal(response.status, success);
        assert.equal(
          totalTime >= requestDelay,
          true,
          `totalTime${totalTime} >= requestDelay${requestDelay} == true`
        );

        //Ensure global delay is not applied
        assert.equal(
          totalTime < globalDelay,
          true,
          `totalTime${totalTime} < globalDelay${globalDelay} == true`
        );
      }),
      instance.get('/bar').then(function (response) {
        const end = new Date().getTime() + 1;
        const totalTime = end - start;

        assert.equal(response.status, success);
        assert.equal(
          totalTime >= globalDelay,
          true,
          `totalTime${totalTime} >= globalDelay${globalDelay} == true`
        );
      }),
    ]);
  });

  it('maps empty GET path to any path', async function () {
    mock.onGet('/foo').reply(200, 'foo').onGet().reply(200, 'bar');

    await Promise.all([
      instance.get('/foo').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'foo');
      }),
      instance.get('/bar').then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'bar');
      }),
      instance.get('/xyz' + Math.round(100000 * Math.random())).then(function (response) {
        assert.equal(response.status, 200);
        assert.equal(response.data, 'bar');
      }),
    ]);
  });

  it('allows mocking all requests', async function () {
    mock.onAny().reply(200);

    function anyResponseTester(response: XiorResponse) {
      assert.equal(response.status, 200);
    }

    await Promise.all([
      instance.get('/foo').then(anyResponseTester),
      instance.post('/bar').then(anyResponseTester),
      instance.put('/foobar').then(anyResponseTester),
      instance.head('/barfoo').then(anyResponseTester),
      instance.delete('/foo/bar').then(anyResponseTester),
      instance.patch('/bar/foo').then(anyResponseTester),
    ]);
  });

  it('returns a deep copy of the mock data in the response when the data is an object', async function () {
    const data = {
      foo: {
        bar: 123,
      },
    };

    mock.onGet('/').reply(200, data);

    await instance
      .get('/')
      .then(function (response) {
        response.data.foo.bar = 456;
      })
      .then(function () {
        assert.equal(data.foo.bar, 123);
      });
  });

  it('returns a deep copy of the mock data in the response when the data is an array', async function () {
    const data = [
      {
        bar: 123,
      },
    ];

    mock.onGet('/').reply(200, data);

    await instance
      .get('/')
      .then(function (response) {
        response.data[0].bar = 456;
      })
      .then(function () {
        assert.equal(data[0].bar, 123);
      });
  });

  it('can overwrite an existing mock', async function () {
    mock.onGet('/').reply(500);
    mock.onGet('/').reply(200);

    await instance.get('/').then(function (response) {
      assert.equal(response.status, 200);
    });
  });

  it('does not add duplicate handlers', function () {
    mock.onGet('/').replyOnce(312);
    mock.onGet('/').reply(200);
    mock.onGet('/1').reply(200);
    mock.onGet('/2').reply(200);
    mock.onGet('/3').replyOnce(300);
    mock.onGet('/3').reply(200);
    mock.onGet('/4').reply(200);

    assert.equal(mock.handlers['get']?.length, 7);
  });

  it('supports chaining on same path with different params', async function () {
    mock
      .onGet('/users', { params: { searchText: 'John' } })
      .reply(200, { id: 1 })
      .onGet('/users', { params: { searchText: 'James' } })
      .reply(200, { id: 2 })
      .onGet('/users', { params: { searchText: 'Jake' } })
      .reply(200, { id: 3 })
      .onGet('/users', { params: { searchText: 'Jackie' } })
      .reply(200, { id: 4 });

    await instance
      .get('/users', { params: { searchText: 'John' } })
      .then(function (response) {
        assert.equal(response.data.id, 1);
        return instance.get('/users', { params: { searchText: 'James' } });
      })
      .then(function (response) {
        assert.equal(response.data.id, 2);
        return instance.get('/users', { params: { searchText: 'Jake' } });
      })
      .then(function (response) {
        assert.equal(response.data.id, 3);
        return instance.get('/users', { params: { searchText: 'Jackie' } });
      })
      .then(function (response) {
        assert.equal(response.data.id, 4);
      });
  });

  it('can overwrite replies', async function () {
    mock.onGet('/').reply(500);
    mock.onGet('/').reply(200);
    mock.onGet('/').reply(401);
    let error: any;
    await instance.get('/').catch(function (err) {
      error = err;
    });

    assert.equal(mock.handlers['get']?.length, 1);
    assert.equal(error.response.status, 401);
  });

  it('can overwrite replies using RegEx', async function () {
    mock.onGet(/foo\/bar/).reply(500);
    mock.onGet(/foo\/bar/).reply(200);
    mock.onGet(/foo\/baz\/.+/).reply(200);

    await instance
      .get('/foo/bar')
      .then(function (response) {
        assert.strictEqual(mock.handlers['get']?.length, 2);
        assert.strictEqual(response.status, 200);
        return instance.get('/foo/baz/56');
      })
      .then(function (response) {
        assert.strictEqual(response.status, 200);
      });
  });

  it('allows overwriting only on reply if replyOnce was used first', async function () {
    let counter = 0;
    mock.onGet('/').replyOnce(500);
    mock.onGet('/').reply(200);
    mock.onGet('/').reply(401);

    let error1: any;
    let error2: any;
    await instance
      .get('/')
      .catch(function (error) {
        error1 = error;
        counter += 1;
        return instance.get('/');
      })
      .catch(function (error) {
        error2 = error;
        counter += 1;
      })
      .then(function () {
        assert.equal(counter, 2);
      });

    assert.equal(error1.response.status, 500);
    assert.equal(error2.response.status, 401);
    assert.equal(counter, 2);
  });

  it("should not allow overwriting only on reply if replyOnce wasn't used first", async function () {
    let counter = 0;
    mock.onGet('/').reply(200);
    mock.onGet('/').reply(401);
    mock.onGet('/').replyOnce(500);
    mock.onGet('/').reply(500);

    let error1: any;
    let error2: any;
    await instance
      .get('/')
      .catch(function (error) {
        error1 = error;
        counter += 1;
        return instance.get('/');
      })
      .catch(function (error) {
        error2 = error;
        counter += 1;
      })
      .then(function () {
        assert.equal(counter, 2);
      });

    assert.equal(error1.response.status, 500);
    assert.equal(error2.response.status, 500);
    assert.equal(counter, 2);
  });

  it('allows overwriting mocks with parameters', function () {
    mock
      .onGet('/users', { params: { searchText: 'John' } })
      .reply(500)
      .onGet('/users', { params: { searchText: 'John' } })
      .reply(200, { id: 1 });

    return instance.get('/users', { params: { searchText: 'John' } }).then(function (response) {
      assert.equal(response.status, 200);
    });
  });

  it('allows overwriting mocks with headers', function () {
    mock.onGet('/', { headers: { 'Accept-Charset': 'utf-8' } }).reply(500);
    mock.onGet('/', { headers: { 'Accept-Charset': 'utf-8' } }).reply(200);

    assert.equal(mock.handlers['get']?.length, 1);
    assert.equal(mock.handlers['get']?.[0][2], 200);
  });

  it('supports a retry', async function () {
    mock.onGet('/').replyOnce(401);
    mock.onGet('/').replyOnce(201);
    instance.interceptors.response.use(
      (config) => config,
      function (error) {
        return Promise.reject(error);
      }
    );
    await instance.request({ method: 'get', url: '/' }).catch((e) => {
      //
    });
    await instance.request({ method: 'get', url: '/' }).then(function (response) {
      assert.equal(response.status, 201);
    });
  });

  it('allows sending an array as response', function () {
    mock.onGet('/').reply(200, [1, 2, 3]);

    return instance.get('/').then(function (response) {
      assert.equal(response.data.join(','), [1, 2, 3].join(','));
    });
  });

  it('returns the original request url in the response.request.url property', function () {
    mock.onGet('/foo').reply(200, {
      foo: 'bar',
    });

    return instance.get('/foo').then(function (response) {
      assert.equal(response.status, 200);
      assert.equal(response.data.foo, 'bar');
      assert.equal(response.request.url, '/foo');
    });
  });

  it('sets XiorError property on errors', function () {
    mock.onGet('/').reply(404);

    return instance
      .get('/')
      .then(function () {
        assert.equal(true, false);
      })
      .catch(function (error) {
        assert.equal(isXiorError(error), true);
      });
  });

  it('sets toJSON method on errors', function () {
    mock.onGet('/').reply(404);

    return instance
      .get('/')
      .then(function () {
        assert.equal(true, false);
      })
      .catch(function (error) {
        assert.equal(error.message, 'Request failed with status code 404');
        assert.equal(error.name, 'XiorError');
        assert.equal(typeof error.stack !== 'undefined', true);
        assert.equal(typeof error.config !== 'undefined', true);
      });
  });
});
