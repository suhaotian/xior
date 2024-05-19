[Go back](./README.md)

Xior mock plugin let you easily mock requests.

> Good to know: the xior mock plugin idea inspired from [axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter)

## Table of Contents

- [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Package manager](#package-manager)
    - [CDN](#cdn)
  - [Getting Started](#getting-started)
    - [Mock `GET` requests](#mock-get-requests)
    - [Mock `POST` requests](#mock-post-requests)
    - [Using regexp](#using-regexp)
    - [Using chainning](#using-chainning)
    - [Mock `Any` requests](#mock-any-requests)
    - [`.passthrough()` and options `{onNoMatch: 'passthrough'}`](#passthrough-and-options-onnomatch-passthrough)
    - [options `{onNoMatch: 'throwException'}`](#options-onnomatch-throwexception)
    - [Mock requests `errors`](#mock-requests-errors)
    - [history](#history)
    - [handlers](#handlers)
    - [Reset mock history, handlers and the plugin](#reset-mock-history-handlers-and-the-plugin)

### Installation

#### Package manager

```sh
# npm
npm install xior

# pnpm
pnpm add xior

# bun
bun add xior

# yarn
yarn add xior
```

Basic usage:

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

mock.onGet('/api/hello').reply(200, [{ msg: 'hello' }]);
instance.get('/api/hello').then((res) => {
  console.log(res.data); // [{ msg: 'hello' }]
});
```

#### CDN

Using jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/xior@0.5.0/dist/xior.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xior@0.5.0/plugins/mock.umd.js"></script>

<!-- Usage -->
<script>
  const instance = xior.create();
  const mock = new xiorMock(instance);

  mock.onGet('/api/hello').reply(200, [{ msg: 'hello' }]);
  instance.get('/api/hello').then((res) => {
    console.log(res.data); // [{ msg: 'hello' }]
  });
</script>
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/xior@0.5.0/dist/xior.umd.js"></script>
<script src="https://unpkg.com/xior@0.5.0/plugins/mock.umd.js"></script>

<!-- Usage -->
<script>
  const instance = xior.create();
  const mock = new xiorMock(instance);

  mock.onGet('/api/hello').reply(200, [{ msg: 'hello' }]);
  instance.get('/api/hello').then((res) => {
    console.log(res.data); // [{ msg: 'hello' }]
  });
</script>
```

### Getting Started

#### Mock `GET` requests

> `DELETE` / `HEAD` / `OPTIONS` are same usage with `GET`

Mocking a `GET` request:

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

// Mock any GET request to /users
// arguments for reply are (status, data, headers)
mock.onGet('/users').reply(
  200,
  {
    users: [{ id: 1, name: 'John Smith' }],
  },
  {
    'X-Custom-Response-Header': '123',
  }
);

instance.get('/users').then(function (response) {
  console.log(response.data);
  console.log(response.headers.get('X-Custom-Response-Header')); // 123
});
```

Mocking a `GET` request with specific parameters:

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

// Mock GET request to /users when param `searchText` is 'John'
// arguments for reply are (status, data, headers)
mock.onGet('/users', { params: { searchText: 'John' } }).reply(200, {
  users: [{ id: 1, name: 'John Smith' }],
});

instance.get('/users', { params: { searchText: 'John' } }).then(function (response) {
  console.log(response.data);
});
```

Reject all `GET` requests with HTTP 500:

```ts
mock.onGet().reply(500);
```

#### Mock `POST` requests

> `PUT` / `PATCH` are same usage with `POST`

Mocking a `POST` request:

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

// Mock any POST request to /users
// arguments for reply are (status, data, headers)
mock.onPost('/users').reply(
  200,
  {
    users: [{ id: 1, name: 'John Smith' }],
  },
  {
    'X-Custom-Response-Header': '123',
  }
);

instance.post('/users').then(function (response) {
  console.log(response.data);
  console.log(response.headers.get('X-Custom-Response-Header')); // 123
});
```

Mocking a `POST` request with specific parameters and `data`:

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

// Mock POST request to /users when param `searchText` is 'John'
// arguments for reply are (status, data, headers)
mock.onPost('/users', null, { params: { searchText: 'John' } }).reply(200, {
  users: [{ id: 1, name: 'John Smith' }],
});

instance.get('/users', null, { params: { searchText: 'John' } }).then(function (response) {
  console.log(response.data);
});
```

Reject all `POST` requests with HTTP 500:

```ts
mock.onPost().reply(500);
```

#### Using regexp

```ts
mock.onGet(/\/users\/\d+/).reply(function (config) {
  // the actual id can be grabbed from config.url

  return [200, {}];
});
```

#### Using chainning

Chaining is also supported:

```ts
mock.onGet('/users').reply(200, users).onGet('/posts').reply(200, posts);
```

`.replyOnce()` can be used to let the mock only reply once:

```ts
mock
  .onGet('/users')
  .replyOnce(200, users) // After the first request to /users, this handler is removed
  .onGet('/users')
  .replyOnce(500); // The second request to /users will have status code 500
// Any following request would return a 404 since there are
// no matching handlers left
```

#### Mock `Any` requests

Mocking any request to a given url

```ts
// mocks GET, POST, ... requests to /foo
mock.onAny('/foo').reply(200);
```

`.onAny` can be useful when you want to test for a specific order of requests:

```ts
// Expected order of requests:
const responses = [
  ['GET', '/foo', 200, { foo: 'bar' }],
  ['POST', '/bar', 200],
  ['PUT', '/baz', 200],
];

// Match ALL requests
mock.onAny().reply((config) => {
  const [method, url, ...response] = responses.shift();
  if (config.url === url && config.method.toUpperCase() === method) return response;
  // Unexpected request, error out
  return [500, {}];
});
```

#### `.passthrough()` and options `{onNoMatch: 'passthrough'}`

`.passThrough()` forwards the matched request over network

```ts
// Mock POST requests to /api with HTTP 201, but forward
// GET requests to server
mock
  .onPost(/^\/api/)
  .reply(201)
  .onGet(/^\/api/)
  .passThrough();
```

Recall that the order of handlers is significant:

```ts
// Mock specific requests, but let unmatched ones through
mock.onGet('/foo').reply(200).onPut('/bar', { xyz: 'abc' }).reply(204).onAny().passThrough();
```

Note that `passThrough` requests are not subject to delaying by `delayResponse`.

If you set onNoMatch option to `passthrough` all requests would be forwarded over network by default

```ts
// Mock all requests to /foo with HTTP 200, but forward
// any others requests to server
var mock = new MockPlugin(instance, { onNoMatch: 'passthrough' });

mock.onAny('/foo').reply(200);
```

#### options `{onNoMatch: 'throwException'}`

Using `onNoMatch` option with `throwException` to throw an exception when a request is made without match any handler. It's helpful to debug your test mocks.

```ts
const mock = new MockPlugin(instance, { onNoMatch: 'throwException' });

mock.onAny('/foo').reply(200);

axios.get('/unexistent-path');

// Exception message on console:
//
// Could not find mock for:
// {
//   "method": "get",
//   "url": "/unexistent-path"
// }
```

#### Mock requests `errors`

Network error:

```ts
// Returns a failed promise with Error('Network Error');
mock.onGet('/users').networkError();
```

```ts
// networkErrorOnce can be used to mock a network error only once
mock.onGet('/users').networkErrorOnce();
```

Timeout error:

```ts
// Returns a failed promise with Error `XiorTimeoutError`
mock.onGet('/users').timeout();
```

```ts
// timeoutOnce can be used to mock a timeout only once
mock.onGet('/users').timeoutOnce();
```

#### history

The `history` property allows you to enumerate existing xior request objects.
The property is an object of verb keys referencing arrays of request objects.

It's useful for testing.

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

describe('Feature', () => {
  it('records the xior config each time the handler is invoked', function () {
    mock.onAny('/foo').reply(200);

    return instance.get('/foo').then(function (response) {
      assert.equal(mock.history.get?.length, 1);
      assert.equal(mock.history.get?.[0].method, 'GET');
      assert.equal(mock.history.get?.[0].url, '/foo');
    });
  });
});
```

You can clear the `history` with `resetHistory`:

```ts
mock.resetHistory();
```

#### handlers

The `handlers` property allows you to enumerate existing xior response objects.

It's useful for testing.

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

describe('Feature', () => {
  it('resets the registered mock handlers', function () {
    mock.onGet('/foo').reply(200);
    assert.equal(mock.handlers['get'] && mock.handlers['get'].length > 0, true);

    mock.reset();
    assert.equal(mock.handlers['get'], undefined);
  });
});
```

You can clear the `handlers` with `resetHandlers`:

```ts
mock.resetHandlers();
```

#### Reset mock history, handlers and the plugin

```ts
import xior from 'xior';
import MockPlugin from 'xior/plugins/mock';

const instance = xior.create();
const mock = new MockPlugin(instance);

// reset history
mock.resetHistory();

// reset handlers
mock.resetHandlers();

// reset history and handlers
mock.reset();

// remove the mock plugin from instance
mock.restore();
```

[Go back](./README.md)
