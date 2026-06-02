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
 */
class SseClient {
  static _eventSource = null;
  static _lastEventId = null;
  static _reconnectTimer = null;
  static _connected = false;
  static _connecting = false; // Đang trong quá trình kết nối (chờ onopen)
  static _roleListenerSetup = false;
  static _connectedAt = 0; // Timestamp khi connection được thiết lập

  // Backoff state
  static _retryCount = 0;
  // Phase L: Use SystemConfig for timeouts with hardcoded fallbacks
  static get _BASE_DELAY() { return 2000; } // Fixed 2s base delay
  static get _MAX_DELAY() { return window.SystemConfig?.getTimeout('sse_max_delay_ms') || 30000; }
  static get _MAX_RETRIES() { return window.SystemConfig?.getTimeout('sse_max_retries') || 15; }

  // Client-side heartbeat check
  static _lastHeartbeat = 0;
  static _heartbeatCheckTimer = null;
  static get _HEARTBEAT_TIMEOUT() { return window.SystemConfig?.getTimeout('sse_heartbeat_timeout_ms') || 45000; }

  // Flapping detection: tránh reset retry counter khi connection ngắt nhanh
  // (server đóng ngay sau khi mở → spam reconnect → Chrome throttle)
  static _stableResetTimer = null;
  static get _STABLE_THRESHOLD() { return window.SystemConfig?.getTimeout('sse_stable_threshold_ms') || 10000; }

  /**
   * Kết nối SSE — gọi khi user login + sidePanel visible
   * Với BroadcastChannel: chỉ LEADER mới tạo connection thực
   */
  static async connect() {
    if (this._eventSource) return;
    if (this._connecting) return;
    if (!window.authManager?.isLoggedIn()) {
      console.log('[SSE] Chưa đăng nhập, không kết nối');
      return;
    }

    // Khởi tạo BroadcastManager nếu chưa
    if (window.SseBroadcastManager && !window.SseBroadcastManager.isInitialized()) {
      await window.SseBroadcastManager.init(window.authManager?.user?.id);
    }

    // Setup role change listener (chỉ 1 lần)
    this._setupRoleChangeListener();

    // Chỉ LEADER mới tạo connection
    if (window.SseBroadcastManager?.isInitialized() && !window.SseBroadcastManager.isLeader()) {
      console.log('[SSE] Follower mode - nhận events qua BroadcastChannel');
      // Follower: đánh dấu connected nhưng emit follower_mode để UI hiển thị đúng
      // Thực tế trạng thái phụ thuộc vào leader
      this._connected = true;
      window.eventBus?.emit('sse:follower_mode');
      return;
    }

    this._connecting = true;
    window.eventBus?.emit('sse:connecting');
    // Broadcast connecting status đến followers
    window.SseBroadcastManager?.broadcastSseStatus('connecting');

    try {
      console.log('[SSE] Bắt đầu kết nối... (retry #' + this._retryCount + ')');
      const ticket = await this._getTicket();
      if (!ticket) {
        console.warn('[SSE] Không lấy được ticket');
        this._connecting = false;
        this._scheduleReconnect();
        return;
      }
      // Auth error → không reconnect, chờ user login lại
      if (ticket === 'AUTH_ERROR') {
        console.warn('[SSE] Auth error, không reconnect (chờ user login)');
        this._connecting = false;
        this._connected = false;
        window.eventBus?.emit('sse:auth_required');
        return;
      }
      console.log('[SSE] Đã lấy ticket');

      // Lấy last event ID từ storage để replay
      const stored = await chrome.storage.local.get('af_sse_last_event_id');
      const lastId = stored.af_sse_last_event_id || '';

      const baseUrl = this._getBaseUrl();
      if (!baseUrl) {
        console.warn('[SSE] Không có base URL');
        this._connecting = false;
        return;
      }

      let url = `${baseUrl}/api/v1/sse/stream?ticket=${encodeURIComponent(ticket)}`;
      if (lastId) url += `&last_event_id=${encodeURIComponent(lastId)}`;
      console.log('[SSE] Connecting to:', url);

      this._eventSource = new EventSource(url);

      this._eventSource.onopen = () => {
        this._connected = true;
        this._connecting = false;
        this._connectedAt = Date.now();
        this._lastHeartbeat = Date.now();
        this._startHeartbeatCheck();
        // Flapping protection: KHÔNG reset retry ngay lập tức.
        // Nếu connection sống >= STABLE_THRESHOLD mới reset → tránh spam reconnect
        // khi server đóng connection ngay sau khi mở (Chrome throttle).
        this._scheduleStableReset();
        console.log('[SSE] Đã kết nối');
        window.eventBus?.emit('sse:connected');
        window.SseBroadcastManager?.broadcastSseStatus('connected');
      };

      this._eventSource.onmessage = (e) => {
        this._lastHeartbeat = Date.now(); // Update heartbeat on any message
        this._handleMessage(e);
      };

      this._eventSource.onerror = (e) => {
        // Log chi tiết hơn để debug
        const state = this._eventSource?.readyState;
        const stateStr = state === 0 ? 'CONNECTING' : state === 1 ? 'OPEN' : state === 2 ? 'CLOSED' : 'UNKNOWN';
        const aliveMs = this._connectedAt ? (Date.now() - this._connectedAt) : 0;
        console.warn(`[SSE] Lỗi kết nối (readyState: ${stateStr}, alive: ${aliveMs}ms), sẽ reconnect...`);

        this._connected = false;
        this._connecting = false;
        this._stopHeartbeatCheck();
        this._clearStableReset(); // Cancel pending reset (connection ngắt trước threshold)
        window.eventBus?.emit('sse:disconnected');
        window.SseBroadcastManager?.broadcastSseStatus('disconnected');
        this._closeEventSource();
        this._scheduleReconnect();
      };
    } catch (err) {
      console.warn('[SSE] Không thể kết nối:', err.message);
      this._connecting = false;
      this._scheduleReconnect();
    }
  }

