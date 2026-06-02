# SlncTrZ_VideoMaker — Architecture Plan

> Gộp 3 dự án riêng lẻ thành 1 hệ thống duy nhất, 1 lệnh khởi động.
> MeiLin | Wing: code_chronicles | Topic: monorepo_architecture | Updated: 2026-06-02

---

## 1. Hiện trạng

3 dự án, 3 tech stack, 7+ ports:

| Project | Tech | Ports | Repo gốc |
|---------|------|-------|----------|
| **ToonFlow** | Node/Express/TS/Electron | 10588, 1888, 1889, 50188 | HBAI-Ltd/Toonflow-app |
| **OmniVoice** | Python/FastAPI/PyTorch | 8880, 8881 | k2-fsa/OmniVoice |
| **Chrome Extension** | Vanilla JS (Manifest V3) | (trong Chrome) | — |

### Luồng kết nối hiện tại

```
┌─────────────────────────────────────────────────────────────────┐
│ ToonFlow (10588)                                                │
│  ├── vendor/omnivoice.ts  → POST http://127.0.0.1:8880/v1/tts  │
│  └── vendor/googleflow.ts → POST http://localhost:1889          │
│                               → WS-Bridge (1888/1889)           │
│                                  → Chrome Extension             │
│                                     → Google Flow (labs.google) │
└─────────────────────────────────────────────────────────────────┘
```

### Vấn đề

1. **WS-Bridge là process riêng** (181 dòng .mjs) — phải nhớ chạy thêm
2. **Hardcoded ports** trong vendor configs — không có central config
3. **Không có orchestrator** — mở 3-4 terminal
4. **Extension chỉ chạy trong Chrome** — khác biệt fundamental

---

## 2. Target Architecture

### Cấu trúc thư mục

```
H:\Develop\SlncTrZ_VideoMaker\
├── AGENTS.md                     # Hướng dẫn AI agent
├── .env                          # Config tập trung (ports, URLs, paths)
├── .gitignore
├── PLAN.md                       # File này
├── README.md
│
├── apps/                         # Backend services
│   ├── toonflow/                 # Core app (Node/TS)
│   │   ├── (code từ ToonFlow cũ)
│   │   └── ws-bridge-integrated  # WS-Bridge embedded vào Express
│   └── omnivoice/                # TTS service (Python)
│       └── (code từ OmniVoice cũ)
│
├── extensions/
│   └── chrome-vmk/               # Chrome Extension
│       └── (code từ SlncTrZ_VMK cũ)
│
├── scripts/
│   ├── start.ps1                 # ⭐ Windows: 1 lệnh start ALL
│   └── start.sh                  # Linux equivalent
│
├── docker-compose.yml            # Deploy production (.227)
└── docker-compose.override.yml   # GPU override cho OmniVoice
```

### Port mapping (target)

