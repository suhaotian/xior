import xior, { XiorInstance } from 'xior';

import axios, { AxiosInstance } from 'xior/axios';

const axiosInstance: XiorInstance = xior.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 1000,
});

axios.get('https://github.com', { responseType: 'stream' });

export default axiosInstance;
