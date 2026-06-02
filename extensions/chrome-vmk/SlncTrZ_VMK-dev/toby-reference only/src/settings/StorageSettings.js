/**
 * StorageSettings - Apply settings on page load + sync to API server
 * Settings UI is in a separate window (settings.html)
 * This module loads, applies, and syncs settings
 *
 * Sync strategy:
 * - Load: local first → merge with server (server wins on conflict)
 * - Save: local immediately → debounce 2s → PUT /settings to server
 * - Login: fetch server settings → merge → apply
 */
class StorageSettings {
  constructor() {
    this.defaults = {
      // Workflow
      execDelayNodes: 3,      // giây - delay giữa các workflow nodes
      execMaxRetries: 2,      // lần - số lần thử lại khi lỗi
      execTimeout: 180,       // giây - timeout chờ kết quả (workflow node + tiles)
      execOnError: 'continue',
      // Chung
      inputTimeout: 1200,     // ms - tốc độ thao tác trên Flow (các delay khác tính tỷ lệ từ đây)
      delayBetweenPrompts: 5, // giây - nghỉ giữa các prompt (Gen, Task, Workflow List)
      // Chống ban (parallelThreads đã xóa - dùng queueBatchSize trong Pipeline Queue)
      randomDelayMin: 3,      // giây - nghỉ random min giữa các đợt
      randomDelayMax: 10,     // giây - nghỉ random max giữa các đợt
      // Pipeline Queue
      queueEnabled: false,    // bật/tắt pipeline queue
      queueBatchSize: 4,      // số prompt mỗi batch
      queueMaxMonitor: 4,     // số tile theo dõi đồng thời (FAR-3: default 4 vì Flow's hard cap = 5 in-flight cho mọi plan; user Premium có thể bump qua Settings UI)
      queueRestMin: 5,        // giây - nghỉ min giữa các batch
      queueRestMax: 15,       // giây - nghỉ max giữa các batch
      autoReloadEnabled: false, // bật/tắt auto-reload Flow page
      autoReloadThreshold: 30,  // số prompt trước khi reload
      // Phase FAR — Flow auto-retry (silent session refresh + auto recovery + rate-limit cooldown + exponential backoff)
      flowSessionRefreshEnabled: false,       // bool — bật silent session refresh định kỳ (default OFF vì gây reload mất ảnh khi edit workflow)
      flowSessionRefreshIntervalMin: 120,     // int 5-120 — phút giữa 2 lần refresh
      flowAutoRecoveryEnabled: true,          // bool — auto recovery khi consecutive fail (pipeline: forceReloadAndStabilize, legacy: silent refresh)
      flowConsecutiveFailThreshold: 2,        // int 1-5 — số fail liên tiếp trigger recovery
      flowBackoffBaseSec: 30,                 // int 10-120 — base delay cho exponential backoff
      flowBackoffMaxSec: 300,                 // int 60-900 — max cap cho backoff
      flowBackoffJitterPercent: 20,           // int 0-50 — jitter ±% tránh thundering herd
      autoDownload: false,
      downloadFolder: 'tobyflow_output',
      fileNameProject: '',
      fileNameTemplate: '[Date]_[Project]_[Prompt]_[Index]',
      downloadResolution: '1k',
      videoDownloadResolution: '720p',
      theme: 'dark',
      language: 'vi',
      notifyOnComplete: true,
      notifySound: false,
      notifyTelegram: false,
      telegramAutoDownload: true,
      telegramDownloadFolder: 'tobyflow_bot',
      telegramDownloadResolution: '1k',       // resolution ảnh cho Telegram download
      telegramVideoDownloadResolution: '720p', // resolution video cho Telegram download
      // PHASE 3: Multi-provider Telegram settings
      telegramDefaultProvider: 'flow',        // 'flow' | 'chatgpt' | 'grok' — provider mặc định cho Telegram
      // Flow provider settings
      telegramFlowRatio: '16:9',              // tỷ lệ khung hình cho Flow
      telegramFlowModel: 'Nano Banana 2',     // model Flow: 'Nano Banana Pro' | 'Nano Banana 2' (khớp FLOW_IMAGE_MODELS backend)
      // ChatGPT provider settings
      telegramChatgptRatio: 'square',         // 'square' | 'landscape' | 'widescreen' | 'portrait' | 'story'
      // Grok provider settings
      telegramGrokMode: 'image',              // 'image' | 'video' — chế độ mặc định
      telegramGrokRatio: 'widescreen',        // 'widescreen' | 'landscape' | 'square' | 'portrait' | 'story'
      telegramGrokDuration: '6s',             // thời lượng video: '6s' | '10s'
      telegramGrokResolution: '720p',         // độ phân giải video: '480p' | '720p'
      telegramGrokImageQuality: 'speed',      // chất lượng ảnh: 'speed' | 'quality'
      blobMaxAgeDays: 7,      // ngày - thời gian lưu blob ảnh album (local/capture)
      humanizedMode: false,
      humanizedSpeed: 0.5,
      defaultGenType: 'Image',
      defaultRatio: '9:16',                   // numeric format khớp gen_tab; mapping VN→numeric vẫn còn cho user cũ đã save 'Dọc'
      defaultImageRatio: '16:9',              // numeric — đồng bộ với Settings popup
      defaultVideoRatio: '16:9',              // numeric
      defaultImageModel: 'Nano Banana 2',
      defaultVideoModel: 'Veo 3.1 - Fast',
      // CG-5.3 Part B: ChatGPT Provider defaults
      defaultProvider: 'flow',                       // 'flow' | 'chatgpt' | 'grok' — provider mặc định khi mở GenTab
      chatgptDefaultRatio: 'story',                  // 'story' | 'portrait' | 'square' | 'landscape' | 'widescreen'
      chatgptFallbackPrefix: 'Generate an image of: ', // Prefix prepend khi image mode fail
      chatgptAutoClose: false,                       // Tự đóng tab ChatGPT sau khi generate xong
      // G-4.8: Grok Provider defaults
      grokDefaultMode: 'image',                      // 'image' | 'video'
      grokDefaultRatio: 'widescreen',                // 'story'|'portrait'|'square'|'landscape'|'widescreen'
      grokDefaultDuration: '6s',                     // '6s' | '10s' (chỉ video)
      grokDefaultResolution: '720p',                 // '480p' | '720p' (chỉ video)
      grokDefaultImageQuality: 'speed',              // 'speed' | 'quality' (chỉ image, Grok update 2026-04)
      grokAutoClose: false                           // Tự đóng tab Grok sau khi generate xong
    };

    this.settings = { ...this.defaults };
    this._syncTimer = null;
    this._syncing = false;
    this._fetchingFromServer = false;  // Flag to skip sync when fetching from server
    this.init();
  }