| Service | Port | Ghi chú |
|---------|------|---------|
| ToonFlow API | **10588** | Express + WS-Bridge embedded |
| OmniVoice API | **8880** | FastAPI, không đổi |
| OmniVoice Gradio | **8881** | Dev only, có thể tắt |
| ~~WS-Bridge WS~~ | ~~1888~~ | **Gộp vào ToonFlow** |
| ~~WS-Bridge HTTP~~ | ~~1889~~ | **Gộp vào ToonFlow → /api/bridge/** |

**Từ 7 ports → 2 ports chính (10588 + 8880).**

---

## 3. Chiến lược Embed WS-Bridge

### Vì sao?

- WS-Bridge chỉ **181 dòng**, 2 file handler
- ToonFlow **đã có** `express-ws` + `socket.io`
- Không cần process riêng, không cần quản lý lifecycle riêng

### Cách làm

1. **WebSocket endpoint:** `wss://localhost:10588/api/bridge/ws`
   - Extension kết nối đến đây thay vì `ws://localhost:1888`
   - Dùng chung Express HTTP server

2. **HTTP endpoint:** `POST http://localhost:10588/api/bridge/command`
   - ToonFlow vendor `googleflow.ts` gọi đến đây thay vì port 1889
   - GET result: `/api/bridge/result/:id`

3. **File mới trong ToonFlow:**
   ```
   src/
   └── bridge/
       ├── index.ts         # WS + HTTP handlers, mounted vào Express
       └── queue.ts         # Command queue logic (giữ nguyên từ ws-bridge-server.mjs)
   ```

---

## 4. Unified Config (`.env`)

```
# ============================================
# SlncTrZ_VideoMaker — Unified Configuration
# ============================================

# ToonFlow (Node/TS)
TOONFLOW_PORT=10588
TOONFLOW_ENV=dev

# OmniVoice (Python/FastAPI)
OMNIVOICE_PORT=8880
OMNIVOICE_GRADIO_PORT=8881
OMNIVOICE_DEVICE=auto
OMNIVOICE_MODEL=k2-fsa/OmniVoice

# WS-Bridge (embedded in ToonFlow, không cần port riêng)
# Extension kết nối qua: ws://localhost:${TOONFLOW_PORT}/api/bridge/ws
# ToonFlow gọi command qua: http://localhost:${TOONFLOW_PORT}/api/bridge/command

# Chrome Extension
CHROME_EXT_PATH=./extensions/chrome-vmk
CHROME_PROFILE=Profile 5
```

### Thay đổi trên từng service

| File hiện tại | Thay đổi |
|--------------|----------|
| `toonflow/data/vendor/omnivoice.ts` | Đọc `OMNIVOICE_URL` từ env thay vì hardcode `127.0.0.1:8880` |
| `toonflow/data/vendor/googleflow.ts` | Đọc `TOONFLOW_URL` từ env thay vì hardcode `localhost:1889` |
| `toonflow/src/app.ts` | Thêm `bridge/index.ts` mount, đọc `TOONFLOW_PORT` từ env |
| `omnivoice/start_omnivoice.ps1` | Đọc port từ env (hoặc argument) |
| `extension/background.js` | Đọc bridge URL từ storage/settings |

---

## 5. Single Command Orchestrator

### `start.ps1` — Behavior

```powershell
./start.ps1
# Output:
# ╔══════════════════════════════════════════╗
# ║    SlncTrZ_VideoMaker — Starting All     ║
# ╚══════════════════════════════════════════╝
# [✓] Loaded .env config
# [✓] ToonFlow      → http://localhost:10588 (PID: 1234)
# [✓] WS-Bridge     → embedded in ToonFlow
# [✓] OmniVoice     → http://localhost:8880  (PID: 5678)
# [~] Chrome Ext    → build sẵn, load vào Chrome (thủ công)
# ────────────────────────────────────────────
# Press Q to stop all services
```

### Behavior flow:
1. Load `.env`
2. Kill port cũ nếu có (10588, 8880)
3. Start OmniVoice API (`python -m omnivoice_server.cli`)
4. Start ToonFlow với WS-Bridge embedded (`yarn dev`)
5. Health check loop — poll `/health` đến khi UP
6. Build Chrome Extension (nếu có thay đổi)
7. Hiển thị dashboard real-time
8. `Ctrl+C` hoặc `Q` → stop all (graceful shutdown)

---

## 6. Docker Deployment (`.227`)

```yaml
# docker-compose.yml
services:
  toonflow:
    build: ./apps/toonflow
    ports: ["10588:10588"]
    env_file: .env
    volumes:
      - toonflow_data:/app/data

  omnivoice:
    build: ./apps/omnivoice
    ports: ["8880:8880"]
    env_file: .env
    deploy:
      resources:
        reservations:
          devices: [driver: nvidia, capabilities: [gpu]]
    volumes:
      - omnivoice_data:/app/profiles

volumes:
  toonflow_data:
  omnivoice_data:
```

Note: Chrome Extension không chạy trong Docker — chạy trên máy local, kết nối tới server qua WS.

---

## 7. Implementation Phases

### Phase 0: Skeleton & Structure (ước lượng: 30 phút)
- [ ] Tạo thư mục monorepo
- [ ] Copy 3 project vào vị trí tương ứng
- [ ] Viết `.env`, `.gitignore`
- [ ] Init git repo mới

### Phase 1: Embed WS-Bridge (ước lượng: 1-2h)
- [ ] Tách logic `ws-bridge-server.mjs` → `src/bridge/queue.ts` + `src/bridge/index.ts`
- [ ] Mount bridge routes vào Express (`/api/bridge/*`)
- [ ] Update `googleflow.ts` vendor → gọi `/api/bridge/command` local
- [ ] Update Chrome Extension background.js → kết nối `ws://localhost:10588/api/bridge/ws`
- [ ] Test: ToonFlow → bridge → Extension → Google Flow

### Phase 2: Unified Config (ước lượng: 30 phút)
- [ ] `dotenv` đọc `.env` trong ToonFlow startup
- [ ] OmniVoice vendor đọc `OMNIVOICE_URL` từ env
- [ ] GoogleFlow vendor đọc bridge URL từ env
- [ ] OmniVoice server đọc port từ env/args

### Phase 3: Orchestrator Script (ước lượng: 1h)
- [ ] Viết `scripts/start.ps1` — full orchestrator
- [ ] Viết `scripts/start.sh` — Linux equivalent
- [ ] Graceful shutdown handler
- [ ] Health check + auto-retry

### Phase 4: Docker (ước lượng: 1h)
- [ ] Dockerfile cho ToonFlow (đã có, chỉ tune)
- [ ] Dockerfile cho OmniVoice (đã có từ pip package)
- [ ] `docker-compose.yml` hoàn chỉnh
- [ ] Deploy thử lên .227

### Phase 5: Polish (ước lượng: 30 phút)
- [ ] Status dashboard tại `/status` trên ToonFlow
- [ ] Health check endpoint cho mọi service
- [ ] Cleanup docs

**Total estimated: 4-5h**

---

## 8. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| OmniVoice GPU memory | OOM nếu chạy cùng ToonFlow | `max_concurrent: 1`, CUDA_VISIBLE_DEVICES |
| Chrome Extension offline | Bridge gọi không được | Queue commands, retry, timeout 5 phút |
| WS-Bridge embedded error | Crash cả ToonFlow | Try/catch, error isolation, restart queue |
| Port conflict | Service không start | `start.ps1` auto-kill port cũ |
| Git history loss | Mất commit cũ | Giữ `.git` riêng từng project + git submodule hoặc rebase |
