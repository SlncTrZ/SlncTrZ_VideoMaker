/**
 * ValidationRules — Initiative 4 (Group B)
 *
 * Fetch + cache global validation rules từ backend.
 * Endpoint: GET /api/v1/validation-rules → flat { key: value } map.
 *
 * Pattern reference: SystemConfig.js (cache 5m, getters typed, SSE invalidate).
 *
 * Backend `SystemSetting group='validation'` (verified rev6 — 4 keys):
 *   - prompt_max_length (int, 5000)
 *   - quantity_min (int, 1)
 *   - quantity_max (int, 4)
 *   - workflow_max_run_duration_sec (int, 3600)
 *
 * Provider-specific (ratios per mode) → ProviderConfigManager.getRatios().
 * KHÔNG nằm ở ValidationRules vì rev6 architecture decision.
 */
class ValidationRules {
  static _cache = null;
  static _cacheTime = 0;
  static _cacheTTL = 5 * 60 * 1000; // 5 phút (giảm tải)
  static _fetchPromise = null;

  /**
   * Defaults inline — offline fallback.
   * Source of truth: backend SystemSettingSeeder group='validation'.
   */
  static _DEFAULTS = {
    prompt_max_length: 5000,
    quantity_min: 1,
    quantity_max: 4,
    workflow_max_run_duration_sec: 3600,
  };

  // ───────────────────────────────────────────────────────────────────────
  // FETCH
  // ───────────────────────────────────────────────────────────────────────

  static async fetch(forceRefresh = false) {
    if (!forceRefresh && this._cache && Date.now() - this._cacheTime < this._cacheTTL) {
      return this._cache;
    }
    if (this._fetchPromise) return this._fetchPromise;

    this._fetchPromise = this._doFetch();
    try {
      return await this._fetchPromise;
    } finally {
      this._fetchPromise = null;
    }
  }

  static async _doFetch() {
    try {
      const apiBaseUrl = window.authManager?.apiBaseUrl || 'https://labs.toby.vn/api/v1';
      const resp = await fetch(`${apiBaseUrl}/validation-rules`, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json.success && json.data) {
        this._cache = json.data;
        this._cacheTime = Date.now();
        this._persistToStorage(this._cache);
        return this._cache;
      }
      throw new Error('Invalid response shape');
    } catch (e) {
      console.warn('[ValidationRules] Fetch failed, using defaults:', e.message);
      // Fallback defaults
      this._cache = { ...this._DEFAULTS };
      this._cacheTime = Date.now();
      return this._cache;
    }
  }

  /** Force refresh cache */
  static clearCache() {
    this._cache = null;
    this._cacheTime = 0;
  }

  /** Background fetch (fire-and-forget) */
  static fetchInBackground() {
    this.fetch().catch(() => {});
  }

  // ───────────────────────────────────────────────────────────────────────
  // GETTERS (sync — caller phải đảm bảo cache đã warm qua fetch())
  // ───────────────────────────────────────────────────────────────────────

  static get(key, defaultValue = null) {
    return this._cache?.[key] ?? this._DEFAULTS[key] ?? defaultValue;
  }

  static getInt(key, defaultValue = 0) {
    const val = this._cache?.[key] ?? this._DEFAULTS[key];
    if (val === undefined || val === null || val === '') return defaultValue;
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  static getList(key, defaultValue = []) {
    const val = this._cache?.[key] ?? this._DEFAULTS[key];
    if (val === undefined || val === null || val === '') return defaultValue;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return defaultValue;
  }

  // ───────────────────────────────────────────────────────────────────────
  // SSE invalidation (Initiative 4)
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Bug fix (2026-05-14): Emit event SAU KHI fetch xong để getSync() có data mới.
   * Cùng pattern với ModelRegistry.handleSseUpdate.
   */
  static async handleSseUpdate(data) {
    console.log('[ValidationRules] SSE validation_rules_updated:', data);
    this.clearCache();

    // Await fetch xong mới emit event để UI có data mới khi re-render
    try {
      await this.fetch();
    } catch (err) {
      console.warn('[ValidationRules] SSE fetch failed, UI sẽ fallback _DEFAULTS:', err.message);
    }

    if (window.eventBus) {
      window.eventBus.emit('validation_rules:updated', data);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Storage helpers
  // ───────────────────────────────────────────────────────────────────────

  static _persistToStorage(data) {
    try {
      chrome.storage?.local?.set({ af_validation_rules: data });
    } catch { /* ignore */ }
  }

  static async hydrateFromStorage() {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.get(['af_validation_rules'], res => {
        if (res.af_validation_rules) {
          this._cache = res.af_validation_rules;
          this._cacheTime = Date.now();
        }
        resolve();
      });
    });
  }
}

// Export + warm-up
if (typeof window !== 'undefined') {
  window.ValidationRules = ValidationRules;
  // Hydrate cache từ storage trước, sau đó background fetch
  ValidationRules.hydrateFromStorage().then(() => {
    setTimeout(() => ValidationRules.fetchInBackground(), 200);
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationRules;
}
