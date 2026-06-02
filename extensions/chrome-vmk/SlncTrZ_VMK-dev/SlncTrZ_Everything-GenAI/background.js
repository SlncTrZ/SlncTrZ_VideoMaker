/**
 * Background Service Worker - SlncTrZ VM v2.0
 * Handles settings window, keyboard shortcuts, sidePanel, and cross-context communication
 */

let settingsWindowId = null;
let workflowWindowId = null;
let editingWorkflowId = null;
let templateWindowId = null;
let anglesWindowId = null;
let effectsWindowId = null;

// Track all extension popup windows for cleanup on extension reload/unload
const _extensionPopupWindows = new Set();

// URL Constants - centralized provider URLs (sync with ProviderConfigManager._DEFAULT_URLS)
const PROVIDER_URLS = {
  flow: {
    tabQuery: 'https://labs.google/fx/*',
    tabQueryPatterns: ['https://labs.google/fx/*', '*://aisandbox.google.com/*'],
    createUrl: 'https://labs.google/fx/tools/flow',
    imageFx: 'https://labs.google/fx/tools/image-fx',
    localeCreate: 'https://labs.google/fx/vi/tools/flow',
    base: 'https://labs.google/fx',
  },
  chatgpt: {
    tabQuery: '*://chatgpt.com/*',
    createUrl: 'https://chatgpt.com/',
    base: 'chatgpt.com',
  },
  grok: {
    tabQuery: '*://grok.com/*',
    tabQueryPatterns: ['*://grok.com/*', 'https://x.com/i/grok*'],
    createUrl: 'https://grok.com/',
    imagine: 'https://grok.com/imagine',
    saved: 'https://grok.com/imagine/saved',
    base: 'grok.com',
    cdnPatterns: ['assets.grok.com', 'grok.x.ai'],
  },
  gemini: {
    tabQuery: '*://gemini.google.com/*',
    createUrl: 'https://gemini.google.com/app',
    base: 'gemini.google.com',
  },
};

// Restore window IDs from session storage (survives SW hibernation)
chrome.storage?.session?.get([
  '_settingsWindowId',
  '_workflowWindowId',
  '_editingWorkflowId',
  '_templateWindowId',
  '_anglesWindowId',
  '_effectsWindowId',
], (result) => {
  if (result?._settingsWindowId) {
    settingsWindowId = result._settingsWindowId;
    _extensionPopupWindows.add(result._settingsWindowId);
  }
  if (result?._workflowWindowId) {
    workflowWindowId = result._workflowWindowId;
    _extensionPopupWindows.add(result._workflowWindowId);
  }
  if (result?._editingWorkflowId) {
    editingWorkflowId = result._editingWorkflowId;
  }
  if (result?._templateWindowId) {
    templateWindowId = result._templateWindowId;
    _extensionPopupWindows.add(result._templateWindowId);
  }
  if (result?._anglesWindowId) {
    anglesWindowId = result._anglesWindowId;
    _extensionPopupWindows.add(result._anglesWindowId);
  }
  if (result?._effectsWindowId) {
    effectsWindowId = result._effectsWindowId;
    _extensionPopupWindows.add(result._effectsWindowId);
  }
});

// Lock flag to prevent race condition when opening settings window
let _settingsWindowOpening = false;

/** Persist popup window IDs to session storage (survives SW hibernation) */
function _persistWindowIds() {
  chrome.storage?.session?.set({
    _settingsWindowId: settingsWindowId,
    _workflowWindowId: workflowWindowId,
    _editingWorkflowId: editingWorkflowId,
    _templateWindowId: templateWindowId,
    _anglesWindowId: anglesWindowId,
    _effectsWindowId: effectsWindowId,
  }).catch(() => {});
}

// Close all extension popup windows (called on extension suspend/reload)
async function _closeAllExtensionPopups() {
  const windowIds = [..._extensionPopupWindows];
  for (const windowId of windowIds) {
    try {
      await chrome.windows.remove(windowId);
    } catch (e) {
      // Window may already be closed
    }
  }
  _extensionPopupWindows.clear();
  settingsWindowId = null;
  workflowWindowId = null;
  editingWorkflowId = null;
  templateWindowId = null;
  anglesWindowId = null;
  effectsWindowId = null;
  _persistWindowIds();
}

// Close popup windows when extension is about to be suspended/reloaded
chrome.runtime.onSuspend.addListener(() => {
  console.log('[Background] Extension suspending, closing popup windows...');
  _closeAllExtensionPopups();
});

/**
 * Open or activate an existing tab matching the URL pattern
 * @param {string} urlPattern - URL pattern to search for existing tabs (e.g., 'https://chatgpt.com/*')
 * @param {string} createUrl - URL to create if no existing tab found
 * @param {boolean} activate - Whether to activate/focus the tab (default: true)
 * @returns {Promise<chrome.tabs.Tab>} - The existing or newly created tab
 */
async function openOrActivateTab(urlPattern, createUrl, activate = true) {
  try {
    // Search for existing tabs matching the pattern
    const existingTabs = await chrome.tabs.query({ url: urlPattern });

    if (existingTabs.length > 0) {
      // Tab exists - activate it
      const tab = existingTabs[0];
      if (activate) {
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      console.log(`[SlncTrZ] Activated existing tab: ${tab.url?.substring(0, 50)}`);
      return tab;
    } else {
      // No existing tab - create new one
      const newTab = await chrome.tabs.create({ url: createUrl, active: activate });
      console.log(`[SlncTrZ] Created new tab: ${createUrl}`);
      return newTab;
    }
  } catch (err) {
    console.error('[SlncTrZ] openOrActivateTab error:', err);
    // Fallback: just create new tab
    return await chrome.tabs.create({ url: createUrl, active: activate });
  }
}

function _isAllowedUrl(url) {
  try {
    const u = new URL(url);
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(u.hostname)) return false;
    if (!['https:', 'http:'].includes(u.protocol)) return false;
    if (u.hostname.endsWith('.local')) return false;
    return true;
  } catch { return false; }
}

/**
 * Tính vị trí popup window: kế bên trái sidebar
 * Sidebar nằm bên phải, rộng ~600px → popup đặt sát trái sidebar
 * @param {number} popupWidth - Chiều rộng popup
 * @param {number} popupHeight - Chiều cao popup
 * @returns {{ left: number, top: number }}
 */
async function _calcWindowPosition(popupWidth, popupHeight) {
  try {
    const currentWin = await chrome.windows.getCurrent();
    const winLeft = currentWin.left || 0;
    const winTop = currentWin.top || 0;
    const winWidth = currentWin.width || 1440;
    const winHeight = currentWin.height || 900;

    const sidebarWidth = 600;
    // Popup nằm kế bên trái sidebar: right edge of popup = left edge of sidebar
    const sidebarLeft = winLeft + winWidth - sidebarWidth;
    let left = sidebarLeft - popupWidth;

    // Nếu popup bị tràn ra ngoài bên trái màn hình → đặt tại winLeft
    if (left < winLeft) left = winLeft;

    // Canh giữa theo chiều dọc trong browser window
    let top = winTop + Math.round((winHeight - popupHeight) / 2);
    if (top < winTop) top = winTop;

    return { left, top };
  } catch (e) {
    // Fallback nếu không lấy được window info
    return { left: 100, top: 100 };
  }
}

// === Download Rename System ===
// Khi Flow native download xảy ra, extension can thiệp đổi tên file + folder
// content.js gọi 'prepareDownloadRename' trước khi trigger Flow menu
// FIFO queue: hỗ trợ nhiều downloads liên tiếp (2+ hình submit cùng lúc)
let _pendingDownloadRenames = []; // [{ folder, filename, expires }]

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  // ============================================================
  // GIẢI PHÁP CHÍNH: Check byExtensionId TRƯỚC TIÊN
  // Nếu download do extension KHÁC initiate → skip ngay, KHÔNG gọi suggest()
  // Điều này tránh conflict giữa SlncTrZ VM và AutoGrok
  // ============================================================
  const initiatorExtId = downloadItem.byExtensionId;
  if (initiatorExtId && initiatorExtId !== chrome.runtime.id) {
    // Download do extension khác initiate → để extension đó xử lý
    console.log(`[SlncTrZ] onDeterminingFilename: initiated by different extension (${initiatorExtId}), skip`);
    return;
  }

  // Dọn entries hết hạn
  const now = Date.now();
  _pendingDownloadRenames = _pendingDownloadRenames.filter(r => now <= r.expires);

  // Không có pending rename nào → skip
  if (_pendingDownloadRenames.length === 0) {
    console.log(`[SlncTrZ] onDeterminingFilename: no pending renames, skip. file="${downloadItem.filename}"`);
    return;
  }

  const url = downloadItem.url || '';
  const referrer = downloadItem.referrer || '';
  const filename = downloadItem.filename || '';
  const mime = downloadItem.mime || '';

  // Nếu download do extension này initiate (byExtensionId === chrome.runtime.id)
  // → xử lý ngay với pending rename
  if (initiatorExtId === chrome.runtime.id) {
    // Tìm rename entry phù hợp nhất
    let renameIdx = 0;
    const urlUuidMatch = url.match(/name=([a-f0-9-]{36})/i);
    if (urlUuidMatch) {
      const urlUuid = urlUuidMatch[1];
      const matchIdx = _pendingDownloadRenames.findIndex(r =>
        r.identifier && (r.identifier.includes(urlUuid) || urlUuid.includes(r.identifier))
      );
      if (matchIdx >= 0) renameIdx = matchIdx;
    }
    const rename = _pendingDownloadRenames.splice(renameIdx, 1)[0];
    const origExt = downloadItem.filename?.split('.').pop() || 'png';
    const customName = rename.filename.includes('.') ? rename.filename : `${rename.filename}.${origExt}`;
    const fullPath = rename.folder ? `${rename.folder}/${customName}` : customName;
    console.log(`[SlncTrZ] Download rename (own extension): ${downloadItem.filename} → ${fullPath}`);
    suggest({ filename: fullPath, conflictAction: 'uniquify' });
    return;
  }

  // ============================================================
  // Từ đây: byExtensionId = undefined (download từ browser/user, ví dụ Flow context menu)
  // Chỉ xử lý nếu download từ Google Flow page
  // ============================================================

  // Skip nếu referrer là từ Grok
  if (referrer.includes('grok.com') || referrer.includes('x.com')) {
    console.log(`[SlncTrZ] onDeterminingFilename: referrer is Grok/X, skip`);
    return;
  }

  // Skip nếu URL có vẻ là từ Grok
  const looksLikeGrokUrl = url.includes('grok.com') ||
    url.includes('imagine-public.x.ai') ||
    url.includes('assets.grok') ||
    url.includes('video.grok');
  if (looksLikeGrokUrl) {
    console.log(`[SlncTrZ] onDeterminingFilename: URL looks like Grok, skip`);
    return;
  }

  // Check nếu download từ Google Flow
  const hasFlowReferrer = referrer.includes('labs.google');
  const hasFlowUrl = url.includes('labs.google') || url.includes('getMediaUrlRedirect');

  // Video downloads
  const isVideoDownload = mime.startsWith('video/') ||
    filename.endsWith('.mp4') ||
    filename.endsWith('.webm') ||
    filename.endsWith('.mov');

  // Xác định có phải Flow download không
  const isFlowDownload = hasFlowReferrer || hasFlowUrl ||
    ((url.includes('googleusercontent.com') || url.includes('storage.googleapis.com') || url.includes('googlevideo.com')) && hasFlowReferrer) ||
    (url.startsWith('blob:') && hasFlowReferrer) ||
    (isVideoDownload && hasFlowReferrer);

  if (!isFlowDownload) {
    console.log(`[SlncTrZ] onDeterminingFilename: not from Flow page, skip`);
    return;
  }

  // Tìm rename entry phù hợp nhất
  let renameIdx = 0;
  const urlUuidMatch = url.match(/name=([a-f0-9-]{36})/i);
  if (urlUuidMatch) {
    const urlUuid = urlUuidMatch[1];
    const matchIdx = _pendingDownloadRenames.findIndex(r =>
      r.identifier && (r.identifier.includes(urlUuid) || urlUuid.includes(r.identifier))
    );
    if (matchIdx >= 0) renameIdx = matchIdx;
  }

  const rename = _pendingDownloadRenames.splice(renameIdx, 1)[0];
  let origExt = downloadItem.filename?.split('.').pop()?.toLowerCase() || 'png';
  // Bug fix: Flow context menu đôi khi trả về HTML page (server response error /
  // auth redirect / media chưa ready) → downloadItem.filename = "media.html" hay tương tự
  // → save file thành .html SAI. Detect & override sang ext đúng theo mime + filename hint.
  if (origExt === 'html' || origExt === 'htm') {
    if (mime.startsWith('video/') || isVideoDownload) {
      origExt = 'mp4';
    } else if (mime.startsWith('image/')) {
      origExt = mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
    } else {
      // Mime cũng không cho biết → infer từ rename context (nếu có ext trong tên)
      origExt = 'png'; // safe default cho Flow image
    }
    console.warn(`[SlncTrZ] Download rename: HTML response detected (filename="${downloadItem.filename}", mime="${mime}") → coerce ext to "${origExt}"`);
  }
  const customName = rename.filename.includes('.') ? rename.filename : `${rename.filename}.${origExt}`;
  const fullPath = rename.folder ? `${rename.folder}/${customName}` : customName;

  console.log(`[SlncTrZ] Download rename: ${downloadItem.filename} → ${fullPath}`);
  suggest({ filename: fullPath, conflictAction: 'uniquify' });
});

// Note: Đã remove chrome.alarms + port keep-alive sau khi xác định root cause thực sự là
// Chrome HTTP cache (fix bằng cache: 'no-store' trong apiRequest handler). SW lifecycle
// không phải nguyên nhân bug login/logout refresh quyền.
//
// UPDATE: Restore lightweight SW keep-alive sau khi user báo "Failed to fetch" liên tục
// khi mở tab Workflow / Tasks. Root cause: Chrome MV3 SW idle timeout ~30s khi không có
// event nào → fetch() trong handler fail vì SW bị suspend giữa chừng.
// Pattern tiêu chuẩn: chrome.alarms periodic ngắn (>= 30s/0.5 min) để wake SW.
chrome.alarms.create('swKeepAlive', { periodInMinutes: 0.5 });

// Note: Đã remove bgFetchEntitlements + persistent logger sau khi xác định root cause
// là Chrome HTTP cache. SidePanel tự fetch entitlements qua apiRequest handler đã đủ
// (bây giờ fetch options có cache: 'no-store' để bypass cache stale).

// === Phase FAR-1: Silent session refresh ===
// Mục tiêu: Refresh OAuth bearer token định kỳ qua Next.js soft-navigation
// để tránh user phải F5 manual khi Flow gen fail. Plan: docs/plans/flow-auto-retry-plan.md
//
// Setting (af_settings):
//   - flowSessionRefreshEnabled (bool, default true)
//   - flowSessionRefreshIntervalMin (int, 5-120, default 120)
//
// Reschedule khi user đổi setting qua Settings UI (storage.onChanged listener).
async function rescheduleFlowSessionAlarm() {
  try {
    const stored = await chrome.storage.local.get(['af_settings']);
    const settings = stored.af_settings || {};
    if (settings.flowSessionRefreshEnabled === false) {
      chrome.alarms.clear('flowSessionRefresh');
      return;
    }
    const intervalMin = parseInt(settings.flowSessionRefreshIntervalMin || 120, 10);
    // Clamp 5-120 (match validation rule UserSettingController)
    const clampedMin = Math.max(5, Math.min(120, intervalMin));
    chrome.alarms.create('flowSessionRefresh', { periodInMinutes: clampedMin });
    console.log('[SlncTrZ] Flow session refresh alarm scheduled every', clampedMin, 'min');
  } catch (e) {
    console.warn('[SlncTrZ] rescheduleFlowSessionAlarm error:', e.message);
  }
}

// Init alarm khi background SW start
rescheduleFlowSessionAlarm();

// Re-schedule khi user đổi setting (StorageSettings.save trigger storage.onChanged)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.af_settings) return;
  // Re-schedule chỉ khi 1 trong 2 keys thay đổi (tránh re-schedule không cần thiết)
  const oldS = changes.af_settings.oldValue || {};
  const newS = changes.af_settings.newValue || {};
  if (oldS.flowSessionRefreshEnabled !== newS.flowSessionRefreshEnabled
      || oldS.flowSessionRefreshIntervalMin !== newS.flowSessionRefreshIntervalMin) {
    rescheduleFlowSessionAlarm();
  }
});

