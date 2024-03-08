import { XiorRequestConfig } from '../../types';

export const VERBS = ['GET', 'POST', 'HEAD', 'DELETE', 'PATCH', 'PUT', 'OPTIONS'];

export type Matcher = string | RegExp;
export type Data =
  | string
  | {
      [index: string]: any;
      params?: {
        [index: string]: any;
      };
    };
export type MockHeaders = Record<string, any>;
export type MockHistory = { [method: string]: undefined | XiorRequestConfig[] };
export type StatusOrCallback = number | ((config: XiorRequestConfig) => any[] | Promise<any[]>);
