import fs from 'fs';

const base = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_VMK';
const results = {};

function walk(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = dir + '\\' + e.name;
      if (e.isDirectory()) {
        if (!e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== 'scripts' && e.name !== 'lib') walk(full);
      } else if (e.name.endsWith('.js') || e.name.endsWith('.html') || e.name.endsWith('.css') || e.name.endsWith('.json') || e.name.endsWith('.mjs')) {
        const s = fs.readFileSync(full, 'utf-8');
        const patterns = [
          'Premium', 'premium', 'Nang cap', 'upgrade', 'Upgrade',
          '@tobyflow_bot', 'tobyflow_bot', 'tobyflow-01',
          'toby', 'Toby',
          'labs.toby.vn',
          'quota', 'Quota',
          'trial', 'Trial',
          'referral', 'Referral', 'Referral',
          'Bot chung',
        ];
        for (const p of patterns) {
          const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          const m = s.match(re);
          if (m) {
            const key = full.replace(base + '\\', '');
            if (!results[key]) results[key] = {};
            results[key][p] = (results[key][p] || 0) + m.length;
          }
        }
      }
    }
  } catch (e) { /* ignore */ }
}
walk(base);

// Print organized
for (const [file, patterns] of Object.entries(results).sort()) {
  const total = Object.values(patterns).reduce((a,b) => a+b, 0);
  console.log(file + ' (' + total + ')');
  for (const [p, c] of Object.entries(patterns)) {
    console.log('  ' + p + ': ' + c);
  }
}
console.log('\nTotal files:', Object.keys(results).length);
