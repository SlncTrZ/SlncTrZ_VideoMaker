/**
 * chat-content-grok.js — Content script inject ON-DEMAND vào grok.com.
 *
 * Phase G-2 (Core foundation) cho Grok integration. Mirror pattern
 * chat-content-chatgpt.js (Phase CG-2/CG-3) nhưng dùng DOM Grok thực tế.
 *
 * Trách nhiệm chính:
 *  - Tìm editor TipTap/ProseMirror, clear, insertText, submit qua Enter key.
 *  - Apply settings: mode (image/video), ratio dropdown, image_quality (image), duration + resolution (video).
 *  - Upload ref images qua hidden file input.
 *  - Snapshot URL baseline → wait redirect sang /imagine/post/{uuid} → extract media URLs.
 *  - Detect login + error patterns (RATE_LIMIT/CONTENT_BLOCKED/NETWORK).
 *  - Listener `grok:submitAndWait`: full submit pipeline trả về { success, mediaUrls, ... }.
 *  - Theo dõi navigate (SPA) → báo background.js để GrokSession invalidate cache.
 *
 * Dùng cùng pattern execCommand + KeyboardEvent giống grok-extension (verified).
 * KHÔNG dùng bridge — Grok ProseMirror chấp nhận execCommand trực tiếp.
 */

