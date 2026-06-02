/**
 * ProviderConfigManager — Fetch + cache provider configs (DOM selectors) từ backend.
 *
 * Features:
 * - Fetch selectors từ API (cache 1h)
 * - Listen SSE push để update ngay lập tức
 * - Fallback chain support
 * - Hard-coded defaults khi offline
 */
class ProviderConfigManager {
  static _CACHE_KEY = 'toby_provider_configs';
  static _API_CONFIGS_CACHE_KEY = 'toby_provider_api_configs';
  static _CACHE_TTL_MS = 60 * 60 * 1000; // 1h
  static _cache = null;
  static _fetchPromise = null;

  // Initiative 4 (rev6): API configs cache riêng (ratios per mode, download_resolutions, error_patterns, ...)
  // Persist vào chrome.storage._API_CONFIGS_CACHE_KEY để content.js đọc được.
  static _apiConfigsCache = null;
  static _apiConfigsFetchPromise = null;

  // Initiative 7: Default base URLs fallback (offline / first-install)
  static _DEFAULT_BASE_URLS = {
    flow: 'https://labs.google/fx/tools/flow',
    chatgpt: 'https://chatgpt.com',
    grok: 'https://x.com/i/grok',
    gemini: 'https://gemini.google.com',
  };

  // Rev10 (2026-05-14): Centralized provider URLs — all URL patterns per provider
  // Dùng cho tab query, create, specific pages. Admin có thể override qua provider_configs.api_config.urls
  static _DEFAULT_URLS = {
    flow: {
      base: 'https://labs.google/fx/tools/flow',
      tabQueryPatterns: ['https://labs.google/fx/*', '*://aisandbox.google.com/*'],
      tabQuery: 'https://labs.google/fx/*',
      createUrl: 'https://labs.google/fx/tools/flow',
      imageFx: 'https://labs.google/fx/tools/image-fx',
      localeBase: 'https://labs.google/fx/{locale}/tools/flow', // {locale} = vi, en, ja, th
    },
    chatgpt: {
      base: 'https://chatgpt.com',
      tabQueryPatterns: ['*://chatgpt.com/*'],
      tabQuery: '*://chatgpt.com/*',
      createUrl: 'https://chatgpt.com/',
    },
    grok: {
      base: 'https://grok.com',
      tabQueryPatterns: ['*://grok.com/*', 'https://x.com/i/grok*'],
      tabQuery: '*://grok.com/*',
      createUrl: 'https://grok.com/',
      imagine: 'https://grok.com/imagine',
      saved: 'https://grok.com/imagine/saved',
      cdnPatterns: ['assets.grok.com', 'grok.x.ai'],
    },
    gemini: {
      base: 'https://gemini.google.com',
      tabQueryPatterns: ['*://gemini.google.com/*'],
      tabQuery: '*://gemini.google.com/*',
      createUrl: 'https://gemini.google.com/app',
      app: 'https://gemini.google.com/app',
    },
  };

  // Initiative 4 (rev6): Default ratios per (provider, mode) — match migration seed
  static _DEFAULT_RATIOS = {
    flow: {
      image: ['1:1', '9:16', '16:9', '4:3', '3:4'],
      video: ['16:9', '9:16'],
    },
    chatgpt: {
      image: [
        { ui_name: 'story', value: '9:16' },
        { ui_name: 'portrait', value: '3:4' },
        { ui_name: 'square', value: '1:1' },
        { ui_name: 'landscape', value: '4:3' },
        { ui_name: 'widescreen', value: '16:9' },
      ],
    },
    grok: {
      image: [
        { ui_name: 'story', value: '9:16' },
        { ui_name: 'portrait', value: '2:3' },
        { ui_name: 'square', value: '1:1' },
        { ui_name: 'landscape', value: '3:2' },
        { ui_name: 'widescreen', value: '16:9' },
      ],
      video: [
        { ui_name: 'story', value: '9:16' },
        { ui_name: 'portrait', value: '2:3' },
        { ui_name: 'square', value: '1:1' },
        { ui_name: 'landscape', value: '3:2' },
        { ui_name: 'widescreen', value: '16:9' },
      ],
    },
    gemini: {
      image: ['1:1', '9:16', '16:9'],
    },
  };

  // Default download resolutions per provider — match migration seed
  // (2026_05_19_100001_add_flow_download_resolutions_and_dom_selectors.php).
  // Source of truth: backend provider_configs(type='api_config', key='download_resolutions').
  // Admin tweak qua /admin/providers → Flow → API Configs → download_resolutions → SSE push.
  static _DEFAULT_DOWNLOAD_RESOLUTIONS = {
    flow: {
      image: [
        { value: '1k', label: '1K (1024px)', menu_label: '1K', pixel_width: 1024 },
        { value: '2k', label: '2K (Pro)',    menu_label: '2K', pixel_width: 2048 },
        { value: '4k', label: '4K (Ultra)',  menu_label: '4K', pixel_width: 4096 },
      ],
      video: [
        { value: '720p',  label: '720p',       menu_label: '720p'  },
        { value: '1080p', label: '1080p',      menu_label: '1080p' },
        { value: '4k',    label: '4K (Ultra)', menu_label: '4K'    },
      ],
      // Fallback chain khi menu item aria-disabled
      image_fallback_chain: ['4K', '2K', '1K'],
      video_fallback_chain: ['4K', '1080p', '720p'],
    },
  };

