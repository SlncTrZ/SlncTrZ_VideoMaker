/**
 * GrokAdapter - Provider adapter cho Grok (grok.com / x.ai).
 *
 * Phụ thuộc:
 * - window.GrokSession (G-2): ensureReady, setMode, setRatio, setQuantity,
 *   setVideoDuration, setVideoResolution.
 * - window.MessageBridge (G-3.3): grokSubmitAndWait, grokFetchImage,
 *   grokBridgeToFlow. Adapter này CHỈ reference theo tên — không tự
 *   implement bridge logic.
 *
 * Đặc điểm:
 * - 5 ratios: portrait (2:3), landscape (3:2), square (1:1),
 *   story (9:16), widescreen (16:9). Default 'widescreen' (16:9).
 * - Hỗ trợ video mode (duration 6s/10s, resolution 480p/720p).
 * - KHÔNG hỗ trợ quantity (Grok UI Toby Flow mode không có quantity selector).
 * - supportsHumanized=false vì Grok submit qua KeyboardEvent Enter,
 *   không cần humanized typing.
 * - Cross-provider bridge (grok -> generate workflow) defer Phase G-6.
 */
class GrokAdapter extends AIProviderAdapter {
  constructor() {
    super();
    this.key = 'grok';
    this.displayName = 'Grok';
    this.featureKey = 'grok_enabled';
    this.executionAction = 'grok_run';

    // Phase J: Hardcoded fallbacks — PCM override via getter
    this._fallbackRatios = [
      { ui_name: 'story',      value: '9:16' },
      { ui_name: 'portrait',   value: '2:3'  },
      { ui_name: 'square',     value: '1:1'  },
      { ui_name: 'landscape',  value: '3:2'  },
      { ui_name: 'widescreen', value: '16:9' },
    ];
    this._defaultCapabilities = {
      supportsRatio: true,
      supportsQuantity: false,
      supportsVideo: true,
      supportsRefImage: true,
      supportsAutoDownload: true,
      supportsHumanized: false,
      supportsImageMode: true,
      maxRefImages: 4,
      supportedDurations: ['6s', '10s'],
      supportedResolutions: ['480p', '720p'],
      supportedImageQualities: ['speed', 'quality'],
    };
  }

  /**
   * Helper: Get ratios từ PCM, fallback inline.
   * @param {string} mode - 'image' | 'video'
   */
  _getRatios(mode = 'image') {
    const fromPcm = window.ProviderConfigManager?.getRatiosSync?.('grok', mode);
    if (Array.isArray(fromPcm) && fromPcm.length > 0) return fromPcm;
    return this._fallbackRatios;
  }

  /**
   * Phase J: Capabilities getter — merge PCM server data với hardcoded fallback.
   */
  get capabilities() {
    const pcm = typeof ProviderConfigManager !== 'undefined' ? ProviderConfigManager : null;
    const supports = pcm?.getSupportsSync?.('grok') || {};
    const maxRef = pcm?.getMaxRefImagesSync?.('grok', 'image') ?? this._defaultCapabilities.maxRefImages;
    const ratioUiMap = pcm?.getRatioUiMapSync?.('grok');
    const durations = pcm?.getSupportedDurationsSync?.('grok');
    const resolutions = pcm?.getSupportedResolutionsSync?.('grok');
    const imageQualities = pcm?.getSupportedImageQualitiesSync?.('grok');
    const ratios = this._getRatios('image');

    return {
      supportsRatio: supports.ratio ?? this._defaultCapabilities.supportsRatio,
      supportsQuantity: supports.quantity ?? this._defaultCapabilities.supportsQuantity,
      supportsVideo: supports.video ?? this._defaultCapabilities.supportsVideo,
      supportsRefImage: supports.ref_image ?? this._defaultCapabilities.supportsRefImage,
      supportsAutoDownload: supports.auto_download ?? this._defaultCapabilities.supportsAutoDownload,
      supportsHumanized: supports.humanized ?? this._defaultCapabilities.supportsHumanized,
      supportsImageMode: supports.image_mode ?? this._defaultCapabilities.supportsImageMode,
      maxRefImages: maxRef,
      supportedRatios: ratios.map(r => r.ui_name),
      ratioUiMap: ratioUiMap && Object.keys(ratioUiMap).length > 0
        ? ratioUiMap
        : ratios.reduce((acc, r) => { acc[r.ui_name] = r.value; return acc; }, {}),
      supportedDurations: durations?.length > 0 ? durations : this._defaultCapabilities.supportedDurations,
      supportedResolutions: resolutions?.length > 0 ? resolutions : this._defaultCapabilities.supportedResolutions,
      supportedImageQualities: imageQualities?.length > 0 ? imageQualities : this._defaultCapabilities.supportedImageQualities,
    };
  }