// Alarm handler — gửi message đến TẤT CẢ Flow tabs để refresh session
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // SW keep-alive — chỉ cần listener fire để Chrome reset idle timeout
  if (alarm.name === 'swKeepAlive') return;
  if (alarm.name === 'flowSessionRefresh') {
    try {
      const tabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'flow:refreshSession' });
        } catch (e) { /* skip */ }
      }
    } catch (e) {
      console.warn('[SlncTrZ] flowSessionRefresh alarm error:', e.message);
    }
    return;
  }
  // Workflow Scheduler trigger
  if (alarm.name.startsWith('workflow_schedule_')) {
    const wfId = alarm.name.replace('workflow_schedule_', '');
    console.log('[SlncTrZ] Scheduler trigger for workflow:', wfId);
    try {
      chrome.runtime.sendMessage({
        action: 'workflow:scheduler_trigger',
        workflowId: wfId
      }).catch(() => {});
    } catch (e) { /* silent */ }
  }
});

// === Auto-inject content script vào existing Google Flow tabs ===
// Sau extension install/reload, content script trong tab đã mở bị orphaned
chrome.runtime.onInstalled.addListener((details) => {
  // Redirect to Google Flow on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: PROVIDER_URLS.flow.localeCreate });
  }

  // Auto-inject content script vào existing Flow tabs.
  // Ping trước để detect content.js đã load — tránh inject duplicate → duplicate listeners.
  // (Guard flag `__slnctrzContentLoaded__` trong content.js là last line of defense.)
  chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // No response = content.js chưa load hoặc orphaned → inject mới
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).catch(err => console.warn('[SlncTrZ] Auto-inject failed for tab', tab.id, err.message));
        } else {
          // Content.js đã alive trong tab → skip inject
          console.log('[SlncTrZ] content.js đã active trong tab', tab.id, '→ skip auto-inject');
        }
      });
    }
  });
});

// === chrome.sidePanel Setup ===
// GLOBAL MODE: 1 sidePanel instance cho tất cả tabs (không cần sync state giữa các tabs)
if (chrome.sidePanel) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => console.warn('[SlncTrZ] sidePanel setPanelBehavior error:', err));

  // Global sidePanel - không dùng tabId → 1 instance duy nhất
  chrome.sidePanel.setOptions({
    path: 'sidebar.html',
    enabled: true
  }).catch(err => console.warn('[SlncTrZ] sidePanel setOptions error:', err));

  // Vẫn cần notify project context khi Flow tab URL thay đổi
  chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (!tab.url) return;
    if (tab.url.startsWith(PROVIDER_URLS.flow.base)) {
      // Khi Flow tab URL thay đổi (SPA navigation hoặc page load), thông báo sidebar cập nhật project context
      if (info.status === 'complete' || info.url) {
        const projectMatch = tab.url.match(/\/project\/([a-f0-9-]+)/);
        const projectId = projectMatch ? projectMatch[1] : null;
        // Gửi projectContext tới sidebar để cập nhật state
        chrome.runtime.sendMessage({
          action: 'projectContext',
          projectId: projectId,
          projectName: null, // Sẽ được cập nhật sau khi content.js sẵn sàng
          fromTabUpdate: true
        }).catch(() => {});
        // Nếu đang ở project page, yêu cầu content.js gửi context đầy đủ (có projectName)
        if (projectId) {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'getProjectContext' }, (resp) => {
              if (chrome.runtime.lastError || !resp?.projectId) return;
              chrome.runtime.sendMessage({
                action: 'projectContext',
                projectId: resp.projectId,
                projectName: resp.projectName
              }).catch(() => {});
            });
          }, 500);
        }
      }
    }
  });

  // Detect khi user switch sang Flow tab → notify sidePanel
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.url.startsWith(PROVIDER_URLS.flow.base)) {
        // Notify sidePanel để upload pending files + re-sync project context
        chrome.runtime.sendMessage({
          action: 'flowTabActivated',
          tabId: activeInfo.tabId,
          url: tab.url
        }).catch(() => {});
      }
    } catch (e) {
      // Tab không tồn tại hoặc lỗi khác — bỏ qua
    }
  });
}

// Open settings in a separate popup window
async function openSettingsWindow(tab = null) {
  // Prevent race condition: multiple clicks before window is created
  if (_settingsWindowOpening) return;

  const hashSuffix = tab ? `#${tab}` : '';

  // Check if window already exists (in-memory)
  if (settingsWindowId !== null) {
    try {
      const win = await chrome.windows.get(settingsWindowId, { populate: true });
      if (win) {
        // Nếu có tab param → update URL để switch tab; nếu không → chỉ focus
        if (tab && win.tabs?.[0]) {
          chrome.tabs.update(win.tabs[0].id, { url: chrome.runtime.getURL('settings.html' + hashSuffix) });
        }
        chrome.windows.update(settingsWindowId, { focused: true });
        return;
      }
    } catch (e) {
      settingsWindowId = null;
      _persistWindowIds();
    }
  }

  // Fallback: check session storage (SW may have hibernated)
  if (settingsWindowId === null) {
    try {
      const stored = await chrome.storage?.session?.get(['_settingsWindowId']);
      if (stored?._settingsWindowId) {
        const win = await chrome.windows.get(stored._settingsWindowId, { populate: true });
        if (win) {
          settingsWindowId = stored._settingsWindowId;
          _extensionPopupWindows.add(settingsWindowId);
          if (tab && win.tabs?.[0]) {
            chrome.tabs.update(win.tabs[0].id, { url: chrome.runtime.getURL('settings.html' + hashSuffix) });
          }
          chrome.windows.update(settingsWindowId, { focused: true });
          return;
        }
      }
    } catch (e) {
      // Window doesn't exist, proceed to create
    }
  }

  _settingsWindowOpening = true;
  try {
    // Tính vị trí kế bên trái sidebar
    const pos = await _calcWindowPosition(580, 850);
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('settings.html' + hashSuffix),
      type: 'popup',
      width: 580,
      height: 850,
      left: pos.left,
      top: pos.top,
      focused: true
    });

    settingsWindowId = win.id;
    _extensionPopupWindows.add(win.id);
    _persistWindowIds();
  } finally {
    _settingsWindowOpening = false;
  }
}

// Open workflow editor in a separate popup window
let _workflowWindowOpening = false;
async function openWorkflowWindow(workflowData) {
  console.log('[Background] openWorkflowWindow called, _workflowWindowOpening:', _workflowWindowOpening, 'workflowWindowId:', workflowWindowId);
  // Prevent race condition: multiple messages arriving before window is created
  if (_workflowWindowOpening) {
    console.log('[Background] openWorkflowWindow blocked - already opening');
    return;
  }

  // Track which workflow is being edited
  editingWorkflowId = workflowData?.workflow?.wf_id || null;
  _persistWindowIds();

  // Check if window already exists (in-memory)
  if (workflowWindowId !== null) {
    try {
      const win = await chrome.windows.get(workflowWindowId);
      if (win) {
        chrome.windows.update(workflowWindowId, { focused: true });
        // Always reload workflow data (may have been reset/updated)
        if (workflowData) {
          chrome.runtime.sendMessage({ action: 'loadWorkflowInEditor', data: workflowData });
        }
        editingWorkflowId = workflowData?.workflow?.wf_id || null;
        _persistWindowIds();
        return;
      }
    } catch (e) {
      console.log('[Background] openWorkflowWindow - window.get failed, clearing workflowWindowId');
      workflowWindowId = null;
      _persistWindowIds();
    }
  }

  // Fallback: check session storage (SW may have hibernated)
  if (workflowWindowId === null) {
    try {
      const stored = await chrome.storage?.session?.get(['_workflowWindowId']);
      console.log('[Background] openWorkflowWindow - session storage check:', stored?._workflowWindowId);
      if (stored?._workflowWindowId) {
        const win = await chrome.windows.get(stored._workflowWindowId);
        if (win) {
          console.log('[Background] openWorkflowWindow - found window in session storage, focusing');
          workflowWindowId = stored._workflowWindowId;
          _extensionPopupWindows.add(workflowWindowId);
          chrome.windows.update(workflowWindowId, { focused: true });
          if (workflowData) {
            chrome.runtime.sendMessage({ action: 'loadWorkflowInEditor', data: workflowData });
          }
          editingWorkflowId = workflowData?.workflow?.wf_id || null;
          _persistWindowIds();
          return;
        }
      }
    } catch (e) {
      console.log('[Background] openWorkflowWindow - session storage window invalid, will create new');
      // Window doesn't exist, proceed to create
    }
  }

  console.log('[Background] openWorkflowWindow - creating new window');
  _workflowWindowOpening = true;
  let pendingWorkflowSet = false;
  try {
    // Store workflow data for the new window to pick up
    if (workflowData) {
      await chrome.storage.local.set({ _pendingWorkflow: workflowData });
      pendingWorkflowSet = true;
    }

    // Default size — bump lên 90% Flow window nếu user đang dùng monitor lớn.
    // Lý do: workflow nhiều node + 16:9 monitor → 1440×900 chật. 90% Flow window
    // đảm bảo workflow editor vừa với màn hình user (Flow đã được user resize sẵn).
    let winWidth = 1440;
    let winHeight = 900;
    try {
      const flowTabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
      if (flowTabs.length > 0 && flowTabs[0].windowId) {
        const flowWin = await chrome.windows.get(flowTabs[0].windowId);
        if (flowWin?.width && flowWin?.height) {
          const targetW = Math.round(flowWin.width * 0.9);
          const targetH = Math.round(flowWin.height * 0.9);
          // Chỉ tăng — không giảm. Default 1440×900 là baseline tối thiểu.
          if (targetW > winWidth) winWidth = targetW;
          if (targetH > winHeight) winHeight = targetH;
          console.log('[Background] Workflow window size:', winWidth, 'x', winHeight, '(Flow window:', flowWin.width, 'x', flowWin.height, ')');
        }
      }
    } catch (sizeErr) {
      console.warn('[Background] Failed to read Flow window size:', sizeErr.message);
    }

    const pos = await _calcWindowPosition(winWidth, winHeight);
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('workflow-editor.html'),
      type: 'popup',
      width: winWidth,
      height: winHeight,
      left: pos.left,
      top: pos.top,
      focused: true
    });

    workflowWindowId = win.id;
    _extensionPopupWindows.add(win.id);
    _persistWindowIds();
    pendingWorkflowSet = false; // window created OK, init script sẽ consume + remove
  } catch (createErr) {
    // Gap 4 fix: nếu chrome.windows.create fail → _pendingWorkflow stuck. Lần
    // sau open editor mới (kể cả workflow KHÁC) sẽ load workflow cũ vì init
    // line ~188 đọc _pendingWorkflow. Cleanup để tránh ghi nhầm.
    console.error('[Background] openWorkflowWindow create failed:', createErr.message);
    if (pendingWorkflowSet) {
      try { await chrome.storage.local.remove('_pendingWorkflow'); } catch (e) {}
    }
    // Không throw để tránh unhandled rejection ở caller (line ~1075, 1097 không await)
  } finally {
    _workflowWindowOpening = false;
  }
}

// Open template editor in a separate popup window (giống workflow editor)
let _templateWindowOpening = false;

async function openTemplateEditorWindow(templateData) {
  // Prevent race condition
  if (_templateWindowOpening) return;

  // Check if window already exists (in-memory)
  if (templateWindowId !== null) {
    try {
      const win = await chrome.windows.get(templateWindowId);
      if (win) {
        chrome.windows.update(templateWindowId, { focused: true });
        // Reload template data nếu có
        if (templateData) {
          await chrome.storage.local.set({ _pendingTemplate: templateData });
          chrome.runtime.sendMessage({ action: 'loadTemplateInEditor', data: templateData });
        }
        return;
      }
    } catch (e) {
      templateWindowId = null;
      _persistWindowIds();
    }
  }

  // Fallback: check session storage (SW may have hibernated)
  if (templateWindowId === null) {
    try {
      const stored = await chrome.storage?.session?.get(['_templateWindowId']);
      if (stored?._templateWindowId) {
        const win = await chrome.windows.get(stored._templateWindowId);
        if (win) {
          templateWindowId = stored._templateWindowId;
          _extensionPopupWindows.add(templateWindowId);
          chrome.windows.update(templateWindowId, { focused: true });
          if (templateData) {
            await chrome.storage.local.set({ _pendingTemplate: templateData });
            chrome.runtime.sendMessage({ action: 'loadTemplateInEditor', data: templateData });
          }
          return;
        }
      }
    } catch (e) {
      // Window doesn't exist, proceed to create
    }
  }

  _templateWindowOpening = true;
  try {
    // Store template data for the new window to pick up
    // Chỉ set _pendingTemplate nếu templateData có đầy đủ dữ liệu (nodes, edges)
    // Nếu chỉ có { mode, templateId } thì sidebar đã set _pendingTemplate trước đó rồi
    if (templateData && templateData.nodes) {
      await chrome.storage.local.set({ _pendingTemplate: templateData });
    } else if (!templateData) {
      await chrome.storage.local.remove('_pendingTemplate');
    }
    // Nếu templateData là { mode, templateId } - không làm gì, giữ nguyên _pendingTemplate từ sidebar

    // Smart sizing giống workflow editor - 90% Flow window hoặc default 1440x900
    let winWidth = 1440;
    let winHeight = 900;
    try {
      const flowTabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
      if (flowTabs.length > 0 && flowTabs[0].windowId) {
        const flowWin = await chrome.windows.get(flowTabs[0].windowId);
        if (flowWin?.width && flowWin?.height) {
          const targetW = Math.round(flowWin.width * 0.9);
          const targetH = Math.round(flowWin.height * 0.9);
          if (targetW > winWidth) winWidth = targetW;
          if (targetH > winHeight) winHeight = targetH;
          console.log('[Background] Template editor window size:', winWidth, 'x', winHeight);
        }
      }
    } catch (sizeErr) {
      console.warn('[Background] Failed to read Flow window size:', sizeErr.message);
    }

    // Build URL với params
    let url = 'workflow-template-editor.html';
    if (templateData?.mode) {
      const params = new URLSearchParams();
      params.set('mode', templateData.mode);
      if (templateData.templateId) {
        params.set('templateId', String(templateData.templateId));
      }
      url += '?' + params.toString();
    }

    const pos = await _calcWindowPosition(winWidth, winHeight);
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL(url),
      type: 'popup',
      width: winWidth,
      height: winHeight,
      left: pos.left,
      top: pos.top,
      focused: true
    });

    templateWindowId = win.id;
    _extensionPopupWindows.add(win.id);
    _persistWindowIds();
  } finally {
    _templateWindowOpening = false;
  }
}

// Open angles editor in a separate popup window
let _anglesWindowOpening = false;
async function openAnglesWindow() {
  if (_anglesWindowOpening) return;

  // Check if window already exists (in-memory)
  if (anglesWindowId !== null) {
    try {
      const win = await chrome.windows.get(anglesWindowId);
      if (win) {
        chrome.windows.update(anglesWindowId, { focused: true });
        return;
      }
    } catch (e) {
      anglesWindowId = null;
      _persistWindowIds();
    }
  }

  // Fallback: check session storage (SW may have hibernated)
  if (anglesWindowId === null) {
    try {
      const stored = await chrome.storage?.session?.get(['_anglesWindowId']);
      if (stored?._anglesWindowId) {
        const win = await chrome.windows.get(stored._anglesWindowId);
        if (win) {
          anglesWindowId = stored._anglesWindowId;
          _extensionPopupWindows.add(anglesWindowId);
          chrome.windows.update(anglesWindowId, { focused: true });
          return;
        }
      }
    } catch (e) {
      // Window doesn't exist, proceed to create
    }
  }

  _anglesWindowOpening = true;
  try {
    const pos = await _calcWindowPosition(1200, 950);
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('angles-editor.html'),
      type: 'popup',
      width: 1200,
      height: 950,
      left: pos.left,
      top: pos.top,
      focused: true
    });

    anglesWindowId = win.id;
    _extensionPopupWindows.add(win.id);
    _persistWindowIds();
  } finally {
    _anglesWindowOpening = false;
  }
}

// ─── Effects Editor Window ───────────────────────────────────────────────
let _effectsWindowOpening = false;

async function openEffectsWindow() {
  if (_effectsWindowOpening) return;

  // Check if window already exists (in-memory)
  if (effectsWindowId !== null) {
    try {
      const win = await chrome.windows.get(effectsWindowId);
      if (win) {
        chrome.windows.update(effectsWindowId, { focused: true });
        return;
      }
    } catch (e) {
      effectsWindowId = null;
      _persistWindowIds();
    }
  }

  // Fallback: check session storage (SW may have hibernated)
  if (effectsWindowId === null) {
    try {
      const stored = await chrome.storage?.session?.get(['_effectsWindowId']);
      if (stored?._effectsWindowId) {
        const win = await chrome.windows.get(stored._effectsWindowId);
        if (win) {
          effectsWindowId = stored._effectsWindowId;
          _extensionPopupWindows.add(effectsWindowId);
          chrome.windows.update(effectsWindowId, { focused: true });
          return;
        }
      }
    } catch (e) {
      // Window doesn't exist, proceed to create
    }
  }

  _effectsWindowOpening = true;
  try {
    const pos = await _calcWindowPosition(1200, 900);
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('effects-editor.html'),
      type: 'popup',
      width: 1200,
      height: 900,
      left: pos.left,
      top: pos.top,
      focused: true
    });

    effectsWindowId = win.id;
    _extensionPopupWindows.add(win.id);
    _persistWindowIds();
  } finally {
    _effectsWindowOpening = false;
  }
}

