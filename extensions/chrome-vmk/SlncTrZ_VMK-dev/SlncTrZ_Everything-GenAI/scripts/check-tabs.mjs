import fs from 'fs';
const h = fs.readFileSync('dist/settings.html', 'utf-8');

// Find all data-tab-content
const contents = [...h.matchAll(/data-tab-content="([^"]+)"/g)];
console.log('Tab contents:');
contents.forEach(c => console.log('  ' + c[1]));

// Find all settings-tab buttons
const buttons = [...h.matchAll(/class="settings-tab"[^>]*data-tab="([^"]+)"/g)];
console.log('Tab buttons:');
buttons.forEach(b => console.log('  ' + b[1]));
