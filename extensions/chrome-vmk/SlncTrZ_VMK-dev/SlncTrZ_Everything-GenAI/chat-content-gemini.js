(function() {
  // Guard against double injection
  if (window._chatAIGeminiInjected) return;
  window._chatAIGeminiInjected = true;

  // Helper: sleep
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ============ Dynamic Selector System (DOM Resilience) ============
  // Priority: Backend config → Hardcoded defaults
  const PROVIDER = 'gemini';
  let _selectorConfig = null;
  let _selectorConfigTime = 0;
  const _SELECTOR_CACHE_TTL = 30000; // 30s

  /**
   * Tier 3 fallback selectors — MUST MATCH PCM._DEFAULTS.gemini
   * Used when chrome.storage (server data) unavailable.
   * CI script `check_selector_drift.js` verifies sync with backend seed.
   * Total: 9 keys
   */
  const _FALLBACK_SELECTORS = {
    composer: ['.ql-editor', 'div[role="textbox"]', '[contenteditable="true"]', 'rich-textarea'],
    submit_button: ['button[aria-label="Send message"]', 'button[type="submit"]'],
    stop_button: ['button[aria-label="Stop"]', '[aria-label*="Stop"]'],
    response_container: ['[data-message-id]', '.response-container', 'model-response'],
    generated_image: ['img[src*="googleusercontent"]', 'img[data-src]'],
    cloudflare_iframe: ['iframe[src*="challenges.cloudflare.com"]', 'iframe[src*="recaptcha"]'],
    file_input: ['input[type="file"][accept*="image"]', 'input[type="file"][multiple]', 'input[type="file"]'],
    add_button: ['button:has(svg path[d*="M19 13h-6v6h"])'],
    image_preview: ['[class*="image-preview"]', '[class*="attachment"]', 'img[src^="blob:"]'],
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

  // Prefix bắt LLM enhance prompt thành detailed, descriptive text cho AI image/video generator.
  // Output luôn bằng English (AI generators hoạt động tốt nhất với English).
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

  // ============ Cloudflare/Google challenge detection ============
  // Defensive — Gemini hiếm khi có turnstile nhưng thêm để an toàn khi tab inactive.
  function detectGeminiChallenge() {
    // Dùng dynamic selector cho cloudflare iframe
    if (_queryWithFallback('cloudflare_iframe')) return true;
    if (document.querySelector('.cf-turnstile, [data-cf-turnstile]')) return true;
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

  async function waitForGeminiChallengeResolved(timeoutMs = 120000) {
    if (!detectGeminiChallenge()) return true;
    console.warn('[Gemini] Challenge detected — request tab activate + chờ user verify');
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'gemini:ensureActive', focusWindow: true, reason: 'challenge' },
          () => resolve()
        );
      });
    } catch (_) {}
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!detectGeminiChallenge()) {
        await sleep(800);
        return true;
      }
      await sleep(800);
    }
    return false;
  }

  // Helper: simulateClick (full pointer event chain for Angular compatibility)
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

  // Upload images via file input (Gemini 2025 UI)
  async function uploadImages(images) {
    if (!images || images.length === 0) return true;

    // Convert base64 to File objects
    const files = images.map(img => {
      const binary = atob(img.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new File([bytes], img.name || 'image.png', { type: img.type || 'image/png' });
    });

    console.log('[ChatAI] Gemini: Bắt đầu upload', files.length, 'ảnh');

    // Method 1: Try finding file input directly (dynamic selector)
    let fileInput = _queryWithFallback('file_input');

    // Method 2: Click "+" button to reveal upload options, then click image option
    if (!fileInput) {
      // Try dynamic selector first
      let attachBtn = _queryWithFallback('add_button');

      // Fallback: Gemini 2025 - tìm nút "+" hoặc attachment button trong input area
      if (!attachBtn) {
        const addBtns = document.querySelectorAll('button');
        for (const btn of addBtns) {
          const ariaLabel = btn.getAttribute('aria-label') || '';
          const title = btn.getAttribute('title') || '';
          const text = btn.textContent || '';

          // Match add/upload/attach buttons
          if (ariaLabel.match(/add|upload|attach|thêm|tải|đính/i) ||
              title.match(/add|upload|attach|thêm|tải|đính/i) ||
              text.match(/^[+]$/) ||
              btn.querySelector('svg path[d*="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"]')) { // Plus icon path
            attachBtn = btn;
            break;
          }
        }
      }

      // Fallback: tìm nút với icon plus trong input container
      if (!attachBtn) {
        const inputContainer = document.querySelector('.input-area-container') ||
                               document.querySelector('[class*="input"]') ||
                               document.querySelector('form');
        if (inputContainer) {
          attachBtn = inputContainer.querySelector('button:has(svg)');
        }
      }

      if (attachBtn) {
        console.log('[ChatAI] Gemini: Click nút attachment');
        simulateClick(attachBtn);
        await sleep(1000);

        // Sau khi click +, có thể hiện menu chọn loại upload
        // Tìm option "Tải hình ảnh lên" hoặc "Upload image"
        const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], button, div[tabindex]');
        for (const item of menuItems) {
          const text = item.textContent || '';
          if (text.match(/image|hình ảnh|upload|tải.*ảnh/i)) {
            console.log('[ChatAI] Gemini: Click menu item:', text);
            simulateClick(item);
            await sleep(800);
            break;
          }
        }

        // Tìm lại file input sau khi click menu (dynamic selector)
        fileInput = _queryWithFallback('file_input');
      }
    }

    // Method 3: Try hidden file input by various patterns
    if (!fileInput) {
      fileInput = document.querySelector('#hidden-local-image-upload-button') ||
                  document.querySelector('input[id*="upload"]') ||
                  document.querySelector('input[id*="file"]') ||
                  document.querySelector('input[id*="image"]');
    }

    // Method 4: Create và inject file input nếu không tìm thấy
    if (!fileInput) {
      console.log('[ChatAI] Gemini: Tạo file input mới');
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
      document.body.appendChild(fileInput);

      // Trigger click để mở file dialog (sẽ không work vì cần user gesture)
      // Thay vào đó dùng drag & drop
    }

    // Nếu có file input, set files
    if (fileInput && fileInput.tagName === 'INPUT') {
      console.log('[ChatAI] Gemini: Set files vào input');
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      fileInput.files = dt.files;

      // Dispatch multiple events để đảm bảo React/Angular detect
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Trigger React onChange nếu có
      const reactKey = Object.keys(fileInput).find(k => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
      if (reactKey && fileInput[reactKey]?.onChange) {
        fileInput[reactKey].onChange({ target: fileInput });
      }

      await sleep(2000);

      // Kiểm tra xem ảnh đã được thêm vào chưa (tìm preview - dynamic selector)
      const hasPreview = _queryWithFallback('image_preview');
      if (hasPreview) {
        console.log('[ChatAI] Gemini: Upload thành công via file input');
        return true;
      }
    }

    // Method 5: Fallback - paste qua clipboard (dùng dynamic selector cho composer)
    console.log('[ChatAI] Gemini: Thử paste qua clipboard');
    const editor = _queryWithFallback('composer') || document.activeElement;

    if (editor) {
      editor.focus();
      await sleep(200);

      // Tạo ClipboardEvent với files
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt
      });

      editor.dispatchEvent(pasteEvent);
      await sleep(2000);

      // Check lại preview (dynamic selector)
      const hasPreview = _queryWithFallback('image_preview');
      if (hasPreview) {
        console.log('[ChatAI] Gemini: Upload thành công via paste');
        return true;
      }
    }

    // Method 6: Drag & drop (dùng dynamic selector)
    console.log('[ChatAI] Gemini: Thử drag & drop');
    const dropTarget = _queryWithFallback('composer') ||
                       document.querySelector('.input-area') ||
                       document.body;

    if (dropTarget) {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));

      dropTarget.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt }));
      await sleep(100);
      dropTarget.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
      await sleep(100);
      dropTarget.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
      await sleep(2000);

      // Dynamic selector for image preview
      const hasPreview = _queryWithFallback('image_preview');
      if (hasPreview) {
        console.log('[ChatAI] Gemini: Upload thành công via drag & drop');
        return true;
      }
    }

    console.error('[ChatAI] Không thể upload ảnh lên Gemini - vui lòng upload thủ công');
    // Trả về true để tiếp tục gửi text (user có thể tự paste ảnh)
    return true;
  }

  // Insert text into Gemini editor
  // IMPORTANT: Không được xóa content hiện có (ảnh upload) và không dispatch InputEvent với insertText
  // để tránh trigger Gemini auto-submit
  async function insertText(text) {
    console.log('[ChatAI] Gemini: Nhập text');

    // Tìm editor với dynamic selector (có fallback)
    let editor = _queryWithFallback('composer');

    // Nếu không tìm thấy ngay, chờ thêm
    if (!editor) {
      await sleep(500);
      editor = _queryWithFallback('composer');
    }

    if (!editor) {
      console.error('[ChatAI] Không tìm thấy ô nhập text trên Gemini');
      return false;
    }

    editor.focus();
    await sleep(200);

    // Clear existing content
    if (editor.tagName === 'TEXTAREA') {
      editor.value = text;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Contenteditable div
      // KHÔNG dùng innerHTML = ... vì sẽ xóa ảnh đã upload
      // Thay vào đó dùng execCommand để APPEND text

      // Đưa cursor về cuối editor (sau ảnh nếu có)
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // collapse to end
      selection.removeAllRanges();
      selection.addRange(range);

      // Insert text bằng execCommand (không trigger auto-submit)
      // CRITICAL: KHÔNG dispatch input event vì sẽ trigger Gemini auto-submit
      const inserted = document.execCommand('insertText', false, text);

      if (!inserted) {
        console.log('[ChatAI] Gemini: execCommand failed, fallback to append');
        // Fallback: append text node
        const textNode = document.createTextNode(text);
        editor.appendChild(textNode);
      }

      // Verify text was inserted
      await sleep(200);
      if (!editor.textContent.includes(text.substring(0, 20))) {
        console.log('[ChatAI] Gemini: Fallback to direct append');
        // Direct append với paragraph
        const p = document.createElement('p');
        p.textContent = text;
        editor.appendChild(p);
        // Chỉ dispatch input trong fallback path, không phải main path
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    await sleep(300);
    console.log('[ChatAI] Gemini: Text đã nhập:', editor.textContent.substring(0, 50));
    return true;
  }

  // Click submit button
  async function clickSubmit() {
    console.log('[ChatAI] Gemini: Tìm nút gửi');
    await sleep(500);

    let sendBtn = null;
    const start = Date.now();
    while (Date.now() - start < 8000) {
      // Dùng dynamic selector cho submit button
      sendBtn = _queryWithFallback('submit_button');

      // Fallback: tìm button với icon arrow/send
      if (!sendBtn) {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const svg = btn.querySelector('svg');
          if (svg) {
            // Check for send/arrow icon patterns
            const paths = svg.querySelectorAll('path');
            for (const path of paths) {
              const d = path.getAttribute('d') || '';
              // Common send icon patterns
              if (d.includes('M2.01 21L23 12') || // Send arrow
                  d.includes('M2 21l21-9') ||
                  d.includes('m4 4 16 8-16 8') ||
                  d.match(/M\d+.*L.*\d+.*12/)) {
                sendBtn = btn;
                break;
              }
            }
          }
          if (sendBtn) break;
        }
      }

      if (sendBtn && !sendBtn.disabled) {
        console.log('[ChatAI] Gemini: Tìm thấy nút gửi');
        break;
      }
      sendBtn = null;
      await sleep(300);
    }

    if (!sendBtn) {
      // Last resort: tìm button cuối cùng trong input area
      const inputArea = document.querySelector('.input-area') ||
                        document.querySelector('[class*="input"]') ||
                        document.querySelector('form');
      if (inputArea) {
        const buttons = inputArea.querySelectorAll('button:not([disabled])');
        sendBtn = buttons[buttons.length - 1]; // Thường nút send ở cuối
      }
    }

    if (!sendBtn) {
      console.error('[ChatAI] Không tìm thấy nút gửi trên Gemini');
      return false;
    }

    console.log('[ChatAI] Gemini: Click nút gửi');
    simulateClick(sendBtn);

    // Fallback: nếu click không work, thử React onClick
    await sleep(500);
    const reactKey = Object.keys(sendBtn).find(k => k.startsWith('__reactProps$'));
    if (reactKey && sendBtn[reactKey]?.onClick) {
      sendBtn[reactKey].onClick({ preventDefault: () => {}, stopPropagation: () => {} });
    }

    return true;
  }

  // ============ CG-8: Snapshot Gemini conversation state ============
  // Gemini DOM dùng <user-query> + <model-response> elements để phân tách turns.
  function snapshotGeminiState() {
    // Dùng dynamic selector cho response container
    const responses = _queryAllWithFallback('response_container');
    return {
      turnCount: responses.length,
      lastIds: Array.from(responses)
        .slice(-5)
        .map((r, i) => r.dataset?.turnId || r.id || `idx-${i}`),
      timestamp: Date.now(),
    };
  }

  // ============ CG-8: Detect Gemini đang generate ============
  // Signals:
  //  - Nút stop hiển thị (aria-label="Stop response", "Dừng phản hồi", v.v.)
  //  - aria-busy="true" trên markdown container (streaming indicator)
  //  - Có phần tử với class chứa "loading" / "generating" / progress spinner
  // NOTE: KHÔNG dùng send button disabled vì nó disabled khi input rỗng (không phải khi generating)
  function isGeminiGenerating() {
    // Stop button với dynamic selector
    const stopBtn = _queryWithFallback('stop_button');
    if (stopBtn) return true;

    // Check aria-busy="true" trên markdown container - streaming indicator chính xác nhất
    const busyMarkdown = document.querySelector('.markdown[aria-busy="true"]');
    if (busyMarkdown) return true;

    // Check aria-busy="true" trên message-content container
    const busyMessageContent = document.querySelector('message-content[aria-busy="true"]');
    if (busyMessageContent) return true;

    // Spinner generic
    if (document.querySelector('mat-progress-bar:not([hidden])')) return true;

    return false;
  }

  // ============ Detection: Gemini tạo ảnh thay vì trả prompt text ============
  // Gemini hay hiểu sai yêu cầu enhance prompt → tự generate image thay vì return prompt text.
  // Detect patterns này để fallback về plain text thay vì dùng response sai.
  const IMAGE_GENERATION_PATTERNS = [
    // Vietnamese patterns
    /đang tạo (hình ảnh|ảnh|image)/i,
    /tôi sẽ tạo (hình ảnh|ảnh|một bức ảnh)/i,
    /để tôi tạo (hình ảnh|ảnh)/i,
    /tôi đang tạo/i,
    /hình ảnh (của bạn|cho bạn)/i,
    /tạo hình ảnh theo yêu cầu/i,
    /đây là (hình ảnh|ảnh)/i,
    // English patterns
    /creating (your |an |the )?image/i,
    /generating (your |an |the )?image/i,
    /i('m| am| will) (create|generate|make) (an |the |your )?image/i,
    /i('ll| will) (create|generate|make)/i,
    /i('ve| have) (created|generated|made)/i,
    /here('s| is) (the |your |an )?image/i,
    /let me (create|generate|make)/i,
    /working on (your |the |an )?image/i,
    /processing (your |the |an )?image/i,
    // Gemini announcement patterns — thường bắt đầu bằng OK/Sure rồi nói về tạo ảnh
    /^(ok|okay|sure|alright)[,.]?\s*(i('ll| will)|let me|here)/i,
  ];

  function isImageGenerationResponse(text) {
    if (!text || text.length < 5) return false;
    // Chỉ check 300 chars đầu — announcement thường ở đầu response
    const checkText = text.substring(0, 300).toLowerCase();
    for (const pattern of IMAGE_GENERATION_PATTERNS) {
      if (pattern.test(checkText)) {
        console.log('[Gemini-text] IMAGE_GENERATION detected:', pattern.toString(), '| text preview:', checkText.substring(0, 100));
        return true;
      }
    }
    return false;
  }

  // ============ CG-8: Poll đợi Gemini response xong ============
  async function waitForGeminiTextResult(baseline, timeout = 60000) {
    const startTime = Date.now();
    const pollInterval = 500;
    let lastDiag = 0;
    let lastTextLength = 0;
    let stableCount = 0;
    const STABLE_THRESHOLD = 3; // Text phải stable qua 3 poll cycles (~1.5s) mới coi là xong

    while (Date.now() - startTime < timeout) {
      // Dùng dynamic selector cho response container
      const responses = _queryAllWithFallback('response_container');

      // Chưa có response mới so với baseline → poll tiếp
      if (responses.length <= baseline.turnCount) {
        if (Date.now() - lastDiag > 5000) {
          console.log('[Gemini-text] Chưa có response mới — current:', responses.length, 'baseline:', baseline.turnCount);
          lastDiag = Date.now();
        }
        await sleep(pollInterval);
        continue;
      }

      const lastResponse = responses[responses.length - 1];
      if (!lastResponse) {
        await sleep(pollInterval);
        continue;
      }

      // Check streaming còn chạy không (signal-based)
      const signalGenerating = isGeminiGenerating();

      // Extract current text để check stability
      let currentText = '';
      const markdownEl = lastResponse.querySelector('.markdown');
      const messageContentEl = lastResponse.querySelector('message-content');
      const contentEl = markdownEl || messageContentEl || lastResponse;

      if (contentEl && typeof contentEl.innerText === 'string') {
        currentText = contentEl.innerText.trim();
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
      const stillGenerating = signalGenerating || (!isTextStable && currentTextLength > 0);

      if (stillGenerating) {
        if (Date.now() - lastDiag > 5000) {
          console.log('[Gemini-text] Đang generate — signal:', signalGenerating, 'textLen:', currentTextLength, 'stable:', stableCount);
          lastDiag = Date.now();
        }
        await sleep(pollInterval);
        continue;
      }

      // Streaming xong + text stable → extract final text
      console.log('[Gemini-text] Extract từ:', markdownEl ? '.markdown' : (messageContentEl ? 'message-content' : 'model-response'), '| text length:', currentText.length);

      if (!currentText || currentText.length < 1) {
        // Thử lấy text từ toàn bộ lastResponse nếu selector không match
        const fallbackText = lastResponse.innerText?.trim();
        if (fallbackText && fallbackText.length > 0) {
          console.log('[Gemini-text] Fallback extract từ model-response | text length:', fallbackText.length);
          currentText = fallbackText;
        } else {
          // Chờ thêm một chút nếu mới bắt đầu
          if (Date.now() - startTime < 5000) {
            await sleep(pollInterval);
            continue;
          }
          return { success: false, error: 'TEXT_EMPTY' };
        }
      }

      const turnId = lastResponse.dataset?.turnId || lastResponse.id || null;
      console.log('[Gemini-text] DONE — text length:', currentText.length, 'stableCount:', stableCount);

      // Check: Gemini tạo ảnh thay vì trả prompt text → coi như fail để fallback
      if (isImageGenerationResponse(currentText)) {
        console.warn('[Gemini-text] Gemini đang tạo ảnh thay vì trả prompt — trigger fallback');
        return { success: false, error: 'IMAGE_GENERATION_DETECTED', text: currentText };
      }

      return { success: true, text: currentText, turnId };
    }

    console.warn('[Gemini-text] TIMEOUT sau', timeout, 'ms');
    return { success: false, error: 'TIMEOUT' };
  }

  // Main handler
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // SSE invalidate: admin update DOM selector → clear cache để query fresh
    if (message.action === 'providerConfigUpdated') {
      _selectorConfig = null;
      _selectorConfigTime = 0;
      console.log('[Gemini] Provider config updated via SSE — selector cache invalidated');
      sendResponse({ success: true });
      return false;
    }

    // Phase X: chatAI:execute — ChatAIModal flow (giữ nguyên)
    if (message.action === 'chatAI:execute') {
      (async () => {
        try {
          // 1. Upload images first (if any)
          if (message.images && message.images.length > 0) {
            const uploaded = await uploadImages(message.images);
            if (!uploaded) {
              sendResponse({ success: false, error: 'Không thể upload ảnh lên Gemini' });
              return;
            }
          }

          // 2. Insert text
          const textInserted = await insertText(message.text);
          if (!textInserted) {
            sendResponse({ success: false, error: 'Không thể nhập text vào Gemini' });
            return;
          }

          // 3. Chờ Gemini UI settle trước khi submit
          await sleep(800);

          // 4. Submit
          const submitted = await clickSubmit();
          if (!submitted) {
            sendResponse({ success: false, error: 'Không thể gửi tin nhắn trên Gemini' });
            return;
          }

          sendResponse({ success: true });
        } catch (err) {
          sendResponse({ success: false, error: err.message || 'Lỗi không xác định' });
        }
      })();

      return true; // async sendResponse
    }

    // Phase CG-8: gemini:submitAndWait — submit prompt + chờ text response
    // Payload: { action, text, images?, timeout }
    if (message.action === 'gemini:submitAndWait') {
      console.log(
        '[Gemini-listener] gemini:submitAndWait nhận, text len:', (message.text || '').length,
        'images:', (message.images || []).length
      );
      (async () => {
        try {
          // PRE-CHECK: Cloudflare/Google challenge detection (defensive — Gemini hiếm khi có
          // nhưng thêm để an toàn khi tab inactive). Pattern giống ChatGPT/Grok.
          if (detectGeminiChallenge()) {
            const resolved = await waitForGeminiChallengeResolved(120000);
            if (!resolved) {
              sendResponse({
                success: false,
                error: 'CHALLENGE_TIMEOUT',
                message: 'Gemini yêu cầu xác minh. Vui lòng mở tab Gemini, hoàn thành verification, sau đó chạy lại.',
              });
              return;
            }
          }

          // 1. Snapshot baseline TRƯỚC khi submit
          const baseline = snapshotGeminiState();

          // 2. Phase CG-8 ext: Upload ref images (nếu có) TRƯỚC khi insert text
          //    Reuse `uploadImages` đã có (Phase X) — Gemini cho phép ảnh đầu vào.
          if (Array.isArray(message.images) && message.images.length > 0) {
            const uploaded = await uploadImages(message.images);
            if (!uploaded) {
              sendResponse({ success: false, error: 'REF_UPLOAD_FAILED', message: 'Không thể upload ảnh ref lên Gemini' });
              return;
            }
            await sleep(500); // chờ Gemini UI settle sau upload
          }

          // 3. Insert text vào Quill editor — prefix bắt LLM trả plain prompt (Prompt enhance flow).
          //    Gemini cũng có thể trả markdown/giải thích dài dòng nếu không có constraint.
          const enhancePrefix = await getEnhancePrefix();
          const promptText = enhancePrefix + (message.text || '');
          const textInserted = await insertText(promptText);
          if (!textInserted) {
            sendResponse({ success: false, error: 'INSERT_FAILED' });
            return;
          }

          // 4. Wait UI settle + click submit
          await sleep(500);
          const submitted = await clickSubmit();
          if (!submitted) {
            sendResponse({ success: false, error: 'SEND_BUTTON_NOT_FOUND' });
            return;
          }

          // 5. Chờ kết quả text
          const timeout = message.timeout || 60000;
          const result = await waitForGeminiTextResult(baseline, timeout);
          sendResponse(result);
        } catch (err) {
          sendResponse({
            success: false,
            error: 'EXCEPTION',
            message: err.message || 'Lỗi không xác định',
          });
        }
      })();

      return true; // async sendResponse
    }

    return false;
  });

  console.log('[ChatAI] Content script Gemini đã được inject (Phase X + CG-8)');
})();
