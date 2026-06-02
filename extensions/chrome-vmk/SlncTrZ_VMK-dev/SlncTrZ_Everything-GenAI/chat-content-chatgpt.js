(function() {
  // Phase CG-2: Cờ chung để background.js (chatgpt:injectScript) nhận biết script đã load.
  // Đặt TRƯỚC guard để dù script bị inject lại lần 2 thì flag vẫn = true (idempotent).
  window.__slnctrzChatGPTLoaded__ = true;

  // Guard against double injection (Phase X — ChatAIModal)
  if (window._chatAIInjected) return;
  window._chatAIInjected = true;

  // Abort flag — set qua message `chatgpt:abort` (gửi từ sidebar khi user click forceStop)
  // Các hàm wait/poll check flag này để abort sớm thay vì chờ hết timeout.
  //
  // Bug 55 fix (2026-05-13): Timestamp-guarded — abort message với Date.now() recorded.
  // Trước fix: submitAndWait reset __chatgptAbort=false → nếu abort message arrive TRƯỚC
  // submit (timing race), flag bị wipe → user click stop nhưng task vẫn chạy.
  // Sau fix: isAbortActive() chỉ true khi abort requested SAU current call start.
  let __chatgptAbort = false;
  let __chatgptAbortAt = 0;       // timestamp khi user request abort
  let __chatgptCallStartAt = 0;   // timestamp khi current submitAndWait start

  function isAbortActive() {
    return __chatgptAbort && __chatgptAbortAt >= __chatgptCallStartAt;
  }

  // Helper: sleep
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Bug 55 fix: Interruptible sleep — break sớm khi user abort, không phải đợi full N ms.
  // Polls isAbortActive() mỗi 200ms.
  async function interruptibleSleep(totalMs, stage = 'sleep') {
    const POLL = 200;
    const start = Date.now();
    while (Date.now() - start < totalMs) {
      if (isAbortActive()) {
        console.log('[ChatGPT-abort] Interruptible sleep aborted at stage:', stage);
        throw new Error('ABORTED:' + stage);
      }
      const remaining = totalMs - (Date.now() - start);
      await sleep(Math.min(POLL, remaining));
    }
  }

  // ============ Dynamic Selector System (DOM Resilience) ============
  // Priority: Backend config → Hardcoded defaults
  const PROVIDER = 'chatgpt';
  let _selectorConfig = null;
  let _selectorConfigTime = 0;
  const _SELECTOR_CACHE_TTL = 30000; // 30s

  /**
   * Tier 3 fallback selectors — MUST MATCH PCM._DEFAULTS.chatgpt
   * Used when chrome.storage (server data) unavailable.
   * CI script `check_selector_drift.js` verifies sync with backend seed.
   * Total: 15 keys (10 initial + 5 added 2026-05-18)
   */
  const _FALLBACK_SELECTORS = {
    composer: ['#prompt-textarea', 'div.ProseMirror[role="textbox"]'],
    submit_button: ['button[data-testid="send-button"]', 'button.composer-submit-button-color'],
    stop_button: ['[aria-label="Stop generating"]', '[data-testid="stop-button"]', '[aria-label="Stop"]'],
    conversation_turn: ['[data-testid^="conversation-turn-"]', '[data-turn-id]'],
    generated_image: ['img[alt^="Generated image"]:not([aria-hidden])'],
    generating_indicator: ['[data-testid^="image-gen-loading-state"]', '[aria-label="Generating image..."]'],
    new_chat_button: ['a[data-testid="create-new-chat-button"]'],
    ratio_button: ['button[aria-label="Choose image aspect ratio"]'],
    plus_button: ['#composer-plus-btn', '[data-testid="composer-plus-btn"]'],
    file_input: ['#upload-photos', 'input[type="file"][accept*="image"]'],
    message_author: ['[data-message-author-role]'],
    open_menu: [
      'div[role="menu"][data-radix-menu-content][data-state="open"]',
      'div[role="menu"][data-state="open"]',
      '[role="menu"]',
    ],
    menu_items: ['[role="menuitemradio"]', '[role="menuitem"]'],
    chat_history_home_link: ['nav[aria-label="Chat history"] a[href="/"]'],
    cloudflare_iframe: [
      'iframe[src*="challenges.cloudflare.com"]',
      'iframe[src*="turnstile"]',
      '.cf-turnstile',
      '[data-cf-turnstile]',
    ],
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

  function _queryAllWithFallback(key, defaultSelectors = null, scope = null) {
    const config = _getDynamicSelector(key);
    const hardcoded = defaultSelectors || _FALLBACK_SELECTORS[key] || [];
    const selectors = config?.selectors?.length > 0 ? config.selectors : hardcoded;
    const root = scope || document;

    for (let i = 0; i < selectors.length; i++) {
      try {
        const els = root.querySelectorAll(selectors[i]);
        if (els.length > 0) return els;
      } catch (e) { /* invalid selector */ }
    }
    return [];
  }

  // Helper: Get selectors array for a key (dynamic or hardcoded)
  function _getSelectorsForKey(key) {
    const config = _getDynamicSelector(key);
    const hardcoded = _FALLBACK_SELECTORS[key] || [];
    return config?.selectors?.length > 0 ? config.selectors : hardcoded;
  }

  // Helper: Check if generating indicator exists in element (or global document)
  // Uses dynamic selectors from backend with hardcoded fallback
  function _hasGeneratingIndicator(el = document) {
    const selectors = _getSelectorsForKey('generating_indicator');
    for (const sel of selectors) {
      try {
        if (el.querySelector(sel)) return true;
      } catch (e) { /* invalid selector */ }
    }
    return false;
  }

  // ============ Macro-delay giữa các BƯỚC CHÍNH — sync với Flow's inputTimeout setting ============
  //
  // CHIẾN LƯỢC:
  //   - Micro-delay (sleep nhỏ trong sub-step như focus, dispatch event, wait React render)
  //     → GIỮ HARDCODE — vì có lý do kỹ thuật cụ thể, không scale theo user setting.
  //   - Macro-delay (gap GIỮA các bước chính: upload → activate → clear → insert → submit)
  //     → DÙNG getMacroDelay() = inputTimeout × 0.7. User control tốc độ tổng qua setting này.
  //
  // FLOW PIPELINE ChatGPT:
  //   removeRefs + uploadRefs
  //     ↓ sleep(getMacroDelay())   ← 840ms khi inputTimeout=1200
  //   activateImageMode
  //     ↓ sleep(getMacroDelay())
  //   injectTextAndSubmit (clear + insert + submit)
  //
  // 2 biến tracking:
  //   __chatgptInputTimeoutMs: GIÁ TRỊ user setting (lấy từ payload, default 1200ms)
  //   __chatgptMacroDelayMs:   BIẾN TRUNG GIAN = 70% inputTimeoutMs
  let __chatgptInputTimeoutMs = 1200;
  let __chatgptMacroDelayMs = Math.round(1200 * 0.7);  // 840ms

  function getMacroDelay() {
    return __chatgptMacroDelayMs;
  }

  // Helper: checkAbort — throw 'ABORTED:<stage>' để break early ở mọi phase, KHÔNG chỉ wait loops.
  // Bug fix 2026-05-09: trước đây flag chỉ check trong waitForResult → user bấm forceStop ở phase
  // upload/insert/submit thì code vẫn tiếp tục chạy tới khi vào wait loop → delay > 1 phút.
  // Giờ throw ngay khi flag set → catch trong handleSubmitAndWait + click Stop button của ChatGPT.
  function checkAbort(stage) {
    if (isAbortActive()) {
      console.log('[ChatGPT-abort] Aborted at stage:', stage);
      throw new Error('ABORTED:' + stage);
    }
  }

  // Helper: click "Stop generating" button của ChatGPT để halt backend gen.
  // Quan trọng vì kể cả khi extension abort wait loop, ChatGPT backend vẫn tiếp tục gen
  // → user thấy ảnh hiện ra dù đã bấm Stop. Click stop button = backend dừng ngay.
  async function clickChatGPTStopButton() {
    const stopBtn = _queryWithFallback('stop_button');
    if (stopBtn && !stopBtn.disabled) {
      console.log('[ChatGPT-abort] Clicking ChatGPT Stop button to halt backend gen');
      try { stopBtn.click(); } catch (e) {}
      try { simulateClick(stopBtn); } catch (e) {}
      await sleep(300);
      return true;
    }
    console.log('[ChatGPT-abort] Stop button not found or disabled');
    return false;
  }

  // Helper: simulateClick (full pointer event chain for React compatibility)
  function simulateClick(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
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

  // ============ HELPER: Remove ref images cũ trên ChatGPT composer ============
  // ChatGPT DOM (verified 2026-04-28): button[aria-label^="Remove file"] — format:
  //   "Remove file 1: filename.png", "Remove file 2: ...", v.v. (mỗi tile có 1 button).
  // Selector legacy "Image, click to remove" giữ làm fallback cho version cũ.
  // Click qua React onClick để bypass CSS opacity nếu có. Reference grok-extension pattern.
  async function removeExistingChatGPTRefImages() {
    // Combined selector: aria-label bắt đầu "Remove file" (DOM mới 2026-04) HOẶC literal "Image, click to remove" (legacy)
    const removeBtns = document.querySelectorAll(
      'button[aria-label^="Remove file"], button[aria-label="Image, click to remove"]'
    );
    let removedCount = 0;

    for (const btn of removeBtns) {
      const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'));
      if (propsKey && btn[propsKey]?.onClick) {
        try {
          btn[propsKey].onClick({
            preventDefault: function(){}, stopPropagation: function(){},
            nativeEvent: new MouseEvent('click', { bubbles: true }),
            type: 'click', target: btn, currentTarget: btn,
          });
        } catch (_) {
          simulateClick(btn);
        }
      } else {
        simulateClick(btn);
      }
      removedCount++;
      await sleep(250);
    }

    if (removedCount > 0) {
      console.log(`[ChatGPT] removeExistingRefImages: đã xóa ${removedCount} ref image(s) cũ`);
    }
    return removedCount;
  }

  // ============ Cloudflare/captcha challenge detection ============
  // ChatGPT đôi khi có verification challenge (Cloudflare turnstile hoặc OpenAI captcha).
  // Tab inactive → challenge có thể không tự complete → DOM operations bị block silent.
  // Pattern giống chat-content-grok.js.
  function detectChatGPTChallenge() {
    // 2026-05-18 audit fix: dùng _queryWithFallback('cloudflare_iframe') → dynamic + fallback
    if (_queryWithFallback('cloudflare_iframe')) return true;
    // OpenAI specific: "Verify you are human" page
    const overlays = document.querySelectorAll('div[role="dialog"], body > div');
    for (const el of overlays) {
      const txt = (el.innerText || '').toLowerCase();
      if (txt.includes("making sure you're human") ||
          txt.includes('verify you are human') ||
          (txt.includes('verifying') && txt.includes('cloudflare'))) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') return true;
      }
    }
    return false;
  }

  async function waitForChatGPTChallengeResolved(timeoutMs = 120000) {
    if (!detectChatGPTChallenge()) return true;
    console.warn('[ChatGPT] Challenge detected — request tab activate + chờ user verify');
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'chatgpt:ensureActive', focusWindow: true, reason: 'challenge' },
          () => resolve()
        );
      });
    } catch (_) {}
    const start = Date.now();
    let lastLog = 0;
    while (Date.now() - start < timeoutMs) {
      // Bug 56 fix (2026-05-13): Abort check trong challenge wait loop — user click stop
      // không phải đợi full 120s timeout. Trước fix: loop chỉ check challenge resolved,
      // không check abort flag → forceStop bị block tới hết timeout.
      if (isAbortActive()) {
        console.log('[ChatGPT] Challenge wait aborted by user');
        return false;
      }
      if (!detectChatGPTChallenge()) {
        console.log('[ChatGPT] Challenge resolved sau', Math.round((Date.now() - start) / 1000), 's');
        await sleep(800);
        return true;
      }
      const elapsed = Date.now() - start;
      if (elapsed - lastLog >= 10000) {
        console.log('[ChatGPT] Vẫn chờ challenge resolved...', Math.round(elapsed / 1000), 's');
        lastLog = elapsed;
      }
      await sleep(800);
    }
    console.error('[ChatGPT] Challenge timeout sau', timeoutMs / 1000, 's');
    return false;
  }

  // ============ HELPER: Click "New chat" và chờ editor ready ============
  // Lý do: ChatGPT có thể bị stuck state hoặc image mode bị hạn chế trong conversation cũ.
  // Tạo new chat đảm bảo clean state + đủ quota upload refs cho fresh conversation.
  async function clickNewChatAndWaitReady(timeoutMs = 10000) {
    const log = (...args) => console.log('[ChatGPT-newchat]', ...args);

    // 1. Tìm button "New chat" trong sidebar
    //    Selector: a[data-testid="create-new-chat-button"] hoặc a[href="/"] có text "New chat"
    let newChatBtn = _queryWithFallback('new_chat_button');
    if (!newChatBtn) {
      // Fallback: tìm link với text "New chat" (2026-05-18 audit: dynamic chat_history_home_link)
      const cfg = _getDynamicSelector('chat_history_home_link');
      const selectors = (cfg?.selectors?.length > 0)
        ? cfg.selectors
        : _FALLBACK_SELECTORS.chat_history_home_link;
      const sidebarLinks = document.querySelectorAll(selectors.join(', '));
      for (const link of sidebarLinks) {
        if ((link.textContent || '').includes('New chat')) {
          newChatBtn = link;
          break;
        }
      }
    }

    if (!newChatBtn) {
      log('WARN: New chat button không tìm thấy — skip, dùng conversation hiện tại');
      return false;
    }

    // 2. Check nếu đã ở trang new chat (URL = "/" hoặc "/?" hoặc đã empty conversation)
    //    Nếu đã ở new chat, không cần click lại
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '') {
      // Check thêm: conversation có empty không (không có messages)
      // 2026-05-18 audit: dynamic message_author selector
      const _maCfg = _getDynamicSelector('message_author');
      const _maSelectors = (_maCfg?.selectors?.length > 0) ? _maCfg.selectors : _FALLBACK_SELECTORS.message_author;
      const messages = document.querySelectorAll(_maSelectors.join(', '));
      if (messages.length === 0) {
        log('Đã ở new chat page với empty conversation — skip click');
        return true;
      }
    }

    // 3. Click button
    log('Click New chat button...');
    simulateClick(newChatBtn);

    // 4. Chờ navigation và editor ready
    //    - URL chuyển về "/"
    //    - ProseMirror editor xuất hiện và focusable
    const startTime = Date.now();
    let editorReady = false;

    while (Date.now() - startTime < timeoutMs) {
      // Check URL
      const path = window.location.pathname;
      if (path !== '/' && path !== '') {
        await sleep(200);
        continue;
      }

      // Check editor ready
      const editor = _queryWithFallback('composer');
      if (editor) {
        // Verify editor is interactive (not disabled/loading)
        const isDisabled = editor.getAttribute('aria-disabled') === 'true' ||
                          editor.closest('[aria-busy="true"]');
        if (!isDisabled) {
          editorReady = true;
          break;
        }
      }

      await sleep(200);
    }

    if (editorReady) {
      log('New chat ready sau', Date.now() - startTime, 'ms');
      // Extra sleep để React hydrate hoàn toàn
      await sleep(300);
      return true;
    }

    log('WARN: Editor không ready sau', timeoutMs, 'ms');
    return false;
  }

  // ============ HELPER: Deactivate image mode TRƯỚC khi submit text (Prompt enhance flow) ============
  // ChatGPT giữ image mode active xuyên session (sticky). Nếu Prompt node enhance gọi text-only mà
  // image mode vẫn ON → ChatGPT có thể trả về image hoặc reply mang context image-gen → response sai.
  // Giải pháp: detect image mode active (qua ratio button visible) → click composer plus → click
  // "Create image" item để toggle off → quay về plain chat.
  async function deactivateImageModeIfActive() {
    const ratioBtn = _queryWithFallback('ratio_button');
    if (!ratioBtn) return false; // Đã ở text mode

    console.log('[ChatGPT] Image mode đang active — deactivate trước khi submit text');

    // Click element qua cả PointerEvent chain + React onClick (Radix menuitemradio cần onSelect)
    const clickEl = (el) => {
      if (!el) return;
      try { simulateClick(el); } catch (_) {}
      const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
      const props = propsKey ? el[propsKey] : null;
      try {
        if (props && typeof props.onSelect === 'function') {
          props.onSelect({ preventDefault() {}, stopPropagation() {} });
        } else if (props && typeof props.onClick === 'function') {
          props.onClick({ preventDefault() {}, stopPropagation() {}, nativeEvent: new MouseEvent('click'), type: 'click', target: el, currentTarget: el });
        }
      } catch (_) {}
    };

    // 1. Đóng menu cũ nếu đang mở
    try {
      const openMenu = _queryWithFallback('open_menu');
      if (openMenu) {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await sleep(80);
      }
    } catch (_) {}

    // 2. Click composer plus
    const plusBtn = _queryWithFallback('plus_button');
    if (!plusBtn) {
      console.warn('[ChatGPT] deactivateImageMode: composer plus button không tìm thấy');
      return false;
    }
    clickEl(plusBtn);

    // 3. Chờ menu render
    let menu = null;
    for (let i = 0; i < 6; i++) {
      await sleep(80);
      menu = document.querySelector('div[role="menu"][data-radix-menu-content][data-state="open"]');
      if (menu) break;
    }
    if (!menu) {
      console.warn('[ChatGPT] deactivateImageMode: menu không render');
      return false;
    }

    // 4. Tìm "Create image" item và toggle off (chỉ click khi đang checked)
    const items = _queryAllWithFallback('menu_items', null, menu);
    for (const item of items) {
      const text = (item.innerText || '').trim().toLowerCase();
      if (text === 'create image' || text === 'create an image' || text.startsWith('create image')) {
        const checked = item.getAttribute('aria-checked') === 'true' || item.getAttribute('data-state') === 'checked';
        if (checked) {
          clickEl(item);
          console.log('[ChatGPT] deactivateImageMode: đã click toggle off');
        }
        break;
      }
    }

    // 5. Đóng menu (Escape) — phòng trường hợp menu không tự đóng
    await sleep(150);
    try {
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    } catch (_) {}
    await sleep(150);

    // 6. Verify ratio button đã biến mất → image mode off
    const stillActive = !!_queryWithFallback('ratio_button');
    return !stillActive;
  }

  // ============ HELPER: Activate image mode VÀ chọn ratio TRƯỚC khi submit ============
  // Flow thực tế ChatGPT: Click plus → Create image → chọn ratio → upload refs → input text → submit
  // Ratio mapping: '1:1' | '16:9' | '9:16' (ChatGPT chỉ hỗ trợ 3 ratio này)
  async function activateImageMode(ratio = '1:1') {
    const ratioBtn = _queryWithFallback('ratio_button');

    // Click element qua cả PointerEvent chain + React onClick
    const clickEl = (el) => {
      if (!el) return;
      try { simulateClick(el); } catch (_) {}
      const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
      const props = propsKey ? el[propsKey] : null;
      try {
        if (props && typeof props.onSelect === 'function') {
          props.onSelect({ preventDefault() {}, stopPropagation() {} });
        } else if (props && typeof props.onClick === 'function') {
          props.onClick({ preventDefault() {}, stopPropagation() {}, nativeEvent: new MouseEvent('click'), type: 'click', target: el, currentTarget: el });
        }
      } catch (_) {}
    };

    // Nếu image mode chưa active → activate
    if (!ratioBtn) {
      console.log('[ChatGPT] Image mode chưa active — đang activate...');

      // 1. Đóng menu cũ nếu đang mở
      try {
        const openMenu = _queryWithFallback('open_menu');
        if (openMenu) {
          document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await sleep(80);
        }
      } catch (_) {}

      // 2. Click composer plus
      const plusBtn = _queryWithFallback('plus_button');
      if (!plusBtn) {
        console.warn('[ChatGPT] activateImageMode: composer plus button không tìm thấy');
        return false;
      }
      clickEl(plusBtn);

      // 3. Chờ menu render
      let menu = null;
      for (let i = 0; i < 6; i++) {
        await sleep(80);
        menu = document.querySelector('div[role="menu"][data-radix-menu-content][data-state="open"]');
        if (menu) break;
      }
      if (!menu) {
        console.warn('[ChatGPT] activateImageMode: menu không render');
        return false;
      }

      // 4. Click "Create image" để toggle on
      const items = _queryAllWithFallback('menu_items', null, menu);
      let found = false;
      for (const item of items) {
        const text = (item.innerText || '').trim().toLowerCase();
        if (text === 'create image' || text === 'create an image' || text.startsWith('create image')) {
          const checked = item.getAttribute('aria-checked') === 'true' || item.getAttribute('data-state') === 'checked';
          if (!checked) {
            clickEl(item);
            console.log('[ChatGPT] activateImageMode: đã click toggle on "Create image"');
          }
          found = true;
          break;
        }
      }
      if (!found) {
        console.warn('[ChatGPT] activateImageMode: không tìm thấy "Create image" item');
        // Đóng menu
        try { document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (_) {}
        return false;
      }

      // 5. Chờ ratio button xuất hiện
      await sleep(300);
    }

    // 6. Chọn ratio nếu được chỉ định
    if (ratio) {
      const newRatioBtn = _queryWithFallback('ratio_button');
      if (newRatioBtn) {
        // Map ratio key → aria-label (sync với background.js ARIA_LABEL_MAP)
        const RATIO_ARIA_MAP = {
          story: 'Story 9:16',
          portrait: 'Portrait 3:4',
          square: 'Square 1:1',
          landscape: 'Landscape 4:3',
          widescreen: 'Widescreen 16:9',
          '9:16': 'Story 9:16',
          '3:4': 'Portrait 3:4',
          '1:1': 'Square 1:1',
          '4:3': 'Landscape 4:3',
          '16:9': 'Widescreen 16:9',
        };
        const targetAriaLabel = RATIO_ARIA_MAP[ratio] || null;

        // Click ratio button để mở dropdown
        clickEl(newRatioBtn);
        await sleep(150);

        // Tìm ratio option trong dropdown
        const ratioMenu = _queryWithFallback('open_menu');
        if (ratioMenu) {
          const ratioItems = _queryAllWithFallback('menu_items', null, ratioMenu);
          let found = false;
          for (const item of ratioItems) {
            // Primary: match aria-label exact
            if (targetAriaLabel && item.getAttribute('aria-label') === targetAriaLabel) {
              clickEl(item);
              console.log('[ChatGPT] activateImageMode: đã chọn ratio via aria-label', ratio, targetAriaLabel);
              found = true;
              break;
            }
          }
          // Fallback: match text case-insensitive
          if (!found) {
            const ratioLower = ratio.toLowerCase();
            for (const item of ratioItems) {
              const text = (item.innerText || '').trim().toLowerCase();
              if (text === ratioLower || text.includes(ratioLower) || text.includes(ratio)) {
                clickEl(item);
                console.log('[ChatGPT] activateImageMode: đã chọn ratio via text fallback', ratio);
                found = true;
                break;
              }
            }
          }
        }
        await sleep(150);
        // Đóng menu nếu còn mở
        try { document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (_) {}
      }
    }

    // 7. Verify image mode đã active
    await sleep(200);
    const verified = !!_queryWithFallback('ratio_button');
    console.log('[ChatGPT] activateImageMode: verified =', verified);
    return verified;
  }

  // Prefix bắt LLM enhance prompt thành detailed, descriptive text cho AI image/video generator.
  // Output luôn bằng English (AI generators hoạt động tốt nhất với English).
  // Áp dụng cho Prompt node enhance (cả ChatGPT lẫn Gemini).
  // English version làm fallback (ưu tiên) vì LLM hiểu tốt hơn.
  const PROMPT_ENHANCE_PREFIXES = {
    en: 'Enhance and expand the following idea into a detailed, descriptive prompt for an AI image/video generator. Output in English only. Include relevant details like style, lighting, mood, composition, and camera angle where appropriate. Return ONLY the raw prompt text — no markdown, no explanation, no preamble (like "Here is..." or "Sure,..."), no quotation marks, no image generation:\n\n',
    vi: 'Cải tiến và mở rộng ý tưởng sau thành một prompt chi tiết, mô tả đầy đủ cho AI image/video generator. Output bằng tiếng Anh. Bao gồm các chi tiết như style, ánh sáng, mood, bố cục, góc camera khi phù hợp. Chỉ trả về nội dung prompt thuần — KHÔNG markdown, KHÔNG giải thích, KHÔNG preamble (như "Đây là..." hay "Sure,..."), KHÔNG dấu ngoặc kép, KHÔNG tạo ảnh:\n\n',
    ja: '以下のアイデアをAI画像/動画ジェネレーター用の詳細で説明的なプロンプトに拡張・改善してください。出力は英語のみ。スタイル、照明、ムード、構図、カメラアングルなどの関連詳細を含めてください。生のプロンプトテキストのみを返してください — マークダウンなし、説明なし、前置き（「こちらが...」や「Sure,...」など）なし、引用符なし、画像生成なし:\n\n',
    th: 'ปรับปรุงและขยายไอเดียต่อไปนี้ให้เป็น prompt ที่มีรายละเอียดและอธิบายครบถ้วนสำหรับ AI image/video generator ส่งออกเป็นภาษาอังกฤษเท่านั้น รวมรายละเอียดที่เกี่ยวข้อง เช่น สไตล์ แสง อารมณ์ การจัดองค์ประกอบ และมุมกล้องตามความเหมาะสม ส่งคืนเฉพาะข้อความ prompt ดิบเท่านั้น — ไม่มี markdown ไม่มีคำอธิบาย ไม่มีคำนำ (เช่น "นี่คือ..." หรือ "Sure,...") ไม่มีเครื่องหมายคำพูด ไม่สร้างภาพ:\n\n',
  };

  // Helper: lấy enhance prefix theo ngôn ngữ user setting (fallback: English)
  async function getEnhancePrefix() {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['af_locale'], r => resolve(r));
      });
      const locale = result?.af_locale || 'en';
      return PROMPT_ENHANCE_PREFIXES[locale] || PROMPT_ENHANCE_PREFIXES.en;
    } catch (e) {
      return PROMPT_ENHANCE_PREFIXES.en; // Fallback English
    }
  }

  // ============ HELPER: Inject ref images vào ChatGPT (extract từ Phase X) ============
  // Dùng chung cho cả listener `chatAI:execute` (Phase X) và `chatgpt:submitAndWait` (CG-3).
  async function injectRefImages(images) {
    if (!images || images.length === 0) return true;

    // CRITICAL — remove ref images cũ TRƯỚC upload mới.
    // Nếu user đã upload ref ở session trước (chưa clear), upload mới sẽ append → preview
    // có ref cũ + ref mới → submit context sai. Match Flow/Grok pattern.
    await removeExistingChatGPTRefImages();
    await sleep(300);

    // Convert base64 thành File objects
    const files = images.map(img => {
      const binary = atob(img.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new File([bytes], img.name || 'image.png', { type: img.type || 'image/png' });
    });

    // Tìm input file — RETRY trước khi fallback click plus (tránh mở menu reset image mode)
    // Input #upload-photos có class sr-only (hidden) nhưng LUÔN tồn tại trong DOM
    let fileInput = null;
    for (let retry = 0; retry < 3; retry++) {
      fileInput = _queryWithFallback('file_input');
      if (fileInput) break;
      await sleep(200);
    }

    // Fallback: tìm bất kỳ file input nào accept image (không click plus)
    if (!fileInput) {
      fileInput = document.querySelector('input[type="file"][accept*="image"]');
    }

    // LAST RESORT: Click plus button — nhưng ĐÂY SẼ MỞ MENU VÀ CÓ THỂ RESET IMAGE MODE!
    // Sau đó step 4b trong chatgpt:submitAndWait sẽ re-activate image mode
    if (!fileInput) {
      console.warn('[ChatGPT] #upload-photos không tìm thấy, fallback click plus button');
      const plusBtn = _queryWithFallback('plus_button');
      if (plusBtn) {
        simulateClick(plusBtn);
        await sleep(300);
        fileInput = _queryWithFallback('file_input');
        // Đóng menu ngay lập tức để giảm thiểu ảnh hưởng đến state
        try {
          document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        } catch (_) {}
        await sleep(100);
      }
    }

    if (!fileInput) {
      console.error('[ChatGPT] Không tìm thấy input file để upload ref image');
      return false;
    }

    // Inject files qua DataTransfer
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Chờ preview xuất hiện. Bug 57 fix: interruptibleSleep để user forceStop break sớm
    // trong cửa sổ 2s này (longest single-sleep window pre-submit).
    await interruptibleSleep(2000, 'after-upload-files');
    return true;
  }

  // ============ HELPER: Inject text + click submit (extract từ Phase X) ============
  // ============================================================================
  //  ChatGPT injectTextAndSubmit — pipeline 7 steps với fallback chain
  //  Test verified 2026-05-09 (chatgpt-submit-prompt-test.txt)
  // ============================================================================
  //
  //  ┌─ CLEAR (Step 1b) — chỉ chạy khi editor có stale text ─────────────────┐
  //  │ Tier 1 'selectAllDelete'   PRIMARY  ✅ verified work                   │
  //  │   → execCommand('selectAll') + execCommand('delete')                  │
  //  │ Tier 2 'innerHTMLReset'    FALLBACK ✅ verified work (Test 7 manual)   │
  //  │   → editor.innerHTML = '<p><br/></p>' + InputEvent('input')           │
  //  └────────────────────────────────────────────────────────────────────────┘
  //
  //  ┌─ INSERT (Step 2) ─────────────────────────────────────────────────────┐
  //  │ Tier 1 'pasteEvent'        PRIMARY  ✅ verified work (smoke test)      │
  //  │   → ClipboardEvent('paste') + DataTransfer text/plain                 │
  //  │ Tier 2 'execCommand'       FALLBACK ✅ verified work (Test 2)          │
  //  │   → document.execCommand('insertText', false, text)                   │
  //  │ Tier 3 'innerHTMLReplace'  LAST     ✅ verified work (Test 3)          │
  //  │   → editor.innerHTML = '<p>...</p>' + InputEvent('input')             │
  //  │ ❌ 'reactPropsBeforeInput'  DEAD     ❌ verified fail (Test 1)          │
  //  │   → editor #prompt-textarea KHÔNG có __reactProps$ key → ĐÃ BỎ        │
  //  └────────────────────────────────────────────────────────────────────────┘
  //
  //  ┌─ SUBMIT (Step 3-7) ───────────────────────────────────────────────────┐
  //  │ Tier 1 'enterKey'          PRIMARY  ✅ verified work (smoke test)      │
  //  │   → KeyboardEvent('keydown' + 'keypress' + 'keyup') trên editor       │
  //  │ Tier 2 'simulateClick'     FALLBACK ✅ verified work (Test 4)          │
  //  │   → PointerEvent + MouseEvent chain trên submit button                │
  //  │ Tier 3 'reactOnClick'      FALLBACK ✅ verified work (Test 5)          │
  //  │   → submitBtn.__reactProps.onClick (plain object, KHÔNG có isTrusted) │
  //  │ Tier 4 'formRequestSubmit' LAST     ✅ verified work (Test 6)          │
  //  │   → form.requestSubmit(submitBtn) — HTML standard, native trusted     │
  //  │   ⭐ Resilient nhất khi OpenAI siết trust check tương lai             │
  //  └────────────────────────────────────────────────────────────────────────┘
  //
  //  ┌─ Force test flag (cross-world dataset, set qua DevTools console) ─────┐
  //  │ document.documentElement.dataset.tobyChatgptClearForce  = '...'        │
  //  │ document.documentElement.dataset.tobyChatgptInsertForce = '...'        │
  //  │ document.documentElement.dataset.tobyChatgptSubmitForce = '...'        │
  //  │ Reset: delete document.documentElement.dataset.tobyChatgpt<X>Force     │
  //  └────────────────────────────────────────────────────────────────────────┘
  // ============================================================================
  async function injectTextAndSubmit(text) {
    const log = (...args) => console.log('[ChatGPT-submit]', ...args);

    // 1. Tìm editor ProseMirror
    let editor = await waitForElement('#prompt-textarea');
    if (!editor) {
      editor = document.querySelector('div.ProseMirror[role="textbox"]');
    }
    if (!editor) {
      log('FAIL: EDITOR_NOT_FOUND');
      throw new Error('EDITOR_NOT_FOUND');
    }
    log('Step 1: Editor found', editor.id || editor.className);

    editor.focus();
    await sleep(150);

    // 1b. CLEAR editor — Force flag: document.documentElement.dataset.tobyChatgptClearForce
    //     Tiers: 'selectAllDelete' (primary), 'innerHTMLReset' (fallback)
    //     CRITICAL: KHÔNG clear khi editor đã empty (sẽ phá ProseMirror state).
    const clearForce = document.documentElement.dataset.tobyChatgptClearForce || null;
    if (clearForce) log('Step 1b [FORCE=' + clearForce + ']');
    const editorTextBeforeClear = (editor.textContent || '').trim();
    if (editorTextBeforeClear.length > 0 || clearForce) {
      log('Step 1b: Clearing editor (length=' + editorTextBeforeClear.length + ')');
      try {
        // Tier selectAllDelete (primary)
        if (!clearForce || clearForce === 'selectAllDelete') {
          log('Step 1b[selectAllDelete]: execCommand selectAll+delete');
          document.execCommand('selectAll', false, null);
          await sleep(50);
          document.execCommand('delete', false, null);
          await sleep(100);
        }
        // Tier innerHTMLReset (fallback nếu primary fail HOẶC force)
        const stillHasText = (editor.textContent || '').trim().length > 0;
        if (clearForce === 'innerHTMLReset' || (!clearForce && stillHasText)) {
          log('Step 1b[innerHTMLReset]: editor.innerHTML reset');
          editor.innerHTML = '<p><br class="ProseMirror-trailingBreak"></p>';
          editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContent' }));
          await sleep(80);
        }
        log('Step 1b OK: editor cleared, current length=', editor.textContent.length);
      } catch (clearErr) {
        log('Step 1b clear failed (non-fatal):', clearErr.message);
      }
      editor.focus();
      await sleep(80);
    } else {
      log('Step 1b: Editor đã empty, skip clear (tránh phá ProseMirror state)');
    }

    // 2. INSERT — Force flag: document.documentElement.dataset.tobyChatgptInsertForce
    //    Tiers: 'pasteEvent' (primary) | 'execCommand' | 'innerHTMLReplace'
    //    BỎ tier reactPropsBeforeInput: VERIFIED dead code (Test 1 2026-05-09)
    //      → ChatGPT ProseMirror editor #prompt-textarea KHÔNG có __reactProps$ key
    const insertForce = document.documentElement.dataset.tobyChatgptInsertForce || null;
    if (insertForce) log('Step 2 [FORCE=' + insertForce + ']');
    const sample = text.substring(0, Math.min(20, text.length));
    const inserted = () => editor.textContent.includes(sample);

    // Tier pasteEvent (primary)
    if (!insertForce || insertForce === 'pasteEvent') {
      log('Step 2[pasteEvent]: ClipboardEvent paste, length=', text.length);
      try {
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
        await sleep(300);
      } catch (e) { log('Step 2[pasteEvent] fail:', e.message); }
    }

    // Tier execCommand
    if (insertForce === 'execCommand' || (!insertForce && !inserted())) {
      log('Step 2[execCommand]: document.execCommand insertText');
      document.execCommand('insertText', false, text);
      await sleep(200);
    }

    // Tier innerHTMLReplace (last resort)
    if (insertForce === 'innerHTMLReplace' || (!insertForce && !inserted())) {
      log('Step 2[innerHTMLReplace]: editor.innerHTML + InputEvent (last resort)');
      editor.innerHTML = `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      await sleep(200);
    }

    // [B] Fix force silent fail: nếu force mode nhưng tier skip (no-op) → editor empty → submit empty
    // Verify sau insert, nếu force mode + insert fail → throw rõ ràng thay vì silent submit empty.
    if (insertForce && !inserted()) {
      log('Step 2 [FORCE=' + insertForce + '] FAILED: tier không insert được text. Editor length=' + editor.textContent.length);
      throw new Error('FORCE_INSERT_TIER_FAILED:' + insertForce);
    }

    // CRITICAL: Dispatch input event SAU paste để React's ProseMirror onChange handler chạy.
    // ClipboardEvent paste cập nhật DOM nhưng đôi khi React state không sync → submit button
    // visually enabled nhưng React internal state still empty → click không submit.
    editor.dispatchEvent(new InputEvent('input', {
      bubbles: true, cancelable: true,
      inputType: 'insertFromPaste', data: text,
    }));
    await sleep(150);

    log('Step 2 OK: editor.textContent length=', editor.textContent.length);

    // 3-7. SUBMIT — Force flag: document.documentElement.dataset.tobyChatgptSubmitForce
    //      Tiers: 'enterKey' (primary) | 'simulateClick' | 'reactOnClick' | 'formRequestSubmit'
    const submitForce = document.documentElement.dataset.tobyChatgptSubmitForce || null;
    if (submitForce) log('Step 3-7 [FORCE=' + submitForce + ']');
    const submitted = () => (editor.textContent || '').trim().length < 5;

    // Tier enterKey (primary)
    if (!submitForce || submitForce === 'enterKey') {
      log('Step 3[enterKey]: KeyboardEvent keydown+keypress+keyup');
      editor.focus();
      await sleep(80);
      const enterOpts = {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
        bubbles: true, cancelable: true, composed: true,
      };
      try {
        editor.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
        editor.dispatchEvent(new KeyboardEvent('keypress', enterOpts));
        editor.dispatchEvent(new KeyboardEvent('keyup', enterOpts));
      } catch (e) { log('Step 3[enterKey] dispatch fail:', e.message); }
      await sleep(1500);
      if (submitted()) {
        log('Step 4 OK: editor cleared → submit thành công via enterKey');
        return true;
      }
      // Force mode: don't fall through (chỉ test 1 tier)
      if (submitForce === 'enterKey') {
        log('Step 4 [FORCE=enterKey] DONE: editor still has text');
        return true;
      }
    }

    // Tier simulateClick + reactOnClick (Step 5 — share logic find button)
    let sendBtn = null;
    if (submitForce === 'simulateClick' || submitForce === 'reactOnClick' || (!submitForce && !submitted())) {
      log('Step 5: tìm submit button cho simulateClick/reactOnClick fallback');
      const start = Date.now();
      while (Date.now() - start < 3000) {
        const candidate = _queryWithFallback('submit_button') ||
                          _queryWithFallback('submit_button');
        if (candidate && !candidate.disabled) { sendBtn = candidate; break; }
        await sleep(150);
      }
      if (!sendBtn) {
        log('FAIL: SEND_BUTTON_NOT_FOUND_OR_DISABLED. Editor content:', editor.textContent.substring(0, 50));
        if (submitForce) return true; // Force mode tolerant
        throw new Error('SEND_BUTTON_NOT_FOUND');
      }

      // Tier simulateClick
      if (!submitForce || submitForce === 'simulateClick') {
        log('Step 5[simulateClick]: PointerEvent + MouseEvent chain');
        const rect = sendBtn.getBoundingClientRect();
        const opts = { bubbles: true, cancelable: true, view: window,
          clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
        try {
          sendBtn.dispatchEvent(new PointerEvent('pointerdown', opts));
          sendBtn.dispatchEvent(new MouseEvent('mousedown', opts));
          sendBtn.dispatchEvent(new PointerEvent('pointerup', opts));
          sendBtn.dispatchEvent(new MouseEvent('mouseup', opts));
          sendBtn.dispatchEvent(new MouseEvent('click', opts));
        } catch (e) { log('Step 5[simulateClick] fail:', e.message); }
      }

      // Tier reactOnClick (chạy sau simulateClick trong production, hoặc force isolated)
      if (submitForce === 'reactOnClick' || (!submitForce)) {
        const propsKey = Object.keys(sendBtn).find(k => k.startsWith('__reactProps$'));
        const props = propsKey ? sendBtn[propsKey] : null;
        if (props && typeof props.onClick === 'function') {
          log('Step 5[reactOnClick]: React props onClick (plain object, no isTrusted)');
          try {
            props.onClick({
              preventDefault() {}, stopPropagation() {},
              nativeEvent: new MouseEvent('click'),
              type: 'click', target: sendBtn, currentTarget: sendBtn,
            });
          } catch (e) { log('Step 5[reactOnClick] fail:', e.message); }
        } else if (submitForce === 'reactOnClick') {
          log('Step 5[reactOnClick] skip: __reactProps.onClick not found');
        }
      }

      // Verify (production mode only — force mode return ngay)
      if (!submitForce) {
        await sleep(1500);
        if (submitted()) {
          log('Step 6 OK: editor cleared sau click → submit thành công');
          return true;
        }
      } else if (submitForce === 'simulateClick' || submitForce === 'reactOnClick') {
        log('Step 6 [FORCE=' + submitForce + '] DONE');
        return true;
      }
    }

    // Tier formRequestSubmit (Step 7 — last resort hoặc force)
    if (submitForce === 'formRequestSubmit' || (!submitForce && !submitted())) {
      log('Step 7[formRequestSubmit]: form.requestSubmit() native HTML');
      try {
        const formBtn = sendBtn || _queryWithFallback('submit_button') || _queryWithFallback('submit_button');
        const form = (formBtn && formBtn.closest('form')) || editor.closest('form');
        if (form && typeof form.requestSubmit === 'function') {
          form.requestSubmit(formBtn);
          await sleep(1000);
          if (submitted()) {
            log('Step 7[formRequestSubmit] OK: editor cleared');
            return true;
          }
          log('Step 7[formRequestSubmit] không clear editor');
        } else {
          log('Step 7[formRequestSubmit] skip: form không tồn tại hoặc không hỗ trợ requestSubmit');
        }
      } catch (e) {
        log('Step 7[formRequestSubmit] fail:', e.message);
      }
    }

    log('Step 7 DONE: All submit strategies đã thử');
    return true;
  }

  // ============ Wrapper Phase X: giữ tương thích listener `chatAI:execute` ============
  async function uploadImages(images) {
    try {
      return await injectRefImages(images);
    } catch (err) {
      console.error('[ChatAI] uploadImages error:', err.message);
      return false;
    }
  }

  async function insertText(text) {
    let editor = await waitForElement('#prompt-textarea');
    if (!editor) {
      editor = document.querySelector('div.ProseMirror[role="textbox"]');
      if (!editor) {
        console.error('[ChatAI] Không tìm thấy ô nhập text trên ChatGPT');
        return false;
      }
    }
    editor.focus();
    await sleep(200);
    document.execCommand('insertText', false, text);
    await sleep(200);
    if (!editor.textContent.includes(text.substring(0, 20))) {
      editor.innerHTML = `<p>${text}</p>`;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
    return true;
  }

  async function clickSubmit() {
    await sleep(500);
    let sendBtn = null;
    const start = Date.now();
    while (Date.now() - start < 5000) {
      sendBtn = _queryWithFallback('submit_button') ||
                document.querySelector('button.composer-submit-button-color:not([disabled])');
      if (sendBtn && !sendBtn.disabled) break;
      sendBtn = null;
      await sleep(300);
    }
    if (!sendBtn) {
      console.error('[ChatAI] Không tìm thấy nút gửi trên ChatGPT');
      return false;
    }
    simulateClick(sendBtn);
    return true;
  }

  // ============ CG-3.x: Check ChatGPT image creation limit alert (free plan) ============
  // ChatGPT free plan khi hết quota image gen sẽ hiện banner trên editor:
  // "You've reached your image creation limit. Upgrade to ChatGPT Plus or try again after H:MM AM/PM."
  // Detect TRƯỚC khi submit → tránh lãng phí thao tác.
  function checkImageLimitAlert() {
    // Normalize: chuyển ký tự đặc biệt về ASCII để match đa dạng quotes
    const normalize = (s) => (s || '')
      .replace(/[’‘]/g, "'")        // smart quotes → apostrophe
      .replace(/[  ]/g, ' ')        // narrow/non-break space → space
      .toLowerCase();

    // Tìm trong body.innerText (rẻ + reliable)
    const bodyText = normalize(document.body?.innerText || '');
    const limitPhrase = "reached your image creation limit";
    if (!bodyText.includes(limitPhrase)) return null;

    // Extract message gốc (trước normalize) để hiện cho user
    const fullText = document.body?.innerText || '';
    // Tìm câu chứa phrase (split theo "."  hoặc "\n")
    const sentences = fullText.split(/[\n]+/);
    let matchSentence = '';
    for (const sent of sentences) {
      if (normalize(sent).includes(limitPhrase)) {
        matchSentence = sent.trim();
        break;
      }
    }
    return {
      detected: true,
      message: matchSentence || "You've reached your image creation limit on the free plan.",
    };
  }

  // ============ CG-3.1: Snapshot conversation state ============
  // Lưu turnCount + 5 turn ID gần nhất + existing image file_ids để waitForImageResult so sánh.
  // CRITICAL: existingImageFileIds dùng để loại trừ ảnh CŨ trong chat history khi global fallback
  // detect → tránh bug "submit prompt trên chat có lịch sử → ext download ảnh cũ ngay".
  function snapshotConversationState() {
    const turns = _queryAllWithFallback('conversation_turn');

    // Capture file_ids của TẤT CẢ CDN images (generated + ref/uploaded) trên page TRƯỚC submit
    // FIX: Trước chỉ capture generated images → ref images không bị filter → bug download ref
    const existingImageFileIds = new Set();
    const allCdnImgs = document.querySelectorAll(
      'img[src*="estuary/content"], img[src*="oaiusercontent"], img[src*="sandboxed.openai"], img[src*="/backend-api/"]'
    );
    for (const img of allCdnImgs) {
      if (!img.src) continue;
      const m = img.src.match(/[?&]id=(file_[a-z0-9]+)/i);
      if (m) existingImageFileIds.add(m[1]);
    }
    console.log('[ChatGPT-snapshot] 📸 Baseline:', turns.length, 'turns,', existingImageFileIds.size, 'existing file_ids (incl. refs)');

    return {
      turnCount: turns.length,
      existingImageFileIds, // Set<file_xxx> — bao gồm cả generated + ref/uploaded
      lastTurnIds: Array.from(turns)
        .slice(-5)
        .map(t => t.dataset.turnId || t.dataset.testid),
      timestamp: Date.now(),
    };
  }

  // ============ CG-3.1: Streaming detection (multi-signal) ============
  // ChatGPT image gen DOM THẬT (verify từ chatgpt-Generating-dom.html):
  // - KHÔNG có [data-testid="stop-button"]
  // - Signal RELIABLE: element có aria-label="Generating image..." trong turn
  // - Send button có thể disabled hoặc không
  function isStreaming(turnEl) {
    // (A) PRIMARY signal cho image gen: generating indicator trong turn hoặc global
    if (_hasGeneratingIndicator(turnEl)) return true;
    if (_hasGeneratingIndicator()) return true;

    // (B) Stop button tồn tại global khi đang stream text (không phải image)
    if (_queryWithFallback('stop_button')) return true;

    // (C) Send button đang disabled (state trong khi assistant đang trả lời)
    const sendBtn = _queryWithFallback('submit_button');
    if (sendBtn?.disabled) return true;

    // (D) Có skeleton/shimmer/animate-pulse trong turn nhưng chưa có img generated
    const hasSkeleton = turnEl.querySelector(
      '[class*="skeleton"], [class*="shimmer"], [class*="animate-pulse"]'
    );
    const hasImg = !!_findGeneratedImg(turnEl);
    if (hasSkeleton && !hasImg) return true;

    return false;
  }

  // ============ CG-3.1 Helper: Tìm img đã generated trong turn ============
  // ChatGPT CDN có thể là: estuary/content?id=file_xxx, oaiusercontent.com,
  // sandboxed.openai.com, files.oaiusercontent.com... → match nhiều pattern.
  // Loại blur-2xl backdrop duplicate.
  // PRIORITY: alt-based TRƯỚC (signal mạnh nhất — chỉ image gen mới có alt^="Generated image")
  // → loại trừ ref/uploaded images (alt="Uploaded image") cùng có estuary URL.
  function _findGeneratedImg(turnEl) {
    // Priority 1: alt-based (reliable — chỉ image gen có alt này)
    const altMatch = turnEl.querySelector('img[alt^="Generated image"]');
    if (altMatch && !altMatch.classList.contains('blur-2xl') && altMatch.src) return altMatch;

    // Priority 2: estuary/CDN URL (fallback nếu alt missing)
    // FIX: INCLUSIVE filter — chỉ chấp nhận "Generated image..." hoặc "" (siblings)
    // ChatGPT đã đổi alt của ref images từ "Uploaded image" sang UUID
    const candidates = turnEl.querySelectorAll(
      'img[src*="estuary/content"], img[src*="oaiusercontent"], img[src*="sandboxed.openai"]'
    );
    for (const img of candidates) {
      if (img.classList.contains('blur-2xl')) continue;
      const alt = img.getAttribute('alt') || '';
      const isGenerated = alt.toLowerCase().startsWith('generated image');
      const isSibling = alt === '';
      if (!isGenerated && !isSibling) continue;
      if (img.src) return img;
    }
    return null;
  }

  // ============ CG-3.1: Error detection ============
  // Patterns được wire qua admin /admin/system-settings?section=chatgpt → endpoint
  // GET /api/v1/system-config/chatgpt → ChatGPTConfig fetch + cache vào
  // chrome.storage.local.af_chatgpt_config (TTL 1h).
  //
  // Content script đọc storage on init, fallback hardcoded patterns nếu storage rỗng
  // (lần đầu install / fetch fail / chưa có sidebar mở).
  // Khi admin đổi pattern + extension refresh cache → next reload tab chatgpt.com sẽ load patterns mới.

  // Fallback hardcode (giữ làm safety net khi storage chưa có config)
  const FALLBACK_PATTERNS = {
    rateLimit: [
      "you've reached your limit", "you've hit the plus plan limit", 'rate limit',
      'too many requests', 'please upgrade', 'limit will reset', 'limit resets in',
      'daily limit', 'reached the daily maximum', 'generating images too quickly',
      'create more images when the limit',
    ],
    contentBlocked: [
      "can't create", 'cannot generate', "can't generate", 'content policy',
      'violates our content polic', 'violates our usage polic', 'this request violates',
      'may violate our content polic', 'prompt may violate', 'may violate our guardrails',
      'request violates generation policy', 'safety system', 'not allowed by our safety system',
      'unable to create', 'unable to generate images for that request',
      'unable to generate the requested image', 'violate our guardrails',
    ],
    imageGenFailed: [
      'experienced an error when generating images', 'experienced an error when generating image',
      'something went wrong while generating your image', "couldn't generate the image",
      "couldn't generate that image", "couldn't create the image", "couldn't create that image",
      'trouble generating that image', 'trouble generating the image', 'error generating image',
      'error creating images', 'error creating message', 'failed to generate the image',
      'failed to generate image', 'unable to generate the image', 'unable to generate that image',
      'unable to generate images directly', "can't generate images at the moment",
      'contact us through our help center',
    ],
    network: [
      'network error', 'something went wrong', 'connection error',
      'please check your internet', 'we are currently processing too many requests',
    ],
    textOnly: [
      "i'm sorry, but i", "i apologize, but", "i'm unable to", "i cannot",
      "unfortunately, i", "i'm not able to", "as an ai", "as a language model",
      "i don't have the ability", "i can't directly", "instead of generating",
      "rather than creating an image", "let me describe", "here's a description",
      "i'll describe", "instead, i can", "however, i can", "but i can help",
      "i can help you with", "let me help you", "i can assist",
    ],
  };

  // Active patterns — populated từ chrome.storage on init, fallback hardcode
  let _activePatterns = { ...FALLBACK_PATTERNS };

  // Parse pipe-separated string thành array lowercase
  function _parsePatternString(str) {
    if (!str || typeof str !== 'string') return [];
    return str.split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  // Load patterns từ chrome.storage.local.af_chatgpt_config (set bởi ChatGPTConfig.fetch)
  async function _loadPatternsFromStorage() {
    try {
      const result = await new Promise((r) => chrome.storage.local.get(['af_chatgpt_config'], r));
      const cfg = result?.af_chatgpt_config?.data;
      if (!cfg) return;
      const next = {};
      next.rateLimit = _parsePatternString(cfg.rate_limit_error_text);
      next.contentBlocked = _parsePatternString(cfg.content_blocked_text);
      next.imageGenFailed = _parsePatternString(cfg.image_gen_failed_text);
      next.network = _parsePatternString(cfg.network_error_text);
      next.textOnly = _parsePatternString(cfg.text_only_pattern);
      // Chỉ override field nào có giá trị từ admin (rỗng → giữ fallback)
      for (const k of Object.keys(next)) {
        if (next[k].length > 0) _activePatterns[k] = next[k];
      }
      console.log('[ChatGPT] error patterns loaded from admin config');
    } catch (e) { /* ignore — giữ fallback */ }
  }

  // Init load — async, hoàn thành trước khi user submit prompt đầu tiên (vài giây sau)
  _loadPatternsFromStorage();

  // Listen storage changes — khi sidebar refresh ChatGPTConfig, tab chatgpt.com cũng cập nhật
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.af_chatgpt_config) {
        _loadPatternsFromStorage();
      }
    });
  } catch (e) { /* ignore in non-extension context */ }

  function detectError(turnEl) {
    const text = (turnEl.innerText || '').toLowerCase();
    if (_activePatterns.rateLimit.some(p => text.includes(p))) return 'RATE_LIMIT';
    if (_activePatterns.contentBlocked.some(p => text.includes(p))) return 'CONTENT_BLOCKED';
    if (_activePatterns.imageGenFailed.some(p => text.includes(p))) return 'IMAGE_GEN_FAILED';
    if (_activePatterns.network.some(p => text.includes(p))) return 'NETWORK';
    return null;
  }

  // ============ CG-3.1: Extract image URLs từ turn ============
  // ChatGPT CDN có thể là: estuary/content, oaiusercontent.com, sandboxed.openai.com
  // Bỏ qua duplicate blur backdrop (class blur-2xl) và dedup theo FILE_ID (không phải full URL).
  // Reference DOM verified (chatgpt-chat-content.md): 1 generated image render thành 3 <img>
  // tags với cùng file_id nhưng signature/timestamp khác nhau → full URL dedup KHÔNG dedup được.
  // FIX: extract `file_xxx` từ URL → dedup theo file_id để tránh download trùng N lần.
  function extractImageUrls(turnEl) {
    const images = turnEl.querySelectorAll(
      'img[src*="estuary/content"], img[src*="oaiusercontent"], img[src*="sandboxed.openai"]'
    );
    // Map<fileId, url> — keep first occurrence per file_id (typically the highest-quality one with alt^="Generated image")
    const urlByFileId = new Map();
    const candidates = [];
    let debugInfo = { total: images.length, skippedBlur: 0, skippedRef: 0, skippedEmpty: 0 };
    for (const img of images) {
      if (img.classList.contains('blur-2xl')) { debugInfo.skippedBlur++; continue; }
      const src = img.src;
      if (!src) { debugInfo.skippedEmpty++; continue; }
      const alt = img.getAttribute('alt') || '';
      // FIX: INCLUSIVE filter — chỉ chấp nhận "Generated image..." hoặc "" (siblings)
      // ChatGPT đã đổi alt của ref images từ "Uploaded image" sang UUID (vd: "70bc7693-2579-4af8-...")
      // → filter cũ (exclude "Uploaded image") không còn hoạt động
      const isGenerated = alt.toLowerCase().startsWith('generated image');
      const isSibling = alt === '';
      if (!isGenerated && !isSibling) {
        console.log('[ChatGPT-extract] ⏭️ Skip non-generated:', alt.slice(0, 50), '| file_id:', src.match(/[?&]id=(file_[a-z0-9]+)/i)?.[1]);
        debugInfo.skippedRef++;
        continue;
      }
      candidates.push({ src, alt });
    }
    console.log('[ChatGPT-extract] 📊 Images in turn:', debugInfo, '| Candidates after filter:', candidates.length);

    // Sort: prioritize "Generated image: ..." alt first (chính), then "" alt (siblings)
    candidates.sort((a, b) => {
      const aGen = a.alt.toLowerCase().startsWith('generated image') ? 0 : 1;
      const bGen = b.alt.toLowerCase().startsWith('generated image') ? 0 : 1;
      return aGen - bGen;
    });

    for (const c of candidates) {
      const fileIdMatch = c.src.match(/[?&]id=(file_[a-z0-9]+)/i);
      const key = fileIdMatch ? fileIdMatch[1] : c.src; // fallback dedup by full URL nếu không có file_id
      if (!urlByFileId.has(key)) {
        urlByFileId.set(key, c.src);
      }
    }

    // Fallback: alt-based — ChatGPT image gen luôn có alt "Generated image: ..."
    if (urlByFileId.size === 0) {
      const altMatches = turnEl.querySelectorAll('img[alt^="Generated image"]');
      for (const img of altMatches) {
        if (img.classList.contains('blur-2xl')) continue;
        if (!img.src) continue;
        const fileIdMatch = img.src.match(/[?&]id=(file_[a-z0-9]+)/i);
        const key = fileIdMatch ? fileIdMatch[1] : img.src;
        if (!urlByFileId.has(key)) urlByFileId.set(key, img.src);
      }
    }
    return Array.from(urlByFileId.values());
  }

  // ============ CG-8: Poll conversation đợi TEXT result (Prompt node enhance) ============
  // Khác waitForImageResult: KHÔNG check img estuary, chỉ chờ assistant turn xong streaming
  // rồi extract innerText. Dùng cho Prompt node enhance qua ChatGPT (text-only).
  async function waitForTextResult(baseline, timeout = 60000) {
    const startTime = Date.now();
    const pollInterval = 500;
    let lastDiag = 0;
    let lastTextLength = 0;
    let stableCount = 0;
    const STABLE_THRESHOLD = 3; // Text phải stable qua 3 poll cycles (~1.5s) mới coi là xong

    while (Date.now() - startTime < timeout) {
      // Check abort flag
      if (isAbortActive()) {
        console.log('[ChatGPT-text] Aborted by user → clicking Stop button');
        await clickChatGPTStopButton();
        return { success: false, error: 'ABORTED', message: 'User stopped execution' };
      }

      const allAssistantTurns = document.querySelectorAll(
        '[data-testid^="conversation-turn-"][data-turn="assistant"]'
      );
      const allTurns = _queryAllWithFallback('conversation_turn');

      // Chưa có turn mới so với baseline → tiếp tục poll
      if (allTurns.length <= baseline.turnCount) {
        if (Date.now() - lastDiag > 5000) {
          console.log('[ChatGPT-text] Chưa có turn mới — turnCount:', allTurns.length, 'baseline:', baseline.turnCount);
          lastDiag = Date.now();
        }
        await sleep(pollInterval);
        continue;
      }

      const lastAssistantTurn = allAssistantTurns[allAssistantTurns.length - 1];
      if (!lastAssistantTurn) {
        await sleep(pollInterval);
        continue;
      }

      // 1. Detect error trước (ưu tiên RATE_LIMIT/CONTENT_BLOCKED/...)
      const error = detectError(lastAssistantTurn);
      if (error) {
        console.log('[ChatGPT-text] Error:', error);
        return {
          success: false,
          error,
          message: (lastAssistantTurn.innerText || '').slice(0, 500),
        };
      }

      // 2. Detect streaming qua nhiều signal:
      //    - aria-label="Stop generating" hoặc "Stop" button tồn tại
      //    - data-testid="stop-button" tồn tại
      //    - Có progress/loading indicators
      //    - Text vẫn đang thay đổi (stability check)
      const stopGenBtn = _queryWithFallback('stop_button');
      const stillGeneratingImg = _hasGeneratingIndicator(lastAssistantTurn);

      // Check thinking/loading indicators trong turn
      const hasThinkingIndicator = lastAssistantTurn.querySelector('[class*="thinking"], [class*="loading"], [class*="typing"], .result-thinking, .result-streaming');

      // Signal-based streaming detection
      const signalStreaming = !!stopGenBtn || !!stillGeneratingImg || !!hasThinkingIndicator;

      // 3. Extract current text để check stability
      let currentText = '';
      const roleWrapper = lastAssistantTurn.querySelector('[data-message-author-role="assistant"]');
      const markdownEl = roleWrapper?.querySelector('.markdown.prose') || lastAssistantTurn.querySelector('.markdown.prose');
      if (markdownEl && typeof markdownEl.innerText === 'string') {
        currentText = markdownEl.innerText.trim();
      } else if (roleWrapper && typeof roleWrapper.innerText === 'string') {
        currentText = roleWrapper.innerText.trim();
      }
      if (!currentText) {
        currentText = (lastAssistantTurn.innerText || '').trim();
      }

      // Text stability check: text phải không đổi qua STABLE_THRESHOLD cycles
      const currentTextLength = currentText.length;
      if (currentTextLength === lastTextLength && currentTextLength > 0) {
        stableCount++;
      } else {
        stableCount = 0;
        lastTextLength = currentTextLength;
      }

      const isTextStable = stableCount >= STABLE_THRESHOLD;
      const stillStreaming = signalStreaming || (!isTextStable && currentTextLength > 0);

      if (stillStreaming) {
        if (Date.now() - lastDiag > 5000) {
          console.log('[ChatGPT-text] Streaming — signals:', !!stopGenBtn, 'textLen:', currentTextLength, 'stable:', stableCount);
          lastDiag = Date.now();
        }
        await sleep(pollInterval);
        continue;
      }

      // 4. Streaming xong + text stable → return
      if (!currentText || currentText.length < 1) {
        // Turn complete nhưng rỗng — chờ thêm một chút
        if (Date.now() - startTime < 5000) {
          await sleep(pollInterval);
          continue;
        }
        return { success: false, error: 'TEXT_EMPTY' };
      }

      const turnId =
        lastAssistantTurn.dataset.turnId ||
        lastAssistantTurn.dataset.testid ||
        null;

      console.log('[ChatGPT-text] DONE — text length:', currentText.length, 'stableCount:', stableCount);
      return { success: true, text: currentText, turnId };
    }

    console.warn('[ChatGPT-text] TIMEOUT sau', timeout, 'ms');
    return { success: false, error: 'TIMEOUT' };
  }

  // ============ CG-3.1: Poll conversation đợi image result ============
  async function waitForImageResult(baseline, timeout = 120000) {
    const startTime = Date.now();
    const pollInterval = 1000;
    let lastDiag = 0;
    let textOnlyStreamStart = null;
    // Bug 47 fix (2026-05-13): Tăng từ 6s → 15s để giảm false positive TEXT_ONLY.
    // ChatGPT thường explain (text streaming) trước khi spawn image-gen-loading-state,
    // gap 6-12s là phổ biến → 15s threshold an toàn cho hầu hết case không bị retry oan.
    const TEXT_ONLY_THRESHOLD_MS = 15000;
    const MIN_WAIT_BEFORE_PATTERN_CHECK_MS = 5000; // Chờ tối thiểu 5s trước khi check pattern (tăng từ 3s)
    const MIN_WAIT_WITH_POSITIVE_MS = 10000; // Nếu có positive indicator, chờ lâu hơn (10s)
    const MIN_TEXT_FOR_ERROR_CHECK = 80; // Text phải đủ dài để tránh false positive

    // Positive indicators: ChatGPT có thể nói trước khi gen ảnh - KHÔNG trigger error sớm
    const POSITIVE_INDICATORS = [
      "i'll create", "i'll generate", "i'll make", "let me create", "let me generate",
      "creating", "generating", "here's", "here is", "sure", "absolutely", "of course",
    ];

    // Helper: check có positive indicator không (đang chuẩn bị gen)
    function hasPositiveIndicator(text) {
      if (!text) return false;
      const lower = text.toLowerCase();
      return POSITIVE_INDICATORS.some(p => lower.includes(p));
    }

    // Helper: check text có match pattern TEXT_ONLY không (ChatGPT trả text thay vì gen ảnh)
    function matchesTextOnlyPattern(text) {
      if (!text || text.length < 50) return false;
      const lower = text.toLowerCase();
      const patterns = _activePatterns.textOnly || FALLBACK_PATTERNS.textOnly || [];
      return patterns.some(p => lower.includes(p));
    }

    // Helper: check tất cả error patterns và trả về error code nếu match
    function matchesAnyErrorPattern(text) {
      if (!text || text.length < MIN_TEXT_FOR_ERROR_CHECK) return null;
      const lower = text.toLowerCase();

      // Check từng loại error pattern
      const checks = [
        { key: 'rateLimit', error: 'RATE_LIMIT' },
        { key: 'contentBlocked', error: 'CONTENT_BLOCKED' },
        { key: 'imageGenFailed', error: 'IMAGE_GEN_FAILED' },
      ];

      for (const { key, error } of checks) {
        const patterns = _activePatterns[key] || FALLBACK_PATTERNS[key] || [];
        if (patterns.some(p => lower.includes(p))) {
          return { error, text: text.slice(0, 500) };
        }
      }
      return null;
    }

    // Helper: tìm assistant turn MỚI (sau baseline) — ưu tiên turn có generating/result markers.
    // Reference DOM verified: chatgpt-Generating-dom.html, chatgpt-result-image.html.
    function findNewAssistantTurn() {
      const allAssistantTurns = document.querySelectorAll(
        '[data-testid^="conversation-turn-"][data-turn="assistant"]'
      );
      if (!allAssistantTurns.length) return null;

      // Strategy 1: turn có dấu hiệu image generating/done — ưu tiên cao nhất
      for (let i = allAssistantTurns.length - 1; i >= 0; i--) {
        const turn = allAssistantTurns[i];
        if (
          _hasGeneratingIndicator(turn) ||
          turn.querySelector('[aria-label="Like this image"]') ||
          turn.querySelector('[aria-label="Edit image"]') ||
          turn.querySelector('img[alt^="Generated image"]')
        ) {
          return turn;
        }
      }

      // Strategy 2: turn có testid number > baseline.turnCount (turn mới created sau submit)
      const newTurns = Array.from(allAssistantTurns).filter(turn => {
        const testid = turn.dataset.testid || turn.getAttribute('data-testid') || '';
        const m = testid.match(/conversation-turn-(\d+)/);
        if (!m) return false;
        return parseInt(m[1], 10) > baseline.turnCount;
      });
      if (newTurns.length > 0) return newTurns[newTurns.length - 1];

      // Strategy 3: fallback — last assistant turn (legacy)
      return allAssistantTurns[allAssistantTurns.length - 1];
    }

    while (Date.now() - startTime < timeout) {
      // Check abort flag
      if (isAbortActive()) {
        console.log('[ChatGPT-image] Aborted by user → clicking Stop button');
        await clickChatGPTStopButton();
        return { success: false, error: 'ABORTED', message: 'User stopped execution' };
      }

      // Bug 58 fix (2026-05-13): Mid-flight challenge detect — Cloudflare/OpenAI có thể
      // hiện lại challenge giữa stream (session expire). Bail sớm thay vì poll cho đến timeout.
      if (detectChatGPTChallenge()) {
        console.warn('[ChatGPT-image] Challenge re-emerged mid-stream → abort');
        return {
          success: false,
          error: 'CHALLENGE_TIMEOUT',
          message: 'ChatGPT yêu cầu xác minh trong khi gen — vui lòng verify thủ công và chạy lại.',
        };
      }

      const allTurns = _queryAllWithFallback('conversation_turn');

      // PRIORITY FALLBACK — Document-level detection nếu turn-based detection KHÔNG work.
      // Reference: chatgpt-Generating-dom.html cho fresh chat ChatGPT có thể dùng DOM markup
      // KHÁC `[data-testid^="conversation-turn-"]` (vd thread placeholder, redirect /c/{id}).
      // Detect qua selectors độc lập với turn structure:
      //   1. img[alt^="Generated image"] anywhere → image gen done globally
      //   2. button[aria-label="Like this image"] anywhere → post-action button visible
      // CRITICAL: Loại trừ ảnh có file_id trong baseline.existingImageFileIds → tránh bug
      // "submit trên chat có lịch sử → lấy ảnh cũ trước đó". Chỉ consider ảnh MỚI sau submit.
      const baselineFileIds = baseline.existingImageFileIds || new Set();
      const allGenImgs = _queryAllWithFallback('generated_image');

      // Build map of NEW images only (file_id NOT in baseline)
      // FIX: Thêm alt filter - chỉ chấp nhận "Generated image..." hoặc "" (siblings)
      // Selector generated_image có fallback img[src*="/backend-api/"] match cả ref images
      const urlByFileId = new Map();
      for (const img of allGenImgs) {
        if (img.classList.contains('blur-2xl') || !img.src) continue;
        const alt = img.getAttribute('alt') || '';
        const isGenerated = alt.toLowerCase().startsWith('generated image');
        const isSibling = alt === '';
        if (!isGenerated && !isSibling) continue; // skip ref images (UUID alt)
        const m = img.src.match(/[?&]id=(file_[a-z0-9]+)/i);
        if (!m) continue;
        const fileId = m[1];
        if (baselineFileIds.has(fileId)) continue; // skip CŨ
        if (!urlByFileId.has(fileId)) urlByFileId.set(fileId, img.src);
      }

      const newImageUrls = Array.from(urlByFileId.values());
      const globalGenerating = _hasGeneratingIndicator();

      // Trust global fallback CHỈ KHI:
      //   - Có ảnh MỚI (file_id ngoài baseline)
      //   - VÀ KHÔNG còn "Generating image..." indicator (gen đã xong cho ảnh mới)
      if (newImageUrls.length > 0 && !globalGenerating) {
        // Find first NEW Generated image alt (ưu tiên "Generated image..." alt)
        let altText = '';
        for (const img of allGenImgs) {
          if (img.classList.contains('blur-2xl') || !img.src) continue;
          const alt = img.getAttribute('alt') || '';
          // Chỉ lấy alt từ generated images, không phải ref (UUID alt)
          if (!alt.toLowerCase().startsWith('generated image')) continue;
          const m = img.src.match(/[?&]id=(file_[a-z0-9]+)/i);
          if (m && !baselineFileIds.has(m[1])) {
            altText = alt;
            break;
          }
        }
        console.log('[ChatGPT-detect] DONE (global fallback) — NEW urls:', newImageUrls.length, 'baseline cũ:', baselineFileIds.size, 'alt:', altText.slice(0, 60));
        return {
          success: true,
          imageUrls: newImageUrls,
          altPrompt: altText.replace(/^Generated image:\s*/i, ''),
          turnId: null,
        };
      }

      // Chưa có turn mới so với baseline → tiếp tục poll (NHƯNG cũng kiểm tra global Generating)
      if (allTurns.length <= baseline.turnCount) {
        if (Date.now() - lastDiag > 3000) { // throttle 3s (giảm từ 5s) cho debug responsive hơn
          const genState = globalGenerating ? 'GENERATING (global)' : 'idle';
          const url = window.location.pathname;
          // Log URL để detect SPA navigation (vd /c/{id} mới vs /c/{id} cũ)
          console.log('[ChatGPT-detect] Chưa có turn mới — turnCount:', allTurns.length, 'baseline:', baseline.turnCount, 'state:', genState, 'url:', url);
          lastDiag = Date.now();
        }
        await sleep(pollInterval);
        continue;
      }

      // Tìm assistant turn MỚI qua multi-strategy (avoid stale old turn)
      const lastAssistantTurn = findNewAssistantTurn();
      if (!lastAssistantTurn) {
        await sleep(pollInterval);
        continue;
      }

      // 1. Detect error trước (ưu tiên cao)
      const error = detectError(lastAssistantTurn);
      if (error) {
        console.log('[ChatGPT-detect] Error:', error);
        return { success: false, error, message: (lastAssistantTurn.innerText || '').slice(0, 500) };
      }

      // Bug 62 fix (2026-05-13): ChatGPT paragen-multigen — feature mới render 2 ảnh để
      // user chọn (DOM: class image-paragen-multigen + text "Which image do you like more?").
      // Khi paragen UI active, ChatGPT KHÔNG render post-action buttons (Like/Edit/Dislike) →
      // detection có thể stuck đợi indicator không bao giờ xuất hiện → timeout → retry oan.
      // Fix: detect paragen → đợi cả 2 ảnh ready + no loading indicator → return success early.
      const paragenContainer = lastAssistantTurn.querySelector('[class*="image-paragen-multigen"]') ||
                               document.querySelector('[class*="image-paragen-multigen"]');
      if (paragenContainer) {
        const paragenImgs = Array.from(paragenContainer.querySelectorAll('img[alt^="Generated image"]:not(.blur-2xl)'))
          .filter(img => img.src && img.src.startsWith('http'));
        const stillLoadingInParagen = !!paragenContainer.querySelector('[data-testid^="image-gen-loading-state"], [aria-label="Generating image..."]');
        if (paragenImgs.length >= 2 && !stillLoadingInParagen) {
          // 2 ảnh đã render xong trong paragen → trust + return success
          const paragenUrls = paragenImgs.map(img => img.src);
          // Dedup by file_id
          const seen = new Set();
          const dedupedUrls = paragenUrls.filter(url => {
            const m = url.match(/[?&]id=(file_[a-z0-9]+)/i);
            const key = m ? m[1] : url;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          console.log('[ChatGPT-detect] DONE (paragen-multigen) —', dedupedUrls.length, 'ảnh sẵn sàng');
          return {
            success: true,
            imageUrls: dedupedUrls,
            altPrompt: paragenImgs[0]?.alt?.replace(/^Generated image:?\s*/i, '') || '',
            turnId: lastAssistantTurn.dataset.turnId || lastAssistantTurn.dataset.testid || null,
          };
        }
      }

      // 2. Check image đã generated chưa — dùng _findGeneratedImg (có fallback nhiều CDN + alt-based)
      const generatedImg = _findGeneratedImg(lastAssistantTurn);
      let imageUrls = extractImageUrls(lastAssistantTurn);

      // Bug fix: Filter out images that existed BEFORE submit (based on file_id in baseline)
      // This prevents returning old images when findNewAssistantTurn falls back to an old turn
      // Note: baselineFileIds đã khai báo ở đầu while loop (line ~960)
      const preFilterCount = imageUrls.length;
      if (baselineFileIds.size > 0) {
        imageUrls = imageUrls.filter((url) => {
          const m = url.match(/[?&]id=(file_[a-z0-9]+)/i);
          if (!m) return true; // No file_id → can't filter, assume new
          const isOld = baselineFileIds.has(m[1]);
          if (isOld) console.log('[ChatGPT-detect] ⏭️ Filter old/ref image:', m[1]);
          return !isOld;
        });
      }
      if (preFilterCount !== imageUrls.length) {
        console.log('[ChatGPT-detect] 🔍 Baseline filter:', preFilterCount, '→', imageUrls.length, '| baselineIds:', baselineFileIds.size);
      }

      // FAST-PATH: post-action buttons (Like/Edit/Dislike/More actions) chỉ render khi gen XONG.
      // Reference DOM verified (chatgpt-result-image.html). Không cần check streaming khi gặp markers này.
      const postActionDone = !!(
        lastAssistantTurn.querySelector('[aria-label="Like this image"]') ||
        lastAssistantTurn.querySelector('[aria-label="Edit image"]') ||
        lastAssistantTurn.querySelector('[aria-label="Dislike this image"]')
      );

      if (generatedImg && imageUrls.length > 0) {
        // Verify alt text — KHÔNG strict (selector đã match alt^="Generated image" nếu fallback path)
        const altText = generatedImg.getAttribute('alt') || '';
        const isGeneratedAlt = altText.toLowerCase().startsWith('generated image');

        // Conditions to trust result:
        // - postActionDone (Like/Edit button present — strongest signal)
        // - HOẶC alt^="Generated image" (alt confirm)
        // - HOẶC URL match (estuary/oaiusercontent) + đã hết streaming
        if (postActionDone || isGeneratedAlt || !isStreaming(lastAssistantTurn)) {
          const turnId = lastAssistantTurn.dataset.turnId || lastAssistantTurn.dataset.testid || null;
          console.log('[ChatGPT-detect] DONE — urls:', imageUrls.length, 'alt:', altText.slice(0, 60), 'postAction:', postActionDone);
          return {
            success: true,
            imageUrls,
            altPrompt: isGeneratedAlt ? altText.replace(/^Generated image:\s*/i, '') : altText,
            turnId,
          };
        }
        // Có img nhưng vẫn streaming → wait tiếp
      }

      // 3. Check streaming còn chạy không
      if (isStreaming(lastAssistantTurn)) {
        // PROACTIVE TEXT_ONLY detection: nếu streaming text > threshold mà không thấy image marker
        const hasImageMarker = _hasGeneratingIndicator(lastAssistantTurn) ||
                               !!lastAssistantTurn.querySelector('img[alt^="Generated image"]') ||
                               _hasGeneratingIndicator();
        const currentText = (lastAssistantTurn.innerText || '').trim();
        const textLen = currentText.length;

        if (!hasImageMarker && textLen > 50) {
          const elapsedMs = Date.now() - startTime;
          const hasPositive = hasPositiveIndicator(currentText);

          // SKIP pattern check nếu: có positive indicator + chưa đủ thời gian
          // (ChatGPT có thể nói "Sure, I'll create..." trước khi hiện Generating indicator)
          // Bug fix: Nếu có positive indicator, chờ lâu hơn (10s) vì ChatGPT placeholder
          // có thể dài >150 chars nhưng vẫn đang chuẩn bị gen ảnh.
          const waitThreshold = hasPositive ? MIN_WAIT_WITH_POSITIVE_MS : MIN_WAIT_BEFORE_PATTERN_CHECK_MS;
          const shouldCheckPatterns = elapsedMs > waitThreshold;

          if (shouldCheckPatterns) {
            // FAST DETECTION 1: Check error patterns (rateLimit, contentBlocked, imageGenFailed)
            const errorMatch = matchesAnyErrorPattern(currentText);
            if (errorMatch) {
              console.log('[ChatGPT-detect]', errorMatch.error, '(pattern match):', currentText.slice(0, 100));
              return { success: false, error: errorMatch.error, text: errorMatch.text };
            }

            // FAST DETECTION 2: Check TEXT_ONLY pattern
            if (matchesTextOnlyPattern(currentText)) {
              // Re-check generating indicator trước khi return — tránh race condition
              // khi text xuất hiện trước generating indicator vài ms
              const recheckMarker = _hasGeneratingIndicator(lastAssistantTurn) ||
                                    !!lastAssistantTurn.querySelector('img[alt^="Generated image"]') ||
                                    _hasGeneratingIndicator();
              if (recheckMarker) {
                console.log('[ChatGPT-detect] TEXT_ONLY avoided — generating indicator xuất hiện sau text');
                // Reset và tiếp tục poll
              } else {
                console.log('[ChatGPT-detect] TEXT_ONLY (pattern match):', currentText.slice(0, 100));
                return { success: false, error: 'TEXT_ONLY', text: currentText.slice(0, 500) };
              }
            }
          }

          // FALLBACK: Chờ threshold nếu pattern không match nhưng text dài + ko có image marker
          if (!textOnlyStreamStart) {
            textOnlyStreamStart = Date.now();
            console.log('[ChatGPT-detect] TEXT_ONLY tracking started — textLen:', textLen, 'hasPositive:', hasPositive);
          } else if (Date.now() - textOnlyStreamStart > TEXT_ONLY_THRESHOLD_MS) {
            // Bug 47 fix (2026-05-13): Final scan trước khi return TEXT_ONLY —
            // race condition: image marker có thể vừa xuất hiện sau lần check trước
            // → tránh retry oan khi ChatGPT thực sự đã gen image thành công.
            const finalImg = lastAssistantTurn.querySelector('img[alt^="Generated image"]') ||
                             document.querySelector('img[alt^="Generated image"]') ||
                             lastAssistantTurn.querySelector('[data-testid^="image-gen-loading-state"]') ||
                             document.querySelector('[data-testid^="image-gen-loading-state"]');
            if (finalImg) {
              console.log('[ChatGPT-detect] TEXT_ONLY false positive avoided — image marker xuất hiện:', finalImg.tagName);
              textOnlyStreamStart = null;
              await sleep(pollInterval);
              continue;
            }
            console.log('[ChatGPT-detect] TEXT_ONLY (timeout) — streaming text >' + (TEXT_ONLY_THRESHOLD_MS / 1000) + 's, no image marker:', currentText.slice(0, 100));
            return { success: false, error: 'TEXT_ONLY', text: currentText.slice(0, 500) };
          }
        } else if (hasImageMarker) {
          textOnlyStreamStart = null;
        }

        if (Date.now() - lastDiag > 5000) {
          console.log('[ChatGPT-detect] Streaming, hasImg:', !!generatedImg, 'textOnlyTracking:', !!textOnlyStreamStart);
          lastDiag = Date.now();
        }
        await sleep(pollInterval);
        continue;
      }

      // 4. Turn complete nhưng không có image → check error patterns hoặc TEXT_ONLY
      // BUG FIX 2026-05-11: Race condition khi img[alt^="Generated image"] đã tồn tại nhưng:
      //   - src chưa được populate (DOM lag)
      //   - HOẶC img còn blur-2xl class (đang render/transition)
      // Trước đây code return TEXT_ONLY ngay → user phải retry.
      // Fix: Kiểm tra xem có pending generated image không, nếu có thì tiếp tục poll.
      const pendingGenImg = lastAssistantTurn.querySelector('img[alt^="Generated image"]') ||
                            document.querySelector('img[alt^="Generated image"]');
      const imgPending = pendingGenImg && (!pendingGenImg.src || pendingGenImg.classList.contains('blur-2xl'));
      if (imgPending) {
        if (Date.now() - lastDiag > 3000) {
          const reason = !pendingGenImg.src ? 'src loading' : 'blur-2xl transition';
          console.log('[ChatGPT-detect] Pending img (' + reason + '):', pendingGenImg.alt?.slice(0, 40));
          lastDiag = Date.now();
        }
        await sleep(pollInterval);
        continue;
      }

      const text = (lastAssistantTurn.innerText || '').trim();
      if (text.length > 20) {
        // Check error patterns trước (rateLimit, contentBlocked, imageGenFailed)
        const errorMatch = matchesAnyErrorPattern(text);
        if (errorMatch) {
          console.log('[ChatGPT-detect]', errorMatch.error, '(post-complete):', text.slice(0, 100));
          return { success: false, error: errorMatch.error, text: errorMatch.text };
        }
        // Fallback: TEXT_ONLY nếu không match specific error
        console.log('[ChatGPT-detect] TEXT_ONLY (post-complete):', text.slice(0, 100));
        return { success: false, error: 'TEXT_ONLY', text: text.slice(0, 500) };
      }

      await sleep(pollInterval);
    }

    // Bug 60 fix (2026-05-13): Trước khi return TIMEOUT, final scan + grace period.
    // ChatGPT image gen có thể MẤT > 2 phút khi service slow. Trước fix: timeout → throw →
    // RetryHelper retry → resubmit prompt → user thấy 2-3 ảnh gen liên tiếp (lần đầu vẫn đang gen).
    //
    // Fix: Nếu có image marker (đang gen) tại điểm timeout → extend window 60s thêm.
    // Nếu image render xong → return success. Nếu vẫn không → return TIMEOUT với hint
    // `hasPendingImage=true` để WorkflowExecutor không retry (image đang gen ở backend).
    const finalImg = document.querySelector('img[alt^="Generated image"]');
    const finalLoadingIndicator = _hasGeneratingIndicator();
    const hasPendingImage = !!(finalImg || finalLoadingIndicator);
    if (hasPendingImage) {
      console.warn('[ChatGPT-detect] TIMEOUT sau', timeout, 'ms — nhưng có image marker → extend 60s grace');
      const graceDeadline = Date.now() + 60000;
      while (Date.now() < graceDeadline) {
        if (isAbortActive()) {
          await clickChatGPTStopButton();
          return { success: false, error: 'ABORTED', message: 'User stopped during grace' };
        }
        // Re-check image — if generated image fully ready, return success
        const readyImg = document.querySelector('img[alt^="Generated image"]:not(.blur-2xl)');
        if (readyImg && readyImg.src && readyImg.src.startsWith('http')) {
          console.log('[ChatGPT-detect] Image rendered trong grace period:', readyImg.src.slice(0, 80));
          // Collect all generated images for return
          const allImgs = Array.from(document.querySelectorAll('img[alt^="Generated image"]:not(.blur-2xl)'))
            .map(img => img.src)
            .filter(src => src && src.startsWith('http'));
          return {
            success: true,
            imageUrls: allImgs.length > 0 ? allImgs : [readyImg.src],
            altPrompt: readyImg.alt?.replace(/^Generated image:\s*/i, '') || '',
            turnId: null,
          };
        }
        await sleep(2000);
      }
      console.warn('[ChatGPT-detect] TIMEOUT sau grace 60s — image vẫn pending, return với hasPendingImage hint');
      return { success: false, error: 'TIMEOUT', hasPendingImage: true };
    }

    console.warn('[ChatGPT-detect] TIMEOUT sau', timeout, 'ms — không có image marker');
    return { success: false, error: 'TIMEOUT', hasPendingImage: false };
  }

  // Main handler — giữ NGUYÊN logic Phase X (ChatAIModal) + thêm các listener CG-2/CG-3.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // SSE invalidate: admin update DOM selector → clear cache để query fresh
    if (message.action === 'providerConfigUpdated') {
      _selectorConfig = null;
      _selectorConfigTime = 0;
      console.log('[ChatGPT] Provider config updated via SSE — selector cache invalidated');
      sendResponse({ success: true });
      return false;
    }

    // Phase X: chatAI:execute — ChatAIModal flow (giữ nguyên, KHÔNG được phá)
    if (message.action === 'chatAI:execute') {
      (async () => {
        try {
          // 1. Upload images first (if any)
          if (message.images && message.images.length > 0) {
            const uploaded = await uploadImages(message.images);
            if (!uploaded) {
              sendResponse({ success: false, error: 'Không thể upload ảnh lên ChatGPT' });
              return;
            }
          }

          // 2. Insert text
          const textInserted = await insertText(message.text);
          if (!textInserted) {
            sendResponse({ success: false, error: 'Không thể nhập text vào ChatGPT' });
            return;
          }

          // 3. Submit
          const submitted = await clickSubmit();
          if (!submitted) {
            sendResponse({ success: false, error: 'Không thể gửi tin nhắn trên ChatGPT' });
            return;
          }

          sendResponse({ success: true });
        } catch (err) {
          sendResponse({ success: false, error: err.message || 'Lỗi không xác định' });
        }
      })();

      return true; // async sendResponse
    }

    // Phase CG-3: chatgpt:submitAndWait — submit prompt + chờ kết quả image
    // Phase CG-8: branch text mode khi expectText=true hoặc settings.imageMode===false
    // Payload: { action, text, images, settings: { imageMode, ratio, fallbackPrefix }, timeout, expectText }
    if (message.action === 'chatgpt:submitAndWait') {
      // Bug 55 fix (2026-05-13): Timestamp-guarded reset — KHÔNG wipe pending abort.
      // Old behavior: __chatgptAbort = false unconditional → race condition.
      // New behavior: isAbortActive() ignore old abort qua timestamp; chỉ wipe stale > 5s.
      __chatgptCallStartAt = Date.now();
      if (__chatgptAbort && __chatgptAbortAt < __chatgptCallStartAt - 5000) {
        __chatgptAbort = false;
        __chatgptAbortAt = 0;
      }
      // Set inputTimeoutMs từ payload (Adapter pass từ user setting). Default 1200 nếu không có.
      // Macro delay giữa các bước chính = 70% inputTimeoutMs.
      __chatgptInputTimeoutMs = Number(message.inputTimeoutMs) || 1200;
      __chatgptMacroDelayMs = Math.round(__chatgptInputTimeoutMs * 0.7);
      console.log('[ChatGPT] Timing — inputTimeout:', __chatgptInputTimeoutMs, 'ms | macroDelay:', __chatgptMacroDelayMs, 'ms (70%)');

      const isTextMode =
        message.expectText === true || message.settings?.imageMode === false;
      console.log(
        '[ChatGPT-listener] chatgpt:submitAndWait nhận, mode:', isTextMode ? 'text' : 'image',
        'text len:', (message.text || '').length,
        'images:', (message.images || []).length,
      );
      (async () => {
        try {
          // PRE-CHECK: Cloudflare/OpenAI challenge — tab inactive → challenge stuck → DOM ops fail silent.
          if (detectChatGPTChallenge()) {
            const resolved = await waitForChatGPTChallengeResolved(120000);
            if (!resolved) {
              sendResponse({
                success: false,
                error: 'CHALLENGE_TIMEOUT',
                message: 'ChatGPT yêu cầu xác minh. Vui lòng mở tab ChatGPT, hoàn thành verification, sau đó chạy lại.',
              });
              return;
            }
          }
          checkAbort('after-challenge-check');

          // NEW CHAT: Tạo conversation mới trước khi submit (chỉ cho image mode).
          // Lý do: ChatGPT Free có giới hạn upload refs theo conversation. New chat = reset quota.
          // Option: settings.newChat = true (mặc định cho image mode), false để skip.
          // Text mode (Prompt enhance) không cần new chat — có thể dùng lại context.
          const shouldNewChat = !isTextMode && (message.settings?.newChat !== false);
          if (shouldNewChat) {
            console.log('[ChatGPT] Creating new chat for image generation...');
            const newChatReady = await clickNewChatAndWaitReady(8000);
            if (!newChatReady) {
              console.warn('[ChatGPT] New chat không ready — tiếp tục với conversation hiện tại');
            }
            checkAbort('after-new-chat');
            await sleep(getMacroDelay());  // Macro gap → upload refs
          }

          // PRE-CHECK: Detect image creation limit alert — chỉ áp dụng khi đang ở image mode.
          // Text mode (Prompt node) không liên quan đến image quota → bỏ qua check.
          if (!isTextMode) {
            const limitAlert = checkImageLimitAlert();
            if (limitAlert?.detected) {
              console.warn('[ChatGPT-listener] LIMIT_ALERT detected — bỏ qua submit:', limitAlert.message);
              sendResponse({
                success: false,
                error: 'LIMIT_ALERT',
                message: limitAlert.message,
              });
              return;
            }
          }

          // 1. CRITICAL FIX: Chờ hoàn tất generation đang chạy (nếu có) TRƯỚC khi capture baseline.
          // Bug: Task A gen ảnh → Task B submit → baseline capture khi A đang gen → A xong trước B
          // → B's waitForImageResult thấy ảnh A là "mới" (không trong baseline) → trả về ảnh SAI!
          // Fix: Đợi generating indicator biến mất trước khi capture baseline.
          const existingGenIndicator = _hasGeneratingIndicator();
          if (existingGenIndicator) {
            console.log('[ChatGPT] Đang có image generation từ task trước — chờ hoàn tất...');
            const maxWaitGen = 120000; // 2 phút max
            const startWaitGen = Date.now();
            while (Date.now() - startWaitGen < maxWaitGen) {
              if (isAbortActive()) {
                sendResponse({ success: false, error: 'ABORTED', message: 'User stopped' });
                return;
              }
              const stillGen = _hasGeneratingIndicator();
              if (!stillGen) {
                console.log('[ChatGPT] Generation trước đã hoàn tất — tiếp tục submit task mới');
                break;
              }
              await sleep(1000);
            }
            // Sau khi gen trước xong, sleep thêm để DOM update file_id
            await sleep(500);
          }

          // 2. Snapshot baseline TRƯỚC khi submit (sau khi đã chờ gen cũ xong)
          const baseline = snapshotConversationState();

          // 3. Quyết định text submit + cleanup mode
          //    - Image mode: nếu image mode active thì giữ nguyên, ngược lại fallback prefix.
          //    - Text mode: deactivate image mode (sticky) + prepend prefix bắt LLM trả plain prompt.
          let textToSubmit = message.text || '';
          if (isTextMode) {
            // Bug fix: ChatGPT image mode sticky → Prompt enhance gọi text mà image mode vẫn ON
            // → response có thể trả về image hoặc reply dài dòng. Force toggle off TRƯỚC khi submit.
            try { await deactivateImageModeIfActive(); } catch (e) {
              console.warn('[ChatGPT] deactivateImageMode error:', e?.message);
            }
            // Prefix bắt LLM trả plain prompt text — theo ngôn ngữ user setting (fallback EN).
            const enhancePrefix = await getEnhancePrefix();
            textToSubmit = enhancePrefix + textToSubmit;
          }

          // 3b. Upload ref images TRƯỚC, activate image mode SAU.
          // Verified 2026-05-09 (user feedback): ChatGPT KHÔNG yêu cầu image mode active để upload.
          // Trước đây code activate 2 lần (trước upload + sau upload re-activate) — DƯ THỪA.
          // Flow tối ưu: upload trước (clean DOM) → activate 1 lần sau → submit.
          // Lý do: activate trước upload làm upload reset state → cần re-activate → tốn 2 cycle.
          //         Activate sau upload thì state stable, chỉ cần 1 cycle.
          //
          // CRITICAL: GỌI removeExistingChatGPTRefImages() ngay cả khi task không có refs —
          // bug fix: refs cũ từ session trước còn dính trong composer → submit kéo theo context sai.
          await removeExistingChatGPTRefImages();
          await sleep(200);
          checkAbort('after-remove-refs');

          if (Array.isArray(message.images) && message.images.length > 0) {
            const uploaded = await injectRefImages(message.images);
            if (!uploaded) {
              sendResponse({
                success: false,
                error: 'REF_UPLOAD_FAILED',
                message: 'Không thể upload ref image lên ChatGPT',
              });
              return;
            }
            checkAbort('after-upload-refs');
            await sleep(getMacroDelay());  // Macro gap upload refs → activate image mode
          }

          // 4. ACTIVATE IMAGE MODE + RATIO (1 lần duy nhất, sau upload refs)
          if (!isTextMode && message.settings?.imageMode) {
            const ratio = message.settings?.ratio || '1:1';
            console.log('[ChatGPT] Activating image mode với ratio:', ratio);
            const activated = await activateImageMode(ratio);
            if (!activated) {
              console.warn('[ChatGPT] Không thể activate image mode — sẽ dùng fallback prefix');
              if (message.settings?.fallbackPrefix) {
                textToSubmit = message.settings.fallbackPrefix + textToSubmit;
              }
            }
            checkAbort('after-activate-image-mode');
            await sleep(getMacroDelay());  // Macro gap activate → injectTextAndSubmit (clear+insert+submit)
          }

          // 5. Inject text + click submit
          await injectTextAndSubmit(textToSubmit);

          // 6. Chờ kết quả — branch theo mode.
          checkAbort('before-wait-result');
          const timeout = message.timeout || (isTextMode ? 60000 : 120000);
          const result = isTextMode
            ? await waitForTextResult(baseline, timeout)
            : await waitForImageResult(baseline, timeout);

          sendResponse(result);
        } catch (err) {
          // Bug fix 2026-05-09: catch ABORT throws → click ChatGPT Stop button để halt backend gen
          if (err.message && err.message.startsWith('ABORTED')) {
            const stage = err.message.replace('ABORTED:', '');
            console.log('[ChatGPT] Caught ABORT at stage:', stage, '→ clicking Stop button');
            await clickChatGPTStopButton();
            sendResponse({
              success: false,
              error: 'ABORTED',
              message: 'User stopped at ' + stage,
            });
            return;
          }
          sendResponse({
            success: false,
            error: 'EXCEPTION',
            message: err.message || 'Lỗi không xác định',
          });
        }
      })();

      return true; // async sendResponse
    }

    // chatgpt:abort — Set abort flag để các hàm wait/poll exit sớm
    if (message.action === 'chatgpt:abort') {
      __chatgptAbort = true;
      __chatgptAbortAt = Date.now(); // Bug 55: timestamp guard cho race condition
      console.log('[ChatGPT-listener] chatgpt:abort received → set abort flag at', __chatgptAbortAt);
      sendResponse({ success: true });
      return false;
    }

    // Không xử lý các action khác trong listener này
    return false;
  });

  // Phase CG-2: Theo dõi navigate sang conversation mới (Single-Page App pushState).
  // Khi URL đổi → báo background.js để ChatGPTSession invalidate _imageModeActive cache.
  let _lastUrl = location.href;
  const _notifyNavigate = () => {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      try {
        chrome.runtime.sendMessage({ action: 'chatgpt:navigated', url: location.href }).catch(() => {});
      } catch (e) {
        // Bỏ qua nếu runtime mất kết nối
      }
    }
  };

  // Hook pushState/replaceState để bắt SPA navigation
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

  console.log('[ChatAI] Content script ChatGPT đã được inject (Phase X + CG-2 + CG-3)');
})();