  // Phase J: Default max ref images per provider per mode — match migration seed
  static _DEFAULT_MAX_REF_IMAGES = {
    flow: { image: 10, video_ingredients: 3 },
    chatgpt: { image: 4 },
    grok: { image: 4, video: 4 },
    gemini: { image: 4 },
  };

  // Phase J: Default feature support flags per provider — match migration seed
  static _DEFAULT_SUPPORTS = {
    flow: {
      ratio: true, quantity: true, video: true,
      ref_image: true, auto_download: true, humanized: true, image_mode: false,
    },
    chatgpt: {
      ratio: true, quantity: false, video: false,
      ref_image: true, auto_download: true, humanized: true, image_mode: true,
    },
    grok: {
      ratio: true, quantity: false, video: true,
      ref_image: true, auto_download: true, humanized: false, image_mode: true,
    },
    gemini: {
      ratio: false, quantity: false, video: false,
      ref_image: true, auto_download: false, humanized: false, image_mode: false,
    },
  };

  // Phase J: Grok-specific defaults
  static _DEFAULT_SUPPORTED_DURATIONS = { grok: ['6s', '10s'] };
  static _DEFAULT_SUPPORTED_RESOLUTIONS = { grok: ['480p', '720p'] };
  static _DEFAULT_SUPPORTED_IMAGE_QUALITIES = { grok: ['speed', 'quality'] };

  // Phase J: Ratio UI maps — match migration seed
  static _DEFAULT_RATIO_UI_MAP = {
    chatgpt: { story: '9:16', portrait: '3:4', square: '1:1', landscape: '4:3', widescreen: '16:9' },
    grok: { story: '9:16', portrait: '2:3', square: '1:1', landscape: '3:2', widescreen: '16:9' },
  };

  // Phase J: Ratio aria-labels for DOM query — ChatGPT only
  static _DEFAULT_RATIO_ARIA_LABELS = {
    chatgpt: {
      story: 'Story 9:16',
      portrait: 'Portrait 3:4',
      square: 'Square 1:1',
      landscape: 'Landscape 4:3',
      widescreen: 'Widescreen 16:9',
    },
  };

