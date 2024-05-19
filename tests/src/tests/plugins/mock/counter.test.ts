import assert from 'node:assert';
import { describe, before, it } from 'node:test';
import { Xior } from 'xior';
import MockPlugin from 'xior/plugins/mock';

let token = '';
const instance = Xior.create({});
const mock = new MockPlugin(instance, { delayResponse: 0 });

instance.interceptors.request.use((config) => {
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

before(() => {
  mock
    .onPost('/register')
    .reply(200, { token: Date.now() + '' + Math.random(), username: `u_${Math.random()}` });

  mock
    .onPost('/login')
    .reply(200, { token: Date.now() + '' + Math.random(), username: `u_${Math.random()}` });

  mock
    .onGet('/count', {
      headers: {
        asymmetricMatch(actual) {
          return actual['Authorization'] !== undefined;
        },
      },
    })
    .reply(200, { count: Math.round(Math.random() * 100) });
  mock
    .onPut(
      '/count',
      {
        asymmetricMatch(actual) {
          return typeof actual.count === 'number';
        },
      },
      {
        headers: {
          asymmetricMatch(actual) {
            return actual['Authorization'] !== undefined;
          },
        },
      }
    )
    .reply(200, { count: Math.round(Math.random() * 100) });
});

describe('xior mock plguin counter tests', () => {
  // register
  // login
  // +1
  // -1
  it('mock register API should work', async () => {
    const { data } = await instance.post('/register');
    token = data.token;
    assert.equal(data.token !== undefined, true);
    assert.equal(data.username !== undefined, true);
  });

  it('mock login API should work', async () => {
    const { data } = await instance.post('/login');
    token = data.token;
    assert.equal(data.token !== undefined, true);
    assert.equal(data.username !== undefined, true);
  });

  it('mock get count API should work', async () => {
    const { data } = await instance.get('/count');
    assert.equal(data.count > 0, true);
  });

  it('mock update count API should work', async () => {
    const { data } = await instance.put('/count', { count: 10 });
    assert.equal(data.count > 0, true);
  });
});
