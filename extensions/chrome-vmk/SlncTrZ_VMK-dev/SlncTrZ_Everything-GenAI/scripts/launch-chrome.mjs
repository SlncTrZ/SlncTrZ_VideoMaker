#!/usr/bin/env node
/** Scripts — Launch Chrome (profile) with dedicated CDP port + load extension.
 * Wing: code_chronicles | Topic: flowforge | Updated: 2026-05-24 13:00
 *
 * Usage:
 *   node scripts/launch-chrome.mjs --profile "Profile 5" --kill
 *   node scripts/launch-chrome.mjs --profile "Default"
 *   node scripts/launch-chrome.mjs --profile "Profile 5" --port 9225
 *
 * Registry: scripts/.cdp-registry.json tracks {profile → port} for multi-instance.
 */

import { spawn, execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const REGISTRY_PATH = path.join(__dirname, '.cdp-registry.json');
const PORT_MIN = 9222;
const PORT_MAX = 9399;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadRegistry() {
  try { return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')); }
  catch { return {}; }
}

function saveRegistry(registry) {
  mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/** Check if a port is available (not in use). */
function isPortFree(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
  });
}

/** Find the first available port starting from `start`. Skips ports in use. */
async function findFreePort(start = PORT_MIN) {
  for (let p = start; p <= PORT_MAX; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(`No free port found in range ${PORT_MIN}-${PORT_MAX}`);
}

/** Get a deterministic port for a profile (based on hash of profile name). */
function hashPort(profileName, base = PORT_MIN) {
  let hash = 0;
  for (let i = 0; i < profileName.length; i++) {
    hash = ((hash << 5) - hash) + profileName.charCodeAt(i);
    hash |= 0;
  }
  return base + (Math.abs(hash) % (PORT_MAX - PORT_MIN));
}

async function waitForCDP(port, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${port}/json/version`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch { /* retry */ }
    await sleep(500);
  }
  throw new Error(`CDP timeout on port ${port}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let profile = 'Default';
  let kill = false;
  let preferredPort = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && i + 1 < args.length) profile = args[i + 1];
    if (args[i] === '--kill') kill = true;
    if (args[i] === '--port' && i + 1 < args.length) preferredPort = parseInt(args[i + 1], 10);
  }
  return { profile, kill, preferredPort };
}

async function main() {
  const { profile, kill, preferredPort } = parseArgs();
  const extPath = path.resolve(ROOT, 'dist');

  if (!existsSync(extPath)) {
    console.error(`❌ dist/ not found at ${extPath}. Run 'node build.mjs' first.`);
    process.exit(1);
  }

  // Determine port: user-specified, or hash-based by profile, or first free
  const registry = loadRegistry();
  let port = preferredPort || registry[profile]?.port || hashPort(profile);
  if (!(await isPortFree(port))) {
    console.warn(`⚠️  Port ${port} in use, scanning for free port...`);
    port = await findFreePort(PORT_MIN);
  }

  if (kill) {
    console.log('🔫 Killing existing Chrome...');
    try { execSync('taskkill /F /IM chrome.exe', { stdio: 'pipe' }); } catch { /* ok */ }
    await sleep(1500);
  }

  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--profile-directory=${profile}`,
    `--load-extension=${extPath}`,
    '--no-first-run',
  ];

  console.log(`🚀 Chrome — Profile: "${profile}" | Port: ${port}`);
  console.log(`📦 Extension: ${extPath}`);

  const proc = spawn(CHROME, chromeArgs, { stdio: 'ignore', detached: true });
  proc.unref();

  try {
    const info = await waitForCDP(port);
    // Save to registry
    registry[profile] = { port, pid: proc.pid, extPath, launchedAt: Date.now() };
    saveRegistry(registry);

    console.log(`✅ PID: ${proc.pid || '(detached)'}`);
    console.log(`🔌 CDP: ws://localhost:${port}`);
    console.log(`📋 Registry: ${REGISTRY_PATH}`);
    process.exit(0);
  } catch {
    // --load-extension may fail on Chrome 147+ → relaunch without it
    const exited = proc.exitCode !== null;
    if (exited && proc.exitCode !== 0) {
      console.warn(`⚠️  --load-extension failed (exit ${proc.exitCode}), retrying without...`);
      const fallbackArgs = [
        `--remote-debugging-port=${port}`,
        `--profile-directory=${profile}`,
        '--no-first-run',
      ];
      const proc2 = spawn(CHROME, fallbackArgs, { stdio: 'ignore', detached: true });
      proc2.unref();

      const info = await waitForCDP(port);
      registry[profile] = { port, pid: proc2.pid, extPath, launchedAt: Date.now() };
      saveRegistry(registry);

      console.log(`✅ Chrome launched (no extension flag)`);
      console.log(`🔌 CDP: ws://localhost:${port}`);
      process.exit(0);
    }
    console.error(`❌ CDP timeout on port ${port}`);
    process.exit(1);
  }
}

main();
