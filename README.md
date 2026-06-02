# SlncTrZ_VideoMaker

> Monorepo hợp nhất ToonFlow + OmniVoice + Chrome Extension
> 1 lệnh khởi động — unified configuration — production-ready Docker deployment

## Quick Start

```powershell
# Clone + setup
git clone <repo-url>
cd SlncTrZ_VideoMaker

# Start tất cả services
.\scripts\start.ps1
```

Sau đó:
- **ToonFlow** → http://localhost:10588
- **OmniVoice API** → http://localhost:8880
- **OmniVoice Docs** → http://localhost:8880/docs
- **Chrome Extension** → load `extensions/chrome-vmk/dist/` vào Chrome

## Architecture

```
apps/
├── toonflow/         # AI short drama/comic tool (Node/Express/Electron)
│                     # WS-Bridge được embedded → /api/bridge/*
└── omnivoice/        # Zero-shot TTS, 600+ languages (Python/FastAPI)

extensions/
└── chrome-vmk/       # DOM Robot cho Google Flow/ChatGPT/Grok (MV3)
```

## Commands

| Lệnh | Mô tả |
|------|-------|
| `.\scripts\start.ps1` | Start tất cả services |
| `.\scripts\start.ps1 -NoOmnivoice` | Start không có TTS |
| `.\scripts\start.ps1 -BuildExtension` | Build Chrome Extension |
| `docker compose up -d` | Deploy production (.227) |

## Ports

| Service | Port | Ghi chú |
|---------|------|---------|
| ToonFlow | 10588 | WS-Bridge embedded |
| OmniVoice API | 8880 | OpenAI-compatible |
| OmniVoice Gradio | 8881 | Dev UI (optional) |

## Config

Copy `.env` và điều chỉnh:

```env
TOONFLOW_PORT=10588
OMNIVOICE_PORT=8880
OMNIVOICE_DEVICE=auto
OMNIVOICE_MODEL=k2-fsa/OmniVoice
```
