/**
 * I18n - Internationalization System
 * Supports: vi (Vietnamese - default), en (English), th (Thai), ja (Japanese)
 */
class I18n {
  static _translations = {};
  static _currentLocale = 'vi';
  static _fallbackLocale = 'vi';
  static _initialized = false;

  static SUPPORTED_LOCALES = [
    { code: 'vi', name: 'Tiếng Việt', flag: 'VI' },
    { code: 'en', name: 'English', flag: 'EN' },
    { code: 'th', name: 'ไทย', flag: 'TH' },
    { code: 'ja', name: '日本語', flag: 'JA' }
  ];

  /**
   * Initialize i18n system
   */
  static async init(defaultLocale = null) {
    if (this._initialized) return;

    // Priority chain (post-audit fix 2026-05-17):
    //   1. defaultLocale param (caller override)
    //   2. af_locale storage (explicit user choice qua modal)
    //   3. af_settings.language storage (synced từ admin default trước đó)
    //   4. Fetch /api/v1/default-settings trực tiếp (fresh install — chưa có storage)
    //   5. 'vi' hardcoded fallback (backend down)
    const savedLocale = await this._getSavedLocale();

    let serverDefaultLocale = null;
    if (!defaultLocale && !savedLocale) {
      // Fresh install: fetch admin default locale TRƯỚC khi render initial UI.
      // Bug fix: trước đây phải đợi StorageSettings.init() (async) finish → UI flash 'vi'
      // rồi mới switch 'en'. Giờ I18n init đợi server response → render 'en' từ đầu.
      serverDefaultLocale = await this._fetchServerDefaultLocale();
    }

    this._currentLocale = defaultLocale || savedLocale || serverDefaultLocale || 'vi';

    // Persist locale vào storage NGAY sau lần init đầu — đảm bảo modal load active
    // và I18n._currentLocale luôn sync, không phụ thuộc default fallback ở 2 nơi khác nhau.
    if (!savedLocale) {
      this._persistLocale(this._currentLocale);
    }

    await this._loadTranslations();
    this._initialized = true;
    console.log('[I18n] Initialized with locale:', this._currentLocale, '(source:',
      defaultLocale ? 'param' : savedLocale ? 'storage' : serverDefaultLocale ? 'server' : 'fallback', ')');
  }

  /**
   * Post-audit fix: fetch admin default locale từ /api/v1/default-settings.
   * Timeout 2s để không block UI nếu backend slow.
   */
  static async _fetchServerDefaultLocale() {
    try {
      const baseUrl = (typeof window !== 'undefined' && window.authManager?.apiBaseUrl)
        || 'https://labs.toby.vn/api/v1';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const resp = await fetch(`${baseUrl}/default-settings`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!resp.ok) return null;
      const json = await resp.json();
      const lang = json?.data?.language;
      if (lang && this.SUPPORTED_LOCALES.some(l => l.code === lang)) {
        return lang;
      }
      return null;
    } catch (e) {
      console.warn('[I18n] Server default locale fetch failed:', e.message);
      return null;
    }
  }

