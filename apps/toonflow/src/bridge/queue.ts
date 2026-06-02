/**
 * Bridge — Command queue for Chrome Extension communication.
 * Wing: code_chronicles | Topic: ws_bridge_embed | Updated: 2026-06-02
 */

export interface BridgeCommand {
  action: string;
  id?: string;
  provider?: string;
  prompts?: string[];
  images?: string[];
  config?: Record<string, any>;
}

export interface BridgeResult {
  action: string;
  id: string;
  status: string;
  results?: any[];
  error?: string;
}

const commandQueue: BridgeCommand[] = [];
let processing = false;
let extWs: any = null;
const results: Record<string, BridgeResult> = {};
let lastResult: BridgeResult | null = null;

export function setExtension(ws: any): void {
  extWs = ws;
  if (!ws) processing = false;
}

export function getExtension(): any {
  return extWs;
}

function processQueue(): void {
  if (processing || commandQueue.length === 0) return;
  processing = true;
  const cmd = commandQueue.shift()!;

  console.log(`[Bridge] Processing queued command id=${cmd.id}, remaining=${commandQueue.length}`);

  if (!extWs) {
    console.log(`[Bridge] No extension connected, failing command id=${cmd.id}`);
    results[cmd.id!] = { action: 'result', id: cmd.id!, status: 'failed', error: 'Extension not connected' };
    processing = false;
    processQueue();
    return;
  }

  try {
    extWs.send(JSON.stringify(cmd));
    console.log(`[Bridge] Forwarded to extension, waiting for result id=${cmd.id}`);
  } catch (e: any) {
    console.log(`[Bridge] Send failed for id=${cmd.id}: ${e.message}`);
    results[cmd.id!] = { action: 'result', id: cmd.id!, status: 'failed', error: e.message };
    processing = false;
    processQueue();
  }
}

export function onResultReceived(msg: BridgeResult): void {
  const hasContent = (msg.results && msg.results.length > 0) || !!msg.error || msg.status === 'failed';
  if (msg.id && hasContent) {
    results[msg.id] = msg;
    lastResult = msg;
    console.log(`[Bridge] Stored result for id=${msg.id}, status=${msg.status}`);
    if (processing) {
      processing = false;
      processQueue();
    }
  } else if (msg.id && !hasContent) {
    console.log(`[Bridge] Ignored empty result id=${msg.id}`);
  }
}

export function pushCommand(cmd: BridgeCommand): void {
  commandQueue.push(cmd);
  processQueue();
}

export function getResult(id: string): BridgeResult | { status: string; id: string } {
  return results[id] || { status: 'pending', id };
}

export function getLatestResult(): BridgeResult | { status: string } {
  return lastResult || { status: 'no_result' };
}

export function getQueueLength(): number {
  return commandQueue.length;
}