  async init() {
    // Initiative 6: Load server defaults TRƯỚC để anonymous users nhận admin-tweaked defaults.
    // Endpoint /api/v1/default-settings public, không cần auth.
    await this._loadServerDefaults();
    await this.loadAndApply();
    this._listenForChanges();
    this._listenForAuthEvents();
  }

  /**
   * Initiative 6: Fetch admin defaults từ /api/v1/default-settings.
   * Merge vào this.defaults (hardcoded inline làm offline fallback).
   *
   * Hoạt động cho cả anonymous + logged-in users (endpoint public).
   * Khi admin update qua /admin/default-settings → SSE 'default_settings_updated' invalidate.
   */
  async _loadServerDefaults() {
    try {
      const baseUrl = window.authManager?.apiBaseUrl || 'https://labs.toby.vn/api/v1';
      const resp = await fetch(`${baseUrl}/default-settings`, { cache: 'no-store' });
      if (!resp.ok) {
        console.warn('[StorageSettings] Server defaults fetch HTTP', resp.status);
        return;
      }
      const json = await resp.json();
      if (json.success && json.data && typeof json.data === 'object') {
        // Server defaults override hardcoded — server là source of truth khi available.
        const prevLanguage = this.defaults.language;
        this.defaults = { ...this.defaults, ...json.data };
        console.log('[StorageSettings] Loaded server defaults (Initiative 6)');

        // Post-audit fix #1: persist server defaults vào af_settings storage nếu fresh install.
        // Đảm bảo I18n._getSavedLocale đọc af_settings.language ở lần init kế tiếp (reload).
        // Trước fix: anonymous user xóa+reinstall vẫn 'vi' vì af_settings trống → fallback hardcoded.
        chrome.storage?.local?.get(['af_settings'], (res) => {
          const existing = res.af_settings;
          const isFreshInstall = !existing || Object.keys(existing).length === 0;
          if (isFreshInstall) {
            chrome.storage.local.set({ af_settings: this.defaults }, () => {
              console.log('[StorageSettings] Persisted server defaults to af_settings (fresh install)');
            });
          }
        });

        // Post-audit fix #2: nếu language đổi (admin set 'en' lần đầu, anonymous user chưa
        // explicit chọn) → trigger I18n reload với locale mới NGAY trong session hiện tại.
        const newLanguage = json.data.language;
        if (newLanguage && newLanguage !== prevLanguage && window.I18n?.setLocale) {
          // Chỉ override nếu user CHƯA explicit chọn locale (af_locale chưa có).
          chrome.storage?.local?.get(['af_locale'], (res) => {
            if (!res.af_locale) {
              console.log(`[StorageSettings] Anonymous user: applying admin default_language=${newLanguage}`);
              window.I18n.setLocale(newLanguage);
            }
          });
        }
      }
    } catch (e) {
      // Silent fail — hardcoded defaults vẫn hoạt động đầy đủ.
      console.warn('[StorageSettings] Server defaults fetch failed:', e.message);
    }
  }

