# Toonflow ↔ Google Flow Integration

## Overview

Integration cho phép Toonflow tạo ảnh/video **miễn phí** thông qua Google Flow (labs.google.com/fx) và SlncTrZ_Everything-GenAI Chrome extension, thay vì dùng API trả phí (Vertex AI, AtlasCloud, Grsai...).

**Architecture**:
```
Toonflow → googleflow.ts → POST localhost:1889 → ws-bridge → WebSocket (localhost:1888)
  → Extension sidePanel → Content Script → Google Flow DOM automation
  → Image/Video generated → Result back through bridge
```

**Trạng thái**: Đã deploy, sẵn sàng dùng.

---

## Components

### 1. ws-bridge Server

**Location**: `H:\Develop\ToonFlow\tools\ws-bridge\ws-bridge-server.mjs`
- **Port 1888**: WebSocket (Extension kết nối vào đây)
- **Port 1889**: HTTP (Toonflow/Vendor gửi command tới đây)

**Endpoint**:
```bash
# POST / - Gửi lệnh tới extension
POST http://localhost:1889/
Body: { action: "execute", provider: "flow", prompts: [...], images: [...], config: {...}, id: "unique-id" }

# GET /result/:id - Lấy kết quả theo ID
GET http://localhost:1889/result/:id
Response: { status: "pending" | "completed" | "failed", results: [...], error?: "..." }

# GET /result - Lấy kết quả gần nhất
GET http://localhost:1889/result
```

**Cách chạy**:
```bash
cd H:\Develop\Toonflow\tools\ws-bridge
node ws-bridge-server.mjs
```

### 2. SlncTrZ_Everything-GenAI Chrome Extension

**Cấu hình Extension**: Mở extension → Settings → SlncTrZ Bridge Config → URL: `ws://localhost:1888`

**FlowAdapter** (src/core/providers/FlowAdapter.js):
- `submitPrompt`: Gửi prompt tới Google Flow content script
- Hỗ trợ: text-to-image (Nano Banana), text-to-video (Veo 3.1)

### 3. Toonflow Vendor: googleflow.ts

**Location**: `H:\Develop\ToonFlow\data\vendor\googleflow.ts`

**Models (6 total)**:
| Type | Model Name | Modes | Notes |
|------|-----------|-------|-------|
| Image | Nano Banana Pro | text, singleImage, multiReference | Google Flow |
| Image | Nano Banana 2 | text, singleImage, multiReference | Google Flow |
| Image | Nano Banana Fast | text, singleImage, multiReference | Google Flow |
| Video | Veo 3.1 Fast | text, singleImage, startFrameOptional | Google Flow |
| Video | Veo 3.1 Lite | text, singleImage, startFrameOptional | Google Flow |
| Video | Veo 3.1 Quality | text, singleImage, startFrameOptional | Google Flow |

**Config**:
- `bridgeUrl`: `http://localhost:1889` (default)

**API Request Format**:
```typescript
interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode[];
}
```

---

## Setup Instructions

### 1. Start ws-bridge Server
```bash
cd H:\Develop\ToonFlow\tools\ws-bridge
node ws-bridge-server.mjs
```
- Background process: `Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "..."`
- Logs: Kiểm tra stdout/stderr

### 2. Mở Google Flow Tab
- Mở Chrome → `https://labs.google.com/fx`
- Đăng nhập Google nếu cần

### 3. Kết nối Extension
- Mở SlncTrZ_Everything-GenAI extension
- Settings → SlncZ Bridge Config → URL: `ws://localhost:1888`
- Extension tự động kết nối khi bridge start

### 4. Verify
```bash
# Test bridge
curl.exe http://localhost:1889/result

# Test extension connection
curl.exe -X POST http://localhost:1889/ -H "Content-Type: application/json" -d "{\"action\":\"ping\",\"id\":\"test1\"}"
```

---

## Usage

### Image Generation (Nano Banana)

1. Trong Toonflow, chọn **Google Flow** vendor
2. Chọn model: Nano Banana Pro / 2 / Fast
3. Điền prompt, chọn size, ratio
4. Generate → Bridge → Extension → Google Flow → Image back

### Video Generation (Veo 3.1)

1. Trong Toonflow, chọn **Google Flow** vendor
2. Chọn model: Veo 3.1 Fast / Lite / Quality
3. Điền prompt, chọn duration, resolution, aspect ratio
4. **Mode**:
   - `text`: Text-to-video (chỉ prompt)
   - `singleImage`: Image-to-video (prompt + 1 ảnh start frame)
   - `startFrameOptional`: Video với start frame (có thể có end frame)
5. Generate → Bridge → Extension → Google Flow → Video back

---

## Architecture Diagrams

