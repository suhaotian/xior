import { Xior } from './xior';

export * from './xior';
export * from './types';
// @ts-ignore
export * from 'xior/utils';

const xiorObj = Object.assign(Xior.create(), { create: Xior.create, VERSION: Xior.VERSION });

export default xiorObj;
