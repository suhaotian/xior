import fs from 'fs/promises';
import glob from 'fast-glob';

/**
 * - Some old boilerplate doesn't support `export { type a }`.
 * - So we remove `type` in `export` to become `export { a }`.
 */

const filePattern = ['dist/*.d.ts', 'plugins/*.d.ts', './*.d.ts'];
async function replaceType() {
  const files = await glob(filePattern);
  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, 'utf-8');
      const arr = content.split('\n');
      let matchedExport = false;
      arr.forEach((_line, idx) => {
        const line = _line.trim();
        if (!matchedExport) {
          matchedExport = line.startsWith(`export {`) || line.startsWith(`export type {`);
        }
        if (matchedExport) {
          arr[idx] = _line.replaceAll('type ', '');
        }
      });
      await fs.writeFile(file, arr.join('\n'));
    })
  );
}

replaceType();