  // Hard-coded defaults - dùng khi offline / fresh install
  static _DEFAULTS = {
    flow: {
      tile_container: { selectors: ['[data-tile-id]'], attribute: 'data-tile-id' },
      tile_image: { selectors: ['img[src*="getMediaUrlRedirect"]', 'img[src*="googleusercontent.com"]'], attribute: 'src' },
      tile_video: { selectors: ['video[src*="getMediaUrlRedirect"]', 'video'], attribute: 'src' },
      warning_icon: { selectors: ['.google-symbols', 'i[class*="icon"]'], text_match: 'warning' },
      slate_editor: { selectors: ['div[data-slate-editor="true"]', '[data-slate-node="value"]', '[role="textbox"][aria-multiline="true"]', '[contenteditable="true"]'] },
      project_link: { selectors: ['a[href*="/project/"]'], attribute: 'href' },
      edit_link: { selectors: ['a[href*="/edit/"]'], attribute: 'href' },
      submit_button: {
        selectors: ['button:has(i.google-symbols)', 'button[type="submit"]'],
        icon_text: 'arrow_forward',
        button_text: ['Tạo', 'Create'],
      },
      context_menu: { selectors: ['[role="menu"]', '[role="menu"][data-state="open"]'] },
      menu_item: { selectors: ['[role="menuitem"]'] },
      // Phase 11 (2026-05-14): 12 keys added to sync with backend seed
      mode_tab_image: { selectors: ['button[id$="-trigger-IMAGE"]', 'button[role="tab"][aria-controls*="IMAGE"]'], attribute: 'aria-selected' },
      mode_tab_video: { selectors: ['button[id$="-trigger-VIDEO"]:not([id*="VIDEO_"])', 'button[role="tab"][aria-controls*="VIDEO"]:not([aria-controls*="VIDEO_"])'], attribute: 'aria-selected' },
      video_mode_frames: { selectors: ['button[id$="-trigger-VIDEO_FRAMES"]', 'button[role="tab"][aria-controls*="VIDEO_FRAMES"]'], attribute: 'aria-selected', text_match: ['frames', 'khung hình', 'khung'] },
      video_mode_ingredients: { selectors: ['button[id$="-trigger-VIDEO_REFERENCES"]', 'button[role="tab"][aria-controls*="VIDEO_REFERENCES"]'], attribute: 'aria-selected', text_match: ['ingredients', 'thành phần', 'thanh phan'] },
      settings_button: { selectors: ['button[aria-haspopup="menu"]', 'button[id^="radix-:"]'], icon_text: 'crop_' },
      ratio_button: { selectors: ['button[id*="-trigger-PORTRAIT"]', 'button[id*="-trigger-LANDSCAPE"]', 'button[id*="-trigger-SQUARE"]', 'button[role="tab"][aria-controls*="aspect"]'], attribute: 'aria-selected' },
      quantity_button: { selectors: ['button[id*="-trigger-1"]', 'button[id*="-trigger-2"]', 'button[id*="-trigger-3"]', 'button[id*="-trigger-4"]', 'button[role="tab"][aria-controls*="quantity"]'], attribute: 'aria-selected' },
      settings_panel_candidates: { selectors: ['[role="dialog"]', '[data-radix-popper-content-wrapper]', '[role="menu"]'] },
      settings_panel_marker: { selectors: ['button[role="tab"][id*="-trigger-"]'] },
      download_menu_trigger: { selectors: ['[role="menuitem"][aria-haspopup="menu"]'], icon_text: 'download', button_text: ['Tải xuống', 'Download', 'ดาวน์โหลด', 'ダウンロード'] },
      download_submenu: { selectors: ['[role="menu"][data-state="open"]', '[data-radix-popper-content-wrapper] [role="menu"]'], attribute: 'aria-controls' },
      download_submenu_item: { selectors: ['[role="menuitem"]'] },
    },
    chatgpt: {
      composer: { selectors: ['#prompt-textarea', 'div.ProseMirror[role="textbox"]'] },
      submit_button: { selectors: ['button[data-testid="send-button"]', 'button.composer-submit-button-color'] },
      stop_button: { selectors: ['[aria-label="Stop generating"]', '[data-testid="stop-button"]'] },
      conversation_turn: { selectors: ['[data-testid^="conversation-turn-"]', '[data-turn-id]'], attribute: 'data-testid' },
      generated_image: { selectors: ['img[alt^="Generated image"]:not([aria-hidden])', 'img[src*="/backend-api/"]:not([aria-hidden])'], attribute: 'src' },
      generating_indicator: { selectors: ['[data-testid^="image-gen-loading-state"]', '[aria-label="Generating image..."]'] },
      new_chat_button: { selectors: ['a[data-testid="create-new-chat-button"]'] },
      ratio_button: { selectors: ['button[aria-label="Choose image aspect ratio"]'] },
      plus_button: { selectors: ['#composer-plus-btn', '[data-testid="composer-plus-btn"]'] },
      file_input: { selectors: ['#upload-photos', 'input[type="file"][accept*="image"]'] },
      // Phase 11 (2026-05-14): 5 keys added to sync with backend seed
      message_author: { selectors: ['[data-message-author-role]'], attribute: 'data-message-author-role' },
      open_menu: { selectors: ['div[role="menu"][data-radix-menu-content][data-state="open"]', 'div[role="menu"][data-state="open"]', '[role="menu"]'] },
      menu_items: { selectors: ['[role="menuitemradio"]', '[role="menuitem"]'] },
      chat_history_home_link: { selectors: ['nav[aria-label="Chat history"] a[href="/"]'], attribute: 'href' },
      cloudflare_iframe: { selectors: ['iframe[src*="challenges.cloudflare.com"]', 'iframe[src*="turnstile"]', '.cf-turnstile', '[data-cf-turnstile]'] },
    },
    grok: {
      composer: { selectors: ['form div[contenteditable="true"]', '.ProseMirror', '.tiptap'] },
      submit_button: { selectors: ['button[type="submit"][aria-label="Submit"]', 'button[aria-label="Submit"]', 'button[type="submit"]'] },
      stop_button: { selectors: ['button[aria-label="Stop"]', '[aria-label="Stop generating"]'] },
      result_container: { selectors: ['[data-testid="result-container"]', 'main article', 'div[id^="imagine-masonry-section-"]'] },
      result_image: { selectors: ['img[src^="https://"]'], attribute: 'src' },
      result_video: { selectors: ['video', 'video source'], attribute: 'src' },
      cloudflare_iframe: { selectors: ['iframe[src*="challenges.cloudflare.com"]', 'iframe[src*="turnstile"]'] },
      cloudflare_turnstile: { selectors: ['.cf-turnstile', '[data-cf-turnstile]'] },
      generation_mode: { selectors: ['[role="radiogroup"][aria-label="Generation mode"]'] },
      ratio_button: { selectors: ['button[aria-label="Aspect Ratio"]', 'div.inline-flex > button'] },
      file_input: { selectors: ['input[type="file"][accept="image/*"]', 'input[type="file"]'] },
      back_button: { selectors: ['div[aria-label="Back"]', 'button[aria-label="Back"]'] },
      // Phase 11 (2026-05-14): 10 keys added to sync with backend seed
      image_quality_picker: { selectors: ['[role="radiogroup"][aria-label="Image generation speed"]'] },
      video_duration_picker: { selectors: ['[role="radiogroup"][aria-label="Video duration"]'] },
      video_resolution_picker: { selectors: ['[role="radiogroup"][aria-label="Video resolution"]'] },
      age_verification_modal: { selectors: ['[data-analytics-name="age_verification"]'], attribute: 'data-analytics-name' },
      saved_button: { selectors: ['a[aria-label="Saved"]', 'button[aria-label="Saved"]'] },
      imagine_link: { selectors: ['a[href="/imagine"]', 'a[href="/imagine/"]', 'button[aria-label="Imagine"]'] },
      remove_image_button: { selectors: ['button[aria-label="Remove image"]'] },
      grok_cdn_image: { selectors: ['img[src*="assets.grok.com"]'], attribute: 'src' },
      auth_link: { selectors: ['a[href*="/login"]', 'a[href*="/signin"]', 'a[href*="auth"]'], attribute: 'href' },
      open_menu: { selectors: ['[data-radix-popper-content-wrapper]', '[role="menu"]'] },
    },
    gemini: {
      composer: { selectors: ['.ql-editor', 'div[role="textbox"]', '[contenteditable="true"]', 'rich-textarea'] },
      submit_button: { selectors: ['button[aria-label="Send message"]', 'button[type="submit"]'] },
      stop_button: { selectors: ['button[aria-label="Stop"]', '[aria-label*="Stop"]'] },
      response_container: { selectors: ['[data-message-id]', '.response-container', 'model-response'] },
      generated_image: { selectors: ['img[src*="googleusercontent"]', 'img[data-src]'], attribute: 'src' },
      cloudflare_iframe: { selectors: ['iframe[src*="challenges.cloudflare.com"]', 'iframe[src*="recaptcha"]'] },
      file_input: { selectors: ['input[type="file"][accept*="image"]', 'input[type="file"][multiple]', 'input[type="file"]'] },
      add_button: { selectors: ['button:has(svg path[d*="M19 13h-6v6h"])'] },
      image_preview: { selectors: ['[class*="image-preview"]', '[class*="attachment"]', 'img[src^="blob:"]'] },
    },
  };

