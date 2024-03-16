import { XiorRequestConfig } from '../../types';

export const VERBS = ['get', 'post', 'head', 'delete', 'patch', 'put', 'options'];

export type Matcher = string | RegExp;

interface AsymmetricMatcher {
  asymmetricMatch: (payload: any) => any;
}

export type RequestOptions = XiorRequestConfig & {
  headers?: AsymmetricMatcher | Record<string, string>;
  params?: AsymmetricMatcher | Record<string, any>;
  data?: AsymmetricMatcher | Record<string, any>;
};

export type RequestData<T> =
  | null
  | string
  | boolean
  | any[]
  | number
  | AsymmetricMatcher
  | Record<string, any>;

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
export type StatusOrCallback =
  | number
  | ((config: XiorRequestConfig) => any | any[] | Promise<any[]>);
