# PROCESS: SlncTrZ Everything GenAI — Dev Workflow & Reference

> Extension = DOM Robot | n8n = Brain
> Build, test, deploy.

---

## 1. Build

```bash
cd SlncTrZ_Everything-GenAI
node build.mjs
```

**Output**: `dist/` — 23 assets, ~3.6MB content.js

---

## 2. Load Extension

```bash
# Open Chrome with profile + CDP
node scripts/launch-chrome.mjs --profile "Profile 5" --kill

# After rebuild:
node scripts/cdp-reload.mjs
```

---

## 3. DOM Robot — Command Protocol

### From n8n → Extension (WebSocket / chrome.runtime)

```json
{
  "action": "execute",
  "provider": "flow",
  "prompts": ["prompt text"],
  "images": ["base64..."],
  "config": { "ratio": "16:9", "model": "Nano Banana 2", "quantity": 4 }
}
```

### From Extension → n8n (WebSocket)

```json
{
  "action": "result",
  "status": "completed",
  "results": [{ "url": "...", "fileId": "...", "thumbnail": "..." }]
}
```

---

## 4. DOM Selectors Reference

### Google Flow (labs.google/fx)

| Action | Strategy | File |
|--------|----------|------|
| Insert text | React fiber → insertData(DataTransfer) | `slate-bridge.js` |
| Submit | `__reactProps.onClick` → native click | `slate-bridge.js` |
| Tile extract | `[data-tile-id]`, `getMediaUrlRedirect` CDN polling | `content.js` |

### ChatGPT (chatgpt.com)

| Action | Strategy | File |
|--------|----------|------|
| Insert | pasteEvent → execCommand → innerHTML | `chat-content-chatgpt.js` |
| Submit | enterKey → simulateClick → reactOnClick → formRequestSubmit | `chat-content-chatgpt.js` |

### Grok (grok.com)

| Action | Strategy | File |
|--------|----------|------|
| Insert | execCommand → beforeInput → innerHTML | `chat-content-grok.js` |
| Submit | formRequestSubmit → enterKey → simulateClick → nativeClick | `chat-content-grok.js` |
| Turnstile | 5 auto-click strategies | `chat-content-grok.js` |

---

## 5. Key Files

| File | Role |
|------|------|
| `background.js` | SW: WebSocket client, message router, alarm handler |
| `src/app.js` | Sidebar init, message handlers |
| `src/core/WorkflowExecutor.js` | Workflow engine |
| `src/workflow/WorkflowEditor.js` | Workflow editor UI |
| `src/workflow/NodeTemplates.js` | Node type definitions |
| `content.js` | Flow DOM content script |
| `slate-bridge.js` | Flow MAIN world bridge |
| `chat-content-*.js` | ChatGPT/Gemini/Grok content scripts |