// Clean up when windows close
chrome.windows.onRemoved.addListener(async (windowId) => {
  // Remove from tracking Set
  _extensionPopupWindows.delete(windowId);

  // Settings window: check in-memory first, then session storage fallback (SW hibernation)
  let isSettingsWindow = (windowId === settingsWindowId);
  if (!isSettingsWindow) {
    try {
      const stored = await chrome.storage?.session?.get(['_settingsWindowId']);
      if (stored?._settingsWindowId === windowId) isSettingsWindow = true;
    } catch (e) { /* ignore */ }
  }
  if (isSettingsWindow) {
    settingsWindowId = null;
    _persistWindowIds();
    // Notify sidePanel: settings closed (refresh entitlements/account UI if needed)
    chrome.runtime.sendMessage({ action: 'settingsClosed' }).catch(() => {});
  }

  // Workflow window
  let isWorkflowWindow = (windowId === workflowWindowId);
  console.log('[Background] onRemoved windowId:', windowId, 'workflowWindowId:', workflowWindowId, 'isWorkflow:', isWorkflowWindow);
  if (!isWorkflowWindow) {
    try {
      const stored = await chrome.storage?.session?.get(['_workflowWindowId']);
      if (stored?._workflowWindowId === windowId) {
        isWorkflowWindow = true;
        console.log('[Background] onRemoved - matched via session storage');
      }
    } catch (e) { /* ignore */ }
  }
  if (isWorkflowWindow) {
    console.log('[Background] onRemoved - clearing workflow window state');
    workflowWindowId = null;
    editingWorkflowId = null;
    _persistWindowIds();
    chrome.runtime.sendMessage({ action: 'workflowEditorClosed' }).catch(() => {});
  }

  // Template editor window
  let isTemplateWindow = (windowId === templateWindowId);
  if (!isTemplateWindow) {
    try {
      const stored = await chrome.storage?.session?.get(['_templateWindowId']);
      if (stored?._templateWindowId === windowId) isTemplateWindow = true;
    } catch (e) { /* ignore */ }
  }
  if (isTemplateWindow) {
    templateWindowId = null;
    _persistWindowIds();
    chrome.runtime.sendMessage({ action: 'templateEditorClosed' }).catch(() => {});
  }

  // Angles window
  let isAnglesWindow = (windowId === anglesWindowId);
  if (!isAnglesWindow) {
    try {
      const stored = await chrome.storage?.session?.get(['_anglesWindowId']);
      if (stored?._anglesWindowId === windowId) isAnglesWindow = true;
    } catch (e) { /* ignore */ }
  }
  if (isAnglesWindow) {
    anglesWindowId = null;
    _persistWindowIds();
  }

  // Effects window
  let isEffectsWindow = (windowId === effectsWindowId);
  if (!isEffectsWindow) {
    try {
      const stored = await chrome.storage?.session?.get(['_effectsWindowId']);
      if (stored?._effectsWindowId === windowId) isEffectsWindow = true;
    } catch (e) { /* ignore */ }
  }
  if (isEffectsWindow) {
    effectsWindowId = null;
    _persistWindowIds();
  }
});

