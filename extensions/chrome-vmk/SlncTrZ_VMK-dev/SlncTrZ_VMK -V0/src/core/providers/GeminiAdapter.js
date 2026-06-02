/**
 * GeminiAdapter — Provider adapter cho Gemini (gemini.google.com).
 *
 * Phase CG-8 (Prompt Node + Gemini Adapter) — minimal text-only adapter.
 *
 * Phụ thuộc:
 *  - window.GeminiSession (CG-8): ensureReady().
 *  - window.MessageBridge.geminiSubmitAndWait (CG-8) gửi message tới
 *    chat-content-gemini.js với action `gemini:submitAndWait`.
 *
 * Đặc điểm:
 *  - Chỉ hỗ trợ submitText() (text-only). KHÔNG submit image, KHÔNG ratio.
 *  - Dùng cho Prompt node enhance khi user chọn provider = 'gemini'.
 */
class GeminiAdapter extends AIProviderAdapter {
  constructor() {
    super();
    this.key = 'gemini';
    this.displayName = 'Gemini';
    this.featureKey = 'gemini_enabled';
    this.executionAction = 'gemini_run';

    // Phase J: Hardcoded fallbacks — PCM override via getter
    this._defaultCapabilities = {
      supportsRatio: false,
      supportsImageMode: false,
      supportsRefImage: true,
      supportsQuantity: false,
      supportsVideo: false,
      supportsAutoDownload: false,
      supportsHumanized: false,
      maxRefImages: 4,
    };
  }

  /**
   * Phase J: Capabilities getter — merge PCM server data với hardcoded fallback.
   */
  get capabilities() {
    const pcm = typeof ProviderConfigManager !== 'undefined' ? ProviderConfigManager : null;
    const supports = pcm?.getSupportsSync?.('gemini') || {};
    const maxRef = pcm?.getMaxRefImagesSync?.('gemini', 'image') ?? this._defaultCapabilities.maxRefImages;

    return {
      supportsRatio: supports.ratio ?? this._defaultCapabilities.supportsRatio,
      supportsImageMode: supports.image_mode ?? this._defaultCapabilities.supportsImageMode,
      supportsRefImage: supports.ref_image ?? this._defaultCapabilities.supportsRefImage,
      supportsQuantity: supports.quantity ?? this._defaultCapabilities.supportsQuantity,
      supportsVideo: supports.video ?? this._defaultCapabilities.supportsVideo,
      supportsAutoDownload: supports.auto_download ?? this._defaultCapabilities.supportsAutoDownload,
      supportsHumanized: supports.humanized ?? this._defaultCapabilities.supportsHumanized,
      maxRefImages: maxRef,
    };
  }

  async ensureReady() {
    if (!window.GeminiSession) {
      return { ready: false, error: 'SESSION_NOT_LOADED' };
    }
    try {
      return await window.GeminiSession.ensureReady();
    } catch (e) {
      return { ready: false, error: e?.message || 'SESSION_ERROR' };
    }
  }

  /**
   * Submit prompt text-only tới Gemini, đợi text response.
   * Trả { text, turnId } hoặc throw error code.
   */
  async submitText({ prompt, refFileIds = [], timeout = window.SystemConfig?.getTimeout('api_timeout_ms') || 60000 } = {}) {
    const ready = await this.ensureReady();
    if (!ready || !ready.ready) {
      throw new Error(ready?.error || 'GEMINI_NOT_READY');
    }

    if (!window.MessageBridge || typeof window.MessageBridge.geminiSubmitAndWait !== 'function') {
      throw new Error('BRIDGE_NOT_LOADED');
    }

    // Phase CG-8 ext: Cap refs ở maxRefImages.
    // Phase J: capabilities getter đọc từ PCM, fallback hardcoded.
    const maxRefs = this.capabilities.maxRefImages;
    let resolvedRefs = Array.isArray(refFileIds) ? refFileIds : [];
    resolvedRefs = resolvedRefs.filter(x => x && x.base64).slice(0, maxRefs);

    const result = await window.MessageBridge.geminiSubmitAndWait({
      text: prompt,
      images: resolvedRefs,
      timeout,
      tabId: ready.tabId,
    });

    if (!result || !result.success) {
      // Track gemini_fail
      try {
        if (window.EditorExecutor?._incrementDailyStat) {
          window.EditorExecutor._incrementDailyStat('gemini_fail');
        }
      } catch (_) { /* noop */ }
      const code = result?.error || 'GEMINI_TEXT_FAILED';
      const err = new Error(result?.message || code);
      err.code = code;
      throw err;
    }

    // Track gemini_prompt_total — mỗi submitText() success = 1 Gemini prompt
    try {
      if (window.EditorExecutor?._incrementDailyStat) {
        window.EditorExecutor._incrementDailyStat('gemini_prompt_total');
      }
    } catch (_) { /* noop */ }

    return { text: result.text || '', turnId: result.turnId || null };
  }

  // submit() / uploadRef() KHÔNG implement — Gemini adapter chỉ dành cho text enhance.
}

if (typeof window !== 'undefined') {
  window.GeminiAdapter = GeminiAdapter;
}