  /**
   * Lấy selector config cho 1 key
   * @returns {Object} { selectors: [], text_match?, attribute?, icon_text?, button_text? }
   */
  static async get(provider, key) {
    const data = await this.fetch();
    const providerData = data?.[provider] || {};
    const selectors = providerData.selectors || {};
    const config = selectors[key] || this._DEFAULTS[provider]?.[key];

    if (!config) return null;

    return {
      selectors: config.selectors || this._DEFAULTS[provider]?.[key]?.selectors || [],
      text_match: config.text_match || null,
      attribute: config.attribute || null,
      icon_text: config.icon_text || null,
      button_text: config.button_text || null,
    };
  }

  /**
   * Lấy array selectors cho 1 key (shorthand)
   */
  static async getSelectors(provider, key) {
    const config = await this.get(provider, key);
    return config?.selectors || [];
  }

  /**
   * Lấy tất cả selectors của 1 provider
   */
  static async getProvider(provider) {
    const data = await this.fetch();
    const remote = data?.[provider] || {};
    const remoteSelectors = remote.selectors || {};
    const defaults = this._DEFAULTS[provider] || {};

    // Merge: remote override defaults
    const merged = { ...defaults };
    for (const [key, config] of Object.entries(remoteSelectors)) {
      merged[key] = { ...defaults[key], ...config };
    }

    return {
      name: remote.name || provider,
      status: remote.status || 'active',
      base_url: remote.base_url || null,
      config_version: remote.config_version || 1,
      selectors: merged,
    };
  }

  /**
   * Initiative 7: Get base URL của 1 provider.
   * Replace 10+ vị trí hardcode 'https://labs.google/fx/*' trong app.js.
   * @returns {Promise<string>}
   */
  static async getBaseUrl(providerSlug) {
    const data = await this.fetch();
    const remote = data?.[providerSlug];
    return remote?.base_url || this._DEFAULT_BASE_URLS[providerSlug] || '';
  }

  /**
   * SYNC version — return từ cache nếu có, fallback _DEFAULT_BASE_URLS.
   * Dùng cho hot path không thể await.
   */
  static getBaseUrlSync(providerSlug) {
    if (this._cache?.data?.[providerSlug]?.base_url) {
      return this._cache.data[providerSlug].base_url;
    }
    return this._DEFAULT_BASE_URLS[providerSlug] || '';
  }

  // ============ Rev10: Centralized URL helpers ============

  /**
   * Get tab query pattern để tìm tabs đã mở.
   * @param {string} slug — 'flow' | 'chatgpt' | 'grok' | 'gemini'
   * @returns {string} Pattern cho chrome.tabs.query (vd: '*://chatgpt.com/*')
   */
  static getTabQuery(slug) {
    return this._DEFAULT_URLS[slug]?.tabQuery || '';
  }

  /**
   * Get all tab query patterns (array) — dùng khi provider có nhiều domain.
   * @param {string} slug
   * @returns {string[]} Array patterns
   */
  static getTabQueryPatterns(slug) {
    return this._DEFAULT_URLS[slug]?.tabQueryPatterns || [this.getTabQuery(slug)].filter(Boolean);
  }

