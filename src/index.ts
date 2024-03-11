import { xior } from './xior';

export * from './xior';
export * from './types';
export * from './utils';

const xiorInstance = Object.assign(xior.create(), { create: xior.create });

export default xiorInstance;
