/**
 * SystemConfig - Fetch and cache public system settings from backend
 * Phase SS-6.1: Extension integration for System Settings
 */
class SystemConfig {
  static _cache = null;
  static _cacheTime = 0;
  static _cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Phase L: Centralized timeout defaults — Tier 3 fallback.
   * Pattern giống ProviderConfigManager._DEFAULT_RATIOS.
   * MUST match backend SystemSettingSeeder group='timeouts' exactly.
   * CI drift check: data/scripts/check_settings_drift.js
   */
  static _TIMEOUT_DEFAULTS = {
    // SSE/Broadcast constants
    sse_max_retries: 15,
    sse_max_delay_ms: 30000,
    sse_heartbeat_timeout_ms: 45000,
    sse_stable_threshold_ms: 10000,
    broadcast_heartbeat_ms: 5000,
    broadcast_leader_timeout_ms: 10000,
    broadcast_election_delay_ms: 2000,
    // API/Execution timeouts
    api_timeout_ms: 60000,
    video_timeout_ms: 600000,
    image_timeout_ms: 300000,
    chatgpt_timeout_ms: 300000,
    tile_completion_timeout_ms: 60000,
    // Cache/Resource limits
    media_registry_max_size: 500,
    thumbnail_cache_max_size: 200,
    history_max_records: 100,
  };

  /**
   * Fetch settings from backend (with cache)
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Settings object
   */
  static async fetch(forceRefresh = false) {
    if (!window.authManager?.apiBaseUrl) return;
    if (!forceRefresh && this._cache && Date.now() - this._cacheTime < this._cacheTTL) {
      return this._cache;
    }

    try {
      const apiBaseUrl = window.authManager?.apiBaseUrl || '';
      const resp = await fetch(`${apiBaseUrl}/system-settings/public`);
      if (!resp.ok) throw new Error('Failed to fetch system settings');

      const data = await resp.json();
      if (data.success) {
        this._cache = data.data;
        this._cacheTime = Date.now();
        this._persistToStorage(this._cache);
        return this._cache;
      }
      throw new Error(data.error?.message || 'Unknown error');
    } catch (err) {
      console.warn('[SystemConfig] Fetch failed:', err.message);
      // Set cache to defaults when fetch fails so getBool/get work correctly
      this._cache = this.getDefaults();
      this._cacheTime = Date.now();
      return this._cache;
    }
  }

  /**
   * Get default settings (fallback when API fails)
   * @returns {Object} Default settings
   */
  static getDefaults() {
    return {
      google_enabled: false,
      email_verification_required: true,
      share_require_email_verified: true,
      show_upgrade_ui: true,
      show_tip_coffee: true,
      maintenance_mode: false,
      maintenance_message: '',
      app_name: 'SlncTrZ VM',
      app_logo_url: '',
      support_email: '',
      support_telegram: '',
      terms_url: '/terms',
      privacy_url: '/privacy',
      upgrade_contact_url: '',
      zalo_contact_url: '',
      telegram_contact_url: '',
      facebook_contact_url: '',
      // Phase L: Include timeout defaults
      ...this._TIMEOUT_DEFAULTS,
    };
  }

  /**
   * Handle SSE system_settings_changed event.
   * Updates cache and re-applies UI immediately.
   * @param {Object} data - Settings payload from SSE
   */
  static handleSseUpdate(data) {
    if (!data || typeof data !== 'object') return;
    this._cache = data;
    this._cacheTime = Date.now();
    this._persistToStorage(this._cache);
    this.applyToUI();
    console.log('[SystemConfig] Updated via SSE, maintenance_mode:', this.getBool('maintenance_mode'));
  }

  /**
   * Get a specific setting value
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Setting value
   */
  static get(key, defaultValue = null) {
    return this._cache?.[key] ?? defaultValue;
  }

  /**
   * Get a boolean setting value (handles '0', '1', true, false)
   * @param {string} key - Setting key
   * @returns {boolean} Boolean value
   */
  static getBool(key) {
    const val = this._cache?.[key];
    return val === true || val === '1' || val === 1;
  }

