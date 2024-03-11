import { xior } from './xior';

export * from './xior';
export * from './types';
export * from './utils';

export type XiorInstance = xior;

const xiorObj = Object.assign(xior.create(), { create: xior.create });

export default xiorObj;
