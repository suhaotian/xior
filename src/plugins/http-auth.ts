import { XiorPlugin, XiorRequestConfig } from '..';

export type AuthConfig = {
  username: string;
  password: string;
};

interface AuthRequestConfig {
  auth?: AuthConfig;
}

/** @ts-ignore */
declare module 'xior' {
  interface XiorRequestConfig extends AuthRequestConfig {}
}

const xiorAuthPlugin: XiorPlugin = (adapter) => {
  return async (config: XiorRequestConfig & AuthRequestConfig) => {
    if (config.auth) {
      const { username, password } = config.auth;
      const credentials = `${username}:${password}`;

      const encoded =
        typeof btoa === 'function'
          ? btoa(decodeURIComponent(encodeURIComponent(credentials)))
          : // @ts-ignore
            Buffer.from(credentials).toString('base64');

      config.headers = {
        ...config.headers,
        Authorization: `Basic ${encoded}`,
      };
    }

    return adapter(config);
  };
};

export default xiorAuthPlugin;
