# PLAN: SlncTrZ Everything GenAI

> Chrome extension = DOM Robot | n8n = Brain
> Hybrid architecture: Extension thao tác trình duyệt, n8n xử lý dữ liệu.

---

## Phase 1: DOM Robot Core ✓

Extension chỉ làm 3 việc:
1. **Input** — điền prompt, upload ảnh vào tab provider
2. **Submit** — click nút generate
3. **Output** — poll kết quả, download, gửi về n8n

### Provider DOM manipulation (done)
- Google Flow (slate-bridge.js) ✓
- ChatGPT (chat-content-chatgpt.js) ✓
- Grok (chat-content-grok.js) ✓

### Offline unlock (done)
- FeatureGate canUse() → true ✓
- AuthManager no-op ✓
- StorageManager local mode ✓
- ApiStorage → LocalStorage delegate ✓
- Kill all labs.toby.vn calls ✓

### Cleanup (done)
- Remove login/register ✓
- Remove Premium/upgrade UI ✓
- Remove Bot chung, unlock Bot riêng ✓
- Remove referral, notification, changelog, tip coffee ✓
- Rename tobyflow- → slnctrz- ✓

---

## Phase 2: Hybrid Architecture (current)

### 2.1 WebSocket Bridge
- background.js WebSocket client → n8n server .227
- Auto-reconnect, token auth
- Protocol: JSON commands (execute, cancel, ping)

### 2.2 Headless Command API
- Receive prompt + images from n8n
- Execute on provider tabs (Flow/ChatGPT/Grok)
- Return results to n8n

### 2.3 Scheduler Trigger
- Node "Scheduler" trong Workflow editor
- chrome.alarms → trigger workflow
- Hoặc n8n tự schedule và gửi lệnh qua WebSocket

---

## Phase 3: n8n Integration (server .227)

- n8n workflow: Google Sheets → prompt → WebSocket → Extension
- n8n workflow: Google Drive → ảnh → base64 → WebSocket → Extension
- n8n workflow: HTTP webhook → Extension → kết quả → Google Sheets

---

## Non-Goals
- ❌ User accounts / login / auth
- ❌ Premium / upgrade / payment
- ❌ Quota / trial limits
- ❌ Server-side storage
- ❌ Telegram bot (bỏ qua, tập trung vào n8n)
