import { pascalCase } from 'change-case';
import fs from 'fs';
import path from 'path';

function getConfig() {
  const content = fs.readFileSync('package.json', 'utf8');
  const json = JSON.parse(content);

  const exports = json['exports'];
  const pkgName = json['name'];
  const entry = {
    xior: {
      import: './lib/index.js',
      filename: pkgName + '.umd.js',
      library: {
        type: 'umd',
        name: pkgName,
        export: 'default',
      },
    },
  };
  Object.keys(exports).forEach((key) => {
    if (key === '.') return;
    const filename = fs.existsSync(path.join('lib', key + '.js'))
      ? key + '.js'
      : path.join(key, 'index.js');
    const name = key.split('/').pop();
    const pluginName = `${pkgName}${pascalCase(name)}`;
    entry[filename] = {
      import: './' + path.join('lib', filename),
      filename: '../plugins/' + name + '.umd.js',
      library: {
        type: 'umd',
        name: pluginName,
        export: 'default',
      },
    };
  });

  return {
    mode: 'production',
    entry,
    output: {
      globalObject: 'this',
    },
  };
}

export default getConfig();