// Handle messages from content script and settings page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ping handler để wake up service worker (MV3 hibernation)
  if (message.action === 'ping') {
    sendResponse({ ok: true });
    return true;
  }

  // ===== Provider Config Handlers (DOM Resilience Plan) =====
  // Note: Service worker uses self (globalThis), not window
  if (message.action === 'getProviderConfigs') {
    (async () => {
      try {
        const { provider } = message;
        const cached = await _getProviderConfigsFromCache();
        if (cached?.data?.[provider]) {
          sendResponse({ success: true, data: cached.data[provider] });
        } else {
          const data = await _fetchProviderConfigs();
          sendResponse({ success: true, data: data?.[provider] || null });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'reportSelectorFailure') {
    (async () => {
      try {
        const { provider, key, tried_selectors } = message.data || {};
        const baseUrl = await _getApiBaseUrl();
        fetch(`${baseUrl}/api/v1/analytics/selector-failure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            key,
            tried_selectors,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {}
    })();
    sendResponse({ success: true });
    return false;
  }

  // Broadcast provider config update to all content scripts
  if (message.action === 'providerConfigUpdated') {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'providerConfigUpdated',
          data: message.data,
        }).catch(() => {});
      });
    });
    sendResponse({ success: true });
    return false;
  }

  // Broadcast provider api_config update (ratios, download_resolutions, error_patterns)
  // tới content scripts để invalidate cache (content scripts đọc từ chrome.storage).
  if (message.action === 'providerApiConfigUpdated') {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'providerApiConfigUpdated',
          data: message.data,
        }).catch(() => {});
      });
    });
    sendResponse({ success: true });
    return false;
  }

  // Mở Flow tab để login (gọi từ settings popup)
  if (message.action === 'openFlowTabForLogin') {
    (async () => {
      try {
        console.log('[Background] openFlowTabForLogin called');
        // Tìm Flow tab đã mở
        const flowTabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        console.log('[Background] Found Flow tabs:', flowTabs.length);

        if (flowTabs.length > 0) {
          // Focus vào Flow tab đã có
          await chrome.tabs.update(flowTabs[0].id, { active: true });
          await chrome.windows.update(flowTabs[0].windowId, { focused: true });
          console.log('[Background] Focused existing Flow tab:', flowTabs[0].id);
        } else {
          // Tạo Flow tab mới
          const newTab = await chrome.tabs.create({ url: PROVIDER_URLS.flow.createUrl });
          console.log('[Background] Created new Flow tab:', newTab.id);
        }
      } catch (err) {
        console.error('[Background] openFlowTabForLogin error:', err);
      }
    })();
    return true;
  }

  // Mở hoặc activate provider tab (ChatGPT/Grok) - gọi từ workflow editor
  if (message.action === 'openProviderTab') {
    (async () => {
      try {
        const provider = message.provider;
        const providerConfig = {
          chatgpt: {
            urlPattern: PROVIDER_URLS.chatgpt.tabQuery,
            createUrl: PROVIDER_URLS.chatgpt.createUrl
          },
          grok: {
            urlPattern: PROVIDER_URLS.grok.tabQueryPatterns,
            createUrl: PROVIDER_URLS.grok.createUrl
          }
        };
        const config = providerConfig[provider];
        if (!config) {
          sendResponse({ ok: false, error: 'UNKNOWN_PROVIDER' });
          return;
        }
        // Grok có 2 URL patterns
        const patterns = Array.isArray(config.urlPattern) ? config.urlPattern : [config.urlPattern];
        let existingTab = null;
        for (const pattern of patterns) {
          const tabs = await chrome.tabs.query({ url: pattern });
          if (tabs.length > 0) {
            existingTab = tabs[0];
            break;
          }
        }
        if (existingTab) {
          await chrome.tabs.update(existingTab.id, { active: true });
          await chrome.windows.update(existingTab.windowId, { focused: true });
          console.log(`[Background] Activated existing ${provider} tab:`, existingTab.id);
          sendResponse({ ok: true, tabId: existingTab.id, existing: true });
        } else {
          const newTab = await chrome.tabs.create({ url: config.createUrl });
          console.log(`[Background] Created new ${provider} tab:`, newTab.id);
          sendResponse({ ok: true, tabId: newTab.id, existing: false });
        }
      } catch (err) {
        console.error('[Background] openProviderTab error:', err);
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'openSettings') {
    openSettingsWindow(message.tab || null);
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'openUpgradeModal') {
    // Relay đến sidePanel để mở upgrade modal
    chrome.runtime.sendMessage({ action: 'showUpgradeModal' }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'openLoginModal') {
    // Relay đến sidePanel để mở login overlay
    chrome.runtime.sendMessage({ action: 'showLoginOverlay' }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'openSidePanel') {
    // Mở sidePanel (gọi từ settings popup khi user click login)
    // CRITICAL: sidePanel chỉ enable trên Flow tabs (labs.google/fx), không phải tabs khác
    (async () => {
      try {
        let tabId = null;

        // 1. Tìm Flow tab đã mở
        const flowTabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (flowTabs.length > 0) {
          tabId = flowTabs[0].id;
          console.log('[Background] Found existing Flow tab:', tabId);
        } else {
          // 2. Không có Flow tab → tạo mới và chờ load
          console.log('[Background] No Flow tab found, creating new one');
          const newTab = await chrome.tabs.create({ url: PROVIDER_URLS.flow.createUrl });
          tabId = newTab.id;

          // Chờ tab load xong (status: complete) để sidePanel được enable
          await new Promise((resolve) => {
            const checkLoaded = (updatedTabId, info) => {
              if (updatedTabId === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(checkLoaded);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(checkLoaded);
            // Timeout fallback 10s
            setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(checkLoaded);
              resolve();
            }, 10000);
          });

          // Thêm delay nhỏ sau khi load để đảm bảo sidePanel được enable
          await new Promise(r => setTimeout(r, 300));
        }

        // Mở sidePanel trên Flow tab
        await chrome.sidePanel.open({ tabId });

        // Đóng settings popup nếu được yêu cầu
        // (chrome.windows.remove sẽ fire onRemoved listener → cleanup settingsWindowId + persist)
        if (message.closeSettingsWindow && settingsWindowId) {
          try {
            await chrome.windows.remove(settingsWindowId);
          } catch (e) {
            // Window đã đóng hoặc không tồn tại — fallback cleanup
            settingsWindowId = null;
            _persistWindowIds();
          }
        }

        // Thông báo sidePanel hiển thị login overlay nếu cần
        if (message.showLoginOverlay) {
          // Delay để sidePanel kịp load
          setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'showLoginOverlay' }).catch(() => {});
          }, 500);
        }

        sendResponse({ ok: true });
      } catch (e) {
        console.error('[Background] openSidePanel error:', e.message, e);
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true; // async response
  }

  if (message.action === 'openWorkflowEditor') {
    openWorkflowWindow(message.data || null);
    sendResponse({ ok: true });
    return true;
  }

  // Open template editor window (với smart sizing giống workflow editor)
  if (message.action === 'openTemplateEditor') {
    openTemplateEditorWindow(message.data || null);
    sendResponse({ ok: true });
    return true;
  }

  // Preview workflow template trong popup window readonly (Phase 4 — Option A)
  if (message.action === 'openWorkflowTemplatePreview') {
    const template = message.template;
    if (!template) { sendResponse({ ok: false, error: 'NO_TEMPLATE' }); return true; }
    (async () => {
      // Stash template data cho window mới đọc + flag preview mode
      await chrome.storage.local.set({
        _pendingTemplatePreview: { template, timestamp: Date.now() },
      });
      // Reuse openWorkflowWindow logic — workflow-editor-init.js sẽ check flag
      openWorkflowWindow(null);
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Relay import-from-preview-window → sidePanel WorkflowTemplateList._handleImport
  if (message.action === 'importWorkflowTemplate') {
    if (message.template) {
      chrome.storage.local.set({
        _pendingTemplateImport: { template: message.template, timestamp: Date.now() },
      });
      // Notify sidePanel to pick up
      chrome.runtime.sendMessage({ action: 'workflowTemplateImportRequested', template: message.template }).catch(() => {});
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'openAnglesEditor') {
    // Lưu project context cho angles editor
    if (message.projectId) {
      chrome.storage.local.set({
        _pendingAnglesProject: {
          projectId: message.projectId,
          projectName: message.projectName || null
        }
      });
    }
    openAnglesWindow();
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'openEffectsEditor') {
    // Lưu project context cho effects editor
    if (message.projectId) {
      chrome.storage.local.set({
        _pendingEffectsProject: {
          projectId: message.projectId,
          projectName: message.projectName || null
        }
      });
    }
    openEffectsWindow();
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'executionStatusUpdate') {
    // Relay execution status between popup and sidePanel
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'workflowSaved') {
    // Relay workflow saved event between popup editor and sidePanel
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // Gap 3 fix: Relay workflow deleted event để popup editor đang mở wf_id đó biết và đóng
  if (message.action === 'workflowDeleted') {
    chrome.runtime.sendMessage(message).catch(() => {});
    // Nếu editor đang mở chính wf_id này → reset editingWorkflowId tracking
    if (editingWorkflowId && editingWorkflowId === message.wfId) {
      editingWorkflowId = null;
      _persistWindowIds();
    }
    sendResponse({ ok: true });
    return true;
  }

  // Relay workflow execution events between popup editor and sidePanel
  // This enables bidirectional sync: popup→sidePanel and sidePanel→popup
  if (message.action === 'workflowExecutionEvent') {
    // Re-broadcast to all extension contexts (sidePanel, other popups)
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // Relay retry status from content.js to sidePanel for footer display
  if (message.action === 'retry:status') {
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // Handle addImageToGenTab from content.js "+" overlay button
  // Store in pending queue so sidePanel can pick up when opened
  if (message.action === 'addImageToGenTab') {
    const { tileId, fileName, thumbnail } = message;
    if (!tileId) {
      sendResponse({ success: false, error: 'Missing tileId' });
      return true;
    }
    (async () => {
      try {
        // Try to relay to sidePanel first (if open)
        // Use Promise with timeout to detect if sidePanel is listening
        let sidePanelHandled = false;
        try {
          const result = await Promise.race([
            new Promise((resolve) => {
              chrome.runtime.sendMessage({
                action: 'addImageToGenTab',
                tileId, fileName, thumbnail,
                _fromBackground: true
              }, (resp) => {
                if (chrome.runtime.lastError) {
                  resolve(null);
                } else {
                  resolve(resp);
                }
              });
            }),
            new Promise(resolve => setTimeout(() => resolve(null), 200))
          ]);
          if (result?.success !== undefined) {
            sidePanelHandled = true;
            sendResponse(result);
          }
        } catch (e) {
          // sidePanel not ready
        }

        // If sidePanel didn't handle, store to pending queue
        if (!sidePanelHandled) {
          const storage = await chrome.storage.local.get(['_pendingAddToGenTab']);
          const pending = storage._pendingAddToGenTab || [];

          // Check duplicate
          if (pending.some(p => p.tileId === tileId)) {
            sendResponse({ success: true, alreadyExists: true, queued: true });
            return;
          }

          pending.push({ tileId, fileName, thumbnail, addedAt: Date.now() });
          // Keep max 20 pending items
          while (pending.length > 20) pending.shift();

          await chrome.storage.local.set({ _pendingAddToGenTab: pending });
          sendResponse({ success: true, queued: true });
        }
      } catch (e) {
        console.error('[Background] addImageToGenTab error:', e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true; // async response
  }

  if (message.action === 'getEditingWorkflowId') {
    sendResponse({ editingWorkflowId });
    return true;
  }

  if (message.action === 'updateEditingWorkflowId') {
    editingWorkflowId = message.wfId || null;
    _persistWindowIds();
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === 'getSettingsWindowId') {
    sendResponse({ windowId: settingsWindowId });
    return true;
  }

  // Relay message from settings to content script
  if (message.action === 'settingsAction') {
    chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message.payload);
      });
    });
    sendResponse({ ok: true });
    return true;
  }

  // Set extension badge (from NotificationManager)
  if (message.action === 'setBadge') {
    // Guard: chrome.action only exists if manifest has "action" defined
    if (chrome.action) {
      chrome.action.setBadgeText({ text: message.text || '' });
      chrome.action.setBadgeBackgroundColor({ color: '#cdff01' });
    }
    sendResponse({ success: true });
    return true;
  }

  // Show notification (from NotificationManager) - dùng chrome.notifications API
  if (message.action === 'showNotification') {
    const notifId = 'slnctrz-' + Date.now();
    chrome.notifications.create(notifId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: message.title || 'SlncTrZ VM',
      message: message.body || '',
      priority: 2,
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[background] Notification error:', chrome.runtime.lastError.message);
      }
    });
    // Auto-clear after 5 seconds
    setTimeout(() => {
      chrome.notifications.clear(notifId);
    }, 5000);
    sendResponse({ success: true });
    return true;
  }

  // Ensure Flow tab is ready for upload (Phase S2.1: ImmediateUploader)
  // Google Flow KHÔNG THỂ process file upload khi tab inactive
  // (tile status=failed ngay do Chrome throttle React rendering)
  // → Nếu tab inactive: tạm activate ~2s cho upload, rồi restore tab cũ
  // CRITICAL: Nhận targetTabId để đảm bảo đúng tab khi có nhiều Flow tabs
  if (message.action === 'checkFlowTabOpen' || message.action === 'ensureFlowTabReady') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (!tabs || tabs.length === 0) {
          sendResponse({ isOpen: false });
          return;
        }

        // CRITICAL: Ưu tiên targetTabId từ caller (nếu có)
        let flowTab = null;
        if (message.targetTabId) {
          flowTab = tabs.find(t => t.id === message.targetTabId);
        }
        // Fallback: active tab hoặc tab đầu tiên
        if (!flowTab) {
          flowTab = tabs.find(t => t.active) || tabs[0];
        }

        // Post-audit fix: PING content script + inject nếu chưa attach.
        // Root cause "Could not establish connection. Receiving end does not exist":
        // manifest.content_scripts chỉ inject lúc navigate vào URL match → tab mở
        // TRƯỚC khi extension reload/update sẽ KHÔNG có content script attached.
        const _ensureContentScriptReady = async (tabId) => {
          try {
            const pingResult = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            if (pingResult?.pong) return { injected: false };
          } catch (_) { /* Content script không có → inject */ }
          try {
            await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
            await new Promise(r => setTimeout(r, 300));
            return { injected: true };
          } catch (e) {
            console.warn('[ensureFlowTabReady] Inject failed:', e?.message);
            return { injected: false, error: e?.message };
          }
        };

        // Nếu target tab đã active → ping + return
        if (flowTab.active) {
          const ready = await _ensureContentScriptReady(flowTab.id);
          sendResponse({ isOpen: true, tabId: flowTab.id, wasInjected: ready.injected });
          return;
        }

        // Tab tồn tại nhưng inactive → tạm activate cho upload
        // Lưu tab đang active hiện tại để restore sau
        const [currentActiveTab] = await chrome.tabs.query({ active: true, windowId: flowTab.windowId });
        const previousTabId = currentActiveTab?.id || null;

        // Activate Flow tab
        await chrome.tabs.update(flowTab.id, { active: true });
        // Chờ React rendering wake up (Chrome unthrottle ngay khi tab active)
        await new Promise(r => setTimeout(r, 600));

        // Sau khi activate → ping + inject nếu cần
        const ready = await _ensureContentScriptReady(flowTab.id);

        sendResponse({
          isOpen: true,
          tabId: flowTab.id,
          wasActivated: true,
          wasInjected: ready.injected,
          previousTabId
        });
      } catch (e) {
        sendResponse({ isOpen: false });
      }
    })();
    return true;
  }

  // Ensure Flow tab active cho download (context menu cần tab active để React render menu)
  if (message.action === 'ensureFlowTabActive') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (!tabs || tabs.length === 0) {
          sendResponse({ ok: false });
          return;
        }
        const flowTab = tabs.find(t => t.active) || tabs[0];
        if (flowTab.active) {
          sendResponse({ ok: true, tabId: flowTab.id, wasActivated: false });
          return;
        }
        await chrome.tabs.update(flowTab.id, { active: true });
        sendResponse({ ok: true, tabId: flowTab.id, wasActivated: true });
      } catch (e) {
        sendResponse({ ok: false });
      }
    })();
    return true;
  }

  // Restore tab sau khi upload xong (ImmediateUploader gọi sau upload)
  if (message.action === 'restorePreviousTab') {
    if (message.previousTabId) {
      chrome.tabs.update(message.previousTabId, { active: true }).catch(() => {});
    }
    sendResponse({ ok: true });
    return true;
  }

  // PQ: Pipeline control từ FloatingTracker trong content script → relay to sidePanel
  if (message.action === 'pq:stopAll') {
    chrome.runtime.sendMessage({ action: 'queue:stop_all' }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }
  if (message.action === 'pq:stopJob') {
    chrome.runtime.sendMessage({ action: 'queue:stop_job', jobId: message.jobId }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }
  if (message.action === 'pq:pauseJob') {
    chrome.runtime.sendMessage({ action: 'queue:pause_job', jobId: message.jobId }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }
  if (message.action === 'pq:resumeJob') {
    chrome.runtime.sendMessage({ action: 'queue:resume_job', jobId: message.jobId }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // ExecutionLock broadcast relay — popup ↔ sidePanel cross-window sync
  if (message.action === 'execution:lock_broadcast') {
    // Relay to all contexts (sidePanel sẽ nhận và emit lên local eventBus)
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // ExecutionTracker broadcast relay — popup → sidePanel tracker update
  if (message.action === 'execution:tracker_broadcast') {
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // Query số lượng tabs đang mở của 1 provider (flow/chatgpt/grok)
  // Dùng cho duplicate-tab warning trong UI khi user click provider tab.
  if (message.action === 'queryProviderTabs') {
    (async () => {
      try {
        const provider = message.provider;
        const urlPatterns = {
          flow: PROVIDER_URLS.flow.tabQuery,
          chatgpt: PROVIDER_URLS.chatgpt.tabQuery,
          grok: PROVIDER_URLS.grok.tabQuery,
        };
        const pattern = urlPatterns[provider];
        if (!pattern) {
          sendResponse({ count: 0, error: 'Unknown provider' });
          return;
        }
        const tabs = await chrome.tabs.query({ url: pattern });
        sendResponse({ count: tabs?.length || 0, tabs: (tabs || []).map(t => ({ id: t.id, url: t.url })) });
      } catch (e) {
        sendResponse({ count: 0, error: e.message });
      }
    })();
    return true;
  }

  // Activate Flow tab when execution starts (any module)
  if (message.action === 'activateFlowTabForExecution') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (!tabs || tabs.length === 0) {
          sendResponse({ ok: false, error: 'No Flow tab found' });
          return;
        }
        const flowTab = tabs.find(t => t.active) || tabs[0];
        if (!flowTab.active) {
          await chrome.tabs.update(flowTab.id, { active: true });
        }
        sendResponse({ ok: true, tabId: flowTab.id });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }

  // Send webhook notification (proxy from content script)
  if (message.action === 'sendWebhook') {
    const { url, data } = message;
    if (!_isAllowedUrl(url)) {
      sendResponse({ success: false, error: 'URL not allowed' });
      return true;
    }
    (async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        sendResponse({ success: response.ok, status: response.status });
      } catch (err) {
        console.warn('[SlncTrZ] Webhook send failed:', err.message);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Chuẩn bị rename cho download tiếp theo từ Flow
  if (message.action === 'prepareDownloadRename') {
    // Tăng TTL từ 15s lên 30s để handle network delays
    // Thêm identifier để match chính xác khi concurrent downloads
    const renameEntry = {
      folder: message.folder || '',
      filename: message.filename || '',
      identifier: message.identifier || message.filename || '', // Match bằng filename nếu không có identifier riêng
      expires: Date.now() + 30000 // Hết hạn sau 30s (tăng từ 15s)
    };
    _pendingDownloadRenames.push(renameEntry);
    console.log(`[SlncTrZ] prepareDownloadRename queued: folder="${message.folder}", filename="${message.filename}", identifier="${renameEntry.identifier}", queueSize=${_pendingDownloadRenames.length}`);
    sendResponse({ ok: true });
    return true;
  }

  // Download file via chrome.downloads API (reliable, handles Google CDN auth)
  if (message.action === 'chromeDownload') {
    const { url, filename } = message;

    // CRITICAL: Validate URL - reject placeholder/invalid URLs
    if (!url ||
        url.includes('media.html') ||
        url.endsWith('.html') ||
        (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:'))) {
      console.warn(`[SlncTrZ] chromeDownload: invalid/placeholder URL rejected: ${url?.substring(0, 80)}`);
      sendResponse({ success: false, error: 'Invalid or placeholder URL rejected' });
      return true;
    }

    // Debug log filename — giúp debug case folder không respect
    console.log(`[SlncTrZ] chromeDownload: filename="${filename}", url="${url?.substring(0, 60)}..."`);

    (async () => {
      try {
        // CRITICAL FIX: chrome.downloads.download không tự dùng filename nếu blob URL +
        // download item bị onDeterminingFilename listener khác override. Để chắc chắn filename
        // có folder path được Chrome respect, push vào _pendingDownloadRenames trước khi gọi
        // chrome.downloads.download — listener line 117 sẽ pick up và suggest() đúng path.
        if (filename && filename.includes('/')) {
          const lastSlash = filename.lastIndexOf('/');
          const folder = filename.substring(0, lastSlash);
          const justFile = filename.substring(lastSlash + 1);
          _pendingDownloadRenames.push({
            folder,
            filename: justFile,
            identifier: justFile,
            expires: Date.now() + 30000,
          });
          console.log(`[SlncTrZ] chromeDownload: queued rename folder="${folder}", file="${justFile}"`);
        }

        const downloadId = await chrome.downloads.download({
          url,
          filename: filename || undefined,
          conflictAction: 'uniquify'
        });
        sendResponse({ success: true, downloadId });
      } catch (err) {
        console.warn('[SlncTrZ] chrome.downloads failed:', err.message);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // API proxy: chuyển tiếp request từ content script đến backend (tránh CORS)
  if (message.action === 'apiRequest') {
    const { method, endpoint, data, token, headers: extraHeaders, isFormData, formDataFields } = message;

    // [Fix cascade] Global rate-limit cooldown — bắt mọi caller (cả _apiCall lẫn
    // anonymous direct sendMessage). Mọi endpoint auth/* bypass để user recover login.
    const isAuthEndpoint = endpoint && endpoint.startsWith('auth/');
    if (!isAuthEndpoint && globalThis._apiRateLimitedUntil > Date.now()) {
      const retryAfter = Math.ceil((globalThis._apiRateLimitedUntil - Date.now()) / 1000);
      sendResponse({
        success: false,
        error: { code: 'RATE_LIMITED', message: `Too many requests, please try again later (${retryAfter}s)` },
        httpStatus: 429
      });
      return true;
    }

    (async () => {
      try {
        // Lấy apiBaseUrl từ chrome.storage.local
        const stored = await new Promise(resolve => {
          chrome.storage.local.get(['af_auth'], result => resolve(result.af_auth || {}));
        });
        const apiBaseUrl = stored.apiBaseUrl || '';
        if (!apiBaseUrl) {
          sendResponse({ success: false, error: { code: 'OFFLINE', message: 'Backend disabled' }, httpStatus: 0 });
          return;
        }
        const url = `${apiBaseUrl}/${endpoint}`;

        // Chuẩn bị headers
        // Lưu ý: Nếu là FormData thì KHÔNG set Content-Type để browser tự thêm boundary
        const headers = {
          'Accept': 'application/json',
          'X-Extension-Id': chrome.runtime.id
        };
        if (!isFormData) {
          headers['Content-Type'] = 'application/json';
        }
        // Gửi version để backend filter node types tương thích (workflow_node_types)
        // Ext cũ (1.0.4) sẽ KHÔNG nhận types có min_extension_version > '1.0.4'
        try {
          const extVersion = chrome.runtime.getManifest()?.version;
          if (extVersion) headers['X-Ext-Version'] = extVersion;
        } catch (_) {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        // Forward extra headers từ caller (vd: X-Fingerprint cho UsageSync anonymous)
        if (extraHeaders && typeof extraHeaders === 'object') {
          for (const [k, v] of Object.entries(extraHeaders)) {
            if (typeof v === 'string') headers[k] = v;
          }
        }

        // Chuẩn bị fetch options
        // [Fix cache] cache: 'no-store' để Chrome KHÔNG cache response theo URL.
        // Nếu không: login với token A → cache plan=free. Sau logout, anonymous call
        // cùng URL /entitlements → Chrome serve lại plan=free từ cache → UI revert sai.
        const fetchOptions = { method, headers, cache: 'no-store' };
        if ((data || formDataFields) && method !== 'GET' && method !== 'HEAD') {
          // Hỗ trợ FormData upload (EWT-4): khi isFormData=true, formDataFields chứa
          // thông tin file đã encode base64 (vì FormData không serialize qua message)
          // Format: { file: { name, type, base64 }, ...otherFields }
          if (isFormData && formDataFields) {
            const formData = new FormData();
            for (const [key, value] of Object.entries(formDataFields)) {
              if (value && typeof value === 'object' && value.base64 && value.type) {
                // Đây là file, convert base64 → Blob
                const byteString = atob(value.base64);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: value.type });
                formData.append(key, blob, value.name || 'file');
              } else {
                // Field thường
                formData.append(key, value);
              }
            }
            fetchOptions.body = formData;
          } else if (data) {
            fetchOptions.body = JSON.stringify(data);
          }
        }

        const response = await fetch(url, fetchOptions);
        const httpStatus = response.status;
        let body;

        // [Fix cascade] Set global cooldown ngay khi backend trả 429.
        // Đọc Retry-After header (số giây) hoặc default 60s.
        if (httpStatus === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfter = Number(retryAfterHeader) || 60;
          globalThis._apiRateLimitedUntil = Date.now() + retryAfter * 1000;
          console.warn(`[SlncTrZ] API Proxy: 429 received, global cooldown set ${retryAfter}s`);
        }

        // Đọc response text trước, rồi parse JSON
        // Vì response body chỉ có thể đọc 1 lần, cần làm theo thứ tự này để có text khi JSON parse fail
        const responseText = await response.text();

        try {
          body = JSON.parse(responseText);
        } catch (parseErr) {
          // JSON parse failed — likely server returned HTML (error page, maintenance, redirect)
          const isHtml = responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE');
          const preview = responseText.substring(0, 200).replace(/\s+/g, ' ').trim();

          console.error(`[SlncTrZ] API Proxy: JSON parse failed for ${endpoint}`, JSON.stringify({
            status: httpStatus,
            isHtml,
            preview: preview || '(empty response)'
          }));

          // Tạo message có ích hơn cho user
          let userMessage = 'Phản hồi không phải JSON hợp lệ';
          if (httpStatus === 429) {
            userMessage = 'Too many requests, please try again later';
          } else if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
            userMessage = 'Server đang bảo trì hoặc quá tải, vui lòng thử lại sau';
          } else if (httpStatus === 500) {
            userMessage = 'Lỗi server nội bộ, vui lòng thử lại sau';
          } else if (isHtml) {
            userMessage = `Server trả về HTML thay vì JSON (HTTP ${httpStatus})`;
          }

          body = {
            success: false,
            error: {
              code: httpStatus === 429 ? 'RATE_LIMITED' : 'PARSE_ERROR',
              message: userMessage,
              debug: { httpStatus, isHtml, preview: preview.substring(0, 100) }
            }
          };
        }

        if (body.success) {
          sendResponse({ success: true, data: body.data, meta: body.meta, httpStatus });
        } else {
          sendResponse({
            success: false,
            error: body.error || { code: 'UNKNOWN', message: `Lỗi HTTP ${httpStatus}` },
            data: body.data || {},
            httpStatus
          });
        }
      } catch (err) {
        console.error('[SlncTrZ] API Proxy: Lỗi kết nối', err.message);
        sendResponse({
          success: false,
          error: { code: 'NETWORK_ERROR', message: err.message || 'Không thể kết nối đến server' },
          httpStatus: 0
        });
      }
    })();

    // Trả về true để giữ sendResponse cho async callback
    return true;
  }

  // === Screen Capture Handler (Q2.2) ===
  // Capture the visible tab in the focused window
  // Supports capturing from any tab using optional_host_permissions
  if (message.action === 'captureScreen') {
    (async () => {
      try {
        // Global rate limiter: Chrome giới hạn ~2 captureVisibleTab calls/second
        const now = Date.now();
        if (globalThis._lastCaptureTime && (now - globalThis._lastCaptureTime) < 600) {
          const waitMs = 600 - (now - globalThis._lastCaptureTime);
          console.log(`[SlncTrZ] captureScreen rate limited, waiting ${waitMs}ms...`);
          await new Promise(r => setTimeout(r, waitMs));
        }
        globalThis._lastCaptureTime = Date.now();

        // Check if at least one Flow tab is open (required for uploading later)
        const flowTabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (flowTabs.length === 0) {
          sendResponse({
            success: false,
            error: 'Chưa mở Google Flow. Cần mở labs.google/fx để upload ảnh chụp.',
            action: 'openFlow'
          });
          return;
        }

        // Get the currently focused window
        const focusedWindow = await chrome.windows.getLastFocused({ populate: true });
        if (!focusedWindow || !focusedWindow.tabs) {
          sendResponse({ success: false, error: 'Không tìm thấy cửa sổ đang active' });
          return;
        }

        // Find the active tab in this window
        const activeTab = focusedWindow.tabs.find(t => t.active);
        if (!activeTab) {
          sendResponse({ success: false, error: 'Không tìm thấy tab đang active' });
          return;
        }

        console.log(`[SlncTrZ] captureScreen: url=${activeTab.url?.substring(0, 50)}, windowId=${focusedWindow.id}`);

        // Helper function to attempt capture
        const attemptCapture = async () => {
          await chrome.windows.update(focusedWindow.id, { focused: true });
          await new Promise(r => setTimeout(r, 150));
          globalThis._lastCaptureTime = Date.now();
          return await chrome.tabs.captureVisibleTab(focusedWindow.id, { format: 'png' });
        };

        // Try to capture directly
        try {
          const dataUrl = await attemptCapture();
          sendResponse({ success: true, dataUrl, tabId: activeTab.id });
          return;
        } catch (e) {
          console.warn('[SlncTrZ] First capture attempt failed:', e.message);

          // Rate limit error → wait and retry
          if (/quota/i.test(e?.message)) {
            console.log('[SlncTrZ] Rate limit, waiting 1s...');
            await new Promise(r => setTimeout(r, 1000));
            globalThis._lastCaptureTime = Date.now();
            try {
              const dataUrl = await attemptCapture();
              sendResponse({ success: true, dataUrl, tabId: activeTab.id });
              return;
            } catch (e2) {
              console.warn('[SlncTrZ] Retry after rate limit failed:', e2.message);
            }
          }

          // Permission error → check if <all_urls> optional permission is granted
          if (/permission/i.test(e?.message)) {
            // Check if we have <all_urls> permission
            const hasAllUrls = await chrome.permissions.contains({ origins: ['<all_urls>'] });
            console.log('[SlncTrZ] Permission denied, hasAllUrls:', hasAllUrls);

            if (!hasAllUrls) {
              // Request user to grant optional permission
              sendResponse({
                success: false,
                error: 'Cần cấp quyền để chụp màn hình từ trang này.',
                action: 'requestCapturePermission'
              });
              return;
            }

            // Has permission but still failed - might be a special page (chrome://, etc.)
            sendResponse({
              success: false,
              error: 'Không thể chụp trang này (trang hệ thống hoặc trang đặc biệt).'
            });
            return;
          }

          // Other error
          sendResponse({
            success: false,
            error: 'Lỗi chụp màn hình: ' + (e?.message || 'Unknown error')
          });
        }
      } catch (err) {
        console.error('[SlncTrZ] captureScreen error:', err.message);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // === Request Capture Permission Handler ===
  // Request optional <all_urls> permission for capturing any tab
  if (message.action === 'requestCapturePermission') {
    (async () => {
      try {
        // Check if already have permission
        const hasPermission = await chrome.permissions.contains({ origins: ['<all_urls>'] });
        if (hasPermission) {
          sendResponse({ success: true, granted: true, alreadyHad: true });
          return;
        }

        // Request permission - this will show Chrome's permission dialog
        const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
        console.log('[SlncTrZ] Capture permission request result:', granted);
        sendResponse({ success: true, granted });
      } catch (err) {
        console.error('[SlncTrZ] requestCapturePermission error:', err.message);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // === Open Flow Tab Handler ===
  // Open Google Flow or activate existing tab (used when Flow is not open for capture)
  if (message.action === 'openFlowTab') {
    (async () => {
      try {
        const tab = await openOrActivateTab(PROVIDER_URLS.flow.tabQuery, PROVIDER_URLS.flow.imageFx);
        sendResponse({ success: true, tabId: tab.id });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // === Generic Open or Activate Tab Handler ===
  // Can be used for ChatGPT, Grok, Flow, etc.
  if (message.action === 'openOrActivateTab') {
    (async () => {
      try {
        const { urlPattern, createUrl, activate = true } = message;
        if (!urlPattern || !createUrl) {
          sendResponse({ success: false, error: 'Missing urlPattern or createUrl' });
          return;
        }
        const tab = await openOrActivateTab(urlPattern, createUrl, activate);
        sendResponse({ success: true, tabId: tab.id, url: tab.url });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // === Start Crop Selection on Active Tab (Q2.4) ===
  // Inject crop overlay into ANY active tab (not just Flow)
  if (message.action === 'startCropOnActiveTab') {
    (async () => {
      try {
        // Check if at least one Flow tab is open (required for uploading later)
        const flowTabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (flowTabs.length === 0) {
          sendResponse({
            success: false,
            error: 'Chưa mở Google Flow. Cần mở labs.google/fx để upload ảnh chụp.',
            action: 'openFlow'
          });
          return;
        }

        // Get the currently focused window and active tab
        const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!activeTab || !activeTab.id) {
          sendResponse({ success: false, error: 'Không tìm thấy tab đang active' });
          return;
        }

        // Skip chrome:// and edge:// URLs (cannot inject)
        if (activeTab.url?.startsWith('chrome://') || activeTab.url?.startsWith('edge://') || activeTab.url?.startsWith('about:')) {
          sendResponse({ success: false, error: 'Không thể chụp trang hệ thống (chrome://, edge://)' });
          return;
        }

        // Get locale for translations
        const storage = await chrome.storage.local.get(['af_locale']);
        const locale = storage.af_locale || 'vi';

        // Capture overlay translations
        const captureI18n = {
          vi: { captureBtn: 'Chụp', cancelBtn: 'Hủy', namePlaceholder: 'Tên ảnh (cho @mention)', areaTooSmall: 'Vùng chọn quá nhỏ' },
          en: { captureBtn: 'Capture', cancelBtn: 'Cancel', namePlaceholder: 'Image name (for @mention)', areaTooSmall: 'Selection area too small' },
          th: { captureBtn: 'จับภาพ', cancelBtn: 'ยกเลิก', namePlaceholder: 'ชื่อภาพ (สำหรับ @mention)', areaTooSmall: 'พื้นที่เลือกเล็กเกินไป' },
          ja: { captureBtn: 'キャプチャ', cancelBtn: 'キャンセル', namePlaceholder: '画像名（@mention用）', areaTooSmall: '選択範囲が小さすぎます' }
        };
        const t = captureI18n[locale] || captureI18n.vi;

        // Inject crop overlay script into the active tab
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          args: [t],
          func: (translations) => {
            return new Promise((resolve) => {
              // Remove existing overlay if any
              const existing = document.getElementById('slnctrz-crop-overlay');
              if (existing) existing.remove();

              // S7.2: Default name với timestamp
              const defaultName = 'capture_' + Date.now().toString(36);

              // Create overlay
              const overlay = document.createElement('div');
              overlay.id = 'slnctrz-crop-overlay';
              overlay.innerHTML = `
                <div class="slnctrz-crop-selection" id="slnctrz-crop-selection">
                  <div class="slnctrz-crop-controls" id="slnctrz-crop-controls">
                    <div class="slnctrz-crop-name-row">
                      <input type="text" id="slnctrz-crop-name-input" class="slnctrz-crop-name-input"
                        placeholder="${translations.namePlaceholder}" value="${defaultName}" maxlength="50"
                        autocomplete="off" spellcheck="false">
                    </div>
                    <div class="slnctrz-crop-btn-row">
                      <button class="slnctrz-crop-btn slnctrz-crop-btn-capture" id="slnctrz-crop-capture-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        ${translations.captureBtn}
                      </button>
                      <button class="slnctrz-crop-btn slnctrz-crop-btn-cancel" id="slnctrz-crop-cancel-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        ${translations.cancelBtn}
                      </button>
                    </div>
                  </div>
                </div>
              `;

              // Inject styles
              const style = document.createElement('style');
              style.id = 'slnctrz-crop-styles-injected';
              style.textContent = `
                #slnctrz-crop-overlay {
                  position: fixed;
                  inset: 0;
                  background: rgba(0,0,0,0.5);
                  z-index: 2147483647;
                  cursor: crosshair;
                }
                #slnctrz-crop-overlay .slnctrz-crop-selection {
                  position: absolute;
                  border: 2px dashed #fff;
                  background: transparent;
                  display: none;
                  box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
                }
                #slnctrz-crop-overlay .slnctrz-crop-controls {
                  position: absolute;
                  bottom: -90px;
                  left: 50%;
                  transform: translateX(-50%);
                  display: none;
                  flex-direction: column;
                  gap: 8px;
                  z-index: 2147483647;
                  white-space: nowrap;
                }
                #slnctrz-crop-overlay .slnctrz-crop-controls.visible {
                  display: flex;
                }
                #slnctrz-crop-overlay .slnctrz-crop-name-row {
                  display: flex;
                  justify-content: center;
                }
                #slnctrz-crop-overlay .slnctrz-crop-name-input {
                  width: 220px;
                  padding: 8px 12px;
                  border: 1px solid rgba(255,255,255,0.3);
                  border-radius: 6px;
                  background: rgba(30,30,35,0.95);
                  color: #fff;
                  font-size: 13px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  outline: none;
                  text-align: center;
                }
                #slnctrz-crop-overlay .slnctrz-crop-name-input:focus {
                  border-color: #cdff01;
                }
                #slnctrz-crop-overlay .slnctrz-crop-name-input::placeholder {
                  color: rgba(255,255,255,0.5);
                }
                #slnctrz-crop-overlay .slnctrz-crop-btn-row {
                  display: flex;
                  gap: 8px;
                  justify-content: center;
                }
                #slnctrz-crop-overlay .slnctrz-crop-btn {
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
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                #slnctrz-crop-overlay .slnctrz-crop-btn svg { flex-shrink: 0; }
                #slnctrz-crop-overlay .slnctrz-crop-btn-capture {
                  background: #cdff01;
                  color: #1c1c1f;
                }
                #slnctrz-crop-overlay .slnctrz-crop-btn-capture:hover {
                  background: #d4ff33;
                  transform: scale(1.02);
                }
                #slnctrz-crop-overlay .slnctrz-crop-btn-cancel {
                  background: rgba(40,40,45,0.95);
                  color: #fff;
                  border: 1px solid rgba(255,255,255,0.15);
                }
                #slnctrz-crop-overlay .slnctrz-crop-btn-cancel:hover {
                  background: rgba(60,60,65,0.95);
                }
              `;
              document.head.appendChild(style);
              document.body.appendChild(overlay);

              // Selection state
              let startX = 0, startY = 0;
              let isDrawing = false;
              const selection = document.getElementById('slnctrz-crop-selection');
              const controls = document.getElementById('slnctrz-crop-controls');

              // Mouse handlers
              overlay.addEventListener('mousedown', (e) => {
                if (e.target.closest('.slnctrz-crop-controls')) return;
                isDrawing = true;
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
                const rect = selection.getBoundingClientRect();
                if (rect.width >= 20 && rect.height >= 20) {
                  controls.classList.add('visible');
                }
              });

              // Capture button - S7.3: Truyền name về cùng với cropRect
              document.getElementById('slnctrz-crop-capture-btn').addEventListener('click', () => {
                const rect = selection.getBoundingClientRect();
                const cropRect = {
                  x: Math.round(rect.left * window.devicePixelRatio),
                  y: Math.round(rect.top * window.devicePixelRatio),
                  width: Math.round(rect.width * window.devicePixelRatio),
                  height: Math.round(rect.height * window.devicePixelRatio)
                };
                // S7.3: Lấy tên ảnh từ input
                const nameInput = document.getElementById('slnctrz-crop-name-input');
                let captureName = (nameInput?.value || '').trim();
                // Sanitize name: chỉ giữ alphanumeric và underscore
                captureName = captureName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50);
                if (!captureName) {
                  captureName = 'capture_' + Date.now().toString(36);
                }

                overlay.remove();
                document.getElementById('slnctrz-crop-styles-injected')?.remove();
                if (cropRect.width < 20 || cropRect.height < 20) {
                  resolve({ success: false, error: translations.areaTooSmall });
                } else {
                  resolve({ success: true, cropRect, captureName });
                }
              });

              // Cancel button
              document.getElementById('slnctrz-crop-cancel-btn').addEventListener('click', () => {
                overlay.remove();
                document.getElementById('slnctrz-crop-styles-injected')?.remove();
                resolve({ success: false, cancelled: true });
              });

              // ESC key to cancel
              const escHandler = (e) => {
                if (e.key === 'Escape') {
                  overlay.remove();
                  document.getElementById('slnctrz-crop-styles-injected')?.remove();
                  document.removeEventListener('keydown', escHandler);
                  resolve({ success: false, cancelled: true });
                }
              };
              document.addEventListener('keydown', escHandler);
            });
          }
        });

        // Get result from injected script
        const result = results?.[0]?.result;
        if (result) {
          sendResponse({ ...result, tabId: activeTab.id });
        } else {
          sendResponse({ success: false, error: 'Không thể inject overlay vào trang này' });
        }
      } catch (err) {
        console.error('[SlncTrZ] startCropOnActiveTab error:', err.message);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'navigateToProject') {
    const url = message.url;
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (tabs.length > 0) {
          await chrome.tabs.update(tabs[0].id, { url, active: true });
          await chrome.windows.update(tabs[0].windowId, { focused: true });
        } else {
          await chrome.tabs.create({ url });
        }
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.action === 'clickCreateNewProject') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (tabs.length > 0) {
          // Inject polling script vào Flow home để chờ + click nút "Dự án mới"
          // Flow là SPA React, nút có thể chưa render ngay sau navigate
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              return new Promise((resolve) => {
                const iconNames = ['add_2', 'add', 'add_circle'];
                const textMatches = ['Dự án mới', 'Create new project', 'New project', 'Tạo dự án'];
                const maxWait = 10000;
                const interval = 500;
                let elapsed = 0;

                function tryClick() {
                  // Strategy 1: Tìm icon trong button
                  const buttons = document.querySelectorAll('button');
                  for (const btn of buttons) {
                    const icons = btn.querySelectorAll('i.google-symbols, i.material-icons, i.material-symbols, i[class*="google-symbols"], i[class*="material-"]');
                    for (const icon of icons) {
                      const iconText = icon.textContent.trim();
                      if (iconNames.includes(iconText)) {
                        btn.click();
                        resolve({ clicked: true, method: 'icon', icon: iconText });
                        return;
                      }
                    }
                  }

                  // Strategy 2: Tìm theo text content
                  for (const btn of buttons) {
                    const text = btn.textContent.trim();
                    for (const match of textMatches) {
                      if (text.includes(match)) {
                        btn.click();
                        resolve({ clicked: true, method: 'text', text: match });
                        return;
                      }
                    }
                  }

                  // Strategy 3: Tìm anchor/div có role="button" với icon add
                  const clickables = document.querySelectorAll('[role="button"], a[href*="/flow"]');
                  for (const el of clickables) {
                    const icons = el.querySelectorAll('i.google-symbols, i.material-icons, i[class*="google-symbols"], i[class*="material-"]');
                    for (const icon of icons) {
                      if (iconNames.includes(icon.textContent.trim())) {
                        el.click();
                        resolve({ clicked: true, method: 'role-button' });
                        return;
                      }
                    }
                  }

                  elapsed += interval;
                  if (elapsed >= maxWait) {
                    resolve({ clicked: false, error: 'timeout' });
                  } else {
                    setTimeout(tryClick, interval);
                  }
                }

                tryClick();
              });
            }
          });
          const result = results?.[0]?.result;
          sendResponse({ success: !!result?.clicked, result });
        } else {
          sendResponse({ success: false, error: 'Không tìm thấy tab Flow' });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.action === 'getFlowProjectContext') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
        if (tabs.length > 0) {
          // Ưu tiên active tab, fallback tab đầu tiên
          const activeTab = tabs.find(t => t.active) || tabs[0];
          chrome.tabs.sendMessage(activeTab.id, { action: 'getProjectContext' }, (resp) => {
            if (chrome.runtime.lastError) {
              sendResponse({ projectId: null, tabId: activeTab.id });
              return;
            }
            // CRITICAL: Include tabId + tabTitle để sidePanel có thể track target tab + fallback name
            sendResponse({ ...(resp || { projectId: null }), tabId: activeTab.id, tabTitle: activeTab.title || null });
          });
        } else {
          sendResponse({ projectId: null, tabId: null });
        }
      } catch (e) {
        sendResponse({ projectId: null, tabId: null });
      }
    })();
    return true;
  }

  // Fetch blob tu URL (dung cho TelegramExecutor upload ref image, bypass CORS)
  if (message.action === 'fetchBlob') {
    if (!_isAllowedUrl(message.url)) {
      sendResponse({ success: false, error: 'URL not allowed' });
      return true;
    }
    (async () => {
      try {
        const resp = await fetch(message.url);
        if (!resp.ok) {
          sendResponse({ success: false, error: `HTTP ${resp.status} ${resp.statusText}` });
          return;
        }
        const contentType = resp.headers.get('content-type') || '';
        // Reject non-image responses (e.g. HTML error pages)
        if (message.expectImage && !contentType.startsWith('image/')) {
          sendResponse({ success: false, error: `Not an image: ${contentType}` });
          return;
        }
        const buffer = await resp.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        sendResponse({ success: true, base64, contentType });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Check if image URL is still valid (lightweight GET with small range)
  if (message.action === 'checkImageUrl') {
    (async () => {
      try {
        // Google CDN may not support HEAD properly, use GET with range
        const resp = await fetch(message.url, {
          method: 'GET',
          headers: { 'Range': 'bytes=0-0' }
        });
        // 200 or 206 = alive, 404 = dead
        const alive = resp.status >= 200 && resp.status < 400;
        console.log('[checkImageUrl]', message.url.substring(0, 80), '→', resp.status, alive ? 'alive' : 'dead');
        sendResponse({ success: true, alive, status: resp.status });
      } catch (err) {
        console.log('[checkImageUrl] error:', err.message);
        sendResponse({ success: true, alive: false, error: err.message });
      }
    })();
    return true;
  }

  // === Chat AI Integration (Phase X) ===
  // Gửi tin nhắn + ảnh đến ChatGPT hoặc Gemini qua content script
  // FIX: Chỉ tìm/tạo tab trong CÙNG window với tab hiện tại (không mở window mới)
  if (message.action === 'chatAI:send') {
    const { model, text, images } = message;
    const targetUrl = model === 'chatgpt' ? PROVIDER_URLS.chatgpt.createUrl : PROVIDER_URLS.gemini.createUrl;
    const queryUrl = model === 'chatgpt' ? PROVIDER_URLS.chatgpt.tabQuery : PROVIDER_URLS.gemini.tabQuery;
    const scriptFile = model === 'chatgpt' ? 'chat-content-chatgpt.js' : 'chat-content-gemini.js';

    (async () => {
      try {
        // Lấy windowId: từ sender tab, hoặc lấy focused window (khi gửi từ sidePanel)
        let currentWindowId = sender.tab?.windowId;
        if (!currentWindowId) {
          const focusedWindow = await chrome.windows.getCurrent();
          currentWindowId = focusedWindow?.id;
        }

        // 1. Tìm hoặc tạo tab trong CÙNG WINDOW
        let tabs = await chrome.tabs.query({ url: queryUrl, windowId: currentWindowId });
        let tabId;

        if (tabs.length > 0) {
          tabId = tabs[0].id;
          await chrome.tabs.update(tabId, { active: true });
          // Nếu tab đã load xong → không cần navigate lại
          const tabInfo = await chrome.tabs.get(tabId);
          if (tabInfo.status !== 'complete') {
            // Tab đang loading → chờ load xong
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                reject(new Error('Timeout chờ tải trang'));
              }, 15000);

              const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                  clearTimeout(timeout);
                  chrome.tabs.onUpdated.removeListener(listener);
                  resolve();
                }
              };
              chrome.tabs.onUpdated.addListener(listener);
            });
          }
        } else {
          // Tạo tab mới TRONG CÙNG WINDOW và chờ load xong
          const tab = await chrome.tabs.create({ url: targetUrl, active: true, windowId: currentWindowId });
          tabId = tab.id;

          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(listener);
              reject(new Error('Timeout chờ tải trang'));
            }, 15000);

            const listener = (updatedTabId, changeInfo) => {
              if (updatedTabId === tabId && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
        }

        // 2. Chờ trang khởi tạo JS đầy đủ
        await new Promise(r => setTimeout(r, 2000));

        // 3. Inject content script tương ứng
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [scriptFile]
        });

        // 4. Chờ content script sẵn sàng
        await new Promise(r => setTimeout(r, 500));

        // 5. Gửi lệnh thực thi đến content script
        chrome.tabs.sendMessage(tabId, {
          action: 'chatAI:execute',
          text,
          images
        }, (resp) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message || 'Không nhận được phản hồi' });
            return;
          }
          sendResponse(resp || { success: true });
        });

      } catch (err) {
        console.error('[SlncTrZ] chatAI:send error:', err.message);
        sendResponse({ success: false, error: err.message || 'Lỗi không xác định' });
      }
    })();

    return true; // Giữ sendResponse cho async callback
  }

  // === OAuth Google Success (Phase AU-4.13) ===
  // Nhận token từ OAuth success page → gọi /auth/me → lưu vào af_auth → notify sidePanel
  if (message.action === 'oauth:success') {
    const senderUrl = sender.tab?.url || '';
    if (!senderUrl.includes('/auth/google/success')) {
      sendResponse({ success: false, error: 'Invalid sender URL' });
      return true;
    }
    const { token } = message;
    if (token) {
      (async () => {
        try {
          // Lấy apiBaseUrl hiện tại
          const stored = await new Promise(resolve => {
            chrome.storage.local.get(['af_auth'], result => resolve(result.af_auth || {}));
          });
          const apiBaseUrl = stored.apiBaseUrl || '';

          // Nếu có user cũ đang login, xóa SSE session của họ trước (fire-and-forget)
          // Điều này đảm bảo session SSE cũ được cleanup khi switch account qua Google OAuth
          if (stored.token && stored.user) {
            console.log('[SlncTrZ] OAuth: clearing SSE session for previous user');
            fetch(`${apiBaseUrl}/sse/end-session`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stored.token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              }
            }).catch(() => {
              // Silent fail - expected khi token đã hết hạn
            });
          }

          // Gọi /auth/me để lấy user data đầy đủ (bao gồm google_id)
          let user = null;
          try {
            const resp = await fetch(`${apiBaseUrl}/auth/me`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              }
            });
            if (resp.ok) {
              const data = await resp.json();
              user = data?.data?.user || data?.user || null;
              console.log('[SlncTrZ] OAuth: fetched user data from /auth/me', user?.google_id ? 'with google_id' : 'without google_id');
            }
          } catch (fetchErr) {
            console.warn('[SlncTrZ] OAuth: failed to fetch /auth/me, continuing with null user', fetchErr.message);
          }

          // Lưu auth data
          await new Promise(resolve => {
            chrome.storage.local.set({
              af_auth: {
                token,
                user,
                apiBaseUrl,
                savedAt: Date.now()
              }
            }, resolve);
          });

          console.log('[SlncTrZ] OAuth success: token saved');

          // Notify tất cả contexts (sidePanel, popups)
          chrome.runtime.sendMessage({
            action: 'auth:oauthLogin',
            token,
            user
          }).catch(() => {});

          // Sau khi login success: đóng OAuth tab + activate Google Flow tab.
          // Delay 1.5s để user thấy "Đăng nhập thành công" rồi tab đóng.
          if (sender.tab?.id) {
            const oauthTabId = sender.tab.id;
            const oauthWindowId = sender.tab.windowId;
            setTimeout(async () => {
              try {
                await chrome.tabs.remove(oauthTabId);
              } catch (err) {
                console.warn('[SlncTrZ] Không thể đóng OAuth tab:', err.message);
              }
              // Tìm Flow tab trong cùng window (hoặc bất kỳ window nếu không có)
              // và activate nó để user tiếp tục thao tác.
              try {
                let flowTabs = await chrome.tabs.query({
                  url: PROVIDER_URLS.flow.tabQuery,
                  windowId: oauthWindowId,
                });
                if (!flowTabs.length) {
                  flowTabs = await chrome.tabs.query({ url: PROVIDER_URLS.flow.tabQuery });
                }
                if (flowTabs.length > 0) {
                  const flowTab = flowTabs[0];
                  await chrome.tabs.update(flowTab.id, { active: true });
                  if (flowTab.windowId !== undefined) {
                    await chrome.windows.update(flowTab.windowId, { focused: true });
                  }
                  console.log('[SlncTrZ] Activated Flow tab sau OAuth login');
                } else {
                  console.log('[SlncTrZ] Không tìm thấy Flow tab để activate');
                }
              } catch (err) {
                console.warn('[SlncTrZ] Không thể activate Flow tab:', err.message);
              }
            }, 1500);
          }

          sendResponse({ success: true });
        } catch (err) {
          console.error('[SlncTrZ] OAuth save error:', err.message);
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }
    sendResponse({ success: false, error: 'Missing token' });
    return true;
  }

  // === OAuth Google Link Success (Phase AU-4.14) ===
  // Nhận thông báo từ OAuth success page (link flow) → notify sidePanel/settings
  if (message.action === 'oauth:linked') {
    const senderUrl = sender.tab?.url || '';
    if (!senderUrl.includes('/auth/google/success')) {
      sendResponse({ success: false, error: 'Invalid sender URL' });
      return true;
    }

    console.log('[SlncTrZ] Google link success: notifying extension');

    // Notify tất cả contexts (sidePanel, settings popup)
    chrome.runtime.sendMessage({
      action: 'auth:googleLinked'
    }).catch(() => {});

    sendResponse({ success: true });
    return true;
  }

  // Payment success callback from checkout page
  if (message.action === 'payment:success') {
    // Relay to all extension contexts (sidePanel, popups)
    chrome.runtime.sendMessage({
      action: 'payment:completed',
      orderId: message.orderId,
      status: message.status || 'paid'
    }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // Payment cancelled callback from checkout page
  if (message.action === 'payment:cancelled') {
    chrome.runtime.sendMessage({
      action: 'payment:cancelled',
      orderId: message.orderId
    }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // ============================================================
  // === Phase CG-2: ChatGPT Session Manager handlers ============
  // ============================================================
  // Các action `chatgpt:*` riêng biệt với `chatAI:send` (Phase X).
  // Dùng cho ChatGPTSession.js phía sidePanel để quản lý tab + image mode.
  // ============================================================

  // Helper sleep dùng chung trong các executeScript func bên dưới
  // (Khai báo inline trong từng func vì func chạy ở context tab khác — không có closure).
  // Inline pattern: `const sleep = (ms) => new Promise(r => setTimeout(r, ms));`

  if (message.action === 'chatgpt:findOrCreateTab') {
    const { createIfMissing = true, activate = true } = message;
    (async () => {
      try {
        // Lấy windowId từ sender hoặc focused window
        let currentWindowId = sender.tab?.windowId;
        if (!currentWindowId) {
          const focusedWindow = await chrome.windows.getCurrent();
          currentWindowId = focusedWindow?.id;
        }

        // Tìm tab chatgpt.com — ưu tiên trong cùng window
        let tabs = await chrome.tabs.query({ url: PROVIDER_URLS.chatgpt.tabQuery, windowId: currentWindowId });
        if (tabs.length === 0) {
          // Fallback: tìm trên mọi window
          tabs = await chrome.tabs.query({ url: PROVIDER_URLS.chatgpt.tabQuery });
        }

        let tabId;
        if (tabs.length > 0) {
          tabId = tabs[0].id;
        } else if (createIfMissing) {
          const tab = await chrome.tabs.create({
            url: PROVIDER_URLS.chatgpt.createUrl,
            active: !!activate,
            windowId: currentWindowId,
          });
          tabId = tab.id;
          // Chờ tab load xong (max 15s)
          await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }, 15000);
            const listener = (updatedTabId, changeInfo) => {
              if (updatedTabId === tabId && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
        } else {
          sendResponse({ success: false, error: 'NO_TAB' });
          return;
        }

        sendResponse({ success: true, tabId });
      } catch (err) {
        console.error('[SlncTrZ] chatgpt:findOrCreateTab error:', err.message);
        sendResponse({ success: false, error: err.message || 'NO_TAB' });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:ensureActive') {
    // Support 2 caller patterns: sidePanel pass tabId, content script fallback sender.tab.id
    const tabId = message.tabId || sender?.tab?.id;
    const focusWindow = message.focusWindow === true;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        const tabInfo = await chrome.tabs.get(tabId);
        if (!tabInfo.active) {
          await chrome.tabs.update(tabId, { active: true });
          // Chờ React unthrottle (300ms — pattern giống Flow tab)
          await new Promise(r => setTimeout(r, 300));
        }
        // Cloudflare/captcha challenge: bring window to front + drawAttention.
        if (focusWindow && tabInfo.windowId) {
          try {
            await chrome.windows.update(tabInfo.windowId, { focused: true, drawAttention: true });
          } catch (winErr) {
            console.warn('[SlncTrZ] chatgpt:ensureActive focusWindow failed:', winErr.message);
          }
        }
        sendResponse({ success: true, active: true });
      } catch (err) {
        console.error('[SlncTrZ] chatgpt:ensureActive error:', err.message);
        sendResponse({ success: false, error: err.message || 'ACTIVATE_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:injectScript') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        // Kiểm tra flag double-inject — nếu đã có thì không inject lại
        const checkResults = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => !!window.__slnctrzChatGPTLoaded__,
        });
        const alreadyLoaded = !!(checkResults && checkResults[0] && checkResults[0].result);

        if (!alreadyLoaded) {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['chat-content-chatgpt.js'],
          });
        }
        sendResponse({ success: true, alreadyLoaded });
      } catch (err) {
        console.error('[SlncTrZ] chatgpt:injectScript error:', err.message);
        sendResponse({ success: false, error: err.message || 'INJECT_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:checkLogin') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        const results = await chrome.scripting.executeScript({
          target: { tabId },
          // Func phải standalone — không reference closure outside
          func: function checkLoginStatus() {
            const editor = document.querySelector('#prompt-textarea');
            const loginBtn = document.querySelector('[data-testid="login-button"]');
            const loginLink = document.querySelector('a[href*="/auth/login"]');
            if (!editor) return { ready: false, error: 'EDITOR_NOT_FOUND' };
            if (loginBtn || loginLink) return { ready: false, error: 'NOT_LOGGED_IN' };
            return { ready: true };
          },
        });
        const result = (results && results[0] && results[0].result) || { ready: false, error: 'EDITOR_NOT_FOUND' };
        sendResponse({ success: true, ...result });
      } catch (err) {
        console.error('[SlncTrZ] chatgpt:checkLogin error:', err.message);
        sendResponse({ success: false, error: err.message || 'CHECK_FAILED' });
      }
    })();
    return true;
  }

  // ===========================================================================
  // Phase CG-8: Gemini handlers (stub minimal — text-only Prompt node enhance)
  // ===========================================================================

  if (message.action === 'gemini:findOrCreateTab') {
    const { createIfMissing = true, activate = true } = message;
    (async () => {
      try {
        let currentWindowId = sender.tab?.windowId;
        if (!currentWindowId) {
          const focusedWindow = await chrome.windows.getCurrent();
          currentWindowId = focusedWindow?.id;
        }

        let tabs = await chrome.tabs.query({ url: PROVIDER_URLS.gemini.tabQuery, windowId: currentWindowId });
        if (tabs.length === 0) {
          tabs = await chrome.tabs.query({ url: PROVIDER_URLS.gemini.tabQuery });
        }

        let tabId;
        if (tabs.length > 0) {
          tabId = tabs[0].id;
        } else if (createIfMissing) {
          const tab = await chrome.tabs.create({
            url: PROVIDER_URLS.gemini.createUrl,
            active: !!activate,
            windowId: currentWindowId,
          });
          tabId = tab.id;
          await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }, 15000);
            const listener = (updatedTabId, changeInfo) => {
              if (updatedTabId === tabId && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
        } else {
          sendResponse({ success: false, error: 'NO_TAB' });
          return;
        }

        sendResponse({ success: true, tabId });
      } catch (err) {
        console.error('[SlncTrZ] gemini:findOrCreateTab error:', err.message);
        sendResponse({ success: false, error: err.message || 'NO_TAB' });
      }
    })();
    return true;
  }

  if (message.action === 'gemini:ensureActive') {
    // Support 2 caller patterns: sidePanel pass tabId, content script fallback sender.tab.id
    const tabId = message.tabId || sender?.tab?.id;
    const focusWindow = message.focusWindow === true;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        const tabInfo = await chrome.tabs.get(tabId);
        if (!tabInfo.active) {
          await chrome.tabs.update(tabId, { active: true });
          await new Promise(r => setTimeout(r, 300));
        }
        // Cloudflare/captcha challenge: bring window to front + drawAttention.
        if (focusWindow && tabInfo.windowId) {
          try {
            await chrome.windows.update(tabInfo.windowId, { focused: true, drawAttention: true });
          } catch (winErr) {
            console.warn('[SlncTrZ] gemini:ensureActive focusWindow failed:', winErr.message);
          }
        }
        sendResponse({ success: true, active: true });
      } catch (err) {
        console.error('[SlncTrZ] gemini:ensureActive error:', err.message);
        sendResponse({ success: false, error: err.message || 'ACTIVATE_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'gemini:injectScript') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        // Guard double-inject (chat-content-gemini.js dùng flag _chatAIGeminiInjected)
        const checkResults = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => !!window._chatAIGeminiInjected,
        });
        const alreadyLoaded = !!(checkResults && checkResults[0] && checkResults[0].result);

        if (!alreadyLoaded) {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['chat-content-gemini.js'],
          });
        }
        sendResponse({ success: true, alreadyLoaded });
      } catch (err) {
        console.error('[SlncTrZ] gemini:injectScript error:', err.message);
        sendResponse({ success: false, error: err.message || 'INJECT_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'gemini:checkLogin') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: function checkGeminiLogin() {
            // Editor Quill có thể hiển thị khi đã login. Login wall thường có nút "Sign in".
            const editor =
              document.querySelector('.ql-editor[contenteditable="true"]') ||
              document.querySelector('rich-textarea [contenteditable="true"]') ||
              document.querySelector('div[role="textbox"][contenteditable="true"]');
            if (editor) return { ready: true };

            // Detect signin link
            const signinLink = document.querySelector('a[href*="accounts.google.com/ServiceLogin"], a[href*="signin"]');
            if (signinLink) return { ready: false, error: 'NOT_LOGGED_IN' };

            return { ready: false, error: 'EDITOR_NOT_FOUND' };
          },
        });
        const result = (results && results[0] && results[0].result) || { ready: false, error: 'EDITOR_NOT_FOUND' };
        sendResponse({ success: true, ...result });
      } catch (err) {
        console.error('[SlncTrZ] gemini:checkLogin error:', err.message);
        sendResponse({ success: false, error: err.message || 'CHECK_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'gemini:getTabInfo') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        const tabInfo = await chrome.tabs.get(tabId);
        sendResponse({ success: true, url: tabInfo?.url || null, active: !!tabInfo?.active });
      } catch (err) {
        sendResponse({ success: false, error: err.message || 'TAB_NOT_FOUND' });
      }
    })();
    return true;
  }

  if (message.action === 'gemini:closeTab') {
    const { tabId } = message;
    (async () => {
      try {
        if (tabId) {
          try { await chrome.tabs.remove(tabId); } catch (e) { /* tab có thể đã đóng */ }
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:activateImageMode') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: async function activateImageMode() {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const log = (...args) => console.log('[ChatGPT-activate]', ...args);

            // Helper: click element bằng cả real MouseEvent + React onClick (max compat)
            const clickElement = (el) => {
              if (!el) return false;
              // 1. Real mouse events (visible click animation + native React handler)
              const rect = el.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
              try {
                el.dispatchEvent(new PointerEvent('pointerdown', opts));
                el.dispatchEvent(new MouseEvent('mousedown', opts));
                el.dispatchEvent(new PointerEvent('pointerup', opts));
                el.dispatchEvent(new MouseEvent('mouseup', opts));
                el.dispatchEvent(new MouseEvent('click', opts));
              } catch (e) { /* ignore */ }
              // 2. Fallback React onClick/onSelect props (cho Radix menuitemradio)
              const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
              const props = propsKey ? el[propsKey] : null;
              try {
                if (props && typeof props.onSelect === 'function') {
                  props.onSelect({ preventDefault() {}, stopPropagation() {} });
                } else if (props && typeof props.onClick === 'function') {
                  props.onClick({ preventDefault() {}, stopPropagation() {}, nativeEvent: new MouseEvent('click'), type: 'click', target: el, currentTarget: el });
                }
              } catch (e) { /* ignore */ }
              return true;
            };

            // Đóng menu cũ nếu đang mở (tránh state cũ ảnh hưởng) — chỉ chờ 60ms
            try {
              const openMenu = document.querySelector('div[role="menu"][data-state="open"]');
              if (openMenu) {
                document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                await sleep(60);
              }
            } catch (e) {}

            // 1. Detect đã ở image mode — ratio dropdown đã visible
            const existingRatioBtn = document.querySelector('button[aria-label="Choose image aspect ratio"]');
            if (existingRatioBtn) {
              log('Step 1: ratio button đã visible — image mode đã active, skip click composer');
              return { activated: true, ratioControlAvailable: true, alreadyActive: true };
            }

            // 2. Click composer plus button (visible click)
            const plusBtn = document.querySelector('#composer-plus-btn')
              || document.querySelector('[data-testid="composer-plus-btn"]');
            if (!plusBtn) {
              log('Step 2 FAIL: PLUS_BUTTON_NOT_FOUND');
              return { activated: false, error: 'PLUS_BUTTON_NOT_FOUND' };
            }
            log('Step 2: Click composer plus button');
            clickElement(plusBtn);

            // 3. Chờ menu render (Radix portal — append vào body, retry nhanh)
            let menuContainer = null;
            for (let i = 0; i < 6; i++) {
              await sleep(80);
              menuContainer = document.querySelector('div[role="menu"][data-radix-menu-content][data-state="open"]');
              if (menuContainer) break;
            }
            if (!menuContainer) {
              log('Step 3 FAIL: MENU_NOT_RENDERED sau 480ms');
              return { activated: false, error: 'MENU_NOT_RENDERED' };
            }
            log('Step 3: Menu rendered');

            // 4. Tìm item "Create image"
            const menuItems = menuContainer.querySelectorAll('[role="menuitemradio"], [role="menuitem"]');
            let createImageItem = null;
            let alreadyChecked = false;
            for (const item of menuItems) {
              const text = (item.innerText || '').trim().toLowerCase();
              if (text === 'create image' || text === 'create an image' || text.startsWith('create image')) {
                createImageItem = item;
                alreadyChecked = item.getAttribute('aria-checked') === 'true'
                  || item.getAttribute('data-state') === 'checked';
                break;
              }
            }
            if (!createImageItem) {
              log('Step 4 FAIL: MENU_ITEM_NOT_FOUND. Items found:', Array.from(menuItems).map(i => i.innerText?.trim()));
              return { activated: false, error: 'MENU_ITEM_NOT_FOUND' };
            }
            log('Step 4: Click "Create image" item (alreadyChecked:', alreadyChecked, ')');

            // 5. Click item — CẢ KHI alreadyChecked (force re-toggle để đảm bảo state đúng)
            //    nếu alreadyChecked → đóng menu bằng Escape (không click again gây toggle off)
            if (!alreadyChecked) {
              clickElement(createImageItem);
            } else {
              try {
                document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
              } catch (e) {}
            }

            // 6. Chờ ratio dropdown render (retry nhanh)
            let ratioBtn = null;
            for (let i = 0; i < 8; i++) {
              await sleep(80);
              ratioBtn = document.querySelector('button[aria-label="Choose image aspect ratio"]');
              if (ratioBtn) break;
            }
            log('Step 6:', ratioBtn ? 'Ratio button visible' : 'RATIO_CONTROL_NOT_RENDERED sau 640ms');

            return {
              activated: !!ratioBtn,
              ratioControlAvailable: !!ratioBtn,
              wasAlreadyChecked: alreadyChecked,
              error: ratioBtn ? null : 'RATIO_CONTROL_NOT_RENDERED',
            };
          },
        });

        const result = (results && results[0] && results[0].result) || { activated: false, error: 'EXEC_FAILED' };
        sendResponse({ success: !!result.activated, ...result });
      } catch (err) {
        console.error('[SlncTrZ] chatgpt:activateImageMode error:', err.message);
        sendResponse({ success: false, activated: false, error: err.message || 'EXEC_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:setRatio') {
    const { tabId, ratio, ariaLabelMap } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        if (!ratio) { sendResponse({ success: false, error: 'INVALID_RATIO_KEY' }); return; }

        // Fallback aria-label map nếu caller không truyền (ChatGPTAdapter chưa load).
        // Source of truth: ChatGPTAdapter.capabilities.ratioAriaLabels. Sync khi adapter
        // capabilities được migrate sang PCM (Phase J pending).
        const _FALLBACK_ARIA_LABEL_MAP = {
          story: 'Story 9:16',
          portrait: 'Portrait 3:4',
          square: 'Square 1:1',
          landscape: 'Landscape 4:3',
          widescreen: 'Widescreen 16:9',
        };
        const resolvedAriaLabelMap = (ariaLabelMap && typeof ariaLabelMap === 'object')
          ? ariaLabelMap
          : _FALLBACK_ARIA_LABEL_MAP;

        const results = await chrome.scripting.executeScript({
          target: { tabId },
          args: [ratio, resolvedAriaLabelMap],
          func: async function setRatio(ratioKey, ARIA_LABEL_MAP) {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const log = (...args) => console.log('[ChatGPT-setRatio]', ...args);

            const clickElement = (el) => {
              if (!el) return false;
              const rect = el.getBoundingClientRect();
              const opts = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
              try {
                el.dispatchEvent(new PointerEvent('pointerdown', opts));
                el.dispatchEvent(new MouseEvent('mousedown', opts));
                el.dispatchEvent(new PointerEvent('pointerup', opts));
                el.dispatchEvent(new MouseEvent('mouseup', opts));
                el.dispatchEvent(new MouseEvent('click', opts));
              } catch (e) {}
              const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
              const props = propsKey ? el[propsKey] : null;
              try {
                if (props && typeof props.onSelect === 'function') {
                  props.onSelect({ preventDefault() {}, stopPropagation() {} });
                } else if (props && typeof props.onClick === 'function') {
                  props.onClick({ preventDefault() {}, stopPropagation() {}, nativeEvent: new MouseEvent('click'), type: 'click', target: el, currentTarget: el });
                }
              } catch (e) {}
              return true;
            };

            const targetAriaLabel = ARIA_LABEL_MAP?.[ratioKey];
            if (!targetAriaLabel) return { success: false, error: 'INVALID_RATIO_KEY' };

            const ratioBtn = document.querySelector('button[aria-label="Choose image aspect ratio"]');
            if (!ratioBtn) {
              log('FAIL: RATIO_BUTTON_NOT_FOUND');
              return { success: false, error: 'RATIO_BUTTON_NOT_FOUND' };
            }
            log('Step 1: Click ratio button →', targetAriaLabel);
            clickElement(ratioBtn);

            // Chờ dropdown render (retry 5 lần)
            let items = [];
            for (let i = 0; i < 5; i++) {
              await sleep(150);
              items = document.querySelectorAll('[role="menuitemradio"]');
              if (items.length >= 5) break; // 5 ratios + có thể thêm Auto
            }
            log('Step 2: Found', items.length, 'menuitemradio options');

            // Primary: aria-label exact
            let target = null;
            for (const item of items) {
              if (item.getAttribute('aria-label') === targetAriaLabel) { target = item; break; }
            }
            if (!target) {
              const ratioName = targetAriaLabel.split(' ')[0].toLowerCase();
              for (const item of items) {
                const text = (item.innerText || '').trim().toLowerCase();
                if (text.startsWith(ratioName)) { target = item; break; }
              }
            }
            if (!target) {
              log('FAIL: RATIO_OPTION_NOT_FOUND. Items aria-labels:', Array.from(items).map(i => i.getAttribute('aria-label')));
              return { success: false, error: 'RATIO_OPTION_NOT_FOUND' };
            }
            log('Step 3: Click target option');
            clickElement(target);

            return { success: true };
          },
        });

        const result = (results && results[0] && results[0].result) || { success: false, error: 'EXEC_FAILED' };
        sendResponse(result);
      } catch (err) {
        console.error('[SlncTrZ] chatgpt:setRatio error:', err.message);
        sendResponse({ success: false, error: err.message || 'EXEC_FAILED' });
      }
    })();
    return true;
  }

  // Generic fetch image as base64 - for Flow URLs that need authentication
  if (message.action === 'fetchImageAsBase64') {
    const { url } = message;
    (async () => {
      try {
        if (!url) {
          sendResponse({ success: false, error: 'MISSING_URL' });
          return;
        }

        // Find a Flow tab to inject the fetch (Flow tabs have cookies)
        const flowTabs = await chrome.tabs.query({ url: ['*://labs.google/*', '*://aisandbox.google.com/*'] });
        if (flowTabs.length === 0) {
          // Fallback: try direct fetch (might work if URL doesn't need auth)
          try {
            const resp = await fetch(url);
            if (!resp.ok) {
              sendResponse({ success: false, error: 'HTTP_' + resp.status });
              return;
            }
            const blob = await resp.blob();
            const contentType = blob.type || 'image/jpeg';
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            sendResponse({ success: true, base64, contentType });
          } catch (e) {
            sendResponse({ success: false, error: 'NO_FLOW_TAB_AND_DIRECT_FAILED' });
          }
          return;
        }

        const tabId = flowTabs[0].id;
        // Inject fetch trong context tab Flow.
        // KHÔNG dùng credentials: 'include' vì redirect chain `labs.google` →
        // `flow-content.google` trả `Access-Control-Allow-Origin: *` → CORS
        // block credentialed request. Signed URL của CDN đã đủ để authenticate
        // qua Expires + Signature query params.
        const [scriptResult] = await chrome.scripting.executeScript({
          target: { tabId },
          func: async (imgUrl) => {
            try {
              const resp = await fetch(imgUrl);
              if (!resp.ok) return { ok: false, status: resp.status, error: 'HTTP_' + resp.status };
              const blob = await resp.blob();
              return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                  // Extract base64 from data URL
                  const dataUrl = reader.result;
                  const base64 = dataUrl.split(',')[1];
                  resolve({
                    ok: true,
                    base64: base64,
                    contentType: blob.type || 'image/jpeg',
                    size: blob.size,
                  });
                };
                reader.onerror = () => resolve({ ok: false, error: 'READ_ERROR' });
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              return { ok: false, error: e.message || 'FETCH_EXCEPTION' };
            }
          },
          args: [url],
        });

        const r = scriptResult?.result;
        if (!r?.ok) {
          sendResponse({ success: false, error: r?.error || 'FETCH_FAILED' });
          return;
        }
        sendResponse({
          success: true,
          base64: r.base64,
          contentType: r.contentType,
          size: r.size,
        });
      } catch (err) {
        console.error('[SlncTrZ] fetchImageAsBase64 error:', err.message);
        sendResponse({ success: false, error: 'EXCEPTION', message: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:fetchImage') {
    // Phase CG-3.4: Fetch ChatGPT CDN image qua cookie session của tab chatgpt.com.
    // URL CDN dạng `https://chatgpt.com/backend-api/estuary/content?id=file_xxx&sig=...`
    // CHỈ accessible khi có cookie chatgpt.com — KHÔNG thể fetch từ background context
    // hay tab khác. Phải inject `chrome.scripting.executeScript` vào tab ChatGPT để fetch.
    const { url, tabId } = message;
    (async () => {
      try {
        if (!url || !tabId) {
          sendResponse({ success: false, error: 'MISSING_PARAMS' });
          return;
        }
        // Inject fetch trong context tab ChatGPT (cookie session authenticated)
        const [scriptResult] = await chrome.scripting.executeScript({
          target: { tabId },
          func: async (imgUrl) => {
            try {
              const resp = await fetch(imgUrl, { credentials: 'include' });
              if (!resp.ok) return { ok: false, status: resp.status, error: 'HTTP_' + resp.status };
              const blob = await resp.blob();
              // Convert blob → base64 data URL qua FileReader
              return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                  ok: true,
                  base64: reader.result,
                  mime: blob.type || 'image/png',
                  size: blob.size,
                });
                reader.onerror = () => resolve({ ok: false, error: 'READ_ERROR' });
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              return { ok: false, error: e.message || 'FETCH_EXCEPTION' };
            }
          },
          args: [url],
        });
        const r = scriptResult?.result;
        if (!r?.ok) {
          sendResponse({
            success: false,
            error: r?.error || 'FETCH_FAILED',
            status: r?.status,
          });
          return;
        }
        sendResponse({
          success: true,
          base64: r.base64,
          mime: r.mime,
          size: r.size,
        });
      } catch (err) {
        console.error('[SlncTrZ] chatgpt:fetchImage error:', err.message);
        sendResponse({ success: false, error: 'EXCEPTION', message: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:closeTab') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: true }); return; }
        try {
          await chrome.tabs.remove(tabId);
        } catch (e) {
          // Tab có thể đã đóng — bỏ qua
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'chatgpt:navigated') {
    // Chỉ relay khi message đến TỪ content script (sender.tab tồn tại). Bản broadcast
    // background gửi ra sidePanel KHÔNG có sender.tab → tránh infinite loop.
    if (!sender.tab) {
      sendResponse({ success: true, skipped: true });
      return true;
    }
    const tabId = sender.tab.id;
    // Đổi action name để tránh listener này bắt lại bản broadcast của chính nó.
    chrome.runtime.sendMessage({
      action: 'chatgpt:navigatedBroadcast',
      tabId,
      url: message.url,
    }).catch(() => {});
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'chatgpt:getTabInfo') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        const tabInfo = await chrome.tabs.get(tabId);
        sendResponse({
          success: true,
          url: tabInfo.url || null,
          active: !!tabInfo.active,
          status: tabInfo.status,
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ============================================================
  // === Phase G-2: Grok Session Manager handlers ================
  // ============================================================
  // Các action `grok:*` riêng biệt với chatgpt:* / gemini:* / chatAI:send.
  // Mirror pattern ChatGPT (Phase CG-2) cho Grok provider.
  // ============================================================

  if (message.action === 'grok:findOrCreateTab') {
    const { createIfMissing = true, activate = true } = message;
    (async () => {
      try {
        let currentWindowId = sender.tab?.windowId;
        if (!currentWindowId) {
          const focusedWindow = await chrome.windows.getCurrent();
          currentWindowId = focusedWindow?.id;
        }

        // Tìm tab grok.com — ưu tiên trong cùng window
        let tabs = await chrome.tabs.query({ url: PROVIDER_URLS.grok.tabQuery, windowId: currentWindowId });
        if (tabs.length === 0) {
          tabs = await chrome.tabs.query({ url: PROVIDER_URLS.grok.tabQuery });
        }

        let tabId;
        if (tabs.length > 0) {
          // Ưu tiên tab đã ở /imagine (sẵn sàng tương tác)
          const imagineTab = tabs.find(t => t.url && t.url.includes('/imagine'));
          if (imagineTab) {
            tabId = imagineTab.id;
          } else {
            // Tab grok.com tồn tại nhưng KHÔNG ở /imagine → navigate đến /imagine
            tabId = tabs[0].id;
            await chrome.tabs.update(tabId, { url: PROVIDER_URLS.grok.imagine });
            // Chờ navigation complete
            await new Promise((resolve) => {
              const timeout = setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }, 10000);
              const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                  clearTimeout(timeout);
                  chrome.tabs.onUpdated.removeListener(listener);
                  resolve();
                }
              };
              chrome.tabs.onUpdated.addListener(listener);
            });
          }
        } else if (createIfMissing) {
          const tab = await chrome.tabs.create({
            url: PROVIDER_URLS.grok.imagine,
            active: !!activate,
            windowId: currentWindowId,
          });
          tabId = tab.id;
          // Chờ tab load xong (max 15s)
          await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }, 15000);
            const listener = (updatedTabId, changeInfo) => {
              if (updatedTabId === tabId && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
        } else {
          sendResponse({ success: false, error: 'NO_TAB' });
          return;
        }

        sendResponse({ success: true, tabId });
      } catch (err) {
        console.error('[SlncTrZ] grok:findOrCreateTab error:', err.message);
        sendResponse({ success: false, error: err.message || 'NO_TAB' });
      }
    })();
    return true;
  }

  if (message.action === 'cloudflare:challenge') {
    // Bug 49 forward: content script Grok gửi event → broadcast tới mọi extension page
    // (sidebar + workflow popup). chrome.runtime.sendMessage không có tabId → đến tất cả listener.
    try {
      chrome.runtime.sendMessage({
        action: 'cloudflare:challenge',
        provider: message.provider,
        phase: message.phase,
        elapsedSec: message.elapsedSec || 0,
        timeoutSec: message.timeoutSec || 120,
        tabId: sender?.tab?.id || null,
      }).catch(() => { /* no listener — sidebar maybe closed */ });
    } catch (_) {}
    sendResponse?.({ success: true });
    return false;
  }

  if (message.action === 'grok:ensureActive') {
    // Support 2 caller patterns:
    //   - sidePanel: pass tabId explicit
    //   - content script (Grok page itself): no tabId → fallback sender.tab.id
    const tabId = message.tabId || sender?.tab?.id;
    const focusWindow = message.focusWindow === true;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        const tabInfo = await chrome.tabs.get(tabId);
        if (!tabInfo.active) {
          await chrome.tabs.update(tabId, { active: true });
          // Chờ React unthrottle (300ms — pattern giống Flow/ChatGPT)
          await new Promise(r => setTimeout(r, 300));
        }
        // Cloudflare challenge: cần bring window to front để user thấy turnstile.
        // Tab có thể active trong window background → user vẫn không thấy.
        if (focusWindow && tabInfo.windowId) {
          try {
            await chrome.windows.update(tabInfo.windowId, { focused: true, drawAttention: true });
          } catch (winErr) {
            console.warn('[SlncTrZ] grok:ensureActive focusWindow failed:', winErr.message);
          }
        }
        sendResponse({ success: true, active: true });
      } catch (err) {
        console.error('[SlncTrZ] grok:ensureActive error:', err.message);
        sendResponse({ success: false, error: err.message || 'ACTIVATE_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'grok:injectScript') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        // Kiểm tra flag double-inject
        const checkResults = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => !!window.__slnctrzGrokLoaded__,
        });
        const alreadyLoaded = !!(checkResults && checkResults[0] && checkResults[0].result);

        if (!alreadyLoaded) {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['chat-content-grok.js'],
          });
        }
        sendResponse({ success: true, alreadyLoaded });
      } catch (err) {
        console.error('[SlncTrZ] grok:injectScript error:', err.message);
        sendResponse({ success: false, error: err.message || 'INJECT_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'grok:checkLogin') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        const results = await chrome.scripting.executeScript({
          target: { tabId },
          // Func phải standalone — không reference closure outside
          func: function checkGrokLoginStatus() {
            // Editor TipTap: form contenteditable
            const editor = document.querySelector("form div[contenteditable='true']")
                        || document.querySelector('.ProseMirror')
                        || document.querySelector('.tiptap');
            // Login link: a[href*="/login"]
            const loginLink = document.querySelector('a[href*="/login"]')
                           || document.querySelector('a[href*="/signin"]');

            if (!editor) {
              // Nếu có login link rõ ràng + không có editor → chưa login
              if (loginLink) return { ready: false, error: 'NOT_LOGGED_IN' };
              return { ready: false, error: 'EDITOR_NOT_FOUND' };
            }
            return { ready: true };
          },
        });
        const result = (results && results[0] && results[0].result) || { ready: false, error: 'EDITOR_NOT_FOUND' };
        sendResponse({ success: true, ...result });
      } catch (err) {
        console.error('[SlncTrZ] grok:checkLogin error:', err.message);
        sendResponse({ success: false, error: err.message || 'CHECK_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'grok:applySettings' || message.action === 'grok:setRatio') {
    // Relay tới content script để gọi applyGrokSettings (đã sẵn trong chat-content-grok.js).
    // grok:setRatio là alias chỉ apply ratio.
    const { tabId, settings, ratio } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }

        // Build payload settings
        let payload = settings || {};
        if (message.action === 'grok:setRatio' && ratio) {
          payload = { ratio };
        }

        // Inject inline func gọi applyGrokSettings nếu content script đã loaded.
        // applyGrokSettings được expose qua handler grok:applySettingsInline (chưa có) — thay
        // bằng inline executeScript thực thi trực tiếp các DOM operations.
        // Để đơn giản + idempotent, gọi qua tabs.sendMessage tới content script:
        const sent = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabId, {
            action: 'grok:applySettingsInline',
            settings: payload,
          }, (resp) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            resolve(resp || { success: false, error: 'NO_RESPONSE' });
          });
        });
        sendResponse(sent);
      } catch (err) {
        console.error('[SlncTrZ] grok:applySettings error:', err.message);
        sendResponse({ success: false, error: err.message || 'APPLY_FAILED' });
      }
    })();
    return true;
  }

  if (message.action === 'grok:fetchImage' || message.action === 'grok:fetchMedia') {
    // Phase G-2: Fetch media URL (assets.grok.com) qua cookie session của tab grok.com.
    const { url, tabId } = message;
    (async () => {
      try {
        if (!url || !tabId) {
          sendResponse({ success: false, error: 'MISSING_PARAMS' });
          return;
        }
        // Inject fetch trong context tab Grok (cookie session)
        const [scriptResult] = await chrome.scripting.executeScript({
          target: { tabId },
          func: async (mediaUrl) => {
            try {
              const resp = await fetch(mediaUrl, { credentials: 'include' });
              if (!resp.ok) return { ok: false, status: resp.status, error: 'HTTP_' + resp.status };
              const blob = await resp.blob();
              return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                  ok: true,
                  base64: reader.result,
                  mime: blob.type || 'image/png',
                  size: blob.size,
                });
                reader.onerror = () => resolve({ ok: false, error: 'READ_ERROR' });
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              return { ok: false, error: e.message || 'FETCH_EXCEPTION' };
            }
          },
          args: [url],
        });
        const r = scriptResult?.result;
        if (!r?.ok) {
          sendResponse({
            success: false,
            error: r?.error || 'FETCH_FAILED',
            status: r?.status,
          });
          return;
        }
        sendResponse({
          success: true,
          base64: r.base64,
          mime: r.mime,
          size: r.size,
        });
      } catch (err) {
        console.error('[SlncTrZ] grok:fetchImage error:', err.message);
        sendResponse({ success: false, error: 'EXCEPTION', message: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'grok:closeTab') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: true }); return; }
        try {
          await chrome.tabs.remove(tabId);
        } catch (e) {
          // Tab có thể đã đóng — bỏ qua
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'grok:submitAndWait') {
    // Relay tới content script (chat-content-grok.js đã sẵn listener).
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        // Forward toàn bộ payload đến content script
        const payload = { ...message };
        delete payload.tabId; // không cần bên content script
        const resp = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabId, payload, (r) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            resolve(r || { success: false, error: 'NO_RESPONSE' });
          });
        });
        sendResponse(resp);
      } catch (err) {
        console.error('[SlncTrZ] grok:submitAndWait error:', err.message);
        sendResponse({ success: false, error: 'EXCEPTION', message: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'grok:navigated') {
    // CRITICAL re-broadcast loop fix: chỉ relay khi đến từ content script (sender.tab tồn tại).
    // Bản broadcast `grok:navigatedBroadcast` sidePanel nhận sẽ KHÔNG có sender.tab → tránh loop.
    if (!sender.tab) {
      sendResponse({ success: true, skipped: true });
      return true;
    }
    const tabId = sender.tab.id;
    chrome.runtime.sendMessage({
      action: 'grok:navigatedBroadcast',
      tabId,
      url: message.url,
    }).catch(() => {});
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'grok:getTabInfo') {
    const { tabId } = message;
    (async () => {
      try {
        if (!tabId) { sendResponse({ success: false, error: 'NO_TAB' }); return; }
        const tabInfo = await chrome.tabs.get(tabId);
        sendResponse({
          success: true,
          url: tabInfo.url || null,
          active: !!tabInfo.active,
          status: tabInfo.status,
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Không xử lý messages khác (contentLog, promptExecutionComplete, etc.)
  // Return false/undefined để Chrome biết listener này không handle message này
  return false;
});

// === Phase CG-2: Forward chatgpt.com tab close events đến ChatGPTSession ===
// Khi user đóng tab chatgpt.com → broadcast 'chatgpt:tabClosed' để ChatGPTSession reset cache.
chrome.tabs.onRemoved.addListener((tabId) => {
  // Broadcast tới mọi context (sidePanel + popups). ChatGPTSession sẽ tự lọc theo _tabId.
  chrome.runtime.sendMessage({ action: 'chatgpt:tabClosed', tabId }).catch(() => {});
  // Phase G-2: cùng listener cho Grok — GrokSession sẽ tự lọc theo _tabId.
  chrome.runtime.sendMessage({ action: 'grok:tabClosed', tabId }).catch(() => {});
});

// === Phase G-2: Forward grok.com tab navigation events ===
// Khi tab grok.com đổi URL (status='complete'), relay broadcast để GrokSession invalidate UI cache.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab || !tab.url || !tab.url.includes('grok.com')) return;
  chrome.runtime.sendMessage({
    action: 'grok:navigatedBroadcast',
    tabId,
    url: tab.url,
  }).catch(() => {});
});

// Keyboard shortcuts
chrome.commands?.onCommand?.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'command', command });
    }
  });
});