### Data Flow
```
┌──────────┐
│ Toonflow │
└─────┬────┘
      │
      ↓ (vendorRequest)
┌──────────────┐
│ ws-bridge    │◄─────── Extension
└──────┬───────┘
      │ (WebSocket)
      ↓
┌──────────────┐
│ Google Flow  │
│ (labs.fx)   │
└──────────────┘
```

### Command Flow
```typescript
// Toonflow → Bridge
POST http://localhost:1889/
{
  "action": "execute",
  "provider": "flow",
  "prompts": ["cute cat"],
  "images": ["data:image/jpeg;base64,..."],
  "config": {
    "mode": "image",  // or "video"
    "model": "Nano Banana Pro",
    "size": "1K",
    "ratio": "16:9"
  },
  "id": "timestamp-random"
}

// Extension → Bridge (result)
{
  "action": "result",
  "id": "timestamp-random",
  "status": "completed",
  "results": ["https://..."]  // Image or Video URL
}
```

---

## API Reference

### Bridge HTTP Endpoints

#### POST `/`
Gửi lệnh tới extension.

**Request**:
```json
{
  "action": "execute",
  "provider": "flow",
  "prompts": ["string"],
  "images": ["data:image/xxx;base64,..."],
  "config": {
    "mode": "image" | "video",
    "model": "string",
    "duration": number,
    "ratio": "16:9" | "9:16",
    "resolution": "720p" | "1080p",
    "size": "1K" | "2K" | "4K",
    "aspectRatio": "16:9" | "9:16",
    "videoMode": "text" | "singleImage" | "startFrameOptional",
    "startImage": "data:image/xxx;base64,...",
    "endImage": "data:image/xxx;base64,..."
  },
  "id": "unique-id"
}
```

**Response**:
```json
{ "status": "sent", "id": "unique-id" }
```

#### GET `/result/:id`
Poll kết quả theo command ID.

**Response**:
```json
{ "status": "pending" | "completed" | "failed", "results": [...], "error": "..." }
```

#### GET `/result`
Lấy kết quả gần nhất (backward compat).

---

## Troubleshooting

### Extension không kết nối
**Symptom**: Bridge trả về `{"error": "Extension not connected"}`

**Solution**:
1. Extension chưa chạy → Mở SlncTrZ_Everything-GenAI
2. URL sai → Settings → SlncZ Bridge Config → `ws://localhost:1888`
3. Bridge chưa chạy → Check port 1888/1889

### Google Flow tab không mở
**Symptom**: Extension connected nhưng không có kết quả (timeout)

**Solution**: Mở tab `https://labs.google.com/fx` trong Chrome

### Race condition (empty results)
**Symptom**: Polling trả về results: [] ngay lập tức

**Root Cause**: Extension gửi 2 kết quả:
1. Empty result (immediate, race condition)
2. Real result (async)

**Fix**: ws-bridge-server.mjs line 48-55:
```javascript
const hasContent = msg.results?.length > 0 || msg.error || msg.status === 'failed';
if (msg.id && hasContent) {
  global._results[msg.id] = msg;
}
```
Chỉ lưu kết quả có nội dung.

### Port bị chiếm
**Symptom**: `EADDRINUSE` khi start bridge

**Check & Kill**:
```powershell
Get-NetTCPConnection -LocalPort 1888
Stop-Process -Id (Get-Process -Name "node" | Where-Object { $_.CommandLine -match "ws-bridge" }).Id
```

---

## File Locations

```
H:\Develop\ToonFlow\
├── data\
│   └── vendor\
│       └── googleflow.ts          ← Vendor TypeScript code
├── data\
│   └── db2.sqlite              ← Database (o_vendorConfig)
└── tools\
    └── ws-bridge\
        ├── node_modules\
        ├── package.json
        └── ws-bridge-server.mjs    ← Bridge server
```

---

## Performance Notes

- **Timeout**: Video generation 30s-5 phút (tùy độ dài video, độ phức nạp GPU)
- **Polling interval**: 3s (configurable)
- **Max concurrent**: Bridge xử lý tuần tự, extension xử lý tuần tự (1 task at a time)
- **Memory**: Bridge ~8-9MB RAM idle

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-30 | Initial version - Video only |
| 1.1 | 2026-05-30 | Add image models (Nano Banana), fix duplicate files, update bridge to localhost |

---

## Support

**Issues**:
- Extension không kết nối → Check chrome.storage af_ws_config.url
- Google Flow thay đổi UI → Update selectors in content.js
- Bridge crash → Check logs, restart service

**Debug**:
```bash
# Check extension storage
chrome.storage.local.get('af_ws_config', console.log)

# Bridge logs
journalctl -u slnctrz-bridge -n 50
```
