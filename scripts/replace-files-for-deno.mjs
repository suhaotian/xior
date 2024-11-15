import glob from 'fast-glob';
import fs from 'fs/promises';

async function start() {
  const files = await glob(['./src/*.ts']);
  const pluginFiles = await glob(['./src/plugins/*.ts']);

  await Promise.all(
    files.map((item) => {
      const content = fs.readFile(item, 'utf8');
      return fs.writeFile(item, content.replace(/'xior\/utils'/g, "'./utils'"));
    })
  );

  await Promise.all(
    pluginFiles.map((item) => {
      const content = fs.readFile(item, 'utf8');
      return fs.writeFile(item, content.replace(/'xior\/utils'/g, "'../utils'"));
    })
  );
}

start();
