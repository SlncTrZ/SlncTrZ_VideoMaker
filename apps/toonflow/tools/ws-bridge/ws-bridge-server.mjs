#!/usr/bin/env node
/**
 * WebSocket Bridge Server — DEPRECATED
 * 
 * WS-Bridge đã được embedded vào ToonFlow (src/app.ts → src/bridge/).
 * File này giữ lại cho backward compatibility. KHÔNG chạy riêng.
 * 
 * Bridge mới:
 *   WS  → ws://localhost:10588/api/bridge/ws
 *   HTTP → http://localhost:10588/api/bridge
 * 
 * Cách dùng CŨ (sẽ bỏ):
 *   node tools/ws-bridge/ws-bridge-server.mjs
 * 
 * Chức năng CŨ:
 *   1. WebSocket server port 1888 — extension kết nối đến
 *   2. HTTP POST port 1889 — n8n/Toonflow gửi lệnh đến
 *   3. Queue commands từ nhiều POST, forward đến extension từng cái một
 *   4. Nhận kết quả từ extension → lưu theo ID
 *   5. GET /result/:id — lấy kết quả theo command ID
 *   6. GET /result — lấy kết quả gần nhất (backward compat)
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { URL } from 'url';

const WS_PORT = 1888;
const HTTP_PORT = 1889;

// Track connected extensions
let extWs = null;

// Store results by command ID
global._results = {};
// Track latest result for backward compat
global._lastResult = null;

// Queue for serializing commands (1 at a time to extension)
const _commandQueue = [];
let _processing = false;

async function _processQueue() {
  if (_processing || _commandQueue.length === 0) return;
  _processing = true;
  const cmd = _commandQueue.shift();

  console.log(`[Bridge] Processing queued command id=${cmd.id}, queue=${_commandQueue.length + 1} remaining=${_commandQueue.length}`);

  if (!extWs) {
    console.log(`[Bridge] No extension connected, failing command id=${cmd.id}`);
    global._results[cmd.id] = { action: 'result', id: cmd.id, status: 'failed', error: 'Extension not connected' };
    _processing = false;
    _processQueue();
    return;
  }

  try {
    extWs.send(JSON.stringify(cmd));
    console.log(`[Bridge] Forwarded to extension, waiting for result id=${cmd.id}`);
  } catch (e) {
    console.log(`[Bridge] Send failed for id=${cmd.id}: ${e.message}`);
    global._results[cmd.id] = { action: 'result', id: cmd.id, status: 'failed', error: e.message };
    _processing = false;
    _processQueue();
  }
}

function _onResultReceived(msg) {
  const hasContent = msg.results?.length > 0 || msg.error || msg.status === 'failed';
  if (msg.id && hasContent) {
    global._results[msg.id] = msg;
    global._lastResult = msg;
    console.log(`[Bridge] Stored result for id=${msg.id}, status=${msg.status}`);
    // Result received for current command → process next in queue
    if (_processing) {
      _processing = false;
      _processQueue();
    }
  } else if (msg.id && !hasContent) {
    console.log(`[Bridge] Ignored empty result id=${msg.id}`);
  }
}

// ===== WebSocket Server (cho Extension kết nối) =====
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[Bridge] WebSocket server on port ${WS_PORT}`);

wss.on('connection', (ws) => {
  extWs = ws;
  console.log('[Bridge] Extension connected');

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('[Bridge] From extension:', msg.action, msg.id || '');

    if (msg.action === 'pong') return;
    if (msg.action === 'result') {
      _onResultReceived(msg);
    }
  });

  ws.on('close', () => {
    console.log('[Bridge] Extension disconnected');
    extWs = null;
  });

  ws.on('error', (err) => {
    console.error('[Bridge] WebSocket error:', err.message);
  });
});

// ===== HTTP Server (cho n8n/Toonflow gửi lệnh) =====
const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // GET /result/:id
  const resultMatch = pathname.match(/^\/result\/(.+)$/);
  if (req.method === 'GET' && resultMatch) {
    const id = resultMatch[1];
    const result = global._results[id];
    if (result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'pending', id }));
    }
    return;
  }

  // GET /result
  if (req.method === 'GET' && pathname === '/result') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(global._lastResult || { status: 'no_result' }));
    return;
  }

  // POST / — queue command, forward 1 at a time
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const cmd = JSON.parse(body);
        console.log(`[Bridge] Queued from n8n: ${cmd.action} id=${cmd.id || '?'}`);

        if (!extWs) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Extension not connected' }));
          return;
        }

        _commandQueue.push(cmd);
        console.log(`[Bridge] Queue size: ${_commandQueue.length}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'queued', id: cmd.id }));
        _processQueue();
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`[Bridge] HTTP server on port ${HTTP_PORT}`);
  console.log(`\n  Extension → ws://SERVER_IP:${WS_PORT}/ws/extension`);
  console.log(`  n8n/Toonflow → POST http://SERVER_IP:${HTTP_PORT}/`);
  console.log(`  Result by ID → GET http://SERVER_IP:${HTTP_PORT}/result/:id`);
  console.log(`  Latest result → GET http://SERVER_IP:${HTTP_PORT}/result\n`);
});
