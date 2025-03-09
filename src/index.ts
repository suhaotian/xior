import { Xior } from './xior';

export * from './xior';
export * from './types';
export * from './utils';

const xior = Object.assign(Xior.create(), { create: Xior.create, VERSION: Xior.VERSION });
export default xior;
