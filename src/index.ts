import { xior } from './xior';

export * from './xior';
export * from './types';
// @ts-ignore
export * from 'xior/utils';

const xiorObj = Object.assign(xior.create(), { create: xior.create, VERSION: xior.VERSION });

export default xiorObj;
