// Rebuilds the static pages from content/site.json. No dependencies: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSite } from './src/render.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const files = renderSite(JSON.parse(read('content/site.json')), read('src/style.css'));

fs.rmSync(path.join(root, 'blog'), { recursive: true, force: true });
for (const [name, content] of Object.entries(files)) {
  const target = path.join(root, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  console.log(name, `${(content.length / 1024).toFixed(1)} KB`);
}
