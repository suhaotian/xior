import assert from 'node:assert';
import { after, before, describe, it, beforeEach, afterEach } from 'node:test';

import MockPlugin from '../../../plugins/mock';
import { xior } from '../../../xior';
import { startServer } from '../../server';

let close: Function;
const port = 7883;
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

describe('xior mock plguin asymmetric matchers tests', () => {
  it('mocks a post request with a body matching the matcher', function () {
    mock
      .onPost('/anyWithBody', {
        asymmetricMatch(actual) {
          return actual.params === '1';
        },
      })
      .reply(200);

    return instance.post('/anyWithBody', { params: '1' }).then(function (response) {
      assert.equal(response.status, 200);
    });
  });

  it('mocks a post request with a body not matching the matcher', async function () {
    mock
      .onPost('/anyWithBody', {
        asymmetricMatch(actual) {
          return actual.params === '1';
        },
      })
      .reply(200);

    let error: any;
    await instance.post('/anyWithBody', { params: '2' }).catch(function (err) {
      error = err;
    });
    assert.equal(error.message, 'Request failed with status code 404');
  });
});
