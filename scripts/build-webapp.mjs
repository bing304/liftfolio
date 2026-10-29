// Baut die passwortgeschützte Web-App nach docs/app/ (GitHub Pages).
// Aufruf: LF_WEB_PASSWORD='…' node scripts/build-webapp.mjs
// - Inhalt = src/app.html (offline: Schrift lokal, ohne Capacitor), AES-256-GCM verschlüsselt,
//   Schlüssel per PBKDF2-SHA256 aus dem Passwort. Das Passwort steht nirgends im Repo.
// - Salt bleibt über Builds gleich, damit ein gemerktes Gerät nach Updates nicht neu fragen muss.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, pbkdf2Sync, createCipheriv, createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'app');
const pw = process.env.LF_WEB_PASSWORD;
if (!pw || pw.length < 8) { console.error('LF_WEB_PASSWORD fehlt (mind. 8 Zeichen)'); process.exit(1); }
mkdirSync(join(out, 'fonts'), { recursive: true });

// --- App-Inhalt (wie scripts/build-www.mjs, aber ohne capacitor.js)
let src = readFileSync(join(root, 'src', 'app.html'), 'utf8')
  .replace(/^<title>.*<\/title>\s*\n/m, '')
  .replace(/^<link rel="preconnect"[^>]*>\s*\n/gm, '')
  .replace(/^<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*\n/gm, '');
