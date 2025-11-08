export default {
  build: {
    rollupOptions: {
      input: {
        main: './main.html',
        qs: './main-qs.html',
        'xior/axios': './main-axios.html',
      },
    },
  },
};
