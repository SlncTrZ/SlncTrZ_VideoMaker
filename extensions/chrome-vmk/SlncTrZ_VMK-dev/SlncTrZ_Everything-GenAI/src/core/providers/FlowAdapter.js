/**
 * FlowAdapter - Provider adapter cho Google Flow (labs.google).
 *
 * Đây là wrapper mỏng quanh PromptQueue / MessageBridge.runAutoPrompt hiện có.
 * Mục tiêu: KHÔNG thay thế các call site hiện tại (GenTab, Task, Workflow vẫn
 * gọi MessageBridge.runAutoPrompt trực tiếp). Adapter chỉ phục vụ những flow
 * mới cần generic provider routing (vd: workflow chatgpt -> generate).
 *
 * Pipeline mode: nếu PromptQueue.isEnabled() thì dùng PromptQueue.submitJob.
 * Ngược lại fallback runAutoPrompt legacy.
 */
class FlowAdapter extends AIProviderAdapter {
  constructor() {
    super();
    this.key = 'flow';
    this.displayName = 'Google Flow';
    this.featureKey = 'gen_enabled';
    this.executionAction = 'generate';

    // Phase J: Hardcoded fallback — PCM override via getter
    this._defaultCapabilities = {
      supportsRatio: true,
      supportsQuantity: true,
      supportsVideo: true,
      supportsRefImage: true,
      supportsAutoDownload: true,
      supportsHumanized: true,
      maxRefImagesImage: 10,
      maxRefImagesVideoIngredients: 3,
      maxRefImages: 10,
    };
  }

  /**
   * Phase J: Capabilities getter — merge PCM server data với hardcoded fallback.
   * SSE update → PCM cache invalidate → next read returns fresh data.
   */
  get capabilities() {
    const pcm = typeof ProviderConfigManager !== 'undefined' ? ProviderConfigManager : null;
    const supports = pcm?.getSupportsSync?.('flow') || {};
    const maxImg = pcm?.getMaxRefImagesSync?.('flow', 'image') ?? this._defaultCapabilities.maxRefImagesImage;
    const maxVidIng = pcm?.getMaxRefImagesSync?.('flow', 'video_ingredients') ?? this._defaultCapabilities.maxRefImagesVideoIngredients;

    return {
      supportsRatio: supports.ratio ?? this._defaultCapabilities.supportsRatio,
      supportsQuantity: supports.quantity ?? this._defaultCapabilities.supportsQuantity,
      supportsVideo: supports.video ?? this._defaultCapabilities.supportsVideo,
      supportsRefImage: supports.ref_image ?? this._defaultCapabilities.supportsRefImage,
      supportsAutoDownload: supports.auto_download ?? this._defaultCapabilities.supportsAutoDownload,
      supportsHumanized: supports.humanized ?? this._defaultCapabilities.supportsHumanized,
      maxRefImagesImage: maxImg,
      maxRefImagesVideoIngredients: maxVidIng,
      maxRefImages: Math.max(maxImg, maxVidIng),
    };
  }

  /**
   * Flow yêu cầu tab labs.google đang mở. Background.js đã có handler
   * 'ensureFlowTabReady' / 'ensureFlowTabActive' và mỗi call site (GenTab/
   * Task/Workflow) tự gọi riêng để giữ consistency với behavior cũ.
   * Adapter trả ready: true để caller tự chịu trách nhiệm tab management.
   */
  async ensureReady() {
    return { ready: true };
  }

  /**
   * Trả về max ref images theo mode hiện tại của Flow.
   * Phase J: Delegate to PCM với fallback.
   *
   * @param {object} ctx
   * @param {string} ctx.mode - 'image' | 'video' | 'Image' | 'Video' (case-insensitive)
   * @param {boolean} ctx.isFrames - true khi video mode dùng Frames input (frame_1+frame_2)
   * @returns {number}
   */
  getMaxRefImages({ mode = 'image', isFrames = false } = {}) {
    const pcm = typeof ProviderConfigManager !== 'undefined' ? ProviderConfigManager : null;
    const isVideo = String(mode || '').toLowerCase() === 'video';
    if (isVideo && !isFrames) {
      return pcm?.getMaxRefImagesSync?.('flow', 'video_ingredients') ?? this._defaultCapabilities.maxRefImagesVideoIngredients;
    }
    return pcm?.getMaxRefImagesSync?.('flow', 'image') ?? this._defaultCapabilities.maxRefImagesImage;
  }

  /**
   * Submit prompt tới Flow.
   *
   * Params shape (linh hoạt — chấp nhận cả single prompt và batch):
   *   { prompt, prompts, settings, refFileIds, refImageMode, autoDownload,
   *     owner, label, taskName }
   *
   * Pipeline mode (PromptQueue.isEnabled()):
   *   -> PromptQueue.submitJob({ owner, label, prompts, settings, ... })
   *
   * Legacy mode:
   *   -> MessageBridge.runAutoPrompt(params) — giữ nguyên signature gốc.
   */
  async submit(params) {
    const p = params || {};

    // Pipeline mode: PromptQueue
    if (typeof PromptQueue !== 'undefined' && typeof PromptQueue.isEnabled === 'function' && PromptQueue.isEnabled()) {
      const inst = PromptQueue.getInstance();
      // Normalize prompts: ưu tiên array prompts, fallback single prompt.
      const promptsArr = Array.isArray(p.prompts) && p.prompts.length > 0
        ? p.prompts
        : (p.prompt ? [p.prompt] : []);
      return await inst.submitJob({
        owner: p.owner || 'prompts',
        label: p.label || 'Flow generate',
        prompts: promptsArr,
        settings: p.settings || {},
        refFileIds: p.refFileIds || [],
        refImageMode: p.refImageMode || 'all',
        autoDownload: p.autoDownload,
        taskName: p.taskName || null,
      });
    }

    // Legacy mode: gọi thẳng MessageBridge.runAutoPrompt với payload gốc.
    if (!window.MessageBridge || typeof window.MessageBridge.runAutoPrompt !== 'function') {
      return { success: false, error: 'BRIDGE_NOT_LOADED' };
    }
    // [Fix] Inject timing settings nếu chưa có
    const settings = window.storageSettings?.getSettings?.() || {};
    const payload = {
      ...p,
      delayBetweenMs: p.delayBetweenMs ?? (settings.delayBetweenPrompts || 5) * 1000,
      inputTimeoutMs: p.inputTimeoutMs ?? (settings.inputTimeout || 1200),
    };
    return await window.MessageBridge.runAutoPrompt(payload);
  }

  /**
   * Upload reference image lên Flow qua ImmediateUploader.
   * ImmediateUploader.upload là static method với signature
   * (file, thumbnail, options).
   */
  async uploadRef(file, thumbnail, options) {
    if (!window.ImmediateUploader || typeof window.ImmediateUploader.upload !== 'function') {
      throw new Error('ImmediateUploader not loaded');
    }
    return await window.ImmediateUploader.upload(file, thumbnail, options || {});
  }
}

window.FlowAdapter = FlowAdapter;
