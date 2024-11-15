import glob from 'fast-glob';
import fs from 'fs/promises';

async function start() {
  const files = await glob(['./src/*.ts']);
  const pluginFiles = await glob(['./src/plugins/*.ts']);

  await Promise.all(
    files.map(async (item) => {
      const content = await fs.readFile(item, 'utf8');
      return fs.writeFile(item, content.replace(/'xior\/utils'/g, "'./utils'"));
    })
  );

  await Promise.all(
    pluginFiles.map(async (item) => {
      const content = await fs.readFile(item, 'utf8');
      return fs.writeFile(item, content.replace(/'xior\/utils'/g, "'../utils'"));
    })
  );
}

start();