  /**
   * Chỉ reset retry counter khi connection ổn định >= STABLE_THRESHOLD.
   * Nếu connection ngắt trước → giữ retry count → backoff tăng dần.
   */
  static _scheduleStableReset() {
    if (this._stableResetTimer) clearTimeout(this._stableResetTimer);
    this._stableResetTimer = setTimeout(() => {
      this._stableResetTimer = null;
      if (this._connected) {
        const wasRetrying = this._retryCount > 0;
        this._retryCount = 0;
        if (wasRetrying) {
          console.log('[SSE] Connection stable, reset retry counter');
        }
      }
    }, this._STABLE_THRESHOLD);
  }

  static _clearStableReset() {
    if (this._stableResetTimer) {
      clearTimeout(this._stableResetTimer);
      this._stableResetTimer = null;
    }
  }

  /**
   * Schedule reconnect với exponential backoff + jitter
   * Jitter tránh thundering herd khi server restart (tất cả clients reconnect cùng lúc)
   */
  static _scheduleReconnect() {
    if (this._reconnectTimer) return; // Đã có timer

    this._retryCount++;
    if (this._retryCount > this._MAX_RETRIES) {
      console.warn('[SSE] Đã vượt quá ' + this._MAX_RETRIES + ' lần retry liên tiếp, dừng reconnect. Sẽ thử lại khi focus/visibility.');
      window.eventBus?.emit('sse:gave_up');
      return;
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 30s, 30s...
    const baseDelay = Math.min(this._BASE_DELAY * Math.pow(2, this._retryCount - 1), this._MAX_DELAY);
    // Random jitter 0-2s để tránh thundering herd khi server restart
    const jitter = Math.random() * 2000;
    const delay = baseDelay + jitter;
    console.log('[SSE] Reconnect sau ' + (delay / 1000).toFixed(1) + 's (base: ' + (baseDelay / 1000) + 's + jitter: ' + (jitter / 1000).toFixed(1) + 's, retry #' + this._retryCount + ')');

    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Start client-side heartbeat check
   * Nếu không nhận được message/heartbeat trong HEARTBEAT_TIMEOUT → force reconnect
   */
  static _startHeartbeatCheck() {
    this._stopHeartbeatCheck();
    this._heartbeatCheckTimer = setInterval(() => {
      if (!this._connected) return;

      const elapsed = Date.now() - this._lastHeartbeat;
      if (elapsed > this._HEARTBEAT_TIMEOUT) {
        console.warn('[SSE] Heartbeat timeout (' + (elapsed / 1000) + 's), force reconnect...');
        window.eventBus?.emit('sse:heartbeat_timeout');
        this._closeEventSource();
        this._connected = false;
        window.eventBus?.emit('sse:disconnected');
        window.SseBroadcastManager?.broadcastSseStatus('disconnected');
        this._scheduleReconnect();
      }
    }, 10000); // Check mỗi 10s
  }

  /**
   * Stop heartbeat check timer
   */
  static _stopHeartbeatCheck() {
    if (this._heartbeatCheckTimer) {
      clearInterval(this._heartbeatCheckTimer);
      this._heartbeatCheckTimer = null;
    }
  }

  /**
   * Ngắt kết nối SSE — chỉ gọi khi logout hoặc force_logout
   * Gọi API end-session để xóa session Redis ngay lập tức,
   * không đợi server detect connection_aborted (có thể mất 15s+ do BLPOP).
   */
  static disconnect() {
    // Chỉ leader mới cần gọi end-session
    if (!window.SseBroadcastManager?.isInitialized() || window.SseBroadcastManager.isLeader()) {
      // Gọi API end-session để xóa Redis session ngay lập tức
      // Fire-and-forget, không cần chờ response
      this._endSessionOnServer();
    }

    // Destroy BroadcastManager
    window.SseBroadcastManager?.destroy();

    this._closeEventSource();
    this._stopHeartbeatCheck();
    this._clearStableReset();
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    this._connecting = false;
    this._retryCount = 0; // Reset backoff khi disconnect chủ ý
    this._roleListenerSetup = false;
    if (this._connected) {
      this._connected = false;
      console.log('[SSE] Đã ngắt kết nối');
      window.eventBus?.emit('sse:disconnected');
    }
  }

  /**
   * Gọi API end-session để xóa SSE session trên server
   * Fire-and-forget, không block disconnect flow
   *
   * LƯU Ý: AuthManager.logout() đã gọi end-session TRƯỚC khi xóa token,
   * nên method này chủ yếu là backup cho các case khác (force_logout từ server, etc.)
   *
   * CRITICAL: KHÔNG dùng authManager._apiCall() vì nó có auto-retry logic khi gặp 401
   * → retry gọi refreshToken() → fail → emit auth:logout → gọi disconnect() lại → infinite loop!
   * Thay vào đó dùng chrome.runtime.sendMessage trực tiếp.
   */
  static _endSessionOnServer() {
    const token = window.authManager?.token;
    // Nếu không có token, skip - AuthManager.logout() hoặc external logout đã xử lý
    if (!token) {
      console.log('[SSE] Skip _endSessionOnServer: không có token');
      return;
    }

    // Fire-and-forget, dùng chrome.runtime.sendMessage trực tiếp để tránh retry loop
    chrome.runtime.sendMessage({
      action: 'apiRequest',
      method: 'POST',
      endpoint: 'sse/end-session',
      data: null,
      token: token
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Silent fail
        return;
      }
      if (response?.success) {
        console.log('[SSE] end-session backup thành công');
      }
      // Silent fail nếu 401 - đã được xử lý bởi caller
    });
  }

  /**
   * Đóng EventSource mà không emit event
   */
  static _closeEventSource() {
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
    }
  }

