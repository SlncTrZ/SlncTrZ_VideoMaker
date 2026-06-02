import fs from 'fs';
const base = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_Everything-GenAI';

// 1. Add WebSocket URL field to settings.html
let html = fs.readFileSync(base + '\\settings.html', 'utf-8');

const wsField = `
      <!-- WebSocket Bridge -->
      <section class="s-section">
        <div class="s-section-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path>
          </svg>
          <span>n8n WebSocket Bridge</span>
        </div>
        <div class="s-field">
          <label for="wsBridgeUrl">WebSocket URL</label>
          <div class="s-input-group">
            <input type="text" id="wsBridgeUrl" value="ws://192.168.1.227:1888" placeholder="ws://192.168.1.227:1888" />
          </div>
          <span class="s-hint">Địa chỉ WebSocket server (bridge) để kết nối với n8n.</span>
        </div>
      </section>`;

// Insert after the general settings section in advanced tab
const advancedEnd = html.indexOf('data-tab-content="telegram"');
const insertBefore = html.lastIndexOf('</section>', advancedEnd);
if (insertBefore > 0) {
  const sectionEnd = html.indexOf('</section>', insertBefore + 10);
  const afterSection = html.indexOf('</section>', sectionEnd + 10);
  if (afterSection > 0) {
    html = html.slice(0, afterSection + 10) + wsField + html.slice(afterSection + 10);
    fs.writeFileSync(base + '\\settings.html', html, 'utf-8');
    console.log('Added WS field to settings.html');
  }
}

// 2. Add WS URL save/load to settings-page.js
let js = fs.readFileSync(base + '\\settings-page.js', 'utf-8');

// Add to bindElements
js = js.replace(
  'const els = {};',
  'const els = {};\n    els.wsBridgeUrl = document.getElementById(\'wsBridgeUrl\');'
);

// Add save handler for wsBridgeUrl
const saveBlock = '\n      if (els.wsBridgeUrl) settings.ws_bridge_url = els.wsBridgeUrl.value.trim();';
js = js.replace(
  'if (els.telegramDownloadResolution) settings.telegram_download_resolution = els.telegramDownloadResolution.value;',
  'if (els.telegramDownloadResolution) settings.telegram_download_resolution = els.telegramDownloadResolution.value;' + saveBlock
);

// Add save to storage
js = js.replace(
  "chrome.storage.local.set({ af_settings: settings });",
  "chrome.storage.local.set({ af_settings: settings });\n    if (settings.ws_bridge_url) {\n      const wsConfig = { url: settings.ws_bridge_url };\n      const existing = await chrome.storage.local.get(['af_ws_config']);\n      chrome.storage.local.set({ af_ws_config: { ...(existing.af_ws_config || {}), ...wsConfig } });\n    }"
);

// Add load handler
js = js.replace(
  'if (els.telegramDownloadResolution) els.telegramDownloadResolution.value = s.telegram_download_resolution || \'1k\';',
  'if (els.telegramDownloadResolution) els.telegramDownloadResolution.value = s.telegram_download_resolution || \'1k\';\n      if (els.wsBridgeUrl) els.wsBridgeUrl.value = s.ws_bridge_url || \'ws://192.168.1.227:1888\';'
);

fs.writeFileSync(base + '\\settings-page.js', js, 'utf-8');
console.log('Updated settings-page.js');

// 3. Update background.js to read ws config from storage
let bg = fs.readFileSync(base + '\\background.js', 'utf-8');

// Replace the hardcoded default URL to use storage config
bg = bg.replace(
  "url: 'ws://192.168.1.227:1888',",
  "url: 'ws://localhost:1888',  // Overridden by af_ws_config in chrome.storage"
);

// Add a note about configuring via Settings
console.log('Updated background.js WS URL');

fs.writeFileSync(base + '\\background.js', bg, 'utf-8');
console.log('\nDone!');