  /**
   * Get an integer setting value (Initiative 4 — validation rules).
   * Handles: number, numeric string ('5000'), null/undefined → defaultValue.
   * @param {string} key
   * @param {number} defaultValue
   * @returns {number}
   */
  static getInt(key, defaultValue = 0) {
    const val = this._cache?.[key];
    if (val === undefined || val === null || val === '') return defaultValue;
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get a list setting value (Initiative 4 — validation rules).
   * Handles: array, comma-separated string ('a,b,c'), null → defaultValue.
   * Empty strings sau split bị filter ra.
   * @param {string} key
   * @param {string[]} defaultValue
   * @returns {string[]}
   */
  static getList(key, defaultValue = []) {
    const val = this._cache?.[key];
    if (val === undefined || val === null || val === '') return defaultValue;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return defaultValue;
  }

  /**
   * Get a JSON-parsed setting value (Initiative 4).
   * Handles: object (already parsed), JSON string → parse, null → defaultValue.
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  static getJSON(key, defaultValue = null) {
    const val = this._cache?.[key];
    if (val === undefined || val === null || val === '') return defaultValue;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return defaultValue; }
    }
    return defaultValue;
  }

  /**
   * Phase L: Get timeout value with 3-tier fallback.
   * Tier 1: Server cache (_cache from /system-settings/public)
   * Tier 2: chrome.storage.local (via restoreFromStorage)
   * Tier 3: _TIMEOUT_DEFAULTS constant
   *
   * Usage: SystemConfig.getTimeout('api_timeout_ms') // 60000
   * No default parameter needed — _TIMEOUT_DEFAULTS provides safe fallback.
   *
   * @param {string} key - Timeout key (e.g., 'api_timeout_ms')
   * @returns {number} Timeout value in ms (or count for limits)
   */
  static getTimeout(key) {
    // Tier 1: Server cache (fetched from backend)
    const serverVal = this._cache?.[key];
    if (serverVal !== undefined && serverVal !== null && serverVal !== '') {
      const parsed = parseInt(serverVal, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    // Tier 3: Hardcoded defaults (Tier 2 storage handled by restoreFromStorage)
    return this._TIMEOUT_DEFAULTS[key] ?? 0;
  }

  /**
   * Debug helper: log all timeout values with source info.
   * Run in console: SystemConfig.debugTimeouts()
   */
  static debugTimeouts() {
    console.group('[SystemConfig] Timeout Values Debug');
    console.log('Cache loaded:', !!this._cache);
    const keys = Object.keys(this._TIMEOUT_DEFAULTS);
    keys.forEach(key => {
      const serverVal = this._cache?.[key];
      const finalVal = this.getTimeout(key);
      const defaultVal = this._TIMEOUT_DEFAULTS[key];
      const source = (serverVal !== undefined && serverVal !== null && serverVal !== '')
        ? 'SERVER' : 'DEFAULT';
      console.log(`  ${key}: ${finalVal} (${source})`, serverVal !== undefined ? `[server: ${serverVal}]` : '');
    });
    console.groupEnd();
    return { cache: this._cache, defaults: this._TIMEOUT_DEFAULTS };
  }

  /**
   * Clear the cache (force next fetch to refresh)
   */
  static clearCache() {
    this._cache = null;
    this._cacheTime = 0;
  }

  /**
   * Persist settings to chrome.storage.local for cross-window access (settings popup)
   * @private
   */
  static _persistToStorage(data) {
    try {
      chrome.storage?.local?.set({ af_system_settings: data });
    } catch (_) { /* ignore */ }
  }

  /**
   * Restore settings from chrome.storage.local (for popup windows)
   * This is sync-first: immediately populate cache from storage before any API call
   * @returns {Promise<Object>} Settings object
   */
  static async restoreFromStorage() {
    return new Promise((resolve) => {
      try {
        chrome.storage?.local?.get(['af_system_settings'], (res) => {
          if (res?.af_system_settings) {
            this._cache = res.af_system_settings;
            this._cacheTime = Date.now() - (this._cacheTTL - 60000); // Consider slightly stale
          }
          resolve(this._cache || this.getDefaults());
        });
      } catch (_) {
        resolve(this.getDefaults());
      }
    });
  }

  /**
   * Apply system settings to UI elements
   * Should be called after fetch() completes
   */
  static applyToUI() {
    // SS-6.2: Hide upgrade prompts if disabled
    if (!this.getBool('show_upgrade_ui')) {
      document.body.classList.add('hide-upgrade-ui');
    } else {
      document.body.classList.remove('hide-upgrade-ui');
    }

    // SS-6.3: Hide tip coffee if disabled
    const tipCoffeeBtn = document.getElementById('tipCoffeeBtn');
    const showTipCoffee = this.getBool('show_tip_coffee');
    console.log('[SystemConfig] show_tip_coffee:', showTipCoffee, 'cache:', this._cache?.show_tip_coffee);
    if (tipCoffeeBtn) {
      tipCoffeeBtn.style.display = showTipCoffee ? '' : 'none';
    }

    // SS-6.4: Hide Google buttons if disabled
    const googleEnabled = this.getBool('google_enabled');
    document.querySelectorAll('[data-requires-google]').forEach(el => {
      el.style.display = googleEnabled ? '' : 'none';
    });
    // Also hide dividers before Google buttons if Google is disabled
    if (!googleEnabled) {
      const googleLoginBtn = document.getElementById('googleLoginBtn');
      const googleRegisterBtn = document.getElementById('googleRegisterBtn');
      [googleLoginBtn, googleRegisterBtn].forEach(btn => {
        if (btn) {
          const prevDivider = btn.previousElementSibling;
          if (prevDivider?.classList?.contains('login-divider')) {
            prevDivider.style.display = 'none';
          }
        }
      });
    }

    // SS-6.5: Show maintenance overlay if enabled
    this._applyMaintenanceMode();

    // SS-6.6: Update app name in header
    const appName = this.get('app_name');
    if (appName) {
      const headerTitles = document.querySelectorAll('.slnctrz-header-title');
      headerTitles.forEach(el => { el.textContent = appName; });
      const headerLogos = document.querySelectorAll('.slnctrz-header-logo img');
      headerLogos.forEach(el => { el.alt = appName; });
    }

    // SS-6.7: Update app logo in header (sidebar + workflow brand zone + settings about)
    const logoUrl = this.get('app_logo_url');
    if (logoUrl) {
      const headerLogos = document.querySelectorAll('.slnctrz-header-logo img, .slnctrz-header-logo-img');
      headerLogos.forEach(el => {
        el.dataset.fallbackSrc = el.src;
        el.src = logoUrl;
        el.onerror = function() {
          if (this.dataset.fallbackSrc) {
            this.src = this.dataset.fallbackSrc;
          }
        };
      });
    }
  }

  /**
   * Apply maintenance mode overlay
   * @private
   */
  static _applyMaintenanceMode() {
    const isMaintenanceMode = this.getBool('maintenance_mode');
    let overlay = document.getElementById('slnctrz-maintenance-overlay');

    if (isMaintenanceMode) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'slnctrz-maintenance-overlay';
        overlay.className = 'maintenance-overlay';
        overlay.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4"></path>
            <path d="m4.93 4.93 2.83 2.83"></path>
            <path d="M2 12h4"></path>
            <path d="m4.93 19.07 2.83-2.83"></path>
            <path d="M12 18v4"></path>
            <path d="m19.07 19.07-2.83-2.83"></path>
            <path d="M18 12h4"></path>
            <path d="m19.07 4.93-2.83 2.83"></path>
            <circle cx="12" cy="12" r="4"></circle>
          </svg>
          <h2>${window.I18n?.t('msg.maintenanceTitle') || 'Bảo trì hệ thống'}</h2>
          <p>${this.get('maintenance_message', window.I18n?.t('msg.maintenanceDefault') || 'Hệ thống đang được bảo trì. Vui lòng quay lại sau.')}</p>
        `;
        document.body.appendChild(overlay);
      } else {
        // Update message if already exists
        const msgEl = overlay.querySelector('p');
        if (msgEl) {
          msgEl.textContent = this.get('maintenance_message', window.I18n?.t('msg.maintenanceDefault') || 'Hệ thống đang được bảo trì. Vui lòng quay lại sau.');
        }
        overlay.style.display = '';
      }
    } else if (overlay) {
      overlay.style.display = 'none';
    }
  }
}

// Export to global scope
window.SystemConfig = SystemConfig;