  /**
   * Get URL để tạo tab mới.
   * @param {string} slug
   * @returns {string}
   */
  static getCreateUrl(slug) {
    return this._DEFAULT_URLS[slug]?.createUrl || this._DEFAULT_URLS[slug]?.base || this.getBaseUrlSync(slug);
  }

  /**
   * Get specific URL của provider.
   * @param {string} slug
   * @param {string} key — 'imagine', 'saved', 'app', 'imageFx', etc.
   * @returns {string|null}
   */
  static getProviderUrl(slug, key) {
    return this._DEFAULT_URLS[slug]?.[key] || null;
  }

  /**
   * Check URL có thuộc provider không (match any tabQueryPatterns).
   * @param {string} url
   * @param {string} slug
   * @returns {boolean}
   */
  static isProviderUrl(url, slug) {
    if (!url || !slug) return false;
    const patterns = this.getTabQueryPatterns(slug);
    return patterns.some(pattern => {
      // Convert chrome pattern to regex
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
      return regex.test(url);
    });
  }

  /**
   * Check URL có chứa CDN pattern của provider không (Grok CDN check).
   * @param {string} url
   * @param {string} slug
   * @returns {boolean}
   */
  static isCdnUrl(url, slug) {
    const cdnPatterns = this._DEFAULT_URLS[slug]?.cdnPatterns;
    if (!cdnPatterns || !url) return false;
    return cdnPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Get all provider slugs.
   * @returns {string[]}
   */
  static getProviderSlugs() {
    return Object.keys(this._DEFAULT_URLS);
  }

  // ============ End Rev10 URL helpers ============

  /**
   * Initiative 4 (rev6 fix): Get ratios của 1 provider per mode.
   * Fetch từ /api/v1/providers/api-configs (KHÔNG dùng cache của /dom-selectors).
   *
   * @param {string} providerSlug — 'flow' | 'chatgpt' | 'grok' | 'gemini'
   * @param {string} mode — 'image' | 'video'
   * @returns {Promise<Array>} List ratios:
   *   - Flow: ["1:1", "9:16", "16:9", ...] (string only)
   *   - ChatGPT/Grok: [{ ui_name: "story", value: "9:16" }, ...] (object với UI mapping)
   */
  static async getRatios(providerSlug, mode) {
    const apiConfigs = await this._fetchApiConfigs();
    const ratios = apiConfigs?.[providerSlug]?.configs?.ratios;
    if (ratios && ratios[mode]) return ratios[mode];
    // Fallback _DEFAULT_RATIOS
    return this._DEFAULT_RATIOS[providerSlug]?.[mode] || [];
  }

  static getRatiosSync(providerSlug, mode) {
    const ratios = this._apiConfigsCache?.data?.[providerSlug]?.configs?.ratios;
    if (ratios && ratios[mode]) return ratios[mode];
    return this._DEFAULT_RATIOS[providerSlug]?.[mode] || [];
  }

  /**
   * Get download resolutions config (Flow only — ChatGPT/Grok không có menu resolution).
   *
   * @param {string} providerSlug — 'flow'
   * @param {string|null} mode — 'image' | 'video' | null (trả full config)
   * @returns {Array|Object|null}
   *   - mode='image': [{value, label, menu_label, pixel_width}, ...]
   *   - mode='video': [{value, label, menu_label}, ...]
   *   - mode=null: { image, video, image_fallback_chain, video_fallback_chain }
   */
  static getDownloadResolutionsSync(providerSlug, mode = null) {
    const cfg = this._apiConfigsCache?.data?.[providerSlug]?.configs?.download_resolutions
      ?? this._DEFAULT_DOWNLOAD_RESOLUTIONS[providerSlug];
    if (!cfg) return mode === null ? null : [];
    if (mode === null) return cfg;
    return Array.isArray(cfg[mode]) ? cfg[mode] : [];
  }

  /**
   * Get fallback chain (theo thứ tự ưu tiên khi menu item aria-disabled).
   * @param {string} providerSlug — 'flow'
   * @param {string} mode — 'image' | 'video'
   * @returns {string[]} — vd ['4K', '2K', '1K']
   */
  static getDownloadFallbackChainSync(providerSlug, mode) {
    const cfg = this.getDownloadResolutionsSync(providerSlug, null);
    if (!cfg) return [];
    const key = `${mode}_fallback_chain`;
    return Array.isArray(cfg[key]) ? cfg[key] : [];
  }

  /**
   * Get pixel_width cho resolution (image only — dùng cho applyResolutionToUrl).
   * @returns {number|null}
   */
  static getDownloadPixelWidthSync(providerSlug, resolution) {
    const list = this.getDownloadResolutionsSync(providerSlug, 'image');
    const found = list.find(r => r.value === resolution);
    return found?.pixel_width || null;
  }

  /**
   * Get menu_label theo resolution + mode.
   * @returns {string|null} — vd '1K' / '720p' / '4K'
   */
  static getDownloadMenuLabelSync(providerSlug, mode, resolution) {
    const list = this.getDownloadResolutionsSync(providerSlug, mode);
    const found = list.find(r => r.value === resolution);
    return found?.menu_label || null;
  }

  // ============ Phase J: Provider Capabilities Methods ============

  /**
   * Get max ref images for provider per mode.
   * @param {string} slug — 'flow' | 'chatgpt' | 'grok' | 'gemini'
   * @param {string} mode — 'image' | 'video' | 'video_ingredients'
   * @returns {number}
   */
  static getMaxRefImagesSync(slug, mode = 'image') {
    const cfg = this._apiConfigsCache?.data?.[slug]?.configs?.max_ref_images
      ?? this._DEFAULT_MAX_REF_IMAGES[slug];
    if (!cfg) return 0;
    // Flow special: video_ingredients mode
    if (slug === 'flow' && mode === 'video_ingredients') {
      return cfg.video_ingredients ?? cfg.image ?? 3;
    }
    // Grok: video mode
    if (slug === 'grok' && mode === 'video') {
      return cfg.video ?? cfg.image ?? 4;
    }
    return cfg.image ?? cfg[mode] ?? 4;
  }

  static async getMaxRefImages(slug, mode = 'image') {
    await this._fetchApiConfigs();
    return this.getMaxRefImagesSync(slug, mode);
  }

  /**
   * Get feature support flags for provider.
   * @param {string} slug
   * @returns {object} { ratio, quantity, video, ref_image, auto_download, humanized, image_mode }
   */
  static getSupportsSync(slug) {
    const cfg = this._apiConfigsCache?.data?.[slug]?.configs?.supports
      ?? this._DEFAULT_SUPPORTS[slug];
    return cfg || {};
  }

  static async getSupports(slug) {
    await this._fetchApiConfigs();
    return this.getSupportsSync(slug);
  }

  /**
   * Get supported durations (Grok only).
   * @param {string} slug
   * @returns {string[]} — ['6s', '10s']
   */
  static getSupportedDurationsSync(slug) {
    const cfg = this._apiConfigsCache?.data?.[slug]?.configs?.supported_durations
      ?? this._DEFAULT_SUPPORTED_DURATIONS[slug];
    return Array.isArray(cfg) ? cfg : [];
  }

  /**
   * Get supported resolutions (Grok only).
   * @param {string} slug
   * @returns {string[]} — ['480p', '720p']
   */
  static getSupportedResolutionsSync(slug) {
    const cfg = this._apiConfigsCache?.data?.[slug]?.configs?.supported_resolutions
      ?? this._DEFAULT_SUPPORTED_RESOLUTIONS[slug];
    return Array.isArray(cfg) ? cfg : [];
  }

  /**
   * Get supported image qualities (Grok only).
   * @param {string} slug
   * @returns {string[]} — ['speed', 'quality']
   */
  static getSupportedImageQualitiesSync(slug) {
    const cfg = this._apiConfigsCache?.data?.[slug]?.configs?.supported_image_qualities
      ?? this._DEFAULT_SUPPORTED_IMAGE_QUALITIES[slug];
    return Array.isArray(cfg) ? cfg : [];
  }

  /**
   * Get ratio UI map (ChatGPT/Grok).
   * Consolidation fix (2026-05-14): Derive từ `ratios` thay vì maintain key riêng.
   * @param {string} slug
   * @returns {object} { story: '9:16', portrait: '3:4', ... }
   */
  static getRatioUiMapSync(slug) {
    // 1. Check legacy key (backward compat)
    const legacy = this._apiConfigsCache?.data?.[slug]?.configs?.ratio_ui_map;
    if (legacy && Object.keys(legacy).length > 0) return legacy;

    // 2. Derive từ ratios
    const ratios = this.getRatiosSync(slug, 'image');
    if (Array.isArray(ratios) && ratios.length > 0 && ratios[0]?.ui_name) {
      return ratios.reduce((acc, r) => {
        acc[r.ui_name] = r.value;
        return acc;
      }, {});
    }

    // 3. Fallback _DEFAULT
    return this._DEFAULT_RATIO_UI_MAP[slug] || {};
  }

  /**
   * Get ratio aria-labels for DOM query (ChatGPT only).
   * Consolidation fix (2026-05-14): Derive từ `ratios` thay vì maintain key riêng.
   * @param {string} slug
   * @returns {object} { story: 'Story 9:16', ... }
   */
  static getRatioAriaLabelsSync(slug) {
    // 1. Check legacy key (backward compat)
    const legacy = this._apiConfigsCache?.data?.[slug]?.configs?.ratio_aria_labels;
    if (legacy && Object.keys(legacy).length > 0) return legacy;

    // 2. Derive từ ratios — format: "Story 9:16"
    const ratios = this.getRatiosSync(slug, 'image');
    if (Array.isArray(ratios) && ratios.length > 0 && ratios[0]?.ui_name) {
      return ratios.reduce((acc, r) => {
        const label = r.ui_name.charAt(0).toUpperCase() + r.ui_name.slice(1);
        acc[r.ui_name] = `${label} ${r.value}`;
        return acc;
      }, {});
    }

    // 3. Fallback _DEFAULT
    return this._DEFAULT_RATIO_ARIA_LABELS[slug] || {};
  }

  // ============ End Phase J Methods ============

  /**
   * Internal: fetch /providers/api-configs với cache riêng (TTL 1h).
   * Separate khỏi /dom-selectors vì 2 endpoint khác nhau.
   */
  static async _fetchApiConfigs() {
    if (this._apiConfigsCache && Date.now() < this._apiConfigsCache.expiresAt) {
      return this._apiConfigsCache.data;
    }
    if (this._apiConfigsFetchPromise) return this._apiConfigsFetchPromise;

    this._apiConfigsFetchPromise = this._doFetchApiConfigs();
    try {
      return await this._apiConfigsFetchPromise;
    } finally {
      this._apiConfigsFetchPromise = null;
    }
  }

  static async _doFetchApiConfigs() {
    if (!window.authManager?.apiBaseUrl) return;
    try {
      const baseUrl = await this._getApiBaseUrl();
      // Bug 42 fix (2026-05-13): Backend trả Cache-Control: public, max-age=3600 →
      // browser HTTP cache giữ stale response 1h. Force fresh network call qua cache:'no-store'
      // (extension đã có in-memory + chrome.storage cache TTL riêng, không cần HTTP cache).
      const resp = await fetch(`${baseUrl}/api/v1/providers/api-configs`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json.success && json.data) {
        this._apiConfigsCache = {
          data: json.data,
          expiresAt: Date.now() + this._CACHE_TTL_MS,
          fetchedAt: Date.now(),
        };
        // Persist vào chrome.storage để content.js đọc được (download_resolutions, ratios, error_patterns).
        this._writeApiConfigsCache(this._apiConfigsCache);
        // Bug 42c fix (2026-05-13): Emit event sau initial fetch để UI components đã render
        // trước khi cache warm có thể re-render với fresh data (e.g. right sidebar Flow ratio
        // dropdown render trước khi _fetchApiConfigs() resolve → stale options).
        if (window.eventBus) {
          window.eventBus.emit('provider:api_configs_loaded', { data: json.data });
        }
        return json.data;
      }
      throw new Error('Invalid response');
    } catch (e) {
      console.warn('[ProviderConfigManager] api-configs fetch failed:', e.message);
      // Fallback: hydrate từ storage cache (nếu có) khi network fail
      const cached = await this._readApiConfigsCache();
      if (cached?.data) {
        this._apiConfigsCache = cached;
        return cached.data;
      }
      return {};
    }
  }

  /**
   * Fetch từ API với cache
   */
  static async fetch() {
    if (this._cache && Date.now() < this._cache.expiresAt) {
      return this._cache.data;
    }

    if (this._fetchPromise) return this._fetchPromise;

    this._fetchPromise = this._doFetch();
    try {
      const data = await this._fetchPromise;
      return data;
    } finally {
      this._fetchPromise = null;
    }
  }

  static async _doFetch() {
    if (!window.authManager?.apiBaseUrl) return {};
    try {
      const cached = await this._readCache();
      if (cached && Date.now() < cached.expiresAt) {
        this._cache = cached;
        return cached.data;
      }

      const baseUrl = await this._getApiBaseUrl();
      // Bug 42 fix: cache:'no-store' để bypass HTTP cache (extension tự manage cache).
      const resp = await fetch(`${baseUrl}/api/v1/providers/dom-selectors`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      if (json.success && json.data) {
        const cacheData = {
          data: json.data,
          expiresAt: Date.now() + this._CACHE_TTL_MS,
          fetchedAt: Date.now(),
        };
        this._cache = cacheData;
        await this._writeCache(cacheData);
        return json.data;
      }

      throw new Error('Invalid response');
    } catch (e) {
      console.warn('[ProviderConfigManager] Fetch failed, using cache/defaults:', e.message);

      const staleCache = await this._readCache();
      if (staleCache?.data) {
        this._cache = { ...staleCache, expiresAt: Date.now() + 5 * 60 * 1000 };
        return staleCache.data;
      }

      return {};
    }
  }

  /**
   * Force refresh cache
   */
  static async refresh() {
    this._cache = null;
    await this._clearCache();
    return this.fetch();
  }

  /**
   * Background fetch (fire-and-forget)
   */
  static fetchInBackground() {
    this.fetch().catch(() => {});
  }

  /**
   * Handle SSE push update
   */
  static handleSseUpdate(data) {
    const { type, provider } = data;

    if (type === 'dom_selector_updated') {
      const { key, value, config_version } = data;
      console.log(`[ProviderConfigManager] SSE selector update: ${provider}.${key}`, value);

      if (this._cache?.data?.[provider]) {
        if (!this._cache.data[provider].selectors) {
          this._cache.data[provider].selectors = {};
        }
        // Store full value object (selectors, attribute, text_match, icon_text, button_text)
        this._cache.data[provider].selectors[key] = value;
        this._cache.data[provider].config_version = config_version;
        this._writeCache(this._cache);
      }

      if (window.eventBus) {
        window.eventBus.emit('provider:selector_updated', { provider, key, value });
      }

      // Notify content scripts via background broadcast
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'providerConfigUpdated', data }).catch(() => {});
      }
    }

