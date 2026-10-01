// Xuất SVG tĩnh từ src/components/icons/icon-data.json
// node scripts/build-icons.mjs  ->  src/assets/icons/<group>/<group>-<name>-<variant>.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = JSON.parse(fs.readFileSync(path.join(root, 'src/components/icons/icon-data.json'), 'utf8'));
const KNOCK = '#FFFFFF';
const GROUP_DIR = { module: 'modules', status: 'statuses', priority: 'priority', mood: 'moods', area: 'life-areas' };
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
const shape = (el, a) => el.circle ? `<circle cx="${el.circle[0]}" cy="${el.circle[1]}" r="${el.circle[2]}" ${attrs(a)}/>`
  : el.rect ? `<rect x="${el.rect[0]}" y="${el.rect[1]}" width="${el.rect[2]}" height="${el.rect[3]}" rx="${el.rect[4]}" ${attrs(a)}/>`
  : `<path d="${el.d}" ${attrs(a)}/>`;
function render(def, v) {
  const c = def.color;
  const body = def.els.map((el) => {
    switch (el.role) {
      case 'base': return shape(el, v === 'outline' ? { stroke: c } : v === 'duotone' ? { stroke: c, fill: c, 'fill-opacity': 0.25 } : { stroke: c, fill: c });
      case 'line': return shape(el, { stroke: c });
      case 'inner': return shape(el, { stroke: v === 'filled' ? KNOCK : c });
      case 'dot': return shape(el, { fill: c });
      case 'innerDot': return shape(el, { fill: v === 'filled' ? KNOCK : c });
      case 'over':
        if (el.fillDot) return shape(el, { fill: c, stroke: KNOCK, 'stroke-width': 1.6 });
        return (v !== 'outline' ? shape(el, { stroke: KNOCK, 'stroke-width': 4.6 }) : '') + shape(el, { stroke: c });
    }
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
}
let n = 0;
for (const [key, def] of Object.entries(ICONS)) {
  const [group, name] = key.split('/');
  const dir = path.join(root, 'src/assets/icons', GROUP_DIR[group]);
  fs.mkdirSync(dir, { recursive: true });
  const variants = def.outlineOnly ? ['outline'] : ['outline', 'duotone', 'filled'];
  for (const v of variants) { fs.writeFileSync(path.join(dir, `${group}-${name}-${v}.svg`), render(def, v)); n++; }
}
console.log(`${n} SVG files`);