if (/fonts\.googleapis|fonts\.gstatic/.test(src)) throw new Error('Google-Fonts-Verweis nicht entfernt');
const fdir = join(root, 'node_modules', '@fontsource-variable', 'manrope', 'files');
for (const f of ['manrope-latin-wght-normal.woff2', 'manrope-latin-ext-wght-normal.woff2']) copyFileSync(join(fdir, f), join(out, 'fonts', f));
const fontCss = `@font-face{font-family:"Manrope";font-style:normal;font-display:swap;font-weight:200 800;src:url(fonts/manrope-latin-ext-wght-normal.woff2) format("woff2-variations");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Manrope";font-style:normal;font-display:swap;font-weight:200 800;src:url(fonts/manrope-latin-wght-normal.woff2) format("woff2-variations");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`;
const pwaHead = `<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Liftfolio">
<meta name="theme-color" content="#000000">
<meta name="robots" content="noindex, nofollow">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">`;
const app = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="format-detection" content="telephone=no">
${pwaHead}
<title>Liftfolio</title>
<style>${fontCss}
body{margin:0}[hidden]{display:none!important}
</style>
</head>
<body>
${src}
</body>
</html>
`;

// --- Verschlüsseln (Salt aus vorigem Build übernehmen)
const ITER = 310000;
let salt = randomBytes(16);
const prev = join(out, 'index.html');
if (existsSync(prev)) { const m = readFileSync(prev, 'utf8').match(/salt:'([A-Za-z0-9+/=]+)'/); if (m) salt = Buffer.from(m[1], 'base64'); }
const key = pbkdf2Sync(pw, salt, ITER, 32, 'sha256');
const iv = randomBytes(12);
const c = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([c.update(app, 'utf8'), c.final(), c.getAuthTag()]); // WebCrypto erwartet Tag am Ende
const P = `{salt:'${salt.toString('base64')}',iv:'${iv.toString('base64')}',it:${ITER},ct:'${ct.toString('base64')}'}`;

// --- Passwort-Seite (die App wird erst nach dem Entschlüsseln geladen)
const gate = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${pwaHead}
<title>Liftfolio</title>
<style>${fontCss}
*{box-sizing:border-box}
html,body{margin:0;background:#000;color:#F2F4F5;font:600 16px/1.5 Manrope,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
body{min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:max(24px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom))}
form{width:100%;max-width:340px;display:grid;gap:14px;justify-items:center;text-align:center;animation:in .4s ease-out both}
form[hidden]{display:none}
img{width:96px;height:96px;border-radius:22px;filter:drop-shadow(0 10px 30px rgba(62,224,127,.3))}
h1{margin:6px 0 0;font:800 30px/1.1 Manrope,system-ui,sans-serif;letter-spacing:-.02em}
p{margin:0;color:#868C92;font-size:14px}
input{width:100%;height:52px;border:1px solid #22262A;border-radius:14px;background:#111314;color:#F2F4F5;padding:0 16px;font:600 17px Manrope,system-ui,sans-serif;text-align:center;outline:none}
input:focus{border-color:#3EE07F;box-shadow:0 0 0 3px rgba(62,224,127,.18)}
button{width:100%;height:52px;border:0;border-radius:14px;background:#3EE07F;color:#000;font:800 16px Manrope,system-ui,sans-serif;cursor:pointer;box-shadow:0 0 14px rgba(62,224,127,.4);transition:transform .14s}
button:active{transform:scale(.97)}
button:disabled{opacity:.6}
#err{color:#FF6B6B;font-weight:700}
.shake{animation:shake .35s}
@keyframes in{from{opacity:0;transform:translateY(10px)}}
@keyframes shake{25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-4px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<form id="gate" hidden autocomplete="on">
  <img src="apple-touch-icon.png" alt="">
  <h1>Liftfolio</h1>
  <p>Testversion · Test build</p>
  <input type="password" id="pw" name="password" autocomplete="current-password" placeholder="Passwort · Password" aria-label="Passwort" required>
  <button type="submit" id="go">Öffnen · Open</button>
  <p id="err" hidden>Falsches Passwort · Wrong password</p>
</form>
<script>
(function(){
  var P = ${P};
  var KEY = 'liftfolio-web-key-' + P.salt.slice(0, 8);
  function b64(s){ return Uint8Array.from(atob(s), function(c){ return c.charCodeAt(0); }); }
  function show(html){ document.open(); document.write(html); document.close(); }
  function decrypt(key){ return crypto.subtle.decrypt({name:'AES-GCM', iv:b64(P.iv)}, key, b64(P.ct)).then(function(b){ return new TextDecoder().decode(b); }); }
  function derive(pw){
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']).then(function(base){
      return crypto.subtle.deriveKey({name:'PBKDF2', salt:b64(P.salt), iterations:P.it, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, true, ['decrypt']);
    });
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
  var form = document.getElementById('gate'), pw = document.getElementById('pw'), err = document.getElementById('err'), go = document.getElementById('go');
  function ask(){ form.hidden = false; setTimeout(function(){ pw.focus(); }, 50); }
  var saved = null; try { saved = localStorage.getItem(KEY); } catch(e) {}
  if (saved){
    crypto.subtle.importKey('raw', b64(saved), 'AES-GCM', false, ['decrypt']).then(decrypt).then(show).catch(function(){ try { localStorage.removeItem(KEY); } catch(e) {} ask(); });
  } else ask();
  form.addEventListener('submit', function(ev){
    ev.preventDefault(); err.hidden = true; go.disabled = true;
    var key;
    derive(pw.value).then(function(k){ key = k; return decrypt(k); }).then(function(html){
      return crypto.subtle.exportKey('raw', key).then(function(raw){
        try { localStorage.setItem(KEY, btoa(String.fromCharCode.apply(null, new Uint8Array(raw)))); } catch(e) {}
        show(html);
      });
    }).catch(function(){
      go.disabled = false; err.hidden = false; form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); pw.select();
    });
  });
})();
</script>
</body>
</html>
`;
writeFileSync(prev, gate);

// --- Manifest und Service Worker (offline, Updates kommen beim nächsten Öffnen mit Netz)
writeFileSync(join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Liftfolio', short_name: 'Liftfolio', start_url: './', scope: './', display: 'standalone',
  background_color: '#000000', theme_color: '#000000',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
}, null, 2) + '\n');
const ver = createHash('sha256').update(gate).digest('hex').slice(0, 10);
writeFileSync(join(out, 'sw.js'), `// Liftfolio Web-App: offline-fähig. Version ${ver}
const C = 'liftfolio-${ver}';
const ASSETS = ['./', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'fonts/manrope-latin-wght-normal.woff2', 'fonts/manrope-latin-ext-wght-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put('./', cp)); return res; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r)));
});
`);
console.log('docs/app gebaut · ' + Math.round(gate.length / 1024) + ' KB · Version ' + ver);