  /**
   * Kiểm tra đang kết nối hay không
   * Follower mode: connected qua BroadcastChannel (không có eventSource)
   * Leader mode: connected trực tiếp qua SSE
   */
  static isConnected() {
    // Follower mode: dựa vào _connected flag (nhận events qua BroadcastChannel)
    if (window.SseBroadcastManager?.isInitialized() && !window.SseBroadcastManager.isLeader()) {
      return this._connected;
    }
    // Leader mode hoặc không có BroadcastManager: kiểm tra eventSource
    return this._connected && this._eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Force reconnect — gọi khi user focus hoặc visibility change
   * Reset retry count để thử lại từ đầu
   */
  static forceReconnect() {
    if (this.isConnected()) return;
    if (this._connecting) return;
    if (!window.authManager?.isLoggedIn()) return;

    // Reset backoff để thử ngay
    this._retryCount = 0;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    this._closeEventSource();
    this.connect();
  }

  /**
   * Xử lý message từ SSE
   */
  static _handleMessage(e) {
    // Lưu last event ID
    if (e.lastEventId) {
      this._lastEventId = e.lastEventId;
      chrome.storage.local.set({ af_sse_last_event_id: e.lastEventId });
    }

    // Skip empty data
    if (!e.data || e.data.trim() === '') {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(e.data);
    } catch (err) {
      console.warn('[SSE] Lỗi parse JSON:', err.message, '| Raw:', e.data);
      return;
    }

    const eventName = payload.event || 'unknown';

    // Heartbeat events - chỉ để keep connection alive, không cần xử lý
    if (eventName === 'heartbeat') {
      // _lastHeartbeat đã được update ở onmessage handler
      return;
    }

    console.log('[SSE] Event:', eventName, payload.data);

    // SAFEGUARD: Ignore session_replaced nếu nhận trong 3s đầu sau connect
    // Đây là stale event từ replay queue, không phải session thực sự bị replace
    if (eventName === 'session_replaced') {
      const timeSinceConnect = Date.now() - this._connectedAt;
      if (timeSinceConnect < 3000) {
        console.log('[SSE] Bỏ qua stale session_replaced event (received ' + timeSinceConnect + 'ms sau connect)');
        return;
      }
    }

    // Forward event đến followers qua BroadcastChannel (leader only)
    window.SseBroadcastManager?.forwardSseEvent(eventName, payload.data);

    // Emit event - wrap trong try/catch riêng để lỗi handler không crash SSE
    try {
      window.eventBus?.emit(`sse:${eventName}`, payload.data);
    } catch (err) {
      console.warn('[SSE] Lỗi trong event handler:', eventName, err.message);
    }

    // Handle notification events
    this._handleNotificationEvents(eventName, payload.data);

    // Handle provider config events
    this._handleProviderConfigEvents(eventName, payload.data);

    // Group B (Initiative 1, 2, 3, 4, 6): Handle config events từ admin updates
    this._handleConfigEvents(eventName, payload.data);
  }

  /**
   * Handle provider config SSE events (DOM Resilience Plan)
   * - provider_config_updated: Admin updated selector hoặc provider status
   */
  static _handleProviderConfigEvents(eventName, data) {
    if (eventName === 'provider_config_updated' || eventName === 'config.updated') {
      if (window.ProviderConfigManager) {
        window.ProviderConfigManager.handleSseUpdate(data);
      }
    }
  }

  /**
   * Group B: Handle config events từ admin updates → invalidate extension caches.
   *
   * Wired từ backend admin controllers:
   *   - Initiative 1: provider_models_updated (Admin/ProviderModelController)
   *   - Initiative 2: node_types_updated (Admin/WorkflowNodeTypeController)
   *   - Initiative 3: i18n_updated (Group E sẽ wire — placeholder)
   *   - Initiative 4: validation_rules_updated (Admin/SystemSettingsController)
   *   - Initiative 6: default_settings_updated (Admin/DefaultSettingsController)
   */
  static _handleConfigEvents(eventName, data) {
    try {
      switch (eventName) {
        case 'provider_models_updated':
          // Initiative 1: AI models list changed
          if (window.ModelRegistry) {
            window.ModelRegistry.handleSseUpdate(data);
          }
          break;

        case 'node_types_updated':
          // Initiative 2: Workflow node types changed — invalidate NodeTemplates cache
          console.log('[SseClient] node_types_updated → invalidate NodeTemplates cache + emit node_types:refreshed', data);
          if (window.NodeTemplates) {
            window.NodeTemplates._serverTypes = null;
            window.NodeTemplates._serverTypesFetchedAt = 0;
          }
          window.eventBus?.emit('node_types:refreshed', data);
          break;

        case 'validation_rules_updated':
          // Initiative 4: Global validation rules changed
          if (window.ValidationRules) {
            window.ValidationRules.handleSseUpdate(data);
          }
          break;

        case 'default_settings_updated':
          // Initiative 6: Admin defaults changed — reload server defaults cho StorageSettings
          if (window.storageSettings?._loadServerDefaults) {
            window.storageSettings._loadServerDefaults();
          }
          window.eventBus?.emit('default_settings:refreshed', data);
          break;

        case 'i18n_updated':
          // Initiative 3: Translations changed (Group E sẽ wire dynamic load)
          if (window.I18n?.invalidate && data?.locale) {
            window.I18n.invalidate(data.locale);
            window.I18n.reload?.();
          }
          break;
      }
    } catch (err) {
      console.warn('[SseClient] _handleConfigEvents error:', err.message);
    }
  }

  /**
   * Handle notification-related SSE events
   * - notification.new: New notification received, show overlay if workflow_shared
   * - notification.count_updated: Badge count changed
   * - workflow.share_accepted/rejected/revoked: Share status changes
   */
  static _handleNotificationEvents(eventName, data) {
    try {
      switch (eventName) {
        case 'notification.new':
          // Emit to EventBus for NotificationPanel to update
          window.eventBus?.emit('notification:new', data);

          // Show overlay for workflow_shared notifications
          if (data?.type === 'workflow_shared') {
            window.eventBus?.emit('notification:show_shared_overlay', data);
          }
          break;

        case 'notification.count_updated':
          // Update badge count in NotificationBell
          window.eventBus?.emit('notification:count_updated', data);
          break;

        case 'workflow.share_accepted':
          // Share request was accepted
          window.eventBus?.emit('workflow:share_accepted', data);
          break;

        case 'workflow.share_rejected':
          // Share request was rejected
          window.eventBus?.emit('workflow:share_rejected', data);
          break;

        case 'workflow.share_revoked':
          // Share access was revoked
          window.eventBus?.emit('workflow:share_revoked', data);
          break;
      }
    } catch (err) {
      console.warn('[SSE] Error in notification handler:', eventName, err.message);
    }
  }

  /**
   * Lấy one-time ticket từ backend
   */
  static async _getTicket() {
    try {
      console.log('[SSE] Đang lấy ticket...');
      const resp = await window.authManager?._apiCall('POST', 'sse/ticket');
      if (resp?.ticket) {
        console.log('[SSE] Đã lấy được ticket');
        return resp.ticket;
      }
      console.warn('[SSE] Response không có ticket:', resp);
      return null;
    } catch (err) {
      console.warn('[SSE] Lấy ticket thất bại:', err.message, err);
      // Auth error (401/403) → return special value to stop reconnect
      if (err.httpStatus === 401 || err.httpStatus === 403 || err.code === 'UNAUTHENTICATED') {
        return 'AUTH_ERROR';
      }
      return null;
    }
  }

  /**
   * Lấy base URL từ AuthManager
   * AuthManager lưu apiBaseUrl = 'https://labs.toby.vn/api/v1'
   * SSE cần base URL không có '/api/v1' để build đúng endpoint
   */
  static _getBaseUrl() {
    // Đọc trực tiếp từ authManager (đã init khi connect được gọi)
    const apiBaseUrl = window.authManager?.apiBaseUrl || 'https://labs.toby.vn/api/v1';
    // Strip '/api/v1' suffix để lấy base
    return apiBaseUrl.replace(/\/api\/v\d+$/, '');
  }

  /**
   * Setup listener cho role changes từ BroadcastManager
   * Khi role thay đổi (leader ↔ follower), cần connect/disconnect SSE tương ứng
   */
  static _setupRoleChangeListener() {
    if (this._roleListenerSetup) return;
    this._roleListenerSetup = true;

    // Khi trở thành leader → connect SSE.
    // Bug 29 fix (2026-05-19): Skip nếu đã có EventSource active hoặc đang connecting,
    // tránh duplicate connect khi `became_leader` fire trùng (storage path + BroadcastChannel
    // path race). Backend kill duplicate session bằng `session_replaced` → SSE disconnect cascade.
    window.eventBus?.on('broadcast:became_leader', () => {
      if (this._eventSource || this._connecting) {
        console.log('[SSE] Đã connected/connecting, skip duplicate became_leader trigger');
        return;
      }
      console.log('[SSE] Trở thành leader, kết nối SSE...');
      this._closeEventSource();
      this._connected = false;
      this.connect();
    });

    // Khi trở thành follower → disconnect SSE (nếu có)
    window.eventBus?.on('broadcast:became_follower', () => {
      console.log('[SSE] Trở thành follower, ngắt SSE connection...');
      this._closeEventSource();
      this._connecting = false;
      // Vẫn coi như connected vì nhận events qua BroadcastChannel
      this._connected = true;
      window.eventBus?.emit('sse:connected');
      window.eventBus?.emit('sse:follower_mode');
    });
  }
}

window.SseClient = SseClient;
