import assert from 'node:assert';
import { after, afterEach, before, describe, it } from 'node:test';
import xior, { XiorResponse } from 'xior';

import { startServer } from './server';

const axios = xior.create();

let close: Function;
const port = 7868;
const baseURL = `http://localhost:${port}`;
axios.defaults.baseURL = baseURL;
before(async () => {
  close = await startServer(port);
});

after(async () => {
  return close(1);
});

afterEach(function () {
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
});
describe('interceptors', function () {
  it('should execute asynchronously when not all interceptors are explicitly flagged as synchronous', async function () {
    axios.interceptors.request.use(async function (config) {
      config.headers.foo = 'uh oh, async';

      return config;
    });

    axios.interceptors.request.use(async function (config) {
      config.headers.test = 'added by the async interceptor';
      return config;
    });

    const { config } = await axios.request('/get');
    assert.equal(config.headers.foo, 'uh oh, async');
    assert.equal(config.headers.test, 'added by the async interceptor');
  });

  it('should add a request interceptor that returns a promise', async function (done) {
    axios.interceptors.request.use(function (config) {
      return new Promise(function (resolve) {
        // do something async
        setTimeout(function () {
          config.headers.async = 'promise';
          resolve(config);
        }, 100);
      });
    });

    await axios.request('/get').then(({ config: request }) => {
      assert.equal(request.headers.async, 'promise');
    });
  });

  it('should add multiple request interceptors', function (done) {
    axios.interceptors.request.use(function (config) {
      config.headers.test1 = '1';
      return config;
    });
    axios.interceptors.request.use(function (config) {
      config.headers.test2 = '2';
      return config;
    });
    axios.interceptors.request.use(function (config) {
      config.headers.test3 = '3';
      return config;
    });

    axios.request('/get').then(({ config: request }) => {
      assert.equal(request.headers.test1, '1');
      assert.equal(request.headers.test2, '2');
      assert.equal(request.headers.test3, '3');
    });
  });

  it('should add a response interceptor', async function () {
    let response: XiorResponse | undefined;

    axios.interceptors.response.use(function (data) {
      data.data = data.data.method + ' - modified by interceptor';
      return data;
    });

    await axios.request('/get').then(function (data) {
      response = data;
    });

    assert.equal(response?.data, 'get - modified by interceptor');
  });

  it('should add a response interceptor when request interceptor is defined', async function () {
    let response: XiorResponse | undefined;

    axios.interceptors.request.use(function (config) {
      return config;
    });

    axios.interceptors.response.use(function (data) {
      data.data = data.data.method + ' - modified by interceptor';
      return data;
    });

    await axios.request('/get').then(function (data) {
      response = data;
    });

    assert.equal(response?.data, 'get - modified by interceptor');
  });

  it('should add a response interceptor that returns a new data object', async function () {
    let response: XiorResponse | undefined;

    axios.interceptors.response.use(function () {
      return {
        data: 'stuff',
      } as any;
    });

    await axios.request('/get').then(function (data) {
      response = data;
    });
    assert.equal(response?.data, 'stuff');
  });

  it('should add a response interceptor that returns a promise', async function () {
    let response: XiorResponse | undefined;

    axios.interceptors.response.use(function (data) {
      return new Promise(function (resolve) {
        // do something async
        setTimeout(function () {
          data.data = 'you have been promised!';
          resolve(data);
        }, 10);
      });
    });

    await axios.request('/get').then(function (data) {
      response = data;
    });
    assert.equal(response?.data, 'you have been promised!');
  });

  describe('given you add multiple response interceptors', function () {
    describe('and when the response was fulfilled', function () {
      it('then each interceptor is executed', async function () {
        let fired1 = 0;
        axios.interceptors.response.use((r) => {
          fired1 = 1;
          return r;
        });
        let fired2 = 0;
        axios.interceptors.response.use((r) => {
          fired2 = 2;
          return r;
        });
        await axios.get('/get');
        assert.equal(fired1, 1);
        assert.equal(fired2, 2);
      });

      it('then they are executed in the order they were added', async function () {
        const fired = [] as number[];
        axios.interceptors.response.use((r) => {
          fired.push(1);
          return r;
        });
        axios.interceptors.response.use((r) => {
          fired.push(2);
          return r;
        });
        await axios.get('/get');
        assert.equal(fired[1] > fired[0], true);
      });

      it("then only the last interceptor's result is returned", async function () {
        axios.interceptors.response.use(function () {
          return 'response 1' as any;
        });
        axios.interceptors.response.use(function (response) {
          return 'response 2' as any;
        });
        const res = await axios.get('/get');
        assert.equal(res as any, 'response 2');
      });

      it("then every interceptor receives the result of it's predecessor", async function () {
        axios.interceptors.response.use(function () {
          return 'response 1' as any;
        });
        axios.interceptors.response.use(function (response) {
          return [response, 'response 2'] as any;
        });
        const res = await axios.get('/get');
        assert.equal((res as any).join(','), ['response 1', 'response 2'].join(','));
      });

      describe('and when the fulfillment-interceptor throws', function () {
        it('then the following fulfillment-interceptor is not called', async function () {
          axios.interceptors.response.use(function () {
            throw Error('throwing interceptor');
          });

          let fired = false;
          axios.interceptors.response.use(async function interceptor2(config) {
            fired = true;
            return config;
          });

          try {
            await axios.get('/get');
          } catch (e) {
            //
          }
          assert.equal(fired, false);
        });

        it('then the following rejection-interceptor is called', async function () {
          axios.interceptors.response.use(function () {
            throw Error('throwing interceptor');
          });
          const unusedFulfillInterceptor = async function (r: any) {
            return r;
          };

          let fired = false;
          const rejectIntercept = function () {
            fired = true;
          };
          axios.interceptors.response.use(unusedFulfillInterceptor, rejectIntercept);

          try {
            await axios.get('/get');
          } catch (e) {
            //
          }
          assert.equal(fired, true);
        });

        it('once caught, another following fulfill-interceptor is called again (just like in a promise chain)', async function () {
          axios.interceptors.response.use(function () {
            throw Error('throwing interceptor');
          });

          const unusedFulfillInterceptor = async function (r: any) {
            return r;
          };
          const catchingThrowingInterceptor = function () {};
          axios.interceptors.response.use(unusedFulfillInterceptor, catchingThrowingInterceptor);

          let fired = false;
          axios.interceptors.response.use(function interceptor3(res) {
            fired = true;
            return res;
          });
          try {
            await axios.get('/get');
          } catch (e) {
            //
          }
          assert.equal(fired, true);
        });
      });
    });
  });

  it('should allow removing interceptors', async function () {
    let response: XiorResponse | undefined;

    axios.interceptors.response.use(function (data) {
      const resultData = data.data.method + '1';
      return { ...data, data: resultData };
    });
    const intercept = axios.interceptors.response.use(function (data) {
      data.data = data.data + '2';
      return { ...data, data: data.data };
    });
    axios.interceptors.response.use(function (data) {
      const resultData = data.data + '3';
      return { ...data, data: resultData };
    });

    axios.interceptors.response.eject(intercept);

    await axios.request('/get?a=123').then(function (data) {
      response = data;
    });
    console.log('response.data', response);

    assert.equal(response?.data, 'get13');
  });

  // it('should remove async interceptor before making request and execute synchronously', function (done) {
  //   let asyncFlag = false;
  //   const asyncIntercept = axios.interceptors.request.use(
  //     function (config) {
  //       config.headers.async = 'async it!';
  //       return config;
  //     },
  //     null,
  //     { synchronous: false }
  //   );

  //   const syncIntercept = axios.interceptors.request.use(
  //     function (config) {
  //       config.headers.sync = 'hello world';
  //       expect(asyncFlag).toBe(false);
  //       return config;
  //     },
  //     null,
  //     { synchronous: true }
  //   );

  //   axios.interceptors.request.eject(asyncIntercept);

  //   axios('/foo');
  //   asyncFlag = true;

  //   getAjaxRequest().then(function (request) {
  //     expect(request.requestHeaders.async).toBeUndefined();
  //     expect(request.requestHeaders.sync).toBe('hello world');
  //     done();
  //   });
  // });

  // it('should execute interceptors before transformers', async function () {
  //   axios.interceptors.request.use(function (config) {
  //     config.data.baz = 'qux';
  //     return config;
  //   });

  //   const {config: request} = await  axios.post('/post', {
  //     foo: 'bar',
  //   });

  //   getAjaxRequest().then(function (request) {
  //     expect(request.params).toEqual('{"foo":"bar","baz":"qux"}');
  //     ();
  //   });
  // });

  it('should modify base URL in request interceptor', async function () {
    const instance = xior.create({
      baseURL: 'http://test.com/',
    });

    instance.interceptors.request.use(function (config) {
      config.baseURL = baseURL;
      return config;
    });

    await instance.get('/get').then(({ config: request }) => {
      assert.equal(request.baseURL, baseURL);
      assert.equal(request.url, '/get');
    });
  });

  it('should clear all response interceptors', function () {
    const instance = xior.create({
      baseURL: 'http://test.com/',
    });

    instance.interceptors.response.use(function (config) {
      return config;
    });
    instance.interceptors.response.clear();
    assert.equal(instance.RESI, 0);
  });
});
