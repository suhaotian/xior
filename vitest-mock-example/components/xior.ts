import xior, { XiorInstance } from 'xior';

const axiosInstance: XiorInstance = xior.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 1000,
});

export default axiosInstance;