// ===== Provider Config Helpers (DOM Resilience Plan) =====
const _PROVIDER_CONFIG_CACHE_KEY = 'slnctrz_provider_configs';
const _PROVIDER_CONFIG_TTL_MS = 60 * 60 * 1000; // 1h

async function _getApiBaseUrl() {
  return new Promise(resolve => {
    chrome.storage.local.get(['af_api_url'], res => {
      resolve(res.af_api_url || '');
    });
  });
}

async function _getProviderConfigsFromCache() {
  return new Promise(resolve => {
    chrome.storage.local.get([_PROVIDER_CONFIG_CACHE_KEY], res => {
      const cached = res[_PROVIDER_CONFIG_CACHE_KEY];
      if (cached && Date.now() < cached.expiresAt) {
        resolve(cached);
      } else {
        resolve(null);
      }
    });
  });
}

async function _fetchProviderConfigs() {
  try {
    const cached = await _getProviderConfigsFromCache();
    if (cached) return cached.data;

    const baseUrl = await _getApiBaseUrl();
    const resp = await fetch(`${baseUrl}/api/v1/providers/dom-selectors`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    if (json.success && json.data) {
      const cacheData = {
        data: json.data,
        expiresAt: Date.now() + _PROVIDER_CONFIG_TTL_MS,
        fetchedAt: Date.now(),
      };
      chrome.storage.local.set({ [_PROVIDER_CONFIG_CACHE_KEY]: cacheData });
      return json.data;
    }
  } catch (e) {
    console.warn('[Background] Provider config fetch failed:', e.message);
  }
  return null;
}

// Pre-fetch provider configs on extension startup
chrome.runtime.onInstalled.addListener(() => {
  _fetchProviderConfigs().then(() => {
    console.log('[Background] Provider configs pre-fetched');
  });
});

chrome.runtime.onStartup.addListener(() => {
  _fetchProviderConfigs().catch(() => {});
});

// ══════════════════════════════════════════════════════════════════════
// WebSocket Bridge — kết nối tới n8n Server
// ══════════════════════════════════════════════════════════════════════

const WS_DEFAULTS = {
  url: 'ws://localhost:10588/api/bridge/ws',  // Embedded in ToonFlow (override via af_ws_config)
  reconnectDelay: 3000,
  maxReconnectDelay: 30000,
  pingInterval: 25000,
};

let _ws = null;
let _wsReconnectTimer = null;
let _wsReconnectDelay = WS_DEFAULTS.reconnectDelay;
let _wsPingTimer = null;
let _wsConnected = false;

async function _getWsConfig() {
  try {
    const res = await chrome.storage.local.get(['af_ws_config']);
    return res.af_ws_config || WS_DEFAULTS;
  } catch { return WS_DEFAULTS; }
}

function _wsConnect() {
  if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) return;

  _getWsConfig().then(config => {
    console.log('[WSBridge] Connecting to', config.url);
    try {
      _ws = new WebSocket(config.url);
    } catch (e) {
      console.warn('[WSBridge] Connection failed:', e.message);
      _wsScheduleReconnect();
      return;
    }

    _ws.onopen = () => {
      console.log('[WSBridge] Connected');
      _wsConnected = true;
      _wsReconnectDelay = WS_DEFAULTS.reconnectDelay;
      // Ping heartbeat
      _wsPingTimer = setInterval(() => {
        if (_ws?.readyState === WebSocket.OPEN) {
          _ws.send(JSON.stringify({ action: 'ping' }));
        }
      }, config.pingInterval || WS_DEFAULTS.pingInterval);
    };

    _ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.action === 'execute') {
          console.log('[WSBridge] onmessage execute id=' + (msg.id || '?') + ' provider=' + (msg.provider || '?'));
        }
        _wsHandleMessage(msg);
      } catch (e) {
        console.warn('[WSBridge] Invalid message:', e.message);
      }
    };

    _ws.onclose = () => {
      console.log('[WSBridge] Disconnected');
      _wsConnected = false;
      if (_wsPingTimer) { clearInterval(_wsPingTimer); _wsPingTimer = null; }
      _wsScheduleReconnect();
    };

    _ws.onerror = () => {
      // onclose will fire after onerror
    };
  });
}

