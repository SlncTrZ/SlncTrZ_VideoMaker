import fs from 'fs';
const files = [
  'dist/content.js',
  'dist/content.css',
  'dist/sidebar.html',
  'dist/sidebar.css',
  'dist/background.js',
  'dist/settings.html',
  'dist/src/i18n/vi.js',
];
let allOk = true;
for (const f of files) {
  const p = `H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_VMK\\${f}`;
  if (!fs.existsSync(p)) { console.log(f, 'NOT FOUND'); allOk = false; continue; }
  const s = fs.readFileSync(p, 'utf-8');
  const corrupt = s.includes('\ufffd');
  const hasVN = /[\u00C0-\u1EF9]/.test(s);
  const hasToby = f.includes('.js') && (s.includes('[TobyFlow]') || s.includes('tobyflow-'));
  const status = corrupt ? 'CORRUPT' : 'OK';
  if (corrupt) allOk = false;
  console.log(`${f.padEnd(30)} ${status} vn:${hasVN} toby:${hasToby} bytes:${fs.statSync(p).size}`);
}
console.log(`\nAll ${allOk ? 'OK' : 'FAILED'}`);