  /**
   * Kiểm tra session Grok sẵn sàng (tab mở, đăng nhập, editor ready).
   * Delegate sang GrokSession.ensureReady().
   */
  async ensureReady() {
    if (!window.GrokSession) {
      return { ready: false, error: 'GROKSESSION_NOT_LOADED' };
    }
    try {
      return await window.GrokSession.ensureReady({ createIfMissing: true, activate: true });
    } catch (e) {
      return { ready: false, error: e?.message || 'SESSION_ERROR' };
    }
  }

  /**
   * Submit prompt tới Grok.
   *
   * Params:
   *   { prompt, refFileIds, settings: { mode, ratio, duration, resolution, imageQuality, timeout }, taskName }
   *
   * Steps:
   *   1. ensureReady() — đảm bảo tab + session OK.
   *   2. Apply settings sequential (mode → ratio → image_quality hoặc duration/resolution).
   *      Grok không hỗ trợ batch settings như ChatGPT.
   *   3. Resolve ref images sang base64 (cap maxRefImages=4).
   *   4. Gọi MessageBridge.grokSubmitAndWait — đợi media sinh xong.
   *   5. Trả { success, mediaUrls, mediaType, postId, url, error?, message? }.
   *
   * Cross-provider (grok -> generate workflow): caller tự gọi
   * MessageBridge.grokBridgeToFlow sau khi nhận mediaUrls. Adapter
   * không tự bridge để giữ separation of concerns.
   */
  async submit(params = {}) {
    let ready = await this.ensureReady();
    if (!ready || !ready.ready) {
      return { success: false, error: ready?.error || 'NOT_READY' };
    }

    let tabId = ready.tabId || window.GrokSession?.getTabInfo?.()?.tabId;
    if (!tabId) {
      return { success: false, error: 'NO_TAB' };
    }

    const settings = params.settings || {};
    const mode = settings.mode || 'image';
    const ratio = this._normalizeRatio(settings.ratio);
    const duration = settings.duration || '6s';
    const resolution = settings.resolution || '720p';
    // Image quality (Grok update 2026-04): 'speed' (nhanh) | 'quality' (chậm).
    // Default 'speed' để gen nhanh hơn. Chỉ áp dụng khi mode=image.
    const imageQuality = String(settings.imageQuality || 'speed').toLowerCase();
    // Hardcode dài làm safety net — actual timeout monitor qua progress indicator
    // ("Generating XX%") trong chat-content-grok.js. Heartbeat 90s ngắt sớm khi stuck.
    // Video render Grok có thể mất 3-5 phút bình thường → 600s safety budget.
    const timeout = settings.timeout || (mode === 'video'
      ? (window.SystemConfig?.getTimeout('video_timeout_ms') || 600000)
      : (window.SystemConfig?.getTimeout('image_timeout_ms') || 300000));

    // Helper: detect content script disconnection error → force re-inject
    // Reference Chrome MV3: chat-content-grok.js inject qua chrome.scripting.executeScript
    // → khi tab navigate (page reload), content script bị destroy.
    // Cache `_ready=true` của GrokSession có thể stale → first call to setMode/setRatio fails với
    // "Could not establish connection. Receiving end does not exist." → cần force re-inject + retry.
    const isDisconnectError = (errMsg) => {
      const m = String(errMsg || '').toLowerCase();
      return m.includes('receiving end does not exist') ||
             m.includes('could not establish connection') ||
             m.includes('message port closed');
    };
    const reinjectIfNeeded = async () => {
      console.warn('[GrokAdapter] Content script disconnect detected → force re-inject');
      // Invalidate GrokSession cache + force ensureReady to re-inject
      if (window.GrokSession) {
        window.GrokSession._ready = false;
        window.GrokSession._lastCheck = 0;
      }
      ready = await this.ensureReady();
      if (!ready?.ready) {
        return false;
      }
      tabId = ready.tabId || window.GrokSession?.getTabInfo?.()?.tabId;
      return !!tabId;
    };

    // Apply settings sequential — Grok thao tác trên radiogroup/dropdown
    // riêng biệt, không có batch settings panel như ChatGPT.
    if (mode) {
      try {
        let modeResp = await window.GrokSession.setMode(mode);
        // Retry once nếu lỗi disconnect (script chưa inject hoặc lost sau navigate)
        if (!modeResp?.success && isDisconnectError(modeResp?.error)) {
          const reinjected = await reinjectIfNeeded();
          if (reinjected) {
            modeResp = await window.GrokSession.setMode(mode);
          }
        }
        if (!modeResp?.success) {
          console.warn('[GrokAdapter] setMode fail:', modeResp?.error);
          return { success: false, error: 'SET_MODE_FAILED' };
        }
      } catch (e) {
        console.warn('[GrokAdapter] setMode exception:', e?.message || e);
      }
    }
    if (ratio) {
      try {
        await window.GrokSession.setRatio(ratio);
      } catch (e) {
        console.warn('[GrokAdapter] setRatio exception:', e?.message || e);
      }
    }
    // Grok KHÔNG có quantity selector trong Toby Flow mode → bỏ qua quantity entirely.
    // Image quality (Speed/Quality) — chỉ có ở mode=image.
    if (mode === 'image' && imageQuality) {
      try {
        await window.GrokSession.setImageQuality(imageQuality);
      } catch (e) {
        console.warn('[GrokAdapter] setImageQuality exception:', e?.message || e);
      }
    }
    if (mode === 'video') {
      if (duration) {
        try { await window.GrokSession.setVideoDuration(duration); }
        catch (e) { console.warn('[GrokAdapter] setVideoDuration exception:', e?.message || e); }
      }
      if (resolution) {
        try { await window.GrokSession.setVideoResolution(resolution); }
        catch (e) { console.warn('[GrokAdapter] setVideoResolution exception:', e?.message || e); }
      }
    }

    // Resolve ref images (cap maxRefImages=4).
    const refImagesResolved = await this._resolveRefImages(params.refFileIds || []);
    console.log('[GrokAdapter] refImages resolved:', refImagesResolved.length, '/ tabId:', tabId);

    // Submit qua MessageBridge.grokSubmitAndWait (G-3.3).
    if (!window.MessageBridge || typeof window.MessageBridge.grokSubmitAndWait !== 'function') {
      console.error('[GrokAdapter] MessageBridge.grokSubmitAndWait KHÔNG TỒN TẠI');
      return { success: false, error: 'BRIDGE_NOT_LOADED' };
    }

    console.log('[GrokAdapter] Bắt đầu grokSubmitAndWait, mode:', mode, 'prompt len:', (params.prompt || '').length);
    // inputTimeoutMs: user setting điều khiển tốc độ thao tác content script.
    // Default 1200ms (giống Flow). Content script tự áp dụng 70% ratio cho Grok.
    const inputTimeoutMs = window.storageSettings?.getSettings()?.inputTimeout || 1200;
    const result = await window.MessageBridge.grokSubmitAndWait({
      text: params.prompt || '',
      images: refImagesResolved,
      settings: { mode, ratio, duration, resolution, imageQuality, timeout },
      inputTimeoutMs,
      timeout,
      tabId,
      taskName: params.taskName || null,
    });

    // Track grok_prompt_total (success) hoặc grok_fail (failure)
    try {
      if (window.EditorExecutor?._incrementDailyStat) {
        if (result?.success) {
          window.EditorExecutor._incrementDailyStat('grok_prompt_total');
        } else {
          window.EditorExecutor._incrementDailyStat('grok_fail');
        }
      }
    } catch (_) { /* noop */ }

    // CRITICAL: chèn tabId vào result để caller (GenTab._submitViaGrok auto-download flow)
    // có thể fetch CDN qua MessageBridge.grokFetchImage(url, tabId).
    // handleSubmitAndWait response KHÔNG kèm tabId → autoDownload skip vì `result.tabId` undefined.
    return { ...(result || { success: false, error: 'NO_RESPONSE' }), tabId };
  }

