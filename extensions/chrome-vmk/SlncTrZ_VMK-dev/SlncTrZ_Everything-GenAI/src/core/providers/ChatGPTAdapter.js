/**
 * ChatGPTAdapter - Provider adapter cho ChatGPT (chat.openai.com / chatgpt.com).
 *
 * Phụ thuộc:
 * - window.ChatGPTSession (CG-2): ensureReady, activateImageMode, setRatio.
 * - window.MessageBridge (CG-3): chatGPTSubmitAndWait, chatGPTFetchImage,
 *   chatGPTBridgeToFlow. Adapter này CHỈ reference theo tên — không tự
 *   implement bridge logic.
 *
 * Đặc điểm:
 * - 5 ratios match 1-1 với Flow (story / portrait / square / landscape /
 *   widescreen).
 * - Mỗi turn 1 ảnh (supportsQuantity = false).
 * - Không persistent file ID — ref images luôn convert sang base64.
 * - Cross-provider bridge (chatgpt -> generate workflow) do caller
 *   thực hiện qua MessageBridge.chatGPTBridgeToFlow; adapter chỉ trả URLs.
 */
class ChatGPTAdapter extends AIProviderAdapter {
  constructor() {
    super();
    this.key = 'chatgpt';
    this.displayName = 'ChatGPT';
    this.featureKey = 'chatgpt_enabled';
    this.executionAction = 'chatgpt_run';

    // Phase J: Hardcoded fallbacks — PCM override via getter
    this._fallbackRatios = [
      { ui_name: 'story',      value: '9:16' },
      { ui_name: 'portrait',   value: '3:4'  },
      { ui_name: 'square',     value: '1:1'  },
      { ui_name: 'landscape',  value: '4:3'  },
      { ui_name: 'widescreen', value: '16:9' },
    ];
    this._defaultCapabilities = {
      supportsRatio: true,
      supportsQuantity: false,
      supportsVideo: false,
      supportsRefImage: true,
      supportsAutoDownload: true,
      supportsHumanized: true,
      supportsImageMode: true,
      maxRefImages: 4,
      ratioAriaLabels: {
        story: 'Story 9:16',
        portrait: 'Portrait 3:4',
        square: 'Square 1:1',
        landscape: 'Landscape 4:3',
        widescreen: 'Widescreen 16:9',
      },
    };
  }

  /**
   * Helper: Get ratios từ PCM, fallback inline.
   */
  _getRatios() {
    const fromPcm = window.ProviderConfigManager?.getRatiosSync?.('chatgpt', 'image');
    if (Array.isArray(fromPcm) && fromPcm.length > 0) return fromPcm;
    return this._fallbackRatios;
  }

