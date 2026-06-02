import fs from 'fs';
const base = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_Everything-GenAI';
const targets = [
  'src/workflow/WorkflowEditor.js',
  'src/workflow/WorkflowList.js',
  'src/app.js',
  'src/core/I18n.js',
  'src/core/FileUploader.js',
];
let total = 0;
for (const file of targets) {
  const p = base + '\\' + file;
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf-8');
  const before = (s.match(/labs\.toby\.vn/g) || []).length;
  if (before === 0) continue;
  s = s.replace(/'https:\/\/labs\.toby\.vn\/api\/v1'/g, "''");
  s = s.replace(/'https:\/\/labs\.toby\.vn'/g, "''");
  s = s.replace(/"https:\/\/labs\.toby\.vn\/api\/v1"/g, '""');
  s = s.replace(/"https:\/\/labs\.toby\.vn"/g, '""');
  fs.writeFileSync(p, s, 'utf-8');
  const after = (s.match(/labs\.toby\.vn/g) || []).length;
  console.log(file + ': ' + (before - after) + ' fixes (remaining: ' + after + ')');
  total += (before - after);
}
console.log('Total fixes: ' + total);