  static _persistLocale(locale) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ af_locale: locale });
      } else {
        localStorage.setItem('af_locale', locale);
      }
    } catch (e) { /* ignore */ }
  }

  static async _getSavedLocale() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        // Post-audit fix: đọc cả 2 keys với priority:
        //   1. af_locale  — explicit user choice (modal language picker)
        //   2. af_settings.language — admin default (synced từ /api/v1/default-settings)
        //   3. null → caller fallback hardcoded 'vi'
        // Trước fix: chỉ đọc af_locale → anonymous user thấy 'vi' dù admin set default_language='en'.
        chrome.storage.local.get(['af_locale', 'af_settings'], result => {
          const explicit = result.af_locale;
          const fromSettings = result.af_settings?.language;
          resolve(explicit || fromSettings || null);
        });
      } else {
        const explicit = localStorage.getItem('af_locale');
        let fromSettings = null;
        try {
          const raw = localStorage.getItem('af_settings');
          if (raw) fromSettings = JSON.parse(raw).language;
        } catch (_) { /* ignore */ }
        resolve(explicit || fromSettings || null);
      }
    });
  }

  static _detectBrowserLocale() {
    const browserLang = navigator.language?.split('-')[0] || 'vi';
    const supported = this.SUPPORTED_LOCALES.map(l => l.code);
    return supported.includes(browserLang) ? browserLang : 'vi';
  }

  static async _loadTranslations() {
    // Step 1: Load inline fallback (offline + first install)
    if (window.I18N_VI) this._translations['vi'] = window.I18N_VI;
    if (window.I18N_EN) this._translations['en'] = window.I18N_EN;
    if (window.I18N_TH) this._translations['th'] = window.I18N_TH;
    if (window.I18N_JA) this._translations['ja'] = window.I18N_JA;

    // Step 2: (Group E) Apply cached server translations từ chrome.storage NẾU CÓ
    // — synchronous-ish read để có data ngay khi UI render lần đầu.
    try {
      const cached = await this._readStorageCache(this._currentLocale);
      if (cached?.data) {
        this._mergeTranslations(this._currentLocale, cached.data);
      }
    } catch (_) { /* ignore — fallback inline */ }

    // Step 3: (Group E) Background fetch server cho current locale (non-blocking).
    // Khi fetch xong → emit 'i18n:reloaded' → UI tự re-apply translations.
    this._fetchServerTranslations(this._currentLocale).catch(e =>
      console.warn('[I18n] Background fetch failed:', e.message)
    );
  }

  /**
   * (Group E) Fetch translations từ server cho 1 locale.
   * Merge vào in-memory `_translations` + cache vào chrome.storage.
   */
  static async _fetchServerTranslations(locale) {
    try {
      const baseUrl = window.authManager?.apiBaseUrl || '';
      const resp = await fetch(`${baseUrl}/i18n/${locale}`, { cache: 'no-store' });
      if (!resp.ok) return;
      const json = await resp.json();
      if (!json.success || !json.data) return;

      this._mergeTranslations(locale, json.data);
      await this._writeStorageCache(locale, {
        version: json.version,
        data: json.data,
        fetchedAt: Date.now(),
      });

      if (window.eventBus) {
        window.eventBus.emit('i18n:reloaded', { locale });
      }
      console.log(`[I18n] Server translations loaded for ${locale} (version: ${json.version})`);
    } catch (e) {
      console.warn(`[I18n] _fetchServerTranslations(${locale}) failed:`, e.message);
    }
  }

  /**
   * (Group E) Merge flat key→value map vào nested _translations[locale].
   * VD: { "workflow.title": "Workflow" } → this._translations[locale].workflow.title = "Workflow"
   */
  static _mergeTranslations(locale, flatKeyValueMap) {
    if (!this._translations[locale]) this._translations[locale] = {};
    for (const [key, value] of Object.entries(flatKeyValueMap)) {
      this._setNestedValue(this._translations[locale], key, value);
    }
  }

  /** Set nested object value bằng dot-notation key */
  static _setNestedValue(obj, key, value) {
    const parts = key.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  // (Group E) chrome.storage cache helpers
  static async _readStorageCache(locale) {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        resolve(null);
        return;
      }
      chrome.storage.local.get([`toby_i18n_${locale}`], res => {
        resolve(res[`toby_i18n_${locale}`] || null);
      });
    });
  }

  static async _writeStorageCache(locale, payload) {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [`toby_i18n_${locale}`]: payload }, resolve);
    });
  }

  static getLocale() {
    return this._currentLocale;
  }

  static getSupportedLocales() {
    return this.SUPPORTED_LOCALES;
  }

  static async setLocale(locale, emitEvent = true) {
    if (!this.SUPPORTED_LOCALES.some(l => l.code === locale)) {
      console.warn('[I18n] Unsupported locale:', locale);
      return;
    }

    this._currentLocale = locale;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ af_locale: locale });
    } else {
      localStorage.setItem('af_locale', locale);
    }

    console.log('[I18n] Locale changed to:', locale);

    if (emitEvent && window.eventBus) {
      window.eventBus.emit('i18n:changed', { locale });
    }
  }

  static t(key, params = {}) {
    let translation = this._getNestedValue(this._translations[this._currentLocale], key);

    if (translation === undefined && this._currentLocale !== this._fallbackLocale) {
      translation = this._getNestedValue(this._translations[this._fallbackLocale], key);
    }

    if (translation === undefined) {
      return key;
    }

    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
      });
    }

    return translation;
  }

  static _getNestedValue(obj, key) {
    if (!obj || !key) return undefined;
    return key.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  static scopedT(scope) {
    return (key, params) => this.t(`${scope}.${key}`, params);
  }

  static applyTranslations(container = document) {
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const paramsStr = el.getAttribute('data-i18n-params');
      let params = {};
      if (paramsStr) { try { params = JSON.parse(paramsStr); } catch(e) { params = {}; } }
      el.textContent = this.t(key, params);
    });

    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });

    container.querySelectorAll('[data-i18n-title]').forEach(el => {
      const text = this.t(el.getAttribute('data-i18n-title'));
      // Tab menu: skip tooltip — text label đã hiển thị inline, KHÔNG cần tooltip thêm
      const isTabButton = el.hasAttribute('data-tab') || el.classList.contains('tobyflow-tab');
      if (!isTabButton) {
        el.setAttribute('data-tooltip', text);
      } else {
        // Vẫn xóa data-tooltip nếu set trước đó (idempotent khi i18n re-apply)
        if (el.hasAttribute('data-tooltip')) el.removeAttribute('data-tooltip');
      }
      if (!el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', text);
      }
      // Xóa native title (đã set bởi static HTML) để tránh duplicate tooltip
      if (el.hasAttribute('title')) el.removeAttribute('title');
    });

    container.querySelectorAll('[data-i18n-value]').forEach(el => {
      el.value = this.t(el.getAttribute('data-i18n-value'));
    });

    container.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
    });

    container.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const paramsStr = el.getAttribute('data-i18n-params');
      let params2 = {};
      if (paramsStr) { try { params2 = JSON.parse(paramsStr); } catch(e) { params2 = {}; } }
      el.innerHTML = this.t(key, params2);
    });

    container.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
      el.setAttribute('data-tooltip', this.t(el.getAttribute('data-i18n-tooltip')));
    });
  }

  static formatDate(date, options = {}) {
    const d = date instanceof Date ? date : new Date(date);
    const localeMap = { vi: 'vi-VN', en: 'en-US', th: 'th-TH', ja: 'ja-JP' };
    const locale = localeMap[this._currentLocale] || 'vi-VN';
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(d);
  }

  static formatNumber(number, options = {}) {
    const localeMap = { vi: 'vi-VN', en: 'en-US', th: 'th-TH', ja: 'ja-JP' };
    return new Intl.NumberFormat(localeMap[this._currentLocale] || 'vi-VN', options).format(number);
  }

  static formatCurrency(amount, currency = null) {
    const localeMap = { vi: 'vi-VN', en: 'en-US', th: 'th-TH', ja: 'ja-JP' };
    const currencyMap = { vi: 'VND', en: 'USD', th: 'THB', ja: 'JPY' };
    const locale = localeMap[this._currentLocale] || 'vi-VN';
    const curr = currency || currencyMap[this._currentLocale] || 'VND';
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency: curr,
      minimumFractionDigits: curr === 'VND' || curr === 'JPY' ? 0 : 2
    }).format(amount);
  }

  static getCurrentLocaleInfo() {
    return this.SUPPORTED_LOCALES.find(l => l.code === this._currentLocale) || this.SUPPORTED_LOCALES[0];
  }

  /**
   * Initiative 3 (Group B prep): Invalidate cached translations cho 1 locale.
   * Clear in-memory + storage cache → next loadTranslations() sẽ re-fetch từ server.
   *
   * Group E (i18n dynamic loading) sẽ implement server fetch trong _loadTranslations.
   * Tạm thời (Group B): method này chỉ clear cache; behavior thực tế phụ thuộc loader version.
   *
   * @param {string} locale — 'vi' | 'en' | 'th' | 'ja' (hoặc null để clear all)
   */
  static invalidate(locale = null) {
    if (locale) {
      delete this._translations[locale];
      // Clear storage cache key (sẽ dùng khi Group E implement dynamic load)
      try {
        chrome.storage?.local?.remove([`toby_i18n_${locale}`]);
      } catch (_) { /* ignore */ }
      console.log(`[I18n] Invalidated locale: ${locale}`);
    } else {
      this._translations = {};
      try {
        chrome.storage?.local?.get(null, items => {
          const keysToRemove = Object.keys(items || {}).filter(k => k.startsWith('toby_i18n_'));
          if (keysToRemove.length > 0) chrome.storage.local.remove(keysToRemove);
        });
      } catch (_) { /* ignore */ }
      console.log('[I18n] Invalidated all locales');
    }
  }

  /**
   * Initiative 3 (Group B prep): Force reload translations.
   * Re-run _loadTranslations() + emit 'i18n:reloaded' để UI re-render.
   *
   * Group E sẽ extend _loadTranslations để fetch từ /api/v1/i18n/{locale}.
   * Tạm thời (Group B): chỉ re-assign từ window.I18N_VI/EN/... inline data.
   */
  static async reload() {
    await this._loadTranslations();
    if (window.eventBus) {
      window.eventBus.emit('i18n:reloaded', { locale: this._currentLocale });
    }
    console.log('[I18n] Reloaded translations for locale:', this._currentLocale);
  }
}

window.I18n = I18n;
