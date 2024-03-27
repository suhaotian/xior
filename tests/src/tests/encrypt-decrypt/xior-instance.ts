import xior from 'xior';

import { SECRET, encrypt, decrypt } from './encryption';

export const instance = xior.create();

instance.interceptors.request.use((req) => {
  req.headers['X'] = SECRET;

  if (req.url && req.data) {
    const result = JSON.stringify(req.data);
    const blob = encrypt(result);
    req.data = { blob };
  }

  return req;
});

instance.interceptors.response.use((res) => {
  if (res.request.url && res.data?.blob) {
    res.data = decrypt(res.data.blob);
    try {
      res.data = JSON.parse(res.data);
    } catch (e) {
      console.error(e);
    }
  }
  return res;
});
