// === Re-injection guard (IIFE pattern) ===
// Manifest content_scripts auto-inject content.js khi page load match labs.google/fx/*
// PLUS background.js onInstalled cũng auto-inject vào existing tabs để cover orphan scenario.
// → Nếu user reload extension KHI tab Flow đã mở, content.js inject 2 LẦN →
// chrome.runtime.onMessage.addListener register 2 lần → mỗi message fire 2× handlers
// → addFileToPrompt right-click 2× cho mỗi ref, downloadTileMedia download 2× mỗi tile.
// Fix: IIFE với early return - không throw error, không console noise.
if (self.__tobyflowContentJsLoaded__) {
  // Silent skip - đã loaded trước đó
} else {
self.__tobyflowContentJsLoaded__ = true;
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONTENT SCRIPT CODE STARTS HERE (inside else block, closed at end of file)
// ═══════════════════════════════════════════════════════════════════════════════

// Guard: var allows safe re-declaration when extension reloads and re-injects content.js
var isRunning = false;
var shouldStop = false;
var isPaused = false;
var failedPrompts = [];

// ─── DOM Tile Cache ───
// Cache DOM queries để giảm load trong polling loops (TTL 250ms)
var _tileCache = null;
var _tileCacheTime = 0;
var _TILE_CACHE_TTL = 250; // ms

// ─── Multi-language aria-label fallbacks (Flow UI localization) ───
// Flow thay đổi aria-label theo ngôn ngữ user chọn trên Google Flow
// Cần fallback array để selector hoạt động với mọi ngôn ngữ
var _ARIA_LABELS = {
  // Input project name / rename input
  editableText: ['Văn bản có thể chỉnh sửa', 'Editable text', 'ข้อความที่แก้ไขได้', '編集可能なテキスト'],
  // Toggle On/Off buttons
  toggleOn: ['Đang bật', 'On', 'เปิด', 'オン'],
  toggleOff: ['Đang tắt', 'Off', 'ปิด', 'オフ'],
  // Setting labels (text content fallbacks)
  showTileDetails: ['Hiện thông tin chi tiết về ô', 'Show tile details', 'แสดงรายละเอียดของแผ่น', 'タイルの詳細を表示'],
  // Context menu items
  addToPrompt: ['Thêm vào câu lệnh', 'Add to prompt', 'เพิ่มในข้อความ', 'プロンプトに追加'],
  download: ['Tải xuống', 'Download', 'ดาวน์โหลด', 'ダウンロード'],
};

/**
 * Query inputs by multi-language aria-label fallback
 * @param {string[]} labels - Array of aria-label values to try
 * @returns {NodeList|Element[]} - Matching input elements
 */
function _queryInputsByAriaLabels(labels) {
  for (const label of labels) {
    const inputs = document.querySelectorAll(`input[aria-label="${label}"]`);
    if (inputs.length > 0) return inputs;
  }
  return [];
}

/**
 * Check if aria-label matches any value in array
 * @param {string} label - aria-label value from element
 * @param {string[]} expected - Array of expected values
 * @returns {boolean}
 */
function _ariaLabelMatches(label, expected) {
  return expected.includes(label);
}

/**
 * Check if text content includes any string in array (case-insensitive)
 * @param {string} text - Text content to check
 * @param {string[]} patterns - Array of patterns to match
 * @returns {boolean}
 */
function _textIncludesAny(text, patterns) {
  const textLower = text.toLowerCase();
  return patterns.some(p => textLower.includes(p.toLowerCase()));
}

/**
 * Get tile container selector from dynamic config
 * @returns {{selector: string, attribute: string}} - Selector and attribute to use
 */
function _getTileSelector() {
  var config = _getDynamicSelector('tile_container');
  var selectors = config?.selectors?.length ? config.selectors : ['[data-tile-id]'];
  var attribute = config?.attribute || 'data-tile-id';

  // Try each selector, return first that finds elements
  for (var i = 0; i < selectors.length; i++) {
    try {
      var els = document.querySelectorAll(selectors[i]);
      if (els.length > 0) {
        if (i === 0 && config?.selectors?.length) {
          console.log(`[Selector:tile_container] 🌐 DYNAMIC #${i + 1}: ${selectors[i]} (${els.length} tiles)`);
        }
        return { selector: selectors[i], attribute: attribute };
      }
    } catch (e) { /* invalid selector */ }
  }

  // Fallback to default
  console.log(`[Selector:tile_container] 📦 HARDCODED: [data-tile-id]`);
  return { selector: '[data-tile-id]', attribute: 'data-tile-id' };
}

// Cache tile selector config (refresh every 30s with selector cache)
var _tileSelectorCache = null;

/**
 * Get cached tile elements - tránh query DOM nhiều lần trong 1 polling cycle
 * Cache tự invalidate sau 250ms (1 polling cycle thường ~2000ms)
 * @returns {NodeList} - Tất cả elements có data-tile-id
 */
function _getCachedTiles() {
  var now = Date.now();
  if (_tileCache && (now - _tileCacheTime) < _TILE_CACHE_TTL) {
    return _tileCache;
  }

  // Get dynamic selector (cached internally)
  if (!_tileSelectorCache || (now - _selectorConfigTime) > _SELECTOR_CACHE_TTL) {
    _tileSelectorCache = _getTileSelector();
  }

  _tileCache = document.querySelectorAll(_tileSelectorCache.selector);
  _tileCacheTime = now;
  return _tileCache;
}

/**
 * Invalidate tile cache - gọi sau mỗi polling cycle hoặc khi biết DOM đã thay đổi
 */
function _invalidateTileCache() {
  _tileCache = null;
  _tileCacheTime = 0;
  _tileSelectorCache = null; // Also refresh selector on next query
  // Xóa cache file_name khi tile cache refresh — đảm bảo dữ liệu luôn đồng bộ với DOM
  _fileNameCache.clear();
}

/**
 * Get tile element by ID using dynamic attribute
 * @param {string} tileId - Tile ID value
 * @returns {Element|null}
 */
function _getTileById(tileId) {
  var config = _getDynamicSelector('tile_container');
  var attribute = config?.attribute || 'data-tile-id';
  return document.querySelector(`[${attribute}="${tileId}"]`);
}

// ─── Cache extractFileName per tile ───
// Tránh query DOM 3 lần mỗi tile mỗi polling cycle. Invalidate cùng lúc với tile cache.
var _fileNameCache = new Map();

// ─── Cache detectTileStatus per tile (TTL 1.5s) ───
// Giảm 4+ DOM queries/tile/call xuống 0 khi cache còn hiệu lực
var _statusCache = new Map();

// ─── Dynamic DOM Selectors (from backend via ProviderConfigManager) ───
// Cache selectors từ chrome.storage.local, refresh từ background khi SSE push
var _selectorConfig = null;
var _selectorConfigTime = 0;
var _SELECTOR_CACHE_TTL = 30000; // 30s - shorter than storage cache

/**
 * Tier 3 fallback selectors — MUST MATCH PCM._DEFAULTS.flow
 * Used when chrome.storage (server data) unavailable.
 * CI script `check_selector_drift.js` verifies sync with backend seed.
 * Total: 22 keys (10 initial + 12 added via migrations)
 */
var _FALLBACK_SELECTORS = {
  tile_container: ['[data-tile-id]'],
  tile_image: ['img[src*="getMediaUrlRedirect"]', 'img[src*="googleusercontent.com"]'],
  tile_video: ['video[src*="getMediaUrlRedirect"]', 'video'],
  warning_icon: ['.google-symbols', 'i[class*="icon"]'],
  slate_editor: ['div[data-slate-editor="true"]', '[data-slate-node="value"]', '[role="textbox"][aria-multiline="true"]', '[contenteditable="true"]'],
  project_link: ['a[href*="/project/"]'],
  edit_link: ['a[href*="/edit/"]'],
  submit_button: ['button:has(i.google-symbols)', 'button[type="submit"]'],
  context_menu: ['[role="menu"]', '[role="menu"][data-state="open"]'],
  menu_item: ['[role="menuitem"]'],
  mode_tab_image: ['button[id$="-trigger-IMAGE"]', 'button[role="tab"][aria-controls*="IMAGE"]'],
  mode_tab_video: ['button[id$="-trigger-VIDEO"]:not([id*="VIDEO_"])', 'button[role="tab"][aria-controls*="VIDEO"]:not([aria-controls*="VIDEO_"])'],
  video_mode_frames: ['button[id$="-trigger-VIDEO_FRAMES"]', 'button[role="tab"][aria-controls*="VIDEO_FRAMES"]'],
  video_mode_ingredients: ['button[id$="-trigger-VIDEO_REFERENCES"]', 'button[role="tab"][aria-controls*="VIDEO_REFERENCES"]'],
  settings_button: ['button[aria-haspopup="menu"]', 'button[id^="radix-:"]'],
  ratio_button: ['button[id*="-trigger-PORTRAIT"]', 'button[id*="-trigger-LANDSCAPE"]', 'button[id*="-trigger-SQUARE"]', 'button[role="tab"][aria-controls*="aspect"]'],
  quantity_button: ['button[id*="-trigger-1"]', 'button[id*="-trigger-2"]', 'button[id*="-trigger-3"]', 'button[id*="-trigger-4"]', 'button[role="tab"][aria-controls*="quantity"]'],
  settings_panel_candidates: ['[role="dialog"]', '[data-radix-popper-content-wrapper]', '[role="menu"]'],
  settings_panel_marker: ['button[role="tab"][id*="-trigger-"]'],
  download_menu_trigger: ['[role="menuitem"][aria-haspopup="menu"]'],
  download_submenu: ['[role="menu"][data-state="open"]', '[data-radix-popper-content-wrapper] [role="menu"]'],
  download_submenu_item: ['[role="menuitem"]'],
};

/**
 * Get dynamic selector config for a key (flow provider only in content.js)
 * @param {string} key - Selector key (e.g. 'tile_container', 'submit_button')
 * @returns {Object|null} - Selector config {selectors: [], attribute?, text_match?, icon_text?}
 */
function _getDynamicSelector(key) {
  var now = Date.now();
  if (_selectorConfig && (now - _selectorConfigTime) < _SELECTOR_CACHE_TTL) {
    return _selectorConfig?.flow?.selectors?.[key] || null;
  }
  // Async refresh cache from storage (non-blocking)
  chrome.storage.local.get(['toby_provider_configs'], function(res) {
    if (res.toby_provider_configs?.data?.flow) {
      _selectorConfig = res.toby_provider_configs.data;
      _selectorConfigTime = Date.now();
    }
  });
  return _selectorConfig?.flow?.selectors?.[key] || null;
}

/**
 * Query element using dynamic selector with fallback chain
 * @param {string} key - Selector key
 * @param {string[]} [defaultSelectors] - Optional inline fallback (deprecated, use _FALLBACK_SELECTORS)
 * @returns {Element|null}
 */
function _queryWithFallback(key, defaultSelectors) {
  var config = _getDynamicSelector(key);
  var isDynamic = config?.selectors?.length > 0;
  // Priority: dynamic (server) > inline param > _FALLBACK_SELECTORS
  var fallback = defaultSelectors || _FALLBACK_SELECTORS[key] || [];
  var selectors = isDynamic ? config.selectors : fallback;

  // Debug log: show selector source
  console.log(`[Selector:${key}] Source: ${isDynamic ? '🌐 DYNAMIC' : '📦 FALLBACK'} | Trying ${selectors.length} selectors`);

  for (var i = 0; i < selectors.length; i++) {
    try {
      var el = document.querySelector(selectors[i]);
      if (el) {
        console.log(`[Selector:${key}] ✅ Match #${i + 1}: ${selectors[i]}`);
        return el;
      }
    } catch (e) { /* invalid selector */ }
  }
  console.log(`[Selector:${key}] ❌ No match found`);
  return null;
}

// ─── API configs (download_resolutions, ratios, error_patterns) ────────────
// Mirror ProviderConfigManager._apiConfigsCache qua chrome.storage để content.js đọc.
var _apiConfigsCacheLocal = null;
var _apiConfigsCacheLocalTime = 0;
var _API_CONFIGS_CACHE_TTL = 30000; // 30s — invalidate sớm cho SSE responsiveness

/**
 * Get api_config value (download_resolutions, ratios, error_patterns) cho 1 provider.
 * @param {string} provider — 'flow' | 'chatgpt' | 'grok' | 'gemini'
 * @param {string} key — 'download_resolutions' | 'ratios' | 'error_patterns' | ...
 * @returns {Object|null}
 */
function _getApiConfigValue(provider, key) {
  var now = Date.now();
  if (_apiConfigsCacheLocal && (now - _apiConfigsCacheLocalTime) < _API_CONFIGS_CACHE_TTL) {
    return _apiConfigsCacheLocal?.data?.[provider]?.configs?.[key] || null;
  }
  // Async refresh từ chrome.storage (non-blocking)
  chrome.storage.local.get(['toby_provider_api_configs'], function(res) {
    if (res.toby_provider_api_configs?.data) {
      _apiConfigsCacheLocal = res.toby_provider_api_configs;
      _apiConfigsCacheLocalTime = Date.now();
    }
  });
  return _apiConfigsCacheLocal?.data?.[provider]?.configs?.[key] || null;
}

// Inline fallback cho Flow download resolutions (tier 3 — match backend seed).
var _DEFAULT_FLOW_DOWNLOAD_RESOLUTIONS = {
  image: [
    { value: '1k', label: '1K (1024px)', menu_label: '1K', pixel_width: 1024 },
    { value: '2k', label: '2K (Pro)',    menu_label: '2K', pixel_width: 2048 },
    { value: '4k', label: '4K (Ultra)',  menu_label: '4K', pixel_width: 4096 },
  ],
  video: [
    { value: '720p',  label: '720p',       menu_label: '720p'  },
    { value: '1080p', label: '1080p',      menu_label: '1080p' },
    { value: '4k',    label: '4K (Ultra)', menu_label: '4K'    },
  ],
  image_fallback_chain: ['4K', '2K', '1K'],
  video_fallback_chain: ['4K', '1080p', '720p'],
};

/**
 * Get download menu_label cho 1 resolution string (vd '1k' → '1K').
 * Server-first: đọc từ provider_configs.download_resolutions, fallback tier 3 inline.
 */
function _getDownloadMenuLabel(resolution, isVideo) {
  var cfg = _getApiConfigValue('flow', 'download_resolutions') || _DEFAULT_FLOW_DOWNLOAD_RESOLUTIONS;
  var mode = isVideo ? 'video' : 'image';
  var list = Array.isArray(cfg[mode]) ? cfg[mode] : [];
  var found = list.find(function(r) { return r.value === resolution; });
  return found?.menu_label || null;
}

/**
 * Get download fallback chain (4K → 2K → 1K cho image, 4K → 1080p → 720p cho video).
 */
function _getDownloadFallbackChain(isVideo) {
  var cfg = _getApiConfigValue('flow', 'download_resolutions') || _DEFAULT_FLOW_DOWNLOAD_RESOLUTIONS;
  var key = isVideo ? 'video_fallback_chain' : 'image_fallback_chain';
  return Array.isArray(cfg[key]) && cfg[key].length ? cfg[key] : (_DEFAULT_FLOW_DOWNLOAD_RESOLUTIONS[key] || []);
}

/**
 * Get pixel_width cho image resolution (dùng cho applyResolutionToUrl).
 */
function _getDownloadPixelWidth(resolution) {
  var cfg = _getApiConfigValue('flow', 'download_resolutions') || _DEFAULT_FLOW_DOWNLOAD_RESOLUTIONS;
  var list = Array.isArray(cfg.image) ? cfg.image : [];
  var found = list.find(function(r) { return r.value === resolution; });
  return found?.pixel_width || null;
}

// ─── FloatingTracker i18n (multi-language support) ───
var _trackerLocale = 'vi';
var _trackerTranslations = {
  vi: {
    stopAll: 'Dừng tất cả',
    done: 'xong',
    retrying: 'Đang thử lại',
    paused: 'Tạm dừng',
    completed: 'Xong',
    stopped: 'Đã dừng',
    errors: 'lỗi',
    resume: 'Tiếp tục',
    pause: 'Tạm dừng',
    stop: 'Dừng',
    running: 'đang',
    idle: 'nghỉ',
    andMore: 'và {count} mục khác',
    generating: 'Đang tạo ảnh...',
    // State labels
    statePending: 'Chờ',
    stateSubmitting: 'Đang gửi',
    stateSubmitted: 'Đã gửi',
    stateMonitoring: 'Chờ kết quả',
    stateRetry: 'Thử lại',
    stateCompleted: 'Xong',
    statePartialFail: 'Một phần lỗi',
    stateFailed: 'Lỗi',
    stateCancelled: 'Hủy',
  },
  en: {
    stopAll: 'Stop all',
    done: 'done',
    retrying: 'Retrying',
    paused: 'Paused',
    completed: 'Done',
    stopped: 'Stopped',
    errors: 'errors',
    resume: 'Resume',
    pause: 'Pause',
    stop: 'Stop',
    running: 'running',
    idle: 'idle',
    andMore: 'and {count} more',
    generating: 'Generating...',
    statePending: 'Pending',
    stateSubmitting: 'Submitting',
    stateSubmitted: 'Submitted',
    stateMonitoring: 'Waiting',
    stateRetry: 'Retry',
    stateCompleted: 'Done',
    statePartialFail: 'Partial fail',
    stateFailed: 'Failed',
    stateCancelled: 'Cancelled',
  },
  th: {
    stopAll: 'หยุดทั้งหมด',
    done: 'เสร็จ',
    retrying: 'กำลังลองใหม่',
    paused: 'หยุดชั่วคราว',
    completed: 'เสร็จ',
    stopped: 'หยุดแล้ว',
    errors: 'ผิดพลาด',
    resume: 'ดำเนินการต่อ',
    pause: 'หยุดชั่วคราว',
    stop: 'หยุด',
    running: 'กำลังทำ',
    idle: 'ว่าง',
    andMore: 'และ {count} รายการเพิ่มเติม',
    generating: 'กำลังสร้าง...',
    statePending: 'รอ',
    stateSubmitting: 'กำลังส่ง',
    stateSubmitted: 'ส่งแล้ว',
    stateMonitoring: 'รอผล',
    stateRetry: 'ลองใหม่',
    stateCompleted: 'เสร็จ',
    statePartialFail: 'เสร็จบางส่วน',
    stateFailed: 'ล้มเหลว',
    stateCancelled: 'ยกเลิก',
  },
  ja: {
    stopAll: 'すべて停止',
    done: '完了',
    retrying: 'リトライ中',
    paused: '一時停止',
    completed: '完了',
    stopped: '停止',
    errors: 'エラー',
    resume: '再開',
    pause: '一時停止',
    stop: '停止',
    running: '実行中',
    idle: '待機',
    andMore: 'あと{count}件',
    generating: '生成中...',
    statePending: '待機',
    stateSubmitting: '送信中',
    stateSubmitted: '送信済み',
    stateMonitoring: '待機中',
    stateRetry: 'リトライ',
    stateCompleted: '完了',
    statePartialFail: '一部失敗',
    stateFailed: '失敗',
    stateCancelled: 'キャンセル',
  }
};

function _getTrackerT(key, params) {
  var t = _trackerTranslations[_trackerLocale] || _trackerTranslations.vi;
  var text = t[key] || _trackerTranslations.vi[key] || key;
  if (params) {
    for (var k in params) {
      text = text.replace('{' + k + '}', params[k]);
    }
  }
  return text;
}

// Listen for locale changes from sidePanel
(function() {
  try {
    chrome.storage.local.get(['af_locale'], function(result) {
      if (result.af_locale) {
        _trackerLocale = result.af_locale;
      }
    });
    chrome.storage.onChanged.addListener(function(changes, area) {
      if (area === 'local' && changes.af_locale) {
        _trackerLocale = changes.af_locale.newValue || 'vi';
        // Re-render FloatingTracker if visible
        if (FloatingTracker._el && FloatingTracker._lastData) {
          FloatingTracker.update(FloatingTracker._lastData);
        }
      }
    });
  } catch (e) {
    // Content script may not have storage access in some contexts
  }
})();

// K-2: Download counter (session-scoped)
var downloadCounter = 0;
function incrementDownloadCounter() {
  downloadCounter++;
  try {
    chrome.runtime.sendMessage({ action: 'downloadCountUpdate', count: downloadCounter }).catch(() => {});
  } catch(e) {}
}
function getDownloadCounter() {
  return downloadCounter;
}

// ─── FloatingTracker: Pipeline control panel inject vào trang Flow (góc phải) ───
var FloatingTracker = {
  _el: null,
  _hideTimer: null,
  _expandedJobs: new Set(),
  _manuallyCollapsed: new Set(),
  _tileProgressCache: {},
  _lastDataHash: null,
  _autoRefreshInterval: null,
  _AUTO_REFRESH_MS: 2000, // Re-scan tile progress mỗi 2 giây khi đang running

  // Owner colors
  _ownerColors: {
    prompts: '#3b82f6', task: '#f97316', workflow: '#a855f7',
    angles: '#ec4899', telegram: '#06b6d4'
  },

  // State badge config (dynamic labels from _getTrackerT)
  _getStateConfig: function() {
    return {
      PENDING:      { label: _getTrackerT('statePending'),      bg: 'rgba(255,255,255,0.08)',  color: 'rgba(255,255,255,0.5)' },
      SUBMITTING:   { label: _getTrackerT('stateSubmitting'),   bg: 'rgba(59,130,246,0.2)',   color: '#60a5fa' },
      SUBMITTED:    { label: _getTrackerT('stateSubmitted'),    bg: 'rgba(59,130,246,0.15)', color: '#93c5fd' },
      MONITORING:   { label: _getTrackerT('stateMonitoring'),   bg: 'rgba(168,85,247,0.2)', color: '#c084fc' },
      RETRY_SUBMIT: { label: _getTrackerT('stateRetry'),        bg: 'rgba(249,115,22,0.2)',   color: '#fb923c' },
      COMPLETED:    { label: _getTrackerT('stateCompleted'),    bg: 'rgba(34,197,94,0.2)',    color: '#4ade80' },
      PARTIAL_FAIL: { label: _getTrackerT('statePartialFail'),  bg: 'rgba(234,179,8,0.2)', color: '#facc15' },
      FAILED:       { label: _getTrackerT('stateFailed'),       bg: 'rgba(239,68,68,0.2)',    color: '#f87171' },
      CANCELLED:    { label: _getTrackerT('stateCancelled'),    bg: 'rgba(107,114,128,0.2)',  color: '#9ca3af' },
    };
  },

  _formatTime(ms) {
    if (!ms || ms < 0) return '00:00';
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  },

  _escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _create() {
    // Guard: check both ref AND DOM (content.js có thể bị inject lại khi SPA navigate)
    if (this._el && document.body.contains(this._el)) return;

    // Remove any orphaned element from previous injection
    var existing = document.getElementById('tobyflow-flow-tracker');
    if (existing) existing.remove();
    this._el = null;

    var el = document.createElement('div');
    el.id = 'tobyflow-flow-tracker';
    el.style.cssText = 'position:fixed;bottom:16px;right:16px;width:340px;background:rgba(18,18,22,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#fff;display:none;overflow:hidden;';

    // Header - Solid green background
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:6px;padding:8px 12px;background:#1fbd53;border-bottom:1px solid rgba(255,255,255,0.15);';
    header.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' +
      '<span style="flex:1;font-weight:600;font-size:12px;">Pipeline</span>' +
      '<span class="tobyflow-ft-counter" style="font-size:11px;opacity:0.7;font-variant-numeric:tabular-nums;"></span>' +
      '<span class="tobyflow-ft-elapsed" style="font-size:10px;opacity:0.5;font-variant-numeric:tabular-nums;"></span>' +
      '<button class="tobyflow-ft-stop-all" title="' + _getTrackerT('stopAll') + '" style="width:22px;height:22px;background:rgba(239,68,68,0.2);border:none;border-radius:5px;color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>' +
      '</button>';
    el.appendChild(header);

    var self = this;
    header.querySelector('.tobyflow-ft-stop-all').addEventListener('click', function() {
      self._sendAction('pq:stopAll');
    });

    // Progress bar (GPU-accelerated với transform: scaleX)
    var progress = document.createElement('div');
    progress.style.cssText = 'height:3px;background:rgba(255,255,255,0.08);overflow:hidden;';
    progress.innerHTML = '<div class="tobyflow-ft-progress-fill" style="height:100%;width:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa,#a78bfa);transform:scaleX(0);transform-origin:left;transition:transform 0.3s ease-out;will-change:transform;"></div>';
    el.appendChild(progress);

    // CSS animations (inject once)
    if (!document.getElementById('tobyflow-ft-animations')) {
      var style = document.createElement('style');
      style.id = 'tobyflow-ft-animations';
      style.textContent = '@keyframes tobyflow-pulse{0%,100%{opacity:1}50%{opacity:0.6}}' +
        '@keyframes tobyflow-progress-glow{0%,100%{opacity:0.5}50%{opacity:1}}' +
        '.tobyflow-ft-progress-fill.active{animation:tobyflow-progress-glow 1.5s ease-in-out infinite}' +
        '.tobyflow-ft-dot-pulse{animation:tobyflow-pulse 1.5s ease-in-out infinite}';
      document.head.appendChild(style);
    }

    // Pipeline status row
    var pipelineRow = document.createElement('div');
    pipelineRow.className = 'tobyflow-ft-pipeline';
    pipelineRow.style.cssText = 'display:none;padding:4px 12px;font-size:10px;color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.06);font-variant-numeric:tabular-nums;';
    el.appendChild(pipelineRow);

    // Jobs container
    var jobsWrap = document.createElement('div');
    jobsWrap.className = 'tobyflow-ft-jobs';
    jobsWrap.style.cssText = 'max-height:320px;overflow-y:auto;overflow-x:hidden;';
    el.appendChild(jobsWrap);

    document.body.appendChild(el);
    this._el = el;

    // Event delegation: 1 listener duy nhất trên container thay vì N listeners mỗi lần render
    this._setupJobsDelegation(jobsWrap);
  },

  /**
   * Thiết lập event delegation trên container .tobyflow-ft-jobs.
   * Chỉ gọi 1 lần trong _create(), không gọi lại mỗi lần render.
   * Delegate click dựa vào data-action (stop/pause/resume) và data-job-toggle (expand/collapse).
   */
  _setupJobsDelegation(container) {
    var self = this;
    container.addEventListener('click', function(e) {
      // Ưu tiên xử lý action buttons (stop/pause/resume)
      var actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        e.stopPropagation();
        var action = actionEl.getAttribute('data-action');
        var jobId = actionEl.getAttribute('data-job-id');
        if (action === 'stop') self._sendAction('pq:stopJob', { jobId: jobId });
        else if (action === 'pause') self._sendAction('pq:pauseJob', { jobId: jobId });
        else if (action === 'resume') self._sendAction('pq:resumeJob', { jobId: jobId });
        return;
      }

      // Toggle expand/collapse job
      var headerEl = e.target.closest('[data-job-toggle]');
      if (headerEl) {
        var toggleJobId = headerEl.getAttribute('data-job-toggle');
        if (self._expandedJobs.has(toggleJobId)) {
          self._expandedJobs.delete(toggleJobId);
          self._manuallyCollapsed.add(toggleJobId);
        } else {
          self._expandedJobs.add(toggleJobId);
          self._manuallyCollapsed.delete(toggleJobId);
        }
        // Re-render ngay với dữ liệu hiện tại
        if (self._lastData) self._renderJobs(self._lastData.jobs || []);
      }
    });
  },

  update(data) {
    this._create();
    if (!data) return;

    clearTimeout(this._hideTimer);
    var el = this._el;
    var completed = data.completed || 0;
    var total = data.total || 0;
    var isRunning = data.isRunning;
    var jobs = data.jobs || [];

    // Completion / hide
    if (!isRunning || total === 0) {
      this._stopAutoRefresh(); // Dừng auto-refresh khi không còn running
      if (completed > 0) {
        el.style.display = 'block';
        el.querySelector('.tobyflow-ft-counter').textContent = completed + '/' + total + ' ' + _getTrackerT('done');
        var progressFill = el.querySelector('.tobyflow-ft-progress-fill');
        progressFill.style.transform = 'scaleX(1)';
        progressFill.classList.remove('active');
        el.querySelector('.tobyflow-ft-elapsed').textContent = '';
        // Ẩn stop button và pipeline row khi đã xong
        var stopBtn = el.querySelector('.tobyflow-ft-stop-all');
        if (stopBtn) stopBtn.style.display = 'none';
        var pRow = el.querySelector('.tobyflow-ft-pipeline');
        if (pRow) pRow.style.display = 'none';
        el.querySelector('.tobyflow-ft-jobs').innerHTML = '';
        this._hideTimer = setTimeout(function() { FloatingTracker.hide(); }, 3000);
      } else {
        this.hide();
      }
      return;
    }

    el.style.display = 'block';

    // Hiện stop button khi đang chạy
    var stopBtn = el.querySelector('.tobyflow-ft-stop-all');
    if (stopBtn) stopBtn.style.display = '';

    // Header counter & elapsed
    var pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    el.querySelector('.tobyflow-ft-counter').textContent = completed + '/' + total;
    var progressFill = el.querySelector('.tobyflow-ft-progress-fill');
    progressFill.style.transform = 'scaleX(' + (pct / 100) + ')';
    progressFill.classList.add('active'); // Enable glow animation
    el.querySelector('.tobyflow-ft-elapsed').textContent = this._formatTime(data.elapsed);

    // Pipeline status row
    this._renderPipelineRow(data.pipeline);

    // Scan tile progress % từ DOM cho items đang MONITORING
    this._scanTileProgress(jobs);

    // Jobs
    this._renderJobs(jobs);

    // Start auto-refresh cho legacy mode (re-scan tile progress định kỳ)
    this._startAutoRefresh();
  },

  // Bắt đầu auto-refresh interval để re-scan tile progress (legacy mode)
  _startAutoRefresh() {
    if (this._autoRefreshInterval) return; // Đã chạy rồi
    var self = this;
    this._autoRefreshInterval = setInterval(function() {
      // Chỉ re-scan nếu có lastData và đang running
      if (!self._lastData || !self._lastData.isRunning) {
        self._stopAutoRefresh();
        return;
      }
      // Re-scan tile progress và re-render jobs
      var jobs = self._lastData.jobs || [];
      self._scanTileProgress(jobs);
      self._renderJobs(jobs);
    }, this._AUTO_REFRESH_MS);
  },

  // Dừng auto-refresh interval
  _stopAutoRefresh() {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
      this._autoRefreshInterval = null;
    }
  },

  // Đọc % tiến độ từ DOM tile cho items đang MONITORING
  _scanTileProgress(jobs) {
    var cache = {};
    if (!jobs) { this._tileProgressCache = cache; return; }

    try {
      // Thu thập items đang MONITORING và tập hợp preTileIds để chỉ scan tiles cần thiết
      var monitoringItems = [];
      var allPreTileIds = new Set();
      var isLegacyMode = false;
      for (var i = 0; i < jobs.length; i++) {
        var j = jobs[i];
        // Detect legacy mode: job ID starts with _legacy_
        if (j.id && typeof j.id === 'string' && j.id.startsWith('_legacy_')) {
          isLegacyMode = true;
        }
        if (!j.items) continue;
        for (var k = 0; k < j.items.length; k++) {
          var it = j.items[k];
          if (it.state !== 'MONITORING' || !it.preTileIds) continue;
          monitoringItems.push(it);
          for (var pi = 0; pi < it.preTileIds.length; pi++) {
            allPreTileIds.add(it.preTileIds[pi]);
          }
        }
      }

      // Dùng tile cache (250ms TTL) thay vì query DOM trực tiếp
      var allTiles = _getCachedTiles();

      // Legacy mode fallback: không có MONITORING items, scan tiles đang processing trực tiếp
      if (monitoringItems.length === 0 && isLegacyMode) {
        var maxProgress = null;
        for (var lt = 0; lt < allTiles.length; lt++) {
          var ltEl = allTiles[lt];
          var ltStatus = typeof detectTileStatus === 'function' ? detectTileStatus(ltEl) : null;
          // Chỉ scan tiles đang processing
          if (ltStatus !== 'processing') continue;
          var ltPct = typeof extractTileProgress === 'function' ? extractTileProgress(ltEl) : null;
          if (ltPct !== null && (maxProgress === null || ltPct > maxProgress)) {
            maxProgress = ltPct;
          }
        }
        // Lưu với key đặc biệt cho legacy mode
        if (maxProgress !== null) {
          cache._legacy = maxProgress;
        }
        this._tileProgressCache = cache;
        return;
      }

      if (monitoringItems.length === 0) { this._tileProgressCache = cache; return; }

      // Chỉ scan tiles MỚI (không nằm trong preTileIds) — đây là tiles đang generate
      var tilesWithProgress = [];
      for (var t = 0; t < allTiles.length; t++) {
        var tileEl = allTiles[t];
        var tid = tileEl.getAttribute('data-tile-id');
        if (!tid || allPreTileIds.has(tid)) continue; // Bỏ qua tiles cũ

        var pct = typeof extractTileProgress === 'function' ? extractTileProgress(tileEl) : null;
        if (pct !== null) {
          tilesWithProgress.push({ tileId: tid, progress: pct });
        }
      }

      if (tilesWithProgress.length === 0) { this._tileProgressCache = cache; return; }

      // Map tiles có progress vào MONITORING items qua preTileIds exclusion
      for (var mi = 0; mi < monitoringItems.length; mi++) {
        var mit = monitoringItems[mi];
        var preTileSet = new Set(mit.preTileIds);
        var bestProgress = null;

        for (var p = 0; p < tilesWithProgress.length; p++) {
          var pt = tilesWithProgress[p];
          if (preTileSet.has(pt.tileId)) continue; // Tile cũ (trước khi submit)
          if (bestProgress === null || pt.progress > bestProgress) {
            bestProgress = pt.progress;
          }
        }
        if (bestProgress !== null) cache[mit.id] = bestProgress;
      }
    } catch (e) {
      // Không block render nếu scan lỗi
    }
    this._tileProgressCache = cache;
  },

  _renderPipelineRow(pipeline) {
    var row = this._el.querySelector('.tobyflow-ft-pipeline');
    if (!pipeline) { row.style.display = 'none'; return; }

    var parts = [];
    var ed = pipeline.editor;
    if (ed) {
      var edState = ed.state === 'submitting' ? _getTrackerT('running') : (ed.state === 'idle' ? _getTrackerT('idle') : ed.state);
      parts.push('E:' + edState + (ed.processedCount > 0 ? '(' + ed.processedCount + ')' : ''));
    }
    var tm = pipeline.tileMonitor;
    if (tm) {
      parts.push('T:' + (tm.activeCount || 0) + '\u0111/' + (tm.completedCount || 0) + '\u2713/' + (tm.failedCount || 0) + '\u2717');
    }
    var dl = pipeline.download;
    if (dl) {
      var dlState = dl.state === 'downloading' ? _getTrackerT('running') : _getTrackerT('idle');
      parts.push('D:' + dlState + (dl.completedCount > 0 ? '(' + dl.completedCount + ')' : '') + (dl.queueLength > 0 ? '+' + dl.queueLength : ''));
    }

    if (parts.length > 0) {
      row.style.display = 'block';
      row.textContent = parts.join(' \u2022 ');
    } else {
      row.style.display = 'none';
    }
  },

  _renderJobs(jobs) {
    var jobsEl = this._el.querySelector('.tobyflow-ft-jobs');
    if (!jobs || jobs.length === 0) { jobsEl.innerHTML = ''; return; }

    var self = this;
    var now = Date.now();
    var html = '';

    for (var i = 0; i < jobs.length; i++) {
      var j = jobs[i];
      var color = self._ownerColors[j.owner] || '#6b7280';
      var isDone = j.status === 'completed' || j.status === 'stopped';
      var isPaused = j.status === 'paused';
      var isActive = j.status === 'running' || isPaused;
      var jobPct = j.total > 0 ? Math.round((j.completed / j.total) * 100) : 0;
      var jobElapsed = j.startedAt ? self._formatTime(now - j.startedAt) : '';

      // Auto-expand active jobs, auto-collapse done jobs
      if (isActive && !self._manuallyCollapsed.has(j.id)) {
        self._expandedJobs.add(j.id);
      } else if (isDone) {
        self._expandedJobs.delete(j.id);
        self._manuallyCollapsed.delete(j.id);
      }
      var isExpanded = self._expandedJobs.has(j.id);

      // Check if any items are in RETRY_SUBMIT state
      var hasRetrying = isActive && j.items && j.items.some(function(it) { return it.state === 'RETRY_SUBMIT'; });

      // Status badge
      var statusBadge = '';
      if (hasRetrying) {
        statusBadge = '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(249,115,22,0.2);color:#fb923c;">' + _getTrackerT('retrying') + '</span>';
      } else if (isPaused) {
        statusBadge = '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(245,158,11,0.2);color:#fbbf24;">' + _getTrackerT('paused') + '</span>';
      } else if (isDone) {
        var doneColor = j.status === 'completed' ? '#4ade80' : '#f87171';
        var doneBg = j.status === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
        var doneLabel = j.status === 'completed' ? _getTrackerT('completed') : _getTrackerT('stopped');
        statusBadge = '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:' + doneBg + ';color:' + doneColor + ';">' + doneLabel + '</span>';
      }

      // Failed count badge
      var failBadge = '';
      if (j.failed > 0) {
        failBadge = '<span style="font-size:9px;padding:1px 4px;border-radius:3px;background:rgba(239,68,68,0.2);color:#f87171;margin-left:2px;">' + j.failed + ' ' + _getTrackerT('errors') + '</span>';
      }

      // Action buttons (only for active jobs)
      var actions = '';
      if (isActive) {
        // Pause/Resume button (only for prompts owner)
        if (j.owner === 'prompts') {
          if (isPaused) {
            actions += '<button data-action="resume" data-job-id="' + j.id + '" title="' + _getTrackerT('resume') + '" style="width:20px;height:20px;background:rgba(34,197,94,0.2);border:none;border-radius:4px;color:#4ade80;cursor:pointer;display:flex;align-items:center;justify-content:center;">' +
              '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,6 18,12 8,18"/></svg></button>';
          } else {
            actions += '<button data-action="pause" data-job-id="' + j.id + '" title="' + _getTrackerT('pause') + '" style="width:20px;height:20px;background:rgba(255,255,255,0.08);border:none;border-radius:4px;color:rgba(255,255,255,0.6);cursor:pointer;display:flex;align-items:center;justify-content:center;">' +
              '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="6" width="3" height="12" rx="1"/><rect x="14" y="6" width="3" height="12" rx="1"/></svg></button>';
          }
        }
        // Stop button
        actions += '<button data-action="stop" data-job-id="' + j.id + '" title="' + _getTrackerT('stop') + '" style="width:20px;height:20px;background:rgba(239,68,68,0.15);border:none;border-radius:4px;color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center;">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="1"/></svg></button>';
      }

      // Opacity for done jobs
      var jobOpacity = isDone ? 'opacity:0.5;' : '';

      html += '<div style="padding:4px 12px;border-bottom:1px solid rgba(255,255,255,0.05);' + jobOpacity + '">';
      // Job header row
      html += '<div class="tobyflow-ft-job-header" data-job-toggle="' + j.id + '" style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:3px 0;">';
      html += '<span class="' + (isActive && !isPaused ? 'tobyflow-ft-dot-pulse' : '') + '" style="width:8px;height:8px;border-radius:50%;background:' + color + ';flex-shrink:0;"></span>';
      html += '<span style="flex:1;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">' + self._escHtml(j.label || j.owner) + '</span>';
      html += statusBadge + failBadge;
      html += '<span style="font-size:10px;opacity:0.5;font-variant-numeric:tabular-nums;flex-shrink:0;">' + jobElapsed + '</span>';
      html += '<span style="font-size:10px;opacity:0.6;font-variant-numeric:tabular-nums;flex-shrink:0;">' + jobPct + '%</span>';
      html += '<div style="display:flex;gap:2px;flex-shrink:0;">' + actions + '</div>';
      // Expand chevron
      html += '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;transition:transform 0.2s;' + (isExpanded ? 'transform:rotate(180deg);' : '') + '"><polyline points="6 9 12 15 18 9"/></svg>';
      html += '</div>';

      // Job progress bar (GPU-accelerated)
      html += '<div style="height:2px;background:rgba(255,255,255,0.08);border-radius:1px;margin:3px 0;overflow:hidden;">';
      html += '<div style="height:100%;width:100%;background:' + color + ';border-radius:1px;transform:scaleX(' + (jobPct / 100) + ');transform-origin:left;transition:transform 0.3s ease-out;will-change:transform;"></div>';
      html += '</div>';

      // Items (expandable)
      if (isExpanded && j.items && j.items.length > 0) {
        html += '<div style="padding:0px;margin-left:4px;">';
        var displayItems = j.items.slice(-12);
        for (var k = 0; k < displayItems.length; k++) {
          var it = displayItems[k];
          var stateConfig = self._getStateConfig();
          var sc = stateConfig[it.state] || stateConfig.PENDING;
          var promptShort = it.promptText ? (it.promptText.length > 50 ? it.promptText.substring(0, 50) + '...' : it.promptText) : '';

          // Time info: duration from submit to complete
          var timeInfo = '';
          if (it.completedAt && it.submittedAt) {
            timeInfo = self._formatTime(it.completedAt - it.submittedAt);
          } else if (it.submittedAt) {
            timeInfo = self._formatTime(now - it.submittedAt);
          }

          // Retry badge
          var retryBadge = '';
          if (it.retryCount > 0) {
            retryBadge = '<span style="font-size:8px;padding:0 3px;border-radius:2px;background:rgba(249,115,22,0.2);color:#fb923c;">x' + it.retryCount + '</span>';
          }

          // Tile progress % cho items đang MONITORING
          var tileProgress = (it.state === 'MONITORING' && self._tileProgressCache[it.id] != null) ? self._tileProgressCache[it.id] : null;

          // Active item highlight
          var itemBg = (it.state === 'SUBMITTING' || it.state === 'MONITORING') ? 'background:rgba(255,255,255,0.03);border-radius:4px;' : '';

          html += '<div style="display:flex;align-items:center;gap:5px;padding:4px 4px;font-size:11px;' + itemBg + '">';
          html += '<span style="color:rgba(255,255,255,0.4);font-size:10px;width:18px;flex-shrink:0;font-variant-numeric:tabular-nums;">#' + ((it.promptIndex || 0) + 1) + '</span>';
          html += '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,0.7);" title="' + self._escHtml(it.promptText || '') + '">' + self._escHtml(promptShort) + '</span>';
          html += retryBadge;
          if (timeInfo) {
            html += '<span style="font-size:9px;opacity:0.4;font-variant-numeric:tabular-nums;flex-shrink:0;">' + timeInfo + '</span>';
          }
          // State badge: hiện % nếu đang monitoring và có progress
          if (tileProgress !== null) {
            html += '<span style="font-size:9px;padding:1px 4px;border-radius:3px;background:rgba(168,85,247,0.25);color:#c084fc;flex-shrink:0;white-space:nowrap;font-variant-numeric:tabular-nums;">' + tileProgress + '%</span>';
          } else {
            html += '<span style="font-size:9px;padding:1px 4px;border-radius:3px;background:' + sc.bg + ';color:' + sc.color + ';flex-shrink:0;white-space:nowrap;">' + sc.label + '</span>';
          }
          html += '</div>';
        }
        if (j.items.length > 12) {
          html += '<div style="font-size:10px;opacity:0.4;padding:2px 4px;">... ' + _getTrackerT('andMore', { count: j.items.length - 12 }) + '</div>';
        }
        html += '</div>';
      }
      // Legacy mode: hiển thị tile progress % khi không có items nhưng có progress từ DOM
      else if (isExpanded && j.id && typeof j.id === 'string' && j.id.startsWith('_legacy_') && isActive) {
        var legacyProgress = self._tileProgressCache._legacy;
        if (legacyProgress !== null && typeof legacyProgress === 'number') {
          html += '<div style="padding:6px 4px;margin-left:4px;">';
          html += '<div style="display:flex;align-items:center;gap:8px;font-size:11px;background:rgba(255,255,255,0.03);border-radius:4px;padding:6px 8px;">';
          html += '<span style="color:rgba(255,255,255,0.5);">' + _getTrackerT('generating') + '</span>';
          html += '<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(168,85,247,0.25);color:#c084fc;font-variant-numeric:tabular-nums;font-weight:500;">' + legacyProgress + '%</span>';
          html += '</div>';
          html += '</div>';
        }
      }

      html += '</div>';
    }

    jobsEl.innerHTML = html;
    // Event listeners được xử lý bởi _setupJobsDelegation() (gọi 1 lần trong _create())
    // Không cần bind lại mỗi lần render vì dùng event delegation trên container
  },

  /**
   * Legacy mode: cập nhật FloatingTracker cho execution KHÔNG dùng Pipeline Queue
   * Chuyển đổi dữ liệu single-owner thành format multi-job tương thích update()
   */
  updateLegacy(data) {
    if (!data) return;
    this._legacyData = data;
    var isActive = data.status === 'running' || data.status === 'paused';
    this.update({
      isRunning: isActive,
      completed: data.current || 0,
      total: data.total || 0,
      elapsed: data.startedAt ? Date.now() - data.startedAt : 0,
      pipeline: null,
      jobs: [{
        id: '_legacy_' + (data.owner || 'prompts'),
        owner: data.owner || 'prompts',
        label: data.label || data.owner || 'Auto Gen',
        status: data.status || 'running',
        completed: data.current || 0,
        failed: data.failed || 0,
        total: data.total || 0,
        startedAt: data.startedAt,
        items: data.items || []
      }]
    });
  },

  _sendAction(action, data) {
    // Legacy mode: xử lý trực tiếp trong content.js (không cần relay qua sidePanel)
    if (data && data.jobId && typeof data.jobId === 'string' && data.jobId.startsWith('_legacy_')) {
      if (action === 'pq:stopJob' || action === 'pq:stopAll') {
        shouldStop = true;
        isPaused = false;
        if (this._legacyData) {
          this._legacyData.status = 'stopped';
          this.updateLegacy(this._legacyData);
        }
        return;
      }
      if (action === 'pq:pauseJob') {
        isPaused = true;
        if (this._legacyData) {
          this._legacyData.status = 'paused';
          this.updateLegacy(this._legacyData);
        }
        return;
      }
      if (action === 'pq:resumeJob') {
        isPaused = false;
        if (this._legacyData) {
          this._legacyData.status = 'running';
          this.updateLegacy(this._legacyData);
        }
        return;
      }
    }
    // Pipeline mode: stop all legacy too
    if (action === 'pq:stopAll' && isRunning) {
      shouldStop = true;
      isPaused = false;
    }
    // Pipeline mode: relay qua sidePanel
    chrome.runtime.sendMessage(Object.assign({ action: action }, data || {})).catch(function(err) {
      console.warn('[FloatingTracker] Action failed:', action, err.message);
    });
  },

  hide() {
    this._stopAutoRefresh();
    if (this._el) {
      this._el.style.display = 'none';
    }
    this._lastData = null;
    this._legacyData = null;
    this._expandedJobs.clear();
    this._manuallyCollapsed.clear();
    this._tileProgressCache = {};
  }
};

// Wrap update to cache last data for re-render
var _origUpdate = FloatingTracker.update;
FloatingTracker.update = function(data) {
  this._lastData = data;
  _origUpdate.call(this, data);
};

// ─── ExecutionBlocker: Border glow overlay khi extension thao tác (block click, không che Flow) ───
var ExecutionBlocker = {
  _el: null,
  _styleEl: null,
  _blocking: false,
  _timeoutId: null,
  _sanityIntervalId: null,
  _escapeCount: 0,
  _escapeTimer: null,
  _MAX_BLOCK_TIME: 5 * 60 * 1000, // 5 phút auto-timeout
  _SANITY_CHECK_INTERVAL: 30 * 1000, // 30 giây check 1 lần

  // Block tất cả events ở capture phase (triệt để hơn pointer-events)
  _blockEvent(e) {
    if (!ExecutionBlocker._blocking) return;

    // Cho phép programmatic events (từ extension) đi qua
    // isTrusted = true: event từ user action
    // isTrusted = false: event từ script (dispatchEvent, click(), etc.)
    if (!e.isTrusted) return;

    // Cho phép events trên FloatingTracker đi qua (pipeline control panel)
    if (e.target && e.target.closest && e.target.closest('#tobyflow-flow-tracker')) return;

    // Escape hatch: nhấn Escape 3 lần liên tiếp trong 2 giây để force hide
    if (e.type === 'keydown' && e.key === 'Escape') {
      ExecutionBlocker._escapeCount++;
      clearTimeout(ExecutionBlocker._escapeTimer);
      ExecutionBlocker._escapeTimer = setTimeout(function() {
        ExecutionBlocker._escapeCount = 0;
      }, 2000);

      if (ExecutionBlocker._escapeCount >= 3) {
        console.warn('[ExecutionBlocker] Force hide via Escape x3');
        ExecutionBlocker._escapeCount = 0;
        ExecutionBlocker.hide();
        // Cũng reset execution state
        if (typeof isRunning !== 'undefined') isRunning = false;
        if (typeof isPaused !== 'undefined') isPaused = false;
        if (typeof shouldStop !== 'undefined') shouldStop = true;
        return; // Cho phép Escape cuối cùng đi qua
      }
    }

    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
  },

  _injectStyles() {
    if (this._styleEl) return;
    var style = document.createElement('style');
    style.id = 'tobyflow-execution-blocker-styles';
    // Performance optimized: dùng opacity animation thay vì box-shadow (GPU-accelerated)
    style.textContent = `
      @keyframes tobyflow-glow-pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.7; }
      }

      @keyframes tobyflow-glow-paused {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.5; }
      }

      #tobyflow-execution-blocker {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        pointer-events: all;
        cursor: not-allowed;
        background: transparent;
      }

      /* Glow border via pseudo-element (GPU layer với will-change) */
      /* Multi-layer box-shadow simulate blur effect mà không dùng filter:blur (nhẹ hơn) */
      #tobyflow-execution-blocker::before {
        content: '';
        position: absolute;
        inset: 0;
        border: 3px solid #cdff01;
        box-shadow:
          inset 0 0 0 2px rgba(205,255,1,0.5),
          inset 0 0 8px rgba(205,255,1,0.3),
          0 0 8px rgba(205,255,1,0.4),
          0 0 20px rgba(205,255,1,0.25),
          0 0 40px rgba(205,255,1,0.15);
        animation: tobyflow-glow-pulse 1.8s ease-in-out infinite;
        will-change: opacity;
        pointer-events: none;
      }

      /* Paused state - slower animation, yellow tint */
      #tobyflow-execution-blocker.tobyflow-paused::before {
        border-color: #facc15;
        box-shadow:
          inset 0 0 0 2px rgba(250,204,21,0.45),
          inset 0 0 6px rgba(250,204,21,0.25),
          0 0 6px rgba(250,204,21,0.35),
          0 0 15px rgba(250,204,21,0.2),
          0 0 30px rgba(250,204,21,0.1);
        animation: tobyflow-glow-paused 3s ease-in-out infinite;
      }

      /* Force Flow context menus (Radix UI) unclickable when blocker active */
      body.tobyflow-execution-blocking [data-radix-popper-content-wrapper],
      body.tobyflow-execution-blocking [role="menu"][data-state="open"] {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    this._styleEl = style;
  },

  _attachBlockers() {
    if (this._blocking) return;
    this._blocking = true;
    // Block tất cả mouse events ở capture phase
    var events = ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'wheel', 'touchstart', 'touchend', 'touchmove', 'keydown', 'keyup', 'keypress'];
    events.forEach(function(evt) {
      document.addEventListener(evt, ExecutionBlocker._blockEvent, { capture: true, passive: false });
    });
    // CSS class: force Radix menus pointer-events:none (chặn user click vào context menu)
    document.body.classList.add('tobyflow-execution-blocking');
  },

  _detachBlockers() {
    if (!this._blocking) return;
    this._blocking = false;
    var events = ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'wheel', 'touchstart', 'touchend', 'touchmove', 'keydown', 'keyup', 'keypress'];
    events.forEach(function(evt) {
      document.removeEventListener(evt, ExecutionBlocker._blockEvent, { capture: true });
    });
    document.body.classList.remove('tobyflow-execution-blocking');
  },

  // Sanity check: nếu isRunning = false mà blocker vẫn hiện → hide
  _startSanityCheck() {
    var self = this;
    this._sanityIntervalId = setInterval(function() {
      if (typeof isRunning !== 'undefined' && !isRunning) {
        console.log('[ExecutionBlocker] Sanity check: isRunning=false, auto-hiding');
        self.hide();
      }
    }, this._SANITY_CHECK_INTERVAL);
  },

  _stopSanityCheck() {
    if (this._sanityIntervalId) {
      clearInterval(this._sanityIntervalId);
      this._sanityIntervalId = null;
    }
  },

  // Auto-timeout: tự hide sau _MAX_BLOCK_TIME
  _startTimeout() {
    var self = this;
    this._timeoutId = setTimeout(function() {
      console.warn('[ExecutionBlocker] Auto-timeout after ' + (self._MAX_BLOCK_TIME / 1000) + 's, force hiding');
      self.hide();
      // Reset execution state để tránh stuck
      if (typeof isRunning !== 'undefined') isRunning = false;
      if (typeof isPaused !== 'undefined') isPaused = false;
      if (typeof shouldStop !== 'undefined') shouldStop = true;
    }, this._MAX_BLOCK_TIME);
  },

  _stopTimeout() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  },

  // Visibility change: nếu tab ẩn quá 2 phút, cleanup
  _onVisibilityChange() {
    if (document.hidden && ExecutionBlocker._blocking) {
      // Tab bị ẩn, set timer để cleanup sau 2 phút
      ExecutionBlocker._visibilityTimeoutId = setTimeout(function() {
        if (document.hidden && ExecutionBlocker._blocking) {
          console.warn('[ExecutionBlocker] Tab hidden too long, auto-hiding + resetting state');
          ExecutionBlocker.hide();
          // Reset execution state để tránh stuck
          if (typeof isRunning !== 'undefined') isRunning = false;
          if (typeof isPaused !== 'undefined') isPaused = false;
          if (typeof shouldStop !== 'undefined') shouldStop = true;
        }
      }, 2 * 60 * 1000);
    } else {
      // Tab visible lại, cancel timer
      if (ExecutionBlocker._visibilityTimeoutId) {
        clearTimeout(ExecutionBlocker._visibilityTimeoutId);
        ExecutionBlocker._visibilityTimeoutId = null;
      }
    }
  },

  show(options) {
    options = options || {};
    this._injectStyles();

    // Chỉ start timers nếu chưa blocking (tránh restart timeout liên tục)
    var wasBlocking = this._blocking;
    this._attachBlockers();

    if (!wasBlocking) {
      this._startTimeout();
      this._startSanityCheck();
      // Listen visibility change
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    if (this._el) {
      this._el.style.display = 'block';
      return;
    }

    var el = document.createElement('div');
    el.id = 'tobyflow-execution-blocker';
    document.body.appendChild(el);
    this._el = el;
  },

  // Pause state - chuyển màu vàng, animation chậm hơn
  setPaused(paused) {
    if (!this._el) return;
    if (paused) {
      this._el.classList.add('tobyflow-paused');
    } else {
      this._el.classList.remove('tobyflow-paused');
    }
  },

  // update() - simplified, chỉ sync paused state
  // Giữ method để callers không bị crash
  update(options) {
    // No modal to update - border glow animation là đủ
    // Auto-sync với global isPaused
    if (typeof isPaused !== 'undefined') {
      this.setPaused(isPaused);
    }
  },

  hide() {
    this._detachBlockers();
    this._stopTimeout();
    this._stopSanityCheck();
    this._escapeCount = 0;
    clearTimeout(this._escapeTimer);
    clearTimeout(this._visibilityTimeoutId);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);

    if (this._el) {
      this._el.style.display = 'none';
      this._el.classList.remove('tobyflow-paused');
    }
  },

  isVisible() {
    return this._el && this._el.style.display !== 'none';
  }
};

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Helpers
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Increment daily stat counter (persist to chrome.storage for settings-popup display)
// Serialize qua promise chain để tránh race condition khi multiple increments
// fire concurrent — chrome.storage.local.get/set KHÔNG atomic, race window khiến counter mất count.
var _statQueue = Promise.resolve();
function _incrementDailyStat(key) {
  _statQueue = _statQueue.then(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const currentUserId = window.authManager?.user?.id || null;
    const res = await new Promise(resolve => chrome.storage.local.get(['af_daily_stats'], resolve));
    const stats = res.af_daily_stats || {};
    // Reset if new day OR different user
    if (stats._date !== today || stats._user_id !== currentUserId) {
      stats._date = today;
      stats._user_id = currentUserId;
      // Provider-specific prompts
      stats.flow_prompt_total = 0;
      stats.chatgpt_prompt_total = 0;
      stats.gemini_prompt_total = 0;
      stats.grok_prompt_total = 0;
      // Provider-specific failures
      stats.flow_fail = 0;
      stats.chatgpt_fail = 0;
      stats.gemini_fail = 0;
      stats.grok_fail = 0;
      // Common stats
      stats.task_run = 0;
      stats.workflow_run = 0;
      stats.angles_run = 0;
      // FAR-1 telemetry — refresh success/fail counters
      stats.flow_refresh_success = 0;
      stats.flow_refresh_fail = 0;
    }
    stats[key] = (stats[key] || 0) + 1;
    await new Promise(resolve => chrome.storage.local.set({ af_daily_stats: stats }, resolve));
  }).catch(err => {
    console.warn('[content.js] _incrementDailyStat error:', err.message);
  });
}

function getInputTimeoutMs() {
  // [Fix] Priority: 1. Payload cache (runtime) → 2. Storage cache → 3. Default
  if (typeof _cachedInputTimeoutMs === 'number' && _cachedInputTimeoutMs > 0) {
    return _cachedInputTimeoutMs;
  }
  // Fallback: dùng cached settings từ chrome.storage
  return window._afSettings?.inputTimeout || 1200;
}

// Derived delays từ inputTimeout — không cần settings riêng
function getClearEditorDelay() {
  return Math.round(getInputTimeoutMs() * 0.4); // ~500ms khi 1200
}

function getSubmitDelay() {
  return Math.round(getInputTimeoutMs() * 0.5); // ~600ms khi 1200
}

function getAfterSubmitDelay() {
  return Math.round(getInputTimeoutMs() * 0.8); // ~960ms khi 1200
}

function getSettingsStepDelay() {
  return Math.round(getInputTimeoutMs() * 0.3); // ~360ms khi 1200 — delay giữa các bước trong settings panel
}

function getDelayBetweenPromptsMs() {
  // [Fix] Priority: 1. Payload cache (runtime) → 2. Storage cache → 3. Default
  if (typeof _cachedDelayBetweenMs === 'number' && _cachedDelayBetweenMs > 0) {
    return _cachedDelayBetweenMs;
  }
  // Fallback: dùng cached settings từ chrome.storage
  const seconds = window._afSettings?.delayBetweenPrompts || 5;
  return seconds * 1000;
}

function getRandomDelay() {
  // [Fix] Dùng cached settings từ chrome.storage thay vì đọc DOM
  const min = (window._afSettings?.randomDelayMin || 3) * 1000;
  const max = (window._afSettings?.randomDelayMax || 10) * 1000;
  return min + Math.random() * (max - min);
}

// ─── Selector logging ─────────────────────────────────────────
// Production: silent. Bật khi debug bằng cách set `window._afDebug = true` trong DevTools.
// Lý do: log có thể spam khi gen call dày → noise. Dev-mode opt-in là balance hợp lý.
function _isLogSelectorsEnabled() {
  return !!(typeof window !== 'undefined' && window._afDebug);
}

/**
 * Log unified format cho mọi selector function multi-tier.
 * Format: [Selector] {name} → tier {N} ({tierName}) = {found|null}
 * Vd: [Selector] getSubmitButton → tier 1 (icon) = found
 *
 * Bật log: `window._afDebug = true` trong DevTools.
 *
 * @param {string} name - Tên function (vd 'getSubmitButton')
 * @param {number|string} tier - Số thứ tự tier (1,2,3,...) hoặc 'fallback'
 * @param {string} tierName - Tên tier (vd 'icon', 'aria-haspopup', 'previousElementSibling')
 * @param {*} result - Element tìm được hoặc null
 */
function _logSelectorPick(name, tier, tierName, result) {
  if (!_isLogSelectorsEnabled()) return;
  const status = result ? 'found' : 'null';
  console.log(`[Selector] ${name} → tier ${tier} (${tierName}) = ${status}`);
}

/**
 * Tìm MAIN Slate editor trên Flow page (không phải search box hoặc editor phụ).
 *
 * Disambiguation strategy (5 markers, đã update theo DOM Flow hiện tại):
 *   - Marker 1: editor có <span data-slate-placeholder> bên trong
 *               (Slate annotation luôn có với editor có placeholder, vd "Bạn muốn tạo gì?")
 *   - Marker 2: container có <i class="google-symbols"> với text bắt đầu "arrow_forward"|"crop_"|"add_2"
 *               (toolbar buttons icon — submit/ratio/upload đều có Material icon)
 *   - Marker 3: container có button[id^="radix-:"] (Radix UI prefix — settings/submit dùng)
 *   - Marker 4: container có button[aria-haspopup="menu"] (settings button ARIA)
 *   - Marker 5: container có button[aria-haspopup="dialog"] (add/upload button ARIA)
 *
 * NOTE: Bỏ markers cũ vì 5/5 đã fail trên DOM Flow hiện tại:
 *   - [data-contents="true"]                  → legacy Slate <0.50, không còn
 *   - [id*="model"]                            → settings button id="radix-:rs:" không có "model"
 *   - [id*="trigger-IMAGE/VIDEO/SQUARE/...]"  → CHỈ có trong settings popup khi mở (không ở editor area)
 *   - [class*="settings"]                      → CSS-in-JS hash sc-xxxxx, không có chữ "settings"
 *   - button[type="submit"]                    → Flow DOM không có type explicit
 *
 * Fallback: nếu không marker nào match → lấy editor cuối cùng (main thường render sau search box).
 */
function getEditor() {
  // Slate v0.50+ chỉ còn data-slate-editor (data-contents là legacy đã removed).
  const allEditors = document.querySelectorAll('div[data-slate-editor="true"]');

  for (const ed of allEditors) {
    // Marker 1: editor self có placeholder annotation
    const hasPlaceholder = !!ed.querySelector('[data-slate-placeholder]');

    // Markers 2-5: search trong container (đi lên tối đa 5 level)
    let container = ed;
    let containerHit = false;
    for (let i = 0; i < 5 && container; i++) {
      container = container.parentElement;
      if (!container) break;

      const hasIcon = !!Array.from(container.querySelectorAll('i.google-symbols'))
        .find(ic => /^(arrow_forward|crop_|add_2)/.test(ic.textContent.trim()));
      const hasRadixBtn = !!container.querySelector('button[id^="radix-:"]');
      const hasMenuBtn = !!container.querySelector('button[aria-haspopup="menu"]');
      const hasDialogBtn = !!container.querySelector('button[aria-haspopup="dialog"]');

      if (hasIcon || hasRadixBtn || hasMenuBtn || hasDialogBtn) {
        containerHit = true;
        break;
      }
    }

    if (hasPlaceholder || containerHit) {
      _logSelectorPick('getEditor', 1, hasPlaceholder ? 'placeholder' : 'container-marker', ed);
      return ed;
    }
  }

  // Fallback: editor cuối cùng (main thường render sau search box, sau onboarding hint, ...)
  if (allEditors.length > 0) {
    const last = allEditors[allEditors.length - 1];
    _logSelectorPick('getEditor', 'fallback', 'last-of-list', last);
    return last;
  }

  _logSelectorPick('getEditor', 'fail', 'no-slate-editor', null);
  return null;
}

/**
 * Tìm nút Settings (button mở popup model/ratio/quantity) trên Flow page.
 *
 * RESILIENCE — 4 tier fallback:
 *   • Tier 1 (ARIA + icon, primary): button[aria-haspopup="menu"] chứa <i.google-symbols> bắt đầu "crop_"
 *     → Robust nhất: ARIA standard + Material icon name
 *   • Tier 2 (Radix prefix + icon): button[id^="radix-:"] chứa <i.google-symbols> "crop_"
 *     → Radix UI generated ID, stable prefix
 *   • Tier 3 (positional): submitBtn?.previousElementSibling
 *     → Settings luôn sibling trước submit trong Flow layout hiện tại
 *   • Tier 4 (textContent regex): button có text matching /crop_/
 *     → Last resort, ít stable
 *
 * @param {Element|null} submitBtn - Optional submit button cho positional tier (auto-fetch nếu null)
 * @returns {Element|null}
 */
function getSettingsButton(submitBtn = null) {
  // Tier 1 (primary): aria-haspopup="menu" + crop icon
  const menuBtns = document.querySelectorAll('button[aria-haspopup="menu"]');
  for (const btn of menuBtns) {
    const icon = btn.querySelector('i.google-symbols');
    if (icon && /^crop_/.test(icon.textContent.trim())) {
      _logSelectorPick('getSettingsButton', 1, 'aria-menu+icon', btn);
      return btn;
    }
  }

  // Tier 2: Radix prefix + crop icon
  const radixBtns = document.querySelectorAll('button[id^="radix-:"]');
  for (const btn of radixBtns) {
    const icon = btn.querySelector('i.google-symbols');
    if (icon && /^crop_/.test(icon.textContent.trim())) {
      _logSelectorPick('getSettingsButton', 2, 'radix-id+icon', btn);
      return btn;
    }
  }

  // Tier 3: positional — sibling trước submit
  const sb = submitBtn || getSubmitButton();
  if (sb?.previousElementSibling && sb.previousElementSibling.tagName === 'BUTTON') {
    _logSelectorPick('getSettingsButton', 3, 'positional', sb.previousElementSibling);
    return sb.previousElementSibling;
  }

  // Tier 4 (last resort): bất kỳ button nào có textContent chứa crop_
  const allBtns = document.querySelectorAll('button');
  for (const btn of allBtns) {
    if (/crop_/.test(btn.textContent || '')) {
      _logSelectorPick('getSettingsButton', 4, 'text-crop', btn);
      return btn;
    }
  }

  _logSelectorPick('getSettingsButton', 'fail', 'all', null);
  return null;
}

/**
 * [Phase 4] Lấy settings panel popup đang mở (Radix dialog/popper/menu).
 * Settings panel render dạng floating overlay → query toàn document, lấy CÁI CUỐI CÙNG
 * (most-recently-opened theo Radix convention).
 *
 * @returns {Element|Document} Panel element nếu có popup mở, document nếu không
 */
function _getActiveSettingsPanel() {
  // Post-audit fix: prefer panel CHỨA settings controls (button[role="tab"] cho mode/ratio/quantity).
  // Trước fix: chọn LAST menu/dialog → khi [role="menuitem"] context menu mở sau settings dialog,
  // LAST trỏ menu → query mode_tab miss → click fail.
  //
  // Dynamic selectors (admin tweakable qua /admin/providers):
  //   - settings_panel_candidates: list selectors cho candidates
  //   - settings_panel_marker: selector identify panel chứa settings controls
  const _candCfg = _getDynamicSelector('settings_panel_candidates');
  const _candSelectors = (_candCfg?.selectors?.length > 0)
    ? _candCfg.selectors
    : ['[role="dialog"]', '[data-radix-popper-content-wrapper]', '[role="menu"]'];

  const _markerCfg = _getDynamicSelector('settings_panel_marker');
  const _markerSelector = (_markerCfg?.selectors?.length > 0)
    ? _markerCfg.selectors[0]
    : 'button[role="tab"][id*="-trigger-"]';

  const candidates = document.querySelectorAll(_candSelectors.join(', '));
  // Iterate ngược (LAST trước) để giữ ưu tiên popup mới nhất
  for (let i = candidates.length - 1; i >= 0; i--) {
    const el = candidates[i];
    try {
      if (el.querySelector(_markerSelector)) return el;
    } catch (_) { /* invalid selector */ }
  }
  // Fallback legacy: LAST candidate bất kỳ
  if (candidates.length > 0) return candidates[candidates.length - 1];
  return document;
}

/**
 * Tìm nút Submit trên Flow page.
 *
 * RESILIENCE — 3 tier + dynamic selectors from backend:
 *   • Tier 1 (icon): button có <i class="google-symbols"> text = icon_text (default: arrow_forward)
 *   • Tier 2 (text): button chứa text từ button_text array (default: ["Tạo", "Create"])
 *   • Tier 3 (type): button[type="submit"] (legacy)
 */
function getSubmitButton() {
  // Get dynamic config (may have updated selectors from backend)
  var config = _getDynamicSelector('submit_button');
  var hasConfig = !!config;
  var selectors = config?.selectors || [];
  var iconText = config?.icon_text || 'arrow_forward';
  var submitTexts = config?.button_text?.length ? config.button_text : ['Tạo', 'Create'];

  // Debug log: show config source
  console.log(`[Selector:submit_button] Source: ${hasConfig ? '🌐 DYNAMIC' : '📦 HARDCODED'} | selectors=${selectors.length} | icon_text="${iconText}" | button_text=[${submitTexts.join(', ')}]`);

  // Tier 0 (dynamic selectors): try CSS selectors from backend first
  for (var s = 0; s < selectors.length; s++) {
    try {
      var el = document.querySelector(selectors[s]);
      if (el) {
        console.log(`[Selector:submit_button] ✅ Tier 0 Match #${s + 1}: ${selectors[s]}`);
        _logSelectorPick('getSubmitButton', 0, 'selector', el);
        return el;
      } else {
        console.log(`[Selector:submit_button] ❌ Tier 0 No match: ${selectors[s]}`);
      }
    } catch (e) { /* invalid selector */ }
  }

  // Tier 1 (primary): icon match — Flow DOM hiện tại
  var buttons = document.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    var icon = btn.querySelector('i.google-symbols');
    if (icon && icon.textContent.trim() === iconText) {
      _logSelectorPick('getSubmitButton', 1, 'icon', btn);
      return btn;
    }
  }

  // Tier 2 (text fallback): button containing submit text
  for (var j = 0; j < buttons.length; j++) {
    var btn2 = buttons[j];
    var btnText = btn2.textContent.trim();
    if (submitTexts.some(function(t) { return btnText.includes(t); })) {
      _logSelectorPick('getSubmitButton', 2, 'text', btn2);
      return btn2;
    }
  }

  // Tier 3 (legacy): button[type="submit"]
  var submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    _logSelectorPick('getSubmitButton', 3, 'type=submit', submitBtn);
    return submitBtn;
  }

  _logSelectorPick('getSubmitButton', 'fail', 'all', null);
  return null;
}

// UI Logging
function sendLog(msg, level = 'info') {
  console.log(`[FlowAuto] ${msg}`);
  const logContainer = document.getElementById('logContainer');
  if (logContainer) {
    const div = document.createElement('div');
    div.className = `log-entry ${level}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContainer.appendChild(div);
    logContainer.scrollTop = logContainer.scrollHeight;
  }
  // Highlight log tab when receiving logs
  const logTabBtn = document.querySelector('.tab-btn[data-tab="tab-logs"]');
  if (logTabBtn && !logTabBtn.classList.contains('active')) {
    logTabBtn.classList.add('has-new');
  }
  // Forward log to sidePanel via chrome.runtime.sendMessage
  // Check extension context first to avoid "Extension context invalidated" error
  if (!chrome.runtime?.id) return;
  try {
    chrome.runtime.sendMessage({ action: 'contentLog', msg, level }).catch(() => {});
  } catch (e) {}
}

// sendProgress removed — was dead code (referenced sidePanel DOM not available in content.js)

/**
 * Send retry status to sidePanel for footer display
 * @param {string} text - Short status text (e.g., "Click Retry (1/2)", "Gửi lại Prompt")
 */
function sendRetryStatus(text) {
  try {
    chrome.runtime.sendMessage({ action: 'retry:status', text }).catch(() => {});
  } catch (e) {}
}

/**
 * Check if auto-download is enabled (from settings or Tab 1 toggle)
 */
function isAutoDownloadEnabled() {
  const genTabToggle = document.getElementById('genTabAutoDownload');
  if (genTabToggle) return genTabToggle.checked;
  return false;
}

/**
 * Get download settings from chrome.storage (includes resolution)
 * Uses new template-based filename system
 */
function getDownloadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['af_settings'], (res) => {
      const s = res.af_settings || {};
      resolve({
        folder: s.downloadFolder || 'tobyflow_output',
        template: s.fileNameTemplate || '[Date]_[Project]_[Prompt]_[Index]',
        project: s.fileNameProject || '',
        resolution: s.downloadResolution || '1k'
      });
    });
  });
}

/**
 * Build filename from template string (inline version of DownloadHelper.buildFilename)
 * content.js runs in page context and cannot access sidePanel's window.DownloadHelper
 * @param {Object} options
 * @param {string} options.template - Template string with [Date], [Time], [Project], [Prompt], [Index]
 * @param {string} [options.project] - Project name
 * @param {string} [options.prompt] - Prompt text
 * @param {number} [options.index] - File index (1-based)
 * @param {string} [options.taskName] - Task name for subfolder
 * @param {string} [options.folder] - Base download folder
 * @param {string} [options.ext] - File extension (default: 'png')
 * @returns {string} Full filename path like "flow-output/TaskName/2026-03-12_Project_prompt_001.png"
 */
// Chuyển tiếng Việt có dấu → ASCII (ả→a, đ→d, ê→e...)
function _toAscii(str) {
  if (!str) return str;
  return str
    .replace(/[đĐ]/g, c => c === 'đ' ? 'd' : 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function _buildFilename({ template, project, prompt, index, taskName, folder, ext }) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // 2026-03-12
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // 14-30-25

  // Sanitize inputs — convert Vietnamese diacritics to ASCII, strip special chars
  const safeProject = _toAscii(project || '').substring(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safePrompt = _toAscii(prompt || 'flow').substring(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeIndex = index ? String(index).padStart(3, '0') : '';

  let filename = (template || '[Date]_[Prompt]')
    .replace(/\[Date\]/gi, date)
    .replace(/\[Time\]/gi, time)
    .replace(/\[Project\]/gi, safeProject)
    .replace(/\[Prompt\]/gi, safePrompt)
    .replace(/\[Index\]/gi, safeIndex);

  // Clean up: remove leading/trailing underscores, collapse multiple underscores
  filename = filename.replace(/_+/g, '_').replace(/^_|_$/g, '');

  if (!filename) filename = 'flow_' + Date.now();

  // Build full path
  const baseFolder = folder || 'tobyflow_output';
  const extension = ext || 'png';

  if (taskName) {
    const safeTaskName = _toAscii(taskName).substring(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${baseFolder}/${safeTaskName}/${filename}.${extension}`;
  }
  return `${baseFolder}/${filename}.${extension}`;
}

/**
 * K-7: Modify media URL to request higher resolution if possible
 * Google Flow images from storage.googleapis.com support =wNNNN / =hNNNN params
 */
function applyResolutionToUrl(url, resolution) {
  if (!url || resolution === 'original') return url;

  // Server-first: đọc pixel_width từ provider_configs.download_resolutions.
  // Fallback inline nếu cache miss.
  const targetWidth = _getDownloadPixelWidth(resolution);
  if (!targetWidth) return url;

  try {
    // Google storage URLs: =w1024 or =s1024 style params
    if (url.includes('googleusercontent.com') || url.includes('storage.googleapis.com') || url.includes('lh3.')) {
      // Remove existing size params (=wNNN, =hNNN, =sNNN, =w1024-h768, etc.)
      let cleanUrl = url.replace(/=w\d+(-h\d+)?/g, '').replace(/=s\d+/g, '').replace(/=h\d+/g, '');
      // Remove trailing = if left over
      cleanUrl = cleanUrl.replace(/=+$/, '');
      // Append new size param
      const separator = cleanUrl.includes('=') ? '-' : '=';
      return `${cleanUrl}${separator}w${targetWidth}`;
    }
    // For other URLs, try to add/replace width query param
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', targetWidth.toString());
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

/**
 * Download a media file from a tile by its ID
 * T-1: Ưu tiên dùng Flow native menu (right-click → Tải xuống → 1K/2K)
 * Fallback sang fetch URL nếu Flow menu thất bại
 * @param {string} tileId
 * @param {string} [promptText] - Prompt text cho tên file (fallback mode)
 * @param {string} [taskName] - Task name cho subfolder (fallback mode)
 * @param {string} [fileName] - file_name UUID để cross-project validation
 * @param {string} [resolution] - '1k', '2k', '4k' cho ảnh; '720p', '1080p', '4k' cho video
 */
async function downloadTileMedia(tileId, promptText, taskName, fileName, resolution, flowFileId, index, videoResolution) {
  // Lấy resolution từ param hoặc settings
  let res = resolution;
  if (!res) {
    const settings = await getDownloadSettings();
    res = settings.resolution;
  }
  // Normalize: 'original' → '1k' (image default), video resolution kept as-is
  // Video: '720p' hoặc '1080p' — không normalize
  if (!res || res === 'original') res = '1k';

  // U-2.2: file_id lookup trước (persistent, chính xác nhất)
  if (flowFileId) {
    const tile = findTileByFileId(flowFileId);
    if (tile) tileId = tile.dataset.tileId;
  }

  // Auto-detect video tile và dùng video resolution nếu có
  if (videoResolution) {
    const tileEl = _getTileById(tileId);
    if (tileEl && tileEl.querySelector('video')) {
      res = videoResolution;
    }
  }

  // Ưu tiên Flow native menu cho CẢ image và video
  // Image: right-click <img> → "Tải xuống" → 1K/2K/4K
  // Video: right-click <video> → "Tải xuống" → 720p/1080p/4K
  // downloadViaFlowMenu là cách DUY NHẤT download video thực (blob: URL không download được qua chrome.downloads)
  console.log(`[TobyFlow] downloadTileMedia: attempting Flow menu for ${tileId.substring(0, 20)}, res=${res}`);
  const menuSuccess = await downloadViaFlowMenu(tileId, res, fileName, promptText, taskName, index);
  if (menuSuccess) {
    console.log(`[TobyFlow] downloadTileMedia: Flow menu SUCCESS for ${tileId.substring(0, 20)}`);
    return true;
  }
  console.log(`[TobyFlow] downloadTileMedia: Flow menu FAILED for ${tileId.substring(0, 20)}, trying legacy fallback`);

  // Fallback: chrome.downloads API (chỉ work cho image có HTTP URL, KHÔNG work cho video blob: URL)
  const legacySuccess = await _downloadTileMediaLegacy(tileId, promptText, taskName, fileName, res, index);
  if (legacySuccess) {
    console.log(`[TobyFlow] downloadTileMedia: Legacy fallback SUCCESS for ${tileId.substring(0, 20)}`);
    return true;
  }
  console.warn(`[TobyFlow] downloadTileMedia: BOTH methods FAILED for ${tileId.substring(0, 20)}`);
  return false;
}

/**
 * Legacy download: fetch URL trực tiếp + tạo download link
 * @private
 */
async function _downloadTileMediaLegacy(tileId, promptText, taskName, fileName, resolution, index) {
  // Retry logic: tile có thể chưa appear nếu vừa bridge từ Grok/ChatGPT
  // Ít retries hơn downloadViaFlowMenu vì đây là fallback path
  const MAX_RETRIES = 3;
  const RETRY_INTERVAL = 800;
  let tile = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    tile = _getTileById(tileId);
    if (tile) break;

    if (attempt < MAX_RETRIES - 1) {
      console.log(`[TobyFlow] _downloadTileMediaLegacy: tile not found, retry ${attempt + 1}/${MAX_RETRIES}...`);
      await sleep(RETRY_INTERVAL);
    }
  }

  if (!tile) {
    console.warn(`[TobyFlow] _downloadTileMediaLegacy: tile not found after ${MAX_RETRIES} retries: ${tileId.substring(0, 30)}`);
    return false;
  }

  // Cross-project validation
  if (fileName) {
    const currentFn = extractFileName(tile);
    if (currentFn && currentFn !== fileName) {
      console.warn(`[TobyFlow] _downloadTileMediaLegacy: cross-project collision`);
      sendLog(`Tile ${tileId.substring(0, 15)}... thuộc project khác, bỏ qua.`, 'warn');
      return false;
    }
  }

  // Chờ media load hoàn tất (tránh download media.html hoặc placeholder)
  // Video cần thời gian lâu hơn để load (encoding + streaming) → timeout 15s + preferVideo
  const resLower = (resolution || '').toLowerCase();
  const isVideoRes = resLower === '720p' || resLower === '1080p' || (resLower === '4k' && !!tile.querySelector('video'));
  const mediaTimeout = isVideoRes ? 15000 : 10000;
  const mediaEl = await _waitForTileMediaReady(tile, mediaTimeout, isVideoRes);
  if (!mediaEl) {
    console.warn(`[TobyFlow] _downloadTileMediaLegacy: tile media not ready after ${mediaTimeout / 1000}s, tileId=${tileId.substring(0, 30)}`);
    return false;
  }

  try {
    const settings = await getDownloadSettings();
    const mediaSrc = applyResolutionToUrl(mediaEl.src, resolution || '1k');

    // CRITICAL: Final validation - reject placeholder URLs before download
    if (!mediaSrc ||
        mediaSrc.includes('media.html') ||
        mediaSrc.endsWith('.html') ||
        (!mediaSrc.startsWith('http://') && !mediaSrc.startsWith('https://') && !mediaSrc.startsWith('blob:'))) {
      console.warn(`[TobyFlow] _downloadTileMediaLegacy: invalid/placeholder URL rejected: ${mediaSrc?.substring(0, 80)}`);
      return false;
    }

    // Build filename using template system
    const isVideo = mediaEl.tagName === 'VIDEO';
    const ext = isVideo ? 'mp4' : 'png';

    const filename = _buildFilename({
      template: settings.template,
      project: settings.project,
      prompt: promptText,
      index: index,
      taskName: taskName,
      folder: settings.folder,
      ext
    });

    console.log(`[TobyFlow] _downloadTileMediaLegacy: downloading via chrome.downloads: ${mediaSrc.substring(0, 100)}...`);

    // Dùng chrome.downloads API qua background.js — reliable, handles Google CDN auth/cookies
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'chromeDownload',
        url: mediaSrc,
        filename
      }, (resp) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(resp || { success: false, error: 'No response' });
        }
      });
    });

    if (response.success) {
      incrementDownloadCounter();
      const resLabel = resolution ? ` [${resolution.toUpperCase()}]` : '';
      sendLog(`Đã tải${resLabel}: ${filename}`, 'success');
      return true;
    } else {
      console.warn(`[TobyFlow] _downloadTileMediaLegacy: chrome.downloads failed: ${response.error}`);
      return false;
    }
  } catch (e) {
    console.warn(`[TobyFlow] _downloadTileMediaLegacy: exception: ${e.message}`);
    sendLog(`Không thể tải file ${tileId}: ${e.message}`, 'warn');
    return false;
  }
}

/**
 * T-1: Download via Google Flow native context menu (right-click → Tải xuống → 1K/2K)
 * Flow xử lý download, extension chỉ simulate thao tác + rename file trước khi lưu
 * @param {string} tileId - Tile ID cần download
 * @param {string} resolution - '1k', '2k' cho ảnh; '720p', '1080p' cho video
 * @param {string} [fileName] - file_name UUID để cross-project validation
 * @param {string} [promptText] - Prompt text cho tên file
 * @param {string} [taskName] - Task name cho subfolder
 * @returns {Promise<boolean>} true nếu download thành công
 */
async function downloadViaFlowMenu(tileId, resolution, fileName, promptText, taskName, index) {
  // Retry logic: tile từ Grok/ChatGPT có thể chưa bridge xong khi Download node chạy
  // Wait + retry tối đa 5 lần, mỗi lần cách 1 giây
  const MAX_TILE_RETRIES = 5;
  const TILE_RETRY_INTERVAL = 1000;
  let tile = null;

  for (let attempt = 0; attempt < MAX_TILE_RETRIES; attempt++) {
    tile = _getTileById(tileId);
    if (tile) break;

    if (attempt < MAX_TILE_RETRIES - 1) {
      console.log(`[TobyFlow] downloadViaFlowMenu: tile not found, retry ${attempt + 1}/${MAX_TILE_RETRIES} in ${TILE_RETRY_INTERVAL}ms...`);
      await sleep(TILE_RETRY_INTERVAL);
    }
  }

  if (!tile) {
    console.warn(`[TobyFlow] downloadViaFlowMenu: tile not found after ${MAX_TILE_RETRIES} retries: ${tileId.substring(0, 20)}`);
    return false;
  }

  // Cross-project validation
  if (fileName) {
    const currentFn = extractFileName(tile);
    if (currentFn && currentFn !== fileName) {
      console.warn(`[TobyFlow] downloadViaFlowMenu: cross-project collision`);
      sendLog(`Tile ${tileId.substring(0, 15)}... thuộc project khác, bỏ qua.`, 'warn');
      return false;
    }
  }

  // Detect if this is a video tile by checking for <video> element
  // Fallback: resolution format (720p/1080p = video, 1k/2k = image)
  // '4k' is ambiguous — check <video> element first, then fallback by resolution format
  // Video tiles may show <img> thumbnail instead of <video> during loading
  const resLower = (resolution || '').toLowerCase();
  const isVideo = !!tile.querySelector('video') ||
    resLower === '720p' || resLower === '1080p';

  // Resolution label: server-first qua _getDownloadMenuLabel (provider_configs.download_resolutions)
  // Fallback chain: '4K' cho 4k cả mode, '720p/1080p' video, '1K/2K' image.
  let resLabel = _getDownloadMenuLabel(resolution, isVideo);
  if (!resLabel) {
    // Fallback giữ behaviour cũ
    if (resLower === '4k') {
      resLabel = '4K';
    } else if (isVideo) {
      resLabel = (resolution || '720p').toLowerCase();
    } else {
      resLabel = (resolution || '1k').toUpperCase();
    }
  }

  // 0. Ensure Flow tab active (context menu cần tab active để React render menu)
  // Chỉ cần active tab, không cần focus window
  if (document.visibilityState === 'hidden') {
    await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'ensureFlowTabActive' }, () => resolve());
    });
    await sleep(300); // Chờ tab activate + React unthrottle
  }

  // 1. Chờ media ready TRƯỚC khi acquire context menu lock (tránh block editor lâu)
  // Video: preferVideo=true → đợi <video> element (blob URL OK) → right-click hiện 720p/1080p
  // Image: preferVideo=false → lấy <video> hoặc <img> → right-click hiện 1K/2K
  const mediaTimeout = isVideo ? 15000 : 10000;
  tile.scrollIntoView({ behavior: 'instant', block: 'center' });
  const readyMedia = await _waitForTileMediaReady(tile, mediaTimeout, isVideo);
  if (!readyMedia) {
    console.warn(`[TobyFlow] downloadViaFlowMenu: tile media not ready after ${mediaTimeout / 1000}s, tileId=${tileId.substring(0, 20)}`);
    return false;
  }

  // Context menu mutex — tránh collision với addFileToPrompt trong pipeline mode
  await _acquireCtxMenuLock();
  try {
    // Re-scroll (có thể bị shift trong lúc chờ lock)
    tile.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(100);

    // 2. Right-click vào IMG/VIDEO element (không phải tile container)
    // Flow chỉ hiện menu "Tải xuống" khi right-click trúng media element
    // Video: right-click <video> → menu 720p/1080p
    // Image: right-click <img> → menu 1K/2K
    const targetEl = readyMedia;
    const rect = targetEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    console.log(`[TobyFlow] downloadViaFlowMenu: right-click on ${targetEl.tagName} at (${Math.round(cx)}, ${Math.round(cy)}), rect: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    targetEl.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 2
    }));

    // 3. Wait cho context menu render
    const contextMenu = await _waitForElement('[role="menu"][data-state="open"]', 3000);
    if (!contextMenu) {
      console.warn('[TobyFlow] downloadViaFlowMenu: context menu not found');
      return false;
    }
    await sleep(50);

    // 4. Tìm menu item "Tải xuống" / "Download" (có aria-haspopup="menu" - submenu)
    // Server-first: đọc download_menu_trigger config (selectors + icon_text + button_text per locale).
    // Admin tweak qua /admin/providers khi Flow đổi icon name hoặc thêm ngôn ngữ.
    const triggerConfig = _getDynamicSelector('download_menu_trigger');
    const triggerIconText = triggerConfig?.icon_text || 'download';
    const triggerButtonText = (triggerConfig?.button_text?.length ? triggerConfig.button_text : null)
      || _ARIA_LABELS.download;

    const menuItems = contextMenu.querySelectorAll('[role="menuitem"]');
    let downloadItem = null;

    // Strategy 1: icon text match (language-independent) + aria-haspopup="menu"
    for (const item of menuItems) {
      const icon = item.querySelector('i');
      if (icon?.textContent?.trim() === triggerIconText && item.getAttribute('aria-haspopup') === 'menu') {
        downloadItem = item;
        break;
      }
    }

    // Strategy 2: text match multi-locale (từ button_text config)
    if (!downloadItem) {
      for (const item of menuItems) {
        const text = item.textContent?.trim() || '';
        if (_textIncludesAny(text, triggerButtonText) && item.getAttribute('aria-haspopup') === 'menu') {
          downloadItem = item;
          break;
        }
      }
    }

    // Strategy 3: icon fallback không cần aria-haspopup (edge case)
    if (!downloadItem) {
      for (const item of menuItems) {
        if (item.querySelector('i')?.textContent?.trim() === triggerIconText) {
          downloadItem = item;
          break;
        }
      }
    }

    if (!downloadItem) {
      console.warn('[TobyFlow] downloadViaFlowMenu: download menu item not found');
      _closeContextMenu();
      return false;
    }

    // 5. Hover vào "Tải xuống" để trigger sub-menu (Radix UI cần full pointer sequence)
    const dlRect = downloadItem.getBoundingClientRect();
    const dlCx = dlRect.left + dlRect.width / 2;
    const dlCy = dlRect.top + dlRect.height / 2;
    // relatedTarget quan trọng cho Radix UI hover detection
    const pointerOpts = { bubbles: true, cancelable: true, clientX: dlCx, clientY: dlCy, pointerId: 1, pointerType: 'mouse', relatedTarget: contextMenu };
    const mouseOpts = { bubbles: true, cancelable: true, clientX: dlCx, clientY: dlCy, relatedTarget: contextMenu };

    // Helper: tìm sub-menu với nhiều strategies
    // Server-first: đọc download_submenu config (attribute + selectors).
    // attribute='aria-controls' (strategy 1), selectors[] cho strategy 2/3.
    const submenuConfig = _getDynamicSelector('download_submenu');
    const submenuAttribute = submenuConfig?.attribute || 'aria-controls';
    const submenuSelectors = submenuConfig?.selectors?.length
      ? submenuConfig.selectors
      : ['[role="menu"][data-state="open"]', '[data-radix-popper-content-wrapper] [role="menu"]'];

    const findSubMenu = () => {
      // Strategy 1: aria-controls (preferred — chính xác nhất)
      const subMenuId = downloadItem.getAttribute(submenuAttribute);
      if (subMenuId) {
        const menu = document.getElementById(subMenuId);
        if (menu) return menu;
      }
      // Strategy 2+: thử lần lượt selectors từ config
      for (const sel of submenuSelectors) {
        try {
          const candidates = document.querySelectorAll(sel);
          for (const m of candidates) {
            if (m !== contextMenu) return m;
          }
        } catch (e) { /* invalid selector */ }
      }
      return null;
    };

    // Full pointer/mouse event sequence cho Radix UI (bao gồm pointerdown/pointerup)
    downloadItem.dispatchEvent(new PointerEvent('pointerover', pointerOpts));
    downloadItem.dispatchEvent(new PointerEvent('pointerenter', pointerOpts));
    downloadItem.dispatchEvent(new PointerEvent('pointermove', pointerOpts));
    downloadItem.dispatchEvent(new PointerEvent('pointerdown', { ...pointerOpts, button: 0 }));
    downloadItem.dispatchEvent(new PointerEvent('pointerup', { ...pointerOpts, button: 0 }));
    downloadItem.dispatchEvent(new MouseEvent('mouseover', mouseOpts));
    downloadItem.dispatchEvent(new MouseEvent('mouseenter', mouseOpts));
    downloadItem.dispatchEvent(new MouseEvent('mousemove', mouseOpts));
    downloadItem.focus();

    // 6. Wait cho sub-menu render (thử nhiều lần nếu cần)
    let subMenu = null;
    for (let attempt = 0; attempt < 5 && !subMenu; attempt++) {
      await sleep(150); // Tăng từ 100ms lên 150ms
      subMenu = findSubMenu();
      if (!subMenu && attempt === 1) {
        // Retry hover sequence ở attempt thứ 2
        downloadItem.dispatchEvent(new PointerEvent('pointerenter', pointerOpts));
        downloadItem.dispatchEvent(new MouseEvent('mouseenter', mouseOpts));
      }
      if (!subMenu && attempt === 3) {
        // Attempt 4: thử focus + keyboard navigation (một số Radix versions cần keyboard)
        downloadItem.focus();
        downloadItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        await sleep(100);
        subMenu = findSubMenu();
      }
    }
    // Final fallback: hover lại với delay dài hơn
    if (!subMenu) {
      downloadItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: dlCx, clientY: dlCy }));
      downloadItem.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: dlCx, clientY: dlCy }));
      await sleep(300);
      subMenu = findSubMenu();
    }
    if (!subMenu) {
      console.warn('[TobyFlow] downloadViaFlowMenu: sub-menu not found after 5 attempts');
      _closeContextMenu();
      return false;
    }

    // 7. Tìm và click option resolution
    // Fallback chain khi aria-disabled="true":
    //   Image: 4K → 2K → 1K
    //   Video: 4K → 1080p → 720p
    // Server-first: đọc từ provider_configs.download_resolutions với inline fallback.
    const subItemConfig = _getDynamicSelector('download_submenu_item');
    const subItemSelectors = subItemConfig?.selectors?.length ? subItemConfig.selectors : ['[role="menuitem"]'];
    let subItems = [];
    for (const sel of subItemSelectors) {
      try {
        const found = subMenu.querySelectorAll(sel);
        if (found && found.length > 0) { subItems = found; break; }
      } catch (e) { /* invalid selector */ }
    }
    const fallbackChain = _getDownloadFallbackChain(isVideo);

    // Tìm vị trí của resLabel trong fallback chain, bắt đầu từ đó
    let startIdx = fallbackChain.indexOf(resLabel);
    if (startIdx < 0) startIdx = 0;

    let targetItem = null;
    let actualResLabel = resLabel;
    for (let fi = startIdx; fi < fallbackChain.length && !targetItem; fi++) {
      const tryLabel = fallbackChain[fi];
      for (const item of subItems) {
        const text = item.textContent?.trim() || '';
        if (text.startsWith(tryLabel)) {
          if (item.getAttribute('aria-disabled') === 'true') {
            console.log(`[TobyFlow] downloadViaFlowMenu: ${tryLabel} is disabled (aria-disabled), trying lower resolution`);
            break; // Try next in fallback chain
          }
          targetItem = item;
          actualResLabel = tryLabel;
          break;
        }
      }
    }

    if (targetItem && actualResLabel !== resLabel) {
      sendLog(`${resLabel} không khả dụng, tải ${actualResLabel} thay thế`, 'warn');
    }

    if (!targetItem) {
      // Last resort: tải option đầu tiên available (tốt hơn là không tải gì)
      const availableItems = [...subItems].map(i => i.textContent?.trim()).join(', ');
      console.warn(`[TobyFlow] downloadViaFlowMenu: ${resLabel} not found in sub-menu. Available: [${availableItems}]`);
      for (const item of subItems) {
        if (item.getAttribute('aria-disabled') !== 'true') {
          targetItem = item;
          const firstWord = item.textContent?.trim().split(' ')[0] || '?';
          sendLog(`${resLabel} không khả dụng, tải ${firstWord} thay thế`, 'warn');
          break;
        }
      }
      if (!targetItem) {
        console.warn('[TobyFlow] downloadViaFlowMenu: no downloadable option found');
        _closeContextMenu();
        return false;
      }
    }

    // 8. Re-validate media URL trước khi click download (tránh race condition)
    // Media có thể đã thay đổi trong thời gian chờ menu render
    const mediaForValidation = isVideo
      ? tile.querySelector('video')
      : tile.querySelector('video') || tile.querySelector('img');
    if (mediaForValidation) {
      const currentSrc = mediaForValidation.src || '';
      const rawSrc = mediaForValidation.getAttribute('src') || '';
      const isPlaceholder = currentSrc.includes('media.html') ||
        currentSrc.endsWith('.html') ||
        rawSrc === 'media.html' ||
        rawSrc.endsWith('.html') ||
        (!currentSrc.startsWith('http') && !currentSrc.startsWith('blob:') && !rawSrc.startsWith('/fx/'));
      if (isPlaceholder) {
        console.warn('[TobyFlow] downloadViaFlowMenu: media URL is placeholder after menu opened, aborting download');
        _closeContextMenu();
        return false;
      }
    }

    // 9. Chuẩn bị rename file trước khi Flow download (template-based)
    const settings = await getDownloadSettings();
    const downloadFilename = _buildFilename({
      template: settings.template,
      project: settings.project,
      prompt: promptText,
      index: index,
      taskName: taskName,
      folder: settings.folder,
      ext: isVideo ? 'mp4' : 'png'
    });

    // Extract folder and baseName for prepareDownloadRename
    const lastSlash = downloadFilename.lastIndexOf('/');
    const downloadFolder = lastSlash >= 0 ? downloadFilename.substring(0, lastSlash) : settings.folder;
    const baseName = lastSlash >= 0 ? downloadFilename.substring(lastSlash + 1).replace(/\.[^.]+$/, '') : downloadFilename.replace(/\.[^.]+$/, '');

    // Gửi rename request tới background.js TRƯỚC khi click download
    // MUST await để đảm bảo rename entry đã được push vào queue
    // trước khi onDeterminingFilename fires (MV3 service worker race condition)
    // identifier giúp match chính xác khi concurrent downloads
    const identifier = fileName || baseName || tileId;
    await new Promise(resolve => {
      chrome.runtime.sendMessage({
        action: 'prepareDownloadRename',
        folder: downloadFolder,
        filename: baseName,
        identifier: identifier
      }, () => resolve());
    });

    // 10. Click download — Flow xử lý, background.js rename file
    targetItem.click();
    await sleep(50);

    // 11. Increment counter
    incrementDownloadCounter();
    const actualRes = targetItem.textContent?.trim().split(' ')[0] || resLabel;
    sendLog(`Đã tải [${actualRes}]: ${downloadFolder}/${baseName}`, 'success');
    return true;

  } catch (e) {
    console.error('[TobyFlow] downloadViaFlowMenu error:', e);
    _closeContextMenu();
    return false;
  } finally {
    _releaseCtxMenuLock();
  }
}

/**
 * Wait for an element matching selector to appear in DOM
 * @private
 */
function _waitForElement(selector, timeoutMs = 3000, excludeEl = null) {
  return new Promise(resolve => {
    // Kiểm tra ngay nếu element đã tồn tại
    const existing = document.querySelectorAll(selector);
    for (const el of existing) {
      if (!excludeEl || el !== excludeEl) { resolve(el); return; }
    }

    // P3-2: Dùng MutationObserver thay setInterval(100ms) để giảm CPU polling
    const observer = new MutationObserver(() => {
      const els = document.querySelectorAll(selector);
      for (const el of els) {
        if (!excludeEl || el !== excludeEl) {
          observer.disconnect();
          clearTimeout(timer);
          resolve(el);
          return;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Timeout safety net: disconnect observer và trả null nếu hết thời gian
    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

/**
 * Chờ tile hoàn thành (status check) + media load hoàn tất
 * 2 giai đoạn giống cơ chế retry:
 *   1. Chờ tile settle (success/failed) — reject ngay nếu failed
 *   2. Chờ media element load (src hợp lệ + rendered)
 * Tránh right-click download khi tile chưa render hoặc đã fail
 * @param {Element} tile - Tile DOM element
 * @param {number} timeoutMs - Timeout tổng (ms)
 * @param {boolean} [preferVideo=false] - Nếu true, đợi <video> element cụ thể (không fallback sang <img>)
 * @returns {Promise<Element|null>} Media element đã load, hoặc null nếu timeout/failed
 * @private
 */
function _waitForTileMediaReady(tile, timeoutMs = 10000, preferVideo = false) {
  return new Promise(resolve => {
    const startTime = Date.now();
    // Video fallback: nếu đợi <video> quá lâu (8s), thử fallback <img> sớm
    // Right-click <img> vẫn hoạt động cho download, chỉ không chọn được video resolution
    const videoFallbackMs = Math.min(8000, timeoutMs * 0.6);
    const check = () => {
      // Giai đoạn 1: Check tile status (giống detectTileStatus)
      const status = detectTileStatus(tile);
      if (status === 'failed') {
        console.warn('[TobyFlow] _waitForTileMediaReady: tile is failed, skip download');
        resolve(null);
        return;
      }

      // Giai đoạn 2: Nếu success hoặc processing, check media load
      // preferVideo=true: đợi <video> element, không lấy <img> (tránh download thumbnail thay vì video)
      // preferVideo=false: ưu tiên <video> trước, fallback <img>
      let media;
      if (preferVideo) {
        media = tile.querySelector('video');
        // Nếu chưa có <video> element VÀ chưa quá videoFallbackMs, tiếp tục poll
        // Sau videoFallbackMs, fallback sang <img> sớm (không chờ hết timeout)
        if (!media && status === 'success' && (Date.now() - startTime >= videoFallbackMs)) {
          const img = tile.querySelector('img');
          if (img) {
            const imgSrc = img.src || '';
            const imgRaw = img.getAttribute('src') || '';
            // CRITICAL: Reject placeholder URLs
            const isValidUrl = imgSrc.startsWith('http') &&
              !imgSrc.includes('media.html') &&
              !imgSrc.endsWith('.html') &&
              !imgRaw.endsWith('.html');
            if (isValidUrl) {
              console.warn('[TobyFlow] _waitForTileMediaReady: video not in DOM after ' + Math.round(videoFallbackMs / 1000) + 's, falling back to img early');
              resolve(img);
              return;
            }
          }
        }
      } else {
        media = tile.querySelector('video') || tile.querySelector('img');
      }
      if (media && status === 'success') {
        const src = media.src || '';
        // Src phải là URL hợp lệ, không phải placeholder
        // Video trên Google Flow có thể dùng:
        // - blob: URL (blob:https://labs.google/xxx) khi đang play
        // - Relative URL (/fx/api/trpc/media.getMediaUrlRedirect?name=UUID) khi completed
        // - Absolute URL (https://...) cho image
        // Browser tự resolve relative → absolute trong media.src, nhưng getAttribute('src') giữ nguyên
        const rawSrc = media.getAttribute('src') || '';
        const isVideoMedia = media.tagName === 'VIDEO';
        const isVideoBlobOrRelative = isVideoMedia && (src.startsWith('blob:') || rawSrc.startsWith('/fx/'));
        // CRITICAL: Reject placeholder URLs (media.html, *.html patterns)
        const isPlaceholderUrl = src.includes('media.html') ||
          src.endsWith('.html') ||
          rawSrc === 'media.html' ||
          rawSrc.endsWith('.html');
        const hasValidSrc = (isVideoBlobOrRelative || (src.startsWith('http://') || src.startsWith('https://')))
          && !src.includes('chrome-extension')
          && !isPlaceholderUrl;
        // Video: chỉ cần hasValidSrc là đủ cho right-click download
        // Browser throttle video loading khi window không focus (readyState stuck ở 0)
        // Context menu hoạt động dựa trên element type (<video>), không cần video thực sự load
        // Image: cần img.complete + naturalWidth > 0 (trừ khi tab hidden)
        const isTabHidden = document.visibilityState === 'hidden' || !document.hasFocus();
        const isLoaded = isVideoMedia
          ? true  // Video: hasValidSrc đủ, không cần readyState check
          : (isTabHidden
            ? true  // Image unfocused: URL hợp lệ là đủ
            : (media.naturalWidth > 0 && media.complete));
        if (hasValidSrc && isLoaded) {
          resolve(media);
          return;
        }
      }

      // Timeout
      if (Date.now() - startTime >= timeoutMs) {
        // preferVideo fallback: nếu đợi video timeout, thử lấy <img> thay thế
        if (preferVideo) {
          const img = tile.querySelector('img');
          if (img) {
            const imgSrc = img.src || '';
            const imgRaw = img.getAttribute('src') || '';
            // CRITICAL: Reject placeholder URLs
            const isValidUrl = imgSrc.startsWith('http') &&
              !imgSrc.includes('media.html') &&
              !imgSrc.endsWith('.html') &&
              !imgRaw.endsWith('.html');
            if (isValidUrl) {
              console.warn('[TobyFlow] _waitForTileMediaReady: video not ready, falling back to img');
              resolve(img);
              return;
            }
          }
        }
        resolve(null);
        return;
      }
      setTimeout(check, 200);
    };
    check();
  });
}

/**
 * Close any open context menu by pressing Escape
 * @private
 */
function _closeContextMenu() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

/**
 * Context Menu Mutex — Google Flow chỉ cho phép 1 context menu tại 1 thời điểm
 * Serialize addFileToPrompt và downloadViaFlowMenu để tránh context menu collision
 * Giữ làm lớp bảo vệ phụ dù Unified Queue đã serialize submit/download
 * @private
 */
// Guard: var allows safe re-declaration when extension reloads and re-injects content.js
var _ctxMenuLockQueue = _ctxMenuLockQueue || [];
var _ctxMenuLocked = _ctxMenuLocked || false;

async function _acquireCtxMenuLock() {
  if (_ctxMenuLocked) {
    await new Promise(resolve => _ctxMenuLockQueue.push(resolve));
  }
  _ctxMenuLocked = true;
  // Block user interaction khi context menu đang thao tác
  // ExecutionBlocker có thể chưa active (pipeline download chạy ngoài runAutoPrompt)
  if (!ExecutionBlocker._blocking) {
    document.body.classList.add('tobyflow-execution-blocking');
  }
  // Đóng context menu cũ nếu còn mở (stale từ thao tác trước)
  _closeContextMenu();
  await sleep(50);
}

function _releaseCtxMenuLock() {
  if (_ctxMenuLockQueue.length > 0) {
    const next = _ctxMenuLockQueue.shift();
    next(); // Wake up waiter tiếp theo (FIFO)
  } else {
    _ctxMenuLocked = false;
    // Remove CSS blocking nếu ExecutionBlocker không active
    if (!ExecutionBlocker._blocking) {
      document.body.classList.remove('tobyflow-execution-blocking');
    }
  }
}

/**
 * Wait for new tiles to appear and fully load (img/video)
 * Returns array of new tile IDs, or empty if timeout
 */
/**
 * Trích xuất file_name (UUID) từ media URL của tile.
 * file_name là persistent across sessions, không đổi khi reload.
 * URL dạng: /fx/api/trpc/media.getMediaUrlRedirect?name=UUID
 * hoặc: /fx/api/trpc/media.getMediaUrlRedirect?input={"json":{"name":"UUID"}}
 */
function extractFileName(tile) {
  if (!tile) return null;
  // Kiểm tra cache trước — tránh lặp lại 3 querySelectorAll mỗi polling cycle
  const tileId = tile.dataset?.tileId;
  if (tileId && _fileNameCache.has(tileId)) return _fileNameCache.get(tileId);
  // Tìm img/a có src/href chứa getMediaUrlRedirect
  const candidates = [
    ...tile.querySelectorAll('img[src*="getMediaUrlRedirect"]'),
    ...tile.querySelectorAll('a[href*="getMediaUrlRedirect"]'),
    ...tile.querySelectorAll('[src*="getMediaUrlRedirect"]')
  ];
  // Fallback: img.src có thể trực tiếp là getMediaUrlRedirect URL
  if (candidates.length === 0) {
    const img = tile.querySelector('img');
    if (img?.src?.includes('getMediaUrlRedirect')) candidates.push(img);
  }
  for (const el of candidates) {
    const url = el.src || el.href;
    if (!url) continue;
    const fn = extractFileNameFromUrl(url);
    if (fn) {
      // Lưu cache — invalidate cùng lúc với _invalidateTileCache() (250ms TTL)
      if (tileId) _fileNameCache.set(tileId, fn);
      return fn;
    }
  }
  return null;
}

/**
 * Parse file_name UUID từ một URL chứa getMediaUrlRedirect
 */
function extractFileNameFromUrl(url) {
  if (!url || !url.includes('getMediaUrlRedirect')) return null;
  try {
    const urlObj = new URL(url, window.location.origin);
    // Pattern 1: ?name=UUID (simple)
    const name = urlObj.searchParams.get('name');
    if (name && /^[a-f0-9-]{8,}$/i.test(name)) return name;
    // Pattern 2: tRPC ?input={"json":{"name":"UUID"}} or ?input={"0":{"json":{"name":"UUID"}}}
    const input = urlObj.searchParams.get('input');
    if (input) {
      const parsed = JSON.parse(decodeURIComponent(input));
      const json = parsed?.json || parsed?.['0']?.json || parsed;
      if (json?.name && /^[a-f0-9-]{8,}$/i.test(json.name)) return json.name;
    }
  } catch (e) {}
  return null;
}

/**
 * MRC-3.4.1.4: Extract thumbnail URL từ tile element
 * @param {Element} tile - Tile DOM element
 * @returns {string|null} - Thumbnail URL hoặc null
 */
function extractThumbnailUrl(tile) {
  if (!tile) return null;

  // Primary: Google Flow media URL pattern
  const imgFlow = tile.querySelector('img[src*="getMediaUrlRedirect"]');
  if (imgFlow?.src) return imgFlow.src;

  // Video: dùng src (không dùng poster vì có thể không có)
  const video = tile.querySelector('video[src*="getMediaUrlRedirect"]');
  if (video?.src) return video.src;

  // Legacy: Google CDN URL (có thể vẫn dùng cho một số trường hợp)
  const imgCdn = tile.querySelector('img[src*="googleusercontent.com"]');
  if (imgCdn?.src) return imgCdn.src;

  // Fallback: bất kỳ img có src http/https
  const anyImg = tile.querySelector('img[src^="http"]');
  if (anyImg?.src) return anyImg.src;

  // Fallback cuối: img có src bắt đầu bằng /fx/ (relative URL)
  const relativeImg = tile.querySelector('img[src^="/fx/"]');
  if (relativeImg?.src) return relativeImg.src;

  return null;
}

/**
 * Extract actual video URL from video tile for Telegram/download
 * Returns absolute URL (resolves relative /fx/api/... to full https://labs.google/fx/...)
 */
function extractVideoUrl(tile) {
  if (!tile) return null;

  const video = tile.querySelector('video');
  if (!video) return null;

  let videoUrl = video.src || video.currentSrc || '';
  if (!videoUrl) return null;

  // Resolve relative URL to absolute
  if (!videoUrl.startsWith('http')) {
    try {
      videoUrl = new URL(videoUrl, window.location.origin).href;
    } catch (e) {
      console.warn('[extractVideoUrl] Cannot resolve:', videoUrl);
      return null;
    }
  }

  return videoUrl;
}

/**
 * U-1.1: Extract project_id và file_id từ tile element
 * URL: /fx/vi/tools/flow/project/{project_id}/edit/{file_id}
 */
function extractFlowFileInfo(tile) {
  if (!tile) return null;
  const link = tile.querySelector('a[href*="/project/"]');
  if (!link) return null;
  const match = link.href.match(/\/project\/([a-f0-9-]+)\/edit\/([a-f0-9-]+)/);
  if (!match) return null;
  return { project_id: match[1], file_id: match[2] };
}

/**
 * U-1.1: Lấy project_id hiện tại từ URL hoặc DOM
 * LƯU Ý: Chỉ fallback DOM khi URL có /project/ nhưng thiếu ID.
 *        Khi ở homepage (URL không có /project/), trả về null ngay
 *        để tránh nhầm link đến project khác trên homepage.
 */
function getCurrentProjectId() {
  // Kiểm tra URL trước
  const urlMatch = location.pathname.match(/\/project\/([a-f0-9-]+)/);
  if (urlMatch) return urlMatch[1];

  // Nếu URL không chứa /project/, ta đang ở homepage hoặc trang khác
  // → không có "project hiện tại" → return null
  if (!location.pathname.includes('/project/')) {
    return null;
  }

  // Fallback: URL có /project/ nhưng không có ID (rare case)
  const link = document.querySelector('a[href*="/project/"]');
  if (link) {
    const m = link.href.match(/\/project\/([a-f0-9-]+)/);
    if (m) return m[1];
  }
  return null;
}

/**
 * U-1.1: Tìm tile bằng file_id (persistent, không đổi khi reload)
 */
function findTileByFileId(fileId) {
  if (!fileId) return null;
  const link = document.querySelector(`a[href*="/edit/${fileId}"]`);
  return link ? link.closest('[data-tile-id]') : null;
}

/**
 * U-1.5: Extract project_name từ Flow header input
 * CRITICAL: Chỉ extract khi đang ở trong project (URL có /project/{id})
 * Không extract khi ở homepage để tránh nhầm input khác làm project name
 */
function extractProjectName() {
  // Guard: chỉ extract project name khi đang ở trong project
  if (!location.pathname.match(/\/project\/[a-f0-9-]+/)) {
    return null;
  }

  // Tìm input project name trong header
  // Flow header input: aria-label varies by language (vi: "Văn bản có thể chỉnh sửa", en: "Editable text")
  // Nằm NGOÀI:
  // - tile container ([data-tile-id])
  // - dialog/popup ([role="dialog"])
  // - Slate prompt editor area (div[data-slate-editor])
  const inputs = _queryInputsByAriaLabels(_ARIA_LABELS.editableText);
  const slateEditor = document.querySelector('div[data-slate-editor="true"]');
  // [Phase 3] Prompt container: bỏ hardcode hash `.sc-45319f81-0`.
  //   Walk-up tìm container CHỨA editor (đảm bảo container chứa cả ref images).
  //   Limit 6 levels — Flow nest editor không quá sâu.
  let promptContainer = null;
  if (slateEditor) {
    let probe = slateEditor.parentElement;
    for (let i = 0; i < 6 && probe; i++) {
      // Container "đúng" là parent có chứa nhiều element (>1 child) — không phải wrapper bare
      if (probe.children.length > 1) { promptContainer = probe; break; }
      probe = probe.parentElement;
    }
    // Fallback: 3-level parent (như cũ) nếu walk-up không tìm
    if (!promptContainer) {
      promptContainer = slateEditor.parentElement?.parentElement?.parentElement;
    }
  }

  for (const input of inputs) {
    // Bỏ qua input rename file nằm trong tile container
    if (input.closest('[data-tile-id]')) continue;
    // Bỏ qua input trong dialog/popup
    if (input.closest('[role="dialog"]')) continue;
    // Bỏ qua input nằm trong prompt area (Slate editor container)
    if (promptContainer && promptContainer.contains(input)) continue;
    // Bỏ qua input nằm trong cùng parent với Slate editor (extra safety)
    if (slateEditor && input.closest('[data-slate-editor]')) continue;

    const val = input.value?.trim();
    if (val) return val;
  }

  // Fallback: extract từ document.title
  // Format: "Flow - Project Name" hoặc "Project Name - Flow - Labs"
  const title = document.title;
  if (title) {
    const parts = title.split(/\s*[-–—|]\s*/);
    // Tìm phần KHÔNG phải generic text (Flow, Labs, Google...)
    for (const part of parts) {
      const candidate = part.trim();
      if (!candidate || candidate.length === 0 || candidate.length >= 100) continue;
      const lower = candidate.toLowerCase();
      if (lower === 'flow' || lower === 'labs' || lower.includes('labs.google')
        || lower.includes('google')) continue;
      return candidate;
    }
  }

  return null;
}

// Lấy danh sách tile IDs duy nhất trên trang (Google Flow render mỗi tile-id 2 lần trong DOM)
// forceRefresh: true để query DOM mới nhất (dùng trong polling loop), false để dùng cache
function getUniqueTileIds(forceRefresh = false) {
  if (forceRefresh) {
    _invalidateTileCache();
  }
  const tiles = _getCachedTiles();
  return [...new Set([...tiles].map(t => t.dataset.tileId).filter(Boolean))];
}

/**
 * Snapshot tất cả file_name UUIDs hiện có trên page.
 * file_name là persistent (không đổi qua session), dùng để phân biệt
 * tiles cũ lazy-load (file_name đã biết) vs tiles thực sự mới tạo.
 *
 * Tối ưu: batch query tất cả elements có getMediaUrlRedirect URL cùng lúc,
 * thay vì gọi extractFileName() per tile (3 querySelectorAll mỗi cache miss).
 * Reuse extractFileNameFromUrl() để giữ nguyên tất cả URL patterns (simple + tRPC).
 */
function getExistingFileNames() {
  const fileNameSet = new Set();
  // Batch query: tìm tất cả elements có src hoặc href chứa getMediaUrlRedirect
  const mediaEls = document.querySelectorAll(
    '[src*="getMediaUrlRedirect"], [href*="getMediaUrlRedirect"]'
  );
  for (const el of mediaEls) {
    const url = el.src || el.href || '';
    const fn = extractFileNameFromUrl(url);
    if (fn) fileNameSet.add(fn);
  }
  return fileNameSet;
}

/**
 * Kiểm tra tile đã thực sự complete (có file_name)
 * QUAN TRỌNG: Google Flow tạo tile_id ngay khi bắt đầu upload/gen,
 * nhưng file_name (UUID) chỉ có SAU khi server xử lý xong.
 *
 * @param {Element} tile - DOM element có data-tile-id
 * @returns {boolean} - true nếu tile có file_name (complete)
 */
function isTileComplete(tile) {
  if (!tile) return false;
  const fileName = extractFileName(tile);
  return !!fileName;
}

/**
 * Validate tile_id có đúng file (cross-project safety)
 * @param {string} tileId - tile_id cần validate
 * @param {string} expectedFileName - file_name mong đợi
 * @returns {boolean} - true nếu match hoặc không có expected để check
 */
function validateTileFile(tileId, expectedFileName) {
  if (!expectedFileName) return true; // Không có expected → accept
  const tile = _getTileById(tileId);
  if (!tile) return false;
  const currentFileName = extractFileName(tile);
  if (!currentFileName) return true; // Tile chưa complete → accept tạm
  return currentFileName === expectedFileName;
}

/**
 * Click nút "Thử lại" (refresh icon) trên tile bị fail.
 * Dùng React onClick trực tiếp (qua __reactProps$) giống bridge submit.
 * @param {string} tileId - data-tile-id của tile fail
 * @returns {boolean} true nếu tìm & click được nút retry
 */
function clickTileRetryButton(tileId) {
  const tile = _getTileById(tileId);
  if (!tile) return false;

  // Tìm nút có icon "refresh" (Thử lại)
  const buttons = tile.querySelectorAll('button');
  let retryBtn = null;
  for (const btn of buttons) {
    const icon = btn.querySelector('i.google-symbols');
    if (icon && icon.textContent.trim() === 'refresh') {
      retryBtn = btn;
      break;
    }
  }
  if (!retryBtn) return false;

  // Ưu tiên React onClick trực tiếp (bypass DOM event system)
  const propsKey = Object.keys(retryBtn).find(k => k.startsWith('__reactProps$'));
  if (propsKey && retryBtn[propsKey] && typeof retryBtn[propsKey].onClick === 'function') {
    try {
      retryBtn[propsKey].onClick({
        preventDefault: function(){},
        stopPropagation: function(){},
        nativeEvent: new MouseEvent('click'),
        type: 'click',
        target: retryBtn,
        currentTarget: retryBtn
      });
      return true;
    } catch (e) {
      console.warn('[TobyFlow] React onClick retry failed:', e.message);
    }
  }

  // Fallback: native click
  simulateClick(retryBtn);
  return true;
}

// Deduplication lock: track tiles đang được retry để tránh concurrent retry cùng tile
var _retryingTiles = new Set();

// Track tiles đã click retry button — ngăn click lại cùng tile khi waitForNewTiles timeout
// Khi timeout, tile gốc vẫn 'failed' trên DOM nhưng Flow đã tạo tile MỚI đang xử lý.
// Click lại sẽ tạo thêm tile DƯ (double generation). Set này ngăn điều đó.
var _clickedRetryTileIds = new Set();

// Global mutex cho retry operations: serialize tất cả retries để tránh cross-contamination
var _retryMutex = null;

/**
 * Acquire retry mutex - đảm bảo chỉ 1 retry operation chạy tại 1 thời điểm
 * @returns {Promise<Function>} Release function
 */
async function _acquireRetryMutex() {
  // Timeout safety: nếu mutex bị stuck > 120s, force release
  const maxWait = 120000;
  const startWait = Date.now();
  while (_retryMutex) {
    if (Date.now() - startWait > maxWait) {
      console.warn('[TobyFlow] Retry mutex stuck > 120s, force release');
      _retryMutex = null;
      break;
    }
    await _retryMutex;
  }
  let release;
  _retryMutex = new Promise(r => { release = r; });
  return () => {
    release();
    _retryMutex = null;
  };
}

/**
 * Retry failed tiles bằng cách click nút "Thử lại" trên từng tile.
 * Chờ tile chuyển từ 'processing' → 'success'/'failed'.
 * SERIAL: Click từng tile, chờ kết quả, rồi click tile tiếp theo.
 * @param {string[]} failedTileIds - Danh sách tile IDs bị fail
 * @param {number} timeoutMs - Timeout chờ mỗi tile (ms)
 * @returns {{ succeeded: string[], stillFailed: string[] }}
 */
async function retryFailedTilesViaButton(failedTileIds, timeoutMs = 120000, excludeTileIds = null) {
  const succeeded = [];
  const stillFailed = [];
  let clickedCount = 0;       // Số button retry đã thực sự click trong call này
  let skippedAlreadyClicked = 0; // Số tile skip vì đã click trước đó

  // DEDUPLICATION: Filter out tiles đang được retry bởi call khác
  // VÀ tiles đã click retry (ngăn double-click khi timeout)
  const toRetry = failedTileIds.filter(tid => !_retryingTiles.has(tid) && !_clickedRetryTileIds.has(tid));
  const alreadyClicked = failedTileIds.filter(tid => _clickedRetryTileIds.has(tid));
  skippedAlreadyClicked = alreadyClicked.length;
  if (alreadyClicked.length > 0) {
    console.log(`[TobyFlow] ${alreadyClicked.length} tile đã click retry trước đó (skip để tránh tạo dư):`, alreadyClicked.map(t => t.substring(0, 12)));
    // Tiles đã click retry nhưng timeout → không tính là stillFailed (đang xử lý trên Flow)
    // Không push vào stillFailed để tránh outer loop re-click
  }
  if (toRetry.length === 0) {
    console.log('[TobyFlow] Tất cả tiles đã đang được retry hoặc đã click retry, skip');
    return {
      succeeded: [],
      stillFailed: failedTileIds.filter(tid => !_clickedRetryTileIds.has(tid)),
      clickedCount: 0,
      skippedAlreadyClicked,
    };
  }

  // Mark tiles as retrying (lock)
  toRetry.forEach(tid => _retryingTiles.add(tid));

  const excludeSet = excludeTileIds?.length > 0 ? new Set(excludeTileIds) : null;

  // Acquire global retry mutex: serialize tất cả retries across concurrent calls
  // Ngăn race condition khi multiple TileMonitors gọi retry đồng thời
  const releaseMutex = await _acquireRetryMutex();

  try {
    // SERIAL RETRY FIX: Click từng tile riêng lẻ, chờ kết quả, rồi click tile tiếp theo
    // Lý do: Batch click + waitForNewTiles gây cross-contamination trong parallel mode
    // vì không thể phân biệt tile nào thuộc retry nào khi nhiều retries chạy đồng thời
    for (const tileId of toRetry) {
      if (shouldStop) {
        stillFailed.push(tileId);
        continue;
      }

      // Bug fix: Re-check status TRƯỚC khi click retry — Flow đôi khi flicker UI
      // 'failed' transient (vd loading state) trước khi thực sự render 'success'.
      // Nếu tile giờ đã success → skip click (tránh tạo retry tile dư thừa).
      const currentTile = _getTileById(tileId);
      const currentStatus = detectTileStatus(currentTile);
      if (currentStatus === 'success') {
        console.log(`[TobyFlow] Retry skipped: tile ${tileId.substring(0, 12)}... đã success (transient 'failed' state)`);
        succeeded.push(tileId);
        continue;
      }
      if (currentStatus === 'processing') {
        console.log(`[TobyFlow] Retry skipped: tile ${tileId.substring(0, 12)}... đang processing`);
        // Không push stillFailed vì có thể tile đang resolve → tránh outer loop click thêm
        continue;
      }

      // Snapshot baseline TRƯỚC khi click retry tile này
      // forceRefresh=true vì cần baseline chính xác trước khi click
      const preTileIds = getUniqueTileIds(true);
      const preFileNames = getExistingFileNames();

      const clicked = clickTileRetryButton(tileId);
      if (!clicked) {
        console.warn('[TobyFlow] Retry button not found for tile:', tileId);
        stillFailed.push(tileId);
        continue;
      }

      // Track tile đã click retry — ngăn click lại nếu timeout
      _clickedRetryTileIds.add(tileId);
      clickedCount++;

      sendLog(`[Retry L1] Click nút retry tile...`, 'info');

      // Wait retry tile xuất hiện + settle. waitForNewTiles ĐÃ:
      //   1. Poll DOM cho tile mới appear (qua MutationObserver + interval)
      //   2. Wait status settle ('success'/'failed' với file_name)
      //   3. Return khi allDone HOẶC timeout
      // Trong fail-prone hour, Flow có thể tạo retry tile rất chậm (100-200s) → cần
      // timeout đủ lớn. Dùng `timeoutMs` từ caller (TileMonitor pass `this._timeout=180000`)
      // để tránh duplicate phase wait redundant.
      const retryTimeout = Math.max(timeoutMs, 180000);
      const result = await waitForNewTiles(preTileIds, retryTimeout, preFileNames);
      let newTiles = result?.tiles || [];
      if (excludeSet && newTiles.length > 0) {
        newTiles = newTiles.filter(tid => !excludeSet.has(tid));
      }

      // Chỉ lấy 1 tile mới nhất (đây là tile từ retry này, lấy oldest = slice(-1))
      if (newTiles.length > 1) {
        console.log(`[TobyFlow] Retry single tile got ${newTiles.length} tiles, taking oldest`);
        newTiles = newTiles.slice(-1);
      }

      if (newTiles.length > 0) {
        const newTileId = newTiles[0];
        // waitForNewTiles ĐÃ wait settle internally — chỉ return tile khi allDone (status =
        // 'success'/'failed' + có file_name). Status check tại đây an toàn, không cần wait
        // settle thêm (redundant, cause confusion). Xem content.js:2812-2834.
        const tile = _getTileById(newTileId);
        const status = detectTileStatus(tile);
        if (status === 'failed') {
          stillFailed.push(newTileId);
          console.log(`[TobyFlow] Retry tile ${tileId.substring(0, 12)}... → new tile ${newTileId.substring(0, 12)}... FAILED`);
        } else if (status === 'success') {
          succeeded.push(newTileId);
          console.log(`[TobyFlow] Retry tile ${tileId.substring(0, 12)}... → new tile ${newTileId.substring(0, 12)}... SUCCESS`);
        } else {
          // Defensive: status='processing' không nên xảy ra (waitForNewTiles đã settle),
          // nhưng nếu Flow update DOM bất ngờ → coi như stillFailed an toàn.
          stillFailed.push(newTileId);
          console.log(`[TobyFlow] Retry tile ${tileId.substring(0, 12)}... → new tile ${newTileId.substring(0, 12)}... unexpected PROCESSING status, treat as failed`);
        }
      } else {
        // Cả phase 1 + phase 2 đều timeout (tổng ~120s) → Flow thực sự không tạo tile mới
        // (có thể Flow throttle hoặc tile bị lỗi nội bộ).
        // KHÔNG push vào stillFailed → ngăn outer loop click retry LẦN NỮA trên tile này
        // (click lại sẽ tạo THÊM 1 tile dư — double generation).
        // _clickedRetryTileIds đã track tile này, lần gọi tiếp sẽ skip.
        console.log(`[TobyFlow] Retry tile ${tileId.substring(0, 12)}... → cả 2 phase timeout (~120s), skip để tránh tạo dư`);
      }

      // Delay nhỏ trước khi retry tile tiếp theo
      if (toRetry.indexOf(tileId) < toRetry.length - 1) {
        await sleep(300);
      }
    }

    // Xóa duplicate (nếu có)
    const uniqueSucceeded = [...new Set(succeeded)];
    const uniqueFailed = [...new Set(stillFailed)];

    return {
      succeeded: uniqueSucceeded,
      stillFailed: uniqueFailed,
      clickedCount,           // Số button retry đã thực sự click trong call này
      skippedAlreadyClicked,  // Số tile skip vì đã click trước đó
    };

  } finally {
    // Release lock: xóa tiles khỏi retrying set
    toRetry.forEach(tid => _retryingTiles.delete(tid));
    // Release global retry mutex
    releaseMutex();
  }
}

// Detect trạng thái tile trên Google Flow
// Returns: 'success' | 'failed' | 'processing'
// CRITICAL: Check warning icon TRƯỚC img/video — failed tiles có thể có cached <img>
// Processing tiles pre-render warning icon hidden (opacity:0) - must check visibility
function detectTileStatus(tileEl) {
  if (!tileEl) return 'processing';

  // Kiểm tra cache (TTL 1.5 giây) — giảm 4+ DOM queries/tile khi gọi từ nhiều polling loops
  var _statusTileId = tileEl.dataset?.tileId;
  if (_statusTileId) {
    var _cached = _statusCache.get(_statusTileId);
    if (_cached && (Date.now() - _cached.ts) < 1500) return _cached.status;
  }

  // 1. Check success TRƯỚC — có media với src hợp lệ
  const media = tileEl.querySelector('video') || tileEl.querySelector('img');
  if (media && media.src && !media.src.startsWith('data:')) {
    const mediaSrc = media.src || '';
    const rawSrc = media.getAttribute('src') || '';
    const isPlaceholder =
      mediaSrc.includes('media.html') ||
      mediaSrc.endsWith('.html') ||
      rawSrc === 'media.html' ||
      rawSrc.endsWith('.html') ||
      (!mediaSrc.startsWith('http://') && !mediaSrc.startsWith('https://') && !mediaSrc.startsWith('blob:'));
    if (!isPlaceholder) {
      if (_statusTileId) _statusCache.set(_statusTileId, { status: 'success', ts: Date.now() });
      return 'success';
    }
  }

  // [Bug fix 2026-05-10] Early detect 'processing' via progress % marker.
  //   flow-tile-generating.md: tile có "<div>N%</div>" khi đang gen.
  //   Tile cũ không có element này → safe filter.
  //
  // CRITICAL ORDER: Check % TRƯỚC warning (bước 3 dưới) vì:
  //   1. Tile transitional (vừa fail xong, đang re-gen — xem flow-tile-generating.md)
  //      có CẢ % VÀ warning icon (warning bị ẩn opacity:0). Phải return 'processing'
  //      đúng, không nhầm 'failed'.
  //   2. % marker rẻ hơn warning hidden-detect (warning cần walk parents check opacity).
  //   3. Resilient hơn nếu Flow đổi cách hide warning (CSS animation thay vì opacity:0).
  // KHÔNG ĐẢO THỨ TỰ này.
  //
  // Filter `children.length > 2` align với extractTileProgress (line ~2882) — tránh
  // div ancestor có textContent ngẫu nhiên match "X%" (defensive nếu Flow đổi DOM).
  const progressEl = Array.from(tileEl.querySelectorAll('div')).find(d => {
    if (d.children.length > 2) return false;
    return /^\d+%$/.test(d.textContent.trim());
  });
  if (progressEl) {
    if (_statusTileId) _statusCache.set(_statusTileId, { status: 'processing', ts: Date.now() });
    return 'processing';
  }

  // 2. Check failed — warning icon visible (chỉ khi chưa có media hợp lệ)
  // CRITICAL: Dùng getComputedStyle vì Google Flow có thể dùng CSS class để ẩn warning icon
  const warningSelector = '.google-symbols';
  const warningIcons = tileEl.querySelectorAll(warningSelector);
  for (const icon of warningIcons) {
    if (icon.textContent.trim() !== 'warning') continue;

    // CRITICAL: Check icon element itself TRƯỚC, không chỉ parents
    // Google Flow có thể hide icon trực tiếp bằng opacity/visibility/display
    let isHidden = false;
    try {
      const iconComputed = window.getComputedStyle(icon);
      if (iconComputed.opacity === '0' || iconComputed.visibility === 'hidden' || iconComputed.display === 'none') {
        isHidden = true;
      }
    } catch (e) { /* ignore */ }

    // Walk up parents to check if hidden (opacity:0, visibility:hidden, display:none)
    if (!isHidden) {
      let parent = icon.parentElement;
      while (parent && parent !== tileEl) {
        // Check inline style first (fast path)
        if (parent.style && parent.style.opacity === '0') {
          isHidden = true;
          break;
        }
        // Check computed style (covers CSS class)
        try {
          const computed = window.getComputedStyle(parent);
          if (computed.opacity === '0' || computed.visibility === 'hidden' || computed.display === 'none') {
            isHidden = true;
            break;
          }
        } catch (e) { /* ignore */ }
        parent = parent.parentElement;
      }
    }

    if (!isHidden) {
      // KHÔNG cache 'failed' — có thể là false positive khi tile đang processing
      // MIN_FAIL_DETECT_MS đã handle việc chờ đủ lâu trong waitForNewTiles
      return 'failed';
    }
  }

  // Không cache 'processing' — trạng thái tạm thời, cần kiểm tra lại nhanh
  return 'processing';
}

/**
 * MRC-3.4.1: Detect media type của tile (image hoặc video)
 * @param {Element} tile - Tile DOM element
 * @returns {string} - 'image' | 'video'
 */
function detectMediaType(tile) {
  if (!tile) return 'image';
  // Ưu tiên video trước — video tiles có cả <img> (ref) lẫn <video> (result)
  const video = tile.querySelector('video');
  if (video) return 'video';
  return 'image';
}

// Đọc % tiến độ gen từ DOM tile (heuristic: tìm element chứa "NN%")
function extractTileProgress(tileEl) {
  if (!tileEl) return null;
  // Chỉ scan các tag phổ biến chứa text — giảm ~80% elements so với querySelectorAll('*')
  var els = tileEl.querySelectorAll('span, div, p');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    // Chỉ check leaf nodes hoặc nodes có ít children (tránh parent match children text)
    if (el.children.length > 2) continue;
    var text = el.textContent.trim();
    if (/^\d{1,3}%$/.test(text)) {
      return parseInt(text, 10);
    }
  }
  return null;
}

async function waitForNewTiles(preTileIds, timeoutMs = 120000, preFileNames = null, maxQuantity = 0) {
  const startTime = Date.now();
  const MIN_FAIL_DETECT_MS = 15000;
  const LAZY_LOAD_GRACE_MS = 15000; // Chờ 15s trước khi chấp nhận tiles "success" ngay lập tức
  const preTileSet = new Set(preTileIds);
  const knownFileNames = preFileNames || new Set();

  // Layer 3: Track tiles đã xác nhận là genuinely new (từng thấy ở trạng thái "processing")
  // Tiles genuinely new: Google Flow tạo placeholder (processing) → rồi chuyển success
  // Tiles lazy-loaded: xuất hiện đã có ảnh (success ngay), chưa bao giờ ở processing
  let confirmedNewTiles = null; // null = chưa xác nhận, Set = đã lock tiles chính xác
  let firstNewDetectedAt = 0;   // Thời điểm phát hiện tile mới lần đầu

  // P3-1: MutationObserver phát hiện DOM thay đổi nhanh hơn polling
  // Khi observer fire, đánh dấu pendingCheck để check ngay ở cycle tiếp theo
  let pendingCheck = false;
  const tileContainer = document.querySelector('[data-tile-id]')?.parentElement || document.body;
  const observer = new MutationObserver(() => {
    pendingCheck = true;
  });
  observer.observe(tileContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'src', 'data-tile-id']
  });

  // Dọn dẹp observer khi function kết thúc
  const cleanup = () => { observer.disconnect(); };

  try {
  while (Date.now() - startTime < timeoutMs) {
    if (shouldStop) { cleanup(); return { tiles: [], failed: false }; }

    // Nếu observer phát hiện thay đổi DOM, chờ 200ms để DOM ổn định rồi check ngay
    // Nếu không có thay đổi, poll fallback mỗi 5s (giảm từ 2s nhờ observer cover fast detection)
    if (pendingCheck) {
      pendingCheck = false;
      await sleep(200);
    } else {
      await sleep(5000);
    }

    // forceRefresh=true vì đây là polling loop cần data mới nhất từ DOM
    const currentTiles = getUniqueTileIds(true);
    let newTiles = currentTiles.filter(id => !preTileSet.has(id));

    if (newTiles.length > 0) {
      // Layer 2: Lọc tiles cũ lazy-load bằng file_name (persistent UUID)
      if (knownFileNames.size > 0) {
        newTiles = newTiles.filter(tid => {
          const tile = _getTileById(tid);
          const fn = extractFileName(tile);
          return !fn || !knownFileNames.has(fn);
        });
        if (newTiles.length === 0) continue;
      }

      // Layer 3: Xác nhận tiles genuinely new bằng processing state
      if (confirmedNewTiles === null) {
        if (!firstNewDetectedAt) firstNewDetectedAt = Date.now();

        // Tìm tiles đang processing (genuinely new — Google Flow vừa tạo placeholder)
        const processingTiles = newTiles.filter(tid => {
          const tile = _getTileById(tid);
          return detectTileStatus(tile) !== 'success';
        });

        // Tìm tiles đã success nhưng file_name mới (genuinely new, hoàn thành nhanh trước poll)
        // Nếu file_name không nằm trong baseline → chắc chắn là kết quả mới, không phải lazy-load
        const fastCompletedTiles = newTiles.filter(tid => {
          if (processingTiles.includes(tid)) return false;
          const tile = _getTileById(tid);
          const fn = extractFileName(tile);
          return fn && knownFileNames.size > 0 && !knownFileNames.has(fn);
        });

        if (processingTiles.length > 0 || fastCompletedTiles.length > 0) {
          // Lock tiles genuinely new (processing hoặc fast-completed với file_name mới)
          confirmedNewTiles = new Set([...processingTiles, ...fastCompletedTiles]);
        } else if (Date.now() - firstNewDetectedAt > LAZY_LOAD_GRACE_MS) {
          // Đã chờ đủ lâu mà chỉ thấy "success" tiles → chấp nhận (fast generation edge case)
          confirmedNewTiles = new Set(newTiles);
        } else {
          // Chỉ thấy "success" tiles → có thể lazy-load, chờ thêm processing tiles
          continue;
        }
      } else {
        // Nếu có tile mới xuất hiện (thêm vào confirmed set)
        for (const tid of newTiles) {
          if (confirmedNewTiles.has(tid)) continue;
          const tile = _getTileById(tid);
          if (detectTileStatus(tile) !== 'success') {
            // Tile đang processing → genuinely new
            confirmedNewTiles.add(tid);
          } else {
            // Tile đã success: check file_name mới (fast-completed, không phải lazy-load)
            const fn = extractFileName(tile);
            if (fn && knownFileNames.size > 0 && !knownFileNames.has(fn)) {
              confirmedNewTiles.add(tid);
            }
          }
        }
      }

      // Chỉ track confirmed tiles
      newTiles = newTiles.filter(id => confirmedNewTiles.has(id));
      if (newTiles.length === 0) continue;

      // maxQuantity: giới hạn tiles cho parallel nodes
      // Google Flow DOM là newest-first → tile mới nhất ở ĐẦU, cũ nhất ở CUỐI
      // Submit mutex serialize: node_01 submit TRƯỚC → tile_A CŨ hơn → nằm ở CUỐI list
      // → slice(-maxQuantity) lấy tiles CŨ nhất = tiles của node submit SỚM nhất
      if (maxQuantity > 0 && newTiles.length > maxQuantity) {
        newTiles = newTiles.slice(-maxQuantity);
      }

      // Check completion status
      // QUAN TRỌNG: tile chỉ "complete" khi có file_name (UUID)
      // file_name chỉ có sau khi upload/gen thực sự hoàn thành trên server
      // PHẢI chờ TẤT CẢ tiles settle (không còn processing) trước khi return
      const elapsed = Date.now() - startTime;
      let allDone = true;
      let anyFailed = false;
      for (const tid of newTiles) {
        const tile = _getTileById(tid);
        const status = detectTileStatus(tile);
        if (status === 'failed' && elapsed >= MIN_FAIL_DETECT_MS) { anyFailed = true; continue; }
        if (status === 'processing' || (status === 'failed' && elapsed < MIN_FAIL_DETECT_MS)) { allDone = false; break; }
        // Check file_name exists (true completion indicator)
        const fileName = extractFileName(tile);
        if (!fileName && status === 'success') {
          // Tile hiển thị success nhưng chưa có file_name → chưa thực sự complete
          allDone = false;
          break;
        }
      }
      // Chờ tất cả tiles settle trước khi return failed (tránh return sớm khi còn tile processing)
      if (anyFailed && allDone) { cleanup(); return { tiles: newTiles, failed: true }; }
      if (!anyFailed && allDone) {
        // Capture thumbnail URLs + file_name (persistent across sessions)
        const thumbnails = {};
        for (const tid of newTiles) {
          const tile = _getTileById(tid);
          if (!tile) continue;
          const img = tile.querySelector('img');
          let video = tile.querySelector('video');

          // CRITICAL: Video element có thể render SAU khi tile status = 'success'
          // Google Flow lazy-render video element — poll tối đa 3 giây để chờ video xuất hiện
          // Chỉ poll khi chưa tìm thấy video và chưa có img src rõ ràng (có thể là video tile)
          if (!video) {
            const pollVideoStart = Date.now();
            const POLL_VIDEO_TIMEOUT = 3000; // 3 giây max wait
            const POLL_VIDEO_INTERVAL = 300; // Poll mỗi 300ms
            while (!video && Date.now() - pollVideoStart < POLL_VIDEO_TIMEOUT) {
              await sleep(POLL_VIDEO_INTERVAL);
              video = tile.querySelector('video');
            }
            if (video) {
              sendLog('[waitForNewTiles] Đã phát hiện <video> sau ' + (Date.now() - pollVideoStart) + 'ms delay', 'info');
            }
          }

          const fileName = extractFileName(tile);
          const flowInfo = extractFlowFileInfo(tile);
          // Video detection: ưu tiên check <video> trước
          if (video) {
            // CRITICAL: Poll để chờ video.src có giá trị hợp lệ
            // Google Flow lazy-load video src — element xuất hiện trước, src xuất hiện sau
            let videoUrl = video.src || video.currentSrc || '';
            if (!videoUrl || videoUrl.length < 10) {
              const pollSrcStart = Date.now();
              const POLL_SRC_TIMEOUT = 3000; // 3 giây max wait cho src
              const POLL_SRC_INTERVAL = 200;
              while ((!videoUrl || videoUrl.length < 10) && Date.now() - pollSrcStart < POLL_SRC_TIMEOUT) {
                await sleep(POLL_SRC_INTERVAL);
                videoUrl = video.src || video.currentSrc || '';
              }
              if (videoUrl && videoUrl.length > 10) {
                sendLog('[waitForNewTiles] Video src loaded sau ' + (Date.now() - pollSrcStart) + 'ms: ' + videoUrl.substring(0, 60), 'info');
              }
            }

            // Resolve relative URL thành absolute (Google Flow dùng relative /fx/api/...)
            if (videoUrl && !videoUrl.startsWith('http')) {
              try {
                videoUrl = new URL(videoUrl, window.location.origin).href;
              } catch (e) {
                console.warn('[waitForNewTiles] Cannot resolve video URL:', videoUrl);
              }
            }

            // video_url: actual video URL để backend gửi qua Telegram
            // thumbnail: poster image hoặc fallback
            let vThumb = video.poster || '';
            if (!vThumb && img?.src && !img.src.includes('chrome-extension')) vThumb = img.src;
            if (!vThumb && videoUrl) vThumb = videoUrl; // Fallback: dùng video URL làm thumbnail
            thumbnails[tid] = {
              thumbnail: vThumb,
              type: 'video',
              video_url: videoUrl,  // Actual video URL để backend download + gửi qua Telegram
              ...(fileName && { file_name: fileName }),
              ...(flowInfo && { file_id: flowInfo.file_id, project_id: flowInfo.project_id })
            };
          } else if (img?.src && !img.src.includes('chrome-extension')) {
            thumbnails[tid] = { thumbnail: img.src, type: 'image', ...(fileName && { file_name: fileName }), ...(flowInfo && { file_id: flowInfo.file_id, project_id: flowInfo.project_id }) };
          }
        }
        cleanup();
        return { tiles: newTiles, failed: false, thumbnails };
      }
    }
  }
  cleanup();
  return { tiles: [], failed: false };
  } catch (err) {
    // Đảm bảo observer luôn được disconnect kể cả khi có lỗi
    cleanup();
    throw err;
  }
}

/**
 * Wait for new tiles after submit and optionally auto-download
 */
async function waitAndDownloadNewTiles(preTileIds, promptText, timeoutMs = 120000) {
  const startTime = Date.now();
  const MIN_FAIL_DETECT_MS = 15000;
  while (Date.now() - startTime < timeoutMs) {
    await sleep(2000);
    // forceRefresh=true vì đây là polling loop cần data mới nhất từ DOM
    const currentTiles = getUniqueTileIds(true);
    const newTiles = currentTiles.filter(id => !preTileIds.includes(id));

    if (newTiles.length > 0) {
      const elapsed = Date.now() - startTime;
      let allDone = true;
      let anyFailed = false;
      for (const tid of newTiles) {
        const tile = _getTileById(tid);
        const status = detectTileStatus(tile);
        if (status === 'failed' && elapsed >= MIN_FAIL_DETECT_MS) { anyFailed = true; }
        if (status === 'processing' || (status === 'failed' && elapsed < MIN_FAIL_DETECT_MS)) { allDone = false; break; }
      }

      if (anyFailed) {
        sendLog('❌ Google Flow báo lỗi - tạo ảnh thất bại', 'error');
        return [];
      }

      if (allDone) {
        for (const tid of newTiles) {
          await downloadTileMedia(tid, promptText);
          await sleep(150);
        }
        return newTiles;
      }
    }
  }
  sendLog('⚠️ Timeout chờ kết quả để tải', 'warn');
  return [];
}

/**
 * Send browser notification and optional sound when tasks complete
 */
async function notifyCompletion(title, body) {
  const settings = await new Promise(resolve => {
    chrome.storage.local.get(['af_settings'], (res) => resolve(res.af_settings || {}));
  });

  if (settings.notifyOnComplete !== false) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, { body });
      }
    }
  }

  if (settings.notifySound) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }
}

/**
 * Cached settings from chrome.storage (loaded on startup, updated on storage change)
 * [Fix] Thêm inputTimeout, delayBetweenPrompts, randomDelayMin/Max để content.js có thể dùng
 */
window._afSettings = {
  humanizedMode: false, humanizedSpeed: 0.5,
  defaultGenType: 'Image', defaultRatio: '9:16',
  defaultImageModel: 'Nano Banana 2', defaultVideoModel: 'Veo 3.1 - Fast',
  // [Fix] Thêm timing settings - trước đây đọc từ DOM (không tồn tại trong Flow tab)
  inputTimeout: 1200,
  delayBetweenPrompts: 5,
  randomDelayMin: 3,
  randomDelayMax: 10,
  execTimeout: 180
};

// Load settings from chrome.storage and cache
(function loadAfSettings() {
  chrome.storage.local.get(['af_settings'], (result) => {
    const s = result.af_settings || {};
    window._afSettings = {
      ...window._afSettings,
      humanizedMode: s.humanizedMode || false,
      humanizedSpeed: parseFloat(s.humanizedSpeed) || 0.5,
      defaultGenType: s.defaultGenType || 'Image',
      defaultRatio: s.defaultRatio || '9:16',
      defaultImageModel: s.defaultImageModel || 'Nano Banana 2',
      defaultVideoModel: s.defaultVideoModel || 'Veo 3.1 - Fast',
      // [Fix] Load timing settings từ storage
      inputTimeout: parseInt(s.inputTimeout) || 1200,
      delayBetweenPrompts: parseInt(s.delayBetweenPrompts) || 5,
      randomDelayMin: parseInt(s.randomDelayMin) || 3,
      randomDelayMax: parseInt(s.randomDelayMax) || 10,
      execTimeout: parseInt(s.execTimeout) || 180
    };
  });
})();

// Listen for storage changes to keep cache in sync
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.af_settings) {
    const s = changes.af_settings.newValue || {};
    window._afSettings = {
      ...window._afSettings,
      humanizedMode: s.humanizedMode || false,
      humanizedSpeed: parseFloat(s.humanizedSpeed) || 0.5,
      defaultGenType: s.defaultGenType || 'Image',
      defaultRatio: s.defaultRatio || '9:16',
      defaultImageModel: s.defaultImageModel || 'Nano Banana 2',
      defaultVideoModel: s.defaultVideoModel || 'Veo 3.1 - Fast',
      // [Fix] Sync timing settings khi storage thay đổi
      inputTimeout: parseInt(s.inputTimeout) || 1200,
      delayBetweenPrompts: parseInt(s.delayBetweenPrompts) || 5,
      randomDelayMin: parseInt(s.randomDelayMin) || 3,
      randomDelayMax: parseInt(s.randomDelayMax) || 10,
      execTimeout: parseInt(s.execTimeout) || 180
    };
  }
});

/**
 * Kiểm tra Humanized Mode có đang bật không
 * Reads from af_settings (set by Settings page)
 */
function isHumanizedEnabled() {
  return window._afSettings?.humanizedMode || false;
}

/**
 * Lấy tốc độ humanized speed multiplier
 * 0.5 = chậm (tự nhiên hơn), 2.0 = nhanh
 */
function getHumanizedSpeed() {
  return window._afSettings?.humanizedSpeed || 0.5;
}

/**
 * Trả về delay với jitter ngẫu nhiên +-30% và áp dụng speed multiplier
 * speed < 1 = chậm hơn (tự nhiên hơn), speed > 1 = nhanh hơn
 */
function getHumanizedDelay(baseMs) {
  const speed = getHumanizedSpeed();
  const adjusted = baseMs / speed;
  const jitter = adjusted * 0.3;
  return adjusted + (Math.random() * 2 - 1) * jitter;
}

/**
 * Inject Slate Bridge vào main world (page context).
 * Content script chạy trong isolated world → không truy cập được React internals.
 * Bridge script chạy trong main world → truy cập React fiber → lấy Slate editor instance.
 * Giao tiếp qua CustomEvent.
 */
// Slate bridge giờ là file riêng (slate-bridge.js) chạy trong main world via manifest.json
// Không cần inject inline script nữa (CSP chặn inline scripts trên labs.google)
function injectSlateBridge() {
  // No-op: bridge đã được load tự động qua manifest content_scripts world: MAIN
}

/**
 * Call Slate API via bridge (main world) — returns Promise<{success, error?}>
 * Dùng window.postMessage vì CustomEvent.detail bị stripped giữa isolated ↔ main world.
 */
/**
 * Phase FAR-1: Silent session refresh — re-auth OAuth Bearer token mà KHÔNG full reload.
 * Trigger Next.js re-fetch session data qua slate-bridge `refreshSession` action.
 * Tham khảo plan docs/plans/flow-auto-retry-plan.md Section 3.1.
 *
 * Telemetry: log success/fail rate + duration để monitor real-world effectiveness.
 * Trigger sources:
 *   - Background alarm (mỗi N phút, default 20)
 *   - Consecutive fail recovery (FAR-2 — sau N fail liên tiếp)
 *
 * @param {string} [trigger='unknown'] - Nguồn gọi refresh ('alarm' | 'recovery' | 'manual')
 * @returns {Promise<boolean>} true nếu refresh thành công
 */
async function refreshFlowSession(trigger) {
  trigger = trigger || 'unknown';
  const startedAt = Date.now();
  try {
    // Đảm bảo Flow tab active để Next.js context tồn tại
    if (document.visibilityState === 'hidden') {
      await new Promise(r => chrome.runtime.sendMessage({ action: 'ensureFlowTabActive' }, () => r()));
      await sleep(300);
    }
    const result = await _slateBridgeCall('refreshSession', {});
    const durationMs = Date.now() - startedAt;
    if (result?.success) {
      console.log('[TobyFlow][FAR-1] Refresh OK', { trigger, durationMs });
      // Track stats vào af_daily_stats (giống pattern existing _incrementDailyStat)
      try { _incrementDailyStat('flow_refresh_success'); } catch (e) {}
      return true;
    }
    console.warn('[TobyFlow][FAR-1] Refresh FAIL', { trigger, durationMs, error: result?.error || 'unknown' });
    try { _incrementDailyStat('flow_refresh_fail'); } catch (e) {}
    return false;
  } catch (e) {
    const durationMs = Date.now() - startedAt;
    console.warn('[TobyFlow][FAR-1] Refresh exception', { trigger, durationMs, error: e.message });
    try { _incrementDailyStat('flow_refresh_fail'); } catch (e) {}
    return false;
  }
}

/**
 * Gọi 1 action sang slate-bridge.js (chạy trong page world để truy cập React fiber).
 *
 * QUAN TRỌNG: Mỗi action có internal multi-tier fallback BÊN TRONG bridge:
 *   - 'insert' → slate-bridge.js INSERT_TIERS (3 tier: insertText/applyOp/insertData)
 *   - 'clear'  → slate-bridge.js CLEAR_TIERS  (3 tier: deleteFragment/selectAllDelete/replaceChildren)
 *   - 'submit' → slate-bridge.js submit handler
 * → 1 lần gọi `_slateBridgeCall('insert', ...)` thực tế thử 3 cách Slate API
 *   trước khi return failure. Đừng nhầm "1 outer call = 1 attempt".
 */
function _slateBridgeCall(action, detail) {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    console.log('[TobyFlow] Bridge call:', action, 'rid:', requestId);
    let resolved = false;
    const handler = (e) => {
      if (e.source !== window) return;
      if (e.data && e.data.source === 'flow-auto-slate-result' && e.data.requestId === requestId) {
        resolved = true;
        window.removeEventListener('message', handler);
        console.log('[TobyFlow] Bridge response:', action, e.data.success, e.data.error || '');
        resolve({ success: e.data.success, error: e.data.error });
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({
      source: 'flow-auto-slate',
      action,
      requestId,
      ...detail
    }, window.location.origin);
    // Timeout 3s
    setTimeout(() => {
      if (!resolved) {
        window.removeEventListener('message', handler);
        console.warn('[TobyFlow] Bridge TIMEOUT:', action, requestId);
        resolve({ success: false, error: 'Bridge timeout' });
      }
    }, 3000);
  });
}

/**
 * Clear toàn bộ nội dung Slate editor.
 *
 * RESILIENCE — KHÔNG nhầm lẫn "1 tier":
 *   • Outer attempt:  1 lần (gọi Slate bridge qua message bus)
 *   • Inner tiers:    3 (slate-bridge.js: deleteFragment → selectAllDelete → replaceChildren)
 *   • DOM fallback:   0 (cố ý, xem lý do bên dưới)
 * → Tổng cộng 3 cách thử clear, TẤT CẢ qua Slate API (không touch DOM).
 *
 * Lý do KHÔNG có DOM fallback (vd execCommand('selectAll') + execCommand('delete')):
 *   DOM manipulation gây Slate model/DOM desync → React throw
 *   "Cannot resolve a Slate node from DOM node" → trang Flow crash trắng,
 *   user mất session, phải F5. Thà fail êm hơn crash.
 */
async function clearEditor(editor) {
  // Inject bridge nếu chưa có
  injectSlateBridge();

  // Outer attempt qua message bus → bridge thử 3 inner tier (xem CLEAR_TIERS trong slate-bridge.js)
  const result = await _slateBridgeCall('clear', {});
  if (result.success) {
    console.log('[TobyFlow] clearEditor: Slate bridge OK (1 trong 3 inner tier work)');
    await sleep(200); // Đợi React re-render
    return;
  }
  // Cả 3 inner tier Slate fail → abort. KHÔNG dùng DOM fallback (xem JSDoc trên).
  console.warn('[TobyFlow] clearEditor: ❌ Slate bridge failed (cả 3 inner tier):', result.error);
  console.warn('[TobyFlow] clearEditor: ⚠️ Aborting — no DOM fallback (tránh crash Flow page)');
}

/**
 * Public API insert text vào Slate editor của Flow page.
 *
 * Là wrapper cho `_insertTextSingle()` — chỉ thêm 2 thứ:
 *   1. Humanized mode: split text thành word-chunks, insert từng chunk với delay random
 *      (giả lập user gõ phím tự nhiên — chống detection nếu Flow có anti-bot)
 *   2. Random delay trước/sau toàn bộ insert (UX tự nhiên hơn)
 *
 * → "insertText" và "_insertTextSingle" và "insert prompt to editor" CÙNG 1 LUỒNG,
 *   chỉ là tên ở các layer abstraction khác nhau:
 *     EditorExecutor / handler  →  insertText() [public]
 *                                    └→ _insertTextSingle() [internal, có thể gọi nhiều lần
 *                                          nếu humanized chunked]
 *                                          └→ _slateBridgeCall('insert') [bridge layer]
 *                                                └→ slate-bridge.js tryInsertText()
 *                                                      [page world, 3 internal Slate tier]
 */
async function insertText(editor, text) {
  // Inject bridge nếu chưa có
  injectSlateBridge();

  // Random delay trước khi bắt đầu gõ — giả lập hành vi tự nhiên
  await sleep(100 + Math.random() * 200);

  editor = getEditor() || editor;

  if (isHumanizedEnabled()) {
    // Humanized mode: insert từng word-chunk
    const chunks = text.match(/\S+\s*/g) || [text];
    for (let ci = 0; ci < chunks.length; ci++) {
      if (shouldStop) break;
      await _insertTextSingle(chunks[ci]);
      if (ci < chunks.length - 1) {
        await sleep(getHumanizedDelay(120));
      }
    }
  } else {
    await _insertTextSingle(text);
  }

  // Random delay sau khi gõ
  await sleep(200 + Math.random() * 300);
}

/**
 * Internal helper: insert MỘT lần text (humanized chunk hoặc full text).
 *
 * RESILIENCE — KHÔNG nhầm lẫn "1 tier ONLY":
 *   • Outer attempt:  1 lần (gọi Slate bridge qua message bus)
 *   • Inner tiers:    3 (slate-bridge.js INSERT_TIERS = ['insertText','applyOp','insertData']):
 *       - Tier inner-1 'insertText':  editor.insertText(text)               — Slate high-level API
 *       - Tier inner-2 'applyOp':     editor.apply({type:'insert_text',...}) — low-level operation
 *       - Tier inner-3 'insertData':  editor.insertData(DataTransfer)        — paste handler
 *     Mỗi tier verify Slate model có chứa text trước khi accept.
 *   • DOM fallback:   0 (cố ý — xem lý do bên dưới)
 * → Tổng cộng 3 cách thử insert, TẤT CẢ qua Slate API (không touch DOM).
 *
 * Lý do KHÔNG có DOM fallback (execCommand / ClipboardEvent / InputEvent / keyboard sim):
 *   Trước đây có 4 tier outer (Slate bridge + 3 DOM approach). Đã REMOVE 3 DOM tier
 *   vì gây Slate model/DOM desync → React throw "Cannot resolve a Slate node from DOM node"
 *   → Next.js client-side exception → Flow page crash TRẮNG (user phải F5, mất session).
 *   Thà fail êm để caller retry hơn là crash trang.
 *
 * Verify thành công:
 *   - Slate bridge return success → poll DOM 2s (200ms/lần) check placeholder gone + text >80% match
 *   - Nếu Slate report success nhưng DOM chưa render xong → trust Slate (model có text,
 *     React sẽ render eventually). Caller verify lần nữa qua verifySlateModel trước submit.
 */
async function _insertTextSingle(text) {
  let editor = getEditor();

  // Helper: check DOM có text và placeholder đã biến mất
  function isDomUpdated() {
    const el = getEditor();
    if (!el) return false;
    const hasPlaceholder = !!el.querySelector('[data-slate-placeholder]');
    const domText = el.textContent?.trim() || '';
    return !hasPlaceholder && domText.length > 0;
  }

  // Helper: check nếu text đã được insert đúng (tránh duplicate từ fallback tiers)
  function isTextAlreadyInserted() {
    const el = getEditor();
    if (!el) return false;
    const domText = el.textContent?.trim() || '';
    // So sánh normalized text (bỏ whitespace thừa)
    const normalizedDom = domText.replace(/\s+/g, ' ').trim();
    const normalizedTarget = text.replace(/\s+/g, ' ').trim();
    // Cho phép match nếu DOM chứa phần lớn text target (>80% chars)
    if (normalizedTarget.length > 20) {
      const matchRatio = normalizedDom.length > 0 ?
        Math.min(normalizedDom.length, normalizedTarget.length) / normalizedTarget.length : 0;
      return matchRatio > 0.8;
    }
    return normalizedDom === normalizedTarget;
  }

  // Outer attempt qua message bus → bridge thử 3 inner tier (xem INSERT_TIERS slate-bridge.js).
  // KHÔNG nhầm "1 tier" — bridge bên trong tự cycle qua insertText/applyOp/insertData.
  const result = await _slateBridgeCall('insert', { text });
  if (result.success) {
    console.log('[TobyFlow] insertText: Slate bridge returned success (1 trong 3 inner tier work)');

    // Poll chờ DOM update (max 2s) thay vì check 1 lần
    // Lần insert đầu tiên cần nhiều thời gian hơn để placeholder biến mất
    const maxWaitDom = 2000;
    const pollInterval = 200;
    let waited = 0;
    while (waited < maxWaitDom) {
      await sleep(pollInterval);
      waited += pollInterval;

      if (isDomUpdated()) {
        console.log('[TobyFlow] insertText: DOM verified OK after', waited, 'ms');
        return;
      }
      // Check text content thay vì chỉ placeholder
      if (isTextAlreadyInserted()) {
        console.log('[TobyFlow] insertText: Text already in editor after', waited, 'ms');
        return;
      }
    }

    // BUG FIX: Slate bridge báo success → KHÔNG dùng fallback DOM manipulation
    // Lý do: Slate model đã được update, nhưng React chưa render
    // Nếu dùng execCommand → DOM bị modify trực tiếp → Slate model và DOM mismatch
    // → "Cannot resolve a Slate node from DOM node" → Application error
    console.log('[TobyFlow] insertText: Slate bridge success BUT DOM not updated after 2s');
    console.log('[TobyFlow] insertText: Skipping DOM fallbacks to avoid Slate state corruption');
    // Trust Slate bridge - Slate model has the text, React will render eventually
    // Caller (EditorExecutor) sẽ verify via verifySlateModel trước khi submit
    return;
  }

  // Cả 3 inner Slate tier (insertText/applyOp/insertData) đều fail → abort.
  // KHÔNG dùng DOM fallback (execCommand/clipboard/InputEvent/keyboard sim) — xem JSDoc trên.
  console.warn('[TobyFlow] insertText: ❌ Slate bridge failed (cả 3 inner tier):', result.error);
  console.warn('[TobyFlow] insertText: ⚠️ Aborting — no DOM fallback (tránh crash Flow page)');
}

/**
 * Xoá tất cả ref images đang có trong prompt area.
 * Tìm các nút cancel (icon "cancel") trong container chứa editor, click để xoá.
 */
async function removeExistingRefImages() {
  console.log('[removeExistingRefImages] called');
  const editor = getEditor();
  if (!editor) {
    console.log('[removeExistingRefImages] EARLY RETURN — no editor found');
    return 0;
  }

  // [Phase 3] Prompt container: bỏ hardcode CSS-in-JS hash `.sc-45319f81-0` (đã đổi nhiều build).
  //   Strategy: walk up tree, tìm container có CHỨA cancel icon — chứng tỏ container đúng.
  //   Limit 6 levels để không scope quá rộng (Flow nest editor sâu nhưng không quá 6).
  let promptContainer = null;
  let probe = editor.parentElement;
  let probeLevel = 0;
  for (let i = 0; i < 6 && probe; i++) {
    const hasCancel = Array.from(probe.querySelectorAll('i.google-symbols'))
      .some(ic => ic.textContent.trim() === 'cancel');
    if (hasCancel) { promptContainer = probe; probeLevel = i + 1; break; }
    probe = probe.parentElement;
  }
  // Fallback: 3-level parent (như cũ) nếu walk-up không tìm — defensive
  if (!promptContainer) {
    promptContainer = editor.parentElement?.parentElement?.parentElement;
    console.log('[removeExistingRefImages] walk-up không tìm cancel icon, fallback 3-level parent');
  } else {
    console.log(`[removeExistingRefImages] container found via walk-up level ${probeLevel} (có cancel icon)`);
  }
  if (!promptContainer) {
    console.log('[removeExistingRefImages] EARLY RETURN — no promptContainer');
    return 0;
  }

  // Tìm tất cả cancel buttons trong prompt container.
  // Ràng buộc: cancel icon phải nằm trong button cùng cha với một <img> sibling
  // → đảm bảo đúng "ref image cancel", không phải cancel button khác (vd modal close).
  const cancelIcons = promptContainer.querySelectorAll('i.google-symbols');
  let removed = 0;
  for (const icon of cancelIcons) {
    if (icon.textContent.trim() !== 'cancel') continue;

    // [Phase 3] Bỏ hardcode `.sc-d9d2dca3-4` — closest <button> hoặc clickable parent.
    //   Tier 1: closest button (Radix dùng button cho clickable area)
    //   Tier 2: parentElement (legacy fallback)
    const cancelBtn = icon.closest('button') || icon.parentElement;
    if (!cancelBtn) continue;

    // Sanity check: cancel button có liên quan tới <img> (ref image thumbnail).
    //
    // Lý do dùng subtree querySelector (KHÔNG strict direct-sibling):
    //   Flow ref image render với <img> nested sâu trong wrapper structure đa level
    //   (vd <div class="thumb-wrap"><div class="img-frame"><img/></div></div>).
    //   Strict "direct sibling only" sẽ MISS hết → click 0 cancel buttons.
    //
    // False-positive risk acceptable vì:
    //   - Container đã được walk-up narrow tới div CHỨA cancel icon
    //   - Cancel icon "cancel" rất specific cho Material icon set
    //   - Wrapper của cancel button thường là 1 row của ref image (cancel + thumbnail liền nhau)
    const wrapper = cancelBtn.parentElement;
    const hasNearbyImg = !!(wrapper?.querySelector('img') || cancelBtn.querySelector('img'));
    if (!hasNearbyImg) {
      // Cancel button không có img nào nearby → khả năng cao là modal close, popup dismiss → skip
      _logSelectorPick('removeExistingRefImages.cancelCheck', 'skip', 'no-img-in-wrapper', null);
      continue;
    }

    _logSelectorPick('removeExistingRefImages.cancelCheck', 'ok', 'img-found-in-wrapper', cancelBtn);
    simulateClick(cancelBtn);
    removed++;
    await sleep(200); // Chờ DOM update
  }
  if (removed > 0) {
    sendLog(`Đã xoá ${removed} ảnh tham chiếu cũ`, 'info');
  } else {
    // Even removed=0 — log để biết function ĐÃ chạy nhưng không có gì để xóa
    console.log(`[removeExistingRefImages] DONE — removed=0 (không có ref image cũ trong container)`);
  }
  return removed;
}

/**
 * Đọc thông tin settings hiện tại từ settings button.
 *
 * DOM structure (3 phần TÁCH BIỆT, không dính):
 *   <button id="radix-:rs:" ...>
 *     "🍌 Nano Banana 2"          ← text node (model + emoji)
 *     <i class="google-symbols">crop_9_16</i>   ← element (ratio icon)
 *     "1x"                         ← text node (quantity, có thể là "1x" mới hoặc "x1" cũ)
 *     <div data-type="button-overlay">  ← decorative
 *   </button>
 *
 * Approach: query từng element/text-node riêng — KHÔNG parse textContent flattened
 * (textContent dính 3 phần thành "🍌 Nano Banana 2crop_9_161x" → phải regex parse ngược, fragile).
 *
 * Trả về { model, ratioIcon, quantity, rawText } hoặc null nếu không đọc được.
 */
function readCurrentSettings() {
  const submitBtn = getSubmitButton();
  // [Phase 2] Dùng getSettingsButton() — 4-tier fallback thay vì positional only
  const settingsBtn = getSettingsButton(submitBtn);
  if (!settingsBtn) return null;

  // 1. Ratio icon: query trực tiếp <i.google-symbols> với text bắt đầu bằng "crop_"
  let ratioIcon = null;
  const icons = settingsBtn.querySelectorAll('i.google-symbols');
  for (const icon of icons) {
    const t = icon.textContent.trim();
    if (t.startsWith('crop_')) { ratioIcon = t; break; }
  }

  // 2. Quantity: tìm trong text nodes (không phải element children).
  //    Format support: "1x"/"2x"/.. (Flow hiện tại) và "x1"/"x2"/.. (legacy).
  //    Single digit vì Flow chỉ có 1-4. Walk trực tiếp text-node con của button (Element.childNodes
  //    bao gồm cả TextNode), bỏ qua element children → tránh dính text từ <i>crop_*</i>.
  let quantity = null;
  for (const node of settingsBtn.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const t = (node.textContent || '').trim();
    if (!t) continue;
    const m = t.match(/^(\d)x$|^x(\d)$/);  // strict: cả text node phải là "Nx" hoặc "xN"
    if (m) { quantity = parseInt(m[1] || m[2]); break; }
  }

  // 3. Model name: text node ĐẦU TIÊN (thường là "🍌 Nano Banana 2"). Bỏ emoji prefix.
  let model = '';
  for (const node of settingsBtn.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const t = (node.textContent || '').trim();
    if (!t) continue;
    // Bỏ qua text node là quantity (vd "1x" / "x1")
    if (/^\d?x\d?$/.test(t)) continue;
    model = t.replace(/^[\u{1F000}-\u{1FFFF}]\s*/u, '').trim();
    break;
  }

  // rawText giữ lại để debug
  const rawText = settingsBtn.textContent.trim();
  if (!model && !ratioIcon && quantity === null) return null;

  return { model, ratioIcon, quantity, rawText };
}

/**
 * Map ratio setting value sang ratio icon text trong settings button.
 * Google Flow dùng icon names: crop_16_9, crop_landscape, crop_square, crop_portrait, crop_9_16
 */
function ratioToIconName(ratio) {
  const r = String(ratio).toLowerCase().trim();
  // 16:9 - Landscape wide
  if (r.includes('16:9') || r === 'ngang' || r === 'landscape' || r === '16_9') return 'crop_16_9';
  // 4:3 - Landscape standard (Flow uses crop_landscape)
  if (r.includes('4:3') || r === '4_3' || r === 'ngang 4:3') return 'crop_landscape';
  // 1:1 - Square
  if (r.includes('1:1') || r === 'vuông' || r === 'square') return 'crop_square';
  // 3:4 - Portrait standard (Flow uses crop_portrait)
  if (r.includes('3:4') || r === '3_4' || r === 'dọc 3:4') return 'crop_portrait';
  // 9:16 - Portrait tall
  if (r.includes('9:16') || r === 'dọc' || r === 'portrait' || r === '9_16') return 'crop_9_16';
  return null;
}

function simulateClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y, pointerType: 'mouse' }));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y, pointerType: 'mouse' }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y }));
}

function simulateContextMenu(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 2, clientX: x, clientY: y, pointerType: 'mouse' }));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 2, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, buttons: 2, clientX: x, clientY: y }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, button: 2, clientX: x, clientY: y, pointerType: 'mouse' }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 2, clientX: x, clientY: y }));
}

/**
 * Apply settings to Google Flow settings panel
 *
 * Uses Radix UI ID suffix patterns as PRIMARY strategy (language-agnostic).
 * Fallback strategies use text matching (Vietnamese, English).
 *
 * Radix ID Suffix Patterns:
 * - Type: -trigger-IMAGE, -trigger-VIDEO
 * - Ratio: -trigger-PORTRAIT, -trigger-LANDSCAPE, -trigger-SQUARE, -trigger-LANDSCAPE_4_3, -trigger-PORTRAIT_3_4
 * - Quantity: -trigger-1, -trigger-2, -trigger-3, -trigger-4
 * - Video Mode: -trigger-VIDEO_FRAMES (Frames), -trigger-VIDEO_REFERENCES (Ingredients)
 */
async function applySettings(genType, aspectRatio, modelName, isFrames = false, quantity = 1) {
    console.log(`[applySettings] CALLED with: genType="${genType}", aspectRatio="${aspectRatio}", modelName="${modelName}", isFrames=${isFrames} (typeof ${typeof isFrames}), quantity=${quantity}`);
    sendLog(`⚙️ Đang thiết lập cấu hình: ${genType}, ${aspectRatio}, ${modelName}, isFrames=${isFrames}, x${quantity}`);

    // Pre-check: đọc settings hiện tại và xác định cần thay đổi gì
    const current = readCurrentSettings();
    let needModel = true;
    let needRatio = true;
    let needQuantity = true;

    // Nếu Image mode và modelName = null/undefined → không set model (giữ nguyên)
    // Video mode luôn cần set model (Frames/Ingredients)
    const isVideoMode = genType.toLowerCase() === 'video';
    if (!isVideoMode && !modelName) {
      needModel = false;
    }

    if (current) {
      // Check model: so sánh tên model (case-insensitive, partial match)
      let targetModel = modelName;
      if (isVideoMode) {
        // Video mode: chọn Frames hoặc Ingredients dựa trên flag isFrames
        targetModel = isFrames ? 'Frames' : 'Ingredients';
        console.log(`[applySettings] Video mode: isFrames=${isFrames} → targetModel=${targetModel}`);
      }
      console.log(`[applySettings] current.model="${current.model}", targetModel="${targetModel}"`);

      // Video mode: check cả tiếng Anh và tiếng Việt
      // Flow UI: "Khung hình" = Frames, "Thành phần" = Ingredients
      let modelMatches = false;
      if (current.model && targetModel) {
        const currentLower = current.model.toLowerCase();
        const targetLower = targetModel.toLowerCase();
        if (isVideoMode) {
          // Video mode: check multiple terms
          const isFramesTarget = targetLower === 'frames';
          const videoTerms = isFramesTarget
            ? ['frames', 'khung hình', 'khung']
            : ['ingredients', 'thành phần', 'thanh phan'];
          modelMatches = videoTerms.some(term => currentLower.includes(term));
        } else {
          // Image mode: check targetModel directly
          modelMatches = currentLower.includes(targetLower);
        }
      }
      if (modelMatches) {
        needModel = false;
        console.log(`[applySettings] Skipping model change - already ${targetModel}`);
      }

      // Check ratio: so sánh icon name
      const targetRatioIcon = ratioToIconName(aspectRatio);
      if (targetRatioIcon && current.ratioIcon === targetRatioIcon) {
        needRatio = false;
      }

      // Check quantity
      if (current.quantity === quantity) {
        needQuantity = false;
      }

      // NOTE: Không skip hoàn toàn — vẫn phải set genType (image/video)
    // vì pre-check không detect được genType hiện tại từ button text.
    // Chỉ skip khi tất cả settings match VÀ genType đã đúng (conservative).
    // Bỏ early return để luôn mở settings panel và set genType.
    if (!needModel && !needRatio && !needQuantity) {
      sendLog('⚙️ Model/Ratio/Quantity đã đúng, chỉ verify genType', 'info');
    }

      const changes = [];
      if (needModel) changes.push('model');
      if (needRatio) changes.push('ratio');
      if (needQuantity) changes.push('quantity');
      sendLog(`⚙️ Cần thay đổi: ${changes.join(', ')}`, 'info');
    }

    const submitBtn = getSubmitButton();
    if (!submitBtn) {
        sendLog('❌ Không tìm thấy nút Submit để mở Settings.', 'error');
        return;
    }
    // [Phase 2] Dùng getSettingsButton() — 4-tier fallback (ARIA + Radix + positional + text)
    const settingsBtn = getSettingsButton(submitBtn);
    if (!settingsBtn) {
        sendLog('❌ Không tìm thấy nút Settings.', 'error');
        return;
    }

    // Post-audit fix: Check panel đã mở chưa → tránh click toggle ĐÓNG panel đang mở.
    // Bug user phát hiện: nếu settings panel đang mở sẵn (user mở manual trước khi gen),
    // simulateClick(settingsBtn) sẽ đóng panel → query mode/ratio fail → skip → upload ref.
    const _existingPanel = _getActiveSettingsPanel();
    const _panelAlreadyOpen = _existingPanel !== document
        && !!_existingPanel.querySelector('button[role="tab"][id*="-trigger-"]');

    if (_panelAlreadyOpen) {
        console.log('[applySettings] Settings panel đã mở — skip click settings button');
        sendLog('⚙️ Settings panel đã mở sẵn — skip toggle', 'info');
    } else {
        // open settings
        simulateClick(settingsBtn);
        await sleep(getSettingsStepDelay()); // Chờ settings panel render
    }

    // Helper: Tìm button bằng Radix ID suffix (language-agnostic)
    // ID pattern: radix-:xxx:-trigger-{SUFFIX}
    const _findByIdSuffix = (scope, suffix) => {
      return scope.querySelector(`button[id$="-trigger-${suffix}"]`);
    };

    // [Phase 4] Settings panel scope qua helper (dedupe 3 nơi)
    const settingsPanel = _getActiveSettingsPanel();
    console.log(`[applySettings] settings panel: ${settingsPanel === document ? 'document (no popup yet)' : 'popup'}`);

    // Set Type - Strategy 1: Dynamic selectors từ backend (admin tweakable) → fallback Radix ID suffix
    // Post-audit fix: dùng _getDynamicSelector('mode_tab_image'|'mode_tab_video') để admin
    // có thể tweak qua /admin/providers khi Google Flow đổi DOM.
    let typeClicked = false;
    const typeSuffix = genType.toLowerCase() === 'video' ? 'VIDEO' : 'IMAGE';
    const typeKey = genType.toLowerCase() === 'video' ? 'mode_tab_video' : 'mode_tab_image';
    const typeDefaultSelectors = genType.toLowerCase() === 'video'
      ? ['button[id$="-trigger-VIDEO"]:not([id*="VIDEO_"])', 'button[role="tab"][aria-controls*="VIDEO"]:not([aria-controls*="VIDEO_"])']
      : ['button[id$="-trigger-IMAGE"]', 'button[role="tab"][aria-controls*="IMAGE"]'];

    let typeBtn = null;
    const _typeDynCfg = _getDynamicSelector(typeKey);
    const _typeIsDynamic = _typeDynCfg?.selectors?.length > 0;
    const _typeTrySelectors = _typeIsDynamic ? _typeDynCfg.selectors : typeDefaultSelectors;

    for (const sel of _typeTrySelectors) {
      try {
        typeBtn = settingsPanel.querySelector(sel);
        if (!typeBtn && settingsPanel !== document) typeBtn = document.querySelector(sel);
        if (typeBtn) {
          console.log(`[applySettings] Found type button via ${_typeIsDynamic ? '🌐 DYNAMIC' : '📦 DEFAULT'} selector: ${sel}`);
          break;
        }
      } catch (_) { /* invalid selector */ }
    }

    // Final fallback: legacy Radix ID suffix helper
    if (!typeBtn) {
      typeBtn = _findByIdSuffix(settingsPanel, typeSuffix);
      if (!typeBtn && settingsPanel !== document) typeBtn = _findByIdSuffix(document, typeSuffix);
    }

    if (typeBtn) {
      console.log(`[applySettings] Found type button via ID suffix: -trigger-${typeSuffix}, aria-selected=${typeBtn.getAttribute('aria-selected')}`);
      simulateClick(typeBtn);
      await sleep(getSettingsStepDelay());
      typeClicked = true;
      sendLog(`✓ Type clicked via ID suffix: -trigger-${typeSuffix}`, 'info');
    } else {
      console.log(`[applySettings] Type button NOT found via ID suffix: -trigger-${typeSuffix}`);
    }

    // Set Type - Strategy 2: Text matching (fallback cho DOM cũ)
    if (!typeClicked) {
      console.log(`[applySettings] Trying Strategy 2: text matching for genType="${genType}"`);
      const tabSelector = 'button[role="tab"]';
      // Ưu tiên tìm trong settings panel
      let allTabs = settingsPanel.querySelectorAll(tabSelector);
      if (allTabs.length === 0 && settingsPanel !== document) {
        allTabs = document.querySelectorAll(tabSelector);
      }
      console.log(`[applySettings] Found ${allTabs.length} tabs to search`);

      for (let t of allTabs) {
          let textLower = t.textContent.trim().toLowerCase();
          let targetLower = genType.toLowerCase();
          if (textLower === targetLower || (targetLower === 'video' && textLower.includes('video')) || (targetLower === 'image' && (textLower.includes('ảnh') || textLower.includes('image') || textLower.includes('hình')))) {
              console.log(`[applySettings] Found type tab by text: "${textLower}", aria-selected=${t.getAttribute('aria-selected')}`);
              simulateClick(t);
              await sleep(getSettingsStepDelay());
              typeClicked = true;
              sendLog(`✓ Type clicked via text: ${textLower}`, 'info');
              break;
          }
      }

      if (!typeClicked) {
        console.log(`[applySettings] WARNING: Could not find type tab for genType="${genType}"`);
        sendLog(`⚠️ Không tìm thấy tab ${genType}`, 'warn');
      }
    }

    // Set aspect ratio (skip nếu đã đúng)
    if (needRatio) {
      const targetRatioIcon = ratioToIconName(aspectRatio);

      // Helper: Map ratio value sang Radix ID suffix
      // aspectRatio: 'Dọc', 'Ngang', 'Vuông', '9:16', '16:9', '1:1', '4:3', '3:4'
      const _ratioToIdSuffix = (ratio) => {
        const r = String(ratio).trim().toLowerCase();
        if (r === 'dọc' || r === '9:16') return 'PORTRAIT';
        if (r === 'ngang' || r === '16:9') return 'LANDSCAPE';
        if (r === 'vuông' || r === '1:1') return 'SQUARE';
        if (r === '4:3') return 'LANDSCAPE_4_3';
        if (r === '3:4') return 'PORTRAIT_3_4';
        return null;
      };

      // [Phase 4] Scope ratio search vào settings panel — dedupe via helper
      const activeMenu = _getActiveSettingsPanel();

      let ratioClicked = false;

      // Strategy 1: Radix ID suffix (language-agnostic) — PRIMARY
      const ratioSuffix = _ratioToIdSuffix(aspectRatio);
      if (ratioSuffix) {
        const ratioBtn = _findByIdSuffix(activeMenu, ratioSuffix);
        if (ratioBtn) {
          simulateClick(ratioBtn);
          await sleep(getSettingsStepDelay());
          ratioClicked = true;
          sendLog(`✓ Ratio clicked via ID suffix: -trigger-${ratioSuffix}`, 'info');
        }
      }

      // Strategy 2: Tìm buttons có google-symbols icon crop_*
      if (!ratioClicked && targetRatioIcon) {
        const iconButtons = activeMenu.querySelectorAll('button');
        for (const btn of iconButtons) {
          const icon = btn.querySelector('i.google-symbols, .google-symbols, .material-icons');
          if (icon && icon.textContent.trim() === targetRatioIcon) {
            simulateClick(btn);
            await sleep(getSettingsStepDelay());
            ratioClicked = true;
            sendLog(`✓ Ratio clicked via icon: ${targetRatioIcon}`, 'info');
            break;
          }
        }
      }

      // Strategy 3: Tìm buttons với textContent chứa ratio icon name
      if (!ratioClicked && targetRatioIcon) {
        const allButtons = activeMenu.querySelectorAll('button');
        for (const btn of allButtons) {
          const btnText = btn.textContent.trim().toLowerCase();
          if (btnText.includes(targetRatioIcon)) {
            simulateClick(btn);
            await sleep(getSettingsStepDelay());
            ratioClicked = true;
            sendLog(`✓ Ratio clicked via text: ${targetRatioIcon}`, 'info');
            break;
          }
        }
      }

      // Strategy 4 (fallback): Tìm tabs với text match (legacy)
      if (!ratioClicked) {
        const tabSelector = 'button[role="tab"]';
        const updatedTabs = activeMenu.querySelectorAll(tabSelector);
        for (let t of updatedTabs) {
            let textLower = t.textContent.trim().toLowerCase();
            let ratioLower = String(aspectRatio).trim().toLowerCase();
            if (textLower.includes(ratioLower) ||
                (targetRatioIcon && textLower.includes(targetRatioIcon)) ||
                (ratioLower === 'ngang' && (textLower.includes('landscape') || textLower.includes('16_9') || textLower.includes('16:9'))) ||
                (ratioLower === 'dọc' && (textLower.includes('portrait') || textLower.includes('9_16') || textLower.includes('9:16')))) {
                simulateClick(t);
                await sleep(getSettingsStepDelay());
                sendLog(`✓ Ratio clicked via tab: ${textLower}`, 'info');
                break;
            }
        }
      }
    }

    // Set quantity (skip nếu đã đúng)
    if (needQuantity && quantity >= 1 && quantity <= 4) {
        let quantityClicked = false;

        // Strategy 1: Radix ID suffix (language-agnostic) — PRIMARY
        // ID pattern: radix-:xxx:-trigger-{1|2|3|4}
        const quantityBtn = _findByIdSuffix(document, String(quantity));
        if (quantityBtn) {
          simulateClick(quantityBtn);
          await sleep(getSettingsStepDelay());
          quantityClicked = true;
          sendLog(`✓ Quantity clicked via ID suffix: -trigger-${quantity}`, 'info');
        }

        // Strategy 2: Text matching (fallback)
        if (!quantityClicked) {
          const tabSelector = 'button[role="tab"]';
          const quantityTabs = document.querySelectorAll(tabSelector);
          for (let t of quantityTabs) {
              let text = t.textContent.trim();
              if (text === `x${quantity}`) {
                  simulateClick(t);
                  await sleep(getSettingsStepDelay());
                  break;
              }
          }
        }
    }

    // Open model select dropdown (skip nếu đã đúng)
    let targetModelName = modelName;
    if (isVideoMode) {
        targetModelName = isFrames ? 'Frames' : 'Ingredients';
        console.log(`[applySettings] Video model selection: targetModelName=${targetModelName}`);
    }

    console.log(`[applySettings] needModel=${needModel}, isVideoMode=${isVideoMode}, isFrames=${isFrames}, targetModelName="${targetModelName}"`);

    // Video mode: click Frames/Ingredients TAB thay vì dùng dropdown
    // Flow UI dùng tabs với text tiếng Việt: "Khung hình" (Frames) / "Thành phần" (Ingredients)
    // DOM: button[role="tab"] với ID suffix -trigger-VIDEO_FRAMES hoặc -trigger-VIDEO_REFERENCES
    if (isVideoMode && needModel) {
        // [Phase 4] Scope video mode tab search via helper
        const activeMenu = _getActiveSettingsPanel();
        let videoModeClicked = false;

        // Map targetModelName (EN) sang các từ khóa tìm kiếm (cả EN và VI)
        // Flow UI: "Khung hình" = Frames, "Thành phần" = Ingredients
        const isFramesTarget = targetModelName.toLowerCase() === 'frames';
        const searchTerms = isFramesTarget
            ? ['frames', 'khung hình', 'khung', 'video_frames']
            : ['ingredients', 'thành phần', 'thanh phan', 'video_references'];
        const ariaControlsMatch = isFramesTarget ? 'VIDEO_FRAMES' : 'VIDEO_REFERENCES';
        // Radix ID suffix: -trigger-VIDEO_FRAMES hoặc -trigger-VIDEO_REFERENCES
        const videoModeSuffix = isFramesTarget ? 'VIDEO_FRAMES' : 'VIDEO_REFERENCES';

        console.log(`[applySettings] Video mode: looking for ${targetModelName} with ID suffix: -trigger-${videoModeSuffix}`);

        // Strategy 1: Dynamic selectors từ backend (admin tweakable) → fallback Radix ID suffix
        // Post-audit fix: dùng _getDynamicSelector('video_mode_frames'|'video_mode_ingredients').
        const _vmKey = isFramesTarget ? 'video_mode_frames' : 'video_mode_ingredients';
        const _vmDefaults = [`button[id$="-trigger-${videoModeSuffix}"]`, `button[role="tab"][aria-controls*="${ariaControlsMatch}"]`];
        const _vmDynCfg = _getDynamicSelector(_vmKey);
        const _vmIsDynamic = _vmDynCfg?.selectors?.length > 0;
        const _vmTrySelectors = _vmIsDynamic ? _vmDynCfg.selectors : _vmDefaults;

        let videoModeBtn = null;
        for (const sel of _vmTrySelectors) {
            try {
                videoModeBtn = activeMenu.querySelector(sel);
                if (videoModeBtn) {
                    console.log(`[applySettings] Video mode: found via ${_vmIsDynamic ? '🌐 DYNAMIC' : '📦 DEFAULT'} selector: ${sel}`);
                    break;
                }
            } catch (_) { /* invalid selector */ }
        }

        // Final fallback: legacy Radix ID suffix helper
        if (!videoModeBtn) {
            videoModeBtn = _findByIdSuffix(activeMenu, videoModeSuffix);
        }

        if (videoModeBtn) {
            console.log(`[applySettings] Video mode: clicking via ID suffix -trigger-${videoModeSuffix}`);
            simulateClick(videoModeBtn);
            await sleep(getSettingsStepDelay());
            videoModeClicked = true;
            sendLog(`✓ Video mode: chọn ${targetModelName} (${_vmIsDynamic ? 'dynamic' : 'default'})`, 'info');
        }

        // Strategy 2: Tìm tab bằng aria-controls
        const tabSelector = 'button[role="tab"]';
        if (!videoModeClicked) {
            const tabs = activeMenu.querySelectorAll(tabSelector);
            for (const tab of tabs) {
                const ariaControls = tab.getAttribute('aria-controls') || '';
                if (ariaControls.includes(ariaControlsMatch)) {
                    console.log(`[applySettings] Video mode: clicking tab via aria-controls="${ariaControls}"`);
                    simulateClick(tab);
                    await sleep(getSettingsStepDelay());
                    videoModeClicked = true;
                    sendLog(`✓ Video mode: chọn ${targetModelName} (aria)`, 'info');
                    break;
                }
            }
        }

        // Strategy 3: Tìm tab bằng text content (fallback)
        if (!videoModeClicked) {
            const tabs = activeMenu.querySelectorAll(tabSelector);
            console.log(`[applySettings] Video mode Strategy 3: searching ${tabs.length} tabs by text`);
            for (const tab of tabs) {
                const tabText = tab.textContent.trim().toLowerCase();
                for (const term of searchTerms) {
                    if (tabText === term || tabText.includes(term)) {
                        console.log(`[applySettings] Video mode: clicking tab "${tabText}" for ${targetModelName}`);
                        simulateClick(tab);
                        await sleep(getSettingsStepDelay());
                        videoModeClicked = true;
                        sendLog(`✓ Video mode: chọn ${targetModelName} (tab)`, 'info');
                        break;
                    }
                }
                if (videoModeClicked) break;
            }
        }

        // Strategy 4: Tìm buttons bất kỳ có text match
        if (!videoModeClicked) {
            const allButtons = activeMenu.querySelectorAll('button');
            console.log(`[applySettings] Video mode Strategy 4: searching ${allButtons.length} buttons`);
            for (const btn of allButtons) {
                const btnText = btn.textContent.trim().toLowerCase();
                for (const term of searchTerms) {
                    if (btnText === term || btnText.includes(term)) {
                        console.log(`[applySettings] Video mode: clicking button "${btnText}" for ${targetModelName}`);
                        simulateClick(btn);
                        await sleep(getSettingsStepDelay());
                        videoModeClicked = true;
                        sendLog(`✓ Video mode: chọn ${targetModelName} (button)`, 'info');
                        break;
                    }
                }
                if (videoModeClicked) break;
            }
        }

        if (videoModeClicked) {
            needModel = false; // Skip dropdown logic below
        } else {
            console.log(`[applySettings] Video mode: "${targetModelName}" not found, will try dropdown fallback`);
        }
    }

    if (needModel) {
      const menuSelector = '[role="menu"]';
      const modelBtnSelector = 'button[aria-haspopup="menu"]';
      const modelItemsSelector = 'button, [role="menuitem"], [role="menuitemradio"]';
      const menus = document.querySelectorAll(menuSelector);
      console.log(`[applySettings] Found ${menus.length} menus`);
      if (menus.length > 0) {
          const activeMenu = menus[menus.length - 1]; // Current popup menu
          const modelBtn = activeMenu.querySelector(modelBtnSelector);
          if (modelBtn) {
              console.log(`[applySettings] Clicking model button to open dropdown`);
              simulateClick(modelBtn);
              await sleep(getSettingsStepDelay());

              // Find model items
              const allMenus2 = document.querySelectorAll(menuSelector);
              console.log(`[applySettings] After click, found ${allMenus2.length} menus`);
              if (allMenus2.length > 0) {
                  const dropdown = allMenus2[allMenus2.length - 1]; // latest nested popup
                  const items = dropdown.querySelectorAll(modelItemsSelector);
                  // Debug: log all available items
                  const availableItems = Array.from(items).map(i => i.textContent.trim().toLowerCase());
                  console.log(`[applySettings] Model dropdown items: [${availableItems.join(', ')}], looking for: "${targetModelName}" (targetText="${String(targetModelName).toLowerCase().trim()}")`);
                  console.log(`[applySettings] isFrames parameter received: ${isFrames}, typeof: ${typeof isFrames}`);
                  for (let item of items) {
                      const domText = item.textContent.toLowerCase().trim();
                      const targetText = String(targetModelName).toLowerCase().trim();

                      if (domText === targetText || (domText.includes(targetText) && targetModelName !== 'Frames' && targetModelName !== 'Ingredients')) {
                          console.log(`[applySettings] Clicking model item: domText="${domText}", targetText="${targetText}"`);
                          simulateClick(item);
                          await sleep(getSettingsStepDelay());
                          break;
                      }
                      else if (domText.includes(targetText)) {
                          if (targetText.includes('veo') && domText.includes('veo') &&
                              ((targetText.includes('fast') && !domText.includes('fast')) || (targetText.includes('quality') && !domText.includes('quality')))) {
                              // Bỏ qua nếu Veo không đúng hậu tố
                              continue;
                          }
                          console.log(`[applySettings] Clicking model item (partial): domText="${domText}", targetText="${targetText}"`);
                          simulateClick(item);
                          await sleep(getSettingsStepDelay());
                          break;
                      }
                  }
              }
        }
      }
    }

    // close settings menu
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    simulateClick(document.body);
}

async function addFileToPrompt(fileId, fileName, flowFileId) {
    // Ensure Flow tab active (context menu "Thêm vào câu lệnh" cần tab active)
    if (document.visibilityState === 'hidden') {
      await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'ensureFlowTabActive' }, () => resolve());
      });
      await sleep(300);
    }

    // U-2.1: Priority 1 — file_id lookup (persistent, chính xác nhất)
    if (flowFileId) {
      const tile = findTileByFileId(flowFileId);
      if (tile) {
        fileId = tile.dataset.tileId;
      }
    }

    let els = document.querySelectorAll(`div[data-tile-id="${fileId}"]`);

    // Cross-project validation: nếu tìm thấy tile nhưng file_name không match → không dùng
    if (els.length > 0 && fileName) {
        const tile = els[els.length - 1];
        const currentFn = extractFileName(tile);
        if (currentFn && currentFn !== fileName) {
            console.log(`[TobyFlow] addFileToPrompt: tile_id ${fileId.substring(0, 20)}... exists but file_name mismatch (${currentFn.substring(0, 15)}... vs ${fileName.substring(0, 15)}...) → cross-project collision, finding by file_name`);
            els = []; // Force fallback to file_name search
        }
    }

    // Fallback: tìm tile bằng file_name nếu data-tile-id không tìm thấy hoặc không match
    if (els.length === 0 && fileName) {
        const allTiles = document.querySelectorAll('[data-tile-id]');
        for (const tile of allTiles) {
            const fn = extractFileName(tile);
            if (fn === fileName) {
                const newId = tile.dataset.tileId;
                console.log(`[TobyFlow] addFileToPrompt: resolved ${fileId.substring(0, 20)}... → ${newId.substring(0, 20)}... via file_name`);
                fileId = newId;
                els = document.querySelectorAll(`div[data-tile-id="${fileId}"]`);
                break;
            }
        }
    }
    if (els.length === 0) {
        sendLog(`⚠️ Không tìm thấy file có ID: ${fileId} trên màn hình.`, 'warn');
        return false; // Return false để caller biết fail
    }
    
    const el = els[els.length - 1];

    // Context menu mutex — tránh collision với download context menu trong pipeline mode
    await _acquireCtxMenuLock();
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(getInputTimeoutMs());

      const targetEl = el.querySelector('img') || el.querySelector('a') || el;
      simulateContextMenu(targetEl);
      await sleep(getInputTimeoutMs());

      // CRITICAL: Tìm context menu đang mở TRƯỚC, rồi mới query menu items bên trong
      // Tránh match buttons ở header (như "Add Media")
      const ctxMenu = document.querySelector('[role="menu"][data-state="open"]');
      if (!ctxMenu) {
          _closeContextMenu();
          sendLog(`⚠️ Lỗi: Context menu không mở được cho file ${fileId}`, 'warn');
          return false; // Return false để caller biết fail
      }

      // Chỉ tìm menu items TRONG context menu (không phải toàn page)
      const menuItems = ctxMenu.querySelectorAll('[role="menuitem"]');
      let clicked = false;

      // Strategy 1: Match text content với multi-language labels
      for (const item of menuItems) {
          const text = item.textContent?.trim() || '';
          if (_textIncludesAny(text, _ARIA_LABELS.addToPrompt)) {
              simulateClick(item);
              clicked = true;
              break;
          }
      }

      // Strategy 2: Fallback - tìm menu item có icon "add" TRONG context menu
      if (!clicked) {
          for (const item of menuItems) {
              const icon = item.querySelector('i.google-symbols');
              if (icon && icon.textContent?.trim() === 'add') {
                  simulateClick(item);
                  clicked = true;
                  break;
              }
          }
      }

      // Close context menu after action
      if (clicked) {
          await sleep(100);  // Chờ menu animation
          _closeContextMenu();
      }
      if (!clicked) {
          _closeContextMenu();
          sendLog(`⚠️ Lỗi: Không tìm thấy menu "Add to prompt" ở file ${fileId}`, 'warn');
      }
      await sleep(getInputTimeoutMs());
      return clicked; // Return true nếu thêm thành công, false nếu fail
    } finally {
      _releaseCtxMenuLock();
    }
}

/**
 * Phase FAR-5: Exponential backoff với jitter — match Google retry guidance.
 * Plan Section 3.5.
 *
 * @param {number} retryIdx - 0-based retry index (0 = lần retry thứ 1, 1 = lần thứ 2, ...)
 * @param {object} settings - retrySettings từ runAutoPrompt scope
 *   - flowBackoffBaseSec (default 30)
 *   - flowBackoffMaxSec (default 300)
 *   - flowBackoffJitterPercent (default 20, range 0-50)
 * @returns {number} delay ms với jitter ±jitterPercent%
 */
function getExponentialBackoffMs(retryIdx, settings) {
  const s = settings || {};
  const baseSec = parseInt(s.flowBackoffBaseSec ?? 30, 10);
  const maxSec = parseInt(s.flowBackoffMaxSec ?? 300, 10);
  const jitterPct = Math.max(0, Math.min(50, parseInt(s.flowBackoffJitterPercent ?? 20, 10))) / 100;
  // retryIdx 0: 30s, 1: 60s, 2: 120s, 3: 240s, 4+: 300s cap
  const baseMs = baseSec * 1000 * Math.pow(2, Math.max(0, retryIdx));
  const cappedMs = Math.min(baseMs, maxSec * 1000);
  const jitter = cappedMs * jitterPct * (Math.random() * 2 - 1);
  return Math.round(cappedMs + jitter);
}

// [Fix] Cache settings từ payload để các delay functions dùng
// var allows safe re-declaration when content.js is re-injected (race condition between manifest inject and MessageBridge inject)
var _cachedInputTimeoutMs = 1200;
var _cachedDelayBetweenMs = 5000;

// Main execution process
async function runAutoPrompt(payload) {
  let { prompts, delayBetweenMs, inputTimeoutMs, fileIds, fileNameMap, genType, aspectRatio, modelName, frameFileIds, refPerPrompt, noTileWait, quantity, autoDownload, downloadResolution, videoDownloadResolution, refImageMode, mentionData, taskName } = payload;
  fileNameMap = fileNameMap || {};
  quantity = quantity || 1;
  refPerPrompt = refPerPrompt || false;
  noTileWait = noTileWait || false;
  // autoDownload: pass qua payload vì sidePanel context không access được DOM của content script
  autoDownload = autoDownload ?? false;
  // T-1: Resolution cho auto-download (1k/2k image, 720p/1080p video)
  downloadResolution = downloadResolution || '1k';
  videoDownloadResolution = videoDownloadResolution || '720p';
  // S4: Ref image mode - 'all' | 'mention' | 'sequential' | 'none'
  refImageMode = refImageMode || 'all';
  mentionData = mentionData || null;
  // [Fix] Cache settings từ payload để các delay functions trả về đúng giá trị
  _cachedInputTimeoutMs = inputTimeoutMs || 1200;
  _cachedDelayBetweenMs = delayBetweenMs || 5000;

  if (isRunning) {
    console.warn('[runAutoPrompt] Blocked: isRunning=true, ExecutionBlocker.isVisible=' + ExecutionBlocker.isVisible());
    return { blocked: true, reason: 'already_running' };
  }
  isRunning = true;
  shouldStop = false;
  isPaused = false;
  failedPrompts = [];
  _clickedRetryTileIds.clear(); // Reset retry tracking cho execution mới
  _retryingTiles.clear(); // Xóa dedup lock retry tiles từ lần chạy trước
  const DELAY_BEFORE_SUBMIT = getSubmitDelay();
  const _startedAt = Date.now();

  // Legacy FloatingTracker: hiển thị ngay khi bắt đầu
  FloatingTracker.updateLegacy({
    owner: payload._owner || 'prompts',
    label: payload._label || 'Auto Gen',
    status: 'running',
    current: 0,
    total: prompts.length,
    failed: 0,
    startedAt: _startedAt
  });

  // ExecutionBlocker: full-screen overlay chặn interaction
  ExecutionBlocker.show({
    title: 'Đang chuẩn bị...',
    subtitle: 'Extension đang thao tác, vui lòng chờ',
    current: 0,
    total: prompts.length,
    promptText: 'Chuẩn bị upload ảnh tham chiếu...',
    owner: payload._owner || 'prompts',
    indeterminate: true
  });

  // Upload pending local files trước khi chạy
  if (fileIds && fileIds.some(id => id.startsWith('upload_'))) {
    const idsStr = fileIds.join(', ');
    if (typeof window.uploadPendingFiles === 'function') {
      const uploaded = await window.uploadPendingFiles(idsStr);
      fileIds = uploaded.split(',').map(s => s.trim()).filter(Boolean);
      // Cập nhật input UI
      const fileIdsInput = document.getElementById('fileIdsInput');
      if (fileIdsInput) {
        fileIdsInput.value = fileIds.join(', ');
        if (typeof window.renderFileIdThumbnails === "function") window.renderFileIdThumbnails();
      }
    }
  }
  if (frameFileIds) {
    // Per-prompt frame pairs: array of { frame1, frame2 }
    if (Array.isArray(frameFileIds)) {
      for (let fi = 0; fi < frameFileIds.length; fi++) {
        const fp = frameFileIds[fi];
        if (!fp) continue;
        if (fp.frame1?.startsWith('upload_') && typeof window.uploadPendingFiles === 'function') {
          fp.frame1 = (await window.uploadPendingFiles(fp.frame1)).trim();
        }
        if (fp.frame2?.startsWith('upload_') && typeof window.uploadPendingFiles === 'function') {
          fp.frame2 = (await window.uploadPendingFiles(fp.frame2)).trim();
        }
      }
    } else {
      // Legacy single pair: { frame1, frame2 }
      if (frameFileIds.frame1?.startsWith('upload_') && typeof window.uploadPendingFiles === 'function') {
        frameFileIds.frame1 = (await window.uploadPendingFiles(frameFileIds.frame1)).trim();
      }
      if (frameFileIds.frame2?.startsWith('upload_') && typeof window.uploadPendingFiles === 'function') {
        frameFileIds.frame2 = (await window.uploadPendingFiles(frameFileIds.frame2)).trim();
      }
    }
  }

  // Re-upload ref files nếu tile không còn trên page
  if (fileIds && fileIds.length > 0 && typeof window.reuploadMissingFiles === 'function') {
    const idsStr = fileIds.join(', ');
    // Truyền caches từ GenTab nếu có (để check file_name trước khi reupload)
    const thumbCache = window.GenTab?.thumbnailCache || {};
    const fnCache = window.GenTab?.fileNameCache || {};
    const updated = await window.reuploadMissingFiles(idsStr, thumbCache, null, fnCache);
    if (updated !== idsStr) {
      fileIds = updated.split(',').map(s => s.trim()).filter(Boolean);
      const fileIdsInput = document.getElementById('fileIdsInput');
      if (fileIdsInput) {
        fileIdsInput.value = fileIds.join(', ');
        if (typeof window.renderFileIdThumbnails === "function") window.renderFileIdThumbnails();
      }
    }
  }

  // Đọc retry settings từ chrome.storage (đồng bộ với Settings page)
  let retrySettings = {
    maxRetries: 2,
    tileTimeout: 180000,
    // Phase FAR-5: Exponential backoff — đọc từ user settings (Plan Section 3.5)
    flowBackoffBaseSec: 30,
    flowBackoffMaxSec: 300,
    flowBackoffJitterPercent: 20,
    // Phase FAR-2: Consecutive fail recovery — silent session refresh trigger
    flowAutoRecoveryEnabled: true,
    flowConsecutiveFailThreshold: 2,
  };
  try {
    const stored = await new Promise(r => chrome.storage.local.get(['af_settings', 'af_entitlements'], r));
    const s = stored.af_settings || {};
    retrySettings.maxRetries = parseInt(s.execMaxRetries ?? 2, 10);
    retrySettings.tileTimeout = parseInt(s.execTimeout ?? 180, 10) * 1000;
    // FAR-5
    retrySettings.flowBackoffBaseSec = parseInt(s.flowBackoffBaseSec ?? 30, 10);
    retrySettings.flowBackoffMaxSec = parseInt(s.flowBackoffMaxSec ?? 300, 10);
    retrySettings.flowBackoffJitterPercent = parseInt(s.flowBackoffJitterPercent ?? 20, 10);
    // FAR-2
    retrySettings.flowAutoRecoveryEnabled = s.flowAutoRecoveryEnabled !== false;
    retrySettings.flowConsecutiveFailThreshold = parseInt(s.flowConsecutiveFailThreshold ?? 2, 10);

    // Check retry_on_fail feature - override maxRetries = 0 nếu không có quyền
    const entitlements = stored.af_entitlements?.entitlements || {};
    const retryFeature = entitlements.retry_on_fail;
    const canUseRetry = retryFeature?.value === '1' || retryFeature?.value === 1;
    if (!canUseRetry) {
      retrySettings.maxRetries = 0; // Force no retry
    }
  } catch (e) {}

  const humanized = isHumanizedEnabled();
  if (humanized) {
    sendLog('Humanized mode: bật - gõ ký tự và delay ngẫu nhiên', 'info');
  }

  sendLog(`🚀 Bắt đầu chạy ${prompts.length} prompt(s)...`);
  if (refPerPrompt) {
    sendLog(`Chế độ mỗi prompt 1 ảnh: ${fileIds.length} ảnh cho ${prompts.length} prompt`, 'info');
  }

  try {
      if (genType && aspectRatio && modelName) {
          const hasRefs = !!(frameFileIds || (fileIds && fileIds.length > 0));
          await applySettings(genType, aspectRatio, modelName, hasRefs, quantity);
      }
  } catch(e) {
      sendLog(`Lỗi khi thiết lập cấu hình AI: ${e.message}`, 'error');
  }

  let completedCount = 0;
  let failedCount = 0;
  const allResultTileIds = []; // Collect actual result tile IDs across all prompts
  let lastPreTileIds = [];     // Track last captured preTileIds (for parallel mode return)
  let lastPreFileNames = null; // Track last captured preFileNames (for parallel mode return)

  // Parallel + autoDownload: capture baseline TRƯỚC prompt đầu tiên để chờ tất cả tiles sau
  // forceRefresh=true vì cần baseline chính xác trước vòng lặp submit
  const initialPreTileIds = noTileWait ? getUniqueTileIds(true) : [];
  const initialPreFileNames = noTileWait ? getExistingFileNames() : null;

  // Phase FAR-2: Consecutive failure tracker — silent session refresh recovery
  // (legacy mode KHÔNG hard-reload mid-runAutoPrompt, chỉ silent refresh).
  // Plan Section 3.2.
  let _consecutiveFailures = 0;
  let _lastSilentRefreshAt = 0;
  const SILENT_REFRESH_COOLDOWN_MS = 60000;  // Min 60s giữa 2 silent refresh attempts

  for (let i = 0; i < prompts.length; i++) {
    if (shouldStop) {
      sendLog('⚠️ Đã nhận lệnh dừng quá trình.', 'warn');
      break;
    }

    // Pause check
    if (isPaused) {
      sendLog('⏸ Đã tạm dừng. Nhấn Resume để tiếp tục.', 'warn');
      while (isPaused && !shouldStop) {
        await sleep(500);
      }
      if (shouldStop) {
        sendLog('⚠️ Đã nhận lệnh dừng quá trình.', 'warn');
        break;
      }
      sendLog('▶ Tiếp tục chạy...', 'info');
    }

    const prompt = prompts[i];
    const currentPrompt = prompt; // alias for blocker update
    sendLog(`[${i + 1}/${prompts.length}] "${prompt.substring(0, 50)}..."`, 'info');

    // Update ExecutionBlocker với prompt hiện tại
    ExecutionBlocker.update({
      title: 'Đang tạo ảnh...',
      subtitle: `Xử lý prompt ${i + 1}/${prompts.length}`,
      current: i,
      total: prompts.length,
      promptText: currentPrompt.length > 100 ? currentPrompt.substring(0, 100) + '...' : currentPrompt,
      indeterminate: false
    });

    let promptSuccess = false;

    // Reset retry tracking cho prompt mới — ngăn leak state từ prompt trước
    _clickedRetryTileIds.clear();

    // Outer attempt loop: 1 lần gốc + maxRetries lần retry (chỉ cho timeout case)
    const totalAttempts = 1 + retrySettings.maxRetries;
    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      if (shouldStop) break;

      if (attempt > 1) {
        // Phase FAR-5: Exponential backoff trước retry attempt — tránh thundering herd
        // attempt=2 → retryIdx=0 (~30s), attempt=3 → retryIdx=1 (~60s), ...
        const retryIdx = attempt - 2;
        const backoffMs = getExponentialBackoffMs(retryIdx, retrySettings);
        sendLog(`[Backoff] Đợi ${Math.round(backoffMs / 1000)}s trước thử lại lần ${attempt - 1}/${retrySettings.maxRetries}`, 'info');
        await sleep(backoffMs);
        if (shouldStop) break;

        sendLog(`Thử lại lần ${attempt - 1}/${retrySettings.maxRetries}...`, 'warn');
        // Update blocker: retry
        ExecutionBlocker.update({
          title: 'Đang thử lại...',
          subtitle: `Lần ${attempt - 1}/${retrySettings.maxRetries} - Prompt ${i + 1}/${prompts.length}`,
          current: i,
          total: prompts.length,
          promptText: currentPrompt.length > 100 ? currentPrompt.substring(0, 100) + '...' : currentPrompt,
          indeterminate: false
        });
      }

      let editor = getEditor();
      if (!editor) {
        sendLog('❌ Không tìm thấy ô nhập liệu (Slate editor)!', 'error');
        break;
      }

      // Check shouldStop trước khi bắt đầu các bước thao tác editor
      if (shouldStop) break;

      // 0. Pre-check: xoá ref images cũ đang có trong prompt area
      await removeExistingRefImages();
      if (shouldStop) break;

      // 1. Clears — delay cho Slate editor reset (sync với WorkflowExecutor)
      await clearEditor(editor);
      if (shouldStop) break;
      await sleep(humanized ? getHumanizedDelay(getClearEditorDelay()) : getClearEditorDelay());
      if (shouldStop) break;

      // 2. Add File References (or Frame references for Video+Frames)
      // Modes:
      // - 'all': tất cả prompts dùng chung tất cả fileIds
      // - 'mention': mỗi prompt dùng ảnh được @mention
      // - 'sequential' (refPerPrompt=true): mỗi prompt dùng 1 ảnh theo index
      // - 'none': không dùng ảnh tham chiếu
      let currentFileIds = fileIds;
      if (refImageMode === 'mention' && mentionData && mentionData[i]) {
        // Mention mode: lấy file_ids từ resolved @mentions
        const promptMentionData = mentionData[i];
        if (promptMentionData.refImages && promptMentionData.refImages.length > 0) {
          currentFileIds = promptMentionData.refImages
            .filter(ref => ref.file_id)  // Chỉ lấy những ref đã có file_id (đã upload)
            .map(ref => ref.file_id);
        } else {
          currentFileIds = [];
        }
      } else if (refImageMode === 'none') {
        // No ref images mode
        currentFileIds = [];
      } else if (refImageMode === 'sequential' || refPerPrompt) {
        // Sequential mode: mỗi prompt dùng 1 ảnh theo index
        currentFileIds = fileIds[i] ? [fileIds[i]] : [];
      }
      // 'all' mode: currentFileIds = fileIds (không thay đổi, dùng tất cả cho mỗi prompt)

      if (shouldStop) break; // Check trước khi add ref images

      if (frameFileIds) {
          // Resolve frame pair for current prompt
          const currentFrames = Array.isArray(frameFileIds)
            ? (frameFileIds[i] || null)
            : frameFileIds;
          if (currentFrames) {
            if (currentFrames.frame1 && !shouldStop) {
                sendLog(Array.isArray(frameFileIds) ? `Đang gài Frame Start (Prompt ${i + 1})...` : 'Đang gài Frame 1...', 'info');
                await addFileToPrompt(currentFrames.frame1, fileNameMap[currentFrames.frame1]);
            }
            if (currentFrames.frame2 && !shouldStop) {
                sendLog(Array.isArray(frameFileIds) ? `Đang gài Frame End (Prompt ${i + 1})...` : 'Đang gài Frame 2...', 'info');
                await addFileToPrompt(currentFrames.frame2, fileNameMap[currentFrames.frame2]);
            }
          }
      } else if (currentFileIds && currentFileIds.length > 0 && !shouldStop) {
          const logMsg = (refImageMode === 'sequential' || refPerPrompt)
            ? `Đang gài ảnh tham chiếu #${i + 1}...`
            : `Đang gài ${currentFileIds.length} ảnh tham chiếu...`;
          sendLog(logMsg, 'info');
          for (const fid of currentFileIds) {
              if (shouldStop) break; // Check trong vòng lặp add refs
              await addFileToPrompt(fid, fileNameMap[fid]);
          }
      }

      if (shouldStop) break; // Check sau khi add ref images

      // 3. Re-query editor (React có thể re-render sau clearEditor/addFileToPrompt → DOM element bị thay thế)
      editor = getEditor();
      if (!editor) {
        sendLog('❌ Không tìm thấy ô nhập liệu sau khi gài ảnh!', 'error');
        break;
      }

      // 3a. Types Prompt
      await insertText(editor, prompt);
      if (shouldStop) break;

      // 3b. Chờ Slate editor xử lý xong text trước khi submit
      // Google Flow Slate cần thời gian process beforeinput event.
      // Nếu click submit trước khi Slate process xong → "Prompt must be provided" error.
      // Dùng 2x inputTimeout giống WorkflowExecutor (đã test ổn định).
      const delayBeforeSubmit = humanized ? getHumanizedDelay(DELAY_BEFORE_SUBMIT) : DELAY_BEFORE_SUBMIT;
      await sleep(delayBeforeSubmit);
      if (shouldStop) break;

      // 4. Verify Slate model has text (check placeholder gone, not just DOM textContent)
      editor = getEditor() || editor;
      const hasPlaceholder = () => {
        const ed = getEditor();
        return ed && ed.querySelector('[data-slate-placeholder]') !== null;
      };

      if (hasPlaceholder()) {
        sendLog('⚠️ Slate placeholder vẫn còn → model rỗng, chờ...', 'warn');
        let waitSlate = 0;
        while (hasPlaceholder() && waitSlate < 2000) {
          await sleep(200);
          waitSlate += 200;
        }

        // Fallback: retry insert
        if (hasPlaceholder()) {
          sendLog('⚠️ Retry insert text...', 'warn');
          await _insertTextSingle(prompt);
          await sleep(500);
        }
      }

      // 5. Click Submit
      let submitBtn = getSubmitButton();
      if (!submitBtn) {
        sendLog('❌ Không tìm thấy nút Submit (arrow_forward)!', 'error');
        break;
      }

      // 5a. Chờ submit button enabled (Flow enable nút khi Slate đã process text)
      let waitSubmit = 0;
      while (submitBtn.disabled && waitSubmit < 15000) {
        await sleep(300);
        waitSubmit += 300;
        submitBtn = getSubmitButton() || submitBtn;
      }
      if (submitBtn.disabled) {
        sendLog('⚠️ Nút Submit vẫn disabled sau 15s, thử click...', 'warn');
      }

      // 5b. Record pre-submit tile IDs + file_names (for filtering lazy-loaded old tiles)
      // forceRefresh=true vì cần baseline chính xác trước khi submit
      const allPreTileIds = getUniqueTileIds(true);
      const allPreFileNames = getExistingFileNames();
      // Save for parallel mode return (capture tại thời điểm submit chính xác)
      lastPreTileIds = allPreTileIds;
      lastPreFileNames = allPreFileNames;

      // 5c. Click submit — ưu tiên bridge (main world .click()) rồi fallback simulateClick
      const afterSubmitDelay = getAfterSubmitDelay();
      sendLog(`Đang click Submit...`, 'info');

      // Tier 1: Bridge submit (main world — React onClick trực tiếp)
      const submitResult = await _slateBridgeCall('submit', {});
      if (!submitResult.success) {
        sendLog('⚠️ Bridge submit failed: ' + submitResult.error + ', fallback simulateClick', 'warn');
        simulateClick(submitBtn);
      }
      _incrementDailyStat('flow_prompt_total');
      await sleep(afterSubmitDelay);

      // 5d. Chờ editor cleared (Flow tự clear sau submit thành công)
      // Chỉ retry nếu bridge submit fail, không retry khi đã thành công
      if (!submitResult.success) {
        const editorAfterSubmit = getEditor();
        const editorTextAfter = editorAfterSubmit?.textContent?.trim() || '';
        if (editorTextAfter.length > 10) {
          sendLog('⚠️ Editor chưa bị xóa sau click, thử submit lại...', 'warn');
          submitBtn = getSubmitButton() || submitBtn;
          submitBtn.click();
          await sleep(afterSubmitDelay);
        }
      }
      sendLog(`✅ Đã submit prompt #${i+1}`, 'success');

      // Update FloatingTracker + ExecutionBlocker + sidePanel progress
      FloatingTracker.updateLegacy({
        owner: payload._owner || 'prompts',
        label: payload._label || 'Auto Gen',
        status: isPaused ? 'paused' : 'running',
        current: i + 1,
        total: prompts.length,
        failed: failedCount,
        startedAt: _startedAt
      });
      ExecutionBlocker.update({
        title: isPaused ? 'Đã tạm dừng' : 'Đang tạo ảnh...',
        subtitle: isPaused ? 'Nhấn Tiếp tục để chạy tiếp' : 'Chờ kết quả từ Flow...',
        current: i + 1,
        total: prompts.length,
        promptText: currentPrompt.length > 100 ? currentPrompt.substring(0, 100) + '...' : currentPrompt,
        indeterminate: false
      });
      try {
        chrome.runtime.sendMessage({
          action: 'promptProgress',
          current: i + 1,
          total: prompts.length
        });
      } catch (e) {}

      // 6. Wait for result tiles (skip khi noTileWait = true cho parallel mode)
      if (noTileWait) {
        sendLog('Song song: bỏ qua chờ tiles, tiếp tục...', 'info');
        // Parallel mode: trả về preTileIds + preFileNames cho caller tự gọi waitForNewTiles
        // Đây là baseline đúng vì capture ngay trước submit (line 1004-1006)
        completedCount++;
        promptSuccess = true;
      } else if (!shouldStop) {
        sendLog('Chờ kết quả...', 'info');
        // Update blocker: đang chờ tiles
        ExecutionBlocker.update({
          title: 'Đang chờ kết quả...',
          subtitle: `Flow đang xử lý prompt ${i + 1}/${prompts.length}`,
          current: i,
          total: prompts.length,
          promptText: currentPrompt.length > 100 ? currentPrompt.substring(0, 100) + '...' : currentPrompt,
          indeterminate: true
        });
        const result = await waitForNewTiles(allPreTileIds, retrySettings.tileTimeout, allPreFileNames);
        if (result.failed) {
          sendLog('❌ Google Flow báo lỗi - tạo ảnh thất bại', 'error');

          // Tách tiles fail vs success
          const failedTids = result.tiles.filter(tid => {
            const tile = _getTileById(tid);
            return detectTileStatus(tile) === 'failed';
          });
          const successTids = result.tiles.filter(tid => !failedTids.includes(tid));

          const allTilesFailed = successTids.length === 0;

          // Download tiles success ngay (nếu có)
          if (successTids.length > 0) {
            allResultTileIds.push(...successTids);
            if (autoDownload) {
              for (const tid of successTids) {
                await downloadTileMedia(tid, prompt, taskName || null, null, downloadResolution, null, null, videoDownloadResolution);
                await sleep(200);
              }
            }
          }

          // Retry tiles fail bằng nút "Thử lại" trên Flow (nhanh + đáng tin cậy hơn submit lại)
          if (failedTids.length > 0 && retrySettings.maxRetries > 0) {
            let remainingFailed = failedTids;
            // Track running success count: original successTids + tất cả retry successes.
            // Dùng làm discriminator cho Tier 2 (thay vì so sánh length array vốn không
            // chính xác khi retryFailedTilesViaButton trả [] cho cả succeeded + stillFailed
            // trong timeout case — Flow click retry OK nhưng tile mới chưa hiện trong 60s).
            let promptSuccessCount = successTids.length;

            // Tier 1: Click retry trên từng tile fail, lặp (maxRetries - 1) lần
            for (let btnRetry = 1; btnRetry <= retrySettings.maxRetries && remainingFailed.length > 0 && !shouldStop; btnRetry++) {
              sendLog(`[Retry L1] Click "Thử lại" lần ${btnRetry}/${retrySettings.maxRetries} cho ${remainingFailed.length} tile fail...`, 'warn');
              sendRetryStatus(`Click Retry (${btnRetry}/${retrySettings.maxRetries})`);
              const retryResult = await retryFailedTilesViaButton(remainingFailed, retrySettings.tileTimeout);

              if (retryResult.succeeded.length > 0) {
                allResultTileIds.push(...retryResult.succeeded);
                promptSuccessCount += retryResult.succeeded.length;
                sendLog(`[Retry L1] Thành công: ${retryResult.succeeded.length} ảnh`, 'success');
                if (autoDownload) {
                  for (const tid of retryResult.succeeded) {
                    await downloadTileMedia(tid, prompt, taskName || null, null, downloadResolution, null, null, videoDownloadResolution);
                    await sleep(200);
                  }
                }
              }
              remainingFailed = retryResult.stillFailed;
            }

            // Tất cả đã retry thành công
            if (remainingFailed.length === 0 && promptSuccessCount > 0) {
              completedCount++;
              promptSuccess = true;
            }

            // Tier 2 Fallback: CHỈ submit lại prompt 1 LẦN khi 0 tile success suốt
            // original + Tier 1 retry. Dùng promptSuccessCount thay vì array length compare
            // (tránh false negative trong timeout case khi retryFailedTilesViaButton trả [],[]).
            //
            // NOTE: Pipeline mode có thêm bước reload Flow tab giữa Tier 1 và Tier 2 để reset
            // editor state (xem TileMonitor.js + PromptQueue.forceReloadAndStabilize).
            // Legacy mode KHÔNG reload được vì content.js là orchestrator — location.reload()
            // sẽ kill execution context. Để dùng full retry-reload-fallback flow, bật pipeline
            // mode (queueEnabled=true).
            if (promptSuccessCount === 0 && !shouldStop) {
              sendLog(`[Retry L2] Tất cả ${failedTids.length} tile fail - Đang gửi lại prompt...`, 'warn');
              sendRetryStatus('Gửi lại Prompt');
              await sleep(getDelayBetweenPromptsMs());

              let fbEditor = getEditor();
              if (fbEditor) {
                await removeExistingRefImages();
                await clearEditor(fbEditor);
                await sleep(getClearEditorDelay());

                // Re-add ref images
                if (currentFileIds && currentFileIds.length > 0) {
                  for (const fid of currentFileIds) await addFileToPrompt(fid, fileNameMap[fid]);
                }
                if (frameFileIds) {
                  const retryFrames = Array.isArray(frameFileIds) ? (frameFileIds[i] || null) : frameFileIds;
                  if (retryFrames) {
                    if (retryFrames.frame1) await addFileToPrompt(retryFrames.frame1, fileNameMap[retryFrames.frame1]);
                    if (retryFrames.frame2) await addFileToPrompt(retryFrames.frame2, fileNameMap[retryFrames.frame2]);
                  }
                }

                fbEditor = getEditor();
                if (fbEditor) {
                  await insertText(fbEditor, prompt);
                  await sleep(getSubmitDelay());

                  // forceRefresh=true vì cần baseline chính xác trước fallback submit
                  const fbPreTileIds = getUniqueTileIds(true);
                  const fbPreFileNames = getExistingFileNames();

                  const fbSubmitResult = await _slateBridgeCall('submit', {});
                  if (!fbSubmitResult.success) {
                    let fbBtn = getSubmitButton();
                    if (fbBtn) {
                      let fbWait = 0;
                      while (fbBtn.disabled && fbWait < 10000) { await sleep(300); fbWait += 300; fbBtn = getSubmitButton() || fbBtn; }
                      simulateClick(fbBtn);
                    }
                  }
                  await sleep(getAfterSubmitDelay());

                  const fbResult = await waitForNewTiles(fbPreTileIds, retrySettings.tileTimeout, fbPreFileNames);
                  if (fbResult.tiles.length > 0 && !fbResult.failed) {
                    allResultTileIds.push(...fbResult.tiles);
                    sendLog(`[Retry L2] Gửi lại thành công: ${fbResult.tiles.length} ảnh`, 'success');
                    if (autoDownload) {
                      for (const tid of fbResult.tiles) {
                        await downloadTileMedia(tid, prompt, taskName || null, null, downloadResolution, null, null, videoDownloadResolution);
                        await sleep(200);
                      }
                    }
                    completedCount++;
                    promptSuccess = true;
                  } else {
                    sendLog(`[Retry L2] Gửi lại cũng thất bại`, 'error');
                  }
                }
              }
            }

            // Một số tile vẫn fail sau button retry → ghi nhận
            if (!promptSuccess && remainingFailed.length > 0 && !allStillFailed) {
              sendLog(`[Retry L1] ${remainingFailed.length}/${failedTids.length} tile vẫn fail sau click "Thử lại"`, 'warn');
            }
          }

          // Có ít nhất 1 tile success (gốc hoặc từ button retry) → tính là partial success
          const hasAnySuccess = successTids.length > 0 || allResultTileIds.length > 0;
          if (!promptSuccess && hasAnySuccess) {
            completedCount++;
            promptSuccess = true;
          }
          if (!promptSuccess) {
            failedCount++;
            _incrementDailyStat('flow_fail');
            failedPrompts.push({ index: i, prompt, error: 'Google Flow error', timestamp: Date.now() });
          }
        } else if (result.tiles.length > 0) {
          sendLog(`✅ Có ${result.tiles.length} kết quả mới`, 'success');
          allResultTileIds.push(...result.tiles);
          if (autoDownload) {
            sendLog(`Đang tải ${result.tiles.length} file [${downloadResolution.toUpperCase()}]...`, 'info');
            for (const tid of result.tiles) {
              await downloadTileMedia(tid, prompt, taskName || null, null, downloadResolution, null, null, videoDownloadResolution);
              await sleep(200);
            }
          }
          completedCount++;
          promptSuccess = true;
        } else {
          sendLog('⚠️ Timeout - không có kết quả mới', 'warn');
          if (attempt < totalAttempts) {
            const retryDelay = getDelayBetweenPromptsMs();
            const waitSec = Math.round(retryDelay / 1000);
            sendLog(`Chờ ${waitSec}s trước khi thử lại...`, 'warn');
            await sleep(retryDelay);
            continue; // retry
          }
          failedCount++;
          _incrementDailyStat('flow_fail');
          failedPrompts.push({ index: i, prompt, error: 'Timeout - no results', timestamp: Date.now() });
        }
      }
      break; // success or final failure, exit retry loop
    }

    // Phase FAR-2: Consecutive failure tracker → trigger silent session refresh.
    // KHÔNG hard-reload (sẽ kill runAutoPrompt loop). Pipeline mode dùng
    // forceReloadAndStabilize qua TileMonitor (đã có sẵn). Plan Section 3.2.
    if (promptSuccess) {
      _consecutiveFailures = 0;
    } else {
      _consecutiveFailures++;
      const threshold = retrySettings.flowConsecutiveFailThreshold || 2;
      const recoveryEnabled = retrySettings.flowAutoRecoveryEnabled !== false;
      const now = Date.now();
      const cooldownPassed = (now - _lastSilentRefreshAt) > SILENT_REFRESH_COOLDOWN_MS;
      if (recoveryEnabled
          && _consecutiveFailures >= threshold
          && i < prompts.length - 1
          && cooldownPassed
          && !shouldStop) {
        sendLog(`[Recovery] ${_consecutiveFailures} prompt fail liên tiếp — thử silent refresh Flow session...`, 'warn');
        sendRetryStatus('Refreshing Flow session');
        _lastSilentRefreshAt = now;
        const refreshed = await refreshFlowSession('recovery');
        if (refreshed) {
          _consecutiveFailures = 0;
          sendLog('[Recovery] Session refreshed thành công, tiếp tục queue', 'success');
          await sleep(3000);  // settle delay cho Next.js re-fetch
        } else {
          sendLog('[Recovery] Silent refresh fail — tiếp tục normal retry. Bật Pipeline Queue để dùng full reload-recovery flow.', 'warn');
        }
      }
    }

    // 7. Wait for next prompt
    // [Fix] Humanized mode: dùng random delay với jitter
    //       Normal mode: dùng delayBetweenPrompts từ settings (payload)
    if (i < prompts.length - 1 && !shouldStop) {
      const actualDelay = humanized
        ? getHumanizedDelay(getRandomDelay())
        : _cachedDelayBetweenMs;
      sendLog(`Chờ ${(actualDelay / 1000).toFixed(1)}s cho lượt tạo tiếp theo...`);
      await sleep(actualDelay);
    }
  }

  // Parallel mode: chờ TẤT CẢ tiles hoàn thành → retry nếu cần + download nếu bật
  if (noTileWait && !shouldStop && completedCount > 0) {
    sendLog('Chờ tất cả kết quả hoàn thành...', 'info');
    try {
      const allTilesResult = await waitForNewTiles(initialPreTileIds, retrySettings.tileTimeout, initialPreFileNames);
      if (allTilesResult.tiles.length > 0) {
        // Filter bỏ ref images
        const refIdSet = new Set(fileIds || []);
        const pureNewTiles = allTilesResult.tiles.filter(id => !refIdSet.has(id));

        // Bug fix: Settle delay TRƯỚC classify — Flow đôi khi flicker UI 'failed'
        // transient trước khi render final 'success'. waitForNewTiles return ngay
        // khi tiles có status nào đó stable, nhưng React/Flow có thể re-render lại
        // sau đó. 800ms settle giảm false-positive 'failed' classification → tránh
        // retry dư thừa trên tile thực ra success.
        await sleep(800);

        // Tách tiles thành công vs thất bại.
        // BUG FIX (2026-05-02): trước đây else-branch gom CẢ 'processing' và tile=null
        // (DOM removed) vào successTiles → download fire trên tile chưa ready/đã mất →
        // "tile not found" + missing files. Phải check explicit 'success'.
        const successTiles = [];
        const failedTileIds = [];
        const skippedTiles = [];
        for (const tid of pureNewTiles) {
          const tile = _getTileById(tid);
          const status = detectTileStatus(tile);
          if (status === 'failed') {
            failedTileIds.push(tid);
          } else if (status === 'success' && tile) {
            successTiles.push(tid);
          } else {
            // 'processing' hoặc tile=null (DOM removed) → KHÔNG download (sẽ fail).
            // Log warn để user biết, không count vào success/failed.
            skippedTiles.push(tid);
          }
        }
        if (skippedTiles.length > 0) {
          sendLog(`⚠️ ${skippedTiles.length} tile chưa ready (processing/missing) — bỏ qua download`, 'warn');
        }

        // Download tiles thành công
        allResultTileIds.push(...successTiles);
        if (successTiles.length > 0 && autoDownload) {
          sendLog(`Đang tải ${successTiles.length} file [${downloadResolution.toUpperCase()}]...`, 'info');
          for (const tid of successTiles) {
            await downloadTileMedia(tid, prompts[0] || 'parallel-batch', taskName || null, null, downloadResolution, null, null, videoDownloadResolution);
            await sleep(200);
          }
          sendLog(`Đã tải ${successTiles.length} file`, 'success');
        }

        // Retry failed tiles bằng nút "Thử lại" trên Flow (ưu tiên) → fallback submit lại prompt
        _clickedRetryTileIds.clear(); // Reset cho parallel retry session
        if (failedTileIds.length > 0 && retrySettings.maxRetries > 0) {
          // Map failed tile position → prompt index
          const failedPromptIndices = [];
          for (let ti = 0; ti < pureNewTiles.length; ti++) {
            if (failedTileIds.includes(pureNewTiles[ti])) {
              const promptIdx = Math.floor(ti / quantity);
              if (promptIdx < prompts.length && !failedPromptIndices.includes(promptIdx)) {
                failedPromptIndices.push(promptIdx);
              }
            }
          }

          sendLog(`${failedTileIds.length} ảnh thất bại (${failedPromptIndices.length} prompt), click "Thử lại"...`, 'warn');

          // Tier 1: Click nút "Thử lại" trên tất cả tiles fail (nhanh + đáng tin cậy)
          let remainingFailed = [...failedTileIds];
          for (let btnRetry = 1; btnRetry <= retrySettings.maxRetries && remainingFailed.length > 0 && !shouldStop; btnRetry++) {
            sendLog(`Click "Thử lại" lần ${btnRetry} cho ${remainingFailed.length} tile...`, 'warn');
            sendRetryStatus(`Click Retry (${btnRetry}/${retrySettings.maxRetries})`);
            const btnResult = await retryFailedTilesViaButton(remainingFailed, retrySettings.tileTimeout);

            if (btnResult.succeeded.length > 0) {
              allResultTileIds.push(...btnResult.succeeded);
              sendLog(`Retry button thành công: ${btnResult.succeeded.length} ảnh`, 'success');
              for (const tid of btnResult.succeeded) {
                await downloadTileMedia(tid, prompts[0] || 'parallel-batch', taskName || null, null, downloadResolution, null, null, videoDownloadResolution);
                await sleep(200);
              }
            }
            remainingFailed = btnResult.stillFailed;
          }

          // Tier 2 Fallback: CHỈ submit lại prompt khi TẤT CẢ tiles của prompt đó fail
          // Nếu chỉ 1-2 tile fail trong batch quantity=4 → ghi nhận failed, không submit lại cả batch (lãng phí)
          if (remainingFailed.length > 0 && !shouldStop) {
            // Map remaining failed tiles → prompt indices, kiểm tra xem prompt đó CÓ tile nào success không
            const allFailedPromptIndices = [];
            for (let ti = 0; ti < pureNewTiles.length; ti++) {
              if (remainingFailed.includes(pureNewTiles[ti])) {
                const promptIdx = Math.floor(ti / quantity);
                if (promptIdx < prompts.length && !allFailedPromptIndices.includes(promptIdx)) {
                  allFailedPromptIndices.push(promptIdx);
                }
              }
            }

            // Tìm prompts mà TẤT CẢ tiles đều fail (không có tile nào success)
            // Dùng remainingFailed (sau button retry) thay vì failedTileIds (trước retry)
            const fullyFailedPromptIndices = allFailedPromptIndices.filter(promptIdx => {
              const startTile = promptIdx * quantity;
              const endTile = Math.min(startTile + quantity, pureNewTiles.length);
              for (let ti = startTile; ti < endTile; ti++) {
                if (!remainingFailed.includes(pureNewTiles[ti])) return false; // Có tile success hoặc đã retry thành công
              }
              return true;
            });

            // Chỉ fallback submit cho prompts mà TẤT CẢ tiles fail
            if (fullyFailedPromptIndices.length > 0) {
              sendLog(`[Retry L2] ${fullyFailedPromptIndices.length} prompt tất cả tiles fail - Đang gửi lại...`, 'warn');
              sendRetryStatus('Gửi lại Prompt');

              for (let ri = 0; ri < fullyFailedPromptIndices.length && !shouldStop; ri++) {
                const promptIdx = fullyFailedPromptIndices[ri];
                const retryPrompt = prompts[promptIdx];
                sendLog(`[Retry L2] Gửi lại prompt ${ri + 1}/${fullyFailedPromptIndices.length}: "${retryPrompt.substring(0, 40)}..."`, 'warn');

                let editor = getEditor();
                if (!editor) break;
                await clearEditor(editor);
                await sleep(getClearEditorDelay());

                let retryFileIds = [];
                if (refImageMode === 'mention' && mentionData && mentionData[promptIdx]) {
                  const promptMentionData = mentionData[promptIdx];
                  if (promptMentionData.refImages && promptMentionData.refImages.length > 0) {
                    retryFileIds = promptMentionData.refImages.filter(ref => ref.file_id).map(ref => ref.file_id);
                  }
                } else if (refImageMode === 'none') {
                  retryFileIds = [];
                } else if (refImageMode === 'sequential' || refPerPrompt) {
                  retryFileIds = fileIds[promptIdx] ? [fileIds[promptIdx]] : [];
                } else {
                  retryFileIds = fileIds || [];
                }

                if (retryFileIds.length > 0) {
                  for (const fid of retryFileIds) await addFileToPrompt(fid, fileNameMap[fid]);
                }

                editor = getEditor();
                if (!editor) break;
                await insertText(editor, retryPrompt);
                await sleep(getSubmitDelay());

                // forceRefresh=true vì cần baseline chính xác trước retry submit
                const retryPreTileIds = getUniqueTileIds(true);
                const retryPreFileNames = getExistingFileNames();

                const submitResult = await _slateBridgeCall('submit', {});
                if (!submitResult.success) {
                  let submitBtn = getSubmitButton();
                  if (!submitBtn) break;
                  let waitMs = 0;
                  while (submitBtn.disabled && waitMs < 10000) { await sleep(300); waitMs += 300; submitBtn = getSubmitButton() || submitBtn; }
                  simulateClick(submitBtn);
                }
                await sleep(getAfterSubmitDelay());

                const retryResult = await waitForNewTiles(retryPreTileIds, retrySettings.tileTimeout, retryPreFileNames);
                if (retryResult.tiles.length > 0) {
                  const retryNewTiles = retryResult.tiles.filter(id => !refIdSet.has(id));
                  // Tách success vs fail (handle partial success)
                  const retrySuccessTiles = retryNewTiles.filter(tid => {
                    const tile = _getTileById(tid);
                    return detectTileStatus(tile) !== 'failed';
                  });
                  if (retrySuccessTiles.length > 0) {
                    allResultTileIds.push(...retrySuccessTiles);
                    if (autoDownload) {
                      for (const tid of retrySuccessTiles) {
                        await downloadTileMedia(tid, retryPrompt, taskName || null, null, downloadResolution, null, null, videoDownloadResolution);
                        await sleep(200);
                      }
                    }
                    sendLog(`[Retry L2] Gửi lại thành công: ${retrySuccessTiles.length}/${retryNewTiles.length} ảnh`, 'success');
                  }
                  if (retrySuccessTiles.length < retryNewTiles.length) {
                    const fbFailCount = retryNewTiles.length - retrySuccessTiles.length;
                    sendLog(`[Retry L2] ${fbFailCount} tile vẫn fail sau gửi lại`, 'warn');
                    if (retrySuccessTiles.length === 0) {
                      failedCount++;
                      _incrementDailyStat('flow_fail');
                      failedPrompts.push({ index: promptIdx, prompt: retryPrompt, error: 'Retry failed', timestamp: Date.now() });
                    }
                  }
                } else {
                  sendLog(`[Retry L2] Gửi lại thất bại: "${retryPrompt.substring(0, 40)}..."`, 'error');
                  failedCount++;
                  _incrementDailyStat('flow_fail');
                  failedPrompts.push({ index: promptIdx, prompt: retryPrompt, error: 'Retry failed', timestamp: Date.now() });
                }

                if (ri < fullyFailedPromptIndices.length - 1) await sleep(getDelayBetweenPromptsMs());
              }
            }

            // Prompts có partial fail (1-2 tile fail, còn lại success) → ghi nhận failed tiles
            const partialFailPromptIndices = allFailedPromptIndices.filter(idx => !fullyFailedPromptIndices.includes(idx));
            if (partialFailPromptIndices.length > 0) {
              const partialFailCount = remainingFailed.filter(tid => {
                const ti = pureNewTiles.indexOf(tid);
                const promptIdx = Math.floor(ti / quantity);
                return partialFailPromptIndices.includes(promptIdx);
              }).length;
              sendLog(`${partialFailCount} tile fail (partial) — đã tải ${successTiles.length} tile thành công`, 'warn');
            }
          }
        } else if (failedTileIds.length > 0) {
          // retry_on_fail = false → ghi nhận failed per prompt (không per tile), không retry
          const failedPromptSet = new Set();
          for (let ti = 0; ti < pureNewTiles.length; ti++) {
            if (failedTileIds.includes(pureNewTiles[ti])) {
              const promptIdx = Math.floor(ti / quantity);
              if (promptIdx < prompts.length && !failedPromptSet.has(promptIdx)) {
                failedPromptSet.add(promptIdx);
                failedCount++;
                _incrementDailyStat('flow_fail');
                failedPrompts.push({ index: promptIdx, prompt: prompts[promptIdx], error: 'Google Flow error', timestamp: Date.now() });
              }
            }
          }
          sendLog(`${failedTileIds.length} ảnh thất bại (${failedPromptSet.size} prompt) - Retry bị khóa`, 'warn');
        }
      } else {
        sendLog('⚠️ Không có kết quả mới để tải', 'warn');
      }
    } catch (e) {
      sendLog('Lỗi khi chờ/tải kết quả: ' + e.message, 'error');
    }
  }

  if (!shouldStop) {
    if (failedCount > 0) {
      sendLog(`⚠️ Hoàn tất: ${completedCount} thành công, ${failedCount} thất bại`, 'warn');
    } else {
      sendLog('🎉 Hoàn tất tất cả prompts!', 'success');
    }
    notifyCompletion('Toby Flow', `Hoàn tất: ${completedCount}/${prompts.length} prompts`);
  }

  isRunning = false;
  isPaused = false;

  // ExecutionBlocker: ẩn overlay TRƯỚC FloatingTracker (tránh exception block hide)
  ExecutionBlocker.hide();

  // FloatingTracker: hiển thị kết quả hoàn tất (có thể throw, nhưng blocker đã hide)
  try {
    FloatingTracker.updateLegacy({
      owner: payload._owner || 'prompts',
      label: payload._label || 'Auto Gen',
      status: shouldStop ? 'stopped' : 'completed',
      current: completedCount,
      total: prompts.length,
      failed: failedCount,
      startedAt: _startedAt
    });
  } catch (e) {
    console.warn('[runAutoPrompt] FloatingTracker.updateLegacy error:', e.message);
  }

  // Notify sidePanel about completion and failed prompts
  try {
    chrome.runtime.sendMessage({
      action: 'promptExecutionComplete',
      completedCount,
      failedCount,
      totalCount: prompts.length,
      failedPrompts: failedPrompts.length > 0 ? failedPrompts : []
    }).catch(() => {});
  } catch (e) {}

  return {
    success: true,
    completedCount,
    failedCount,
    totalCount: prompts.length,
    uploadedFileIds: fileIds,
    resultTileIds: allResultTileIds,
    // Parallel mode: trả về baseline tại thời điểm submit để caller tự gọi waitForNewTiles
    preTileIds: lastPreTileIds,
    // Convert Set → Array để serialize qua chrome message
    preFileNames: lastPreFileNames ? Array.from(lastPreFileNames) : null
  };
}

/**
 * K-4: Scan all gallery tiles and return structured data
 * Returns array of { tileId, mediaType, mediaSrc, status, thumbnail }
 */
function scanGalleryTiles() {
  const tileIds = getUniqueTileIds();
  const results = [];
  for (const tileId of tileIds) {
    const tile = _getTileById(tileId);
    if (!tile) continue;

    const img = tile.querySelector('img');
    const video = tile.querySelector('video');
    let mediaType = 'unknown';
    let mediaSrc = '';
    let thumbnail = '';

    // Video detection: ưu tiên check <video> trước
    // Flow có thể render cả <img> (thumbnail) + <video> trong cùng tile
    if (video) {
      mediaType = 'video';
      mediaSrc = video.src || (video.querySelector('source')?.src) || '';
      // Thumbnail priority: poster > <img> sibling > video src
      thumbnail = video.poster || '';
      if (!thumbnail && img && img.src && !img.src.startsWith('data:') && !img.src.includes('chrome-extension')) {
        thumbnail = img.src;
      }
      if (!thumbnail) thumbnail = mediaSrc;
    } else if (img && img.src && !img.src.startsWith('data:') && !img.src.includes('chrome-extension')) {
      mediaType = 'image';
      mediaSrc = img.src;
      thumbnail = img.src;
    }

    const status = detectTileStatus(tile);
    const file_name = extractFileName(tile) || null;

    const flowInfo = extractFlowFileInfo(tile);
    results.push({ tileId, mediaType, mediaSrc, status, thumbnail, file_name, ...(flowInfo && { file_id: flowInfo.file_id, project_id: flowInfo.project_id }) });
  }
  return results;
}

// ─── Flow page settings init (1-time per page load) ───────────────────
// Flag track xem đã apply Grid view + show tile details chưa.
// Persist qua sessionStorage để survive extension reload trong cùng tab.
var _FLOW_SETTINGS_KEY = 'tobyflow_settings_applied';
var _flowSettingsApplied = sessionStorage.getItem(_FLOW_SETTINGS_KEY) === 'true';

/**
 * Apply Flow page settings (Grid view + show tile details) — chỉ chạy 1 LẦN per tab session.
 *
 * Intent: setup Flow page UI để extension có thể parse tiles đúng (Grid layout + chi tiết).
 * Idempotent: subsequent calls skip ngay nhờ flag `_flowSettingsApplied` (persist qua sessionStorage).
 *
 * Caller: gọi ở entry point của các operations cần Flow page setup đúng (vd applySettings).
 *
 * Tách riêng từ `ensureFlowTilesLoaded()` (chỉ làm zoom) — settings là 1-time concern,
 * không cần fire mỗi lần check tile.
 */
async function ensureFlowSettingsApplied() {
  // Idempotent guard — đã apply thì skip ngay, tránh fire DOM events redundantly
  if (_flowSettingsApplied) {
    console.log('[TobyFlow] ensureFlowSettingsApplied: SKIPPED (already applied in this session)');
    return;
  }

  // Tìm Flow header settings button (icon settings_2)
  let flowSettingsBtn = null;
  const allIcons = document.querySelectorAll('i.google-symbols');
  for (const icon of allIcons) {
    if (icon.textContent.trim() === 'settings_2') {
      flowSettingsBtn = icon.closest('button');
      break;
    }
  }

  if (!flowSettingsBtn) {
    // Settings button chưa render (Flow page chưa ready) — KHÔNG set flag, retry lần sau
    console.log('[TobyFlow] ensureFlowSettingsApplied: settings_2 icon chưa có — Flow page chưa ready, retry next call');
    return;
  }

  console.log('[TobyFlow] ensureFlowSettingsApplied: applying Grid view + show tile details (1-time)...');

  // Mở settings menu
  simulateClick(flowSettingsBtn);
  await sleep(500);

  // Bật Grid view (nếu chưa active) — check `data-state` để skip click nếu OK
  const tabTriggers = document.querySelectorAll('.flow_tab_slider_trigger');
  let gridClicked = false;
  for (const trigger of tabTriggers) {
    const label = trigger.getAttribute('aria-label') || trigger.textContent.trim();
    if (label === 'Grid' && trigger.getAttribute('data-state') !== 'active') {
      simulateClick(trigger);
      await sleep(300);
      gridClicked = true;
      break;
    }
  }

  // Bật "Hiện thông tin chi tiết về ô" (multi-language support)
  let detailsClicked = false;
  const settingRows = document.querySelectorAll('[role="menu"] div');
  for (const row of settingRows) {
    if (_textIncludesAny(row.textContent, _ARIA_LABELS.showTileDetails)) {
      const toggleBtns = row.querySelectorAll('.flow_tab_slider_trigger');
      for (const btn of toggleBtns) {
        const label = btn.getAttribute('aria-label') || btn.textContent.trim();
        if (_ariaLabelMatches(label, _ARIA_LABELS.toggleOn) && btn.getAttribute('data-state') !== 'active') {
          simulateClick(btn);
          await sleep(300);
          detailsClicked = true;
          break;
        }
      }
      break;
    }
  }

  // Đóng settings menu
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  simulateClick(document.body);
  await sleep(300);

  // SET FLAG + persist to sessionStorage — survive extension reload trong cùng tab
  _flowSettingsApplied = true;
  sessionStorage.setItem(_FLOW_SETTINGS_KEY, 'true');
  console.log(`[TobyFlow] ensureFlowSettingsApplied: DONE (gridClicked=${gridClicked}, detailsClicked=${detailsClicked})`);
}

/**
 * Chuẩn bị Flow page để scan/check tile bằng cách FORCE LOAD tiles qua zoom.
 *
 * Intent: chỉ chạy khi cần TÌM 1 file Flow ở ref_img mà chưa load (vd `correctStaleFileIds`
 * Tầng 3 fallback). Zoom out + scroll trigger lazy-load → tile xuất hiện trong DOM.
 *
 * KHÔNG động vào Flow settings menu (Grid view, show details) — đó là `ensureFlowSettingsApplied()`
 * (1-time concern, tách riêng).
 *
 * Skip zoom nếu DOM đã có ≥50 tiles — assume đủ tiles để check.
 */
async function ensureFlowTilesLoaded() {
  const tilesBeforeCount = document.querySelectorAll('[data-tile-id]').length;

  // Skip zoom nếu đã đủ tiles
  if (tilesBeforeCount >= 50) {
    console.log(`[TobyFlow] ensureFlowTilesLoaded: skipping zoom (${tilesBeforeCount} tiles already loaded)`);
    return;
  }

  const originalZoom = document.body.style.zoom || '1';

  try {
    // Zoom xuống 50% + scroll để buộc Flow lazy-load tất cả tiles
    document.body.style.zoom = '0.5';
    await sleep(1500);

    const scrollContainer = document.querySelector('[class*="sc-"]')?.closest('[style*="overflow"]') || document.documentElement;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
    await sleep(800);
    scrollContainer.scrollTop = 0;
    await sleep(500);
  } finally {
    if (document.body.style.zoom === '0.5') {
      document.body.style.zoom = originalZoom;
      await sleep(300);
    }
  }

  const tilesAfterLoad = document.querySelectorAll('[data-tile-id]').length;
  console.log(`[TobyFlow] ensureFlowTilesLoaded: ${tilesBeforeCount} → ${tilesAfterLoad} tiles (after zoom)`);
}

// sidePanel mode: content script no longer injects sidebar.
// SidebarManager.init() is called from sidebar.html context.
// Content script only provides DOM interaction functions + message listener.

// === Message listener for sidePanel <-> content script communication ===
// Inject Slate bridge vào main world ngay khi content script load
// Bridge cần có sẵn trước khi bất kỳ insert/clear nào chạy
try { injectSlateBridge(); } catch(e) { console.log('[TobyFlow] Bridge inject deferred:', e.message); }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ping handler — background.js dùng để check content.js đã load chưa trước khi auto-inject
  if (message.action === 'ping') {
    sendResponse({ pong: true, loadedAt: self.__tobyflowContentJsLoaded__ });
    return false; // Sync response, không giữ channel open
  }

  const handlers = {
    'runAutoPrompt': async () => {
      try {
        const result = await runAutoPrompt(message.payload);
        // runAutoPrompt tự reset isRunning và hide ExecutionBlocker khi hoàn thành
        return result;
      } catch (err) {
        console.error('[runAutoPrompt] Unhandled error:', err);
        // Cleanup nếu có exception không được handle bên trong runAutoPrompt
        ExecutionBlocker.hide();
        isRunning = false;
        isPaused = false;
        return { success: false, error: err.message };
      }
    },
    'applySettings': async () => {
      console.log(`[content.js] applySettings message received:`, JSON.stringify({ genType: message.genType, ratio: message.ratio, model: message.model, isFrames: message.isFrames, quantity: message.quantity }));
      await applySettings(message.genType, message.ratio, message.model, message.isFrames, message.quantity);
      return { success: true };
    },
    'getEditor': () => {
      const editor = getEditor();
      // Check Slate state ngoài DOM existence - verify React/Slate thực sự ready
      let hasSlateState = false;
      let debugInfo = {};

      if (editor) {
        try {
          // 1. Editor không bị disabled
          const isDisabled = editor.closest('[data-disabled="true"]') ||
                            editor.querySelector('[data-slate-editor="true"][contenteditable="false"]');

          // 2. Submit button tồn tại (không cần check enabled - button disabled khi editor trống là bình thường)
          const submitBtn = getSubmitButton();
          const btnExists = !!submitBtn;

          // 3. Editor có thể edit được (contenteditable hoặc có Slate editor marker)
          // [Phase 6 cleanup] Bỏ data-contents (Slate <0.50 legacy), thay bằng data-slate-editor
          const slateEditor = editor.querySelector('[data-slate-editor="true"]') || editor;
          const isEditable = slateEditor?.getAttribute('contenteditable') === 'true' ||
                            editor.hasAttribute('data-slate-editor');

          // Slate ready khi: editor tồn tại + không disabled + có submit button + editable
          // Bỏ check loading spinner và btnEnabled để tránh false negative
          hasSlateState = !isDisabled && btnExists && isEditable;

          debugInfo = { isDisabled: !!isDisabled, btnExists, isEditable };
        } catch (e) {
          hasSlateState = false;
          debugInfo = { error: e.message };
        }
      }

      return { exists: !!editor, hasSlateState };
    },
    'dismissBlockingModal': () => {
      // BUG FIX: Sau reload, Flow có thể hiện modal xác nhận quyền sử dụng → chặn upload
      // Tìm và dismiss modal nếu có
      let hadModal = false;

      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
      for (const dialog of dialogs) {
        // Strategy 1: Modal xác nhận quyền - click nút Accept/Confirm/OK/Đồng ý
        const acceptBtn = dialog.querySelector(
          'button:not([aria-label*="close" i]):not([aria-label*="cancel" i])'
        );
        // Tìm nút có text Accept, Confirm, OK, Đồng ý, Continue, Got it, etc.
        const buttons = dialog.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('accept') || text.includes('confirm') || text.includes('ok') ||
              text.includes('đồng ý') || text.includes('xác nhận') || text.includes('continue') ||
              text.includes('got it') || text.includes('agree') || text.includes('tiếp tục')) {
            console.log('[dismissBlockingModal] Clicking accept button:', btn.textContent);
            btn.click();
            hadModal = true;
            break;
          }
        }
        if (hadModal) continue;

        // Strategy 2: Nút đóng (X button, Cancel, Close)
        const closeBtn = dialog.querySelector(
          'button[aria-label*="close" i], button[aria-label*="đóng" i], ' +
          '[data-dismiss], [data-close]'
        );
        if (closeBtn) {
          console.log('[dismissBlockingModal] Clicking close button');
          closeBtn.click();
          hadModal = true;
          continue;
        }

        // Strategy 3: Click backdrop/overlay để dismiss
        const backdrop = dialog.parentElement?.querySelector('[data-state="open"][data-overlay]');
        if (backdrop) {
          backdrop.click();
          hadModal = true;
        }
      }

      // Strategy 4: Click Escape key để dismiss modal
      if (!hadModal) {
        const openModal = document.querySelector('[data-state="open"][role="dialog"]');
        if (openModal) {
          document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          hadModal = true;
        }
      }

      return { hadModal };
    },
    'checkBlockingModal': () => {
      // Check xem có modal đang mở không (không dismiss)
      const hasModal = !!(
        document.querySelector('[role="dialog"][data-state="open"]') ||
        document.querySelector('[role="alertdialog"][data-state="open"]') ||
        document.querySelector('[role="dialog"]:not([data-state="closed"])')
      );
      return { hasModal };
    },
    'insertText': async () => {
      // Abort check — user bấm forceStop trước insert
      if (shouldStop) {
        console.log('[insertText] ⏹ Aborted before start (shouldStop=true)');
        return { success: false, error: 'ABORTED', message: 'User stopped before insert' };
      }
      const editor = getEditor();
      if (editor) await insertText(editor, message.text);
      return { success: true };
    },
    'clearEditor': async () => {
      // Abort check — user bấm forceStop trước clear
      if (shouldStop) {
        console.log('[clearEditor] ⏹ Aborted before start (shouldStop=true)');
        return { success: false, error: 'ABORTED', message: 'User stopped before clear' };
      }
      const editor = getEditor();
      if (editor) await clearEditor(editor);
      return { success: true };
    },
    'clickSubmit': async () => {
      // Abort check — user bấm forceStop trước/trong khi clickSubmit
      if (shouldStop) {
        console.log('[clickSubmit] ⏹ Aborted before start (shouldStop=true)');
        return { success: false, error: 'ABORTED', message: 'User stopped before submit' };
      }
      let btn = getSubmitButton();
      const editor = getEditor();
      console.log('[clickSubmit] 🚀 Start. Button:', !!btn, 'disabled:', btn?.disabled, 'Editor:', !!editor);

      // Wait for button to be enabled (max 5s) - Flow UI enable button sau khi Slate model có text
      let waitMs = 0;
      while (btn?.disabled && waitMs < 5000) {
        if (shouldStop) {
          console.log('[clickSubmit] ⏹ Aborted while waiting button enable');
          return { success: false, error: 'ABORTED', message: 'User stopped while waiting button' };
        }
        await sleep(200);
        waitMs += 200;
        btn = getSubmitButton() || btn;
      }
      if (waitMs > 0) {
        console.log('[clickSubmit] Waited', waitMs, 'ms for button enable, disabled:', btn?.disabled);
      }

      // Approach 1: Slate Bridge (React internal submit handler) — main path
      // Trust bridge return — verify gen-done là trách nhiệm của caller (waitForNewTiles ở
      // workflow executor có MutationObserver + 3-layer filter, đáng tin hơn nhiều so với
      // detector tile-count/btn-disabled inline ở đây).
      // Detector inline trước đây bị FALSE NEGATIVE vì:
      //   - Flow dùng virtual list → tile count có thể GIẢM khi scroll dù gen đã start
      //   - Flow không reliably disable button khi gen, hoặc enable lại quá nhanh (<200ms)
      // → Fall through các approach 2-4 khi bridge đã work gây DOUBLE/TRIPLE submit.
      console.log('[clickSubmit] 🎯 Approach 1: Slate Bridge (React internal submit)');
      injectSlateBridge();
      try {
        const result = await _slateBridgeCall('submit', {});
        console.log('[clickSubmit]    Bridge return:', result);
        if (result?.success) {
          console.log('[clickSubmit] 🏆 SUBMITTED via Slate Bridge — caller sẽ verify gen-done qua waitForNewTiles');
          return { success: true, approach: 'bridge' };
        }
        console.warn('[clickSubmit] ⚠️ Bridge return success=false:', result?.error, '→ fallback');
      } catch (e) {
        console.warn('[clickSubmit] ⚠️ Bridge throw:', e.message, '→ fallback');
      }

      // Fallback chỉ chạy khi bridge THẬT SỰ fail (success=false hoặc throw)
      // Mỗi approach fire-and-forget, return ngay sau cái đầu tiên gửi được event lên element còn enabled

      // Approach 2: simulateClick (PointerEvent chain — full mouse simulation)
      btn = getSubmitButton();
      if (btn && !btn.disabled) {
        console.log('[clickSubmit] 🎯 Approach 2: simulateClick (bridge failed → fallback)');
        simulateClick(btn);
        return { success: true, approach: 'simulateClick' };
      }
      console.log('[clickSubmit] ⏭️ Approach 2 skipped — button disabled');

      // Approach 3: Enter key on editor
      if (editor) {
        console.log('[clickSubmit] 🎯 Approach 3: Enter key (bridge + simulateClick failed → fallback)');
        editor.focus();
        await sleep(100);
        editor.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13,
          bubbles: true, cancelable: true,
        }));
        return { success: true, approach: 'enterKey' };
      }

      // Approach 4: Native .click() — last resort
      btn = getSubmitButton();
      if (btn && !btn.disabled) {
        console.log('[clickSubmit] 🎯 Approach 4: Native btn.click() (last resort)');
        btn.click();
        return { success: true, approach: 'nativeClick' };
      }

      console.warn('[clickSubmit] ❌ Tất cả approaches đều skip — không có button enabled / editor');
      return { success: false, error: 'No usable element to trigger submit' };
    },
    'addFileToPrompt': async () => {
      await addFileToPrompt(message.fileId, message.fileName, message.flowFileId);
      return { success: true };
    },
    'getCurrentTileIds': () => {
      // Invalidate cache vì API call yêu cầu data mới nhất
      _invalidateTileCache();
      // forceRefresh=true vì API call yêu cầu data mới nhất
      return { tileIds: getUniqueTileIds(true), fileNames: [...getExistingFileNames()] };
    },
    'waitForNewTiles': async () => {
      // Reset shouldStop khi gọi qua MessageBridge
      shouldStop = false;
      // preFileNames: capture tại content script side nếu caller không truyền
      const preFileNames = message.preFileNames
        ? new Set(message.preFileNames)
        : (message.captureFileNames ? getExistingFileNames() : null);
      console.log(`[content.js] waitForNewTiles received — preTileIds=${(message.preTileIds || []).length}, timeout=${message.timeout}, maxQty=${message.maxQuantity}`);
      const result = await waitForNewTiles(
        message.preTileIds || [],
        message.timeout || 120000,
        preFileNames,
        message.maxQuantity || 0
      );
      console.log(`[content.js] waitForNewTiles done — result has ${result?.tiles?.length || 0} new tiles, failed=${result?.failed}`);
      return result;
    },
    'stopExecution': () => {
      shouldStop = true;
      isPaused = false;
      _clickedRetryTileIds.clear(); // Reset retry tracking khi stop
      // Update FloatingTracker UI
      if (FloatingTracker._legacyData) {
        FloatingTracker._legacyData.status = 'stopped';
        FloatingTracker.updateLegacy(FloatingTracker._legacyData);
      }
      return { success: true };
    },
    'resetStop': () => {
      // Reset shouldStop flag khi bắt đầu execution mới (EditorExecutor.start)
      // Fix bug: shouldStop từ lần stop trước không được clear, abort insertText lần sau
      shouldStop = false;
      return { success: true };
    },
    'pauseExecution': () => {
      isPaused = true;
      // Update FloatingTracker UI
      if (FloatingTracker._legacyData) {
        FloatingTracker._legacyData.status = 'paused';
        FloatingTracker.updateLegacy(FloatingTracker._legacyData);
      }
      return { isPaused: true };
    },
    'resumeExecution': () => {
      isPaused = false;
      // Update FloatingTracker UI
      if (FloatingTracker._legacyData) {
        FloatingTracker._legacyData.status = 'running';
        FloatingTracker.updateLegacy(FloatingTracker._legacyData);
      }
      return { isPaused: false };
    },
    'pq:clearRetryTracking': () => {
      // Clear retry tracking khi job MỚI bắt đầu (PromptQueue.submitJob)
      // Ngăn tiles từ job cũ bị skip retry trong job mới
      _clickedRetryTileIds.clear();
      _retryingTiles.clear();
      return { success: true };
    },
    'getRunningState': () => {
      return { isRunning, shouldStop, isPaused };
    },
    'getFailedPrompts': () => {
      return { failedPrompts };
    },
    'clearFailedPrompts': () => {
      failedPrompts = [];
      return { success: true };
    },
    'getThumbnailsByIds': () => {
      const fileIds = message.fileIds || [];
      const results = {};
      for (const fileId of fileIds) {
        const tile = _getTileById(fileId);
        if (!tile) continue;
        const img = tile.querySelector('img');
        const video = tile.querySelector('video');
        const fileName = extractFileName(tile);
        const flowInfo = extractFlowFileInfo(tile);
        // Ưu tiên <video> trước — video tiles có cả <img> (ref image) lẫn <video> (kết quả)
        if (video) {
          // Extract actual video URL for Telegram sending
          const videoUrl = extractVideoUrl(tile);
          results[fileId] = {
            thumbnail: video.poster || video.src || '',
            type: 'video',
            ...(fileName && { file_name: fileName }),
            ...(flowInfo && { file_id: flowInfo.file_id }),
            ...(videoUrl && { video_url: videoUrl })  // Include video_url for Telegram/download
          };
        } else if (img?.src && !img.src.includes('chrome-extension')) {
          results[fileId] = { thumbnail: img.src, type: 'image', ...(fileName && { file_name: fileName }), ...(flowInfo && { file_id: flowInfo.file_id }) };
        }
      }
      return { results };
    },
    'correctStaleFileIds': async () => {
      // 5-tầng correction: file_id > file_name > thumbnail_url > ensureFlowTilesLoaded > reupload
      const idToUrlMap = message.idToUrlMap || {};
      const fileNameMap = message.fileNameMap || {};
      const fileIdMap = message.fileIdMap || {}; // U-1.4: tile_id → file_id map
      const oldIds = Object.keys(idToUrlMap);
      // Cũng check các IDs chỉ có file_name mà không có thumbnail URL
      const fileNameOnlyIds = Object.keys(fileNameMap).filter(id => !idToUrlMap[id]);
      const allIds = [...new Set([...oldIds, ...fileNameOnlyIds])];
      if (allIds.length === 0) return { corrections: {} };

      // Hàm scan DOM tìm tile bằng file_name (Tầng 1 - ưu tiên cao nhất)
      function scanByFileName(idsToCheck) {
        const corrections = {};
        const fnMap = {};
        for (const id of idsToCheck) {
          if (fileNameMap[id]) fnMap[id] = fileNameMap[id];
        }
        if (Object.keys(fnMap).length === 0) return corrections;
        // Build file_name → tileId map từ DOM
        const fnToTileId = new Map();
        const allTiles = document.querySelectorAll('[data-tile-id]');
        allTiles.forEach(tile => {
          const tileId = tile.dataset.tileId;
          if (!tileId) return;
          const fn = extractFileName(tile);
          if (fn) fnToTileId.set(fn, tileId);
        });
        for (const oldId of idsToCheck) {
          const savedFn = fnMap[oldId];
          if (!savedFn) continue;
          const newId = fnToTileId.get(savedFn);
          if (newId && newId !== oldId) {
            corrections[oldId] = newId;
          }
        }
        return corrections;
      }

      // Normalize media URL cho thumbnail matching
      // CRITICAL: split('=')[0] quá aggressive cho getMediaUrlRedirect URLs
      // vì TẤT CẢ tiles đều có cùng base path, chỉ khác name param
      function normalizeMediaUrl(url) {
        if (!url || typeof url !== 'string') return '';
        // getMediaUrlRedirect URLs: giữ nguyên name param (UUID) để phân biệt
        if (url.includes('getMediaUrlRedirect')) {
          try {
            const urlObj = new URL(url, window.location.origin);
            // Giữ path + name param, bỏ các params khác (w, h, etc.)
            const name = urlObj.searchParams.get('name');
            // tRPC format: ?input={"json":{"name":"UUID"}}
            const input = urlObj.searchParams.get('input');
            if (name) return urlObj.pathname + '?name=' + name;
            if (input) {
              try {
                const parsed = JSON.parse(decodeURIComponent(input));
                const json = parsed?.json || parsed?.['0']?.json || parsed;
                if (json?.name) return urlObj.pathname + '?name=' + json.name;
              } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
        }
        // CDN URLs (lh3.googleusercontent.com): split('=') bỏ size params
        return url.split('=')[0];
      }

      // Hàm scan DOM tìm tile bằng thumbnail URL (Tầng 2)
      // CRITICAL: Phải validate file_name để tránh cross-project collision
      function scanByThumbnailUrl(idsToCheck) {
        const corrections = {};
        const crossProjectIds = [];
        const urlToTileData = new Map(); // normalized_url → { tileId, file_name }
        const allTiles = document.querySelectorAll('[data-tile-id]');
        allTiles.forEach(tile => {
          const tileId = tile.dataset.tileId;
          if (!tileId) return;
          const img = tile.querySelector('img');
          const video = tile.querySelector('video');
          const src = img?.src || video?.poster || video?.src || '';
          if (src && !src.includes('chrome-extension') && !src.startsWith('data:')) {
            const normalized = normalizeMediaUrl(src);
            const tileFn = extractFileName(tile);
            urlToTileData.set(normalized, { tileId, file_name: tileFn });
          }
        });
        for (const oldId of idsToCheck) {
          const savedUrl = idToUrlMap[oldId];
          if (!savedUrl) continue;
          const normalizedSaved = normalizeMediaUrl(savedUrl);
          const tileData = urlToTileData.get(normalizedSaved);
          if (!tileData || tileData.tileId === oldId) continue;

          const newId = tileData.tileId;
          const savedFn = fileNameMap[oldId];
          const tileFn = tileData.file_name;

          // Cross-project safety: Nếu cả hai đều có file_name và KHÔNG match → skip + track
          if (savedFn && tileFn && savedFn !== tileFn) {
            console.warn(`[TobyFlow] [Tầng 2] Cross-project collision detected: oldId=${oldId.substring(0,20)}... savedFn=${savedFn.substring(0,20)}... vs tileFn=${tileFn.substring(0,20)}...`);
            crossProjectIds.push(oldId);
            continue; // KHÔNG correct - đây là tile từ project khác
          }

          // Safety: Nếu có savedFn nhưng tile KHÔNG có file_name → chờ tile complete, KHÔNG correct mù
          if (savedFn && !tileFn) {
            console.warn(`[TobyFlow] [Tầng 2] Skipping correction: savedFn=${savedFn.substring(0,20)}... but tile has no file_name yet`);
            continue;
          }

          corrections[oldId] = newId;
        }
        return { corrections, crossProjectIds };
      }

      // Hàm validate tile_id với file_name (cross-project safety)
      // Chỉ coi tile_id là valid nếu file_name MATCH hoặc không có saved file_name
      function validateTileIdWithFileName(tileId, savedFileName) {
        if (!savedFileName) return true; // Không có file_name để validate → accept
        const tile = _getTileById(tileId);
        if (!tile) return false;
        const currentFileName = extractFileName(tile);
        if (!currentFileName) return true; // Tile chưa có file_name (đang processing) → accept tạm
        return currentFileName === savedFileName;
      }

      // Tìm IDs cần correction
      // QUAN TRỌNG: Không tin tile_id direct match nếu file_name không khớp (cross-project)
      const totalTiles = document.querySelectorAll('[data-tile-id]').length;
      const validIds = []; // tile_id tồn tại VÀ file_name match
      const needsCorrectionIds = []; // tile_id không tồn tại HOẶC file_name không match

      for (const id of allIds) {
        const tile = _getTileById(id);
        if (tile) {
          const savedFn = fileNameMap[id];
          if (validateTileIdWithFileName(id, savedFn)) {
            validIds.push(id);
          } else {
            // tile_id tồn tại nhưng file_name KHÔNG match → cross-project collision!
            console.log(`[TobyFlow] Cross-project detected: tile_id ${id.substring(0, 20)}... exists but file_name mismatch`);
            needsCorrectionIds.push(id);
          }
        } else {
          needsCorrectionIds.push(id);
        }
      }

      console.log(`[TobyFlow] correctStaleFileIds: ${allIds.length} IDs check | ${validIds.length} valid | ${needsCorrectionIds.length} need correction | ${totalTiles} tiles trên DOM`);
      if (needsCorrectionIds.length === 0) return { corrections: {} };

      let corrections = {};

      // [Tầng 0] file_id lookup (persistent, chính xác nhất)
      for (const oldId of needsCorrectionIds) {
        const savedFileId = fileIdMap[oldId];
        if (!savedFileId) continue;
        const tile = findTileByFileId(savedFileId);
        if (tile) {
          const newTileId = tile.dataset.tileId;
          if (newTileId && newTileId !== oldId) {
            corrections[oldId] = newTileId;
          }
        }
      }
      const tier0Count = Object.keys(corrections).length;
      if (tier0Count > 0) {
        console.log(`[TobyFlow] [Tầng 0 file_id]: ${tier0Count}/${needsCorrectionIds.length} corrected`);
      }
      const afterTier0 = needsCorrectionIds.filter(id => !corrections[id]);

      // [Tầng 1] file_name matching (ưu tiên cao nhất, cross-project safe)
      const fnCorrections = scanByFileName(afterTier0);
      const fnCount = Object.keys(fnCorrections).length;
      if (fnCount > 0) {
        Object.assign(corrections, fnCorrections);
        console.log(`[TobyFlow] [Tầng 1 file_name]: ${fnCount}/${afterTier0.length} corrected`);
      }
      let uncorrected = needsCorrectionIds.filter(id => !corrections[id]);
      let allCrossProjectIds = [];

      // [Tầng 2] thumbnail URL matching
      if (uncorrected.length > 0) {
        const urlResult = scanByThumbnailUrl(uncorrected);
        const urlCorrections = urlResult.corrections;
        const urlCrossProject = urlResult.crossProjectIds || [];
        const urlCount = Object.keys(urlCorrections).length;
        if (urlCount > 0) {
          Object.assign(corrections, urlCorrections);
          console.log(`[TobyFlow] [Tầng 2 thumbnail_url]: ${urlCount}/${uncorrected.length} corrected`);
        }
        if (urlCrossProject.length > 0) {
          allCrossProjectIds.push(...urlCrossProject);
          console.log(`[TobyFlow] [Tầng 2 cross-project]: ${urlCrossProject.length} detected`);
        }
        uncorrected = uncorrected.filter(id => !corrections[id] && !urlCrossProject.includes(id));
      }

      // [Tầng 3] ensureFlowTilesLoaded → retry file_name + thumbnail
      if (uncorrected.length > 0) {
        console.log(`[TobyFlow] [Tầng 3]: còn ${uncorrected.length} IDs chưa match, gọi ensureFlowTilesLoaded...`);
        await ensureFlowTilesLoaded();
        const tilesAfterLoad = document.querySelectorAll('[data-tile-id]').length;
        console.log(`[TobyFlow] [Tầng 3]: sau ensureFlowTilesLoaded: ${tilesAfterLoad} tiles trên DOM`);

        // Retry Tầng 1 + 2
        const retryFn = scanByFileName(uncorrected);
        Object.assign(corrections, retryFn);
        const stillMissing = uncorrected.filter(id => !corrections[id] && !retryFn[id]);
        if (stillMissing.length > 0) {
          const retryUrlResult = scanByThumbnailUrl(stillMissing);
          Object.assign(corrections, retryUrlResult.corrections);
          if (retryUrlResult.crossProjectIds?.length > 0) {
            allCrossProjectIds.push(...retryUrlResult.crossProjectIds);
          }
        }
        const finalUncorrected = uncorrected.filter(id => !corrections[id]);
        console.log(`[TobyFlow] [Tầng 3] retry: ${uncorrected.length - finalUncorrected.length} thêm | ${finalUncorrected.length} vẫn missing`);
      }

      // Dedupe crossProjectIds
      allCrossProjectIds = [...new Set(allCrossProjectIds)];

      console.log(`[TobyFlow] correctStaleFileIds KẾT QUẢ: ${Object.keys(corrections).length}/${needsCorrectionIds.length} corrected, ${allCrossProjectIds.length} cross-project`);
      for (const [oldId, newId] of Object.entries(corrections)) {
        console.log(`[TobyFlow]   ${oldId.substring(0, 30)}... → ${newId.substring(0, 30)}...`);
      }
      if (allCrossProjectIds.length > 0) {
        console.log(`[TobyFlow] Cross-project IDs:`, allCrossProjectIds.map(id => id.substring(0, 25) + '...'));
      }
      return { corrections, crossProjectIds: allCrossProjectIds };
    },
    'findTileByFileName': () => {
      const fileName = message.fileName;
      if (!fileName) return { tileId: null };
      const tiles = document.querySelectorAll('[data-tile-id]');
      for (const tile of tiles) {
        const fn = extractFileName(tile);
        if (fn === fileName) {
          return { tileId: tile.dataset.tileId };
        }
      }
      return { tileId: null };
    },
    'prepareFlowForScan': async () => {
      await ensureFlowTilesLoaded();
      const tileCount = document.querySelectorAll('[data-tile-id]').length;
      return { success: true, tileCount };
    },
    'applyFlowPageSettings': async () => {
      // Apply Flow page settings sớm khi sidebar connect — không cần đợi đến khi run workflow.
      // Idempotent — skip nếu đã apply (sessionStorage flag).
      await ensureFlowSettingsApplied();
      return { success: true, applied: _flowSettingsApplied };
    },
    'scanFlowImages': () => {
      const images = [];
      const seenIds = new Set();
      const tileSelector = '[data-tile-id]';
      const tiles = document.querySelectorAll(tileSelector);
      tiles.forEach(tile => {
        const tileId = tile.dataset.tileId;
        if (!tileId || seenIds.has(tileId)) return;
        const img = tile.querySelector('img');
        const video = tile.querySelector('video');
        const fileName = extractFileName(tile);
        // Video detection: ưu tiên check <video> trước (tile có thể chứa cả img + video)
        if (video) {
          seenIds.add(tileId);
          const flowInfoV = extractFlowFileInfo(tile);
          const videoSrc = video.src || (video.querySelector('source')?.src) || '';
          // Thumbnail: poster > img sibling > video src
          let vThumb = video.poster || '';
          if (!vThumb && img && img.src && !img.src.includes('chrome-extension')) vThumb = img.src;
          if (!vThumb) vThumb = videoSrc;
          images.push({ fileId: tileId, thumbnail: vThumb, source: 'flow', type: 'video', ...(fileName && { file_name: fileName }), ...(flowInfoV && { file_id: flowInfoV.file_id, project_id: flowInfoV.project_id }) });
        } else if (img && img.src && !img.src.includes('chrome-extension')) {
          seenIds.add(tileId);
          const flowInfo = extractFlowFileInfo(tile);
          images.push({ fileId: tileId, thumbnail: img.src, source: 'flow', type: 'image', ...(fileName && { file_name: fileName }), ...(flowInfo && { file_id: flowInfo.file_id, project_id: flowInfo.project_id }) });
        }
      });
      if (images.length === 0) {
        const allImgs = document.querySelectorAll('img[src*="getMediaUrlRedirect"], img[src*="lh3"], img[src*="googleusercontent"]');
        allImgs.forEach((img, i) => {
          const src = img.src;
          if (!src || src.includes('chrome-extension') || img.naturalWidth < 50) return;
          const parentTile = img.closest('[data-tile-id]');
          const fileId = parentTile?.dataset?.tileId || `flow_img_${i}`;
          if (seenIds.has(fileId)) return;
          seenIds.add(fileId);
          images.push({ fileId, thumbnail: src, source: 'flow', type: 'image' });
        });
      }
      return { images };
    },
    'uploadFilesToFlow': async () => {
      // Nhận file data dưới dạng base64 từ sidePanel, tạo File, inject vào input[type=file]
      // Upload tuần tự để đảm bảo thứ tự, tối ưu thời gian chờ
      const filesData = message.filesData || [];
      if (filesData.length === 0) return { tileIds: [], orderedTileIds: [] };

      const flowInputs = Array.from(document.querySelectorAll('input[type="file"]'));
      if (flowInputs.length === 0) return { tileIds: [], orderedTileIds: [], warning: 'No file input found' };

      const orderedTileIds = [];
      const tileDetails = [];

      for (let fileIdx = 0; fileIdx < filesData.length; fileIdx++) {
        const fd = filesData[fileIdx];
        // forceRefresh=true vì cần baseline chính xác trước upload
        const existingTiles = getUniqueTileIds(true);

        const binary = atob(fd.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const file = new File([bytes], fd.name, { type: fd.type });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        for (const input of flowInputs) {
          try {
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } catch (e) {}
        }
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        // Wait for new tile - optimized: check frequently, shorter initial wait
        let newTileId = null;
        let processingTileId = null; // Track tile đang processing (cho inactive tab fallback)
        let processingSeenAt = 0;    // Thời điểm phát hiện tile processing
        let waitTime = 0;
        const maxWait = 45000; // 45s max per file
        const checkInterval = 500; // Check every 500ms (faster polling)
        const processingAcceptDelay = 15000; // Chấp nhận tile processing sau 15s (tab inactive)

        // Initial wait for upload to start processing
        await sleep(800);
        waitTime += 800;

        while (waitTime < maxWait) {
          // forceRefresh=true vì đây là polling loop cần data mới nhất từ DOM
          const currentTiles = getUniqueTileIds(true);
          const newTiles = currentTiles.filter(id => !existingTiles.includes(id) && !orderedTileIds.includes(id));

          if (newTiles.length > 0) {
            const tile = document.querySelector(`[data-tile-id="${newTiles[0]}"]`);
            if (tile) {
              const status = detectTileStatus(tile);
              if (status === 'success') {
                newTileId = newTiles[0];
                break;
              }
              // Wait for success — processing tile can't be used for addFileToPrompt
              // (context menu "Thêm vào câu lệnh" not available on processing tiles)
              if (status === 'failed') {
                console.log('[uploadFilesToFlow] Tile failed, skipping:', newTiles[0]);
                break; // Don't wait more, this tile won't recover
              }
              // status === 'processing' → track cho inactive tab fallback
              if (!processingTileId) {
                processingTileId = newTiles[0];
                processingSeenAt = waitTime;
              }
              // Inactive tab: React throttle rendering → tile stuck processing
              // THAY ĐỔI: Thử activate tab thay vì chấp nhận processing tile
              // Chấp nhận processing tile → addFileToPrompt fail → submit fail → Application error
              if (processingTileId && (waitTime - processingSeenAt) >= processingAcceptDelay) {
                console.log('[uploadFilesToFlow] Tab inactive: tile stuck processing, trying to activate tab...');
                // Thử activate tab để React resume rendering
                try {
                  await new Promise(resolve => {
                    chrome.runtime.sendMessage({ action: 'ensureFlowTabActive' }, () => resolve());
                  });
                  await sleep(2000); // Chờ React resume
                  // Re-check tile status sau khi activate
                  const reCheckTile = document.querySelector(`[data-tile-id="${processingTileId}"]`);
                  const reCheckStatus = detectTileStatus(reCheckTile);
                  if (reCheckStatus === 'success') {
                    console.log('[uploadFilesToFlow] Tab activated, tile now success:', processingTileId);
                    newTileId = processingTileId;
                    break;
                  } else if (reCheckStatus === 'failed') {
                    console.log('[uploadFilesToFlow] Tab activated but tile failed:', processingTileId);
                    break;
                  }
                  // Still processing after activate → wait thêm 5s rồi timeout
                  console.log('[uploadFilesToFlow] Tab activated but tile still processing, waiting 5s more...');
                  await sleep(5000);
                  const finalTile = document.querySelector(`[data-tile-id="${processingTileId}"]`);
                  const finalStatus = detectTileStatus(finalTile);
                  if (finalStatus === 'success') {
                    newTileId = processingTileId;
                    break;
                  }
                  // Vẫn processing → log warning và continue loop (sẽ timeout)
                  console.warn('[uploadFilesToFlow] Tile still processing after tab activate + 5s wait, will timeout');
                } catch (e) {
                  console.warn('[uploadFilesToFlow] ensureFlowTabActive failed:', e.message);
                }
              }
            }
          }

          await sleep(checkInterval);
          waitTime += checkInterval;
        }

        // Fallback: nếu timeout mà có tile processing → KHÔNG chấp nhận
        // Processing tile không dùng được cho addFileToPrompt → sẽ gây lỗi
        if (!newTileId && processingTileId) {
          console.warn('[uploadFilesToFlow] Timeout: tile still processing, NOT accepting:', processingTileId);
          // KHÔNG set newTileId = processingTileId để tránh submit fail
        }

        if (newTileId) {
          orderedTileIds.push(newTileId);
          const tile = _getTileById(newTileId);
          const media = tile?.querySelector('img, video');

          // CRITICAL: Chờ file_name + thumbnailUrl có sẵn (img src chứa getMediaUrlRedirect)
          // Nếu tile processing, src có thể là blob/placeholder → extractFileName null + thumbnailUrl sai
          // → lần chạy sau không detect được → reupload vòng lặp vô hạn
          // → ref_thumbnails có URL sai → hiển thị ảnh khác
          let fileName = extractFileName(tile);
          let thumbnailUrl = media?.src || '';
          const isValidThumbUrl = (url) => url && !url.startsWith('blob:') && !url.includes('placeholder');

          if ((!fileName || !isValidThumbUrl(thumbnailUrl)) && tile) {
            // Poll tối đa 5s để chờ file_name và thumbnailUrl
            for (let fnWait = 0; fnWait < 5000 && (!fileName || !isValidThumbUrl(thumbnailUrl)); fnWait += 500) {
              await sleep(500);
              // Force refresh cache
              const tileId = tile.dataset?.tileId;
              if (tileId) _fileNameCache.delete(tileId);
              fileName = extractFileName(tile);
              // Re-query media element và lấy src mới
              const freshMedia = tile.querySelector('img, video');
              if (freshMedia?.src) thumbnailUrl = freshMedia.src;
            }
            if (fileName) {
              console.log('[uploadFilesToFlow] Got file_name after waiting:', fileName);
            } else {
              console.warn('[uploadFilesToFlow] Could not get file_name for tile:', newTileId);
            }
            if (isValidThumbUrl(thumbnailUrl)) {
              console.log('[uploadFilesToFlow] Got valid thumbnailUrl after waiting');
            } else {
              console.warn('[uploadFilesToFlow] Could not get valid thumbnailUrl for tile:', newTileId);
            }
          }

          const flowInfo = extractFlowFileInfo(tile);
          tileDetails.push({
            id: newTileId,
            thumbnailUrl: thumbnailUrl,
            ...(fileName && { file_name: fileName }),
            ...(flowInfo && { file_id: flowInfo.file_id, project_id: flowInfo.project_id }),
            originalName: fd.name,
            originalKey: fd.key  // BUG FIX: Track original key for correct mapping
          });
        }

        // Minimal delay between uploads (just enough for UI to update)
        if (fileIdx < filesData.length - 1) {
          await sleep(200);
        }
      }

      // BUG FIX: Return keyMapping để caller có thể map đúng oldKey → newTileId
      // Trước đây chỉ return orderedTileIds theo thứ tự, nhưng nếu upload 1 fail:
      // pendingIds = [key1, key2], orderedTileIds = [tile2]
      // → Mapping sai: key1 → tile2 (should be: key2 → tile2)
      const keyMapping = {};
      for (const detail of tileDetails) {
        if (detail.originalKey && detail.id) {
          keyMapping[detail.originalKey] = detail.id;
        }
      }

      return { tileIds: orderedTileIds, tileDetails, orderedTileIds, keyMapping };
    },
    'downloadTileMedia': async () => {
      const tileId = message.tileId;
      const promptText = message.promptText || 'flow';
      const taskName = message.taskName || null;
      const fileName = message.fileName || null;
      const resolution = message.resolution || null;
      const flowFileId = message.flowFileId || null;
      const index = message.index || null;
      const videoResolution = message.videoResolution || null;
      if (!tileId && !flowFileId) return { success: false, error: 'No tileId or flowFileId' };
      try {
        const result = await downloadTileMedia(tileId, promptText, taskName, fileName, resolution, flowFileId, index, videoResolution);
        return { success: result !== false };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    'extractTileIdentifiers': () => {
      const tileId = message.tileId;
      if (!tileId) return { fileName: null, thumbnailUrl: null };
      const tile = _getTileById(tileId);
      if (!tile) return { fileName: null, thumbnailUrl: null };
      const fileName = extractFileName(tile);
      // Accept any HTTP(S) tile URL — bao gồm `getMediaUrlRedirect?name=UUID` (tile vừa upload
      // local) lẫn `lh3.googleusercontent.com` (tile gen từ Flow). Trước fix chỉ accept lh3
      // → tile upload local trả thumbnailUrl=null → _taskTileCache giữ data:URL local →
      // task save với data URL → reuploadMissingFiles Tầng 3 CDN fetch fail (data URL không fetch được).
      const img = tile.querySelector('img');
      const src = img?.src || '';
      const thumbnailUrl = (src && (src.startsWith('http://') || src.startsWith('https://'))
        && !src.startsWith('data:') && !src.startsWith('chrome-extension:'))
        ? src
        : null;
      return { fileName, thumbnailUrl };
    },
    'scanGalleryTiles': () => {
      const tiles = scanGalleryTiles();
      return { tiles };
    },
    'scanFlowTiles': () => {
      // Scan all Flow tiles for Photos Gallery
      const rawTiles = scanGalleryTiles();
      const tiles = rawTiles
        .filter(t => t.status === 'success' && t.thumbnail)
        .map(t => ({
          id: t.tileId,
          thumbnail: t.thumbnail,
          src: t.mediaSrc,
          type: t.mediaType,
          ...(t.file_name && { file_name: t.file_name }),
          ...(t.file_id && { file_id: t.file_id }),
          ...(t.project_id && { project_id: t.project_id })
        }));
      return { tiles };
    },
    'downloadImage': async () => {
      // Download image from URL
      const url = message.url;
      const filename = message.filename || `flow_${Date.now()}.png`;
      if (!url) return { success: false, error: 'No URL' };
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    'getDownloadCounter': () => {
      return { count: getDownloadCounter() };
    },
    'checkTilesExist': () => {
      const tileIds = message.tileIds || [];
      const existing = [];
      const missing = [];
      for (const id of tileIds) {
        if (_getTileById(id)) {
          existing.push(id);
        } else {
          missing.push(id);
        }
      }
      return { existing, missing };
    },
    'checkFilesExist': () => {
      const fileNames = message.fileNames || [];
      const found = {};
      const tiles = document.querySelectorAll('[data-tile-id]');
      for (const tile of tiles) {
        const fn = extractFileName(tile);
        if (fn && fileNames.includes(fn)) found[fn] = true;
      }
      const existing = fileNames.filter(fn => found[fn]);
      const missing = fileNames.filter(fn => !found[fn]);
      return { existing, missing };
    },
    'fetchImageAsBase64': async () => {
      const url = message.url;
      if (!url || !url.startsWith('http')) return { success: false, error: 'Invalid URL' };
      try {
        // KHÔNG dùng credentials: 'include' vì sau redirect tới flow-content.google
        // CDN trả Access-Control-Allow-Origin: '*' → CORS spec block credentialed
        // request với wildcard origin. Signed URL đã có Expires + Signature trong
        // query string nên không cần cookies để authenticate.
        const resp = await fetch(url);
        if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
        const contentType = resp.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) return { success: false, error: `Not image: ${contentType}` };
        const buffer = await resp.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return { success: true, base64: btoa(binary), contentType };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    'getProjectContext': () => {
      return {
        projectId: getCurrentProjectId(),
        projectName: extractProjectName(),
        documentTitle: document.title || null
      };
    },
    // Scan Flow home page DOM cho danh sách projects (cards/links)
    'scanFlowProjects': () => {
      const projects = [];
      const seen = new Set();
      let _flowOrder = 0;  // DOM index — preserve thứ tự hiển thị trên Flow homepage
      // Flow home page hiển thị project cards chứa link /project/{id}
      const links = document.querySelectorAll('a[href*="/project/"]');
      for (const link of links) {
        const m = link.href.match(/\/project\/([a-f0-9-]+)/);
        if (!m || seen.has(m[1])) continue;
        seen.add(m[1]);
        const flowOrder = _flowOrder++;

        // Tìm tên project từ card
        // Strategy: leo lên card parent (thường là [data-tile-id] hoặc ancestor gần nhất)
        const card = link.closest('[data-tile-id]') || link.parentElement;
        let name = null;

        if (card) {
          // Strategy 1: Tìm input rename trong card (multi-language aria-label)
          let renameInput = null;
          for (const label of _ARIA_LABELS.editableText) {
            renameInput = card.querySelector(`input[aria-label="${label}"]`);
            if (renameInput) break;
          }
          if (renameInput?.value?.trim()) {
            name = renameInput.value.trim();
          }

          // Strategy 2: Tìm aria-label trên link hoặc card
          if (!name) {
            const ariaLabel = link.getAttribute('aria-label') || card.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.length < 100) {
              name = ariaLabel;
            }
          }

          // Strategy 3: Tìm text TRỰC TIẾP từ text nodes của card.
          // CRITICAL: skip elements INSIDE button (button accessibility label "Chỉnh sửa dự án" /
          // "Xoá dự án" / "Edit project" — KHÔNG phải project name).
          // Verified DOM 2026-05-09:
          //   - Flow auto-đặt tên project = timestamp khi user không rename (vd "May 07, 11:38 AM")
          //   - Date pattern IS the project name → KHÔNG skip
          //   - Bug trước: skip date → lấy nhầm button label "Chỉnh sửa dự án"
          if (!name) {
            const textEls = card.querySelectorAll('span, p');
            for (const el of textEls) {
              // BUG FIX 2026-05-09: skip elements inside <button> (button icon + label,
              // tất cả project share cùng button label nên rất dễ bị nhầm = same name)
              if (el.closest('button')) continue;
              // Lấy text từ direct text nodes (childNodes type TEXT_NODE = 3)
              let directText = '';
              for (const node of el.childNodes) {
                if (node.nodeType === 3) { // TEXT_NODE
                  directText += node.textContent;
                }
              }
              const txt = directText.trim();
              if (!txt || txt.length === 0 || txt.length > 80) continue;
              // Skip pure numeric (counter/index)
              if (/^\d+$/.test(txt)) continue;
              // Skip common UI labels (multi-language) — chỉ skip button accessibility text,
              // KHÔNG skip date (date là project name thật khi user chưa rename)
              if (/^(chỉnh sửa|xoá|xóa|edit|delete|remove|sửa|new project|tạo|create)/i.test(txt)) continue;
              name = txt;
              break;
            }
          }
        }

        projects.push({ id: m[1], name: name, flowOrder });
      }
      return { projects, isHomePage: !getCurrentProjectId() };
    },
    'command': () => {
      // Keyboard shortcut from background.js
      if (message.command === 'generate') {
        const startBtn = document.getElementById('startBtn');
        if (startBtn && !startBtn.classList.contains('hidden')) startBtn.click();
      }
      return { ok: true };
    },
    // === Q2.3: Screen Capture Crop Overlay ===
    'startCropSelection': () => {
      return new Promise((resolve) => {
        // Remove existing overlay if any
        const existing = document.getElementById('tobyflow-crop-overlay');
        if (existing) existing.remove();

        // Create overlay - controls hidden initially, shown after selection
        const overlay = document.createElement('div');
        overlay.id = 'tobyflow-crop-overlay';
        overlay.className = 'tobyflow-crop-overlay';
        overlay.innerHTML = `
          <div class="tobyflow-crop-selection" id="tobyflow-crop-selection">
            <div class="tobyflow-crop-controls" id="tobyflow-crop-controls">
              <button class="tobyflow-crop-btn tobyflow-crop-btn-capture" id="tobyflow-crop-capture-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Chụp
              </button>
              <button class="tobyflow-crop-btn tobyflow-crop-btn-cancel" id="tobyflow-crop-cancel-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Hủy
              </button>
            </div>
          </div>
        `;

        // Inject styles if not present
        if (!document.getElementById('tobyflow-crop-styles')) {
          const style = document.createElement('style');
          style.id = 'tobyflow-crop-styles';
          style.textContent = `
            .tobyflow-crop-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.5);
              z-index: 999999;
              cursor: crosshair;
            }
            .tobyflow-crop-selection {
              position: absolute;
              border: 2px dashed #fff;
              background: transparent;
              display: none;
              box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
            }
            .tobyflow-crop-controls {
              position: absolute;
              bottom: -52px;
              left: 50%;
              transform: translateX(-50%);
              display: none;
              gap: 8px;
              z-index: 1000000;
              white-space: nowrap;
            }
            .tobyflow-crop-controls.visible {
              display: flex;
            }
            .tobyflow-crop-btn {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 10px 20px;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s ease;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .tobyflow-crop-btn svg {
              flex-shrink: 0;
            }
            .tobyflow-crop-btn-capture {
              background: #cdff01;
              color: #1c1c1f;
            }
            .tobyflow-crop-btn-capture:hover {
              background: #d4ff33;
              transform: scale(1.02);
            }
            .tobyflow-crop-btn-cancel {
              background: rgba(40,40,45,0.95);
              color: #fff;
              border: 1px solid rgba(255,255,255,0.15);
            }
            .tobyflow-crop-btn-cancel:hover {
              background: rgba(60,60,65,0.95);
            }
          `;
          document.head.appendChild(style);
        }

        document.body.appendChild(overlay);

        // Selection state
        let startX = 0, startY = 0;
        let isDrawing = false;
        let hasSelection = false;
        const selection = document.getElementById('tobyflow-crop-selection');
        const controls = document.getElementById('tobyflow-crop-controls');

        // Mouse handlers
        overlay.addEventListener('mousedown', (e) => {
          if (e.target.closest('.tobyflow-crop-controls')) return;
          isDrawing = true;
          hasSelection = false;
          controls.classList.remove('visible');
          startX = e.clientX;
          startY = e.clientY;
          selection.style.left = startX + 'px';
          selection.style.top = startY + 'px';
          selection.style.width = '0px';
          selection.style.height = '0px';
          selection.style.display = 'block';
        });

        overlay.addEventListener('mousemove', (e) => {
          if (!isDrawing) return;
          const w = e.clientX - startX;
          const h = e.clientY - startY;
          // Handle negative dimensions (drawing from right to left or bottom to top)
          if (w < 0) {
            selection.style.left = e.clientX + 'px';
            selection.style.width = (-w) + 'px';
          } else {
            selection.style.left = startX + 'px';
            selection.style.width = w + 'px';
          }
          if (h < 0) {
            selection.style.top = e.clientY + 'px';
            selection.style.height = (-h) + 'px';
          } else {
            selection.style.top = startY + 'px';
            selection.style.height = h + 'px';
          }
        });

        overlay.addEventListener('mouseup', () => {
          if (!isDrawing) return;
          isDrawing = false;
          // Show controls if selection is valid (min 20px)
          const rect = selection.getBoundingClientRect();
          if (rect.width >= 20 && rect.height >= 20) {
            hasSelection = true;
            controls.classList.add('visible');
          }
        });

        // Capture button
        document.getElementById('tobyflow-crop-capture-btn').addEventListener('click', () => {
          const rect = selection.getBoundingClientRect();
          const cropRect = {
            x: Math.round(rect.left * window.devicePixelRatio),
            y: Math.round(rect.top * window.devicePixelRatio),
            width: Math.round(rect.width * window.devicePixelRatio),
            height: Math.round(rect.height * window.devicePixelRatio)
          };
          overlay.remove();
          if (cropRect.width < 10 || cropRect.height < 10) {
            resolve({ success: false, error: 'Vùng chọn quá nhỏ' });
          } else {
            resolve({ success: true, cropRect });
          }
        });

        // Cancel button
        document.getElementById('tobyflow-crop-cancel-btn').addEventListener('click', () => {
          overlay.remove();
          resolve({ success: false, cancelled: true });
        });

        // ESC key to cancel
        const escHandler = (e) => {
          if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
            resolve({ success: false, cancelled: true });
          }
        };
        document.addEventListener('keydown', escHandler);
      });
    },
    'cancelCropSelection': () => {
      const overlay = document.getElementById('tobyflow-crop-overlay');
      if (overlay) overlay.remove();
      return { success: true };
    },

    // --- PQ: PromptQueue Pipeline handlers ---

    'pq:getPreTileSnapshot': () => {
      // Lấy snapshot tile IDs và file names trước khi submit prompt
      // forceRefresh=true vì cần baseline chính xác trước submit
      const ids = getUniqueTileIds(true);
      const names = [...getExistingFileNames()];
      console.log(`[content.js] pq:getPreTileSnapshot — captured ${ids.length} tile IDs + ${names.length} file names (baseline TRƯỚC submit)`);
      return {
        success: true,
        preTileIds: ids,
        preFileNames: names
      };
    },

    'pq:addRefImages': async () => {
      // Thêm ref images vào editor tuần tự
      const { fileIds, fileNameMap } = message;
      let addedCount = 0;
      let failedIds = [];
      for (const fid of (fileIds || [])) {
        const result = await addFileToPrompt(fid, fileNameMap?.[fid]);
        if (result === false) {
          failedIds.push(fid);
        } else {
          addedCount++;
        }
      }
      // Return actual success/failure - caller phải check failedIds
      const allSuccess = failedIds.length === 0;
      if (!allSuccess) {
        console.warn('[pq:addRefImages] Failed to add:', failedIds.length, 'of', (fileIds || []).length, 'ref images');
      }
      return { success: allSuccess, addedCount, failedIds, totalRequested: (fileIds || []).length };
    },

    'pq:removeExistingRefImages': async () => {
      // Xóa ref images hiện có trong editor
      console.log('[content.js] pq:removeExistingRefImages received');
      const removed = await removeExistingRefImages();
      console.log(`[content.js] pq:removeExistingRefImages done — removed ${removed} ref images`);
      return { success: true, removed };
    },

    'pq:verifySlateModel': () => {
      // Kiểm tra Slate model đã có nội dung chưa
      // BUG FIX: Check textContent thay vì chỉ placeholder
      // Vì timing issue, placeholder có thể chưa kịp biến mất dù text đã được insert
      const editor = getEditor();
      if (!editor) return { success: true, hasContent: false };

      // Check CẢ HAI: placeholder đã biến mất HOẶC có text trong editor
      const noPlaceholder = editor.querySelector('[data-slate-placeholder]') === null;
      const hasText = editor.textContent?.trim().length > 0;
      const hasContent = noPlaceholder || hasText;

      return { success: true, hasContent };
    },

    'detectTileStatus': () => {
      // Kiểm tra trạng thái tile qua DOM
      const tile = document.querySelector(`[data-tile-id="${message.tileId}"]`);
      return { status: detectTileStatus(tile) };
    },

    'retryFailedTilesViaButton': async () => {
      // Click nút "Thử lại" trên tiles thất bại (Tier 1 retry)
      shouldStop = false;
      // NOTE: KHÔNG clear _clickedRetryTileIds/_retryingTiles ở đây vì:
      // 1. Multiple TileMonitors có thể gọi handler này đồng thời
      // 2. Clear ở đây gây race condition: call B clear tracking của call A đang execute
      // 3. Tracking được clear tại stopExecution (khi pipeline dừng) hoặc
      //    bên trong retryFailedTilesViaButton cho tiles cụ thể sau khi xử lý xong
      const result = await retryFailedTilesViaButton(
        message.failedTileIds || [],
        message.timeout || 120000,
        message.excludeTileIds || null
      );
      return result;
    },

    // Legacy: Tracker update từ sidePanel (task/workflow/angles owners)
    'legacyTrackerUpdate': () => {
      FloatingTracker.updateLegacy(message.data);
      return { success: true };
    },

    // PQ: Floating Tracker trong trang Flow (góc phải)
    'pq:trackerUpdate': () => {
      FloatingTracker.update(message.data);
      return { success: true };
    },

    'pq:trackerHide': () => {
      FloatingTracker.hide();
      return { success: true };
    },

    // PQ: Đồng bộ pause/resume từ PromptQueue → content.js
    'pq:pauseExecution': () => {
      if (message.paused) {
        window._pqPaused = true;
      } else {
        window._pqPaused = false;
      }
      return { success: true };
    },

    // PQ: ExecutionBlocker — block user interaction khi pipeline đang chạy
    'pq:showBlocker': () => {
      ExecutionBlocker.show();
      return { success: true };
    },
    'pq:hideBlocker': () => {
      ExecutionBlocker.hide();
      return { success: true };
    },
    'autoReloadFlow': async () => {
      console.log('[content.js] Auto-reloading Flow page...');
      // Clear editor trước khi reload để tránh "Leave site?" modal
      // Flow có beforeunload listener khi editor có content
      try {
        const editor = getEditor();
        if (editor) {
          await clearEditor(editor);
          await sleep(100);
        }
      } catch (e) {
        console.warn('[autoReloadFlow] Clear editor before reload failed:', e.message);
      }
      // Small delay to ensure response is sent before reload
      setTimeout(() => { location.reload(); }, 100);
      return { success: true };
    },
    // Phase FAR-1: Silent session refresh — KHÔNG reload trang, chỉ trigger Next.js
    // re-fetch session data để re-auth Bearer token. Plan Section 3.1.
    'flow:refreshSession': async () => {
      try {
        // Trigger từ background alarm (FAR-1 periodic) — log telemetry với source
        const ok = await refreshFlowSession('alarm');
        return { success: ok };
      } catch (e) {
        console.warn('[content.js] flow:refreshSession error:', e.message);
        return { success: false, error: e.message };
      }
    },
    // Phase FAR-3: Đếm pending tiles (in-flight, chưa success/failed) cho PromptQueue
    // pre-submit gate (DOM check). Plan Section 3.3.2.
    // CRITICAL: Flow KHÔNG set data-status attribute — phải dùng detectTileStatus() để
    // detect status từ DOM signals (img.src valid, warning icon, ...).
    'getPendingTileCount': () => {
      try {
        // PERFORMANCE: project có thể có hàng trăm tile (vd 286). detectTileStatus
        // mỗi tile = ~5 DOM queries → query toàn bộ 286 tiles = expensive.
        // Tối ưu: tile processing thường có placeholder/skeleton element distinguishable
        // qua absence of <img>/<video> với valid src. Pre-filter trước khi gọi detectTileStatus.
        const tiles = document.querySelectorAll('[data-tile-id]');
        let pending = 0;
        for (const tile of tiles) {
          // Quick reject: tile có media với http/https/blob src → likely success → skip
          const media = tile.querySelector('video[src^="http"], video[src^="blob:"], img[src^="http"], img[src^="blob:"]');
          if (media) {
            const src = media.src || '';
            // Skip placeholder URLs
            if (!src.includes('media.html') && !src.endsWith('.html')) {
              continue; // Likely success — skip detectTileStatus
            }
          }
          // Còn lại: cần detectTileStatus (cache 1.5s) để confirm processing vs failed
          const status = detectTileStatus(tile);
          if (status === 'processing') pending++;
        }
        return { count: pending };
      } catch (e) {
        return { count: 0, error: e.message };
      }
    },
    'checkContentScriptAlive': () => {
      return { alive: true, hasEditor: !!getEditor() };
    },
    // === MRC-3.4.1.1-1.3: Lấy trạng thái của danh sách tile IDs ===
    'getTileStatuses': () => {
      const { tileIds } = message;
      const statuses = {};

      for (const tileId of tileIds) {
        const tile = _getTileById(tileId);
        if (!tile) {
          statuses[tileId] = { status: 'not_found' };
          continue;
        }

        // BUG FIX (2026-05-02): Flow render progressive preview (blur/low-res CDN URL)
        // TRƯỚC khi gen thực sự xong → detectTileStatus return 'success' nhưng tile chưa
        // có file_name (UUID persistent). Pipeline `_waitClaimedTilesComplete` thấy success
        // → declare item COMPLETED → "queue monitor báo done sớm" + download fail (vì
        // tile chưa render full quality, có thể chưa stable).
        // → Demote status 'success' → 'processing' khi file_name vẫn null.
        const initialStatus = detectTileStatus(tile);
        const fileName = initialStatus === 'success' ? extractFileName(tile) : null;
        const status = (initialStatus === 'success' && !fileName)
          ? 'processing'  // Tile có preview URL nhưng chưa có file_name → vẫn đang gen
          : initialStatus;
        const thumbnail = status === 'success' ? extractThumbnailUrl(tile) : null;
        const mediaType = detectMediaType(tile);  // 'image' | 'video'

        // CRITICAL: Extract video_url for video tiles (needed for Telegram video sending)
        const videoUrl = (mediaType === 'video' && status === 'success') ? extractVideoUrl(tile) : null;

        statuses[tileId] = {
          status,
          file_name: fileName,
          thumbnail: thumbnail,
          type: mediaType,
          ...(videoUrl && { video_url: videoUrl })  // Include video_url only if present
        };
      }

      return { success: true, statuses };
    },
    // === MRC-3.4.1.5-1.7: Quét tìm tiles mới không nằm trong danh sách exclude ===
    'scanNewTiles': () => {
      const { excludeTileIds = [], excludeFileNames = [] } = message;
      const excludeIdSet = new Set(excludeTileIds);
      const excludeFnSet = new Set(excludeFileNames.filter(Boolean));

      const allTiles = document.querySelectorAll('[data-tile-id]');
      const newTiles = [];
      const seenTileIds = new Set(); // FIX: Dedup tiles (DOM có thể có duplicates)

      // [REVERT Phase 4] Bỏ state detection vì editLink check không reliable
      // (tile cũ không generated cũng không có edit link → false 'processing').
      for (const tile of allTiles) {
        const tileId = tile.dataset.tileId;
        if (!tileId) continue;

        // FIX: Skip duplicate tile IDs trong cùng scan
        if (seenTileIds.has(tileId)) continue;
        seenTileIds.add(tileId);

        // Skip excluded tile IDs
        if (excludeIdSet.has(tileId)) continue;

        // Skip excluded file_names (nếu có)
        const fileName = extractFileName(tile);
        if (fileName && excludeFnSet.has(fileName)) continue;

        newTiles.push({
          tile_id: tileId,
          file_name: fileName || null
        });
      }

      console.log(`[content.js] scanNewTiles — exclude ${excludeIdSet.size} IDs + ${excludeFnSet.size} fileNames | DOM ${allTiles.length} tiles | NEW ${newTiles.length}`);
      if (newTiles.length > 0) {
        console.log('[content.js] scanNewTiles preview:', newTiles.slice(0, 5).map(t => t.tile_id.substring(0, 16)));
      }

      return { success: true, tiles: newTiles };
    },
    // === DOM Resilience: Refresh selector cache when backend pushes update ===
    'providerConfigUpdated': () => {
      _selectorConfig = null;
      _selectorConfigTime = 0;
      console.log('[TobyFlow] Provider config updated via SSE — selector cache invalidated');
      return { success: true };
    },
    // === API configs (download_resolutions, ratios, error_patterns) ===
    'providerApiConfigUpdated': () => {
      _apiConfigsCacheLocal = null;
      _apiConfigsCacheLocalTime = 0;
      console.log('[TobyFlow] Provider api_config updated via SSE — api configs cache invalidated');
      return { success: true };
    }
  };

  if (handlers[message.action]) {
    // Wrap trong Promise.resolve().then() để catch cả sync throw lẫn async reject
    Promise.resolve().then(() => handlers[message.action]())
      .then(result => {
        sendResponse(result || { success: true });
      })
      .catch(err => {
        console.error('[FlowAuto] Handler error:', message.action, err);
        sendResponse({ error: err.message });
      });
    return true; // async response
  }
});

// --- Feature: Inject Floating "+" Button into Image Tiles ---
function injectOverlayButtons() {
    const tileSelector = '[data-tile-id]';
    const tiles = document.querySelectorAll(tileSelector);

    tiles.forEach(tile => {
        // Double-check: data attribute + DOM query để tránh duplicate
        if (tile.dataset.overlayInjected === '1') return;
        if (tile.querySelector(':scope > .flow-auto-overlay-btn')) return;

        tile.dataset.overlayInjected = '1';

        const currentPos = window.getComputedStyle(tile).position;
        if (currentPos === 'static') {
            tile.style.position = 'relative';
        }

        const btn = document.createElement('div');
        btn.className = 'flow-auto-overlay-btn';
        btn.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 0;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            background: rgba(255,255,255,0.85);
            transition: background 0.2s, transform 0.1s;
        `;
        btn.innerHTML = '+';
        btn.title = "Thêm ảnh này vào Tab Gen";

        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255, 255, 255, 0.95)';
            btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255, 255, 255, 0.7)';
            btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const tileId = tile.getAttribute('data-tile-id');
            if (!tileId) return;

            // Extract tile info
            const fileName = extractFileName(tile);
            const thumbnail = extractThumbnailUrl(tile);

            // Gửi message đến sidePanel để add vào GenTab ref images
            try {
                // Check extension context còn valid không (tránh lỗi khi extension reload)
                if (!chrome.runtime?.id) {
                    console.warn('[TobyFlow] Extension context invalidated, reloading page...');
                    location.reload();
                    return;
                }
                chrome.runtime.sendMessage({
                    action: 'addImageToGenTab',
                    tileId: tileId,
                    fileName: fileName,
                    thumbnail: thumbnail
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Nếu extension bị reload, không log lỗi gây spam console
                        const errMsg = chrome.runtime.lastError.message || '';
                        if (errMsg.includes('Extension context invalidated') || errMsg.includes('Receiving end does not exist')) {
                            console.warn('[TobyFlow] Extension reloaded, reloading page...');
                            location.reload();
                        } else {
                            sendLog(`Không thể gửi ảnh đến GenTab: ${errMsg}`, 'warn');
                        }
                        return;
                    }
                    if (response?.success) {
                        if (response.alreadyExists) {
                            sendLog(`ID: ${tileId.substring(0, 20)}... đã có trong danh sách`, 'warn');
                            btn.innerHTML = '...';
                            btn.style.color = '#f9ab00';
                            btn.style.fontSize = '10px';
                            setTimeout(() => {
                                btn.innerHTML = '+';
                                btn.style.color = '#333';
                                btn.style.fontSize = '18px';
                            }, 1000);
                        } else if (response.queued) {
                            // Image queued (sidePanel not open) - will be added when panel opens
                            sendLog(`Ảnh đã được đánh dấu, mở sidebar để thêm vào Tab 1`, 'info');
                            btn.innerHTML = '○';
                            btn.style.color = '#4285f4';
                            setTimeout(() => {
                                btn.innerHTML = '+';
                                btn.style.color = '#333';
                            }, 1500);
                        } else {
                            sendLog(`Đã thêm ảnh vào Tab 1: ${tileId.substring(0, 20)}...`, 'success');
                            btn.innerHTML = '✓';
                            btn.style.color = '#0f9d58';
                            setTimeout(() => {
                                btn.innerHTML = '+';
                                btn.style.color = '#333';
                            }, 1000);
                        }
                    }
                });
            } catch(err) {
                // Catch synchronous errors (như extension context invalidated)
                const errMsg = err.message || '';
                if (errMsg.includes('Extension context invalidated')) {
                    console.warn('[TobyFlow] Extension reloaded, reloading page...');
                    location.reload();
                } else {
                    console.error('[TobyFlow] addImageToGenTab error:', err);
                }
            }
        });

        tile.appendChild(btn);
    });
}
// Use MutationObserver instead of setInterval for injecting overlay buttons
// Use var for safe re-injection on extension reload
var _tileObserver = null;

/**
 * Thiết lập MutationObserver cho overlay buttons.
 * Ưu tiên observe tile container thay vì toàn body để giảm số lần fire callback
 * khi React re-render các phần khác của trang.
 * Fallback về body nếu chưa tìm thấy container, thử lại sau 3 giây.
 */
function _setupTileObserver() {
  // Ngắt observer cũ trước khi tạo mới, tránh duplicate observers
  if (_tileObserver) _tileObserver.disconnect();

  // Tìm container chứa tiles (thay vì observe toàn body)
  const firstTile = document.querySelector('[data-tile-id]');
  const tileContainer = firstTile
    ? (firstTile.closest('[class*="grid"], [class*="Gallery"], [role="list"]')
       || firstTile.parentElement)
    : null;

  const target = tileContainer || document.body;
  _tileObserver = new MutationObserver(debounce(injectOverlayButtons, 500));
  _tileObserver.observe(target, { childList: true, subtree: true });

  // Nếu đang observe body (fallback), thử tìm lại container sau 3 giây
  if (!tileContainer) {
    setTimeout(() => _setupTileObserver(), 3000);
  }
}

_setupTileObserver();

// ============ [Layer 3] SPA navigation hook — notify projectContext khi URL change ============
// Flow là Next.js app dùng pushState/replaceState cho SPA routing → chrome.tabs.onUpdated
// đôi khi không fire (hoặc fire trễ) → sidepanel state lệch (vd modal "Select project" vẫn
// show khi URL đã ở /project/UUID). Hook history APIs để gửi projectContext realtime.
// Anti-loop: dedupe URL (chỉ fire khi location.href THẬT SỰ change từ lần trước).
// ============ [Layer 3] SPA navigation hook — notify projectContext khi URL change ============
// Hook history APIs để gửi projectContext realtime khi Flow Next.js SPA navigate.
//
// FIX 2026-05-09: defer install đến sau DOMContentLoaded để tránh conflict với Next.js hydration
// (root cause bug "extension không load ở Flow homepage" — hook chạy quá sớm khi React đang
// đăng ký router của nó cũng dùng history.pushState → conflict → Flow page hang → content.js
// handlers register fail → sidebar getProjectContext không nhận response → app stuck).
//
// Anti-loop: dedupe URL — chỉ fire khi location.href THẬT SỰ change.
// Defer: wait 2s sau DOMContentLoaded để Next.js hydration xong → safe wrap history APIs.
function setupFlowSpaNavigateHookDeferred() {
  let _lastUrl = location.href;
  function _notifyFlowNavigate() {
    try {
      if (location.href === _lastUrl) return;  // dedupe
      _lastUrl = location.href;
      const m = location.href.match(/\/project\/([a-f0-9-]+)/);
      const projectId = m ? m[1] : null;
      // KHÔNG call extractProjectName ở đây (có thể throw nếu DOM chưa ready) —
      // background.js sẽ tự gọi getProjectContext lấy projectName chi tiết.
      const sendResult = chrome.runtime.sendMessage({
        action: 'projectContext',
        projectId,
        projectName: null,
        documentTitle: document.title || null,
        fromSPANavigate: true,
      });
      // Defensive: chỉ catch nếu sendMessage trả Promise (Chrome MV3)
      if (sendResult && typeof sendResult.catch === 'function') {
        sendResult.catch(() => {});
      }
    } catch (_) { /* ignore mọi lỗi để không phá Flow navigation */ }
  }
  try {
    const _origPushState = history.pushState;
    const _origReplaceState = history.replaceState;
    history.pushState = function() {
      _origPushState.apply(this, arguments);
      try { setTimeout(_notifyFlowNavigate, 50); } catch (_) {}
    };
    history.replaceState = function() {
      _origReplaceState.apply(this, arguments);
      try { setTimeout(_notifyFlowNavigate, 50); } catch (_) {}
    };
    window.addEventListener('popstate', () => {
      try { setTimeout(_notifyFlowNavigate, 50); } catch (_) {}
    });
  } catch (_) { /* ignore */ }
}

// Defer install: chờ DOM ready + 2s extra cho Next.js hydration
// → tránh conflict với React Router init.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(setupFlowSpaNavigateHookDeferred, 2000);
} else {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupFlowSpaNavigateHookDeferred, 2000);
  });
}

// ============ Flow homepage MutationObserver — detect lazy load project cards ============
// Flow homepage dùng virtual scroll (data-testid="virtuoso-item-list") → user scroll xuống
// → cards mới render → list project mở rộng. Notify sidebar để re-scan modal.
// Anti-loop: debounce 1s + chỉ notify khi count THAY ĐỔI (không spam mỗi mutation).
function setupFlowHomepageObserver() {
  // Chỉ chạy khi ở homepage (no /project/ trong URL)
  if (location.pathname.match(/\/project\/[a-f0-9-]+/)) return;

  let _lastCount = 0;
  let _debounceTimer = null;
  function _notifyHomepageCountChange() {
    const count = document.querySelectorAll('a[href*="/project/"]').length;
    if (count === _lastCount) return;  // dedupe
    _lastCount = count;
    try {
      const sendResult = chrome.runtime.sendMessage({
        action: 'flowHomepageProjectsChanged',
        count,
      });
      if (sendResult && typeof sendResult.catch === 'function') {
        sendResult.catch(() => {});
      }
    } catch (_) { /* ignore */ }
  }

  // Find list container (virtuoso virtual list hoặc body fallback)
  const tryAttach = () => {
    const container = document.querySelector('[data-testid="virtuoso-item-list"]')
                   || document.querySelector('[data-testid="virtuoso-scroller"]')
                   || document.body;
    if (!container) return false;
    try {
      const observer = new MutationObserver(() => {
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(_notifyHomepageCountChange, 1000);
      });
      observer.observe(container, { childList: true, subtree: true });
      // Initial count
      _notifyHomepageCountChange();
      return true;
    } catch (_) { return false; }
  };

  // Retry attach mỗi 500ms tới khi container xuất hiện (max 10s)
  let attempts = 0;
  const tryInterval = setInterval(() => {
    attempts++;
    if (tryAttach() || attempts >= 20) {
      clearInterval(tryInterval);
    }
  }, 500);
}

// Defer setup giống SPA hook để tránh conflict Next.js hydration
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(setupFlowHomepageObserver, 2500);
} else {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupFlowHomepageObserver, 2500);
  });
}

// Phase FAR-4 (Toast detection) đã REMOVED — risk false positive cao do scan toàn
// document body bắt match bất kỳ added node có pattern "unusual activity" / "rate limit",
// dễ trùng với prompt text user gõ (vd "Generate image of unusual activity at airport").
// Cooldown 5 phút trên false positive = 5 phút queue freeze → UX tệ.
// FAR-1/2/3/5 đã cover scenario rate-limit qua silent refresh + consecutive fail recovery
// + concurrent cap + exponential backoff → KHÔNG cần FAR-4 defense-in-depth.

} // END re-injection guard else block
