# SlncTrZ_VideoMaker — AGENTS.md

> Hướng dẫn cho AI Agent (MeiLin) khi làm việc trên project này.
> Wing: code_chronicles | Topic: monorepo_governance | Updated: 2026-06-02

## 1. Monorepo Structure

```
SlncTrZ_VideoMaker/
├── apps/toonflow/         # Node/Express/TypeScript/Electron
│   ├── src/app.ts         # Express server entry (đã mount bridge/)
│   └── src/bridge/        # WS-Bridge embedded (index.ts + queue.ts)
├── apps/omnivoice/        # Python/FastAPI/PyTorch
│   └── omnivoice_server/  # REST API (FastAPI)
├── extensions/chrome-vmk/ # Chrome Extension MV3 (Vanilla JS)
├── scripts/               # Orchestrator scripts
├── .env                   # ⭐ Config tập trung — KHÔNG hardcode port trong code
└── docker-compose.yml     # Deploy .227
```

## 2. Rules

### Khi sửa code:

1. **Đọc `.env`** trước — ports, URLs phải từ env, không hardcode
2. **WS-Bridge** đã embedded trong ToonFlow (`/api/bridge/*`) — không tạo process riêng
3. **ToonFlow vendor** (`data/vendor/*.ts`):
   - `omnivoice.ts` → `process.env.OMNIVOICE_URL` (mặc định `http://127.0.0.1:8880`)
   - `googleflow.ts` → bridge URL local (`http://localhost:${PORT}/api/bridge/command`)

### Khi deploy:

1. **Local dev**: `.\scripts\start.ps1` — 1 lệnh
2. **Server .227**: `docker compose up -d`
3. **Chrome Extension** chỉ chạy local, không deploy server

### Khi thêm service mới:

1. Thêm port vào `.env`
2. Thêm start logic vào `scripts/start.ps1`
3. Cập nhật docker-compose
4. Gọi `meilin-brain:knowledge_store` log thay đổi

## 3. Port Convention

| Env Key | Default | Service |
|---------|---------|---------|
| TOONFLOW_PORT | 10588 | ToonFlow API + WS-Bridge |
| OMNIVOICE_PORT | 8880 | OmniVoice REST API |
| OMNIVOICE_GRADIO_PORT | 8881 | OmniVoice Gradio UI |

## 4. Git Protocol

- **Repo origin**: github.com/SlncTrZ/SlncTrZ_VideoMaker
- **Branch**: main
- **Commit prefix**: `Feat:`, `Fix:`, `Refactor:`, `Chore:`, `Docs:`
- **NO secrets, NO .env in commit**
