import fs from 'fs';
import { execSync } from 'child_process';

const ROOT = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_VMK';

const criticalFiles = [
  'sidebar.html',
  'sidebar.css',
  'settings.html',
  'settings.css',
  'boot.js',
  'background.js',
  'content.js',
  'build.mjs',
  'src/app.js',
  'src/core/I18n.js',
  'src/core/StorageSettings.js',
  'src/core/FeatureGate.js',
  'src/core/AuthManager.js',
  'src/core/MessageBridge.js',
  'src/prompts/GenTab.js',
  'src/settings/StorageSettings.js',
];

console.log('File encoding check:');
for (const f of criticalFiles) {
  const fp = `${ROOT}\\${f.replace(/\//g, '\\')}`;
  if (!fs.existsSync(fp)) { console.log(f, 'NOT FOUND'); continue; }
  const buf = fs.readFileSync(fp);
  const s = buf.toString('utf-8');
  
  // Check for corruption
  const hasReplacement = s.includes('\ufffd');
  const hasAE = s.includes('Æ');
  const hasCorruption = hasReplacement || hasAE;
  
  // Check for Vietnamese
  const hasVN = /[\u00C0-\u1EF9]/.test(s);
  
  // Get line count
  const lines = s.split('\n').length;
  
  console.log(`${f.padEnd(30)} ${hasCorruption ? 'CORRUPT' : 'OK'.padEnd(6)} vn:${hasVN} lines:${lines} bytes:${buf.length}`);
}
