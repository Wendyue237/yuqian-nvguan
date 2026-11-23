import { readFileSync, writeFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const css = read('style.css').replace(/url\("(assets\/[^"]+\.webp)"\)/g, (_, asset) => {
  const image = readFileSync(new URL('../' + asset, import.meta.url));
  return 'url("data:image/webp;base64,' + image.toString('base64') + '")';
});
const js = read('game.js');
if (/<\/style/i.test(css) || /<\/script/i.test(js)) {
  throw new Error('Inline assets contain an HTML closing tag');
}
const html = read('index.html')
  .replace('<link rel="stylesheet" href="style.css">', () => '<style>\n' + css + '\n</style>')
  .replace('<script src="game.js"></script>', () => '<script>\n' + js + '\n</script>');
writeFileSync(new URL('../御前女官.html', import.meta.url), html);
