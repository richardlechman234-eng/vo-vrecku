'use strict';
/* =========================================================
   SŤAHOVANIE NA NOVÚ ADRESU (vovrecku.github.io)
   Dáta sa prenášajú len v prehliadači cez postMessage medzi touto
   kartou a novou appkou. Nič sa neposiela na internet.
   ========================================================= */
if (window.top !== window.self) { document.documentElement.style.display = 'none'; throw new Error('blocked'); }

const NEW_URL = 'https://vovrecku.github.io/';
const NEW_ORIGIN = 'https://vovrecku.github.io';
const KEYS = { data: 'voVrecku.data.v1', draft: 'voVrecku.draft', backup: 'voVrecku.lastBackup' };
const $ = (id) => document.getElementById(id);

function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function wipe() { try { for (const k of Object.values(KEYS)) localStorage.removeItem(k); } catch (e) { /* nevadí */ } }

// sú tu nejaké skutočné dáta?
let parsed = null;
try { parsed = JSON.parse(read(KEYS.data)); } catch (e) { parsed = null; }
const hasData = !!(parsed && parsed.months && (Object.keys(parsed.months).length > 0 || parsed.profile));

function status(text, cls) { const s = $('status'); s.textContent = text; s.className = 'status ' + (cls || ''); }

if (!hasData) {
  $('noData').hidden = false;
  setTimeout(() => location.replace(NEW_URL), 1500);
} else {
  $('withData').hidden = false;
  let win = null, timer = null, done = false;

  window.addEventListener('message', (e) => {
    if (e.origin !== NEW_ORIGIN || !win || e.source !== win || !e.data) return;
    if (e.data.type === 'vv-pripraveny') {
      win.postMessage({ type: 'vv-presun', data: parsed, draft: read(KEYS.draft), lastBackup: read(KEYS.backup) }, NEW_ORIGIN);
      status('Nová appka sa pýta na potvrdenie – potvrď to v novej karte.');
    } else if (e.data.type === 'vv-hotovo') {
      done = true; clearTimeout(timer); wipe();
      status('✓ Hotovo! Dáta sú v novej appke a z tejto starej adresy sú vymazané. Túto kartu môžeš zavrieť.', 'ok');
      $('moveBtn').hidden = true;
    } else if (e.data.type === 'vv-zrusene') {
      clearTimeout(timer); status('Prenos si zrušil. Dáta ostali tu, nič sa nestratilo.', 'bad');
    } else if (e.data.type === 'vv-chyba') {
      clearTimeout(timer); status('Dáta sa nepodarilo preniesť. Skús zálohu nižšie.', 'bad'); $('fallback').open = true;
    }
  });

  $('moveBtn').onclick = () => {
    win = window.open(NEW_URL + '?presun=1', '_blank');
    if (!win) { status('Prehliadač nepovolil otvoriť novú kartu. Použi zálohu nižšie.', 'bad'); $('fallback').open = true; return; }
    status('Otváram novú appku…');
    clearTimeout(timer);
    timer = setTimeout(() => { if (!done) { status('Nová appka neodpovedá. Použi zálohu nižšie – funguje vždy.', 'bad'); $('fallback').open = true; } }, 20000);
  };

  $('exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(Object.assign({ app: 'Vo vrecku', exported: new Date().toISOString() }, parsed), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vo-vrecku-zaloha-presun.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $('wipeBtn').hidden = false;
  };

  $('wipeBtn').onclick = () => {
    if (!confirm('Vymazať dáta z tejto starej adresy? Urob to až keď si ich naimportoval do novej appky.')) return;
    wipe(); status('Stará kópia je vymazaná.', 'ok'); $('wipeBtn').hidden = true;
  };
}

// starý pomocník na pozadí (service worker) sa zruší – už nie je potrebný
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
}
