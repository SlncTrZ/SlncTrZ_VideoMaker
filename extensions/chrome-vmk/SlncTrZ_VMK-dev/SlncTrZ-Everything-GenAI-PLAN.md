# SlncTrZ — Everything GenAI PLAN & ARCHITECT

> **Ngày tạo:** 2026-05-24 15:30
> **Người viết:** Trương Công Định
> **Phiên bản:** v0.4 — Hybrid Architecture: Extension = DOM Robot, n8n = Brain
> **Nguồn:** SlncTrZ_VMK (forked from Toby Flow v1.1.2)

---

## 1. DOM Manipulation Architecture

> Toàn bộ DOM manipulation là source code thuần — không phụ thuộc server, auth, API.
> Server (labs.toby.vn) đã chết → mọi fallback cứng trong code vẫn hoạt động.

### 1.1 Provider Selectors Strategy

Mỗi provider có content script riêng, inject vào trang tương ứng:

| Provider | Content Script | World | Match Pattern |
|----------|---------------|-------|---------------|
| Google Flow | `content.js` + `slate-bridge.js` | ISOLATED + MAIN | `https://labs.google/fx/*` |
| ChatGPT | `chat-content-chatgpt.js` | ISOLATED | `https://chatgpt.com/*` |
| Gemini | `chat-content-gemini.js` | ISOLATED | `https://gemini.google.com/*` |
| Grok | `chat-content-grok.js` | ISOLATED | `https://grok.com/*` |

Lưu ý: `content.js` (root) là Flow content script KHÁC với `dist/content.js` (concatenated core modules).

### 1.2 Google Flow (labs.google/fx)

**File:** `content.js` (root) + `slate-bridge.js`

**Selectors** (`_FALLBACK_SELECTORS` — 22 keys, hardcoded fallback):

```javascript
tile_container: ['[data-tile-id]']
tile_image: ['img[src*="getMediaUrlRedirect"]', 'img[src*="googleusercontent.com"]']
tile_video: ['video[src*="getMediaUrlRedirect"]', 'video']
slate_editor: ['div[data-slate-editor="true"]', '[data-slate-node="value"]',
  '[role="textbox"][aria-multiline="true"]', '[contenteditable="true"]']
submit_button: ['button:has(i.google-symbols)', 'button[type="submit"]']
context_menu: ['[role="menu"]', '[role="menu"][data-state="open"]']
```

**Todo:**
- Slate editor: React fiber walk → `slate-bridge.js` dùng `window.postMessage`
  - Insert: `beforeinput` event → `insertData(DataTransfer)` → `execCommand`
  - Apply: `insertData` với DataTransfer object (chứa text/html)
  - Clear: `deleteFragment()` → selectAll → `children = [blueprint]`
  - Submit: `__reactProps.onClick` + fiber `onSubmit` → native click
  - Fallback: `simulateClick(PointerEvent)` → Enter key → Ctrl+Enter

### 1.3 ChatGPT (chatgpt.com)

**File:** `chat-content-chatgpt.js`

**3-Tier Insert:**
1. pasteEvent: dispatch `beforeinput` + `input` events với DataTransfer
2. execCommand: `document.execCommand('insertHTML', false, html)`
3. innerHTMLReplace: set innerHTML + `insertAdjacentHTML`

**4-Tier Submit:**
1. enterKey: dispatch `keydown` Enter
2. simulateClick: native click + `PointerEvent`
3. reactOnClick: tìm `__reactProps.onClick` trong fiber
4. formRequestSubmit: gọi `form.requestSubmit()` nếu có form

**Upload:** filePicker input → click + → hidden input → paste → dnd

**Tile Detection:**
- `[data-testid^="image-gen-loading-state"]` + `[aria-label="Generating image..."]`
- CDN: `estuary` / `oaiusercontent` — polling cho đến khi URL render

### 1.4 Gemini (gemini.google.com)

**File:** `chat-content-gemini.js`

