#!/usr/bin/env bash
# SlncTrZ_VideoMaker — Start All Services (Linux)
# MeiLin | Updated: 2026-06-02

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

echo "╔══════════════════════════════════════════════╗"
echo "║   SlncTrZ_VideoMaker — Starting All Services  ║"
echo "╚══════════════════════════════════════════════╝"

# Load .env
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
  echo "[✓] Loaded .env config"
fi

TOONFLOW_PORT="${TOONFLOW_PORT:-10588}"
OMNIVOICE_PORT="${OMNIVOICE_PORT:-8880}"
OMNIVOICE_DEVICE="${OMNIVOICE_DEVICE:-auto}"
OMNIVOICE_MODEL="${OMNIVOICE_MODEL:-k2-fsa/OmniVoice}"

cleanup() {
  echo ""
  echo "[🛑] Shutting down all services..."
  [ -n "${TOONFLOW_PID:-}" ] && kill "$TOONFLOW_PID" 2>/dev/null || true
  [ -n "${OMNIVOICE_PID:-}" ] && kill "$OMNIVOICE_PID" 2>/dev/null || true
  echo "[✓] All services stopped"
}
trap cleanup EXIT INT TERM

# Kill old processes on ports
for port in "$TOONFLOW_PORT" "$OMNIVOICE_PORT"; do
  pid=$(lsof -ti:$port 2>/dev/null || true)
  [ -n "$pid" ] && kill "$pid" 2>/dev/null && echo "[💀] Killed process on port $port"
done
sleep 2

# Start OmniVoice
echo "[🚀] Starting OmniVoice API on port $OMNIVOICE_PORT..."
cd "$ROOT_DIR/apps/omnivoice"
mkdir -p logs
python -m omnivoice_server.cli \
  --port "$OMNIVOICE_PORT" \
  --host 127.0.0.1 \
  --device "$OMNIVOICE_DEVICE" \
  --model "$OMNIVOICE_MODEL" &
OMNIVOICE_PID=$!
echo "[  ] OmniVoice PID: $OMNIVOICE_PID"

# Start ToonFlow (WS-Bridge embedded)
echo "[🚀] Starting ToonFlow on port $TOONFLOW_PORT..."
cd "$ROOT_DIR/apps/toonflow"
PORT="$TOONFLOW_PORT" yarn dev &
TOONFLOW_PID=$!
echo "[  ] ToonFlow PID: $TOONFLOW_PID"

# Health check
echo ""
echo "[⏳] Waiting for services..."
sleep 5

for i in $(seq 1 30); do
  all_up=true
  if ! curl -sf "http://127.0.0.1:$OMNIVOICE_PORT/health" > /dev/null 2>&1; then
    all_up=false
  fi
  if ! curl -sf "http://127.0.0.1:$TOONFLOW_PORT/api/bridge/status" > /dev/null 2>&1; then
    # ToonFlow might still be starting - check port only
    if ! ss -tlnp "sport = :$TOONFLOW_PORT" | grep -q .; then
      all_up=false
    fi
  fi
  $all_up && break
  sleep 2
done

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║                 DASHBOARD                     ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  🎬 ToonFlow   → http://localhost:$TOONFLOW_PORT   ║"
echo "║  🌉 WS-Bridge  → ws://localhost:$TOONFLOW_PORT/api/bridge/ws ║"
echo "║  🎤 OmniVoice  → http://localhost:$OMNIVOICE_PORT     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop all services"

wait
