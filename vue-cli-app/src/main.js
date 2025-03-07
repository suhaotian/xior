import Vue from 'vue';
import App from './App.vue';
import { instance } from './xior';

instance.get('/');

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