  /**
   * Load settings: local → merge server (if logged in)
   */
  async loadAndApply() {
    try {
      // 1. Load local settings
      const localSettings = await new Promise(resolve => {
        chrome.storage.local.get(['af_settings'], res => resolve(res.af_settings || {}));
      });

      this.settings = { ...this.defaults, ...localSettings };

      // 2. If logged in, fetch server settings and merge
      // Local wins on conflict - tránh server cũ overwrite local mới khi sync fail trước đó
      if (window.authManager?.isLoggedIn()) {
        try {
          this._fetchingFromServer = true;  // Prevent sync back to server
          const serverData = await this._fetchServerSettings();
          if (serverData?.settings_json) {
            // Local wins: server chỉ fill những field local chưa có
            this.settings = { ...this.defaults, ...serverData.settings_json, ...this.settings };
            // Save merged settings back to local
            await this._saveLocal(this.settings);
          }
        } catch (err) {
          console.warn('[StorageSettings] Server sync failed, using local:', err.message);
        } finally {
          setTimeout(() => { this._fetchingFromServer = false; }, 500);
        }
      }

      // 3. Apply settings
      this.applyTheme(this.settings.theme);
      this.syncExecutorSettings(this.settings);

      console.log('[StorageSettings] Settings applied');
    } catch (error) {
      console.error('[StorageSettings] Load failed:', error);
    }
  }

  getSettings() {
    return this.settings;
  }

  /**
   * Lắng nghe thay đổi settings từ settings window
   */
  _listenForChanges() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes.af_settings) return;

      const newSettings = changes.af_settings.newValue || {};
      this.settings = { ...this.defaults, ...newSettings };

      // Apply immediately
      this.applyTheme(this.settings.theme);
      this.syncExecutorSettings(this.settings);

      // Debounce sync to server
      this._debounceSyncToServer();
    });
  }

  /**
   * Lắng nghe auth events: login → fetch & merge, logout → stop sync
   */
  _listenForAuthEvents() {
    if (!window.eventBus) return;

    window.eventBus.on('auth:login', async () => {
      try {
        this._fetchingFromServer = true;  // Prevent sync back to server
        const serverData = await this._fetchServerSettings();
        if (serverData?.settings_json) {
          // Server wins: server settings override local (user's settings from their account)
          this.settings = { ...this.defaults, ...this.settings, ...serverData.settings_json };
          await this._saveLocal(this.settings);
          this.applyTheme(this.settings.theme);
          this.syncExecutorSettings(this.settings);
          console.log('[StorageSettings] Applied server settings after login (server wins)');
        } else {
          // Server chưa có settings → push defaults lên
          this.settings = { ...this.defaults };
          await this._saveLocal(this.settings);
          await this._pushToServer(this.settings);
          console.log('[StorageSettings] Pushed default settings to server (new user)');
        }
      } catch (err) {
        console.warn('[StorageSettings] Post-login sync failed:', err.message);
      } finally {
        // Delay reset flag to avoid race with onChanged listener
        setTimeout(() => { this._fetchingFromServer = false; }, 500);
      }
    });
  }

  /**
   * Debounce sync to server (2s delay)
   */
  _debounceSyncToServer() {
    if (!window.authManager?.isLoggedIn()) return;
    // Skip sync if we just fetched from server (avoid sync loop)
    if (this._fetchingFromServer) return;

    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this._pushToServer(this.settings);
    }, 2000);
  }

  /**
   * Fetch settings từ server
   */
  async _fetchServerSettings() {
    if (!window.authManager?.isLoggedIn()) return null;

    const response = await window.authManager._apiCall('GET', 'settings');
    return response?.data || response;
  }

  /**
   * Push settings lên server
   */
  async _pushToServer(settings) {
    if (!window.authManager?.isLoggedIn() || this._syncing) return;

    this._syncing = true;
    try {
      await window.authManager._apiCall('PUT', 'settings', {
        settings_json: settings
      });
      console.log('[StorageSettings] Synced to server');
    } catch (err) {
      // Verbose log: kèm validation errors detail để debug 422 (field nào reject)
      const detail = err.errors || err.data?.errors || err.response?.data?.errors || null;
      console.warn('[StorageSettings] Push to server failed:', err.message,
        detail ? { errors: detail } : '(no validation detail)');
    } finally {
      this._syncing = false;
    }
  }

  /**
   * Save settings to chrome.storage.local
   */
  async _saveLocal(settings) {
    return new Promise(resolve => {
      chrome.storage.local.set({ af_settings: settings }, resolve);
    });
  }

  syncExecutorSettings(settings) {
    if (window.workflowExecutor) {
      window.workflowExecutor.settings = {
        delayBetweenNodes: (settings.execDelayNodes || 3) * 1000,
        retryOnFail: (settings.execMaxRetries || 0) > 0,
        maxRetries: settings.execMaxRetries ?? 2,
        retryDelay: (settings.delayBetweenPrompts || 5) * 1000,
        tileTimeout: (settings.execTimeout || 180) * 1000,
        timeout: (settings.execTimeout || 180) * 1000,
        stopOnError: settings.execOnError === 'stop'
      };
    }
  }

  applyTheme(theme) {
    const root = document.getElementById('flow-auto-sidebar-root');
    if (!root) return;

    root.classList.remove('theme-light', 'theme-dark');

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.add('theme-dark');
    }
  }

}

// Auto-init cho popup windows (workflow-editor, angles-editor)
// sidebar.html sẽ ghi đè trong app.js nếu cần
if (!window.storageSettings) {
  window.storageSettings = new StorageSettings();
}

// Export
window.StorageSettings = StorageSettings;
