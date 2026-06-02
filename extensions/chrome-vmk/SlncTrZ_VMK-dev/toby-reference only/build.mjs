/**
 * Build script for Toby Flow Chrome Extension
 *
 * Usage:
 *   node build.mjs              # Dev build (no minification)
 *   node build.mjs --production # Production build (minified)
 *   node build.mjs --watch      # Dev build + watch for changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const isWatch = args.includes('--watch');

// ---------------------------------------------------------------------------
// File lists (order matters for JS - matches manifest.json content_scripts)
// ---------------------------------------------------------------------------

const CONTENT_JS_FILES = [
  'lib/drawflow.min.js',
  'src/i18n/vi.js',
  'src/i18n/en.js',
  'src/i18n/th.js',
  'src/i18n/ja.js',
  'src/core/EventBus.js',
  'src/core/LocalStorage.js',
  'src/core/AuthManager.js',
  'src/core/ApiStorage.js',
  'src/core/StorageManager.js',
  'src/core/FeatureGate.js',
  'src/core/I18n.js',
  'src/core/NotificationManager.js',
  'src/core/WorkflowExecutor.js',
  'src/core/AnnouncementManager.js',
  'src/core/BatchQueue.js',
  'src/queue/QueuePanel.js',
  'src/shared/CustomDialog.js',
  'src/shared/ImagePickerModal.js',
  'src/settings/StorageSettings.js',
  'src/history/GenerationHistory.js',
  'src/history/HistoryTab.js',
  'src/snippets/UserPromptsManager.js',
  'src/snippets/SnippetsPanel.js',
  'src/templates/TemplatesTab.js',
  'src/multi-task/TaskList.js',
  'src/multi-task/TaskModal.js',
  'src/multi-task/MultiTaskTab.js',
  'src/auto-flow/NodeTemplates.js',
  'src/auto-flow/DiagramCanvas.js',
  'src/auto-flow/WorkflowList.js',
  'src/auto-flow/WorkflowEditor.js',
  'src/auto-flow/WorkflowTab.js',
  'src/prompts/GenTab.js',
  'src/core/SidebarManager.js',
  'src/app.js',
  'content.js',
];

const CONTENT_CSS_FILES = [
  'sidebar.css',
  'lib/drawflow.min.css',
  'src/shared/custom-dialog.css',
  'src/shared/image-picker.css',
  'src/multi-task/multi-task.css',
  'src/auto-flow/auto-flow.css',
  'src/templates/templates-tab.css',
  'src/history/history-tab.css',
  'src/snippets/snippets.css',
];

// Static assets to copy to dist/
const STATIC_ASSETS = [
  'sidebar.html',
  'settings.html',
  'settings.css',
  'settings-page.js',
];

// Directories to copy recursively (if they exist)
const STATIC_DIRS = [
  'icons',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] File not found: ${relPath}`);
    process.exit(1);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function writeFile(relPath, content) {
  const fullPath = path.join(DIST, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, 'utf-8');
}

function copyFile(relPath) {
  const src = path.join(ROOT, relPath);
  const dest = path.join(DIST, relPath);
  if (!fs.existsSync(src)) {
    console.warn(`[WARN] Static asset not found, skipping: ${relPath}`);
    return;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(relDir) {
  const srcDir = path.join(ROOT, relDir);
  if (!fs.existsSync(srcDir)) {
    console.warn(`[WARN] Directory not found, skipping: ${relDir}/`);
    return;
  }
  const destDir = path.join(DIST, relDir);
  ensureDir(destDir);

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(path.join(relDir, entry.name));
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ---------------------------------------------------------------------------
// Minification via esbuild
// ---------------------------------------------------------------------------

let esbuild = null;

async function loadEsbuild() {
  if (!isProduction) return;
  try {
    esbuild = await import('esbuild');
  } catch {
    console.error('[ERROR] esbuild not installed. Run: npm install');
    process.exit(1);
  }
}

async function minifyJS(code, sourceName) {
  if (!isProduction || !esbuild) return code;
  const result = await esbuild.transform(code, {
    loader: 'js',
    minify: true,
    target: 'es2020',
  });
  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`[WARN] ${sourceName}: ${w.text}`);
    }
  }
  return result.code;
}

async function minifyCSS(code, sourceName) {
  if (!isProduction || !esbuild) return code;
  const result = await esbuild.transform(code, {
    loader: 'css',
    minify: true,
  });
  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`[WARN] ${sourceName}: ${w.text}`);
    }
  }
  return result.code;
}

// ---------------------------------------------------------------------------
// Generate dist/manifest.json
// ---------------------------------------------------------------------------

function generateManifest() {
  const original = JSON.parse(readFile('manifest.json'));

  // Replace content_scripts with bundled files
  original.content_scripts = [
    {
      matches: ['https://labs.google/fx/*'],
      js: ['content.js'],
      css: ['content.css'],
      run_at: 'document_idle',
    },
  ];

  // Update web_accessible_resources for bundled output
  original.web_accessible_resources = [
    {
      resources: [
        'sidebar.html',
        'settings.html',
        'settings.css',
        'settings-page.js',
      ],
      matches: ['https://labs.google/*'],
    },
  ];

  return JSON.stringify(original, null, 2);
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

async function build() {
  const startTime = Date.now();

  await loadEsbuild();

  // Clean dist/
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  // 1. Concatenate content JS files
  const jsHeader = `/* Toby Flow v2.1.0 - ${isProduction ? 'Production' : 'Development'} Build */\n`;
  let contentJS = jsHeader;

  for (const file of CONTENT_JS_FILES) {
    const code = readFile(file);
    // Plain concatenation - files rely on shared global scope (window.ClassName, top-level vars)
    // This matches how Chrome loads multiple content_scripts sequentially
    contentJS += `\n/* === ${file} === */\n${code}\n`;
  }

  contentJS = await minifyJS(contentJS, 'content.js');
  writeFile('content.js', contentJS);

  // 2. Concatenate content CSS files
  let contentCSS = '';
  for (const file of CONTENT_CSS_FILES) {
    const code = readFile(file);
    contentCSS += `\n/* === ${file} === */\n${code}\n`;
  }
  contentCSS = await minifyCSS(contentCSS, 'content.css');
  writeFile('content.css', contentCSS);

  // 3. Background service worker
  let backgroundJS = readFile('background.js');
  backgroundJS = await minifyJS(backgroundJS, 'background.js');
  writeFile('background.js', backgroundJS);

  // 4. Copy static assets
  for (const asset of STATIC_ASSETS) {
    copyFile(asset);
  }

  // 5. Copy static directories
  for (const dir of STATIC_DIRS) {
    copyDirRecursive(dir);
  }

  // 6. Generate manifest.json
  writeFile('manifest.json', generateManifest());

  // Report
  const elapsed = Date.now() - startTime;
  const jsSize = fs.statSync(path.join(DIST, 'content.js')).size;
  const cssSize = fs.statSync(path.join(DIST, 'content.css')).size;
  const bgSize = fs.statSync(path.join(DIST, 'background.js')).size;

  console.log('');
  console.log(`[BUILD] ${isProduction ? 'Production' : 'Development'} build completed in ${elapsed}ms`);
  console.log(`  dist/content.js     ${formatSize(jsSize)}`);
  console.log(`  dist/content.css    ${formatSize(cssSize)}`);
  console.log(`  dist/background.js  ${formatSize(bgSize)}`);
  console.log(`  dist/manifest.json`);
  for (const asset of STATIC_ASSETS) {
    if (fs.existsSync(path.join(DIST, asset))) {
      console.log(`  dist/${asset}`);
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Watch mode
// ---------------------------------------------------------------------------

function watchMode() {
  // Collect all directories that contain source files
  const watchDirs = new Set();
  watchDirs.add(ROOT); // For root-level files (content.js, background.js, sidebar.css, etc.)

  const allFiles = [...CONTENT_JS_FILES, ...CONTENT_CSS_FILES, 'background.js'];
  for (const file of allFiles) {
    const dir = path.dirname(path.join(ROOT, file));
    watchDirs.add(dir);
  }

  // Also watch settings files
  for (const asset of STATIC_ASSETS) {
    const dir = path.dirname(path.join(ROOT, asset));
    watchDirs.add(dir);
  }

  let debounceTimer = null;
  let isBuilding = false;

  const rebuild = async (changedFile) => {
    if (isBuilding) return;
    isBuilding = true;
    console.log(`[WATCH] Change detected: ${changedFile}`);
    try {
      await build();
    } catch (err) {
      console.error(`[ERROR] Build failed: ${err.message}`);
    }
    isBuilding = false;
  };

  for (const dir of watchDirs) {
    if (!fs.existsSync(dir)) continue;
    fs.watch(dir, { recursive: false }, (eventType, filename) => {
      if (!filename) return;
      // Skip dist/ and node_modules/
      if (filename.startsWith('dist') || filename.startsWith('node_modules')) return;
      // Only watch relevant extensions
      if (!/\.(js|css|html|json)$/.test(filename)) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => rebuild(filename), 200);
    });
  }

  console.log('[WATCH] Watching for changes... (Ctrl+C to stop)');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  try {
    await build();
    if (isWatch) {
      watchMode();
    }
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    process.exit(1);
  }
}

main();
