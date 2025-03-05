import { O } from './shorts';
import { Xior } from './xior';

export * from './xior';
export * from './types';
export * from './utils';

const { create, VERSION } = Xior;
const xior = O.assign(create(), { create, VERSION });
export default xior;