    if (type === 'provider_status_changed') {
      const { status, name } = data;
      console.log(`[ProviderConfigManager] SSE status change: ${provider} → ${status}`);

      if (this._cache?.data?.[provider]) {
        this._cache.data[provider].status = status;
        this._writeCache(this._cache);
      }

      if (window.eventBus) {
        window.eventBus.emit('provider:status_changed', { provider, status, name });
      }

      if (status === 'disabled' || status === 'maintenance') {
        this._notifyProviderUnavailable(provider, status, name);
      }
    }

    if (type === 'api_config_updated' || type === 'api_config_created' || type === 'api_config_deleted') {
      const key = data.key;
      const value = data.value;
      const configVersion = data.config_version;
      console.log(`[ProviderConfigManager] SSE api_config ${type}: ${provider}.${key}`);

      // Race fix (Bug 19): nếu payload có value đầy đủ, update cache in-place
      // → consumer listener đọc fresh data ngay. Tránh emit trước khi async refetch xong.
      const hasCache = !!this._apiConfigsCache?.data?.[provider];
      const hasValue = value !== undefined && value !== null;

      if (hasCache && hasValue) {
        // Optimistic update — cache in-memory + persist storage để content.js đọc được
        if (!this._apiConfigsCache.data[provider].configs) {
          this._apiConfigsCache.data[provider].configs = {};
        }
        if (type === 'api_config_deleted') {
          delete this._apiConfigsCache.data[provider].configs[key];
        } else {
          this._apiConfigsCache.data[provider].configs[key] = value;
        }
        if (configVersion) this._apiConfigsCache.data[provider].config_version = configVersion;
        this._apiConfigsCache.fetchedAt = Date.now();
        // Persist để content.js + popup windows sync
        this._writeApiConfigsCache(this._apiConfigsCache);
        if (window.eventBus) {
          window.eventBus.emit('provider:api_config_updated', { provider, key, type, value });
        }
        // Notify content scripts qua background broadcast (giống dom_selector_updated)
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: 'providerApiConfigUpdated', data }).catch(() => {});
        }
      } else {
        // No cache hoặc thiếu value → invalidate + refetch + emit SAU khi fetch xong
        this._apiConfigsCache = null;
        this._apiConfigsFetchPromise = null;
        this._fetchApiConfigs().then(() => {
          if (window.eventBus) {
            window.eventBus.emit('provider:api_config_updated', { provider, key, type, value });
          }
        }).catch(() => {
          // Emit kể cả khi fetch fail (consumer dùng fallback)
          if (window.eventBus) {
            window.eventBus.emit('provider:api_config_updated', { provider, key, type, value });
          }
        });
      }
    }
  }

  static _notifyProviderUnavailable(provider, status, name) {
    const messages = {
      disabled: `${name} đã bị tắt tạm thời.`,
      maintenance: `${name} đang bảo trì. Vui lòng thử lại sau.`,
    };

    if (window.SlncTrZNotify) {
      window.SlncTrZNotify.warning(messages[status] || `${name} không khả dụng.`);
    }
  }

  /**
   * Report selector failure (throttled)
   */
  static _recentFailures = new Map();

  static reportFailure(provider, key, triedSelectors) {
    const throttleKey = `sel_fail_${provider}_${key}`;
    if (this._recentFailures.has(throttleKey)) return;

    this._recentFailures.set(throttleKey, Date.now());
    setTimeout(() => this._recentFailures.delete(throttleKey), 5 * 60 * 1000);

    this._getApiBaseUrl().then(baseUrl => {
      fetch(`${baseUrl}/api/v1/analytics/selector-failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          key,
          tried_selectors: triedSelectors,
          page_url: location?.hostname + location?.pathname,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    });
  }

  // Storage helpers
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
        } catch {}
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
        } catch {}
        resolve();
      }
    });
  }

  // ─── API configs persistence (cho content.js access) ────────────────────
  static async _readApiConfigsCache() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([this._API_CONFIGS_CACHE_KEY], res => {
          resolve(res[this._API_CONFIGS_CACHE_KEY] || null);
        });
      } else {
        try {
          const cached = localStorage.getItem(this._API_CONFIGS_CACHE_KEY);
          resolve(cached ? JSON.parse(cached) : null);
        } catch {
          resolve(null);
        }
      }
    });
  }

  static async _writeApiConfigsCache(data) {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [this._API_CONFIGS_CACHE_KEY]: data }, resolve);
      } else {
        try {
          localStorage.setItem(this._API_CONFIGS_CACHE_KEY, JSON.stringify(data));
        } catch {}
        resolve();
      }
    });
  }

  static async _getApiBaseUrl() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['af_api_url'], res => {
          resolve(res.af_api_url || '');
        });
      } else {
        resolve('');
      }
    });
  }
}

// Export for different contexts
if (typeof window !== 'undefined') {
  window.ProviderConfigManager = ProviderConfigManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProviderConfigManager;
}
