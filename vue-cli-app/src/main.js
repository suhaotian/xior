import Vue from 'vue';
import App from './App.vue';
import { instance } from './xior';
import { delay } from 'xior';

instance.get('/');

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');



export const a = async () => {
  await delay(1000);
  console.log('hello xior.js');
};
class B {
  constructor() {
    this.a = 123;
  }
}
a();
console.log('class test', new B(), process.env.NODE_ENV);