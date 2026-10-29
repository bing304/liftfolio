// Baut www/ für die native App aus src/app.html.
// - Google Fonts raus, Manrope lokal (SIL OFL) rein -> App funktioniert komplett offline
// - echtes HTML-Gerüst mit viewport-fit=cover (Notch/Home-Indicator)
// - capacitor.js vor dem App-Skript, damit die nativen Plugins erreichbar sind
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
const nm = join(root, 'node_modules');

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'fonts'), { recursive: true });

let src = readFileSync(join(root, 'src', 'app.html'), 'utf8');
src = src
  .replace(/^<title>.*<\/title>\s*\n/m, '')
  .replace(/^<link rel="preconnect"[^>]*>\s*\n/gm, '')
  .replace(/^<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*\n/gm, '');
if (/fonts\.googleapis|fonts\.gstatic/.test(src)) throw new Error('Google-Fonts-Verweis nicht vollständig entfernt');

// Manrope (variabel, latin + latin-ext reicht für DE/EN)
const fdir = join(nm, '@fontsource-variable', 'manrope', 'files');
for (const f of ['manrope-latin-wght-normal.woff2', 'manrope-latin-ext-wght-normal.woff2']) copyFileSync(join(fdir, f), join(www, 'fonts', f));
copyFileSync(join(nm, '@fontsource-variable', 'manrope', 'LICENSE'), join(www, 'fonts', 'OFL.txt'));
const fontCss = `
@font-face{font-family:"Manrope";font-style:normal;font-display:swap;font-weight:200 800;src:url(fonts/manrope-latin-ext-wght-normal.woff2) format("woff2-variations");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Manrope";font-style:normal;font-display:swap;font-weight:200 800;src:url(fonts/manrope-latin-wght-normal.woff2) format("woff2-variations");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`;

copyFileSync(join(nm, '@capacitor', 'core', 'dist', 'capacitor.js'), join(www, 'capacitor.js'));

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="format-detection" content="telephone=no">
<meta name="color-scheme" content="dark light">
<title>Liftfolio</title>
<style>${fontCss}
body{margin:0}[hidden]{display:none!important}
</style>
<script src="capacitor.js"></script>
</head>
<body>
${src}
</body>
</html>
`;
writeFileSync(join(www, 'index.html'), html);
console.log('www/index.html gebaut (' + Math.round(html.length / 1024) + ' KB)');