function _wsScheduleReconnect() {
  if (_wsReconnectTimer) return;
  _wsReconnectTimer = setTimeout(() => {
    _wsReconnectTimer = null;
    _wsConnect();
  }, Math.min(_wsReconnectDelay, WS_DEFAULTS.maxReconnectDelay));
  _wsReconnectDelay = Math.min(_wsReconnectDelay * 1.5, WS_DEFAULTS.maxReconnectDelay);
}

function _wsSend(data) {
  if (_ws?.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify(data));
  }
}

async function _wsHandleMessage(msg) {
  console.log('[WSBridge] Command:', msg.action);

  switch (msg.action) {
    case 'execute':
      await _wsExecuteCommand(msg);
      break;
    case 'cancel':
      _wsSend({ action: 'canceled', id: msg.id });
      break;
    case 'ping':
      _wsSend({ action: 'pong' });
      break;
    default:
      console.warn('[WSBridge] Unknown action:', msg.action);
  }
}

async function _wsExecuteCommand(cmd) {
  const { provider, prompts, images, config, id } = cmd;
  if (!provider || !prompts?.length) {
    _wsSend({ action: 'result', id, status: 'failed', error: 'Missing provider or prompts' });
    return;
  }

  try {
    // Gửi lệnh đến sidePanel để thực thi
    console.log('[WSBridge] Sending n8n:execute to sidePanel id=' + id + ' prompts=' + prompts.length);
    const resp = await chrome.runtime.sendMessage({
      action: 'n8n:execute',
      provider,
      prompts,
      images: images || [],
      config: config || {},
      commandId: id,
    }).catch(() => null);

    console.log('[WSBridge] n8n:execute response id=' + id + ' resp=' + (resp ? 'has_data' : 'undefined/null'));
    // Chỉ gửi result khi sidePanel trả về lỗi hoặc kết quả thật
    // (KHÔNG gửi empty result — để n8n:result listener gửi sau)
    if (resp?.error) {
      console.log('[WSBridge] Sending error result id=' + id + ' err=' + resp.error);
      _wsSend({ action: 'result', id, status: 'failed', error: resp.error });
    } else if (resp?.results?.length > 0) {
      console.log('[WSBridge] Sending direct result id=' + id + ' results=' + resp.results.length);
      _wsSend({ action: 'result', id, status: 'completed', results: resp.results });
    } else {
      console.log('[WSBridge] Skipping empty result id=' + id + ' (waiting for n8n:result callback)');
    }
  } catch (e) {
    _wsSend({ action: 'result', id, status: 'failed', error: e.message });
  }
}

// Lắng nghe kết quả từ sidePanel gửi về
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'n8n:result' && msg.commandId) {
    console.log('[WSBridge] Received n8n:result id=' + msg.commandId + ' status=' + (msg.status || 'completed') + ' results=' + (msg.results?.length || 0));
    _wsSend({
      action: 'result',
      id: msg.commandId,
      status: msg.status || 'completed',
      results: msg.results || [],
      error: msg.error,
    });
  }
});

// Auto-connect khi SW start (defer 3s để tránh log lỗi khi n8n chưa chạy)
setTimeout(_wsConnect, 3000);