  /**
   * Phase J: Capabilities getter — merge PCM server data với hardcoded fallback.
   */
  get capabilities() {
    const pcm = typeof ProviderConfigManager !== 'undefined' ? ProviderConfigManager : null;
    const supports = pcm?.getSupportsSync?.('chatgpt') || {};
    const maxRef = pcm?.getMaxRefImagesSync?.('chatgpt', 'image') ?? this._defaultCapabilities.maxRefImages;
    const ratioUiMap = pcm?.getRatioUiMapSync?.('chatgpt');
    const ratioAriaLabels = pcm?.getRatioAriaLabelsSync?.('chatgpt');
    const ratios = this._getRatios();

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
      ratioAriaLabels: ratioAriaLabels && Object.keys(ratioAriaLabels).length > 0
        ? ratioAriaLabels
        : this._defaultCapabilities.ratioAriaLabels,
    };
  }

  /**
   * Kiểm tra session ChatGPT sẵn sàng (tab mở, đăng nhập, composer ready).
   * Delegate sang ChatGPTSession.ensureReady().
   */
  async ensureReady() {
    if (!window.ChatGPTSession) {
      return { ready: false, error: 'SESSION_NOT_LOADED' };
    }
    try {
      // ChatGPT chỉ cần active tab khi run, không cần focus window
      // focusWindow: false (default) để không gây gián đoạn workflow
      return await window.ChatGPTSession.ensureReady();
    } catch (e) {
      return { ready: false, error: e?.message || 'SESSION_ERROR' };
    }
  }

  /**
   * Normalize ratio từ nhiều định dạng input (UI Flow, alias VN, alias EN)
   * về key chuẩn của ChatGPTAdapter. Match 1-1 với Flow.
   * Default: 'story' (9:16) khi không nhận diện được.
   */
  _normalizeRatio(ratio) {
    if (!ratio) return 'story';
    const map = {
      // 9:16 (portrait tall)
      '9:16': 'story',
      'Dọc': 'story',
      'story': 'story',
      'Story': 'story',
      // 3:4 (portrait standard)
      '3:4': 'portrait',
      'Dọc 3:4': 'portrait',
      'portrait': 'portrait',
      'Portrait': 'portrait',
      // 1:1 (square)
      '1:1': 'square',
      'Vuông': 'square',
      'square': 'square',
      'Square': 'square',
      // 4:3 (landscape standard)
      '4:3': 'landscape',
      'Ngang 4:3': 'landscape',
      'landscape': 'landscape',
      'Landscape': 'landscape',
      // 16:9 (widescreen)
      '16:9': 'widescreen',
      'Ngang': 'widescreen',
      'widescreen': 'widescreen',
      'Widescreen': 'widescreen',
    };
    return map[ratio] || 'story';
  }

  /**
   * Submit prompt tới ChatGPT.
   *
   * Params:
   *   { prompt, refFileIds, settings: { ratio, timeout, ... }, taskName }
   *
   * Steps:
   *   1. ensureReady() — đảm bảo tab + session OK.
   *   2. activateImageMode() + setRatio() qua ChatGPTSession.
   *   3. Resolve ref images sang base64 (tile -> base64 sẽ làm ở CG-7).
   *   4. Lấy fallback prefix khi image mode không activate được.
   *   5. Gọi MessageBridge.chatGPTSubmitAndWait — đợi ảnh sinh xong.
   *   6. Trả { imageUrls, altPrompt, ratioUsed, imageModeUsed, tabId }.
   *
   * Cross-provider (chatgpt -> generate): caller tự gọi
   * MessageBridge.chatGPTBridgeToFlow sau khi nhận imageUrls. Adapter
   * không tự bridge để giữ separation of concerns.
   */
  async submit({ prompt, refFileIds, settings, taskName } = {}) {
    // 1. Đảm bảo session ready.
    const ready = await this.ensureReady();
    if (!ready || !ready.ready) {
      return { success: false, error: ready?.error || 'NOT_READY' };
    }
    const tabId = ready.tabId;

    // 2. Normalize ratio - content script sẽ activate image mode + set ratio SAU new chat.
    // Lý do: Flow submit ChatGPT luôn tạo new chat trước (reset clean state) → activate ở adapter
    // trước khi new chat là vô nghĩa vì sẽ bị reset. Content script đã xử lý việc này.
    const ratio = this._normalizeRatio(settings?.ratio);

    // 3. Resolve ref images -> base64 (chi tiết tile resolution sẽ ở CG-7).
    const images = await this._resolveRefImages(refFileIds);
    console.log('[ChatGPTAdapter] refImages resolved:', images.length, '/ tabId:', tabId);

    // 4. Fallback prefix (chỉ dùng khi imageMode fail trong content script).
    const callerPrefix = settings?.fallbackPrefix;
    const fallbackPrefix = (callerPrefix !== undefined)
      ? callerPrefix
      : await this._getFallbackPrefix();

    // 5. Submit qua MessageBridge.chatGPTSubmitAndWait (CG-3).
    if (!window.MessageBridge || typeof window.MessageBridge.chatGPTSubmitAndWait !== 'function') {
      console.error('[ChatGPTAdapter] MessageBridge.chatGPTSubmitAndWait KHÔNG TỒN TẠI');
      return { success: false, error: 'BRIDGE_NOT_LOADED' };
    }

    console.log('[ChatGPTAdapter] Bắt đầu chatGPTSubmitAndWait, prompt len:', (prompt||'').length);
    // inputTimeoutMs: user setting điều khiển tốc độ thao tác content script.
    // Default 1200ms (giống Flow). Content script tự áp dụng 70% ratio cho ChatGPT.
    const inputTimeoutMs = window.storageSettings?.getSettings()?.inputTimeout || 1200;
    const result = await window.MessageBridge.chatGPTSubmitAndWait({
      text: prompt,
      images,
      settings: {
        imageMode: true, // Luôn request image mode - content script sẽ activate sau new chat
        ratio,
        fallbackPrefix,
      },
      inputTimeoutMs,
      // Timeout link đến setting execTimeout (giây) — giống Google Flow node timeout.
      // Default 180s nếu setting không có. Nhân 1000 để ra ms.
      timeout: settings?.timeout
        || ((window.storageSettings?.getSettings()?.execTimeout || 180) * 1000),
      tabId,
      taskName: taskName || null,
    });

    if (!result || !result.success) {
      // Track chatgpt_fail
      try {
        if (window.EditorExecutor?._incrementDailyStat) {
          window.EditorExecutor._incrementDailyStat('chatgpt_fail');
        }
      } catch (_) { /* noop */ }
      return {
        success: false,
        error: result?.error || 'SUBMIT_FAILED',
        message: result?.message,
      };
    }

    // Track chatgpt_prompt_total — mỗi submit() success = 1 ChatGPT prompt
    try {
      if (window.EditorExecutor?._incrementDailyStat) {
        window.EditorExecutor._incrementDailyStat('chatgpt_prompt_total');
      }
    } catch (_) { /* noop */ }

    // 6. Trả URLs + meta. Caller xử lý bridge qua Flow nếu cần.
    return {
      success: true,
      imageUrls: result.imageUrls || [],
      altPrompt: result.altPrompt,
      ratioUsed: ratio,
      imageModeUsed: result.imageModeUsed ?? true,
      tabId,
    };
  }

  /**
   * Phase CG-8: Submit prompt text-only (Prompt node enhance flow).
   *
   * KHÔNG activate image mode — text-only chat turn. Caller (Prompt node executor)
   * dùng kết quả text để inject vào downstream node (generate/list/angles/...).
   *
   * Flow:
   *   1. ensureReady() bảo đảm tab + login + composer.
   *   2. KHÔNG gọi activateImageMode/setRatio — text mode reset image mode flag để chat turn không bị image-mode "bám" lại.
   *   3. MessageBridge.chatGPTSubmitAndWait với expectText=true, settings.imageMode=false → content script
   *      skip image-mode setup + chuyển sang waitForTextResult.
   *   4. Trả { text, turnId } hoặc throw error (CHATGPT_TEXT_FAILED / RATE_LIMIT / ...).
   */
  async submitText({ prompt, refFileIds = [], timeout = window.SystemConfig?.getTimeout('chatgpt_timeout_ms') || 60000 } = {}) {
    const ready = await this.ensureReady();
    if (!ready || !ready.ready) {
      throw new Error(ready?.error || 'CHATGPT_NOT_READY');
    }
    const tabId = ready.tabId;

    // Reset image mode cache để turn này KHÔNG bị image mode kế thừa từ session trước.
    if (window.ChatGPTSession) {
      window.ChatGPTSession._imageModeActive = false;
    }

    if (!window.MessageBridge || typeof window.MessageBridge.chatGPTSubmitAndWait !== 'function') {
      throw new Error('BRIDGE_NOT_LOADED');
    }

    // Phase CG-8 ext: refFileIds đã được caller resolve thành [{base64, name, type}].
    // Phase J: capabilities getter đọc từ PCM, fallback hardcoded.
    const maxRefs = this.capabilities.maxRefImages;
    let resolvedRefs = Array.isArray(refFileIds) ? refFileIds : [];
    resolvedRefs = resolvedRefs.filter(x => x && x.base64).slice(0, maxRefs);

    const result = await window.MessageBridge.chatGPTSubmitAndWait({
      text: prompt,
      images: resolvedRefs,
      // imageMode=false flag: content script SKIP image mode + setRatio + ratio check.
      settings: { imageMode: false },
      timeout,
      tabId,
      // Hint cho content script chuyển sang waitForTextResult thay vì waitForImageResult.
      expectText: true,
    });

    if (!result || !result.success) {
      // Track chatgpt_fail
      try {
        if (window.EditorExecutor?._incrementDailyStat) {
          window.EditorExecutor._incrementDailyStat('chatgpt_fail');
        }
      } catch (_) { /* noop */ }
      const code = result?.error || 'CHATGPT_TEXT_FAILED';
      const err = new Error(result?.message || code);
      err.code = code;
      throw err;
    }

    // Track chatgpt_prompt_total — mỗi submitText() success = 1 ChatGPT prompt
    try {
      if (window.EditorExecutor?._incrementDailyStat) {
        window.EditorExecutor._incrementDailyStat('chatgpt_prompt_total');
      }
    } catch (_) { /* noop */ }

    return { text: result.text || '', turnId: result.turnId || null };
  }

  /**
   * Upload reference cho ChatGPT.
   * ChatGPT không có persistent file ID -> convert sang base64 + metadata.
   * fileId là khoá local (không lưu server) chỉ dùng để track UI.
   */
  async uploadRef(file) {
    if (!file) {
      throw new Error('FILE_REQUIRED');
    }
    const base64 = await this._fileToBase64(file);
    return {
      fileId: 'chatgpt_ref_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      base64,
      name: file.name,
      type: file.type,
    };
  }

  /**
   * Resolve ref images thành mảng [{base64, name, type}, ...].
   *
   * Input shape có thể là:
   *   - Array of objects {base64, name, type}: dùng luôn (đã pre-resolve).
   *   - Array of tile IDs (string): cần resolve qua TileResolver -> CG-7.
   *   - Comma-separated string: legacy format, parse rồi resolve -> CG-7.
   *   - null / undefined: trả [].
   *
   * Phase này CHỈ support pre-resolved object array. Tile ID resolution
   * (qua TileResolver / TileCache + fetch base64) sẽ làm ở CG-7.
   */
  async _resolveRefImages(refFileIds) {
    if (!refFileIds) return [];
    if (Array.isArray(refFileIds)) {
      if (refFileIds.length === 0) return [];
      // Pre-resolved object array.
      if (typeof refFileIds[0] === 'object' && refFileIds[0] !== null) {
        return refFileIds.filter((x) => x && x.base64);
      }
      // Tile ID array — chưa hỗ trợ ở phase này (sẽ thêm ở CG-7 qua TileResolver).
      console.warn(
        '[ChatGPTAdapter] _resolveRefImages: bỏ qua', refFileIds.length,
        'tile ID(s) — chưa wire resolution sang base64 (defer CG-7).'
      );
      return [];
    }
    // Comma-separated string — chưa hỗ trợ ở phase này.
    if (typeof refFileIds === 'string' && refFileIds.trim()) {
      const count = refFileIds.split(',').filter((s) => s.trim()).length;
      console.warn(
        '[ChatGPTAdapter] _resolveRefImages: bỏ qua', count,
        'tile ID string(s) — chưa wire resolution sang base64 (defer CG-7).'
      );
    }
    return [];
  }

  /**
   * Convert File / Blob sang base64 (không kèm data URL prefix).
   */
  async _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const m = String(result).match(/^data:.+?;base64,(.+)$/);
        resolve(m ? m[1] : '');
      };
      reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Lấy fallback prefix dùng khi không activate được image mode.
   * Priority chain (Option A):
   *   1. window.storageSettings.settings.chatgptFallbackPrefix (sync cached, ưu tiên)
   *   2. chrome.storage.local.af_settings.chatgptFallbackPrefix (fetch async fallback)
   *   3. Hardcode 'Generate an image of: ' (default cuối)
   *
   * Storage được populate từ:
   *   - User chỉnh trong settings popup (settings-page.js → af_settings)
   *   - Admin push qua /admin/default-settings (app_settings.default_chatgpt_fallback_prefix
   *     → UserSettingController::defaultSettings → GET /api/v1/settings → extension merge)
   */
  async _getFallbackPrefix() {
    // Sync cache có sẵn — tránh chrome.storage await
    const cached = window.storageSettings?.getSettings?.()?.chatgptFallbackPrefix;
    if (cached !== undefined && cached !== null) return cached;
    // Fallback: read storage directly (popup windows có thể chưa init storageSettings xong)
    try {
      const result = await new Promise((r) => chrome.storage.local.get(['af_settings'], r));
      const stored = result?.af_settings?.chatgptFallbackPrefix;
      if (stored !== undefined && stored !== null) return stored;
    } catch (e) { /* ignore */ }
    return 'Generate an image of: ';
  }
}

window.ChatGPTAdapter = ChatGPTAdapter;
