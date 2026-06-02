import fs from 'fs';
const files = [
  'dist/content.js',
  'dist/sidebar.html', 
  'src/i18n/vi.js',
  'src/app.js',
];
for (const f of files) {
  const buf = fs.readFileSync(f);
  const s = buf.toString('utf-8');
  const corrupt = s.includes('\ufffd');
  const vietnamese = s.includes('Đang tải') || s.includes('kết nối') || s.includes('Nâng cấp');
  console.log(f, 'OK'.padEnd(6), 'corrupt:', corrupt, 'vietnamese:', vietnamese, 'bytes:', buf.length);
}
