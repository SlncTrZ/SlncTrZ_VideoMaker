/**
 * ModelRegistry — Initiative 1 (Group B)
 *
 * Fetch + cache danh sách AI models từ backend (GET /api/v1/provider-models).
 * Replace 11+ vị trí hardcode `Nano Banana`, `Veo 3.1` rải rác trong extension.
 *
 * Pattern reference: ProviderConfigManager (same caching + SSE invalidate strategy).
 *
 * API response format (verified từ Api/V1/ProviderModelController):
 *   [
 *     {
 *       "id": 1,
 *       "provider": "flow",          // slug, đã flatten từ relationship
 *       "media_type": "image",
 *       "name": "Nano Banana Pro",
 *       "value": "Nano Banana Pro",
 *       "is_default": false,
 *       "is_premium": false,
 *       "required_feature_key": null,
 *       "min_extension_version": null,
 *       "sort_order": 1,
 *       "config": null,
 *       ...
 *     }
 *   ]
 *
 * Defaults inline để extension hoạt động offline / first-install trước khi fetch.
 * Verified từ extension code:
 *   - autoflow-pro/src/workflow/WorkflowEditor.js:11469-11470 (legacy VIDEO_MODELS, IMAGE_MODELS)
 *   - autoflow-pro/src/settings/StorageSettings.js:76-77 (defaultImageModel, defaultVideoModel)
 */
class ModelRegistry {
  static _CACHE_KEY = 'toby_provider_models';
  static _CACHE_TTL_MS = 60 * 60 * 1000; // 1h
  static _cache = null;
  static _fetchPromise = null;

  /**
   * Hard-coded defaults — offline fallback.
   * Cấu trúc: { [providerSlug]: { [mediaType]: [models] } }
   * Mỗi model: { name, value, is_default?, is_premium?, sort_order? }
   */
  static _DEFAULTS = {
    flow: {
      image: [
        { name: 'Nano Banana Pro', value: 'Nano Banana Pro', is_default: false, is_premium: false, sort_order: 1 },
        { name: 'Nano Banana 2',   value: 'Nano Banana 2',   is_default: true,  is_premium: false, sort_order: 2 },
      ],
      video: [
        { name: 'Veo 3.1 - Fast',    value: 'Veo 3.1 - Fast',    is_default: true,  is_premium: false, sort_order: 1 },
        { name: 'Veo 3.1 - Lite',    value: 'Veo 3.1 - Lite',    is_default: false, is_premium: false, sort_order: 2 },
        { name: 'Veo 3.1 - Quality', value: 'Veo 3.1 - Quality', is_default: false, is_premium: true,  sort_order: 3 },
      ],
    },
  };

  // ───────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Get list models cho 1 provider + media_type.
   * @returns {Array<{name, value, is_default, is_premium, ...}>}
   */
  static async getModels(providerSlug, mediaType) {
    const all = await this.fetch();
    const filtered = (all || []).filter(m => m.provider === providerSlug && m.media_type === mediaType);
    if (filtered.length > 0) return filtered;
    // Fallback defaults
    return this._DEFAULTS[providerSlug]?.[mediaType] || [];
  }

  /**
   * SYNC version — return từ cache nếu có, fallback defaults nếu chưa fetch.
   * Dùng cho hot path (render dropdown) không thể await.
   */
  static getModelsSync(providerSlug, mediaType) {
    if (this._cache?.data) {
      const filtered = this._cache.data.filter(m => m.provider === providerSlug && m.media_type === mediaType);
      if (filtered.length > 0) return filtered;
    }
    return this._DEFAULTS[providerSlug]?.[mediaType] || [];
  }

  /**
   * Get default model name cho 1 provider + media_type.
   * Trả về string `name` (vd: "Nano Banana 2") — match format hardcoded hiện tại.
   * @returns {string|null}
   */
  static getDefault(providerSlug, mediaType) {
    const models = this.getModelsSync(providerSlug, mediaType);
    const def = models.find(m => m.is_default) || models[0];
    return def?.name || null;
  }

  /**
   * Async version — await fetch nếu chưa cache.
   */
  static async getDefaultAsync(providerSlug, mediaType) {
    const models = await this.getModels(providerSlug, mediaType);
    const def = models.find(m => m.is_default) || models[0];
    return def?.name || null;
  }

  /**
   * Get list values only (cho compatibility với existing arrays như IMAGE_MODELS).
   * @returns {string[]}
   */
  static getValuesList(providerSlug, mediaType) {
    return this.getModelsSync(providerSlug, mediaType).map(m => m.name);
  }

