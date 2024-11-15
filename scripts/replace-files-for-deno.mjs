import glob from 'fast-glob';
import fs from 'fs/promises';

async function start() {
  const files = await glob(['./src/*.ts']);
  const pluginFiles = await glob(['./src/plugins/*.ts']);
  const nestedPluginFiles = await glob(['./src/plugins/**/*.ts']);

  await Promise.all(
    files.map(async (item) => {
      let content = await fs.readFile(item, 'utf8');
      content = content.replace(/'xior\/utils'/g, "'./utils'");
      content = content.replace(/from '\.(.*)';/g, (a, b, c) => {
        return "from '." + b + ".ts';";
      });
      return fs.writeFile(item, content);
    })
  );

  await Promise.all(
    pluginFiles.map(async (item) => {
      let content = await fs.readFile(item, 'utf8');
      content = content.replace(/'xior\/utils'/g, "'../utils'");
      content = content.replace(/from '\.(.*)';/g, (a, b, c) => {
        return "from '." + b + ".ts';";
      });
      return fs.writeFile(item, content);
    })
  );

  await Promise.all(
    nestedPluginFiles.map(async (item) => {
      if (pluginFiles.includes(item)) return;
      let content = await fs.readFile(item, 'utf8');
      content = content.replace(/'xior\/utils'/g, "'../../utils'");
      content = content.replace(/from '\.(.*)';/g, (a, b, c) => {
        return "from '." + b + ".ts';";
      });
      return fs.writeFile(item, content);
    })
  );
}

start();