  /**
   * Normalize ratio input → key chuẩn (story/portrait/square/landscape/widescreen).
   * Accept VN ('Dọc', 'Vuông', 'Ngang'), EN, numeric ('9:16', '3:4', '1:1', '4:3', '16:9').
   * Default: 'widescreen' (16:9 — phổ biến nhất với Grok).
   */
  _normalizeRatio(input) {
    if (!input) return 'widescreen';
    const s = String(input).trim().toLowerCase();
    const map = {
      // 9:16 (story / dọc cao)
      '9:16': 'story',
      'dọc': 'story',
      'doc': 'story',
      'story': 'story',
      // 3:4 / 2:3 (portrait)
      '3:4': 'portrait',
      '2:3': 'portrait',
      'portrait': 'portrait',
      // 1:1 (square)
      '1:1': 'square',
      'vuông': 'square',
      'vuong': 'square',
      'square': 'square',
      // 4:3 / 3:2 (landscape)
      '4:3': 'landscape',
      '3:2': 'landscape',
      'landscape': 'landscape',
      // 16:9 (widescreen / ngang rộng)
      '16:9': 'widescreen',
      'ngang': 'widescreen',
      'widescreen': 'widescreen',
    };
    return map[s] || 'widescreen';
  }

  /**
   * Resolve ref tile IDs → base64 objects { base64, name, type }.
   * Cap maxRefImages=4. Pre-resolved object array → pass through.
   *
   * Phase này CHỈ support pre-resolved object array. Tile ID resolution
   * (qua TileResolver / fetchBlob) sẽ làm ở Phase G-6.
   */
  async _resolveRefImages(refIds) {
    const max = this.capabilities.maxRefImages;
    if (!Array.isArray(refIds) || refIds.length === 0) return [];

    // Pre-resolved object array (đã có base64) — pass through, cap với max.
    if (typeof refIds[0] === 'object' && refIds[0] !== null && refIds[0].base64) {
      return refIds.slice(0, max).filter((x) => x?.base64);
    }

    // Tile IDs (string array) — chưa hỗ trợ ở phase này (defer G-6).
    console.warn(
      '[GrokAdapter] _resolveRefImages: bỏ qua', refIds.length,
      'tile ID(s) — chưa wire resolution sang base64 (defer G-6).'
    );
    return [];
  }

  /**
   * Upload reference cho Grok.
   * Reuse ImmediateUploader (Flow infra) — Grok refs upload tới Flow trước
   * để cross-provider compat (giống ChatGPT pattern).
   */
  async uploadRef(file, thumbnail, options) {
    if (typeof window.ImmediateUploader?.upload === 'function') {
      return window.ImmediateUploader.upload(file, thumbnail, options);
    }
    throw new Error('IMMEDIATE_UPLOADER_NOT_LOADED');
  }

  /**
   * Kiểm tra user có quyền dùng Grok provider không (qua FeatureGate).
   * Override base class để dùng đúng featureKey.
   */
  isEnabled() {
    if (!window.featureGate) return true;
    try {
      return !!window.featureGate.canUse(this.featureKey);
    } catch (e) {
      console.warn('[GrokAdapter] isEnabled error:', e?.message || e);
      return false;
    }
  }
}

window.GrokAdapter = GrokAdapter;
