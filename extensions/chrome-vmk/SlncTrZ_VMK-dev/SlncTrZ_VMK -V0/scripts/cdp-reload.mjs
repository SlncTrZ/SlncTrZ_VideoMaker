#!/usr/bin/env node
/** Scripts — Reload extension(s) via CDP. Reads port from registry.
 * Wing: code_chronicles | Topic: flowforge | Updated: 2026-05-24 13:00
 *
 * Usage:
 *   node scripts/cdp-reload.mjs                     # reload all registered
 *   node scripts/cdp-reload.mjs --profile "Profile 5"  # reload specific profile
 *   node scripts/cdp-reload.mjs --port 9225             # reload specific port
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(__dirname, '.cdp-registry.json');

function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) return {};
  try { return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')); }
  catch { return {}; }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let targetProfile = null;
  let targetPort = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && i + 1 < args.length) targetProfile = args[i + 1];
    if (args[i] === '--port' && i + 1 < args.length) targetPort = parseInt(args[i + 1], 10);
  }
  return { targetProfile, targetPort };
}

async function getTargets(port) {
  const res = await fetch(`http://localhost:${port}/json`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function reloadOnPort(port, label) {
  const targets = await getTargets(port);
  // Prefer extension target (service_worker, background_page, chrome-extension://)
  const extTarget = targets.find(t =>
    t.type === 'service_worker' || t.type === 'background_page' ||
    (t.url && t.url.startsWith('chrome-extension://'))
  ) || targets.find(t => t.type === 'browser');

  if (!extTarget) {
    console.warn(`⚠️  [${label}] No target found on port ${port}`);
    return false;
  }

  return new Promise((resolve) => {
    const ws = new WebSocket(extTarget.webSocketDebuggerUrl);
    const timeout = setTimeout(() => { ws.close(); resolve(false); }, 8000);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `try{chrome.runtime.reload();'ok'}catch(e){try{location.reload()}catch(_){'fail: '+e.message}}`,
          returnByValue: true,
        },
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === 1) {
        clearTimeout(timeout);
        const val = msg.result?.value || '';
        console.log(`✅ [${label}] Reloaded (${val})`);
        ws.close();
        resolve(true);
      }
    });

    ws.on('error', () => { clearTimeout(timeout); resolve(false); });
  });
}

async function main() {
  const { targetProfile, targetPort } = parseArgs();

  if (targetPort) {
    // Direct port — no registry needed
    console.log(`🔌 Connecting to port ${targetPort}...`);
    const ok = await reloadOnPort(targetPort, `port:${targetPort}`);
    if (!ok) { console.error('❌ Failed'); process.exit(1); }
    return;
  }

  const registry = loadRegistry();
  const entries = targetProfile
    ? (registry[targetProfile] ? [{ profile: targetProfile, ...registry[targetProfile] }] : [])
    : Object.entries(registry).map(([profile, info]) => ({ profile, ...info }));

  if (entries.length === 0) {
    const hint = targetProfile ? `Profile "${targetProfile}" not in registry.` : 'No entries in registry.';
    console.error(`❌ ${hint}`);
    console.error('   Launch Chrome first: node scripts/launch-chrome.mjs --profile "Profile 5"');
    console.error('   Or specify port:     node scripts/cdp-reload.mjs --port 9225');
    process.exit(1);
  }

  const results = await Promise.allSettled(
    entries.map(e => reloadOnPort(e.port, `"${e.profile}"`).catch(() => false))
  );

  const ok = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const fail = results.length - ok;
  console.log(`\n📊 Reloaded: ${ok}/${results.length} instance(s)`);
  if (fail > 0) process.exit(1);
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
