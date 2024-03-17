import fs from 'fs/promises';

import { getFieldsMap } from './npm-publish-fields.mjs';

async function purgePkg() {
  const content = await fs.readFile('package.json', 'utf8');
  const json = JSON.parse(content);
  const whiteFieldsMap = getFieldsMap();
  Object.keys(json).forEach((key) => {
    if (!whiteFieldsMap[key.toLowerCase()]) {
      delete json[key];
    }
  });

  await fs.writeFile('package.json', JSON.stringify(json, null, 2));
}

purgePkg();