(function() {
  // Phase G-2: Cờ chung để background.js (grok:injectScript) nhận biết script đã load.
  // Đặt TRƯỚC guard để dù script bị inject lại lần 2 thì flag vẫn = true (idempotent).
  window.__slnctrzGrokLoaded__ = true;

  // Guard against double injection
  if (window._grokInjected) return;
  window._grokInjected = true;

  // Helper: sleep
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ============ Dynamic Selector System (DOM Resilience) ============
  // Priority: Backend config → Hardcoded defaults
  const PROVIDER = 'grok';
  let _selectorConfig = null;
  let _selectorConfigTime = 0;
  const _SELECTOR_CACHE_TTL = 30000; // 30s

  /**
   * Tier 3 fallback selectors — MUST MATCH PCM._DEFAULTS.grok
   * Used when chrome.storage (server data) unavailable.
   * CI script `check_selector_drift.js` verifies sync with backend seed.
   * Total: 22 keys (12 initial + 10 added 2026-05-18)
   */
  const _FALLBACK_SELECTORS = {
    composer: ['form div[contenteditable="true"]', '.ProseMirror', '.tiptap'],
    submit_button: ['button[type="submit"][aria-label="Submit"]', 'button[aria-label="Submit"]', 'button[type="submit"]'],
    stop_button: ['button[aria-label="Stop"]', '[aria-label="Stop generating"]'],
    result_container: ['[data-testid="result-container"]', 'main article', 'div[id^="imagine-masonry-section-"]'],
    result_image: ['img[src^="https://"]'],
    result_video: ['video', 'video source'],
    cloudflare_iframe: ['iframe[src*="challenges.cloudflare.com"]', 'iframe[src*="turnstile"]'],
    cloudflare_turnstile: ['.cf-turnstile', '[data-cf-turnstile]'],
    generation_mode: ['[role="radiogroup"][aria-label="Generation mode"]'],
    ratio_button: ['button[aria-label="Aspect Ratio"]', 'div.inline-flex > button'],
    file_input: ['input[type="file"][accept="image/*"]', 'input[type="file"]'],
    back_button: ['div[aria-label="Back"]', 'button[aria-label="Back"]'],
    image_quality_picker: ['[role="radiogroup"][aria-label="Image generation speed"]'],
    video_duration_picker: ['[role="radiogroup"][aria-label="Video duration"]'],
    video_resolution_picker: ['[role="radiogroup"][aria-label="Video resolution"]'],
    age_verification_modal: ['[data-analytics-name="age_verification"]'],
    saved_button: ['a[aria-label="Saved"]', 'button[aria-label="Saved"]'],
    imagine_link: ['a[href="/imagine"]', 'a[href="/imagine/"]', 'button[aria-label="Imagine"]'],
    remove_image_button: ['button[aria-label="Remove image"]'],
    grok_cdn_image: ['img[src*="assets.grok.com"]'],
    auth_link: ['a[href*="/login"]', 'a[href*="/signin"]', 'a[href*="auth"]'],
    open_menu: ['[data-radix-popper-content-wrapper]', '[role="menu"]'],
  };

  function _getDynamicSelector(key) {
    const now = Date.now();
    if (_selectorConfig && (now - _selectorConfigTime) < _SELECTOR_CACHE_TTL) {
      return _selectorConfig?.[PROVIDER]?.selectors?.[key] || null;
    }
    chrome.storage.local.get(['toby_provider_configs'], (res) => {
      if (res.toby_provider_configs?.data) {
        _selectorConfig = res.toby_provider_configs.data;
        _selectorConfigTime = Date.now();
      }
    });
    return _selectorConfig?.[PROVIDER]?.selectors?.[key] || null;
  }

  function _queryWithFallback(key, defaultSelectors = null) {
    const config = _getDynamicSelector(key);
    const hardcoded = defaultSelectors || _FALLBACK_SELECTORS[key] || [];
    const isDynamic = config?.selectors?.length > 0;
    const selectors = isDynamic ? config.selectors : hardcoded;

    console.log(`[Selector:${PROVIDER}:${key}] ${isDynamic ? '🌐 DYNAMIC' : '📦 HARDCODED'} | Trying ${selectors.length} selectors`);

    for (let i = 0; i < selectors.length; i++) {
      try {
        const el = document.querySelector(selectors[i]);
        if (el) {
          console.log(`[Selector:${PROVIDER}:${key}] ✅ Match #${i + 1}: ${selectors[i]}`);
          return el;
        }
      } catch (e) { /* invalid selector */ }
    }
    console.log(`[Selector:${PROVIDER}:${key}] ❌ No match`);
    return null;
  }

  function _queryAllWithFallback(key, defaultSelectors = null) {
    const config = _getDynamicSelector(key);
    const hardcoded = defaultSelectors || _FALLBACK_SELECTORS[key] || [];
    const selectors = config?.selectors?.length > 0 ? config.selectors : hardcoded;

    for (let i = 0; i < selectors.length; i++) {
      try {
        const els = document.querySelectorAll(selectors[i]);
        if (els.length > 0) return els;
      } catch (e) { /* invalid selector */ }
    }
    return [];
  }

  // ============ Macro-delay giữa các BƯỚC CHÍNH — sync với Flow's inputTimeout setting ============
  //
  // CHIẾN LƯỢC:
  //   - Micro-delay (sleep nhỏ trong sub-step như focus, dispatch event) → GIỮ HARDCODE
  //   - Macro-delay (gap giữa bước chính: settings → clear → upload → mention → insert → submit)
  //     → DÙNG getMacroDelay() = inputTimeout × 0.7. User control tốc độ tổng qua setting này.
  //
  // 2 biến tracking:
  //   __grokInputTimeoutMs: GIÁ TRỊ user setting (lấy từ payload, default 1200ms)
  //   __grokMacroDelayMs:   BIẾN TRUNG GIAN = 70% inputTimeoutMs
  let __grokInputTimeoutMs = 1200;
  let __grokMacroDelayMs = Math.round(1200 * 0.7);  // 840ms

  function getMacroDelay() {
    return __grokMacroDelayMs;
  }

  // Helper: simulateClick — full pointer/mouse event chain (Radix UI cần PointerEvent)
  function simulateClick(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerType: 'mouse' };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  // Helper: clickViaReact — gọi React onClick handler trực tiếp (Radix menu items)
  function clickViaReact(el) {
    if (!el) return false;
    const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
    if (propsKey && el[propsKey] && typeof el[propsKey].onClick === 'function') {
      el[propsKey].onClick({
        preventDefault() {},
        stopPropagation() {},
        nativeEvent: new MouseEvent('click', { bubbles: true }),
        type: 'click', target: el, currentTarget: el,
      });
      return true;
    }
    return false;
  }

  // Helper: waitForElement
  async function waitForElement(selector, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = document.querySelector(selector);
      if (el) return el;
      await sleep(300);
    }
    return null;
  }

  // ============ G-2.2: findGrokEditor ============
  // Verified từ grok-extension/grok-content.js — TipTap/ProseMirror.
  // Priority: Backend config → form contenteditable → .ProseMirror → .tiptap → any contenteditable.
  function findGrokEditor() {
    return _queryWithFallback('composer');
  }

  // ============ Pattern config (admin-tunable) ============
  // Patterns được wire qua admin /admin/system-settings?section=grok → endpoint
  // GET /api/v1/system-config/grok → GrokConfig fetch + cache vào
  // chrome.storage.local.af_grok_config (TTL 1h).
  //
  // Content script đọc storage on init, fallback hardcoded patterns nếu storage rỗng
  // (lần đầu install / fetch fail / chưa có sidebar mở).
  // Khi admin đổi pattern + extension refresh cache → next reload tab grok.com sẽ load patterns mới.

  // Fallback hardcode (giữ làm safety net khi storage chưa có config)
  const FALLBACK_GROK_PATTERNS = {
    rateLimit: [
      'rate limit', 'too many requests', 'please wait',
      'limit reached', 'try again later', 'you have used all',
    ],
    contentBlocked: [
      'content policy', 'cannot generate', "can't generate",
      'violates', 'safety', 'unable to create', 'inappropriate content',
    ],
    network: [
      'network error', 'connection error', 'failed to fetch', 'something went wrong',
    ],
    cloudflare: [
      "making sure you're human",
      'verifying',
      'just a moment',
      'checking your browser',
      'i am not a robot',
      'please verify',
    ],
    subscriptionRequired: [
      'unlock your creativity with imagine',
      'subscribe to',
      'upgrade to continue',
      'subscription required',
      'premium required',
      'superx premium',
      'get premium',
    ],
  };

  let _grokPatterns = { ...FALLBACK_GROK_PATTERNS };

  function _parsePatternStr(str) {
    if (!str || typeof str !== 'string') return [];
    return str.split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  async function _loadGrokPatternsFromStorage() {
    try {
      const result = await new Promise((r) => chrome.storage.local.get(['af_grok_config'], r));
      const cfg = result?.af_grok_config?.data;
      if (!cfg) return;
      const next = {
        rateLimit: _parsePatternStr(cfg.rate_limit_text),
        contentBlocked: _parsePatternStr(cfg.content_blocked_text),
        network: _parsePatternStr(cfg.network_error_text),
        cloudflare: _parsePatternStr(cfg.cloudflare_challenge_text),
        subscriptionRequired: _parsePatternStr(cfg.subscription_required_text),
      };
      // Chỉ override field nào có giá trị từ admin (rỗng → giữ fallback)
      for (const k of Object.keys(next)) {
        if (next[k].length > 0) _grokPatterns[k] = next[k];
      }
      console.log('[Grok] patterns loaded from admin config');
    } catch (e) { /* ignore — giữ fallback */ }
  }

  // Init load — async, hoàn thành trước khi user submit prompt đầu tiên (vài giây sau)
  _loadGrokPatternsFromStorage();

  // Listen storage changes — khi sidebar refresh GrokConfig, tab grok.com cũng cập nhật
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.af_grok_config) {
        _loadGrokPatternsFromStorage();
      }
    });
  } catch (e) { /* ignore in non-extension context */ }

  // ============ Cloudflare challenge detection ============
  // Grok dùng Cloudflare turnstile. Tab inactive → turnstile có thể KHÔNG tự complete →
  // DOM operations chạy nhưng request bị Cloudflare block → gen processing mãi mãi.
  //
  // Detect strategies (mạnh → yếu):
  //   1. iframe[src*="challenges.cloudflare.com" / "turnstile"] — selector mạnh, locale-agnostic
  //   2. .cf-turnstile, [data-cf-turnstile] — container class, locale-agnostic
  //   3. Text overlay match patterns (admin-tunable qua _grokPatterns.cloudflare)
  //      → fallback khi Cloudflare đổi locale (Vietnamese/Thai/Japanese...)
  function detectCloudflareChallenge() {
    // Pattern 1: turnstile iframe (dynamic selector)
    if (_queryWithFallback('cloudflare_iframe')) return true;

    // Pattern 2: turnstile container div (dynamic selector)
    if (_queryWithFallback('cloudflare_turnstile')) return true;

    // Pattern 3: text indicator (admin-tunable). Chỉ scan element overlay (fixed/dialog)
    // để tránh false positive khi text xuất hiện trong content thông thường.
    const cloudflarePatterns = _grokPatterns.cloudflare;
    if (cloudflarePatterns.length === 0) return false;
    const overlays = document.querySelectorAll('div[class*="fixed"], div[role="dialog"], body > div');
    for (const el of overlays) {
      const txt = (el.innerText || '').toLowerCase();
      if (cloudflarePatterns.some(p => txt.includes(p))) {
        // Verify still visible
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') return true;
      }
    }
    return false;
  }

  // Attempt to trigger Cloudflare turnstile verification
  // Multiple strategies based on 2026 research:
  // 1. Gọi turnstile API nếu available (execute/reset)
  // 2. Focus + click vào turnstile iframe
  // 3. Click vào page để trigger general interaction
  // 4. Keyboard events (Space/Enter) trên focused element
  function attemptCloudflareClick() {
    console.log('[Grok] Attempting Cloudflare verification trigger...');

    // Strategy 0: Gọi Cloudflare Turnstile API nếu available
    // Turnstile expose window.turnstile với các methods: execute(), reset(), getResponse()
    if (window.turnstile) {
      try {
        // Tìm widget ID từ iframe hoặc container
        const turnstileIframe = document.querySelector('iframe[id^="cf-chl-widget"]');
        const widgetId = turnstileIframe?.id?.replace('cf-chl-widget-', '') || null;

        if (typeof window.turnstile.execute === 'function') {
          console.log('[Grok] Calling turnstile.execute()...');
          window.turnstile.execute(widgetId);
        } else if (typeof window.turnstile.reset === 'function') {
          console.log('[Grok] Calling turnstile.reset() to retry verification...');
          window.turnstile.reset(widgetId);
        }
      } catch (e) {
        console.warn('[Grok] Turnstile API call failed:', e.message);
      }
    }

    // Strategy 1: Focus + click vào turnstile iframe
    // Iframe ID pattern: cf-chl-widget-xxxxx
    const turnstileIframe = document.querySelector('iframe[id^="cf-chl-widget"], iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"]');
    if (turnstileIframe) {
      try {
        // Scroll into view để đảm bảo visible
        turnstileIframe.scrollIntoView({ behavior: 'instant', block: 'center' });

        // Focus iframe
        turnstileIframe.focus();

        const rect = turnstileIframe.getBoundingClientRect();
        // Click vào vị trí checkbox (thường ở bên trái, ~20px từ left, center vertically)
        const checkboxX = rect.left + 25;
        const checkboxY = rect.top + rect.height / 2;

        // Dispatch full mouse event sequence: mouseover → mousedown → mouseup → click
        const eventOptions = {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: checkboxX,
          clientY: checkboxY,
          button: 0,
          buttons: 1
        };

        turnstileIframe.dispatchEvent(new MouseEvent('mouseover', eventOptions));
        turnstileIframe.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        turnstileIframe.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        turnstileIframe.dispatchEvent(new MouseEvent('click', eventOptions));

        console.log('[Grok] Clicked turnstile iframe at checkbox position:', Math.round(checkboxX), Math.round(checkboxY));

        // Dispatch keyboard event (Space/Enter) sau khi focus — một số CF checks accept này
        turnstileIframe.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, bubbles: true }));
        turnstileIframe.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', keyCode: 32, bubbles: true }));
        console.log('[Grok] Dispatched Space key on turnstile iframe');
      } catch (e) {
        console.warn('[Grok] Turnstile iframe interaction failed:', e.message);
      }
    }

    // Strategy 2: Click vào turnstile container (nếu có)
    const turnstileContainer = document.querySelector('.cf-turnstile, [data-cf-turnstile]');
    if (turnstileContainer) {
      try {
        const rect = turnstileContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY
        });
        turnstileContainer.dispatchEvent(clickEvent);
        console.log('[Grok] Clicked turnstile container at', Math.round(centerX), Math.round(centerY));
      } catch (e) {
        console.warn('[Grok] Turnstile container click failed:', e.message);
      }
    }

    // Strategy 3: Focus window + click page body để trigger general interaction
    try {
      window.focus();
      document.body.focus();

      const bodyClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
      });
      document.body.dispatchEvent(bodyClickEvent);
      console.log('[Grok] Clicked page body center');
    } catch (e) {
      console.warn('[Grok] Body click failed:', e.message);
    }

    // Strategy 4: Trigger full mouse sequence (some CF checks look for realistic mouse behavior)
    try {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Mousemove from corner to center (simulate real mouse movement)
      for (let i = 0; i <= 5; i++) {
        const x = (centerX * i) / 5;
        const y = (centerY * i) / 5;
        document.body.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, view: window, clientX: x, clientY: y
        }));
      }

      // Full click sequence
      document.body.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true, cancelable: true, view: window,
        clientX: centerX, clientY: centerY, button: 0, buttons: 1
      }));
      document.body.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true, cancelable: true, view: window,
        clientX: centerX, clientY: centerY, button: 0, buttons: 0
      }));
      console.log('[Grok] Dispatched realistic mouse movement + click sequence');
    } catch (e) {
      console.warn('[Grok] Mouse sequence failed:', e.message);
    }
  }

  // Wait Cloudflare challenge resolved. Activate tab + thông báo background.
  // Poll DOM cho tới khi challenge biến mất (max timeoutMs).
  // Trả: true nếu resolved, false nếu timeout.
  async function waitForCloudflareResolved(timeoutMs = 120000) {
    if (!detectCloudflareChallenge()) return true; // Không có challenge

    console.warn('[Grok] Cloudflare challenge detected — request tab activate + auto-click + chờ verify');

    // Bug 49 fix (2026-05-13): Notify sidebar về challenge để show persistent notification.
    // User cần click vào màn hình verify nếu auto-click không qua được captcha.
    const _notifySidebar = (phase, elapsedSec = 0) => {
      try {
        chrome.runtime.sendMessage({
          action: 'cloudflare:challenge',
          provider: 'grok',
          phase, // 'detected' | 'waiting' | 'resolved' | 'timeout'
          elapsedSec,
          timeoutSec: Math.round(timeoutMs / 1000),
        }).catch(() => {});
      } catch (_) {}
    };
    _notifySidebar('detected', 0);

    // Notify background activate tab + bring window to front (cần user thấy).
    // Background có handler grok:ensureActive (CG-2 phase G-2). Add new flag focusWindow=true.
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'grok:ensureActive', focusWindow: true, reason: 'cloudflare_challenge' },
          () => resolve()
        );
      });
    } catch (_) {}

    // Chờ tab activate + DOM settle
    await sleep(500);

    // Attempt auto-click để trigger verification
    attemptCloudflareClick();

    // Poll cho đến khi challenge biến mất hoặc timeout
    const start = Date.now();
    let lastLog = 0;
    let clickAttempts = 1; // Đã click 1 lần ở trên
    const MAX_CLICK_ATTEMPTS = 5;
    const CLICK_RETRY_INTERVAL = 10000; // Retry click mỗi 10s

    while (Date.now() - start < timeoutMs) {
      if (isAbortActive()) return false;
      if (!detectCloudflareChallenge()) {
        const elapsedSec = Math.round((Date.now() - start) / 1000);
        console.log('[Grok] Cloudflare challenge resolved sau', elapsedSec, 's');
        _notifySidebar('resolved', elapsedSec);
        // Sleep nhỏ cho cookie/session settle
        await sleep(800);
        return true;
      }
      // Log mỗi 10s để user thấy đang chờ
      const elapsed = Date.now() - start;
      if (elapsed - lastLog >= 10000) {
        const elapsedSec = Math.round(elapsed / 1000);
        console.log('[Grok] Vẫn chờ Cloudflare challenge resolved...', elapsedSec, 's');
        lastLog = elapsed;
        _notifySidebar('waiting', elapsedSec);

        // Retry click mỗi 10s (max 5 lần)
        if (clickAttempts < MAX_CLICK_ATTEMPTS) {
          console.log('[Grok] Retry click attempt', clickAttempts + 1);
          attemptCloudflareClick();
          clickAttempts++;
        }
      }
      await sleep(800);
    }
    console.error('[Grok] Cloudflare challenge timeout sau', timeoutMs / 1000, 's');
    _notifySidebar('timeout', Math.round(timeoutMs / 1000));
    return false;
  }

  // ============ Age Verification Modal Detection & Handling ============
  // Grok hiển thị modal xác nhận tuổi khi submit prompt lần đầu.
  // Modal: [data-analytics-name="age_verification"]
  // Flow: detect modal → scroll đến năm >= 18 tuổi → click chọn → click Continue
  function detectAgeVerificationModal() {
    const modal = _queryWithFallback('age_verification_modal');
    return !!modal;
  }

  async function handleAgeVerificationModal(timeoutMs = 30000) {
    const modal = _queryWithFallback('age_verification_modal');
    if (!modal) return true; // Không có modal → pass

    console.log('[Grok] Age verification modal detected — auto-selecting birth year');

    try {
      // 1. Tìm scroll container chứa các năm
      const scrollContainer = modal.querySelector('.overflow-y-auto, [class*="snap-y"]');
      if (!scrollContainer) {
        console.warn('[Grok] Age verification: không tìm thấy scroll container');
        return false;
      }

      // 2. Tìm tất cả year buttons
      const yearButtons = scrollContainer.querySelectorAll('button[type="button"]');
      if (yearButtons.length === 0) {
        console.warn('[Grok] Age verification: không tìm thấy year buttons');
        return false;
      }

      // 3. Tìm năm để chọn (>= 18 tuổi, ví dụ năm 2000)
      const currentYear = new Date().getFullYear();
      const targetYear = currentYear - 25; // Chọn 25 tuổi để safe
      let targetButton = null;

      for (const btn of yearButtons) {
        const yearText = (btn.textContent || '').trim();
        const year = parseInt(yearText, 10);
        if (!isNaN(year) && year <= targetYear) {
          targetButton = btn;
          break;
        }
      }

      // Fallback: chọn năm 2000 hoặc năm gần targetYear nhất
      if (!targetButton) {
        for (const btn of yearButtons) {
          const yearText = (btn.textContent || '').trim();
          if (yearText === '2000' || yearText === '1995' || yearText === '1990') {
            targetButton = btn;
            break;
          }
        }
      }

      if (!targetButton) {
        console.warn('[Grok] Age verification: không tìm thấy năm phù hợp');
        return false;
      }

      // 4. Scroll đến button và click. Bug 52 fix: abort checks giữa các steps.
      if (isAbortActive()) return false;
      targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(300);
      if (isAbortActive()) return false;

      // Click via React hoặc simulateClick
      if (!clickViaReact(targetButton)) {
        simulateClick(targetButton);
      }
      console.log('[Grok] Age verification: đã chọn năm', targetButton.textContent?.trim());
      await sleep(500);
      if (isAbortActive()) return false;

      // 5. Tìm và click Continue button
      const continueBtn = modal.querySelector('button:not([disabled])');
      // Tìm button có text "Continue"
      const allBtns = modal.querySelectorAll('button[type="button"]');
      let continueBtnFound = null;
      for (const btn of allBtns) {
        const txt = (btn.textContent || '').toLowerCase().trim();
        if (txt === 'continue' && !btn.disabled) {
          continueBtnFound = btn;
          break;
        }
      }

      if (!continueBtnFound) {
        // Fallback: tìm button cuối cùng trong modal (thường là Continue)
        const footerBtns = modal.querySelectorAll('button.bg-button-filled, button[class*="bg-button"]');
        for (const btn of footerBtns) {
          if (!btn.disabled) {
            continueBtnFound = btn;
            break;
          }
        }
      }

      if (!continueBtnFound) {
        console.warn('[Grok] Age verification: Continue button vẫn disabled hoặc không tìm thấy');
        // Retry wait cho button enable. Bug 52 fix: abort check trong retry loop.
        const start = Date.now();
        while (Date.now() - start < 5000) {
          if (isAbortActive()) return false;
          await sleep(300);
          for (const btn of allBtns) {
            const txt = (btn.textContent || '').toLowerCase().trim();
            if (txt === 'continue' && !btn.disabled) {
              continueBtnFound = btn;
              break;
            }
          }
          if (continueBtnFound) break;
        }
      }

      if (continueBtnFound) {
        if (isAbortActive()) return false;
        if (!clickViaReact(continueBtnFound)) {
          simulateClick(continueBtnFound);
        }
        console.log('[Grok] Age verification: đã click Continue');
        await sleep(500);

        // 6. Wait modal close. Bug 52 fix: abort check trong close-wait loop.
        const closeStart = Date.now();
        while (Date.now() - closeStart < 5000) {
          if (isAbortActive()) return false;
          if (!_queryWithFallback('age_verification_modal')) {
            console.log('[Grok] Age verification: modal đã đóng');
            return true;
          }
          await sleep(200);
        }
        console.warn('[Grok] Age verification: modal chưa đóng sau 5s');
        return !_queryWithFallback('age_verification_modal');
      }

      return false;
    } catch (err) {
      console.error('[Grok] Age verification error:', err.message);
      return false;
    }
  }

  // ============ G-2.2: clearEditor ============
  // Reference grok-extension pattern: execCommand selectAll + delete (KHÔNG dùng bridge).
  async function clearEditor(editor) {
    if (!editor) editor = findGrokEditor();
    if (!editor) return false;

    editor.focus();
    await sleep(100);
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);

    // Fallback: dispatch beforeinput để TipTap nhận biết thay đổi
    editor.dispatchEvent(new InputEvent('beforeinput', {
      inputType: 'deleteContentBackward',
      bubbles: true, cancelable: true,
    }));

    if (!editor.textContent.trim()) return true;

    // Fallback cuối: direct innerHTML
    editor.innerHTML = '<p><br></p>';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
    return true;
  }

  // ============================================================================
  //  Grok insertText — Test verified 2026-05-09
  // ============================================================================
  //  Editor: TipTap/ProseMirror (`div[contenteditable="true"].tiptap.ProseMirror`)
  //  CRITICAL: loại bỏ '@' tránh trigger autocomplete (Enter sẽ chọn mention thay vì submit).
  //
  //  ┌─ INSERT (3 tier, tất cả VERIFIED work) ───────────────────────────────┐
  //  │ Tier 1 'execCommand'  PRIMARY  ✅ verified (Test 1 smoke)              │
  //  │   → document.execCommand('insertText', false, text)                   │
  //  │ Tier 2 'beforeInput'  FALLBACK ✅ verified (Test 2)                    │
  //  │   → editor.dispatchEvent(InputEvent('beforeinput'))                   │
  //  │ Tier 3 'innerHTML'    LAST     ✅ verified (Test 3)                    │
  //  │   → editor.innerHTML = '<p>...</p>' + InputEvent('input')             │
  //  └────────────────────────────────────────────────────────────────────────┘
  //
  //  ┌─ Force test (cross-world dataset, set qua DevTools console) ──────────┐
  //  │ ✅ document.documentElement.dataset.tobyGrokInsertForce = '<tier>'     │
  //  │    Reset: delete document.documentElement.dataset.tobyGrokInsertForce  │
  //  │ ❌ window.__GROK_INSERT_FORCE_TIER = ... — KHÔNG work qua DevTools     │
  //  │    (content script ISOLATED world ≠ DevTools console MAIN world)      │
  //  └────────────────────────────────────────────────────────────────────────┘
  async function insertText(editor, text) {
    if (!editor) editor = findGrokEditor();
    if (!editor) return false;

    const sanitized = String(text || '').replace(/@/g, '');
    // Force flag: content script chạy ISOLATED world → không thấy window.* set qua DevTools console (MAIN world).
    // Đọc cả 2: window.* (nếu set qua background) + documentElement.dataset.* (cross-world an toàn).
    // User set qua console: document.documentElement.dataset.tobyGrokInsertForce = 'beforeInput'
    const force = window.__GROK_INSERT_FORCE_TIER
               || document.documentElement.dataset.tobyGrokInsertForce
               || null;

    editor.focus();
    await sleep(200);

    function verifyInserted() {
      const sample = sanitized.substring(0, Math.min(10, sanitized.length));
      return editor.textContent.includes(sample);
    }

    const impls = {
      execCommand: function() {
        console.log('[Grok] Insert[execCommand] try');
        document.execCommand('insertText', false, sanitized);
      },
      beforeInput: function() {
        console.log('[Grok] Insert[beforeInput] try');
        editor.dispatchEvent(new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: sanitized,
          bubbles: true, cancelable: true,
        }));
      },
      innerHTML: function() {
        console.log('[Grok] Insert[innerHTML] try (last resort)');
        editor.innerHTML = `<p>${sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: sanitized }));
      },
    };
    const order = ['execCommand', 'beforeInput', 'innerHTML'];

    // Forced isolation
    if (force && impls[force]) {
      console.log('[Grok] Insert [FORCE=' + force + ']');
      try {
        impls[force]();
        return verifyInserted();
      } catch (e) {
        console.warn('[Grok] FORCE ' + force + ' failed:', e.message);
        return false;
      }
    }

    // Production chain
    for (const tier of order) {
      try {
        impls[tier]();
        if (verifyInserted()) {
          console.log('[Grok] ✅ Insert success via:', tier);
          return true;
        }
      } catch (e) {
        console.warn('[Grok] Insert ' + tier + ' error:', e.message);
      }
    }

    console.warn('[Grok] ❌ All insert tiers failed');
    return false;
  }

  // ============================================================================
  //  Grok clickSubmit — Test verified 2026-05-09
  // ============================================================================
  //  Verified DOM (data/dom/grok-dom/dom/grok-editor-dom.html):
  //    - Editor + submit button NẰM TRONG <form> wrapper                       ⭐
  //    - Submit button: type="submit", aria-label="Submit"
  //    - Submit button KHÔNG có __reactProps$ keys (Object.keys() = [])
  //      → reactPropsClick/reactOnClick DEAD CODE → đã BỎ
  //
  //  ┌─ SUBMIT (4 tier, tất cả VERIFIED work) ───────────────────────────────┐
  //  │ Tier 1 'formRequestSubmit' PRIMARY ✅ verified (Test 5)                │
  //  │   → form.requestSubmit(submitBtn) — HTML standard, native trusted     │
  //  │   ⭐ SILVER BULLET — KHÔNG cần fake event, resilient nhất             │
  //  │ Tier 2 'enterKey'         FALLBACK ✅ verified (Test 1 smoke)          │
  //  │   → KeyboardEvent('keydown' + 'keyup') trên editor                    │
  //  │ Tier 3 'simulateClick'    FALLBACK ✅ verified (Test 6)                │
  //  │   → PointerEvent + MouseEvent chain trên submit button                │
  //  │ Tier 4 'nativeClick'      LAST     ✅ verified (Test 7)                │
  //  │   → submitBtn.click()                                                 │
  //  │ ❌ 'reactPropsClick' / 'reactOnClick' — BỎ (verified dead — Test 4)    │
  //  │   → button không có __reactProps$ key                                 │
  //  └────────────────────────────────────────────────────────────────────────┘
  //
  //  ┌─ Force test (cross-world dataset, set qua DevTools console) ──────────┐
  //  │ ✅ document.documentElement.dataset.tobyGrokSubmitForce = '<tier>'     │
  //  │    Reset: delete document.documentElement.dataset.tobyGrokSubmitForce  │
  //  │ ❌ window.__GROK_SUBMIT_FORCE_METHOD = ... — KHÔNG work qua DevTools   │
  //  └────────────────────────────────────────────────────────────────────────┘
  async function clickSubmit(editor) {
    if (!editor) editor = findGrokEditor();
    if (!editor) return false;

    // Force flag cross-world (xem giải thích trong insertText)
    // User set qua console: document.documentElement.dataset.tobyGrokSubmitForce = 'reactPropsClick'
    const force = window.__GROK_SUBMIT_FORCE_METHOD
               || document.documentElement.dataset.tobyGrokSubmitForce
               || null;

    editor.focus();
    await sleep(200);

    function findSubmitBtn() {
      return _queryWithFallback('submit_button');
    }

    // Verify helper: poll mỗi 200ms tới 1500ms xem editor clear (signal Grok accept submit)
    // Trước: cố định 500ms → quá ngắn → fall through nhầm → multi-submit risk.
    // Mới: poll 200ms × 7 = 1400ms max, return sớm khi detect clear.
    async function verifySubmitted() {
      const maxMs = 1500;
      const interval = 200;
      let elapsed = 0;
      while (elapsed < maxMs) {
        await sleep(interval);
        elapsed += interval;
        const len = (editor.textContent || '').trim().length;
        if (len < 3) {
          console.log('[Grok] Submit verify: ✅ editor cleared after ' + elapsed + 'ms');
          return true;
        }
      }
      const finalLen = (editor.textContent || '').trim().length;
      console.log('[Grok] Submit verify: ❌ editor still has text after ' + maxMs + 'ms (len=' + finalLen + ')');
      return false;
    }

    // Method 1: Enter keydown trên editor (grok-extension reference pattern)
    // Verified primary — Grok form lắng nghe Enter → trigger native submit handler.
    async function tryEnterKey() {
      console.log('[Grok] Submit enterKey');
      editor.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13,
        bubbles: true, cancelable: true,
      }));
      editor.dispatchEvent(new KeyboardEvent('keyup', {
        key: 'Enter', code: 'Enter', keyCode: 13,
        bubbles: true,
      }));
      return true;
    }

    // Method 2: form.requestSubmit(submitBtn) — HTML standard, native trusted submit
    // Resilient NHẤT với trust check vì native API, KHÔNG cần fake event.
    // Verified DOM: Grok có <form> wrapping editor + button.
    async function tryFormRequestSubmit() {
      const submitBtn = findSubmitBtn();
      if (!submitBtn) {
        console.log('[Grok] formRequestSubmit skip: submit button NOT FOUND');
        return false;
      }
      const form = submitBtn.closest('form') || editor.closest('form');
      if (!form) {
        console.log('[Grok] formRequestSubmit skip: <form> ancestor NOT FOUND');
        return false;
      }
      if (typeof form.requestSubmit !== 'function') {
        console.log('[Grok] formRequestSubmit skip: form.requestSubmit not available');
        return false;
      }
      console.log('[Grok] Submit formRequestSubmit: native HTML form submit');
      try {
        form.requestSubmit(submitBtn);
        return true;
      } catch (e) {
        console.warn('[Grok] formRequestSubmit error:', e.message, '- fallback form.submit()');
        try { form.submit(); return true; } catch (e2) {
          console.warn('[Grok] form.submit() also failed:', e2.message);
          return false;
        }
      }
    }

    // Method 3: full pointer event chain
    async function trySimulateClick() {
      const submitBtn = findSubmitBtn();
      if (!submitBtn || submitBtn.disabled) return false;
      console.log('[Grok] Submit simulateClick');
      simulateClick(submitBtn);
      return true;
    }

    // Method 4: native btn.click() (last resort)
    async function tryNativeClick() {
      const submitBtn = findSubmitBtn();
      if (!submitBtn || submitBtn.disabled) return false;
      console.log('[Grok] Submit nativeClick');
      submitBtn.click();
      return true;
    }

    const impls = {
      formRequestSubmit: tryFormRequestSubmit,
      enterKey: tryEnterKey,
      simulateClick: trySimulateClick,
      nativeClick: tryNativeClick,
    };
    // Production order theo độ resilient với trust check (verified test 5/6/7: cả 4 đều work):
    //   1. formRequestSubmit — native HTML, KHÔNG cần fake event → silver bullet
    //   2. enterKey          — KeyboardEvent (có thể bị siết tương lai)
    //   3. simulateClick     — MouseEvent (có thể bị siết)
    //   4. nativeClick       — btn.click() (có thể bị siết)
    const order = ['formRequestSubmit', 'enterKey', 'simulateClick', 'nativeClick'];

    // Forced isolation
    if (force && impls[force]) {
      console.log('[Grok] Submit [FORCE=' + force + ']');
      try {
        const ok = await impls[force]();
        if (!ok) return false;
        return await verifySubmitted();
      } catch (e) {
        console.warn('[Grok] FORCE ' + force + ' failed:', e.message);
        return false;
      }
    }

    // Production chain
    for (const method of order) {
      try {
        const triggered = await impls[method]();
        if (!triggered) continue;
        if (await verifySubmitted()) {
          console.log('[Grok] ✅ Submit success via:', method);
          return true;
        }
      } catch (e) {
        console.warn('[Grok] Submit ' + method + ' error:', e.message);
      }
    }

    console.warn('[Grok] ❌ All submit methods failed');
    return false;
  }

  // ============ G-2.2: selectMode ============
  // Mode = 'image' | 'video'. Verified DOM:
  //   div[role="radiogroup"][aria-label="Generation mode"] → [role="radio"] có text "Image"/"Video"
  // Strategy 1: aria-label match
  // Strategy 2: SVG path fallback (Image: M14.0996 2.5 / Video: M12 4C14.4853)
  function selectMode(mode) {
    const targetText = mode === 'video' ? 'Video' : 'Image';

    // Strategy 1: aria-label radiogroup (dynamic selector)
    const group = _queryWithFallback('generation_mode');
    if (group) {
      const radios = group.querySelectorAll('[role="radio"]');
      for (const radio of radios) {
        const text = (radio.textContent || '').trim();
        if (text.toLowerCase() === targetText.toLowerCase() ||
            text.toLowerCase().includes(targetText.toLowerCase())) {
          if (radio.getAttribute('aria-checked') === 'true') return true; // already selected
          simulateClick(radio);
          return true;
        }
      }
    }

    // Strategy 2: SVG path match
    const pathPrefix = mode === 'video' ? 'M12 4C14.4853' : 'M14.0996 2.5';
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      const path = btn.querySelector(`path[d^="${pathPrefix}"]`);
      if (path) {
        simulateClick(btn);
        return true;
      }
    }

    return false;
  }

  // ============ G-2.2: selectRatio ============
  // Aspect Ratio = DROPDOWN (Radix menu), KHÔNG phải radiogroup.
  // Flow: click button[aria-label="Aspect Ratio"] → menu mở → click menu item.
  // Input ratioKey: 'portrait'/'landscape'/'square'/'story'/'widescreen'.
  // Map sang display string Grok: 2:3, 3:2, 1:1, 9:16, 16:9.
  async function selectRatio(ratioKey) {
    const displayMap = {
      portrait: '2:3',
      landscape: '3:2',
      square: '1:1',
      story: '9:16',
      widescreen: '16:9',
    };
    const targetRatio = displayMap[ratioKey] || ratioKey;

    const ratioBtn = _queryWithFallback('ratio_button');
    if (!ratioBtn) return false;

    // Skip nếu đã đúng
    const currentRatio = ratioBtn.querySelector('span')?.textContent?.trim();
    if (currentRatio === targetRatio) return true;

    // Mở dropdown nếu chưa mở
    const isOpen = ratioBtn.getAttribute('data-state') === 'open' ||
                   ratioBtn.getAttribute('aria-expanded') === 'true' ||
                   ratioBtn.closest('[data-state]')?.dataset.state === 'open';
    if (!isOpen) {
      simulateClick(ratioBtn);
      await sleep(500);
      const menuVisible = document.querySelector('[data-radix-popper-content-wrapper]') ||
                          document.querySelector('[role="menu"]');
      if (!menuVisible) {
        clickViaReact(ratioBtn);
        await sleep(500);
      }
    }

    // Strategy 1: button[aria-label="{ratio}"]
    let menuItem = document.querySelector(`button[aria-label="${targetRatio}"]`);

    // Strategy 2: menu items với span text match
    if (!menuItem) {
      const items = document.querySelectorAll('div[role="menuitem"], [role="menuitemradio"], [role="option"]');
      for (const item of items) {
        const span = item.querySelector('span');
        if (span && span.textContent.trim() === targetRatio) {
          menuItem = item;
          break;
        }
      }
    }

    // Strategy 3: broad search trong Radix poppers (retry 5 lần)
    if (!menuItem) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const poppers = document.querySelectorAll('[data-radix-popper-content-wrapper]');
        for (const popper of poppers) {
          const allEls = popper.querySelectorAll('span, div, button');
          for (const el of allEls) {
            if (el.textContent.trim() === targetRatio) {
              menuItem = el.closest('[role="menuitem"], [role="menuitemradio"], button, div[tabindex]') || el;
              break;
            }
          }
          if (menuItem) break;
        }
        if (menuItem) break;
        await sleep(150);
      }
    }

    if (menuItem) {
      simulateClick(menuItem);
      await sleep(200);
      // Verify
      const newRatio = ratioBtn.querySelector('span')?.textContent?.trim();
      if (newRatio === targetRatio) return true;

      // Fallback clickViaReact
      clickViaReact(menuItem);
      await sleep(200);
      return true;
    }

    // Đóng menu khi không tìm thấy
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return false;
  }

  // ============ G-2.2: selectVideoDuration ============
  function selectVideoDuration(duration) {
    if (!['6s', '10s'].includes(duration)) return false;
    const group = _queryWithFallback('video_duration_picker');
    if (group) {
      const radios = group.querySelectorAll('[role="radio"]');
      for (const radio of radios) {
        if ((radio.textContent || '').trim() === duration) {
          if (radio.getAttribute('aria-checked') === 'true') return true;
          simulateClick(radio);
          return true;
        }
      }
    }
    return false;
  }

  // ============ G-2.2: selectVideoResolution ============
  function selectVideoResolution(resolution) {
    if (!['480p', '720p'].includes(resolution)) return false;
    const group = _queryWithFallback('video_resolution_picker');
    if (group) {
      const radios = group.querySelectorAll('[role="radio"]');
      for (const radio of radios) {
        if ((radio.textContent || '').trim() === resolution) {
          if (radio.getAttribute('aria-checked') === 'true') return true;
          simulateClick(radio);
          return true;
        }
      }
    }
    return false;
  }

  // ============ selectImageQuality ============
  // Image quality radiogroup mới (Grok update 2026-04). DOM:
  //   <div role="radiogroup" aria-label="Image generation speed">
  //     <div role="radio">Speed</div>
  //     <div role="radio">Quality</div>
  //   </div>
  // Chỉ hiện ở mode=image, không có ở mode=video.
  function selectImageQuality(quality) {
    // Accept lowercase ('speed'/'quality') hoặc display ('Speed'/'Quality')
    const target = String(quality || '').toLowerCase();
    if (target !== 'speed' && target !== 'quality') return false;
    const displayText = target === 'speed' ? 'Speed' : 'Quality';
    const group = _queryWithFallback('image_quality_picker');
    if (!group) return false; // Không có ở mode=video
    const radios = group.querySelectorAll('[role="radio"]');
    for (const radio of radios) {
      if ((radio.textContent || '').trim() === displayText) {
        if (radio.getAttribute('aria-checked') === 'true') return true;
        simulateClick(radio);
        return true;
      }
    }
    return false;
  }

  // ============ G-2.2: applyGrokSettings ============
  // Apply settings tuần tự: mode → ratio → image_quality (image) → duration → resolution (video).
  async function applyGrokSettings(settings) {
    const { mode, ratio, duration, resolution, imageQuality } = settings || {};
    let ok = true;

    if (mode) {
      const modeOk = selectMode(mode);
      await sleep(300); // chờ video controls xuất hiện/biến mất
      if (!modeOk) ok = false;
    }
    if (ratio) {
      const ratioOk = await selectRatio(ratio);
      await sleep(200);
      if (!ratioOk) ok = false;
    }
    // Image quality (Speed/Quality) — CHỈ apply khi mode='image'.
    // Mode='video' không có radiogroup này → selectImageQuality return false → KHÔNG fail toàn bộ.
    if (imageQuality && mode === 'image') {
      const qOk = selectImageQuality(imageQuality);
      await sleep(200);
      // Không gán ok=false nếu không match — Grok có thể chưa render radiogroup ngay sau setMode.
      // Best-effort apply, log warning để debug.
      if (!qOk) console.warn('[Grok] selectImageQuality failed:', imageQuality);
    }
    if (duration) {
      const durOk = selectVideoDuration(duration);
      await sleep(200);
      if (!durOk) ok = false;
    }
    if (resolution) {
      const resOk = selectVideoResolution(resolution);
      await sleep(200);
      if (!resOk) ok = false;
    }

    return ok;
  }

  // ============ removeExistingRefImages ============
  // Reference grok-extension/grok-content.js — xóa ref images cũ trên editor TRƯỚC upload mới.
  // Grok DOM: button[aria-label="Remove image"] có opacity-0 (ẩn) → click qua React onClick
  // (bypass CSS opacity hoàn toàn). Fallback: simulateClick.
  async function removeExistingRefImages() {
    const removeImageBtns = _queryAllWithFallback('remove_image_button');
    let removedCount = 0;

    for (const btn of removeImageBtns) {
      const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'));
      if (propsKey && btn[propsKey]?.onClick) {
        try {
          btn[propsKey].onClick({
            preventDefault: function(){}, stopPropagation: function(){},
            nativeEvent: new MouseEvent('click', { bubbles: true }),
            type: 'click', target: btn, currentTarget: btn,
          });
        } catch (_) {
          btn.style.opacity = '1';
          simulateClick(btn);
        }
      } else {
        btn.style.opacity = '1';
        simulateClick(btn);
      }
      removedCount++;
      await sleep(300);
    }

    // Fallback: broad selectors khác (Remove file, Cancel, ...)
    if (removedCount === 0) {
      const cancelBtns = document.querySelectorAll(
        'button[aria-label="Remove"], button[aria-label="Cancel"], ' +
        'button[aria-label="Delete"], button[aria-label="Remove file"]'
      );
      const editorForm = document.querySelector('form');
      for (const btn of cancelBtns) {
        const isInForm = editorForm && editorForm.contains(btn);
        const isUploadRelated = btn.closest('[class*="upload"]') || btn.closest('[class*="preview"]');
        if (isInForm || isUploadRelated) {
          simulateClick(btn);
          removedCount++;
          await sleep(200);
        }
      }
    }

    if (removedCount > 0) {
      console.log(`[Grok] removeExistingRefImages: đã xóa ${removedCount} ref image(s) cũ`);
    }
    return removedCount;
  }

  // ============ G-2.2: uploadImages ============
  // Upload ref images qua hidden file input (verified DOM grok-extension).
  // input[type="file"][accept="image/*"][name="files"]
  // CRITICAL — Reference grok-extension/grok-content.js addRefImages:
  //   - Inject file vào hidden input + dispatch change + React onChange
  //   - waitForUploadComplete timeout 30s (file lớn cần thời gian)
  //   - Detect failed upload (svg.lucide-triangle-alert) → remove
  //   - successCount: KHÔNG strict — file đã inject vào input đếm là đã xử lý
  //     (Grok upload background, @mention dropdown sẽ pick up)
  async function uploadImages(images) {
    if (!Array.isArray(images) || images.length === 0) return { success: true, count: 0 };

    let injectedCount = 0;
    let completedCount = 0;
    for (const data of images) {
      if (!data?.base64) continue;

      try {
        const binary = atob(data.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const file = new File([bytes], data.name || 'ref.png', { type: data.type || 'image/png' });

        const fileInput = _queryWithFallback('file_input');
        if (!fileInput) {
          console.warn('[Grok] uploadImages: file input not found');
          continue;
        }

        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Trigger React onChange qua __reactProps$
        const propsKey = Object.keys(fileInput).find(k => k.startsWith('__reactProps$'));
        if (propsKey && typeof fileInput[propsKey]?.onChange === 'function') {
          fileInput[propsKey].onChange({
            target: fileInput, currentTarget: fileInput,
            preventDefault() {}, stopPropagation() {},
            nativeEvent: new Event('change'),
            type: 'change',
          });
        }

        injectedCount++;
        console.log(`[Grok] uploadImages: injected file ${injectedCount}/${images.length} (${data.name || 'ref.png'})`);

        // Wait initial 1s + poll upload status (timeout 30s match grok-extension)
        const uploadOk = await waitForUploadComplete(30000);
        if (uploadOk) completedCount++;
      } catch (err) {
        console.warn('[Grok] uploadImages error:', err.message);
      }
    }

    // CRITICAL: success = injectedCount > 0 (NOT completedCount).
    // File đã inject vào input → Grok đã nhận → @mention dropdown sẽ pick up.
    // Nếu ép completedCount, timeout dài → false negative → REF_UPLOAD_FAILED → block flow.
    return {
      success: injectedCount > 0,
      count: injectedCount,
      completed: completedCount,
      total: images.length,
    };
  }

  // Helper: chờ upload complete (reference grok-extension waitForUploadComplete pattern)
  // Bug 50 fix: interruptibleSleep + isAbortActive check để user forceStop break sớm
  // (không phải đợi full 1s initial + poll cycles).
  async function waitForUploadComplete(timeout = 30000) {
    // Initial wait 1s — chờ Grok bắt đầu xử lý upload
    await interruptibleSleep(1000, 'upload-initial-wait');

    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (isAbortActive()) return false;
      // Check failed upload — svg.lucide-triangle-alert
      const failed = document.querySelector('svg.lucide-triangle-alert');
      if (failed) {
        console.warn('[Grok] Upload ảnh thất bại, xóa upload lỗi...');
        const removeBtn = failed.closest('button') ||
                          document.querySelector('button svg.lucide-x')?.closest('button');
        if (removeBtn) {
          simulateClick(removeBtn);
          await sleep(500);
        }
        return false;
      }

      // Check still uploading: span.animate-pulse hoặc div.animate-spin
      const loading = document.querySelector('span.animate-pulse, div.animate-spin');
      if (!loading) return true;
      await sleep(300);
    }
    console.warn('[Grok] waitForUploadComplete timeout');
    return false;
  }

  // ============ G-2.2: snapshotConversationState ============
  // Snapshot URL + thumbnail count để waitForResultPage biết khi nào đã đổi state.
  function snapshotConversationState() {
    return {
      url: window.location.href,
      timestamp: Date.now(),
    };
  }

  // ============ G-2.2: waitForResultPage ============
  // Poll URL change → khi match `/imagine/post/{uuid}` → return baseline.
  async function waitForResultPage(baseline, timeout = 60000) {
    const startTime = Date.now();
    const POLL_INTERVAL = 500;

    while (Date.now() - startTime < timeout) {
      // Abort check — user click Stop → click Grok Stop button + break sớm.
      if (isAbortActive()) {
        console.log('[Grok-wait] Aborted → clicking Stop button');
        await clickGrokStopButton();
        return { redirected: false, url: window.location.href, aborted: true };
      }
      // Subscribe modal check — Grok hiện modal khi user chưa có plan
      if (detectSubscribeModal()) {
        return { redirected: false, url: window.location.href, subscriptionRequired: true };
      }
      const currentUrl = window.location.href;
      // Đã redirect sang /imagine/post/{uuid} → return
      if (currentUrl !== baseline.url && currentUrl.includes('/imagine/post/')) {
        return { redirected: true, url: currentUrl };
      }
      await sleep(POLL_INTERVAL);
    }
    return { redirected: false, url: window.location.href };
  }

  // ============ findGenerationProgress ============
  // Tìm "Generating XX%" indicator trong placeholder Grok đang gen.
  // DOM pattern: <span>Generating</span><span class="...animate-pulse">23%</span>
  //
  // Return: số percent (0-100) nếu đang gen, null nếu không có placeholder
  // (= chưa start hoặc đã xong).
  function findGenerationProgress() {
    if (!window.location.href.includes('/imagine/post/')) return null;
    // Tìm span text matching ^XX%$ với parent có chứa "Generating"
    const allSpans = document.querySelectorAll('span');
    for (const span of allSpans) {
      const text = (span.textContent || '').trim();
      const match = text.match(/^(\d{1,3})%$/);
      if (!match) continue;
      const pct = parseInt(match[1], 10);
      if (pct < 0 || pct > 100) continue;
      // Verify nearby (parent or sibling) chứa "Generating" text → tránh nhầm với % khác
      const parent = span.parentElement;
      if (!parent) continue;
      const parentText = parent.textContent || '';
      if (/generating/i.test(parentText)) {
        return pct;
      }
    }
    return null;
  }

  // ============ G-2.2: extractImageUrls ============
  // Quét DOM result page (`/imagine/post/{uuid}`) tìm media URLs từ assets.grok.com.
  // Loại blur loading + ref images (excludeUrls).
  function extractImageUrls(excludeUrls = null) {
    if (!window.location.href.includes('/imagine/post/')) return { mediaUrls: [], mediaType: 'image' };

    const container = _queryWithFallback('result_container', [
      '[data-testid="result-container"]', 'main article', 'div[id^="imagine-masonry-section-"]',
      '[data-testid="drop-container"]', 'main'
    ]);
    if (!container) return { mediaUrls: [], mediaType: 'image' };

    const seenUrls = new Set();
    const mediaUrls = [];
    let mediaType = 'image';

    // Videos: ưu tiên detect video trước
    const videos = container.querySelectorAll('video');
    for (const video of videos) {
      const src = video.src || video.querySelector('source')?.src;
      if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
        const baseUrl = src.split('?')[0];
        if (seenUrls.has(baseUrl)) continue;
        seenUrls.add(baseUrl);
        mediaUrls.push(src);
        mediaType = 'video';
      }
    }

    // Images: nếu không có video thì lấy image
    if (mediaUrls.length === 0) {
      const imgs = container.querySelectorAll('img[src^="https://"]');
      for (const img of imgs) {
        if (img.alt === 'Loading') continue;
        if (img.className && (img.className.includes('blur-sm') || img.className.includes('blur-md'))) continue;
        if (img.width <= 10 || img.height <= 10) continue;
        if (img.naturalWidth > 0 && img.naturalWidth <= 10) continue;
        if (img.alt && img.alt.startsWith('Thumbnail')) continue;
        if (img.alt === 'Most recent favorite') continue;
        if (img.closest('nav') || img.closest('aside') || img.closest('[aria-label="Saved"]')) continue;

        const isFromGrokCdn = img.src.includes('assets.grok.com') || img.src.includes('grok.x.ai');
        const isAvatar = img.src.includes('/avatar') || img.src.includes('/profile');
        const isLogo = img.src.includes('/logo') || img.src.includes('/icon');
        if (!isFromGrokCdn || isAvatar || isLogo) continue;

        const baseUrl = img.src.split('?')[0];
        if (seenUrls.has(baseUrl)) continue;
        if (excludeUrls && excludeUrls.has(baseUrl)) continue;
        seenUrls.add(baseUrl);
        mediaUrls.push(img.src);
      }
    }

    return { mediaUrls, mediaType };
  }

  // ============ G-2.2: navigateBack ============
  // Quay về trang editor sau khi extract media (tránh tab kẹt result page).
  async function navigateBack() {
    if (!window.location.href.includes('/imagine/post/')) return true;

    // Strategy 1: Click Back button (React onClick → SPA navigation)
    const backBtn = _queryWithFallback('back_button');
    if (backBtn) {
      const propsKey = Object.keys(backBtn).find(k => k.startsWith('__reactProps$'));
      if (propsKey && backBtn[propsKey]?.onClick) {
        backBtn[propsKey].onClick({
          preventDefault() {}, stopPropagation() {},
          nativeEvent: new MouseEvent('click', { bubbles: true }),
          type: 'click', target: backBtn, currentTarget: backBtn,
        });
      } else {
        simulateClick(backBtn);
      }
      for (let i = 0; i < 10; i++) {
        await sleep(500);
        if (!window.location.href.includes('/imagine/post/')) return true;
      }
    }

    // Strategy 2: history.back()
    window.history.back();
    for (let i = 0; i < 10; i++) {
      await sleep(500);
      if (!window.location.href.includes('/imagine/post/')) return true;
    }

    return false;
  }

  // ============ G-2.2: detectError ============
  // Pattern match các loại lỗi phổ biến trên Grok.
  // Patterns admin-tunable qua _grokPatterns (load từ chrome.storage.local.af_grok_config).
  // Fallback hardcoded khi storage rỗng — xem FALLBACK_GROK_PATTERNS phía trên.
  function detectError() {
    const text = (document.body?.innerText || '').toLowerCase();
    if (_grokPatterns.rateLimit.some(p => text.includes(p))) return 'RATE_LIMIT';
    if (_grokPatterns.contentBlocked.some(p => text.includes(p))) return 'CONTENT_BLOCKED';
    if (_grokPatterns.network.some(p => text.includes(p))) return 'NETWORK';
    return null;
  }

  // ============ detectSubscribeModal ============
  // Grok hiển thị modal subscribe khi user chưa đăng ký plan.
  // Detection strategies:
  //   1. URL chứa #subscribe (grok.com/imagine#subscribe)
  //   2. Text patterns từ admin config (admin-tunable qua _grokPatterns.subscriptionRequired)
  //   3. Dialog/modal có nút upgrade/subscribe
  function detectSubscribeModal() {
    // Strategy 1: URL hash check
    if (window.location.hash === '#subscribe' || window.location.href.includes('#subscribe')) {
      return true;
    }

    // Strategy 2: Text indicator trong modal/dialog (admin-tunable patterns)
    const subscribePatterns = _grokPatterns.subscriptionRequired;
    if (subscribePatterns.length === 0) return false;

    const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"], div[class*="modal"], div[class*="Modal"]');
    for (const dialog of dialogs) {
      const text = (dialog.innerText || '').toLowerCase();
      if (subscribePatterns.some(p => text.includes(p))) {
        // Verify dialog is visible
        const style = window.getComputedStyle(dialog);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return true;
        }
      }
    }

    // Strategy 3: Broader check — any overlay với subscribe text
    const overlays = document.querySelectorAll('div[class*="fixed"], div[class*="overlay"], div[class*="Overlay"]');
    for (const overlay of overlays) {
      const text = (overlay.innerText || '').toLowerCase();
      if (subscribePatterns.some(p => text.includes(p))) {
        const style = window.getComputedStyle(overlay);
        if (style.display !== 'none' && style.visibility !== 'hidden' && overlay.offsetHeight > 100) {
          return true;
        }
      }
    }

    return false;
  }

  // ============ Abort signal flag ============
  // Module-level flag để Loop trong handleSubmitAndWait check stop sớm.
  // Set qua message `grok:abort` (gửi từ sidebar khi user click Stop button task).
  //
  // Bug 50 fix (2026-05-13): Timestamp-guarded — abort message timestamp recorded.
  // Trước fix: handleSubmitAndWait reset __grokAbort=false → nếu abort message arrive
  // TRƯỚC submitAndWait, flag bị wipe → user click stop nhưng task vẫn chạy.
  // Sau fix: abort chỉ valid nếu requested SAU thời điểm call hiện tại start.
  let __grokAbort = false;
  let __grokAbortAt = 0;       // timestamp ms khi user request abort
  let __grokCallStartAt = 0;   // timestamp ms khi call hiện tại start

  // Helper: kiểm tra abort có hợp lệ cho call hiện tại không.
  // Abort cũ (trước call start) → ignore (race fix).
  function isAbortActive() {
    return __grokAbort && __grokAbortAt >= __grokCallStartAt;
  }

  // Helper: checkAbort — throw 'ABORTED:<stage>' để break early ở mọi phase.
  // Bug fix 2026-05-09: trước đây flag chỉ check trong wait loops → user bấm forceStop
  // ở phase upload/insert/submit thì code vẫn chạy tiếp tới wait loop → delay > 1 phút.
  function checkAbort(stage) {
    if (isAbortActive()) {
      console.log('[Grok-abort] Aborted at stage:', stage);
      throw new Error('ABORTED:' + stage);
    }
  }

  // Bug 50 fix: Interruptible sleep — break sớm khi user abort thay vì đợi full N ms.
  // Replace dài sleep(N) bằng helper này ở các spots > 500ms để abort latency thấp.
  // Polls __grokAbort mỗi 200ms. Nếu signal active → throw ABORTED ngay.
  async function interruptibleSleep(totalMs, stage = 'sleep') {
    const POLL = 200;
    const start = Date.now();
    while (Date.now() - start < totalMs) {
      if (isAbortActive()) {
        console.log('[Grok-abort] Interruptible sleep aborted at stage:', stage);
        throw new Error('ABORTED:' + stage);
      }
      const remaining = totalMs - (Date.now() - start);
      await sleep(Math.min(POLL, remaining));
    }
  }

  // Helper: click "Stop generating" button của Grok để halt backend gen.
  // Grok đang gen có button "Stop" với aria-label hoặc icon stop. Click để dừng ngay backend
  // thay vì để gen tiếp tới khi xong (waste quota + xuất hiện ảnh sau khi user đã bỏ).
  async function clickGrokStopButton() {
    const stopBtn = _queryWithFallback('stop_button');
    if (stopBtn && !stopBtn.disabled) {
      console.log('[Grok-abort] Clicking Grok Stop button to halt backend gen');
      try { stopBtn.click(); } catch (e) {}
      try { simulateClick(stopBtn); } catch (e) {}
      await sleep(300);
      return true;
    }
    console.log('[Grok-abort] Stop button not found or disabled');
    return false;
  }

  // ============ G-2.2: isLoggedIn / checkLoginRequired ============
  // Editor tồn tại = đã login. Có sign-in link = chưa login.
  function isLoggedIn() {
    const editor = findGrokEditor();
    if (!editor) return false;
    const loginLink = document.querySelector('a[href*="/login"], a[href*="/signin"], a[href*="auth"]');
    if (loginLink) {
      // Có thể là link signup không bắt buộc — check thêm nếu editor có thể tương tác
      const editorReadable = editor && editor.getAttribute('contenteditable') === 'true';
      if (!editorReadable) return false;
    }
    return true;
  }

  function checkLoginRequired() {
    return !isLoggedIn();
  }

  // ============ G-2.2: handleSubmitAndWait ============
  // Main pipeline: ensureOnEditor → snapshot → settings → upload refs → insert text → submit → wait result → extract.
  // Reference: grok-extension/grok-content.js — verified production flow.
  async function handleSubmitAndWait(payload, sendResponse) {
    // Bug 50 fix (2026-05-13): KHÔNG reset __grokAbort unconditionally — flag với
    // timestamp older than current call sẽ tự bị ignore qua isAbortActive(). Reset
    // chỉ khi flag stale (>5s) để dọn dẹp memory. Tránh wipe pending abort race.
    __grokCallStartAt = Date.now();
    if (__grokAbort && __grokAbortAt < __grokCallStartAt - 5000) {
      __grokAbort = false;
      __grokAbortAt = 0;
    }

    try {
      const { text, images, settings, timeout, taskName } = payload;
      const timeoutMs = timeout || 120000;

      // 1. Login check
      if (checkLoginRequired()) {
        sendResponse({ success: false, error: 'NOT_LOGGED_IN' });
        return;
      }
      checkAbort('after-login-check');

      // 1b. Cloudflare challenge check — Grok dùng Cloudflare turnstile.
      // Tab inactive → turnstile có thể không tự complete (Cloudflare check tab visibility) →
      // DOM operations chạy nhưng submit bị block → gen processing mãi.
      // Bug fix: detect challenge → activate tab (focus window) → chờ user click verify (max 2 phút).
      if (detectCloudflareChallenge()) {
        const resolved = await waitForCloudflareResolved(120000);
        if (!resolved) {
          sendResponse({
            success: false,
            error: 'CLOUDFLARE_CHALLENGE_TIMEOUT',
            message: 'Grok yêu cầu xác minh Cloudflare. Vui lòng mở tab Grok, hoàn thành verification, sau đó chạy lại.',
          });
          return;
        }
        checkAbort('after-cloudflare');
      }

      // 2. CRITICAL — ensureOnEditorPage: navigate về /imagine để có editor.
      // 2 cases cần navigate:
      //   a) /imagine/post/{uuid} — kết quả gen lần trước → click Back
      //   b) /imagine/saved — sau navigateBack post-response → cần chuyển sang /imagine
      //      vì /imagine/saved KHÔNG có prompt editor → findGrokEditor returns null →
      //      handleSubmitAndWait return EDITOR_NOT_FOUND ngay → task completed instantly.
      const _curUrl = window.location.href;
      if (_curUrl.includes('/imagine/post/')) {
        console.log('[Grok] handleSubmitAndWait: đang ở result page, navigate back về /imagine');
        await navigateBack();
        await sleep(500);
      } else if (_curUrl.includes('/imagine/saved') || _curUrl.match(/\/imagine\/projects/)) {
        console.log('[Grok] handleSubmitAndWait: đang ở /imagine/saved hoặc /projects, navigate sang /imagine');
        // Strategy 1: Click "Imagine" / "Generate" nav link (SPA navigation)
        const imagineNavBtn = _queryWithFallback('imagine_link');
        if (imagineNavBtn) {
          const propsKey = Object.keys(imagineNavBtn).find(k => k.startsWith('__reactProps$'));
          if (propsKey && imagineNavBtn[propsKey]?.onClick) {
            try {
              imagineNavBtn[propsKey].onClick({
                preventDefault: function(){}, stopPropagation: function(){},
                nativeEvent: new MouseEvent('click', { bubbles: true }),
                type: 'click', target: imagineNavBtn, currentTarget: imagineNavBtn,
              });
            } catch (_) {
              simulateClick(imagineNavBtn);
            }
          } else {
            simulateClick(imagineNavBtn);
          }
        } else {
          // Strategy 2: Direct navigation
          window.location.href = 'https://grok.com/imagine';
        }
        // Wait for editor to appear (max 5s)
        const navStart = Date.now();
        while (Date.now() - navStart < 5000) {
          if (findGrokEditor() && window.location.href.includes('/imagine') && !window.location.href.includes('/imagine/saved') && !window.location.href.includes('/imagine/projects')) {
            break;
          }
          await sleep(200);
        }
        await sleep(500);
      }

      checkAbort('after-navigate');

      // 3. Snapshot baseline (sau khi đã navigate về editor page)
      const baseline = snapshotConversationState();

      // 4. Apply settings (mode → ratio → image_quality | duration → resolution)
      if (settings) {
        await applyGrokSettings(settings);
        checkAbort('after-apply-settings');
        await sleep(getMacroDelay());  // Macro gap settings → clear editor
      }

      // 5. Tìm editor + clear
      const editor = findGrokEditor();
      if (!editor) {
        sendResponse({ success: false, error: 'EDITOR_NOT_FOUND' });
        return;
      }
      await clearEditor(editor);
      await sleep(300);
      checkAbort('after-clear-editor');
      await sleep(getMacroDelay());  // Macro gap clear → remove + upload refs

      // 6. Upload ref images (nếu có).
      // CRITICAL — remove ref images cũ UNCONDITIONALLY trước upload, kể cả task không có
      // refs. Bug fix: nếu user run task không có ref nhưng session trước có, refs cũ vẫn
      // dính trong editor → submit sai context. Trước fix chỉ remove khi images.length>0.
      await removeExistingRefImages();
      await sleep(300); // chờ DOM update sau remove
      checkAbort('after-remove-refs');

      let refUrlsToExclude = null;
      let uploadedCount = 0;
      if (Array.isArray(images) && images.length > 0) {

        const uploadResult = await uploadImages(images);
        if (!uploadResult.success) {
          sendResponse({ success: false, error: 'REF_UPLOAD_FAILED', message: 'Không thể upload ref image' });
          return;
        }
        // Ưu tiên completedCount cho @mention loop — Grok dropdown chỉ list ảnh ĐÃ upload xong.
        // Nếu một số ảnh chưa kịp settle (waitForUploadComplete timeout) → không vào dropdown
        // → @ Enter không tìm thấy item → chỉ insert `@` literal.
        // Fallback: injectedCount nếu completedCount=0 (vd waitForUploadComplete fail nhưng file inject OK).
        uploadedCount = uploadResult.completed || uploadResult.count || 0;
        console.log(`[Grok] Upload result: injected=${uploadResult.count}, completed=${uploadResult.completed}, sẽ @mention ${uploadedCount} images`);
        // Capture ref image URLs trên trang để loại khỏi result detect
        refUrlsToExclude = new Set();
        const refImgs = _queryAllWithFallback('grok_cdn_image');
        for (const img of refImgs) {
          if (img.src) refUrlsToExclude.add(img.src.split('?')[0]);
        }
      }

      // 7. CRITICAL — @mention loop để attach uploaded images vào prompt context.
      // Reference grok-extension/grok-content.js: sau upload, phải type @ → ArrowDown (cho image
      // thứ 2+) → Enter để chọn ảnh từ autocomplete dropdown. KHÔNG @mention → ảnh ko attach
      // vào prompt → submit không gửi ref images.
      if (uploadedCount > 0) {
        console.log(`[Grok] @mention loop cho ${uploadedCount} ref image(s)`);

        // Helper: chờ autocomplete dropdown xuất hiện (poll multiple selectors để cover
        // Radix popper, cmdk command menu, Grok custom mention list).
        // Best-effort detection — nếu KHÔNG match selector nhưng dropdown vẫn render,
        // Enter dispatch vẫn select được item (Grok TipTap internal handler).
        // Vì vậy log ở mức debug (không phải warn) — không phải lỗi nếu mention vẫn work.
        const waitForMentionDropdown = async (timeoutMs = 1500) => {
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            // Radix popover + listbox + cmdk + Grok custom mention list
            const dropdown = document.querySelector(
              '[role="listbox"], [role="menu"][data-state="open"], ' +
              '[data-radix-popper-content-wrapper] [role="option"], ' +
              '[role="option"][aria-selected], ' +
              '[cmdk-list], [cmdk-list-sizer], [data-cmdk-list], ' +
              '[data-radix-popper-content-wrapper], ' +
              'div[role="presentation"][data-state="open"]'
            );
            if (dropdown) return true;
            await sleep(80);
          }
          return false;
        };

        for (let imgIdx = 0; imgIdx < uploadedCount; imgIdx++) {
          // Re-query editor mỗi iteration (React có thể re-render sau upload/click)
          let curEditor = findGrokEditor();
          if (!curEditor) {
            console.warn('[Grok] @mention: editor not found at iteration', imgIdx);
            break;
          }
          curEditor.focus();
          await sleep(150);
          document.execCommand('insertText', false, '@');

          // Chờ dropdown render — poll thay vì sleep cố định (responsive hơn)
          const dropdownOpen = await waitForMentionDropdown(1500);
          if (!dropdownOpen) {
            // Selector không match nhưng Enter dispatch vẫn select được item (Grok internal).
            // Hạ xuống debug — không phải lỗi nếu @mention chip vẫn render sau Enter.
            console.debug(`[Grok] @mention iter ${imgIdx + 1}: dropdown selector không match — fallback Enter dispatch`);
          }
          // Bonus settle delay sau khi detect dropdown
          await sleep(200);

          // ArrowDown imgIdx lần để chọn ảnh thứ (imgIdx+1) trong dropdown.
          // First image (imgIdx=0): 0 ArrowDown (item đầu thường đã highlighted).
          // Second (imgIdx=1): 1 ArrowDown. v.v.
          for (let arrowIdx = 0; arrowIdx < imgIdx; arrowIdx++) {
            curEditor.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'ArrowDown', code: 'ArrowDown', keyCode: 40,
              bubbles: true, cancelable: true,
            }));
            curEditor.dispatchEvent(new KeyboardEvent('keyup', {
              key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true,
            }));
            await sleep(120);
          }

          // Enter chọn item trong dropdown
          curEditor.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13,
            bubbles: true, cancelable: true,
          }));
          curEditor.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true,
          }));
          await sleep(400); // chờ dropdown đóng + chip render (tăng từ 300→400)
        }

        // Escape để đảm bảo dropdown đóng hoàn toàn (tránh Enter submit bị capture)
        const finalEditor = findGrokEditor();
        if (finalEditor) {
          finalEditor.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape', code: 'Escape', keyCode: 27,
            bubbles: true, cancelable: true,
          }));
          finalEditor.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true,
          }));
        }
        await sleep(200);
      }

      checkAbort('after-mention-loop');
      await sleep(getMacroDelay());  // Macro gap upload+mention → insert prompt

      // 8. Insert prompt text + submit (KeyboardEvent Enter)
      // Re-query editor — React có thể re-render sau @mention chips render.
      let editorAfterMention = findGrokEditor() || editor;
      await insertText(editorAfterMention, text || '');
      await sleep(500);
      checkAbort('after-insert-prompt');
      await sleep(getMacroDelay());  // Macro gap insert → submit

      // Safety net: Escape lần nữa trước submit (đóng autocomplete nếu insertText trigger)
      editorAfterMention = findGrokEditor() || editorAfterMention;
      editorAfterMention.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27,
        bubbles: true, cancelable: true,
      }));
      editorAfterMention.dispatchEvent(new KeyboardEvent('keyup', {
        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true,
      }));
      await sleep(100);

      checkAbort('before-submit');
      let submitOk = await clickSubmit(editorAfterMention);
      if (!submitOk) {
        sendResponse({ success: false, error: 'SUBMIT_FAILED' });
        return;
      }
      checkAbort('after-submit');

      // 6b. Check age verification modal sau submit (Grok hiện modal cho account mới)
      // Nếu modal xuất hiện → handle → submit lại.
      // Bug 50 fix: interruptibleSleep để abort không phải đợi full 800ms.
      await interruptibleSleep(800, 'after-submit-grace');
      checkAbort('post-submit-grace'); // Bug 52: double-check sau sleep
      if (detectAgeVerificationModal()) {
        console.log('[Grok] Age verification modal detected sau submit — handling...');
        const ageOk = await handleAgeVerificationModal(30000);
        // Bug 52 fix: check abort TRƯỚC khi map ageOk=false sang AGE_VERIFICATION_FAILED.
        // User abort during handleAge → return false → mismap thành AGE error. Throw ABORTED
        // ngay nếu abort active để outer catch trả về ABORTED đúng.
        checkAbort('after-age-verification');
        if (!ageOk) {
          sendResponse({
            success: false,
            error: 'AGE_VERIFICATION_FAILED',
            message: 'Không thể xác nhận tuổi tự động. Vui lòng mở tab Grok, hoàn thành xác nhận tuổi thủ công, sau đó chạy lại.',
          });
          return;
        }
        await sleep(500);

        // Re-submit sau khi xác nhận tuổi
        console.log('[Grok] Re-submitting sau age verification...');
        const editorRetry = findGrokEditor();
        if (editorRetry) {
          submitOk = await clickSubmit(editorRetry);
          if (!submitOk) {
            sendResponse({ success: false, error: 'SUBMIT_FAILED_AFTER_AGE_VERIFY' });
            return;
          }
        }
        await sleep(500);
      }

      // 6c. Check subscribe modal sau submit (Grok hiện modal khi user chưa có plan).
      // Bug 53 fix (2026-05-13): Poll 3s thay vì check 1 shot — modal có thể xuất hiện trễ.
      // waitForResultPage cũng có check (line 1337), đây là fast-path để bail sớm.
      const subModalDeadline = Date.now() + 3000;
      let _subDetected = false;
      while (Date.now() < subModalDeadline) {
        if (isAbortActive()) {
          sendResponse({ success: false, error: 'ABORTED', message: 'User stopped task' });
          return;
        }
        if (detectSubscribeModal()) { _subDetected = true; break; }
        await sleep(250);
      }
      if (_subDetected) {
        console.warn('[Grok] Subscribe modal detected sau submit');
        sendResponse({
          success: false,
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'Bạn chưa đăng ký gói Grok Premium. Vui lòng đăng ký tại grok.com để sử dụng tính năng tạo ảnh/video.',
        });
        return;
      }

      // 7. Wait result page redirect
      const waitResult = await waitForResultPage(baseline, timeoutMs);
      if (!waitResult.redirected) {
        // Aborted bởi user → return ABORTED
        if (waitResult.aborted) {
          sendResponse({ success: false, error: 'ABORTED', message: 'User stopped task' });
          return;
        }
        // Subscribe modal detected → return SUBSCRIPTION_REQUIRED
        if (waitResult.subscriptionRequired) {
          sendResponse({
            success: false,
            error: 'SUBSCRIPTION_REQUIRED',
            message: 'Bạn chưa đăng ký gói Grok Premium. Vui lòng đăng ký tại grok.com để sử dụng tính năng tạo ảnh/video.',
          });
          return;
        }
        // Check error trước khi báo timeout
        const err = detectError();
        if (err) {
          sendResponse({ success: false, error: err, message: 'Detected error trong khi chờ result' });
          return;
        }
        sendResponse({ success: false, error: 'TIMEOUT', message: 'Hết thời gian chờ redirect' });
        return;
      }

      // 8. Wait for media render (additional grace period).
      // Bug 50 fix: interruptibleSleep — 3s là cửa sổ lớn nhất user phải đợi sau redirect,
      // dùng interruptible để forceStop break ngay thay vì block đầy 3s.
      await interruptibleSleep(3000, 'pre-extract-grace');

      // 9. Extract media URLs với progress monitoring + heartbeat detection.
      // STRATEGY: Thay vì phụ thuộc timeout cứng, monitor `Generating XX%` indicator của
      // Grok placeholder. Khi progress còn changing → coi như đang gen → KHÔNG timeout.
      // Khi progress idle > HEARTBEAT_TIMEOUT (= không đổi %) → coi stuck → timeout sớm.
      //
      // Hardcoded timeout dài (10 phút video, 5 phút image) chỉ là safety net cho case
      // progress indicator KHÔNG hiện hoặc bị block.
      const isVideoMode = settings?.mode === 'video';
      const extractBudget = isVideoMode
        ? Math.max(timeoutMs, 600000)   // Video: tối thiểu 10 phút
        : Math.max(timeoutMs, 300000);  // Image: tối thiểu 5 phút
      const HEARTBEAT_TIMEOUT = 90000;  // 90s không đổi % → coi stuck

      let mediaUrls = [];
      let mediaType = 'image';
      let lastProgress = -1;
      let lastProgressChangeTime = Date.now();
      let progressDetectedOnce = false;
      const extractDeadline = Date.now() + extractBudget;
      const startExtract = Date.now();

      while (Date.now() < extractDeadline) {
        // Abort check — user click Stop button task → click Grok Stop button + break ngay.
        if (isAbortActive()) {
          console.log('[Grok] Extract loop aborted by user → clicking Stop button');
          await clickGrokStopButton();
          sendResponse({ success: false, error: 'ABORTED', message: 'User stopped task' });
          return;
        }

        // Bug 51 fix (2026-05-13): Cloudflare re-emerge mid-extract → bail sớm với
        // CLOUDFLARE_CHALLENGE thay vì poll cho đến heartbeat timeout 90s.
        // Trường hợp gặp: session expire trong khi đang gen → Grok hiện turnstile lại.
        if (detectCloudflareChallenge()) {
          console.warn('[Grok] Cloudflare challenge re-emerged trong extract loop → abort');
          sendResponse({
            success: false,
            error: 'CLOUDFLARE_CHALLENGE_TIMEOUT',
            message: 'Cloudflare challenge xuất hiện lại trong quá trình gen — session có thể đã hết hạn. Vui lòng verify thủ công và chạy lại.',
          });
          return;
        }

        const extracted = extractImageUrls(refUrlsToExclude);
        if (extracted.mediaUrls.length > 0) {
          mediaUrls = extracted.mediaUrls;
          mediaType = extracted.mediaType;
          // Bug fix: emit gen_progress=100 ngay khi extract done để tracker UI
          // chuyển trạng thái từ "Generating XX%" → "Hoàn tất" ngay lập tức.
          // Trước fix: tracker stuck ở giá trị progress cuối (vd 75%) cho đến khi
          // executor emit phase='completed' (vài giây sau).
          try {
            const elapsedSec = Math.round((Date.now() - startExtract) / 1000);
            chrome.runtime.sendMessage({
              action: 'grok:gen_progress',
              progress: 100,
              mode: isVideoMode ? 'video' : 'image',
              elapsed: elapsedSec,
            }).catch(() => {});
          } catch (_) {}
          break;
        }

        // Track progress qua "Generating XX%" placeholder.
        // CRITICAL — Grok có thể MẤT % đột ngột khi gen xong (không chạy đến 100% rồi disappear).
        // Vậy % chỉ là TRẠNG THÁI MONITOR, KHÔNG phải driver. Detection chính = media URL extract.
        // % disappear → continue poll media, KHÔNG assume done.
        const currentProgress = findGenerationProgress();
        if (currentProgress !== null) {
          progressDetectedOnce = true;
          if (currentProgress !== lastProgress) {
            const elapsedSec = Math.round((Date.now() - startExtract) / 1000);
            console.log(`[Grok] Generating ${currentProgress}% (elapsed ${elapsedSec}s)`);
            lastProgress = currentProgress;
            lastProgressChangeTime = Date.now();
            // Emit progress event tới sidebar/UI ExecutionTracker hiển thị %.
            // Best-effort, ignore lỗi (sidebar có thể đóng).
            try {
              chrome.runtime.sendMessage({
                action: 'grok:gen_progress',
                progress: currentProgress,
                mode: isVideoMode ? 'video' : 'image',
                elapsed: elapsedSec,
              }).catch(() => {});
            } catch (_) {}
          } else {
            // Progress idle quá lâu → coi stuck
            const idleMs = Date.now() - lastProgressChangeTime;
            if (idleMs > HEARTBEAT_TIMEOUT) {
              console.warn(`[Grok] Progress stuck at ${currentProgress}% for ${Math.round(idleMs/1000)}s → timeout sớm`);
              break;
            }
          }
        } else if (progressDetectedOnce) {
          // Progress đã từng hiện rồi biến mất → media có thể sắp render xong (HOẶC chưa).
          // KHÔNG assume done — tiếp tục poll media URL ở vòng sau.
        }

        // Detect error nếu có
        const err = detectError();
        if (err) {
          sendResponse({ success: false, error: err });
          return;
        }
        // Bug fix: giảm poll interval 1500ms → 700ms để latency detect-done thấp hơn.
        // Trước: gen xong → adapter chờ tới 1.5s mới nhận URL → executor delay.
        // Sau: adapter nhận URL trong < 1s sau gen done.
        await sleep(700);
      }

      if (mediaUrls.length === 0) {
        sendResponse({ success: false, error: 'NO_MEDIA_FOUND', message: 'Không trích xuất được URL media từ result page' });
        return;
      }

      // 10. Extract postId từ URL (TRƯỚC navigate — sau navigate URL đã đổi)
      const postIdMatch = waitResult.url.match(/\/imagine\/post\/([a-z0-9-]+)/i);
      const postId = postIdMatch ? postIdMatch[1] : null;

      // 11. Send response NGAY với mediaUrls (auto-download phía sidebar fetch CDN với cookie session
      // BEFORE navigate khỏi /imagine/post/ — CDN URL có signature TTL ngắn, fetch khi còn ở result page).
      sendResponse({
        success: true,
        mediaUrls,
        mediaType,
        postId,
        url: waitResult.url,
      });

      // 12. POST-RESPONSE: Navigate back về /imagine/saved (tham khảo grok-extension finally block).
      // Fire-and-forget — KHÔNG await response, sidebar đã nhận mediaUrls.
      // Reference grok-extension/grok-content.js: finally block navigate về /imagine/saved
      // để tab sạch sẽ cho lần submit kế tiếp + UX consistency với standalone AutoGrok.
      (async () => {
        try {
          // Wait briefly để sidebar nhận response + bắt đầu fetch CDN
          await sleep(1500);
          // Strategy 1: Click Back button (nếu vẫn ở /imagine/post/)
          if (window.location.href.includes('/imagine/post/')) {
            await navigateBack();
            await sleep(500);
          }
          // Strategy 2: Click Saved nav link (về /imagine/saved)
          const savedBtn = _queryWithFallback('saved_button') ||
                           document.querySelector('a[aria-label="Saved"]') ||
                           document.querySelector('[aria-label="Saved"]');
          if (savedBtn) {
            const propsKey = Object.keys(savedBtn).find(k => k.startsWith('__reactProps$'));
            if (propsKey && savedBtn[propsKey]?.onClick) {
              try {
                savedBtn[propsKey].onClick({
                  preventDefault: function(){}, stopPropagation: function(){},
                  nativeEvent: new MouseEvent('click', { bubbles: true }),
                  type: 'click', target: savedBtn, currentTarget: savedBtn,
                });
              } catch (_) {
                simulateClick(savedBtn);
              }
            } else {
              simulateClick(savedBtn);
            }
            console.log('[Grok] Navigated to /imagine/saved');
          } else if (!window.location.href.includes('/imagine/saved')) {
            // Strategy 3: Fallback direct navigation
            console.log('[Grok] Saved button not found, fallback direct nav');
            window.location.href = 'https://grok.com/imagine/saved';
          }
        } catch (navErr) {
          console.warn('[Grok] post-response navigate to /saved failed:', navErr?.message);
        }
      })();
    } catch (err) {
      // Bug fix 2026-05-09: catch ABORT throws → click Grok Stop button để halt backend gen
      if (err.message && err.message.startsWith('ABORTED')) {
        const stage = err.message.replace('ABORTED:', '');
        console.log('[Grok] Caught ABORT at stage:', stage, '→ clicking Stop button');
        await clickGrokStopButton();
        sendResponse({
          success: false,
          error: 'ABORTED',
          message: 'User stopped at ' + stage,
        });
        return;
      }
      console.error('[Grok] handleSubmitAndWait error:', err);
      sendResponse({ success: false, error: 'EXCEPTION', message: err.message || 'Lỗi không xác định' });
    }
  }

  // ============ Listener registration ============
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message.action !== 'string') return false;

    // SSE invalidate: admin update DOM selector → clear cache để query fresh
    if (message.action === 'providerConfigUpdated') {
      _selectorConfig = null;
      _selectorConfigTime = 0;
      console.log('[Grok] Provider config updated via SSE — selector cache invalidated');
      sendResponse({ success: true });
      return false;
    }

    if (message.action === 'grok:submitAndWait') {
      // CRITICAL: MessageBridge.grokSubmitAndWait gửi nested structure
      // {action, payload: {text, images, settings, timeout, taskName}}
      // → unwrap message.payload trước khi pass vào handleSubmitAndWait.
      // Fallback to message itself nếu sender đã flatten (defensive).
      const innerPayload = message.payload && typeof message.payload === 'object'
        ? message.payload
        : message;
      // Set inputTimeoutMs từ payload (Adapter pass từ user setting). Default 1200 nếu không có.
      // Macro delay giữa các bước chính = 70% inputTimeoutMs.
      __grokInputTimeoutMs = Number(innerPayload.inputTimeoutMs) || 1200;
      __grokMacroDelayMs = Math.round(__grokInputTimeoutMs * 0.7);
      console.log('[Grok-listener] grok:submitAndWait nhận, text len:',
        (innerPayload.text || '').length, 'images:', (innerPayload.images || []).length,
        '| Timing — inputTimeout:', __grokInputTimeoutMs, 'ms | macroDelay:', __grokMacroDelayMs, 'ms (70%)');
      handleSubmitAndWait(innerPayload, sendResponse);
      return true; // async sendResponse
    }

    // Abort signal — set flag để loop trong handleSubmitAndWait break sớm.
    // Gửi từ sidebar khi user click Stop button task.
    if (message.action === 'grok:abort') {
      __grokAbort = true;
      __grokAbortAt = Date.now(); // Bug 50: timestamp guard cho race condition
      console.log('[Grok-listener] grok:abort received → set abort flag at', __grokAbortAt);
      sendResponse({ success: true });
      return false;
    }

    // applySettingsInline: gọi từ background `grok:applySettings` / `grok:setRatio`.
    // Inline call applyGrokSettings → trả { success } cho GrokSession.setRatio/setMode/...
    if (message.action === 'grok:applySettingsInline') {
      (async () => {
        try {
          const ok = await applyGrokSettings(message.settings || {});
          sendResponse({ success: !!ok });
        } catch (err) {
          sendResponse({ success: false, error: err.message || 'APPLY_FAILED' });
        }
      })();
      return true;
    }

    return false;
  });

  // ============ SPA navigation tracking ============
  // Theo dõi URL change qua pushState/replaceState/popstate → báo background.js
  let _lastUrl = location.href;
  const _notifyNavigate = () => {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      try {
        chrome.runtime.sendMessage({ action: 'grok:navigated', url: location.href }).catch(() => {});
      } catch (e) {
        // Bỏ qua nếu runtime mất kết nối
      }
    }
  };

  try {
    const _origPushState = history.pushState;
    const _origReplaceState = history.replaceState;
    history.pushState = function() {
      _origPushState.apply(this, arguments);
      _notifyNavigate();
    };
    history.replaceState = function() {
      _origReplaceState.apply(this, arguments);
      _notifyNavigate();
    };
    window.addEventListener('popstate', _notifyNavigate);
  } catch (e) {
    // Bỏ qua nếu không hook được
  }

  console.log('[Grok] Content script đã được inject (Phase G-2)');
})();