**Insert:**
- `execCommand('insertHTML')`
- `appendChild` + `createElement('p')` + InputEvent

**6 Upload Methods:**
1. File input click
2. Click + hidden input
3. Paste từ clipboard  
4. Drag-and-drop
5. Create input programmatically
6. (dự phòng)

**Submit:** `simulateClick` + React onClick event chain

### 1.5 Grok (grok.com)

**File:** `chat-content-grok.js`

**4-Tier Insert:**
1. `execCommand('insertText'/'insertHTML')`
2. `beforeInput` event dispatch
3. innerHTML direct set
4. (dự phòng)

**4-Tier Submit:**
1. `formRequestSubmit()`
2. Enter key dispatch
3. `simulateClick()` trên nút submit
4. Native click

**Turnstile Handling:** 5 auto-click strategies
- `[data-action*="turnstile"]`
- `iframe[src*="turnstile"]`
- `#cf-turnstile`
- `.cf-turnstile`
- Fallback polling

**Age Verify:** Auto-handle dialog + confirm button

### 1.6 Cross-Context Messaging

```
SidePanel (dist/content.js)           Flow Tab (content.js root)
┌─────────────────────┐               ┌──────────────────────┐
│ MessageBridge       │──tabs.send──► │ content.js (ISOLATED)│
│ .sendToContentScript│◄──response── │                      │
└─────────────────────┘               └──────────┬───────────┘
                                                 │ postMessage
                                                 ▼
                                        ┌──────────────────┐
                                        │ slate-bridge.js   │
                                        │ (MAIN world)      │
                                        │ React fiber walk  │
                                        │ DOM manipulation  │
                                        └──────────────────┘
```

```
SidePanel                        Provider Tab (chatgpt/grok/gemini)
┌──────────────┐                 ┌─────────────────────────────┐
│ GenTab →     │──tabs.send──►   │ chat-content-*.js           │
│ ProviderAdapter               │ (ISOLATED world)            │
│ .execute()   │◄──response──   │ DOM manipulation + polling  │
└──────────────┘                └─────────────────────────────┘
```

### 1.7 Key Design Patterns

1. **Module Isolation:** Mỗi provider adapter/content script độc lập — không share state global
2. **Fallback Chain:** Luôn implement ít nhất 3 tier — tier đầu fail → auto fallback
3. **MutationObserver:** Verify success sau mỗi DOM operation
4. **Cache:** Tile cache (250ms TTL), status cache (1.5s TTL), selector cache (30s)
5. **Multi-language:** `aria-label` fallback theo locale (vi/en/th/ja)

### 1.8 Multi-Prompt Execution

Multi-Prompt cho phép nhập nhiều prompt cùng lúc — mỗi dòng trong textarea là một prompt riêng.

**Luồng xử lý:**

```
User nhập (textarea):
  "cute cat\nbeautiful dog\ncyberpunk city"

→ GenTab._buildPromptList()
  → tách theo \n, filter dòng trống
  → ["cute cat", "beautiful dog", "cyberpunk city"]

→ ProviderAdapter.execute(prompts)
  → mỗi prompt = 1 job item trong PromptQueue
```

**2 Execution Mode:**

| Mode | Cách hoạt động | Khi nào dùng |
|------|----------------|-------------|
| **Sequential** | Submit từng prompt → chờ kết quả → submit tiếp | Mặc định, an toàn |
| **Parallel** | Submit tất cả cùng lúc, không chờ | Cần tốc độ, chấp nhận rủi ro rate-limit |

**Legacy Mode (không queue):**
```
for each prompt:
  → ProviderAdapter.execute(prompt)
    → MessageBridge.sendToContentScript({action: 'submitPrompt', text: prompt})
      → content.js → slate-bridge → DOM insert + submit
    → TileMonitor.pollForResult(timeout: 180s)
      → polling tile DOM mỗi 2s
    → DownloadExecutor.download(tileId, resolution)
  → next prompt after delay (randomDelayMin~Max: 3-10s)
```

