/**
 * SseClient — Quản lý kết nối Server-Sent Events đến backend
 * Singleton static class, giữ kết nối liên tục khi user đã login
 * Chỉ disconnect khi logout (không disconnect theo visibility để tránh session_replaced liên tục)
 *
 * Reconnect strategy: exponential backoff (5s → 10s → 20s → 40s → 60s max)
 * Sau MAX_RETRIES (10) lần liên tiếp thất bại → dừng reconnect, chờ user action hoặc focus
 *
 * BroadcastChannel integration:
 * - Sử dụng SseBroadcastManager để share 1 SSE connection cho nhiều tabs
 * - Chỉ tab LEADER mới tạo SSE connection thực
 * - Các tab FOLLOWER nhận events qua BroadcastChannel
 *
 * PATCHED: Disabled for offline standalone operation (no backend).
 */
class SseClient {
  static connect() {}

  static disconnect() {}

  static isConnected() { return false; }

  static forceReconnect() {}
}

window.SseClient = SseClient;
