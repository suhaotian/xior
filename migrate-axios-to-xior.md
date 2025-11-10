# Migrate from Axios to Xior.js

Before we migrate, we need to understand the key differences between Axios and Xior.js:

## Key Differences

1. **Bundle Size**: Xior.js is a lightweight alternative to Axios (3KB gzipped vs 13.5KB gzipped)

2. **Response Headers**:

   - In Xior.js: `response.headers.get('x-header-name')` (uses Fetch API's Headers object)
   - In Axios: `response.headers['x-header-name']` (uses plain JavaScript object)

3. **Plugin Ecosystem**:

   - Xior.js supports many useful built-in plugins, and you can easily create custom plugins
   - Axios relies on community plugins as alternatives

4. **Request/Response Transformation**:

   - Xior.js doesn't support `transformRequest` or `transformResponse`, as these are unnecessary in the async/await era (they were primarily useful during the callback hell era)

5. **Progress Tracking**:

   - Xior.js supports upload/download progress through a progress plugin (simulated progress, not real)
   - Axios has built-in real progress tracking

6. **Nested Query Params Encoding**:

   - Xior.js supports nested query params encoding out of the box
   - Axios requires the `qs` module (adds another 15KB gzipped size) to handle nested objects

7. **Network error**:
   - Axios throws a network error code
   - Xior follows the Fetch standards — when there is a network error, it throws a TypeError.

## Migration Examples

### Original Axios Code

```tsx
import axios, { isCancel } from 'axios';

const request = axios.create({});
```

### Using `'xior'`

```tsx
import axios, { isCancel, XiorResponse as AxiosResponse } from 'xior';

const request = axios.create({});
```

## Interceptors Examples

### Request and Response Interceptors

```tsx
import xior from 'xior';

const instance = xior.create({
  baseURL: 'https://api.example.com',
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Add auth token before request is sent
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    // Transform response data
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```
