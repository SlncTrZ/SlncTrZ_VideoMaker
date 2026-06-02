import fs from 'fs';
import { execSync } from 'child_process';

const ROOT = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev';

const corruptFiles = [
  'src/albums/AlbumList.js',
  'src/core/ExecutionTracker.js',
  'src/core/PipelineFooter.js',
  'src/core/QueueMonitor.js',
  'src/history/HistoryTab.js',
  'src/multi-task/TaskList.js',
  'src/photos/PhotosTab.js',
  'src/prompts/MyPromptsTab.js',
  'src/templates/TemplatesTab.js',
  'src/workflow/DiagramCanvas.js',
  'src/workflow/workflow.css',
  'src/workflow/WorkflowEditor.js',
  'src/workflow/WorkflowList.js',
  'src/workflow/WorkflowTab.js',
];

function restoreFromGit(file, commit) {
  try {
    const buf = execSync(`git -C "${ROOT}" show ${commit}:SlncTrZ_VMK/${file}`, { encoding: 'buffer' });
    const s = buf.toString('utf-8');
    if (s.includes('\ufffd')) return false;
    fs.writeFileSync(`${ROOT}\\SlncTrZ_VMK\\${file.replace(/\//g, '\\')}`, buf);
    return true;
  } catch { return false; }
}

// Restore from clean commit
for (const f of corruptFiles) {
  if (restoreFromGit(f, 'f00eef3')) {
    console.log('Restored:', f);
  } else {
    console.log('FAILED:', f);
  }
}

// Now re-apply renames
console.log('\nRe-applying renames...');
const renameFiles = corruptFiles.filter(f => f.endsWith('.js') || f.endsWith('.css'));
for (const f of renameFiles) {
  const fp = `${ROOT}\\SlncTrZ_VMK\\${f.replace(/\//g, '\\')}`;
  let s = fs.readFileSync(fp, 'utf-8');
  let count = 0;
  
  // tobyflow- → slnctrz-
  const m1 = s.match(/tobyflow-/g);
  if (m1) { count += m1.length; s = s.replace(/tobyflow-/g, 'slnctrz-'); }
  
  // [TobyFlow] → [SlncTrZ]
  const m2 = s.match(/\[TobyFlow\]/g);
  if (m2) { count += m2.length; s = s.replace(/\[TobyFlow\]/g, '[SlncTrZ]'); }
  
  if (count > 0) {
    fs.writeFileSync(fp, s, 'utf-8');
    console.log(`  ${f}: ${count} renames`);
  }
}

// Verify all
console.log('\nVerification:');
let ok = true;
for (const f of corruptFiles) {
  const fp = `${ROOT}\\SlncTrZ_VMK\\${f.replace(/\//g, '\\')}`;
  const s = fs.readFileSync(fp, 'utf-8');
  const corrupt = s.includes('\ufffd') || s.includes('Æ');
  if (corrupt) { console.log('  STILL CORRUPT:', f); ok = false; }
}
if (ok) console.log('  ALL CLEAN');
