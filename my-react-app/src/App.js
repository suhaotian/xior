import { delay } from 'xior';

import logo from './logo.svg';

import './App.css';

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
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
