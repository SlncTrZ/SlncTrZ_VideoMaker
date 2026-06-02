#!/usr/bin/env node
import fs from 'fs';
const path = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_VMK\\src\\app.js';

// Restore from clean git commit
import { execSync } from 'child_process';
const clean = execSync('git -C H:\\\\Develop\\\\SlncTrZ_VMK\\\\SlncTrZ_VMK-dev show f00eef3:SlncTrZ_VMK/src/app.js', { encoding: 'buffer' }).toString('utf-8');

// Verify clean
if (clean.includes('\ufffd') || clean.includes('\u00c6')) {
  console.error('CORRUPT source!');
  process.exit(1);
}

// Apply renames
let s = clean;
const renames = [
  [/\[TobyFlow\]/g, '[SlncTrZ]'],
  [/__tobyflowTab/g, '__slnctrzTab'],
  [/window\.TobyFlowApp/g, 'window.SlncTrZApp'],
  [/window\.TobyNotify/g, 'window.SlncTrZNotify'],
  [/tobyflow_output/g, 'slnctrz_output'],
  [/tobyflow-01/g, 'slnctrz-01'],
];
let total = 0;
for (const [re, to] of renames) {
  const m = s.match(re);
  if (m) { total += m.length; s = s.replace(re, to); }
}
console.log('Renames applied:', total);

// Apply safety timer
const idx = s.indexOf('function hideLoadingOverlay() {');
if (idx === -1) { console.error('hideLoadingOverlay not found!'); process.exit(1); }

const timerCode = `
    var _loadingSafetyTimer = setTimeout(function() {
      if (overlay) {
        overlay.classList.add('slnctrz-loading-overlay--hidden');
        console.warn('[SlncTrZ] Loading safety timeout');
      }
    }, 10000);

`;

s = s.slice(0, idx) + timerCode + s.slice(idx);
s = s.replace(
  'function hideLoadingOverlay() {',
  'function hideLoadingOverlay() {\n      clearTimeout(_loadingSafetyTimer);'
);

fs.writeFileSync(path, s, 'utf-8');

// Verify
const check = fs.readFileSync(path, 'utf-8');
const corrupt = check.includes('\ufffd') || check.includes('\u00c6');
console.log('Final file corrupt:', corrupt, 'size:', check.length);
