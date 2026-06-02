import fs from 'fs';
import { execSync } from 'child_process';

const ROOT = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev';
const GIT_DIR = `${ROOT}\\SlncTrZ_VMK`;
const files = [
  'sidebar.html',
  'sidebar.css',
  'settings.html',
  'src/core/I18n.js',
  'src/prompts/GenTab.js',
];

function restoreFromGit(file, commit) {
  const repoPath = `${ROOT}\\SlncTrZ_VMK`;
  const gitPath = `${ROOT}\\.git`;
  try {
    const buf = execSync(`git -C "${ROOT}" show ${commit}:SlncTrZ_VMK/${file}`, { encoding: 'buffer' });
    const s = buf.toString('utf-8');
    // Verify not corrupt
    if (s.includes('\ufffd') || s.includes('Æ')) {
      console.log(`${file} - ${commit}: CORRUPT in git too, skipping`);
      return false;
    }
    const target = `${ROOT}\\SlncTrZ_VMK\\${file.replace(/\//g, '\\')}`;
    fs.writeFileSync(target, buf);
    console.log(`${file} - restored from ${commit} (${buf.length} bytes)`);
    return true;
  } catch (e) {
    console.log(`${file} - ${commit}: ${e.message.split('\n')[0]}`);
    return false;
  }
}

// Try commits in order (most recent first) until we find a clean one
const commits = [
  '479c12b',  // Initial copy from installed extension
];

for (const file of files) {
  for (const c of commits) {
    if (restoreFromGit(file, c)) break;
  }
}