  // ───────────────────────────────────────────────────────────────────────
  // FETCH + CACHE
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Fetch từ API với cache. Promise deduplication (multiple awaiters share 1 fetch).
   */
  static async fetch() {
    if (this._cache && Date.now() < this._cache.expiresAt) {
      return this._cache.data;
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
      // Try load disk cache first (warm start)
      const cached = await this._readCache();
      if (cached && Date.now() < cached.expiresAt) {
        this._cache = cached;
        // Fix (2026-05-14): Emit event để UI re-render với cached server data
        if (window.eventBus) {
          window.eventBus.emit('provider:models_updated', { source: 'disk_cache' });
        }
        return cached.data;
      }

      const baseUrl = await this._getApiBaseUrl();
      const headers = { Accept: 'application/json' };

      // Optional: X-Ext-Version để backend filter min_extension_version
      try {
        const manifestVersion = chrome?.runtime?.getManifest?.()?.version;
        if (manifestVersion) headers['X-Ext-Version'] = manifestVersion;
      } catch (_) { /* ignore — context không có chrome.runtime */ }

      // Optional: Bearer token để backend filter feature gate (premium models)
      try {
        const token = window.authManager?.token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (_) { /* ignore */ }

      const resp = await fetch(`${baseUrl}/api/v1/provider-models`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      if (json.success && Array.isArray(json.data)) {
        const cacheData = {
          data: json.data,
          expiresAt: Date.now() + this._CACHE_TTL_MS,
          fetchedAt: Date.now(),
        };
        this._cache = cacheData;
        await this._writeCache(cacheData);

        // Fix (2026-05-14): Emit event để UI re-render với server data sau initial fetch
        if (window.eventBus) {
          window.eventBus.emit('provider:models_updated', { source: 'initial_fetch' });
        }
        return json.data;
      }

      throw new Error('Invalid response shape');
    } catch (e) {
      console.warn('[ModelRegistry] Fetch failed, using cache/defaults:', e.message);

      // Fallback: stale cache nếu có
      const staleCache = await this._readCache();
      if (staleCache?.data) {
        this._cache = { ...staleCache, expiresAt: Date.now() + 5 * 60 * 1000 };
        return staleCache.data;
      }

      // Last resort: flatten defaults thành array để match API shape
      return this._flattenDefaults();
    }
  }

  /** Flatten _DEFAULTS dict → array shape match API response */
  static _flattenDefaults() {
    const flat = [];
    for (const [providerSlug, modes] of Object.entries(this._DEFAULTS)) {
      for (const [mediaType, models] of Object.entries(modes)) {
        for (const m of models) {
          flat.push({ ...m, provider: providerSlug, media_type: mediaType });
        }
      }
    }
    return flat;
  }

  /** Force refresh cache */
  static async refresh() {
    this._cache = null;
    await this._clearCache();
    return this.fetch();
  }

  /** Background fetch (fire-and-forget) */
  static fetchInBackground() {
    this.fetch().catch(() => {});
  }

  // ───────────────────────────────────────────────────────────────────────
  // SSE invalidation (Initiative 1)
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Handle SSE 'provider_models_updated' event.
   * Force refetch + emit eventBus để UI re-render dropdown.
   *
   * Bug fix (2026-05-14): Emit event SAU KHI fetch xong để getModelsSync() có data mới.
   * Trước đây emit ngay → GenTab gọi getModelsSync() → cache rỗng → trả về _DEFAULTS.
   */
  static async handleSseUpdate(data) {
    console.log('[ModelRegistry] SSE provider_models_updated:', data);
    // Clear cache → next getModels() sẽ trigger fetch
    this._cache = null;
    this._clearCache().catch(() => {});

    // Await fetch xong mới emit event để UI có data mới khi re-render
    try {
      await this.fetch();
    } catch (err) {
      console.warn('[ModelRegistry] SSE fetch failed, UI sẽ fallback _DEFAULTS:', err.message);
    }

    if (window.eventBus) {
      window.eventBus.emit('provider:models_updated', data);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Storage helpers (chrome.storage.local với localStorage fallback)
  // ───────────────────────────────────────────────────────────────────────

  static async _readCache() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([this._CACHE_KEY], res => {
          resolve(res[this._CACHE_KEY] || null);
        });
      } else {
        try {
          const cached = localStorage.getItem(this._CACHE_KEY);
          resolve(cached ? JSON.parse(cached) : null);
        } catch {
          resolve(null);
        }
      }
    });
  }

  static async _writeCache(data) {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [this._CACHE_KEY]: data }, resolve);
      } else {
        try {
          localStorage.setItem(this._CACHE_KEY, JSON.stringify(data));
        } catch { /* quota? noop */ }
        resolve();
      }
    });
  }

  static async _clearCache() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.remove([this._CACHE_KEY], resolve);
      } else {
        try {
          localStorage.removeItem(this._CACHE_KEY);
        } catch { /* noop */ }
        resolve();
      }
    });
  }

  static async _getApiBaseUrl() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['af_api_url'], res => {
          resolve(res.af_api_url || 'https://labs.toby.vn');
        });
      } else {
        resolve('https://labs.toby.vn');
      }
    });
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ModelRegistry = ModelRegistry;
  // Warm up cache trên load (fire-and-forget, không block)
  setTimeout(() => ModelRegistry.fetchInBackground(), 100);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModelRegistry;
}
