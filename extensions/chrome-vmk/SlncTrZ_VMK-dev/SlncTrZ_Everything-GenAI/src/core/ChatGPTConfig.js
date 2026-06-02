/**
 * ChatGPTConfig — Fetch + cache admin-tunable ChatGPT config từ backend.
 *
 * Endpoint: GET /api/v1/system-config/chatgpt (public, anonymous OK).
 * Trả về 4 patterns (pipe-separated) để content script detect lỗi:
 *   - rate_limit_error_text
 *   - content_blocked_text
 *   - image_gen_failed_text
 *   - network_error_text
 *
 * Cache: chrome.storage.local.af_chatgpt_config, TTL 1 giờ.
 * Content script `chat-content-chatgpt.js` đọc từ storage này runtime
 * (fallback hardcoded patterns nếu storage rỗng).
 *
 * Refresh:
 *   - On extension boot (stale-while-revalidate: serve cache, refresh background)
 *   - Manual: ChatGPTConfig.refresh()
 */
class ChatGPTConfig {
  static _CACHE_KEY = 'af_chatgpt_config';
  static _CACHE_TTL_MS = 60 * 60 * 1000; // 1h
  static _fetchPromise = null;            // dedup concurrent fetches

  /**
   * Đọc config từ cache hoặc fetch mới nếu hết hạn / chưa có.
   * @returns {Promise<Object|null>} { rate_limit_error_text, content_blocked_text, ... }
   */
  static async fetch() {
    const cached = await this._readCache();
    const fresh = cached && (Date.now() - (cached.fetched_at || 0) < this._CACHE_TTL_MS);
    if (fresh) return cached.data;

    // Refresh từ server (dedup concurrent calls)
    if (this._fetchPromise) return this._fetchPromise;
    this._fetchPromise = this._doFetch().finally(() => { this._fetchPromise = null; });
    const fetched = await this._fetchPromise;
    // Nếu fetch fail nhưng có cache cũ → trả cache stale (better than nothing)
    return fetched || cached?.data || null;
  }

  /** Force refresh từ server, bỏ qua cache. */
  static async refresh() {
    if (this._fetchPromise) return this._fetchPromise;
    this._fetchPromise = this._doFetch().finally(() => { this._fetchPromise = null; });
    return this._fetchPromise;
  }

  /** Background fetch + write storage (không block caller nếu user mở extension lần đầu). */
  static fetchInBackground() {
    this.fetch().catch((err) => {
      console.warn('[ChatGPTConfig] background fetch failed:', err?.message || err);
    });
  }

  static async _doFetch() {
    // Phase H migration (2026-05-13): fetch error_patterns từ /providers/api-configs
    // thay vì legacy /system-config/chatgpt. Backend đã có ở provider_configs.api_config.
    // Shape identical → drop-in replacement. Legacy endpoint vẫn giữ làm fallback.
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({
          action: 'apiRequest',
          method: 'GET',
          endpoint: 'providers/api-configs',
        }, async (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('[ChatGPTConfig] fetch error:', chrome.runtime.lastError.message);
            this._fallbackLegacy(resolve);
            return;
          }
          const errorPatterns = resp?.data?.chatgpt?.configs?.error_patterns;
          if (resp?.success && errorPatterns && typeof errorPatterns === 'object') {
            await this._writeCache(errorPatterns);
            resolve(errorPatterns);
          } else {
            this._fallbackLegacy(resolve);
          }
        });
      } catch (e) {
        console.warn('[ChatGPTConfig] sendMessage failed:', e?.message);
        resolve(null);
      }
    });
  }

  /** Fallback legacy /system-config/chatgpt endpoint. */
  static _fallbackLegacy(resolve) {
    chrome.runtime.sendMessage({
      action: 'apiRequest',
      method: 'GET',
      endpoint: 'system-config/chatgpt',
    }, async (resp) => {
      if (resp?.success && resp.data) {
        await this._writeCache(resp.data);
        resolve(resp.data);
      } else {
        resolve(null);
      }
    });
  }

  static async _readCache() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([this._CACHE_KEY], (r) => {
          resolve(r?.[this._CACHE_KEY] || null);
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  static async _writeCache(data) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({
          [this._CACHE_KEY]: { data, fetched_at: Date.now() },
        }, resolve);
      } catch (e) {
        resolve();
      }
    });
  }

  static async clearCache() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.remove([this._CACHE_KEY], resolve);
      } catch (e) {
        resolve();
      }
    });
  }
}

window.ChatGPTConfig = ChatGPTConfig;
