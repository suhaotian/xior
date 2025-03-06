import fs from 'fs';

const mainContent = fs.readFileSync('./doc/assets/main.js', 'utf8');
const popoverContent = fs.readFileSync('./typedoc/popover.js', 'utf8');

fs.writeFileSync('./doc/assets/main.js', `${mainContent}\n;${popoverContent}`);
