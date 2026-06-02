# SlncTrZ Everything GenAI — Architecture

> Extension = DOM Robot | n8n = Brain
> Hybrid architecture: Extension thao tác trình duyệt, n8n xử lý dữ liệu.

## Kiến trúc

```
n8n (server .227) ←──WebSocket──→ background.js ←──runtime.onMessage──→ sidePanel
                                                                        → content scripts
                                                                          → DOM manipulation
```

## Extension chỉ làm 3 việc

1. **Input**: Điền prompt, upload ảnh vào tab provider (Flow/ChatGPT/Grok)
2. **Submit**: Click nút generate
3. **Output**: Poll kết quả, download, gửi về n8n

## Không có

- User accounts / login
- Premium / upgrade / payment
- Quota / trial limits
- Server-side storage
- Telegram bot

## File chính

| File | Vai trò |
|------|---------|
| `background.js` | SW: WebSocket client, message router, alarm handler |
| `src/app.js` | Sidebar init, message handlers, scheduler trigger handler |
| `src/workflow/WorkflowEditor.js` | Workflow editor UI, node forms |
| `src/workflow/NodeTemplates.js` | Node type definitions (12 types + Scheduler) |
| `src/core/WorkflowExecutor.js` | Workflow execution engine |
| `content.js` | Flow DOM content script (ISOLATED world) |
| `slate-bridge.js` | Flow MAIN world bridge (React fiber) |
| `chat-content-*.js` | ChatGPT/Gemini/Grok content scripts |
| `src/core/AuthManager.js` | Patched: no-op, isLoggedIn() → true |
| `src/core/FeatureGate.js` | Patched: canUse() → true |
| `src/core/StorageManager.js` | Patched: force local mode |
| `src/core/ApiStorage.js` | Patched: delegate to LocalStorage |

## WebSocket Protocol

### n8n → Extension
```json
{ "action": "execute", "provider": "flow", "prompts": [...], "images": [...], "config": {...} }
```

### Extension → n8n
```json
{ "action": "result", "status": "completed", "results": [{ "url": "...", "fileId": "..." }] }
```