**Pipeline Queue Mode (mới hơn, khi queueEnabled = true):**
```
PromptQueue.add({
  prompts: [...],
  batchSize: 4,        // số prompt mỗi batch
  maxMonitor: 4,       // số tile theo dõi đồng thời
  restMin: 5,          // nghỉ giữa batch (giây)
  restMax: 15
})
  → chia prompts thành batches (4 prompts/batch)
    → batch submit song song
    → Monitor.pollTiles() — tối đa 4 tile cùng lúc
    → chờ COMPLETED hoặc TIMEOUT (180s)
    → rest 5-15s
    → batch tiếp theo
  → tất cả batch hoàn tất → DONE
```

**Progress Tracking (FloatingTracker):**

Hiển thị trên Flow page (góc phải):

```
┌────────────────────────────────┐
│ Pipeline        3/12   00:45   │
├────────────────────────────────┤
│ ● Prompts    15%              │
│   #1 cute cat     MONITORING  │
│   #2 beautiful dog  PENDING   │
│   #3 cyberpunk city  PENDING  │
└────────────────────────────────┘
```

Mỗi job item có state: `PENDING → SUBMITTING → SUBMITTED → MONITORING → COMPLETED/FAILED`.

**Tile Progress:** Khi MONITORING, polling DOM tile mỗi 2s, đọc % từ progress bar/indicator trên tile container.

## 2. Hybrid Architecture — Extension as DOM Robot

### 2.1 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        n8n (Server .227)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                             │
│  │ Google   │  │ Google   │  │ HTTP     │                             │
│  │ Sheets   │  │ Drive    │  │ Webhook  │                             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                             │
│       │             │             │                                   │
│       ▼             ▼             ▼                                   │
│  ┌──────────────────────────────────────────────────┐                 │
│  │           n8n Workflow Engine                     │                 │
│  │  Điều phối: prompt → ảnh → lệnh → kết quả       │                 │
│  └────────────────────┬─────────────────────────────┘                 │
│                       │ WebSocket                                    │
│                       │ JSON: {action, prompt, images, ...}          │
└───────────────────────┼─────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Chrome Extension (SlncTrZ — DOM Robot)                   │
│                                                                       │
│  ┌──────────────────────────────────────────────┐                    │
│  │ background.js (Service Worker)               │                    │
│  │  - WebSocket client → n8n                    │                    │
│  │  - Nhận lệnh từ n8n                          │                    │
│  │  - Gửi kết quả về n8n                        │                    │
│  │  - chrome.alarms cho scheduler               │                    │
│  └──────────┬───────────────────────────────────┘                    │
│             │ chrome.runtime.sendMessage                             │
│  ┌──────────▼───────────────────────────────────┐                    │
│  │ sidePanel (UI) / Content Scripts             │                    │
│  │                                              │                    │
│  │  Flow tab:    submit prompt, upload ảnh,     │                    │
│  │               download kết quả                │                    │
│  │  ChatGPT tab: submit prompt, lấy ảnh         │                    │
│  │  Grok tab:    submit prompt, lấy kết quả     │                    │
│  └──────────────────────────────────────────────┘                    │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Luồng xử lý

```
1. n8n nhận trigger (Google Sheets row mới, HTTP webhook, scheduler)
2. n8n xử lý: lấy prompt từ Sheet, ảnh từ Drive, ghép JSON
3. n8n gửi WebSocket → background.js:
    {
      action: "execute",
      provider: "flow",         // flow | chatgpt | grok
      prompts: ["cute cat", "..."],
      images: ["base64...", "https://..."],
      config: { ratio: "16:9", model: "Veo 3.1", quantity: 4 },
      workflowId: "..."         // optional: nếu chạy workflow
    }
4. background.js nhận → gửi đến sidePanel/content script
5. Content script thao tác DOM:
    a. Mở đúng tab provider
    b. Insert prompt text (qua slate-bridge / execCommand)
    c. Upload ảnh tham chiếu (nếu có)
    d. Cấu hình settings (ratio, model, quantity)
    e. Submit
    f. Poll kết quả (tile monitoring)
    g. Download kết quả (nếu cấu hình)
    h. Gửi kết quả về n8n qua WebSocket
6. n8n nhận kết quả → lưu vào Sheet / Drive / gửi webhook khác
```

### 2.3 WebSocket Protocol

```json
// n8n → Extension
{
  "action": "execute" | "cancel" | "ping",
  "provider": "flow" | "chatgpt" | "grok",
  "prompts": ["prompt 1", "prompt 2"],
  "images": ["base64...", "url..."],
  "config": {
    "ratio": "16:9",
    "model": "Nano Banana 2",
    "quantity": 4,
    "mediaType": "image" | "video",
    "videoDuration": 6,
    "autoDownload": true
  },
  "workflowId": "uuid",
  "id": "request-uuid"
}

// Extension → n8n
{
  "action": "result",
  "id": "request-uuid",
  "status": "completed" | "failed",
  "results": [
    { "url": "https://...", "fileId": "...", "thumbnail": "..." }
  ],
  "error": "error message if failed"
}
```

### 2.4 Extension Chỉ Là DOM Robot

| Extension làm | Extension KHÔNG làm |
|---------------|---------------------|
| Input prompt vào textarea | Xử lý prompt (LLM) |
| Upload ảnh tham chiếu | Lưu trữ dữ liệu |
| Click submit button | Quản lý user account |
| Poll tile kết quả | Quản lý quota/Premium |
| Download media | Xử lý thanh toán |
| Forward kết quả về n8n | Scheduling (n8n làm) |

### 2.5 Triển khai

- **Server .227**: n8n + WebSocket bridge (systemd service)
- **Extension**: Scheduler node gửi trigger ngược lên n8n (hoặc n8n tự schedule)
- **WebSocket**: background.js native WebSocket client, auto-reconnect
- **Bảo mật**: Token-based auth cho WebSocket connection (implement sau)

### 2.6 Cấu hình n8n → Extension

**Bridge Server** chạy trên server .227 (port 1888 WebSocket, 1889 HTTP):

```bash
# Trên server .227 - bridge đã chạy dạng systemd service
# Kiểm tra: sudo systemctl status slnctrz-bridge

# Nếu cần restart: sudo systemctl restart slnctrz-bridge
# Nếu cần logs:    sudo journalctl -u slnctrz-bridge -f
```

**Trong n8n Workflow — gửi lệnh:**

```json
// Step 1: HTTP Request node
// POST http://localhost:1889/
// Headers: Content-Type: application/json
// Body (JSON):
{
  "action": "execute",
  "provider": "flow",
  "prompts": ["a cute cat"],
  "images": [],
  "config": {
    "ratio": "16:9",
    "model": "Nano Banana 2",
    "quantity": 1,
    "mediaType": "image"
  }
}
```

```json
// Step 2: Wait node (5-10 giây)
```

```json
// Step 3: HTTP Request node
// GET http://localhost:1889/result
// Response:
{
  "action": "result",
  "id": "request-uuid",
  "status": "completed",
  "results": [
    {
      "url": "https://storage.googleapis.com/...",
      "fileId": "tile_xxx",
      "thumbnail": "https://..."
    }
  ]
}
```

**Cấu hình WebSocket URL trên Extension:**

Mở Settings → mục "WebSocket Bridge" → nhập URL:
```
ws://192.168.1.227:1888
```

(Mặc định: `ws://192.168.1.227:1888`, có thể thay đổi nếu server khác IP)

---

Tất cả DOM selectors và manipulation logic:

- ✅ Không phụ thuộc server (hardcoded fallback trong source)
- ✅ Không phụ thuộc auth (đã patch FeatureGate.canUse → true)
- ✅ Không phụ thuộc API (đã kill mọi labs.toby.vn call)
- ✅ Hoạt động offline hoàn toàn---

