/**
 * WorkflowExecutor - Engine thực thi workflows
 * Chạy nodes theo thứ tự topological sort
 */

(function() {
  'use strict';

  const DEBUG = false;

  function log(...args) {
    if (DEBUG) console.log('[WorkflowExecutor]', ...args);
  }

  /**
   * Extract Flow file_name (UUID) from thumbnail URL.
   * Flow URLs contain: getMediaUrlRedirect?name=UUID or ?input={"json":{"name":"UUID"}}
   * BUG FIX 2026-05-11: Khi bridge ChatGPT/Grok → Flow, tileDetails.file_name có thể bị empty
   * → dùng thumbnail URL để extract file_name, tránh reupload sau reload page.
   */
  function extractFileNameFromUrl(url) {
    if (!url || !url.includes('getMediaUrlRedirect')) return '';
    try {
      const urlObj = new URL(url, 'https://aitestkitchen.withgoogle.com');
      // Pattern 1: ?name=UUID (simple)
      const name = urlObj.searchParams.get('name');
      if (name && /^[a-f0-9-]{8,}$/i.test(name)) return name;
      // Pattern 2: tRPC ?input={"json":{"name":"UUID"}}
      const input = urlObj.searchParams.get('input');
      if (input) {
        const parsed = JSON.parse(decodeURIComponent(input));
        const json = parsed?.json || parsed?.['0']?.json || parsed;
        if (json?.name && /^[a-f0-9-]{8,}$/i.test(json.name)) return json.name;
      }
    } catch (e) {}
    return '';
  }

  // Relay key execution events to other extension contexts (popup editor window)
  function broadcastEvent(event, data) {
    try {
      chrome.runtime.sendMessage({
        action: 'workflowExecutionEvent',
        event,
        data: JSON.parse(JSON.stringify(data || {})) // serialize to avoid cloning errors
      }).catch(() => {});
    } catch (e) {}
  }

  // ===== Cross-context running flag (af_running_workflow) =====
  // Heartbeat-based liveness check (thay vì TTL từ started_at):
  //   - Executor đang chạy → pulse heartbeat mỗi 60s (update last_heartbeat_at)
  //   - Reader check: nếu không có heartbeat trong 5 phút → coi context đã chết
  //     (crash/SW hibernate) → auto-clear để un-stuck check tiếp theo.
  // Lý do dùng heartbeat thay TTL cố định: workflow có thể chạy >30 phút (10
  // nodes × 2 phút + retry, mixed providers sequential, v.v.). TTL cố định sẽ
  // clear nhầm flag của workflow đang chạy thật → 2 contexts cùng claim → song song.
  const HEARTBEAT_INTERVAL_MS = 60 * 1000;  // Pulse mỗi 60s
  const HEARTBEAT_TTL_MS = 5 * 60 * 1000;   // Coi stale nếu không heartbeat trong 5 phút

  // Read af_running_workflow, auto-clear nếu heartbeat stale. Returns null nếu free.
  async function readRunningFlag() {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get(['af_running_workflow'], r => resolve(r));
      });
      const flag = data.af_running_workflow;
      if (!flag?.wf_id) return null;
      // Backward compat: flag set bởi version cũ chưa có last_heartbeat_at →
      // fallback dùng started_at với cùng TTL (5 phút). Flag cũ chỉ tồn tại trong
      // session đang chạy upgrade → sẽ tự reset chu kỳ tiếp theo.
      const lastBeat = flag.last_heartbeat_at || flag.started_at;
      if (lastBeat && Date.now() - lastBeat > HEARTBEAT_TTL_MS) {
        try {
          await new Promise(resolve => chrome.storage.local.remove('af_running_workflow', resolve));
        } catch (e) {}
        console.warn('[WorkflowExecutor] Auto-cleared stale af_running_workflow:', flag.wf_id,
          'last heartbeat age(ms):', Date.now() - lastBeat);
        return null;
      }
      return flag;
    } catch (e) {
      return null;
    }
  }

  // Best-effort atomic claim: re-check storage rồi set. chrome.storage không có
  // true compare-and-set, nhưng chuyển check+set vào cùng micro-task scope giúp
  // thu hẹp race window từ ~vài giây xuống ~microseconds (so với set rải rác sau
  // multiple await như cũ).
  async function claimRunningFlag(wfId, wfName, ctx) {
    const existing = await readRunningFlag();
    if (existing?.wf_id) {
      return { ok: false, runningWfName: existing.wf_name || 'Workflow', runningWfId: existing.wf_id };
    }
    const now = Date.now();
    await new Promise(resolve => {
      chrome.storage.local.set({
        af_running_workflow: {
          wf_id: wfId,
          wf_name: wfName || 'Workflow',
          started_at: now,
          last_heartbeat_at: now,
          executor_context: ctx
        }
      }, resolve);
    });
    return { ok: true };
  }

  // Heartbeat pulse: update last_heartbeat_at để các reader biết context vẫn còn sống.
  // Nếu flag bị clear hoặc claim bởi context khác → bỏ qua (tránh stomp).
  async function pulseHeartbeat(wfId) {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get(['af_running_workflow'], r => resolve(r));
      });
      const flag = data.af_running_workflow;
      if (!flag || flag.wf_id !== wfId) return;
      await new Promise(resolve => {
        chrome.storage.local.set({
          af_running_workflow: { ...flag, last_heartbeat_at: Date.now() }
        }, resolve);
      });
    } catch (e) {}
  }

  // Update wf_name sau khi load workflow (claim ban đầu chỉ có wfId)
  async function updateRunningFlagName(wfId, wfName) {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get(['af_running_workflow'], r => resolve(r));
      });
      const flag = data.af_running_workflow;
      if (flag?.wf_id !== wfId) return;
      await new Promise(resolve => {
        chrome.storage.local.set({
          af_running_workflow: { ...flag, wf_name: wfName || flag.wf_name }
        }, resolve);
      });
    } catch (e) {}
  }

  // Clear flag chỉ khi match wf_id (tránh stomping context khác đã claim sau)
  async function clearRunningFlag(wfId) {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get(['af_running_workflow'], r => resolve(r));
      });
      const flag = data.af_running_workflow;
      if (!flag) return;
      // Nếu wfId provided thì chỉ clear khi match. Nếu không provided → unconditional clear (legacy)
      if (wfId && flag.wf_id !== wfId) return;
      await new Promise(resolve => chrome.storage.local.remove('af_running_workflow', resolve));
    } catch (e) {}
  }

  // Update current_node_id trong af_running_workflow (fix: editor mở sau khi workflow chạy không biết node đang run)
  async function updateCurrentNode(wfId, nodeId) {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get(['af_running_workflow'], r => resolve(r));
      });
      const flag = data.af_running_workflow;
      if (!flag || flag.wf_id !== wfId) return;
      await new Promise(resolve => {
        chrome.storage.local.set({
          af_running_workflow: { ...flag, current_node_id: nodeId }
        }, resolve);
      });
    } catch (e) {}
  }

  // Helper: emit execution:log to local eventBus ONLY (không broadcast để tránh duplicate)
  // Broadcast sẽ gây re-emit từ workflow-editor-init.js → log hiển thị 2 lần
  function emitLog(data) {
    window.eventBus.emit('execution:log', data);
  }

  // Helper: emit execution:progress to local eventBus ONLY (không broadcast để tránh duplicate)
  function emitProgress(data) {
    window.eventBus.emit('execution:progress', data);
  }

  class WorkflowExecutor {
    constructor() {
      this.isRunning = false;
      this.shouldStop = false;
      this.currentWorkflow = null;
      this.currentNode = null;
      this._heartbeatTimer = null; // Heartbeat interval handle (Gap 2 fix)
      this.settings = {
        delayBetweenNodes: 3000,
        retryOnFail: true,
        maxRetries: 2,
        retryDelay: 5000,
        // Phase L: Use centralized timeout from SystemConfig with hardcoded fallback
        tileTimeout: window.SystemConfig?.getTimeout('tile_completion_timeout_ms') || 30000,
        timeout: window.SystemConfig?.getTimeout('api_timeout_ms') || 60000,
        stopOnError: false
      };

      // Editor mutex: serialize TOÀN BỘ chuỗi editor operations giữa parallel nodes
      // Flow chỉ có 1 editor → phải serialize: settings → clear → add ref → insert text → submit → wait tile
      // Nếu không: node_02 clear editor XÓA text/ref của node_01 đang chờ submit
      this._submitMutexQueue = Promise.resolve();

      // [API SPAM FIX — Phase 5] Local-first execution buffer
      // Thay vì PATCH node status từng node (N calls), buffer in-memory và flush 1 lần cuối
      this._nodeStateBuffer = new Map(); // nodeId → latest state {status, result_file_ids, ...}
      this._executionInProgress = false;
      // [API SPAM FIX — Phase 5.10] Crash recovery checkpoint
      this._bufferCheckpointTimer = null;
    }

    /**
     * Heartbeat: pulse last_heartbeat_at vào af_running_workflow mỗi 60s.
     * Reader (context khác) dùng để phân biệt workflow đang chạy thật vs context đã chết.
     */
    _startHeartbeat(wfId) {
      this._stopHeartbeat();
      if (!wfId) return;
      this._heartbeatTimer = setInterval(() => {
        pulseHeartbeat(wfId);
      }, HEARTBEAT_INTERVAL_MS);
    }

    _stopHeartbeat() {
      if (this._heartbeatTimer) {
        clearInterval(this._heartbeatTimer);
        this._heartbeatTimer = null;
      }
    }

    /**
     * [API SPAM FIX — Phase 5.10] Crash recovery: persist buffer vào chrome.storage.local mỗi 10s.
     * Nếu browser crash giữa execution → reload → recovery từ checkpoint.
     */
    _startBufferCheckpoint(wfId) {
      this._stopBufferCheckpoint();
      if (!wfId) return;
      this._bufferCheckpointTimer = setInterval(() => {
        this._persistBufferCheckpoint(wfId);
      }, 10000); // 10s checkpoint
    }

    _stopBufferCheckpoint() {
      if (this._bufferCheckpointTimer) {
        clearInterval(this._bufferCheckpointTimer);
        this._bufferCheckpointTimer = null;
      }
    }

    async _persistBufferCheckpoint(wfId) {
      if (this._nodeStateBuffer.size === 0) return;
      try {
        await new Promise(resolve => {
          chrome.storage.local.set({
            [`af_workflow_buffer_${wfId}`]: {
              nodes: Object.fromEntries(this._nodeStateBuffer),
              timestamp: Date.now(),
            }
          }, resolve);
        });
        log('Buffer checkpoint saved:', this._nodeStateBuffer.size, 'nodes');
      } catch (e) {
        console.warn('[WorkflowExecutor] Buffer checkpoint failed:', e);
      }
    }

    async _clearBufferCheckpoint(wfId) {
      if (!wfId) return;
      try {
        await new Promise(resolve => {
          chrome.storage.local.remove([`af_workflow_buffer_${wfId}`], resolve);
        });
      } catch (e) { /* ignore */ }
    }

    /**
     * Acquire editor mutex — serialize toàn bộ editor operations giữa parallel nodes
     * Critical section: apply settings → clear editor → add ref images → insert text → submit → chờ tile placeholder
     * Flow chỉ có 1 prompt editor → parallel nodes PHẢI chờ nhau hoàn thành toàn bộ chuỗi
     */
    _acquireSubmitMutex() {
      let release;
      const acquired = new Promise(resolve => { release = resolve; });
      const prev = this._submitMutexQueue;
      this._submitMutexQueue = prev.then(() => acquired);
      // Chờ promise trước hoàn thành rồi mới return release function
      return prev.then(() => release);
    }

    /**
     * Get generation defaults from user settings (async, reads chrome.storage)
     */
    async _getGenDefaults() {
      if (this._genDefaults) return this._genDefaults;
      // Group C: Model defaults từ ModelRegistry (server-driven, async fetch)
      const _defImg = await (window.ModelRegistry?.getDefaultAsync('flow', 'image')) || 'Nano Banana 2';
      const _defVid = await (window.ModelRegistry?.getDefaultAsync('flow', 'video')) || 'Veo 3.1 - Fast';
      try {
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['af_settings'], r => resolve(r.af_settings || {}));
        });
        this._genDefaults = {
          genType: result.defaultGenType || 'Image',
          ratio: result.defaultRatio || '9:16',
          imageModel: result.defaultImageModel || _defImg,
          videoModel: result.defaultVideoModel || _defVid
        };
      } catch (e) {
        this._genDefaults = {
          genType: 'Image', ratio: 'Dọc',
          imageModel: _defImg, videoModel: _defVid
        };
      }
      return this._genDefaults;
    }

    /**
     * Detect if running inside content script context (has direct DOM functions)
     */
    _isContentScriptContext() {
      return typeof getEditor === 'function' && typeof getSubmitButton === 'function';
    }

    /**
     * Chạy workflow
     */
    async execute(workflowId) {
      if (this.isRunning) {
        log('Already running a workflow');
        return false;
      }

      // Clear cached generation defaults so fresh settings are loaded
      this._genDefaults = null;

      // ExecutionLock: kiểm tra trước khi chạy
      if (window.ExecutionLock && ExecutionLock.isBlockedBy('workflow')) {
        const shouldStop = await ExecutionLock.showBlockedDialog('workflow');
        if (!shouldStop) return false;
        await ExecutionLock.stopCurrent();
      }

      // Gap 1+2 fix: atomic claim cross-context running flag NGAY trước mọi await dài.
      // Cũ: af_running_workflow set ở line ~282 sau load+ExecutionGate (~vài giây) → race
      // 2 contexts cùng pass check rồi cùng chạy.
      const isPopupCtxEarly = window.location?.pathname?.includes('workflow-editor') ||
                              window.location?.pathname?.includes('popup');
      const claim = await claimRunningFlag(workflowId, null, isPopupCtxEarly ? 'popup' : 'sidebar');
      if (!claim.ok) {
        log('Cross-context running flag held by:', claim.runningWfId);
        const err = new Error(`"${claim.runningWfName}" đang chạy ở cửa sổ khác`);
        err.code = 'CROSS_CONTEXT_RUNNING';
        throw err;
      }

      try {
        // Gap 2 fix: start heartbeat NGAY trong try (đảm bảo finally _stopHeartbeat
        // bao phủ mọi exception path). Heartbeat track liveness suốt execute().
        this._startHeartbeat(workflowId);
        this.isRunning = true;
        this.shouldStop = false;
        // Phase 5.2: per-node submitted tracking thay vì global _nodeSubmitted
        this._submittedNodes = new Set();
        this._currentExecutionToken = null;
        // Reset download dedup cho workflow session mới
        this._downloadedTileIds = new Set();
        // Reset submit mutex cho workflow mới (tránh stale promise)
        this._submitMutexQueue = Promise.resolve();
        // [API SPAM FIX — Phase 5] Clear buffer + enable buffering mode
        this._nodeStateBuffer.clear();
        this._executionInProgress = true;
        // [API SPAM FIX — Phase 5.10] Start buffer checkpoint (persist mỗi 10s cho crash recovery)
        this._startBufferCheckpoint(workflowId);

        // Load workflow đầy đủ TRƯỚC ExecutionGate để tính prompt count
        let workflow;
        try {
          workflow = await window.storageManager.getWorkflow(workflowId);
        } catch (loadErr) {
          // Friendly error message for connection errors
          if (loadErr.code === 'CONNECTION_ERROR') {
            throw new Error(loadErr.message || 'Không thể tải workflow do lỗi kết nối');
          }
          throw loadErr;
        }
        if (!workflow) {
          throw new Error('Workflow không tồn tại hoặc đã bị xóa');
        }

        // Ensure nodes/edges are arrays (ApiStorage may not populate them)
        if (!Array.isArray(workflow.nodes)) workflow.nodes = [];
        if (!Array.isArray(workflow.edges)) workflow.edges = [];

        // Option A3: KHÔNG block run legacy workflow over-quota.
        // Backend chỉ enforce trên SAVE (grandfather logic), allow run với legacy count.
        // → Frontend run cũng không block, chỉ log warning để dev biết.
        if (window.featureGate && workflow.nodes.length > 0) {
          try {
            const nodeQuota = window.featureGate.checkQuota('workflows_nodes_max');
            const limit = nodeQuota?.limit;
            if (limit !== 'unlimited' && limit !== '-1' && limit > 0 && workflow.nodes.length > limit) {
              console.info('[WorkflowExecutor] Run legacy workflow over-quota: ' +
                workflow.nodes.length + ' nodes / ' + limit + ' limit. Run vẫn được nhưng không thể thêm node mới.');
            }
          } catch (e) { /* ignore */ }
        }

        this.currentWorkflow = workflow;

        // Acquire ExecutionLock
        if (window.ExecutionLock) ExecutionLock.acquire('workflow', `Workflow: ${workflow.wf_name}`);

        // Activate Flow tab when execution starts
        try {
          chrome.runtime.sendMessage({ action: 'activateFlowTabForExecution' }).catch(() => {});
        } catch (e) {
          log('Error activating Flow tab:', e);
        }

        // GP-7.4: Tính promptCount từ các generate nodes
        // Mỗi node submit 1 lần
        // Server cần biết tổng số lần submit prompt thực tế
        let promptCount = 0;
        // Track per-provider prompt count for usage tracking
        let flowPromptCount = 0;
        let chatgptPromptCount = 0;
        let grokPromptCount = 0;
        if (Array.isArray(workflow.nodes)) {
          for (const node of workflow.nodes) {
            if (node.enabled === false) continue; // Bỏ qua node đã tắt
            if (node.node_type === 'generate') {
              // Generate node: 1 prompt submission (Flow provider)
              promptCount += 1;
              flowPromptCount += 1;
            } else if (node.node_type === 'chatgpt') {
              // ChatGPT node: 1 prompt submission (qua provider ChatGPT).
              promptCount += 1;
              chatgptPromptCount += 1;
            } else if (node.node_type === 'grok') {
              // Phase G-6: Grok node: 1 prompt submission (qua provider Grok)
              promptCount += 1;
              grokPromptCount += 1;
            } else if (node.node_type === 'prompt' && node.enhance) {
              // Phase CG-8: Prompt node enhance ON = 1 prompt submission cho global quota.
              // Enhance OFF = pass-through, KHÔNG tốn prompt quota.
              promptCount += 1;
              flowPromptCount += 1; // Prompt enhance uses Flow/Gemini
            }
            // Các node khác (download, delay, telegram, prompt OFF) không submit prompt
          }
        }
        // Fallback: ít nhất 1 prompt nếu không tìm thấy generate nodes
        if (promptCount === 0) {
          promptCount = 1;
          flowPromptCount = 1;
        }
        // Store for tracking after completion
        this._workflowPromptCounts = { total: promptCount, flow: flowPromptCount, chatgpt: chatgptPromptCount, grok: grokPromptCount };
        log('Calculated prompt count for workflow:', promptCount, '(flow:', flowPromptCount, ', chatgpt:', chatgptPromptCount, ', grok:', grokPromptCount, ')');

        // SP-2.5: ExecutionGate - xin phep server truoc khi chay workflow
        // GP-7.4: Truyền promptCount chính xác thay vì hardcode 1
        if (window.ExecutionGate) {
          try {
            const gate = await ExecutionGate.request('workflow_run', promptCount, { owner: 'workflow', label: workflowId });
            if (!gate.allowed) {
              ExecutionGate.showDeniedDialog(gate, 'Workflow');
              this.isRunning = false;
              if (window.ExecutionLock) ExecutionLock.release('workflow');
              return false;
            }
            this._currentExecutionToken = gate.token;
          } catch (e) {
            if (window.QuotaErrorHandler?.handleIfQuotaError(e, 'Workflow')) {
              console.warn('[WorkflowExecutor] ExecutionGate denied:', e.code || e.reason);
              this.isRunning = false;
              if (window.ExecutionLock) ExecutionLock.release('workflow');
              return false;
            }
            console.error('[WorkflowExecutor] ExecutionGate request failed, proceeding:', e.message);
          }
        }
        log('Starting workflow:', workflow.wf_name);

        // Apply workflow settings
        const wfSettings = workflow.settings_json || {};
        if (wfSettings.delay_between_nodes) this.settings.delayBetweenNodes = wfSettings.delay_between_nodes * 1000;
        if (wfSettings.max_retries !== undefined) this.settings.maxRetries = wfSettings.max_retries;
        if (wfSettings.timeout) this.settings.tileTimeout = wfSettings.timeout * 1000;
        if (wfSettings.stop_on_error !== undefined) this.settings.stopOnError = wfSettings.stop_on_error;
        let parallelExecution = wfSettings.parallel_execution ?? true;

        // Phase CG-8b: Detect mixed providers → force sequential
        // Lý do: Chrome chỉ 1 tab active per window. Mixed providers parallel sẽ tranh
        // tab focus → context menu Flow + Radix menu ChatGPT đều fail.
        const isMixedProviders = this._detectMixedProviders(workflow);
        if (isMixedProviders && parallelExecution) {
          console.log('[WorkflowExecutor] Mixed providers detected → force sequential');
          parallelExecution = false;
          emitLog({
            message: 'Workflow có nhiều provider (Flow + ChatGPT/Gemini) → chạy tuần tự để tránh xung đột tab',
            type: 'warn'
          });
        }
        this._effectiveParallel = parallelExecution;

        // Check retry_on_fail feature - override maxRetries = 0 nếu không có quyền
        try {
          const canUseRetry = window.featureGate?.canUse('retry_on_fail') ?? false;
          if (!canUseRetry) {
            this.settings.maxRetries = 0;
            this.settings.retryOnFail = false;
            log('Retry feature disabled by plan');
          }
        } catch (e) {
          log('Error checking retry feature:', e);
        }

        // Update workflow status
        await this._updateWorkflowStatus('running');

        // Emit start event
        window.eventBus.emit('execution:started', { workflow });
        broadcastEvent('execution:started', { workflow: { wf_id: workflow.wf_id, wf_name: workflow.wf_name } });

        // UA-3.4: Theo doi bat dau workflow
        window.UsageSync?.trackEvent('workflow_start', { workflow_id: workflow.wf_id, node_count: workflow.nodes?.length || 0 });

        // WS-6: af_running_workflow đã được claim ở đầu execute() — chỉ update wf_name
        // sau khi load xong workflow (ban đầu claim với null name vì chưa có data).
        await updateRunningFlagName(workflow.wf_id, workflow.wf_name);

        // Build execution levels (groups of nodes that can run in parallel)
        const executionLevels = this._buildExecutionLevels(workflow.nodes, workflow.edges);
        const executionOrder = executionLevels.flat();

        // Tracker broadcast (cross-window → sidePanel ExecutionTracker)
        // Skip khi pipeline ON — PromptQueue đã gửi pq:trackerUpdate riêng
        if (window.ExecutionLock && !(window.PromptQueue?.isEnabled?.())) {
          ExecutionLock.broadcastTracker({
            owner: 'workflow', label: `Workflow: ${workflow.wf_name}`,
            phase: 'started', current: 0, total: executionOrder.length
          });
        }
        log('Execution order:', executionOrder.map(n => n.node_name));
        // Debug: log chi tiết từng level với node_id và type
        console.log('[WorkflowExecutor] All nodes:', (workflow.nodes || []).map(n =>
          `${n.node_name} (${n.node_type}, id=${n.node_id?.substring(0,8)}, enabled=${n.enabled})`
        ));
        console.log('[WorkflowExecutor] All edges:', (workflow.edges || []).map(e =>
          `${e.source_node_id?.substring(0,8)} → ${e.target_node_id?.substring(0,8)} (${e.source_port || 'default'} → ${e.target_port || 'default'})`
        ));
        console.log('[WorkflowExecutor] Execution levels detail:');
        executionLevels.forEach((level, idx) => {
          console.log(`  Level ${idx}:`, level.map(n => `${n.node_name} (${n.node_type}, id=${n.node_id?.substring(0,8)})`));
        });
        if (parallelExecution) log('Parallel mode enabled, levels:', executionLevels.map(l => l.map(n => n.node_name)));

        // Phase S2.6.3: Batch pre-resolve ref images (scan DOM 1 lần)
        await this._batchPreResolveRefImages(executionOrder);

        // Suppress auto-reload trong suốt workflow execution
        // Workflow submit nodes tuần tự → giữa các nodes queue rỗng
        // nhưng workflow chưa xong → reload sẽ mất tiles → node sau fail
        if (window.PromptQueue?.isEnabled?.()) {
          PromptQueue.getInstance().suppressReload();
        }

        const total = executionOrder.length;
        let completed = 0;

        // Log thứ tự chạy
        const enabledNodes = executionOrder.filter(n => n.enabled !== false);
        emitLog( {
          message: `Workflow "${workflow.wf_name}" - ${enabledNodes.length}/${total} nodes sẽ chạy${parallelExecution ? ' (song song)' : ''}`,
          type: 'info'
        });
        emitLog( {
          message: `Thứ tự: ${enabledNodes.map(n => n.node_name).join(' → ')}`,
          type: 'info'
        });

        // Execute nodes level by level
        for (let levelIdx = 0; levelIdx < executionLevels.length; levelIdx++) {
          if (this.shouldStop) break;

          // Refresh node data từ storage trước mỗi level
          // Đảm bảo ref_file_ids mới nhất từ server
          // (đặc biệt quan trọng khi chạy từ popup editor — in-memory có thể stale)
          // [API SPAM FIX — Phase 5.11] QUAN TRỌNG: Bảo vệ local state khỏi stale server data
          // Vì buffer chưa flush → server có thể trả về status='pending' cho nodes đã completed local
          if (levelIdx > 0) {
            try {
              const freshNodes = await window.storageManager?.getNodes?.(workflow.wf_id);
              if (freshNodes?.length > 0) {
                for (const fn of freshNodes) {
                  const existing = workflow.nodes.find(n => n.node_id === fn.node_id);
                  if (existing) {
                    // Preserve local execution state - server data có thể stale do buffer
                    const preserveEnabled = existing.enabled;
                    const preserveStatus = existing.status;
                    const preserveResultFileIds = existing.result_file_ids;
                    const preserveResultThumbnails = existing.result_thumbnails;
                    const preserveResultFileNames = existing.result_file_names;
                    const preserveResultText = existing.result_text;

                    // Merge fresh data (chủ yếu lấy ref_file_ids mới)
                    Object.assign(existing, fn);

                    // Restore local execution state nếu đã có (tránh server stale overwrite)
                    if (preserveEnabled !== undefined) {
                      existing.enabled = preserveEnabled;
                    }
                    // CRITICAL: Nếu local đã completed/running, giữ nguyên - server chưa biết
                    if (preserveStatus === 'completed' || preserveStatus === 'running') {
                      existing.status = preserveStatus;
                    }
                    // Giữ result data nếu local đã có
                    if (preserveResultFileIds) {
                      existing.result_file_ids = preserveResultFileIds;
                    }
                    if (preserveResultThumbnails) {
                      existing.result_thumbnails = preserveResultThumbnails;
                    }
                    if (preserveResultFileNames) {
                      existing.result_file_names = preserveResultFileNames;
                    }
                    if (preserveResultText) {
                      existing.result_text = preserveResultText;
                    }
                  }
                }
              }
            } catch (e) { /* ignore */ }
          }

          const levelNodes = executionLevels[levelIdx];

          // Per-level sequential check: nếu level có node ChatGPT, Grok hoặc Prompt enhance ON
          // → CHỈ level đó force sequential (ChatGPT/Grok 1 tab/1 editor, không thể parallel cùng tab).
          // Các level khác (toàn Flow nodes) vẫn parallel.
          // CHỈ xét các node ENABLED - disabled nodes không ảnh hưởng execution.
          const levelRequiresSequential = levelNodes.some(n => {
            if (n.enabled === false) return false;
            const t = n.node_type || n.type;
            return t === 'chatgpt' || t === 'grok' || (t === 'prompt' && n.enhance);
          });
          const useParallelThisLevel = parallelExecution && levelNodes.length > 1 && !levelRequiresSequential;

          if (parallelExecution && levelRequiresSequential && levelNodes.length > 1) {
            emitLog({
              message: `Level ${levelIdx + 1}: có node ChatGPT/Grok/Prompt enhance → chạy tuần tự (1 tab/1 editor)`,
              type: 'info'
            });
          }

          if (useParallelThisLevel) {
            // Parallel: run same-level nodes concurrently
            const runnableNodes = levelNodes.filter(n => n.enabled !== false && n.status !== 'completed');
            const skipNodes = levelNodes.filter(n => n.enabled === false || n.status === 'completed');

            // Log skipped nodes
            for (const node of skipNodes) {
              const reason = node.enabled === false ? 'đã tắt' : 'đã hoàn thành';
              emitLog( { nodeId: node.node_id, message: `Bỏ qua (${reason})`, type: 'info' });
              completed++;
              emitProgress( { total, completed, current: node });
            }

            if (runnableNodes.length > 0) {
              emitLog( { message: `--- Level ${levelIdx + 1}: chạy song song ${runnableNodes.length} nodes ---`, type: 'info' });

              // Staggered start: delay 2s giữa mỗi node để tránh race condition khi capture preTileIds
              // Node sau bắt đầu sau node trước đã có thời gian render tiles (processing)
              const STAGGER_DELAY_MS = 2000;
              const nodePromises = [];
              for (let i = 0; i < runnableNodes.length; i++) {
                if (i > 0) await this._sleep(STAGGER_DELAY_MS);
                nodePromises.push(this._executeSingleNode(runnableNodes[i], workflow, completed, total));
              }
              const results = await Promise.allSettled(nodePromises);

              for (let i = 0; i < results.length; i++) {
                completed++;
                emitProgress( { total, completed, current: runnableNodes[i] });
                await this._updateWorkflowProgress(completed, total, runnableNodes[i].node_id);

                if (results[i].status === 'rejected' && this.settings.stopOnError) {
                  this.shouldStop = true;
                  break;
                }
              }
            }
          } else {
            // Sequential: run nodes one by one (current behavior)
            for (const node of levelNodes) {
              if (this.shouldStop) {
                log('Execution stopped by user');
                emitLog( { message: 'Workflow bị dừng bởi người dùng', type: 'warn' });
                break;
              }

              this.currentNode = node;
              updateCurrentNode(workflow.wf_id, node.node_id);

              // Skip disabled node
              if (node.enabled === false) {
                emitLog( { nodeId: node.node_id, message: `Bỏ qua (đã tắt)`, type: 'info' });
                completed++;
                emitProgress( { total, completed, current: node });
                continue;
              }

              // Skip node đã completed (resume mode)
              if (node.status === 'completed') {
                emitLog( { nodeId: node.node_id, message: `Bỏ qua (đã hoàn thành)`, type: 'info' });
                completed++;
                emitProgress( { total, completed, current: node });
                continue;
              }

              try {
                await this._executeSingleNode(node, workflow, completed, total);
              } catch (nodeError) {
                // Node failed - check if we should stop or continue with next nodes
                if (this.settings.stopOnError) {
                  this.shouldStop = true;
                  break;
                }
                // Continue with next node - dependency check will skip nodes that depend on this failed node
                log('Node failed, continuing with next nodes:', node.node_name, nodeError.message);
              }
              completed++;
              emitProgress( { total, completed, current: node });
              // Tracker progress broadcast (cross-window) — skip khi pipeline ON
              if (window.ExecutionLock && !(window.PromptQueue?.isEnabled?.())) {
                ExecutionLock.broadcastTracker({
                  owner: 'workflow', label: `Workflow: ${workflow.wf_name}`,
                  phase: 'prompt_submitting', current: completed, total,
                  promptText: node.node_name
                });
              }
              await this._updateWorkflowProgress(completed, total, node.node_id);
            }
          }

          // Delay between levels
          if (levelIdx < executionLevels.length - 1 && !this.shouldStop) {
            const delaySec = Math.round(this.settings.delayBetweenNodes / 1000);
            emitLog( {
              message: `Chờ ${delaySec}s trước level tiếp theo...`,
              type: 'info'
            });
            await this._sleep(this.settings.delayBetweenNodes);
          }
        }

        // [API SPAM FIX — Phase 5] Flush buffered node states TRƯỚC khi update workflow status
        // 1 PUT workflow_full thay vì N PATCH calls (giảm ~70% API calls)
        await this._flushNodeStateBuffer();

        // Complete workflow
        const finalStatus = this.shouldStop ? 'paused' : 'completed';
        await this._updateWorkflowStatus(finalStatus);
        emitLog( {
          message: finalStatus === 'completed'
            ? `Workflow "${workflow.wf_name}" hoàn thành! (${completed}/${total} nodes)`
            : `Workflow "${workflow.wf_name}" đã dừng (${completed}/${total} nodes)`,
          type: finalStatus === 'completed' ? 'success' : 'warn'
        });

        // SP-2.5: ExecutionGate complete - gọi TRƯỚC khi broadcast events
        // Đảm bảo server xác nhận hoàn thành trước khi các listeners nhận được sự kiện
        if (window.ExecutionGate && this._currentExecutionToken) {
          try {
            await ExecutionGate.complete(this._currentExecutionToken, this.shouldStop ? 'partial' : 'success');
          } catch (err) {
            console.error('[WorkflowExecutor] ExecutionGate.complete failed:', err);
          }
          this._currentExecutionToken = null;
        }

        // Track usage: per-provider quotas + global prompt_submit_max
        if (window.featureGate && this._workflowPromptCounts) {
          const counts = this._workflowPromptCounts;
          // Track per-provider
          if (counts.flow > 0) window.featureGate.recordGenRun();
          if (counts.chatgpt > 0) window.featureGate.recordChatGPTRun(counts.chatgpt);
          if (counts.grok > 0) window.featureGate.recordGrokRun(counts.grok);
          // Track global prompt_submit_max
          if (counts.total > 0) window.featureGate.recordPromptSubmit(counts.total, 'workflow');
          this._workflowPromptCounts = null;
        }

        // Phase CG-8b: Reset ProviderTabLock sau khi workflow xong
        try { window.ProviderTabLock?.reset(); } catch (e) { /* ignore */ }

        // Broadcast events SAU khi server đã xác nhận
        window.eventBus.emit('execution:completed', {
          workflow: this.currentWorkflow,
          stopped: this.shouldStop
        });
        broadcastEvent('execution:completed', { stopped: this.shouldStop });

        // UA-3.4: Theo dõi hoàn thành workflow
        window.UsageSync?.trackEvent('workflow_complete', { workflow_id: workflow.wf_id, success: !this.shouldStop });

        // Emit workflow:complete for NotificationManager (only if not stopped)
        if (!this.shouldStop) {
          window.eventBus.emit('workflow:complete', {
            workflowId: workflow.wf_id,
            workflowName: workflow.wf_name,
            completedCount: completed,
            totalCount: total
          });
        }

        // Tracker broadcast completed (cross-window) — skip khi pipeline ON
        if (window.ExecutionLock && !(window.PromptQueue?.isEnabled?.())) {
          ExecutionLock.broadcastTracker({
            owner: 'workflow', phase: 'completed',
            current: completed, total
          });
        }

        if (!this.shouldStop && typeof notifyCompletion === 'function' && this.currentWorkflow?.wf_name) {
          notifyCompletion('SlncTrZ VM', `Workflow "${this.currentWorkflow.wf_name}" đã hoàn thành!`);
        }

        log('Workflow execution finished');
        return true;

      } catch (error) {
        log('Workflow execution error:', error);
        // [API SPAM FIX — Phase 5] Flush partial state để không mất progress đã có
        try { await this._flushNodeStateBuffer(); } catch (e) { /* ignore flush error */ }
        // SP-2.5: ExecutionGate complete (failed) - gọi TRƯỚC khi broadcast events
        if (window.ExecutionGate && this._currentExecutionToken) {
          try {
            await ExecutionGate.complete(this._currentExecutionToken, 'failed', { error: error.message });
          } catch (err) {
            console.error('[WorkflowExecutor] ExecutionGate.complete failed:', err);
          }
          this._currentExecutionToken = null;
        }
        // Tracker broadcast error (cross-window) — skip khi pipeline ON
        if (window.ExecutionLock && !(window.PromptQueue?.isEnabled?.())) {
          ExecutionLock.broadcastTracker({
            owner: 'workflow', phase: 'error'
          });
        }
        await this._updateWorkflowStatus('error');
        // UA-3.4: Theo dõi workflow thất bại
        window.UsageSync?.trackEvent('workflow_complete', { workflow_id: workflow.wf_id, success: false });
        // Broadcast events SAU khi server đã xác nhận
        window.eventBus.emit('execution:completed', {
          workflow: this.currentWorkflow,
          error
        });
        broadcastEvent('execution:completed', { error: { message: error.message } });
        return false;

      } finally {
        this.isRunning = false;
        this.currentWorkflow = null;
        this.currentNode = null;
        // [API SPAM FIX — Phase 5] Clear buffering mode + buffer (đã flush trước đó)
        this._executionInProgress = false;
        this._nodeStateBuffer.clear();
        // [API SPAM FIX — Phase 5.10] Stop checkpoint + clear storage (đã flush thành công)
        this._stopBufferCheckpoint();
        this._clearBufferCheckpoint(workflowId);
        if (window.ExecutionLock) ExecutionLock.release('workflow');
        // Phase CG-8b: Reset ProviderTabLock (clear tất cả locks + currentActiveTab)
        try { window.ProviderTabLock?.reset(); } catch (e) { /* ignore */ }
        // Unsuppress auto-reload khi workflow kết thúc
        if (window.PromptQueue?.isEnabled?.()) {
          try { PromptQueue.getInstance().unsuppressReload(); } catch (e) {}
        }
        // WS-6: Clear running state for cross-window sync
        // Gap 1 fix: clear chỉ khi match wfId (tránh stomp claim của context khác sau crash recovery)
        // Gap 2 fix: stop heartbeat NGAY trước clear flag (tránh race pulse → re-set flag sau clear)
        this._stopHeartbeat();
        await clearRunningFlag(workflowId);
      }
    }

    /**
     * Chạy 1 node riêng lẻ (manual re-run)
     */
    async executeSingleNode(workflowId, nodeId) {
      if (this.isRunning) {
        throw new Error('Đang có workflow khác đang chạy');
      }

      // Gap 1 fix: atomic claim cross-context flag NGAY (cũ chỉ check, không set
      // → race 2 contexts cùng pass check). Comment cũ ("set our running flag immediately")
      // không khớp với implementation cũ — giờ implement đúng.
      const isPopupCtxEarly = window.location?.pathname?.includes('workflow-editor') ||
                              window.location?.pathname?.includes('popup');
      const claim = await claimRunningFlag(workflowId, null, isPopupCtxEarly ? 'popup' : 'sidebar');
      if (!claim.ok) {
        const err = new Error(`"${claim.runningWfName}" đang chạy ở cửa sổ khác`);
        err.code = 'CROSS_CONTEXT_RUNNING';
        throw err;
      }

      try {
        // Gap 2 fix: start heartbeat trong try (đảm bảo finally _stopHeartbeat bao
        // phủ mọi exception path). Single node thường nhanh nhưng retry/timeout có
        // thể đẩy duration > 5 phút TTL → cần heartbeat.
        this._startHeartbeat(workflowId);
        this.isRunning = true;
        this.shouldStop = false;
        // Phase 5.2: per-node submitted tracking thay vì global _nodeSubmitted
        this._submittedNodes = new Set();
        this._currentExecutionToken = null;

        // Load workflow + node TRƯỚC ExecutionGate để tính prompt count chính xác
        let workflow;
        try {
          workflow = await window.storageManager.getWorkflow(workflowId);
        } catch (loadErr) {
          if (loadErr.code === 'CONNECTION_ERROR') {
            throw new Error(loadErr.message || 'Không thể tải workflow do lỗi kết nối');
          }
          throw loadErr;
        }
        if (!workflow) throw new Error('Workflow không tồn tại hoặc đã bị xóa');

        // Ensure nodes/edges are arrays (ApiStorage may not populate them)
        if (!Array.isArray(workflow.nodes)) workflow.nodes = [];
        if (!Array.isArray(workflow.edges)) workflow.edges = [];

        // Option A3: KHÔNG block single-node run của legacy workflow over-quota.
        // (Logic giống execute() — backend cho phép run, chỉ block save tăng count.)
        if (window.featureGate && workflow.nodes.length > 0) {
          try {
            const nodeQuota = window.featureGate.checkQuota('workflows_nodes_max');
            const limit = nodeQuota?.limit;
            if (limit !== 'unlimited' && limit !== '-1' && limit > 0 && workflow.nodes.length > limit) {
              console.info('[WorkflowExecutor] Single-run legacy workflow over-quota: ' +
                workflow.nodes.length + '/' + limit);
            }
          } catch (e) { /* ignore */ }
        }

        this.currentWorkflow = workflow;
        const node = workflow.nodes.find(n => n.node_id === nodeId);
        if (!node) throw new Error('Node not found');

        // Gap 1 fix: update wf_name vào running flag (claim ban đầu chỉ có wfId)
        await updateRunningFlagName(workflow.wf_id, workflow.wf_name);

        // GP-7.4: Tính promptCount dựa trên node type
        let promptCount = 0;
        if (node.node_type === 'generate') {
          promptCount = 1;
        } else if (node.node_type === 'chatgpt') {
          promptCount = 1;
        } else if (node.node_type === 'grok') {
          // Phase G-6: Grok node single-node run = 1 prompt submission
          promptCount = 1;
        }
        // Các node khác (download, delay, telegram) không submit prompt → promptCount = 0
        // Nhưng vẫn cần tính ít nhất 1 để server track workflow_run quota
        if (promptCount === 0) promptCount = 1;

        // Acquire ExecutionLock
        if (window.ExecutionLock) ExecutionLock.acquire('workflow', '');

        // SP: ExecutionGate - track single node run on server
        // GP-7.4: Truyền promptCount chính xác thay vì hardcode 1
        if (window.ExecutionGate) {
          try {
            const gate = await ExecutionGate.request('workflow_run', promptCount, { owner: 'workflow', label: `single_node:${nodeId}` });
            if (!gate.allowed) {
              ExecutionGate.showDeniedDialog(gate, 'Workflow');
              this.isRunning = false;
              if (window.ExecutionLock) ExecutionLock.release('workflow');
              throw new Error(gate.reason === 'QUOTA_EXCEEDED' ? 'Đã hết lượt chạy Workflow hôm nay' : 'Không được phép chạy Workflow');
            }
            this._currentExecutionToken = gate.token;
            console.log('[WorkflowExecutor] executeSingleNode ExecutionGate token:', gate.token, 'promptCount:', promptCount);
          } catch (e) {
            if (window.QuotaErrorHandler?.isQuotaError(e)) {
              this.isRunning = false;
              if (window.ExecutionLock) ExecutionLock.release('workflow');
              throw e;
            }
            console.warn('[WorkflowExecutor] ExecutionGate request failed, proceeding:', e.message);
          }
        }

        this.currentNode = node;
        updateCurrentNode(workflow.wf_id, node.node_id);
        if (window.ExecutionLock) ExecutionLock.acquire('workflow', `Node: ${node.node_name}`);
        log(`Running single node: "${node.node_name}"`);

        // Tracker broadcast (cross-window) — skip khi pipeline ON
        if (window.ExecutionLock && !(window.PromptQueue?.isEnabled?.())) {
          ExecutionLock.broadcastTracker({
            owner: 'workflow', label: `Node: ${node.node_name}`,
            phase: 'started', current: 0, total: 1,
            promptText: node.prompt?.substring(0, 60) || node.node_name
          });
        }

        // Emit execution:started so UI can toggle play→stop, disable form
        window.eventBus.emit('execution:started', { workflow, singleNode: true });
        broadcastEvent('execution:started', { workflow: { wf_id: workflow.wf_id, wf_name: workflow.wf_name }, singleNode: true });

        // Emit events
        window.eventBus.emit('node:started', { node });
        broadcastEvent('node:started', { node: { node_id: node.node_id, node_name: node.node_name } });
        await this._updateNodeStatus(node.node_id, 'running');

        const result = await this._executeNode(node, workflow);

        // Persist thumbnails + file_names trên node object TRƯỚC khi gọi _updateNodeStatus
        // để có thể forward qua PATCH endpoint (bug fix ChatGPT/Grok synthetic IDs).
        if (result.thumbnails && Object.keys(result.thumbnails).length > 0) {
          node.result_thumbnails = { ...(node.result_thumbnails || {}), ...result.thumbnails };
        }
        if (result.fileNames && Object.keys(result.fileNames).length > 0) {
          node.result_file_names = { ...(node.result_file_names || {}), ...result.fileNames };
        }
        await this._updateNodeStatus(node.node_id, 'completed', result.fileIds, null, {
          result_thumbnails: node.result_thumbnails,
          result_file_names: node.result_file_names,
          // Dual URL — provider URL gốc cho manual download chất lượng 100%
          result_provider_urls: node.result_provider_urls,
          // Phase CG-8 — Prompt node text output (mọi node khác result_text=undefined → bỏ qua)
          result_text: node.result_text,
          result_source: node.result_source,
        });
        window.eventBus.emit('node:completed', { node, result });
        broadcastEvent('node:completed', { node: { node_id: node.node_id, node_name: node.node_name }, result: { fileIds: result.fileIds, duration: result.duration, thumbnails: result.thumbnails } });

        // Auto-download — CHỈ khi pipeline mode OFF + có quyền auto_download
        // Khi pipeline ON, PromptQueue._onTilesReady() đã xử lý download rồi.
        // Bug fix: ChatGPT/Grok image node TỰ XỬ LÝ download nội bộ (fetch CDN URL trước khi
        // bridge sang Flow vì signature TTL ngắn). Skip outer download để tránh DOUBLE download.
        const isPipelineNode = window.PromptQueue?.isEnabled() &&
          (node.node_type === 'generate');
        const isExternalProviderNode = node.node_type === 'chatgpt' || node.node_type === 'grok';
        const canUseAutoDownload = window.featureGate?.canUse('auto_download') ?? false;
        if (canUseAutoDownload && node.auto_download && result.fileIds?.length > 0 && !isPipelineNode && !isExternalProviderNode) {
          // Video download resolution: 720p/1080p (vs image 1k/2k)
          // Detect Grok video qua grok_mode (Grok không có media_type field)
          const isVideo = node.media_type === 'Video' ||
            (node.node_type === 'grok' && node.grok_mode === 'video');
          const res = isVideo
            ? (node.video_download_resolution || '720p')
            : (node.download_resolution || '1k');
          // Bug fix: truyền workflow name làm subfolder để download theo cấu trúc folder setting
          const taskName = node.download_folder || workflow?.wf_name || this.currentWorkflow?.wf_name || null;
          await this._downloadTiles(result.fileIds, node.prompt || node.node_name, res, result.fileNames, taskName);
        }

        log(`Single node "${node.node_name}" completed`);

        // SP: ExecutionGate complete (success) - gọi TRƯỚC khi broadcast events
        // Đảm bảo server xác nhận hoàn thành trước khi các listeners nhận được sự kiện
        if (window.ExecutionGate && this._currentExecutionToken) {
          try {
            await ExecutionGate.complete(this._currentExecutionToken, 'success');
          } catch (err) {
            console.error('[WorkflowExecutor] ExecutionGate.complete failed:', err);
          }
          this._currentExecutionToken = null;
        }

        // Tracker broadcast completed (cross-window) — skip khi pipeline ON
        if (window.ExecutionLock && !(window.PromptQueue?.isEnabled?.())) {
          ExecutionLock.broadcastTracker({
            owner: 'workflow', phase: 'completed', current: 1, total: 1
          });
        }

        // Emit execution:completed SAU khi server đã xác nhận
        window.eventBus.emit('execution:completed', { workflow, singleNode: true });
        broadcastEvent('execution:completed', { singleNode: true });

        return result;

      } catch (error) {
        log('Single node execution failed:', error);

        // SP: ExecutionGate complete (failed) - gọi TRƯỚC khi broadcast events
        // Rollback quota và đảm bảo server xác nhận trước khi các listeners nhận được sự kiện
        if (window.ExecutionGate && this._currentExecutionToken) {
          try {
            await ExecutionGate.complete(this._currentExecutionToken, 'failed');
          } catch (err) {
            console.error('[WorkflowExecutor] ExecutionGate.complete failed:', err);
          }
          this._currentExecutionToken = null;
        }

        // Tracker broadcast error (cross-window) — skip khi pipeline ON
        if (window.ExecutionLock && !(window.PromptQueue?.isEnabled?.())) {
          ExecutionLock.broadcastTracker({
            owner: 'workflow', phase: 'error'
          });
        }
        if (this.currentNode) {
          await this._updateNodeStatus(this.currentNode.node_id, 'failed', null, error.message);
          window.eventBus.emit('node:failed', { node: this.currentNode, error });
          broadcastEvent('node:failed', { node: { node_id: this.currentNode.node_id, node_name: this.currentNode.node_name }, error: { message: error.message } });
        }
        // Emit execution:completed with error SAU khi server đã xác nhận
        window.eventBus.emit('execution:completed', {
          workflow: this.currentWorkflow,
          singleNode: true,
          error
        });
        broadcastEvent('execution:completed', { singleNode: true, error: { message: error.message } });

        throw error;

      } finally {
        this.isRunning = false;
        this.currentWorkflow = null;
        this.currentNode = null;
        if (window.ExecutionLock) ExecutionLock.release('workflow');
        // Gap 1 fix: clear cross-context flag (executeSingleNode trước đây không clear → flag stuck)
        // Gap 2 fix: stop heartbeat trước khi clear flag
        this._stopHeartbeat();
        await clearRunningFlag(workflowId);
      }
    }

    /**
     * Dừng workflow đang chạy
     * @param {boolean} broadcast - Broadcast stop event to other contexts (default: true)
     */
    stop(broadcast = true) {
      if (this.isRunning) {
        log('Stopping workflow...');
        this.shouldStop = true;

        // SP-2.8: ExecutionGate cancel on workflow stop
        if (window.ExecutionGate && this._currentExecutionToken) {
          ExecutionGate.cancel(this._currentExecutionToken);
          this._currentExecutionToken = null;
        }

        // Pipeline mode: stop jobs by owner 'workflow'
        if (window.PromptQueue && PromptQueue.isEnabled()) {
          const queue = PromptQueue.getInstance();
          const wfJobs = queue.getJobsByOwner('workflow') || [];
          for (const job of wfJobs) {
            queue.stopJob(job.id);
          }
        }

        // Phase 5.2: Check per-node submitted tracking
        const hasSubmittedNodes = this._submittedNodes && this._submittedNodes.size > 0;
        if (hasSubmittedNodes) {
          // Đã có node submit prompt → chờ tile xong rồi dừng
          // KHÔNG gửi stopExecution để content.js waitForNewTiles tiếp tục chờ tile
          log(`${this._submittedNodes.size} node(s) đã submit, sẽ chờ kết quả trước khi dừng...`);
        } else {
          // Chưa submit → dừng ngay
          log('Chưa có node nào submit, dừng ngay...');
          // Gửi stopExecution để break content.js runAutoPrompt/insertText
          if (window.MessageBridge) {
            window.MessageBridge.stopExecution().catch(() => {});
          }
        }

        // Abort Grok session nếu đang chạy
        if (window.GrokSession?.getTabInfo) {
          const grokInfo = window.GrokSession.getTabInfo();
          if (grokInfo?.tabId) {
            window.MessageBridge?.grokAbort(grokInfo.tabId).catch(() => {});
          }
        }

        // Abort ChatGPT session nếu đang chạy
        if (window.ChatGPTSession?.getTabInfo) {
          const chatgptInfo = window.ChatGPTSession.getTabInfo();
          if (chatgptInfo?.tabId) {
            window.MessageBridge?.chatgptAbort(chatgptInfo.tabId).catch(() => {});
          }
        }

        // Broadcast stop to other contexts (popup ↔ sidePanel)
        if (broadcast) {
          broadcastEvent('execution:stop', { wf_id: this.currentWorkflow?.wf_id });
        }
      }
    }

    /**
     * Handle stop broadcast from other context
     * Called when another context (popup/sidebar) stops the workflow
     */
    handleRemoteStop() {
      if (this.isRunning || this._runningOtherWfId) {
        log('Remote stop received, stopping local execution...');
        this.shouldStop = true;
        // CRITICAL FIX: Chỉ clear state cho remote workflow (chạy ở context khác)
        // Nếu local đang chạy (isRunning=true), để main execute() loop tự cleanup
        // Trước fix: clear currentWorkflow ngay → _updateWorkflowStatus skip → server không update status
        if (this._runningOtherWfId && !this.isRunning) {
          this._runningOtherWfId = null;
          this.currentWorkflow = null;
          // Clear af_running_workflow if we're the one who set it
          try {
            chrome.storage.local.remove('af_running_workflow');
          } catch (e) {}
        }
        // Nếu local đang chạy, chỉ set shouldStop - finally block sẽ cleanup
      }
    }

    /**
     * Reset workflow - đưa tất cả nodes về pending
     */
    async reset(workflowId) {
      log('Resetting workflow:', workflowId);
      await window.storageManager.resetWorkflow(workflowId);
      // Gap 8 fix: reset() từ caller (vd WorkflowTab "Chạy lại") trước đây không clear
      // af_running_workflow → nếu flag stuck (vd context cũ crash) thì reset xong vẫn
      // không thể chạy lại. Clear unconditional vì user đã consent reset.
      await clearRunningFlag(workflowId);
      window.eventBus.emit('workflow:reset', { workflowId });
      // Broadcast to other contexts (popup ↔ sidePanel sync)
      broadcastEvent('workflow:reset', { workflowId });
    }

    /**
     * Execute a single node with full error handling and events
     */
    async _executeSingleNode(node, workflow, completed, total) {
      this.currentNode = node;

      // Check dependencies
      const depCheck = this._checkDependencies(node, workflow.nodes, workflow.edges);
      if (!depCheck.ok) {
        log('Skipping node (dependency failed):', node.node_name, depCheck.reason);
        // Thêm emitLog để user thấy node bị skip do dependency fail
        emitLog({
          nodeId: node.node_id,
          message: `Bỏ qua "${node.node_name}" (dependency lỗi: ${depCheck.reason})`,
          type: 'warn'
        });
        await this._updateNodeStatus(node.node_id, 'skipped');
        window.eventBus.emit('node:warning', { node, message: depCheck.reason });
        return;
      }

      try {
        emitLog( {
          nodeId: node.node_id,
          message: `--- Bắt đầu node [${completed + 1}/${total}]: "${node.node_name}" ---`,
          type: 'info'
        });
        window.eventBus.emit('node:started', { node });
        broadcastEvent('node:started', { node: { node_id: node.node_id, node_name: node.node_name } });
        await this._updateNodeStatus(node.node_id, 'running');

        const result = await this._executeNode(node, workflow);

        // Persist thumbnails + file_names trên node object TRƯỚC khi gọi _updateNodeStatus
        // để forward qua PATCH endpoint. Bug fix ChatGPT/Grok image node: synthetic IDs
        // (cg_xxx, grok_xxx) không có thumbnail trong DOM Flow → reload workflow gallery trống.
        // Đồng thời downstream nodes (download, upscale) cần local data cho _buildFileNameLookup.
        if (result.thumbnails && Object.keys(result.thumbnails).length > 0) {
          node.result_thumbnails = { ...(node.result_thumbnails || {}), ...result.thumbnails };
        }
        if (result.fileNames && Object.keys(result.fileNames).length > 0) {
          node.result_file_names = { ...(node.result_file_names || {}), ...result.fileNames };
        }
        await this._updateNodeStatus(node.node_id, 'completed', result.fileIds, null, {
          result_thumbnails: node.result_thumbnails,
          result_file_names: node.result_file_names,
          // Dual URL — provider URL gốc cho manual download chất lượng 100%
          result_provider_urls: node.result_provider_urls,
          // Phase CG-8 — Prompt node text output
          result_text: node.result_text,
          result_source: node.result_source,
        });
        window.eventBus.emit('node:completed', { node, result });
        broadcastEvent('node:completed', { node: { node_id: node.node_id, node_name: node.node_name }, result: { fileIds: result.fileIds, duration: result.duration, thumbnails: result.thumbnails } });

        // SS-Phase G (Layer 3 fix): Emit prompt:completed cho prompt-producing nodes →
        // GenerationHistory.saveRecord() lưu row với provider chính xác. Trước fix workflow
        // KHÔNG save history → analytics group by provider thiếu data từ workflow path.
        const promptProducingTypes = ['generate', 'chatgpt', 'grok'];
        if (promptProducingTypes.includes(node.node_type) && (result.fileIds?.length > 0)) {
          const nodeProvider = node.node_type === 'chatgpt' ? 'chatgpt'
            : node.node_type === 'grok' ? 'grok'
            : 'flow';
          const isVideoNode = node.media_type === 'Video' ||
            (node.node_type === 'grok' && node.grok_mode === 'video');
          const wfThumbs = (result.fileIds || []).map(fid => {
            const t = result.thumbnails?.[fid];
            if (!t) return null;
            return {
              thumbnail: typeof t === 'string' ? t : t.thumbnail,
              type: typeof t === 'object' && t.type ? t.type : (isVideoNode ? 'video' : 'image'),
              file_name: typeof t === 'object' ? (t.file_name || '') : '',
            };
          }).filter(Boolean);
          window.eventBus.emit('prompt:completed', {
            prompt: node.prompt || '',
            media_type: isVideoNode ? 'Video' : (node.media_type || 'image'),
            model: node.model || nodeProvider,
            ratio: node.ratio || '',
            // Phase Analytics-3: Mỗi workflow node = 1 prompt × node.quantity ảnh
            prompt_count: 1,
            quantity: parseInt(node.quantity) || 1,
            ref_file_ids: node.ref_file_ids || '',
            result_file_ids: (result.fileIds || []).join(', '),
            result_thumbnails: wfThumbs,
            result_file_names: result.fileNames || node.result_file_names || {},
            source: 'workflow',
            source_id: workflow?.wf_id || '',
            provider: nodeProvider,
            project_id: workflow?.project_id || null,
            auto_download: !!node.auto_download,
          });
        }

        emitLog( {
          nodeId: node.node_id,
          message: `"${node.node_name}" hoàn thành - ${result.fileIds?.length || 0} file, ${Math.round(result.duration / 1000)}s`,
          type: 'success'
        });

        // Auto-download — CHỈ khi pipeline mode OFF + có quyền auto_download
        // Khi pipeline ON, PromptQueue._onTilesReady() đã xử lý download rồi.
        // Bug fix: ChatGPT/Grok image node tự xử lý download nội bộ → skip outer để tránh DOUBLE.
        const isPipelineNode = window.PromptQueue?.isEnabled() &&
          (node.node_type === 'generate');
        const isExternalProviderNode = node.node_type === 'chatgpt' || node.node_type === 'grok';
        const canUseAutoDownload = window.featureGate?.canUse('auto_download') ?? false;
        if (canUseAutoDownload && node.auto_download && result.fileIds?.length > 0 && !isPipelineNode && !isExternalProviderNode) {
          // Video download resolution: 720p/1080p (vs image 1k/2k)
          // Grok không có media_type → check grok_mode
          const isVideo = node.media_type === 'Video' ||
            (node.node_type === 'grok' && node.grok_mode === 'video');
          const res = isVideo
            ? (node.video_download_resolution || '720p')
            : (node.download_resolution || '1k');
          // Bug fix: truyền workflow name làm subfolder để download theo cấu trúc folder setting
          const taskName = node.download_folder || workflow?.wf_name || this.currentWorkflow?.wf_name || null;
          emitLog( { nodeId: node.node_id, message: `Tải ${result.fileIds.length} file [${res.toUpperCase()}]...`, type: 'info' });
          await this._downloadTiles(result.fileIds, node.prompt || node.node_name, res, result.fileNames, taskName);
        }
      } catch (error) {
        log('Node failed:', node.node_name, error);
        await this._updateNodeStatus(node.node_id, 'failed', null, error.message);
        window.eventBus.emit('node:failed', { node, error });
        broadcastEvent('node:failed', { node: { node_id: node.node_id, node_name: node.node_name }, error: { message: error.message } });
        emitLog( {
          nodeId: node.node_id,
          message: `"${node.node_name}" thất bại: ${error.message}`,
          type: 'error'
        });

        if (this.settings.stopOnError) {
          emitLog( { message: 'Dừng workflow do cài đặt "Dừng khi lỗi"', type: 'error' });
          this.shouldStop = true;
        }
        throw error;
      }
    }

    /**
     * Phase S2.6.3: Batch pre-resolve ref images cho tất cả nodes
     * Scan DOM 1 lần để resolve file_name/thumbnail_url → tile_id
     */
    async _batchPreResolveRefImages(nodes) {
      if (!window.TileResolver || !nodes || nodes.length === 0) return;

      // Collect all images cần resolve từ tất cả nodes
      const imagesToResolve = [];
      const seenKeys = new Set();

      for (const node of nodes) {
        if (!node.ref_file_ids) continue;

        const refIds = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
        const thumbMap = node.ref_thumbnails || {};
        const fnMap = node.result_file_names || {};

        for (const fileId of refIds) {
          if (fileId.startsWith('upload_')) continue;  // Skip pending uploads
          if (seenKeys.has(fileId)) continue;
          seenKeys.add(fileId);

          const fileName = fnMap[fileId] || null;
          const thumbnailUrl = thumbMap[fileId] || null;

          if (fileName || thumbnailUrl) {
            imagesToResolve.push({
              id: fileId,
              file_name: fileName,
              thumbnail_url: thumbnailUrl
            });
          }
        }
      }

      if (imagesToResolve.length === 0) return;

      log(`[S2.6.3] Batch pre-resolving ${imagesToResolve.length} ref images...`);

      // Use TileResolver.batchResolve
      const { results, unresolved } = window.TileResolver.batchResolve(imagesToResolve);

      // Handle unresolved - try lazy load + retry
      if (unresolved.length > 0 && window.MessageBridge) {
        log(`[S2.6.3] ${unresolved.length} images unresolved, triggering lazy load...`);
        try {
          await window.MessageBridge.ensureFlowTilesLoaded();
          window.TileCache?.clearFailed();
          const retry = window.TileResolver.batchResolve(unresolved);
          for (const [id, tileId] of retry.results) {
            results.set(id, tileId);
          }
        } catch (e) {
          log('[S2.6.3] Lazy load failed:', e.message);
        }
      }

      // Update node.ref_file_ids với corrected IDs
      if (results.size > 0) {
        for (const node of nodes) {
          if (!node.ref_file_ids) continue;

          const refIds = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          let changed = false;

          const correctedIds = refIds.map(id => {
            if (results.has(id)) {
              changed = true;
              return results.get(id);
            }
            return id;
          });

          if (changed) {
            node.ref_file_ids = correctedIds.join(', ');
            log(`[S2.6.3] Node "${node.node_name}" ref_file_ids updated`);
          }
        }
      }

      log(`[S2.6.3] Batch pre-resolve complete: ${results.size} resolved`);
    }

    /**
     * Phase CG-8b: Detect xem workflow có mixed providers không
     * (Flow + ChatGPT, Flow + Gemini, hoặc cả 3).
     * Nếu có → force sequential để tránh xung đột tab activation.
     * CHỈ xét các node ENABLED - disabled nodes không ảnh hưởng execution.
     */
    _detectMixedProviders(workflow) {
      const providers = new Set();
      for (const node of (workflow?.nodes || [])) {
        if (node.enabled === false) continue;
        const t = node.node_type || node.type;
        if (!t) continue;
        if (['generate', 'download', 'image', 'telegram', 'delay'].includes(t)) {
          providers.add('flow');
        } else if (t === 'chatgpt') {
          providers.add('chatgpt');
        } else if (t === 'grok') {
          providers.add('grok');
        } else if (t === 'prompt' && node.enhance) {
          providers.add(node.provider || 'chatgpt');
        }
      }
      return providers.size > 1;
    }

    /**
     * Phase CG-8b: Acquire ProviderTabLock cho node theo type. Trả release function
     * (hoặc null nếu không cần lock — vd: note node, hoặc PromptQueue đang OFF).
     */
    async _acquireLockForNodeType(node) {
      const t = node.node_type || node.type;
      if (!t || t === 'note') return null;

      let provider = null;
      if (['generate', 'download', 'image', 'telegram', 'delay'].includes(t)) {
        provider = 'flow';
      } else if (t === 'chatgpt') {
        provider = 'chatgpt';
      } else if (t === 'grok') {
        provider = 'grok';
      } else if (t === 'prompt' && node.enhance) {
        provider = node.provider || 'chatgpt';
      }
      if (!provider) return null;

      // Image/delay không thực sự tương tác DOM tab Flow nhưng vẫn giữ lock 'flow'
      // để serialize với generate/upscale (đảm bảo upstream correctFileIds chạy đúng tab).

      if (!window.ProviderTabLock) return null; // graceful fallback nếu chưa load

      try {
        return await window.ProviderTabLock.acquire(provider, `node ${node.node_name || node.node_id}`);
      } catch (err) {
        console.warn('[WorkflowExecutor] ProviderTabLock.acquire failed:', err.message);
        return null;
      }
    }

    /**
     * Build execution levels - groups of nodes that can run in parallel
     * Level 0: nodes with no dependencies
     * Level N: nodes whose ALL dependencies are in levels 0..N-1
     */
    _buildExecutionLevels(nodes, edges) {
      if (!nodes || nodes.length === 0) return [];

      const inDegree = new Map();
      const adjacency = new Map();

      for (const node of nodes) {
        inDegree.set(node.node_id, 0);
        adjacency.set(node.node_id, []);
      }

      for (const edge of edges || []) {
        if (adjacency.has(edge.source_node_id)) {
          adjacency.get(edge.source_node_id).push(edge.target_node_id);
          inDegree.set(edge.target_node_id, (inDegree.get(edge.target_node_id) || 0) + 1);
        }
      }

      const levels = [];
      let remaining = new Set(nodes.map(n => n.node_id));

      while (remaining.size > 0) {
        // Current level: nodes whose all dependencies are resolved
        const currentLevel = [];
        for (const nodeId of remaining) {
          if (inDegree.get(nodeId) === 0) {
            const node = nodes.find(n => n.node_id === nodeId);
            if (node) currentLevel.push(node);
          }
        }

        if (currentLevel.length === 0) {
          log('Warning: Cycle detected in workflow graph');
          break;
        }

        // Sort nodes within level by canvas position (left-to-right, top-to-bottom)
        // để execution order deterministic và predictable theo visual flow
        currentLevel.sort((a, b) => {
          const ax = a.pos_x ?? a.position?.x ?? 0;
          const bx = b.pos_x ?? b.position?.x ?? 0;
          if (ax !== bx) return ax - bx;
          const ay = a.pos_y ?? a.position?.y ?? 0;
          const by = b.pos_y ?? b.position?.y ?? 0;
          return ay - by;
        });

        levels.push(currentLevel);

        // Remove current level nodes and update in-degrees
        for (const node of currentLevel) {
          remaining.delete(node.node_id);
          for (const neighborId of (adjacency.get(node.node_id) || [])) {
            inDegree.set(neighborId, (inDegree.get(neighborId) || 1) - 1);
          }
        }
      }

      return levels;
    }

    /**
     * Topological Sort - Kahn's Algorithm (flat order)
     */
    _buildExecutionOrder(nodes, edges) {
      if (!nodes || nodes.length === 0) return [];

      const inDegree = new Map();
      const adjacency = new Map();

      // Khởi tạo
      for (const node of nodes) {
        inDegree.set(node.node_id, 0);
        adjacency.set(node.node_id, []);
      }

      // Build graph từ edges
      for (const edge of edges || []) {
        if (adjacency.has(edge.source_node_id)) {
          adjacency.get(edge.source_node_id).push(edge.target_node_id);
          inDegree.set(
            edge.target_node_id,
            (inDegree.get(edge.target_node_id) || 0) + 1
          );
        }
      }

      // Queue các nodes không có dependency (in-degree = 0)
      const queue = [];
      for (const node of nodes) {
        if (inDegree.get(node.node_id) === 0) {
          queue.push(node);
        }
      }

      // Process queue
      const result = [];
      while (queue.length > 0) {
        const current = queue.shift();
        result.push(current);

        const neighbors = adjacency.get(current.node_id) || [];
        for (const neighborId of neighbors) {
          const newDegree = inDegree.get(neighborId) - 1;
          inDegree.set(neighborId, newDegree);

          if (newDegree === 0) {
            const neighborNode = nodes.find(n => n.node_id === neighborId);
            if (neighborNode) {
              queue.push(neighborNode);
            }
          }
        }
      }

      // Nếu có cycle, result.length < nodes.length
      if (result.length < nodes.length) {
        log('Warning: Cycle detected in workflow graph');
      }

      return result;
    }

    /**
     * Kiểm tra dependencies của node
     * Video+Frames: phải đủ cả 2 frame sources mới chạy
     */
    _checkDependencies(node, nodes, edges) {
      // Guard: return ok if nodes undefined
      if (!nodes || !Array.isArray(nodes)) return { ok: true };

      // Check edge-based dependencies
      const inputEdges = (edges || []).filter(e => e.target_node_id === node.node_id);

      for (const edge of inputEdges) {
        const sourceNode = nodes.find(n => n.node_id === edge.source_node_id);
        if (!sourceNode) continue;

        // Bug fix: Nếu source node disabled → bỏ qua edge đó, không fail toàn bộ.
        // Node downstream vẫn có thể chạy với các inputs khác (vd: Grok output → Flow,
        // dù Prompt ChatGPT → Flow bị disabled). Chỉ skip node nếu TẤT CẢ sources disabled.
        if (sourceNode.enabled === false) {
          continue; // Skip edge từ disabled node
        }
        if (sourceNode.status === 'failed' || sourceNode.status === 'skipped') {
          continue; // Skip edge từ failed/skipped node
        }
        if (sourceNode.status !== 'completed') {
          return { ok: false, reason: `Node nguồn "${sourceNode.node_name}" chưa hoàn thành` };
        }
        // Bug fix: Prompt node KHÔNG tạo result_file_ids (chỉ result_text/node.prompt khi Plain).
        // Trước: skip Grok/ChatGPT vì check result_file_ids rỗng → Grok bao giờ chạy được khi chỉ có Prompt upstream.
        // Giờ: detect output type theo node_type — Prompt validate result_text/prompt, others validate result_file_ids.
        // Bug fix #2: Cho phép fallback về node.prompt cho MỌI trường hợp (cả enhance=ON).
        // Trước: chỉ check node.prompt khi enhance=false → upstream enhance=true mà chưa execute fail validation sớm.
        if (sourceNode.node_type === 'prompt') {
          const hasText = (sourceNode.result_text && sourceNode.result_text.trim()) ||
            (sourceNode.prompt && sourceNode.prompt.trim());
          if (!hasText) {
            return { ok: false, reason: `Node nguồn "${sourceNode.node_name}" không có text output` };
          }
        } else if (!['delay', 'note'].includes(sourceNode.node_type)) {
          // Validate source node actually has output data (file-based outputs)
          if (!sourceNode.result_file_ids || sourceNode.result_file_ids.trim() === '') {
            return { ok: false, reason: `Node nguồn "${sourceNode.node_name}" không có file kết quả` };
          }
        }
      }

      // Video+Frames: check frame source nodes are completed with data
      if (node.media_type === 'Video' && node.video_input_type === 'Frames') {
        const frameSources = [
          { source: node.frame_1_source, fileId: node.frame_1_file_id, label: 'Frame 1' },
          { source: node.frame_2_source, fileId: node.frame_2_file_id, label: 'Frame 2' }
        ];

        for (const frame of frameSources) {
          if (!frame.source || frame.source === '') continue;

          if (frame.source === 'manual') {
            if (!frame.fileId) {
              return { ok: false, reason: `${frame.label} chưa chọn ảnh` };
            }
          } else {
            const sourceNode = nodes.find(n => n.node_id === frame.source);
            if (!sourceNode) {
              return { ok: false, reason: `${frame.label}: node nguồn không tồn tại` };
            }
            if (sourceNode.status !== 'completed') {
              return { ok: false, reason: `${frame.label}: node "${sourceNode.node_name}" chưa hoàn thành` };
            }
            if (!sourceNode.result_file_ids || sourceNode.result_file_ids.trim() === '') {
              return { ok: false, reason: `${frame.label}: node "${sourceNode.node_name}" không có file kết quả` };
            }
          }
        }
      }

      // Delay, download, note, telegram, prompt: không cần check node.prompt
      // (prompt node chính nó đã có text trong .prompt textbox; downstream được port-text override)
      if (['delay', 'download', 'note', 'image', 'telegram', 'prompt'].includes(node.node_type)) {
        return { ok: true, reason: null };
      }

      // Bug fix: cho phép node.prompt rỗng nếu có upstream Prompt node qua port `text`
      // (runtime sẽ override node.prompt từ result_text/prompt của Prompt upstream).
      const hasPromptUpstream = inputEdges.some((e) => {
        if (e.target_port && e.target_port !== 'text' && e.target_port !== 'default') return false;
        const src = nodes.find((n) => n.node_id === e.source_node_id);
        return src?.node_type === 'prompt';
      });

      // Validate node itself has prompt (skip nếu có Prompt upstream)
      if (!node.prompt || node.prompt.trim() === '') {
        if (!hasPromptUpstream) {
          return { ok: false, reason: `Node "${node.node_name}" chưa có prompt` };
        }
      }

      return { ok: true, reason: null };
    }

    /**
     * Collect input file IDs từ nodes trước
     */
    /**
     * Collect input file IDs cho node.
     *
     * Video+Frames: Trả về {frame1: fileId, frame2: fileId} - THỨ TỰ QUAN TRỌNG
     * Các loại khác: Trả về mảng fileIds gộp từ edges + ref
     */
    /**
     * Correct stale tile IDs trên upstream nodes (result_file_ids từ node trước).
     * Khi Flow reload, result_file_ids của node đã chạy xong trở thành stale.
     * Cần correct trước khi _collectInputFileIds lấy chúng.
     */
    /**
     * Recovery: re-upload missing ChatGPT/Grok tiles từ provider URL.
     * Khi bridge fail tạo synthetic tile (chatgpt_xxx / grok_xxx) hoặc tile thật
     * bị mất khỏi Flow canvas (user reload Flow tab), lookup result_provider_urls,
     * fetch URL gốc qua provider tab session → upload lại sang Flow → tile_id mới.
     *
     * Skip cases (return false không recover):
     * - Không có result_provider_urls
     * - MessageBridge undefined
     * - Tile DOM check fail (assume present để tránh false positive)
     * - Video tile (Flow không support upload video)
     * - Provider URL hết hạn (fetch fail)
     * - Provider tab đã đóng
     *
     * Khi recover thành công: update sourceNode.result_file_ids/thumbnails/file_names/provider_urls
     * với tile_id mới. Trả true để caller biết.
     */
    async _recoverProviderTiles(sourceNode, emitLog) {
      if (!sourceNode?.result_provider_urls) {
        emitLog(`[Recovery] Skip: no result_provider_urls for node ${sourceNode?.node_id?.substring(0, 16) || 'unknown'}`);
        emitLog(`[Recovery] sourceNode keys: ${Object.keys(sourceNode || {}).filter(k => k.startsWith('result_')).join(', ') || '(no result_* keys)'}`);
        return false;
      }
      if (!window.MessageBridge) {
        emitLog(`[Recovery] Skip: no MessageBridge`);
        return false;
      }

      const ids = (sourceNode.result_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        emitLog(`[Recovery] Skip: no result_file_ids`);
        return false;
      }

      emitLog(`[Recovery] Checking ${ids.length} tile(s): ${ids.map(id => id.substring(0, 16)).join(', ')}`);
      emitLog(`[Recovery] provider_urls keys: ${Object.keys(sourceNode.result_provider_urls || {}).map(k => k.substring(0, 16)).join(', ')}`);

      // Check tile DOM existence — chỉ recover những tile thực sự missing
      let missing = [];
      try {
        const check = await window.MessageBridge.checkTilesExist(ids);
        emitLog(`[Recovery] checkTilesExist result: existing=${check?.existing?.length || 0}, missing=${check?.missing?.length || 0}`);
        missing = check?.missing || [];
      } catch (e) {
        // Check fail → assume all present (safer than false positive triggering re-upload spam)
        emitLog(`[Recovery] checkTilesExist fail: ${e.message} — skip recovery`, 'warn');
        return false;
      }

      if (missing.length === 0) {
        emitLog(`[Recovery] All tiles exist on Flow DOM, skip recovery`);
        return false;
      }

      emitLog(`[Recovery] ${missing.length}/${ids.length} tile(s) missing trên Flow → re-upload từ provider URL`, 'info');

      const corrections = {}; // oldId → { newId, file_name, thumbnail }
      for (const oldId of missing) {
        const providerData = sourceNode.result_provider_urls[oldId];
        if (!providerData?.url) {
          emitLog(`[Recovery] ${oldId.substring(0, 16)}: không có provider URL — skip`, 'warn');
          continue;
        }

        // Flow không accept video upload → skip (Download node vẫn work qua provider URL trực tiếp)
        if (providerData.media_type === 'video') {
          emitLog(`[Recovery] ${oldId.substring(0, 16)}: video — Flow không support upload, skip`, 'warn');
          continue;
        }

        const bridgeFn = providerData.provider === 'chatgpt'
          ? window.MessageBridge.chatGPTBridgeToFlow
          : providerData.provider === 'grok'
            ? window.MessageBridge.grokBridgeToFlow
            : null;
        if (!bridgeFn) {
          emitLog(`[Recovery] ${oldId.substring(0, 16)}: provider "${providerData.provider}" không hỗ trợ`, 'warn');
          continue;
        }

        try {
          const fileName = `${providerData.provider}-recovered-${Date.now()}.png`;
          const bridgeResp = await bridgeFn.call(window.MessageBridge, providerData.url, providerData.tab_id, fileName);

          // ChatGPT schema: { success, tileDetails: [{id, file_name, thumbnailUrl}] }
          // Grok schema:    { success, tileId, fileName, thumbnailUrl } (flat)
          let newTileId = null;
          let newFileName = null;
          let newThumbnail = null;
          if (bridgeResp?.success) {
            if (providerData.provider === 'chatgpt') {
              const td = Array.isArray(bridgeResp.tileDetails)
                ? bridgeResp.tileDetails[0]
                : (bridgeResp.tileDetails || null);
              newTileId = td?.id || td?.tile_id || td?.tileId;
              newFileName = td?.file_name;
              newThumbnail = td?.thumbnailUrl || td?.thumbnail_url;
            } else {
              newTileId = bridgeResp.tileId;
              newFileName = bridgeResp.fileName;
              newThumbnail = bridgeResp.thumbnailUrl;
            }
          }

          if (newTileId) {
            corrections[oldId] = { newId: newTileId, file_name: newFileName, thumbnail: newThumbnail };
            emitLog(`[Recovery] ${oldId.substring(0, 16)} → ${newTileId.substring(0, 16)}`, 'success');
          } else {
            emitLog(`[Recovery] ${oldId.substring(0, 16)} fail: ${bridgeResp?.error || 'NO_TILE_ID'}`, 'warn');
          }
        } catch (err) {
          emitLog(`[Recovery] ${oldId.substring(0, 16)} exception: ${err.message}`, 'warn');
        }
      }

      if (Object.keys(corrections).length === 0) return false;

      // Apply corrections: update result_file_ids + re-key thumbnails/file_names/provider_urls
      const newIdsArr = ids.map(id => corrections[id]?.newId || id);
      sourceNode.result_file_ids = newIdsArr.join(', ');

      if (!sourceNode.result_thumbnails || Array.isArray(sourceNode.result_thumbnails)) sourceNode.result_thumbnails = {};
      if (!sourceNode.result_file_names || Array.isArray(sourceNode.result_file_names)) sourceNode.result_file_names = {};
      if (!sourceNode.result_provider_urls || Array.isArray(sourceNode.result_provider_urls)) sourceNode.result_provider_urls = {};

      for (const [oldId, info] of Object.entries(corrections)) {
        const newId = info.newId;
        // Move/update thumbnail
        const oldThumb = sourceNode.result_thumbnails[oldId];
        if (oldThumb) {
          // Preserve format (object {thumbnail, type, file_name} hoặc string)
          if (typeof oldThumb === 'object') {
            sourceNode.result_thumbnails[newId] = {
              ...oldThumb,
              thumbnail: info.thumbnail || oldThumb.thumbnail,
              file_name: info.file_name || oldThumb.file_name,
            };
          } else {
            sourceNode.result_thumbnails[newId] = info.thumbnail || oldThumb;
          }
          delete sourceNode.result_thumbnails[oldId];
        } else if (info.thumbnail) {
          sourceNode.result_thumbnails[newId] = info.thumbnail;
        }
        // Move file_name
        if (sourceNode.result_file_names[oldId]) {
          sourceNode.result_file_names[newId] = info.file_name || sourceNode.result_file_names[oldId];
          delete sourceNode.result_file_names[oldId];
        } else if (info.file_name) {
          sourceNode.result_file_names[newId] = info.file_name;
        }
        // Move provider URL (preserve để future recovery vẫn work nếu user reload Flow lại)
        if (sourceNode.result_provider_urls[oldId]) {
          sourceNode.result_provider_urls[newId] = sourceNode.result_provider_urls[oldId];
          delete sourceNode.result_provider_urls[oldId];
        }
        // Sync MediaRegistry
        if (typeof MediaRegistry !== 'undefined') {
          if (info.thumbnail) MediaRegistry.setThumb?.(newId, info.thumbnail);
          if (info.file_name) MediaRegistry.setFileName?.(newId, info.file_name);
        }
      }

      return true;
    }

    async _correctUpstreamNodeIds(node, workflow, emitLog) {
      if (typeof window.correctFileIds !== 'function') return;
      if (!workflow?.nodes || !Array.isArray(workflow.nodes)) return;

      const edges = workflow.edges || [];
      const inputEdges = edges.filter(e => e.target_node_id === node.node_id);
      if (inputEdges.length === 0) return;

      for (const edge of inputEdges) {
        const sourceNode = workflow.nodes.find(n => n.node_id === edge.source_node_id);
        if (!sourceNode?.result_file_ids) continue;

        // ChatGPT/Grok upstream — KHÔNG dùng 5-tier correction (correctFileIds
        // dựa vào file_name/thumbnail map từ Flow gen, không phù hợp cho
        // synthetic ID `chatgpt_xxx` / `grok_xxx`). Thay vào đó dispatch recovery:
        // re-upload từ result_provider_urls nếu tile missing trên Flow.
        const srcType = sourceNode.node_type || sourceNode.type;
        if (srcType === 'chatgpt' || srcType === 'grok') {
          try {
            const recovered = await this._recoverProviderTiles(sourceNode, emitLog);
            if (!recovered) {
              emitLog(`[Upstream] Node "${sourceNode.node_name}" (${srcType}): tiles OK hoặc không recover được`);
            }
          } catch (recErr) {
            emitLog(`[Recovery] error cho "${sourceNode.node_name}": ${recErr.message}`, 'warn');
          }
          continue;
        }

        // Lưu original IDs trước correctFileIds để reupload cache lookup đúng key
        const originalIds = sourceNode.result_file_ids;

        // Build thumbnail map + file_name map từ source node
        // Image node: result = ref pass-through, nên cần cả ref_thumbnails + ref_file_names
        const thumbMap = { ...(sourceNode.ref_thumbnails || {}), ...(sourceNode.result_thumbnails || {}) };
        const fileNameMap = { ...(sourceNode.ref_file_names || {}), ...(sourceNode.result_file_names || {}) };
        if (Object.keys(thumbMap).length === 0 && Object.keys(fileNameMap).length === 0) {
          emitLog(`[Upstream] Node "${sourceNode.node_name}": không có thumbnail/file_name map, bỏ qua correct`);
          continue;
        }

        emitLog(`[Upstream] Kiểm tra result IDs từ "${sourceNode.node_name}": ${originalIds.substring(0, 60)}...`);

        // 5-tầng correction: file_name > data-tile-id > thumbnail_url > ensureFlowTilesLoaded > reupload
        const { correctedIds, changed } = await window.correctFileIds(originalIds, thumbMap, fileNameMap);
        if (changed) {
          sourceNode.result_file_ids = correctedIds;
          // Cập nhật thumbnail + file_name keys
          const corrections = {};
          const oldArr = (originalIds || '').split(',').map(s => s.trim()).filter(Boolean);
          const newArr = (correctedIds || '').split(',').map(s => s.trim()).filter(Boolean);
          for (let i = 0; i < oldArr.length; i++) {
            if (oldArr[i] !== newArr[i]) corrections[oldArr[i]] = newArr[i];
          }
          if (sourceNode.result_thumbnails) {
            const updated = {};
            for (const [oldId, url] of Object.entries(sourceNode.result_thumbnails)) {
              updated[corrections[oldId] || oldId] = url;
            }
            sourceNode.result_thumbnails = updated;
          }
          if (sourceNode.result_file_names) {
            const updated = {};
            for (const [oldId, fn] of Object.entries(sourceNode.result_file_names)) {
              updated[corrections[oldId] || oldId] = fn;
            }
            sourceNode.result_file_names = updated;
          }
          emitLog(`[Upstream] Đã correct result IDs từ "${sourceNode.node_name}": ${correctedIds.substring(0, 60)}...`);
        } else {
          emitLog(`[Upstream] Result IDs từ "${sourceNode.node_name}" vẫn hợp lệ`);
        }

        // Tầng 5: reuploadMissingFiles nếu vẫn missing
        if (typeof window.reuploadMissingFiles === 'function') {
          const beforeUpstream = (sourceNode.result_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          const upstreamThumbMap = { ...(sourceNode.result_thumbnails || {}), ...(sourceNode.ref_thumbnails || {}) };
          // CRITICAL: Truyền file_names map để check file_name trước (tránh reupload không cần thiết)
          const upstreamFileNamesMap = { ...(sourceNode.result_file_names || {}), ...(sourceNode.ref_file_names || {}) };
          const updated = await window.reuploadMissingFiles(sourceNode.result_file_ids, upstreamThumbMap, originalIds, upstreamFileNamesMap);
          if (updated !== sourceNode.result_file_ids) {
            emitLog(`[Upstream Tầng 5] Re-upload result từ "${sourceNode.node_name}": ${updated.substring(0, 60)}...`);
            const oldIdArr = beforeUpstream;
            const newIdArr = (updated || '').split(',').map(s => s.trim()).filter(Boolean);
            sourceNode.result_file_ids = updated;

            // Update result_file_names và result_thumbnails với new keys từ MediaRegistry
            if (!sourceNode.result_file_names || Array.isArray(sourceNode.result_file_names)) sourceNode.result_file_names = {};
            if (!sourceNode.result_thumbnails || Array.isArray(sourceNode.result_thumbnails)) sourceNode.result_thumbnails = {};
            for (let i = 0; i < newIdArr.length; i++) {
              const newId = newIdArr[i];
              const oldId = oldIdArr[i];
              if (oldId && newId && oldId !== newId) {
                const newFileName = MediaRegistry.getFileName(newId);
                const newThumb = MediaRegistry.getThumb(newId);
                if (newFileName) {
                  sourceNode.result_file_names[newId] = newFileName;
                } else if (sourceNode.result_file_names[oldId]) {
                  sourceNode.result_file_names[newId] = sourceNode.result_file_names[oldId];
                }
                if (newThumb) {
                  sourceNode.result_thumbnails[newId] = newThumb;
                } else if (sourceNode.result_thumbnails[oldId]) {
                  sourceNode.result_thumbnails[newId] = sourceNode.result_thumbnails[oldId];
                }
                delete sourceNode.result_file_names[oldId];
                delete sourceNode.result_thumbnails[oldId];
              }
            }
          }
          const afterUpstream = (updated || '').split(',').map(s => s.trim()).filter(Boolean);
          const droppedUpstream = beforeUpstream.length - afterUpstream.length;
          if (droppedUpstream > 0) {
            emitLog(`[Node ${sourceNode.node_name}] ${droppedUpstream} ảnh kết quả không tìm thấy, đã bị bỏ qua`, 'warn');
            if (afterUpstream.length === 0 && beforeUpstream.length > 0) {
              emitLog(`[Node ${sourceNode.node_name}] Tất cả ảnh kết quả đã mất. Node tiếp theo chạy không có input.`, 'error');
            }
          }
        }
      }
    }

    _collectInputFileIds(node, nodes, edges) {
      // Guard: return empty if nodes undefined
      if (!nodes || !Array.isArray(nodes)) {
        return [];
      }

      // Video+Frames: collect từng frame riêng biệt
      // Chỉ dùng Frames mode khi node có configure frame source cụ thể
      if (node.media_type === 'Video' && node.video_input_type === 'Frames'
          && (node.frame_1_source || node.frame_2_source)) {
        return this._collectFrameFileIds(node, nodes);
      }

      const fileIds = [];

      // 1. Từ các node trước (qua edges), traverse qua pass-through nodes
      const PASSTHROUGH_TYPES = ['delay', 'note'];
      const inputEdges = (edges || []).filter(e => e.target_node_id === node.node_id);
      for (const edge of inputEdges) {
        const sourceNode = nodes.find(n => n.node_id === edge.source_node_id);
        if (!sourceNode) continue;

        if (sourceNode.result_file_ids) {
          const ids = (sourceNode.result_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          fileIds.push(...ids);
        } else if (sourceNode.node_type === 'image' && sourceNode.ref_file_ids) {
          // Image node: output = ref_file_ids (khi chưa execute), lọc bỏ upload_xxx keys
          const ids = (sourceNode.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean).filter(id => !id.startsWith('upload_'));
          fileIds.push(...ids);
        } else if (PASSTHROUGH_TYPES.includes(sourceNode.node_type)) {
          // Pass-through node (delay, note): traverse ngược lên tìm upstream data
          const visited = new Set([node.node_id, sourceNode.node_id]);
          const queue = [sourceNode.node_id];
          while (queue.length > 0) {
            const currentId = queue.shift();
            const upstreamEdges = (edges || []).filter(e => e.target_node_id === currentId);
            for (const ue of upstreamEdges) {
              const upNode = nodes.find(n => n.node_id === ue.source_node_id);
              if (!upNode || visited.has(upNode.node_id)) continue;
              visited.add(upNode.node_id);
              if (upNode.result_file_ids) {
                const ids = (upNode.result_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
                fileIds.push(...ids);
              } else if (upNode.node_type === 'image' && upNode.ref_file_ids) {
                // Image node: output = ref_file_ids (khi chưa execute), lọc bỏ upload_xxx keys
                const ids = (upNode.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean).filter(id => !id.startsWith('upload_'));
                fileIds.push(...ids);
              } else if (PASSTHROUGH_TYPES.includes(upNode.node_type)) {
                queue.push(upNode.node_id);
              }
            }
          }
        }
      }

      // 2. Từ ảnh tham chiếu riêng của node (chọn qua image picker)
      if (node.ref_file_ids) {
        const refIds = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
        if (refIds.length > 0) {
          log('Node ref_file_ids:', refIds);
        }
        fileIds.push(...refIds);
      }

      return [...new Set(fileIds)];
    }

    /**
     * Phase WK-1.4.1: Thu thập input theo từng port name (typed port system).
     * Đọc edges có target_port khớp portName, query upstream output qua source_port.
     * Backward-compat (WK-1.4.8): edge cũ không có port → map sang port[0] của node.
     *
     * @param {Object} node - Node hiện tại
     * @param {String} portName - Tên input port (vd 'image_ref', 'text', 'frame_1')
     * @param {Array} nodes - Tất cả nodes của workflow
     * @param {Array} edges - Tất cả edges của workflow
     * @returns {Array} Mảng giá trị input (string IDs hoặc text)
     */
    _collectPortInputs(node, portName, nodes, edges) {
      if (!Array.isArray(edges) || !Array.isArray(nodes)) return [];
      const NodeTpl = window.NodeTemplates;

      // Lookup port[0].name của node (cho backward-compat fallback 'default')
      const getFirstInPort = (n) => {
        if (!n || !NodeTpl?.getNodePorts) return null;
        const type = n.node_type || n.type;
        const ports = NodeTpl.getNodePorts(type, n) || { in: [] };
        return ports.in?.[0]?.name || null;
      };
      const getFirstOutPort = (n) => {
        if (!n || !NodeTpl?.getNodePorts) return null;
        const type = n.node_type || n.type;
        const ports = NodeTpl.getNodePorts(type, n) || { out: [] };
        return ports.out?.[0]?.name || null;
      };

      // Filter edges trỏ vào port `portName` của node hiện tại
      const portEdges = edges.filter((e) => {
        if (e.target_node_id !== node.node_id) return false;
        const tgtPort = e.target_port;
        if (!tgtPort || tgtPort === 'default') {
          // Edge cũ → default map sang port đầu tiên của node hiện tại
          const firstPort = getFirstInPort(node);
          return firstPort === portName;
        }
        return tgtPort === portName;
      });

      const result = [];
      for (const edge of portEdges) {
        const upstream = nodes.find((n) => n.node_id === edge.source_node_id);
        if (!upstream) continue;

        // Resolve source port: edge cũ → port out đầu tiên của upstream
        let sourcePortName = edge.source_port;
        if (!sourcePortName || sourcePortName === 'default') {
          sourcePortName = getFirstOutPort(upstream) || 'default';
        }

        const data = this._getNodeOutputForPort(upstream, sourcePortName);
        if (data === null || data === undefined) continue;

        if (Array.isArray(data)) {
          result.push(...data);
        } else if (typeof data === 'string') {
          // Text port → giữ nguyên cả khi rỗng (caller tự filter)
          if (data.trim()) result.push(data.trim());
          else result.push(data);
        }
      }
      return result;
    }

    /**
     * Phase WK-1.4.2: Lấy output của 1 node theo source port name.
     * Trả mảng tile IDs (cho image/video/media), string text (cho text), hoặc null.
     *
     * @param {Object} node - Node upstream
     * @param {String} portName - Tên output port của upstream
     * @returns {Array|String|null}
     */
    _getNodeOutputForPort(node, portName) {
      if (!node) return null;
      const splitIds = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);
      // Bug fix: Lọc bỏ upload_xxx keys (local files chưa upload) khỏi ref_file_ids
      // để không truyền sang downstream nodes khi run single node.
      const filterUploadKeys = (ids) => ids.filter((id) => !id.startsWith('upload_'));

      // Issue #69-7 fix: 'default' fallback — lookup port[0] type của node để biết text vs media.
      // Trước: trả luôn result_file_ids → prompt node text bị mất.
      if (!portName || portName === 'default') {
        const nodeType = node.node_type || node.type;
        const portsCfg = (typeof window.NodeTemplates?.getNodePorts === 'function')
          ? window.NodeTemplates.getNodePorts(nodeType, node) : null;
        const firstOut = portsCfg?.out?.[0];
        if (firstOut?.type === 'text') return node.result_text || '';
        // Default OR media-like → file_ids
        const ids = splitIds(node.result_file_ids);
        if (ids.length === 0 && nodeType === 'image' && node.ref_file_ids) {
          return filterUploadKeys(splitIds(node.ref_file_ids));
        }
        return ids;
      }

      // Image/video/media outputs → result_file_ids
      if (['media', 'image_out', 'pass', 'any_out', 'video_out', 'frame_out'].includes(portName)) {
        const ids = splitIds(node.result_file_ids);
        // Image source node chưa execute → fallback ref_file_ids (lọc bỏ local upload keys)
        if (ids.length === 0 && node.node_type === 'image' && node.ref_file_ids) {
          return filterUploadKeys(splitIds(node.ref_file_ids));
        }
        return ids;
      }

      // Text output (Prompt node) → result_text
      if (portName === 'text') {
        // Bug fix: khi user run single node, upstream Prompt node chưa execute → result_text rỗng.
        // Fallback về node.prompt gốc cho MỌI trường hợp (cả enhance=ON và OFF).
        // Trước: chỉ fallback khi enhance=false → upstream enhance=true mà chưa execute → downstream nhận empty.
        if (!node.result_text && node.node_type === 'prompt') {
          return (node.prompt || '').trim();
        }
        return node.result_text || '';
      }

      // Image source node truyền ref_file_ids khi chưa có result (lọc bỏ local upload keys)
      if (node.node_type === 'image') {
        const r = splitIds(node.result_file_ids);
        if (r.length > 0) return r;
        return filterUploadKeys(splitIds(node.ref_file_ids));
      }

      // Fallback: trả result_file_ids
      return splitIds(node.result_file_ids);
    }

    /**
     * Build file_name lookup map cho addFileToPrompt fallback.
     * Gom result_file_names từ node hiện tại + tất cả upstream nodes.
     * @returns {Object} { fileId: fileName }
     */
    _buildFileNameLookup(node, workflow) {
      const lookup = {};
      if (!workflow?.nodes) return lookup;
      // Từ tất cả nodes trong workflow (upstream + current)
      for (const n of workflow.nodes) {
        if (n.result_file_names) {
          Object.assign(lookup, n.result_file_names);
        }
      }
      return lookup;
    }

    /**
     * Collect frame 1 & frame 2 file IDs cho Video+Frames node
     * Mỗi frame có thể từ: node source (lấy output) hoặc manual (file_id cố định)
     */
    _collectFrameFileIds(node, nodes) {
      const result = { frame1: null, frame2: null };

      // Guard: return empty if nodes undefined
      if (!nodes || !Array.isArray(nodes)) {
        return result;
      }

      // Frame 1
      if (node.frame_1_source === 'manual') {
        result.frame1 = node.frame_1_file_id || null;
      } else if (node.frame_1_source) {
        const sourceNode = nodes.find(n => n.node_id === node.frame_1_source);
        if (sourceNode?.result_file_ids) {
          const ids = (sourceNode.result_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          result.frame1 = ids[0] || null; // Lấy ảnh đầu tiên từ output
        }
      }

      // Frame 2
      if (node.frame_2_source === 'manual') {
        result.frame2 = node.frame_2_file_id || null;
      } else if (node.frame_2_source) {
        const sourceNode = nodes.find(n => n.node_id === node.frame_2_source);
        if (sourceNode?.result_file_ids) {
          const ids = (sourceNode.result_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          result.frame2 = ids[0] || null;
        }
      }

      log('Frame file IDs:', result);
      return result;
    }

    /**
     * Execute single node với retry logic (via RetryHelper)
     */
    async _executeNode(node, workflow) {
      // Per-node accumulators — tránh cross-contamination khi parallel execution
      const nodeAccum = { thumbnails: {}, fileNames: {} };
      // Store in per-node Map (parallel-safe) + legacy shared fallback
      if (!this._nodeAccumMap) this._nodeAccumMap = new Map();
      this._nodeAccumMap.set(node.node_id, nodeAccum);
      this._currentNodeAccum = nodeAccum;
      // Legacy fallback (sequential mode vẫn dùng shared)
      this._lastTileThumbnails = {};
      this._lastTileFileNames = {};
      const nodeLog = (message, type = 'info') => {
        emitLog({ nodeId: node.node_id, message, type });
      };

      return window.RetryHelper.execute(
        async ({ attempt, totalAttempts }) => {
          if (attempt > 1) {
            nodeLog(`Thử lại lần ${attempt}/${totalAttempts}...`, 'warn');
          }
          log(`Executing node "${node.node_name}" (attempt ${attempt}/${totalAttempts})`);
          return await this._executeNodeInternal(node, workflow, nodeAccum);
        },
        {
          label: `Node "${node.node_name}"`,
          maxRetries: this.settings.retryOnFail ? this.settings.maxRetries : 0,
          retryDelay: this.settings.retryDelay,
          // Phase 5.2: Check per-node submitted tracking
          shouldStop: () => this.shouldStop && !(this._submittedNodes && this._submittedNodes.has(node.node_id)),
          onRetry: (attempt, maxRetries, error) => {
            nodeLog(`Lỗi: ${error.message}`, 'error');
            const waitSec = Math.round(this.settings.retryDelay / 1000);
            nodeLog(`Chờ ${waitSec}s trước khi thử lại...`, 'warn');
          },
          onFail: (error, attempts) => {
            nodeLog(`Thất bại sau ${attempts} lần thử`, 'error');
          }
        }
      );
    }

    /**
     * Internal node execution - tương tác với Google Flow UI
     */
    async _executeNodeInternal(node, workflow, nodeAccum = null) {
      const startTime = Date.now();
      const quantity = node.quantity || 1;
      const allNewTileIds = [];

      // Helper emit log cho UI
      const nodeLog = (message, type = 'info') => {
        emitLog({ nodeId: node.node_id, message, type });
      };

      // === NOTE NODE (no-op) — không cần ProviderTabLock ===
      if (node.node_type === 'note') {
        return { fileIds: [], duration: 0 };
      }

      // Phase CG-8b: Acquire tab lock theo provider của node trước khi tương tác DOM.
      // Mixed-provider workflow (Flow + ChatGPT) tự serialize qua lock này.
      const tabRelease = await this._acquireLockForNodeType(node);
      try {
        return await this._executeNodeDispatch(node, workflow, nodeAccum, nodeLog, startTime);
      } finally {
        if (tabRelease) {
          try { tabRelease(); } catch (e) { /* swallow */ }
        }
        // Bug fix: Restore original ref state để KHÔNG persist port-merged values xuống storage.
        // Port-merged values chứa data của source nodes — chỉ valid runtime, không phải user-input.
        if (node._original_ref_state) {
          node.ref_file_ids = node._original_ref_state.ref_file_ids;
          node.ref_thumbnails = node._original_ref_state.ref_thumbnails;
          node.ref_file_names = node._original_ref_state.ref_file_names;
          delete node._original_ref_state;
        }
      }
    }

    /**
     * Phase CG-8b: Tách dispatch logic ra method riêng để wrap trong tab lock.
     * Body method này GIỮ NGUYÊN dispatch cũ (note đã return ở caller).
     */
    async _executeNodeDispatch(node, workflow, nodeAccum, nodeLog, startTime) {
      const quantity = node.quantity || 1;
      const allNewTileIds = [];

      // === PROMPT NODE (Phase CG-8) — chứa text + tuỳ chọn enhance qua LLM ===
      // Đặt trước correctUpstream vì prompt node KHÔNG cần ref images / file_ids upstream.
      if (node.node_type === 'prompt') {
        return this._executePromptNode(node, workflow, nodeLog);
      }

      // === Correct upstream result_file_ids cho tất cả node types cần input (kể cả delay pass-through) ===
      const needsInput = ['generate', 'download', 'telegram', 'image', 'delay', 'chatgpt', 'grok'];
      if (needsInput.includes(node.node_type)) {
        // Correct upstream nodes (result_file_ids từ node trước)
        await this._correctUpstreamNodeIds(node, workflow, nodeLog);
      }

      // === PORT-BASED PROMPT OVERRIDE (Phase WK-1.4.3) ===
      // Ưu tiên port `text` edge từ Prompt node trước legacy `prompt_source` field.
      // Nếu workflow mới có edge tới port `text` của generate/chatgpt/grok → dùng port input.
      let portTextOverridden = false;
      if (['generate', 'chatgpt', 'grok'].includes(node.node_type)) {
        try {
          const portTextInputs = this._collectPortInputs(node, 'text', workflow.nodes, workflow.edges);
          const upstreamText = portTextInputs.find((t) => typeof t === 'string' && t.trim());
          if (upstreamText) {
            let truncated = upstreamText;
            const maxLen = window.ValidationRules?.getInt?.('prompt_max_length', 5000) ?? 5000;
            if (truncated.length > maxLen) {
              nodeLog(`Upstream port "text" > ${maxLen} ký tự — truncate`, 'warn');
              truncated = truncated.substring(0, maxLen);
            }
            node.prompt = truncated;
            node._effective_prompt = truncated;
            nodeLog(`Prompt từ port "text": ${truncated.substring(0, 80)}${truncated.length > 80 ? '...' : ''}`);
            portTextOverridden = true;
          }
        } catch (err) {
          nodeLog('Lỗi collect port "text": ' + err.message, 'warn');
        }
      }

      // === PROMPT SOURCE OVERRIDE (Phase CG-8 — legacy fallback) ===
      // Chỉ chạy nếu PORT-BASED chưa override (workflow cũ không có port edge).
      if (
        !portTextOverridden &&
        ['generate', 'chatgpt', 'grok'].includes(node.node_type) &&
        node.prompt_source === 'upstream_node'
      ) {
        try {
          const { text: effectivePrompt, source } = this._resolveEffectivePrompt(node, workflow);
          node._effective_prompt = effectivePrompt;
          if (effectivePrompt) {
            nodeLog(`Prompt source (legacy field): ${source} (len=${effectivePrompt.length})`);
            node.prompt = effectivePrompt;
          } else if (source === 'textbox_fallback') {
            nodeLog('Upstream prompt không có — fallback sang textbox prompt', 'warn');
          }
        } catch (err) {
          nodeLog('Resolve upstream prompt lỗi: ' + err.message, 'error');
          throw err;
        }
      }

      // === PORT-BASED IMAGE_REF MERGE (Phase WK-1.4.3-6) ===
      // Cho generate/chatgpt/grok/prompt: gộp tile IDs từ port `image_ref` vào node.ref_file_ids.
      // Workflow cũ (1 ref input) sẽ không có port edge → skip, dùng node.ref_file_ids hiện có.
      // Bug fix: Lưu original ref_file_ids/thumbnails/file_names vào _original_ref_state để restore
      // sau dispatch. Trước fix: mutate node.ref_file_ids → exportWorkflow persist port-merged value.
      // Bug fix 2: KHÔNG chỉ merge ref_file_ids mà phải merge ref_thumbnails + ref_file_names từ
      // source nodes (Image source). Trước: tile_id port-merged không có thumbnail → resolveRefs
      // base64 fail → Grok submit không có ref image dù log "merge: +1 ảnh".
      // Bug 1 fix (audit 2026-05): TRƯỚC ĐÂY filter loại bỏ edges từ Image source → Image →
      // ChatGPT/Grok edge silent fail (refs từ Image bị bỏ). Generate node lại nhận Image qua
      // `_collectInputFileIds` (line ~1692) → inconsistency. Giờ allow Image source để 3 provider
      // nhất quán: Image → Generate/ChatGPT/Grok đều work. Restore _original_ref_state ở finally
      // (line ~1990) đảm bảo port-merged values không persist xuống storage.
      if (['generate', 'chatgpt', 'grok', 'prompt'].includes(node.node_type)) {
        try {
          // Filter edges vào image_ref port (cho phép cả Image, Generate, ChatGPT, Grok source)
          // Bug fix: Thêm backward-compat cho edge cũ không có target_port - infer từ source node type
          const explicitImageRefEdges = (workflow.edges || []).filter((e) => {
            if (e.target_node_id !== node.node_id) return false;

            const sourceNode = workflow.nodes.find(n => n.node_id === e.source_node_id);

            // Direct match: explicit image_ref port
            if (e.target_port === 'image_ref') {
              return true;
            }

            // Backward-compat: edge cũ không có target_port → infer từ source node type.
            // Image/Generate/ChatGPT/Grok nodes produce image output → treat as image_ref.
            if (!e.target_port || e.target_port === 'default' || e.target_port === null) {
              if (['image', 'generate', 'chatgpt', 'grok'].includes(sourceNode?.node_type)) {
                nodeLog(`[Port-merge] Legacy edge từ ${sourceNode.node_type} → treating as image_ref`);
                return true;
              }
              // Prompt node has text output → don't treat as image_ref
            }

            return false;
          });
          // Collect refs từ filtered edges (Image / Generate / ChatGPT / Grok sources)
          const portImageRefs = explicitImageRefEdges.length > 0
            ? this._collectPortInputs(node, 'image_ref', workflow.nodes, explicitImageRefEdges)
            : [];
          if (portImageRefs.length > 0) {
            const refsToMerge = portImageRefs;
            const existing = (node.ref_file_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
            const combined = [...new Set([...existing, ...refsToMerge])];
            // Lưu snapshot original để restore trong _executeNodeInternal finally (KHÔNG persist port-merged)
            if (!node._original_ref_state) {
              node._original_ref_state = {
                ref_file_ids: node.ref_file_ids || '',
                ref_thumbnails: { ...(node.ref_thumbnails || {}) },
                ref_file_names: { ...(node.ref_file_names || {}) },
              };
            }
            node.ref_file_ids = combined.join(', ');

            // Merge thumbnails + file_names từ source nodes (Image/Generate/ChatGPT/Grok)
            // để _executeGrokImageNode/_executeChatGPTImageNode có URL thumbnail → fetch base64.
            // BUG FIX: ref_thumbnails/ref_file_names có thể là array từ backend JSON → force object
            if (!node.ref_thumbnails || Array.isArray(node.ref_thumbnails)) node.ref_thumbnails = {};
            if (!node.ref_file_names || Array.isArray(node.ref_file_names)) node.ref_file_names = {};
            // Chỉ lấy edges explicit target 'image_ref' (đã filter ở trên)
            for (const edge of explicitImageRefEdges) {
              const src = workflow.nodes.find((n) => n.node_id === edge.source_node_id);
              if (!src) continue;
              // Merge cả ref_* (Image source node) lẫn result_* (Generate/ChatGPT/Grok output)
              const srcThumbs = { ...(src.ref_thumbnails || {}), ...(src.result_thumbnails || {}) };
              const srcFileNames = { ...(src.ref_file_names || {}), ...(src.result_file_names || {}) };
              for (const [fid, thumb] of Object.entries(srcThumbs)) {
                if (!node.ref_thumbnails[fid]) node.ref_thumbnails[fid] = thumb;
              }
              for (const [fid, fname] of Object.entries(srcFileNames)) {
                if (!node.ref_file_names[fid]) node.ref_file_names[fid] = fname;
              }
            }

            // Fallback: lookup MediaRegistry cho IDs được merge mà chưa có thumbnail
            for (const fid of refsToMerge) {
              if (!node.ref_thumbnails[fid]) {
                const mrThumb = typeof MediaRegistry !== 'undefined' && MediaRegistry.getThumb?.(fid);
                if (mrThumb) {
                  node.ref_thumbnails[fid] = mrThumb;
                  nodeLog(`[Port-merge] Fallback MediaRegistry thumb cho ${fid.substring(0, 12)}`);
                }
              }
              if (!node.ref_file_names[fid]) {
                const mrName = typeof MediaRegistry !== 'undefined' && MediaRegistry.getFileName?.(fid);
                if (mrName) {
                  node.ref_file_names[fid] = mrName;
                }
              }
            }

            nodeLog(`Port "image_ref" merge: +${refsToMerge.length} ảnh (tổng ${combined.length})`);
            nodeLog(`[Port-merge] ref_file_names after merge: ${JSON.stringify(node.ref_file_names)}`);
          }
        } catch (err) {
          nodeLog('Lỗi collect port "image_ref": ' + err.message, 'warn');
        }
      }

      // === PORT-BASED FRAMES (Phase WK-1.4.3) ===
      // Generate node + Video Frames mode: lấy frame_1/frame_2 từ port edges (nếu có).
      if (
        node.node_type === 'generate' &&
        node.media_type === 'Video' &&
        node.video_input_type === 'Frames'
      ) {
        try {
          const f1 = this._collectPortInputs(node, 'frame_1', workflow.nodes, workflow.edges);
          if (f1.length > 0 && !node.frame_1_file_id) {
            node.frame_1_file_id = f1[0];
            nodeLog(`Frame 1 từ port: ${node.frame_1_file_id.substring(0, 16)}...`);
          }
          const f2 = this._collectPortInputs(node, 'frame_2', workflow.nodes, workflow.edges);
          if (f2.length > 0 && !node.frame_2_file_id) {
            node.frame_2_file_id = f2[0];
            nodeLog(`Frame 2 từ port: ${node.frame_2_file_id.substring(0, 16)}...`);
          }
        } catch (err) {
          nodeLog('Lỗi collect port frame: ' + err.message, 'warn');
        }
      }

      // === DELAY NODE (pass-through, upstream đã correct ở trên) ===
      if (node.node_type === 'delay') {
        return this._executeDelayNode(node, nodeLog);
      }

      // === IMAGE NODE (pass-through ref_file_ids) ===
      if (node.node_type === 'image') {
        return this._executeImageNode(node, nodeLog);
      }

      // === TELEGRAM NODE ===
      if (node.node_type === 'telegram') {
        return this._executeTelegramNode(node, workflow, nodeLog);
      }

      // === DOWNLOAD NODE ===
      if (node.node_type === 'download') {
        return this._executeDownloadNode(node, workflow, nodeLog);
      }

      // === CHATGPT NODE ===
      if (node.node_type === 'chatgpt') {
        return this._executeChatGPTImageNode(node, workflow, nodeLog, nodeAccum);
      }

      // === GROK NODE === (Phase G-6.4)
      // Note: method name `_executeGrokImageNode` giữ nguyên (internal name, không ảnh hưởng node type external)
      if (node.node_type === 'grok') {
        return this._executeGrokImageNode(node, workflow, nodeLog, nodeAccum);
      }

      // === GENERATE NODE (existing logic) ===

      // 0. Smart Clone: reconstruct ref_file_ids từ metadata khi clone cross-project
      if (!node.ref_file_ids && node.ref_file_names && Object.keys(node.ref_file_names).length > 0) {
        node.ref_file_ids = Object.keys(node.ref_file_names).join(', ');
        nodeLog('Smart Clone: reconstructed ref_file_ids from ref_file_names: ' + node.ref_file_ids);
      } else if (!node.ref_file_ids && node.ref_thumbnails && Object.keys(node.ref_thumbnails).length > 0) {
        node.ref_file_ids = Object.keys(node.ref_thumbnails).join(', ');
        nodeLog('Smart Clone: reconstructed ref_file_ids from ref_thumbnails: ' + node.ref_file_ids);
      }

      // 0a. Upload pending local files nếu có
      if (node.ref_file_ids && node.ref_file_ids.includes('upload_') && typeof window.uploadPendingFiles === 'function') {
        const oldRefIds = node.ref_file_ids;
        nodeLog(window.I18n?.t('workflow.uploadingLocalImages') || 'Uploading local images to Flow...', 'info');
        node.ref_file_ids = await window.uploadPendingFiles(node.ref_file_ids);
        if (node.ref_file_ids !== oldRefIds) {
          // CRITICAL: Capture ref_file_names từ GenTab.fileNameCache (populated by FileUploader)
          const oldIdArr = (oldRefIds || '').split(',').map(s => s.trim()).filter(Boolean);
          const newIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          if (!node.ref_file_names) node.ref_file_names = {};
          for (let i = 0; i < newIdArr.length; i++) {
            const newId = newIdArr[i];
            if (MediaRegistry.getFileName(newId)) {
              node.ref_file_names[newId] = MediaRegistry.getFileName(newId);
            }
            // Transfer thumbnails nếu có
            if (MediaRegistry.getThumb(newId) && node.ref_thumbnails) {
              node.ref_thumbnails[newId] = MediaRegistry.getThumb(newId);
            }
          }
          // Cleanup old upload_xxx keys
          for (const oldId of oldIdArr) {
            if (oldId.startsWith('upload_')) {
              delete node.ref_file_names[oldId];
              if (node.ref_thumbnails) delete node.ref_thumbnails[oldId];
            }
          }

          // CRITICAL FIX: Filter chỉ giữ original refs (không bao gồm port-merged upstream)
          let persistRefIds = node.ref_file_ids;
          let persistRefThumbs = node.ref_thumbnails;
          let persistRefNames = node.ref_file_names;
          if (node._original_ref_state) {
            const origKeySet = new Set(
              (node._original_ref_state.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean)
            );
            for (const nid of newIdArr) origKeySet.add(nid);
            const filteredIds = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(id => origKeySet.has(id));
            persistRefIds = filteredIds.join(', ');
            persistRefThumbs = {};
            persistRefNames = {};
            for (const fid of filteredIds) {
              if (node.ref_thumbnails?.[fid]) persistRefThumbs[fid] = node.ref_thumbnails[fid];
              if (node.ref_file_names?.[fid]) persistRefNames[fid] = node.ref_file_names[fid];
            }
          }

          window.eventBus?.emit('node:ref_replaced', {
            nodeId: node.node_id,
            oldRefIds,
            newRefIds: persistRefIds,
            refFileNames: persistRefNames,
            refThumbnails: persistRefThumbs
          });

          // CRITICAL: Persist ONLY original refs sau khi upload local files
          nodeLog('[Upload] Persisting ref data (filtered) after local file upload');
          try {
            await window.storageManager?.updateNodeStatus(
              this.currentWorkflow.wf_id,
              node.node_id,
              { ref_file_ids: persistRefIds, ref_thumbnails: persistRefThumbs, ref_file_names: persistRefNames }
            );
            // CRITICAL FIX: Update _original_ref_state với persisted values
            if (node._original_ref_state) {
              node._original_ref_state.ref_file_ids = persistRefIds;
              node._original_ref_state.ref_thumbnails = { ...persistRefThumbs };
              node._original_ref_state.ref_file_names = { ...persistRefNames };
              nodeLog('[Upload] Updated _original_ref_state with persisted values');
            }
          } catch (e) {
            log('Failed to persist ref update:', e.message);
          }
        }
      }
      // Smart Clone frames: reconstruct frame_file_id từ metadata
      if (!node.frame_1_file_id && node.frame_1_file_name) {
        node.frame_1_file_id = node.frame_1_file_name;
        nodeLog('Smart Clone: reconstructed frame_1_file_id from file_name: ' + node.frame_1_file_name);
      }
      if (!node.frame_2_file_id && node.frame_2_file_name) {
        node.frame_2_file_id = node.frame_2_file_name;
        nodeLog('Smart Clone: reconstructed frame_2_file_id from file_name: ' + node.frame_2_file_name);
      }

      if (node.frame_1_file_id && node.frame_1_file_id.startsWith('upload_') && typeof window.uploadPendingFiles === 'function') {
        node.frame_1_file_id = await window.uploadPendingFiles(node.frame_1_file_id);
      }
      if (node.frame_2_file_id && node.frame_2_file_id.startsWith('upload_') && typeof window.uploadPendingFiles === 'function') {
        node.frame_2_file_id = await window.uploadPendingFiles(node.frame_2_file_id);
      }

      // Frame import keys (upload_import_*): fetch CDN URL → upload Flow → tile_id mới
      // Frame thumbnails lưu ở node.frame_1_thumbnail / frame_2_thumbnail (không phải ref_thumbnails)
      for (const slot of [1, 2]) {
        const fid = node[`frame_${slot}_file_id`];
        if (fid && fid.startsWith('upload_import_') && typeof window.reuploadMissingFiles === 'function') {
          const thumbUrl = node[`frame_${slot}_thumbnail`];
          if (thumbUrl) {
            const fakeMap = { [fid]: thumbUrl };
            const reuploaded = await window.reuploadMissingFiles(fid, fakeMap, null, null);
            if (reuploaded && reuploaded !== fid) {
              nodeLog(`[Frame ${slot}] Import: ${fid} → ${reuploaded}`);
              node[`frame_${slot}_file_id`] = reuploaded;
              // Capture file_name + thumbnail từ MediaRegistry
              if (typeof MediaRegistry !== 'undefined') {
                if (MediaRegistry.getFileName(reuploaded)) {
                  node[`frame_${slot}_file_name`] = MediaRegistry.getFileName(reuploaded);
                }
                if (MediaRegistry.getThumb(reuploaded)) {
                  node[`frame_${slot}_thumbnail`] = MediaRegistry.getThumb(reuploaded);
                }
              }
            }
          }
        }
      }

      // 0b. Handle import keys (upload_import_*) - fetch từ CDN và upload lên Flow
      // uploadPendingFiles chỉ xử lý local files trong pendingUploadFiles Map
      // Import keys có CDN URLs trong ref_thumbnails, cần reuploadMissingFiles Tầng 3
      const hasImportKeys = node.ref_file_ids && node.ref_file_ids.includes('upload_import_');
      let importKeysJustUploaded = false; // Flag để skip Tầng 5 reupload nếu vừa upload xong
      if (hasImportKeys && typeof window.reuploadMissingFiles === 'function') {
        const importThumbMap = node.ref_thumbnails || {};
        nodeLog(`[Import] Xử lý ${Object.keys(importThumbMap).length} import keys từ CDN...`);
        const uploadedImport = await window.reuploadMissingFiles(node.ref_file_ids, importThumbMap, null, null);
        if (uploadedImport !== node.ref_file_ids) {
          nodeLog(`[Import] Upload thành công: ${uploadedImport.substring(0, 60)}...`);
          node.ref_file_ids = uploadedImport;
          importKeysJustUploaded = true; // Skip Tầng 5 reupload vì vừa upload xong
          // Capture file_names từ MediaRegistry (populated by reuploadMissingFiles)
          const newIdArr = (uploadedImport || '').split(',').map(s => s.trim()).filter(Boolean);
          if (!node.ref_file_names) node.ref_file_names = {};
          if (!node.ref_thumbnails) node.ref_thumbnails = {};
          for (const newId of newIdArr) {
            if (MediaRegistry.getFileName(newId)) {
              node.ref_file_names[newId] = MediaRegistry.getFileName(newId);
            }
            if (MediaRegistry.getThumb(newId)) {
              node.ref_thumbnails[newId] = MediaRegistry.getThumb(newId);
            }
          }
          // Cleanup old upload_import_xxx keys
          for (const key of Object.keys(importThumbMap)) {
            if (key.startsWith('upload_import_')) {
              delete node.ref_file_names[key];
              delete node.ref_thumbnails[key];
            }
          }

          // CRITICAL FIX: Chỉ emit/persist ORIGINAL refs (không bao gồm port-merged upstream refs).
          // Port-merge adds upstream refs vào node.ref_* tạm thời cho runtime, KHÔNG nên persist.
          // Nếu có _original_ref_state, filter chỉ giữ refs thuộc về node này (new upload IDs thay thế import keys).
          let persistRefIds = node.ref_file_ids;
          let persistRefThumbs = node.ref_thumbnails;
          let persistRefNames = node.ref_file_names;
          if (node._original_ref_state) {
            // Get original keys (trước port-merge) - đây là refs thực sự thuộc về node
            const origKeySet = new Set(
              (node._original_ref_state.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean)
            );
            // newIdArr chứa IDs mới (thay thế import keys), cần giữ lại
            for (const nid of newIdArr) {
              origKeySet.add(nid);
            }
            // Filter chỉ giữ refs thuộc origKeySet (loại bỏ port-merged upstream)
            const filteredIds = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(id => origKeySet.has(id));
            persistRefIds = filteredIds.join(', ');
            persistRefThumbs = {};
            persistRefNames = {};
            for (const fid of filteredIds) {
              if (node.ref_thumbnails?.[fid]) persistRefThumbs[fid] = node.ref_thumbnails[fid];
              if (node.ref_file_names?.[fid]) persistRefNames[fid] = node.ref_file_names[fid];
            }
            nodeLog(`[Import] Filtered refs: ${filteredIds.length} original + new IDs (excluded port-merged)`);
          }

          window.eventBus?.emit('node:ref_replaced', {
            nodeId: node.node_id,
            oldRefIds: Object.keys(importThumbMap).join(', '),
            newRefIds: persistRefIds,
            refFileNames: persistRefNames,
            refThumbnails: persistRefThumbs
          });

          // CRITICAL: Persist ONLY original refs (không bao gồm port-merged) để lần chạy sau không cần reupload
          try {
            await window.storageManager?.updateNodeStatus(
              this.currentWorkflow.wf_id,
              node.node_id,
              { ref_file_ids: persistRefIds, ref_thumbnails: persistRefThumbs, ref_file_names: persistRefNames }
            );
            nodeLog('[Import] Đã lưu ref data (filtered) vào storage');
            // CRITICAL FIX: Update _original_ref_state với persisted values
            if (node._original_ref_state) {
              node._original_ref_state.ref_file_ids = persistRefIds;
              node._original_ref_state.ref_thumbnails = { ...persistRefThumbs };
              node._original_ref_state.ref_file_names = { ...persistRefNames };
              nodeLog('[Import] Updated _original_ref_state with persisted values');
            }
          } catch (e) {
            log('[Import] Failed to persist ref update:', e.message);
          }
        } else {
          nodeLog('[Import] Không có import key nào được upload (có thể CDN URL đã hết hạn)', 'warn');
        }
      }

      // 0c. Correct stale tile IDs trên node.ref_file_ids (5-tầng)
      // Skip nếu vừa upload import keys xong (tránh duplicate upload + zoom)
      if (node.ref_file_ids && !node.ref_file_ids.includes('upload_') && !importKeysJustUploaded) {
        // Lưu original IDs trước correctFileIds để reupload cache lookup đúng key
        const originalNodeRefIds = node.ref_file_ids;
        let refCorrectionChanged = false;
        const thumbMap = { ...(node.ref_thumbnails || {}), ...(node.result_thumbnails || {}) };
        // BUGFIX: Dùng ref_file_names (không phải result_file_names) cho ref correction
        const fnMap = { ...(node.ref_file_names || {}), ...(node.result_file_names || {}) };
        if (typeof window.correctFileIds === 'function' && (Object.keys(thumbMap).length > 0 || Object.keys(fnMap).length > 0)) {
          nodeLog(`[Tầng 1-3] Kiểm tra ref IDs: ${node.ref_file_ids.substring(0, 60)}...`);
          const { correctedIds, changed } = await window.correctFileIds(node.ref_file_ids, thumbMap, fnMap);
          if (changed) {
            nodeLog(`[Tầng 1-4] Ref IDs đã correct: ${correctedIds.substring(0, 60)}...`);
            node.ref_file_ids = correctedIds;
            refCorrectionChanged = true;
          } else {
            nodeLog('[Tầng 1-3] Ref IDs vẫn hợp lệ');
          }
        }
        if (typeof window.reuploadMissingFiles === 'function') {
          const beforeRef = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          const refThumbMap = { ...(node.ref_thumbnails || {}), ...(node.result_thumbnails || {}) };
          // CRITICAL: Truyền file_names map để check file_name trước (tránh reupload không cần thiết)
          const refFileNamesMap = { ...(node.ref_file_names || {}), ...(node.result_file_names || {}) };
          nodeLog(`[Tầng 5] Checking refs: ${node.ref_file_ids.substring(0, 60)}`);
          nodeLog(`[Tầng 5] file_names map: ${JSON.stringify(refFileNamesMap)}`);
          const updated = await window.reuploadMissingFiles(node.ref_file_ids, refThumbMap, originalNodeRefIds, refFileNamesMap);
          if (updated !== node.ref_file_ids) {
            nodeLog(`[Tầng 5] Re-upload ref images: ${updated.substring(0, 60)}...`);
            const oldIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
            const newIdArr = (updated || '').split(',').map(s => s.trim()).filter(Boolean);
            node.ref_file_ids = updated;
            refCorrectionChanged = true;

            // BUG FIX: Update ref_file_names và ref_thumbnails với new keys từ MediaRegistry
            // reuploadMissingFiles đã populate MediaRegistry với newId → file_name/thumbnail
            // CRITICAL: Không dùng index-based matching vì reuploadMissingFiles có thể filter bỏ missing IDs
            // Dùng ID-based: check xem ID có thay đổi không, update metadata theo
            if (!node.ref_file_names) node.ref_file_names = {};
            if (!node.ref_thumbnails) node.ref_thumbnails = {};

            // Build set of new IDs để kiểm tra
            const newIdSet = new Set(newIdArr);
            const oldIdSet = new Set(oldIdArr);

            // Tìm các IDs đã thay đổi (có trong old nhưng không có trong new → bị thay thế)
            // và IDs mới (có trong new nhưng không có trong old → ID thay thế)
            const replacedOldIds = oldIdArr.filter(id => !newIdSet.has(id));
            const newlyAddedIds = newIdArr.filter(id => !oldIdSet.has(id));

            // Nếu số lượng bằng nhau, có thể map 1-1 theo thứ tự
            // (reuploadMissingFiles giữ nguyên thứ tự, replaced ID ở vị trí của old ID)
            if (replacedOldIds.length === newlyAddedIds.length) {
              for (let i = 0; i < replacedOldIds.length; i++) {
                const oldId = replacedOldIds[i];
                const newId = newlyAddedIds[i];

                // Lấy từ MediaRegistry (đã được reuploadMissingFiles populate)
                const newFileName = MediaRegistry.getFileName(newId);
                const newThumb = MediaRegistry.getThumb(newId);
                if (newFileName) {
                  node.ref_file_names[newId] = newFileName;
                } else if (node.ref_file_names[oldId]) {
                  // Fallback: transfer từ old key
                  node.ref_file_names[newId] = node.ref_file_names[oldId];
                }
                if (newThumb) {
                  node.ref_thumbnails[newId] = newThumb;
                } else if (node.ref_thumbnails[oldId]) {
                  node.ref_thumbnails[newId] = node.ref_thumbnails[oldId];
                }
                // Cleanup old keys
                delete node.ref_file_names[oldId];
                delete node.ref_thumbnails[oldId];
                nodeLog(`[Tầng 5] Transferred metadata: ${oldId.substring(0, 20)} → ${newId.substring(0, 20)}`);
              }
            } else {
              nodeLog(`[Tầng 5] WARN: ID count mismatch - replaced=${replacedOldIds.length}, new=${newlyAddedIds.length}`, 'warn');
              // Fallback: populate từ MediaRegistry cho tất cả new IDs
              for (const newId of newlyAddedIds) {
                const newFileName = MediaRegistry.getFileName(newId);
                const newThumb = MediaRegistry.getThumb(newId);
                if (newFileName) node.ref_file_names[newId] = newFileName;
                if (newThumb) node.ref_thumbnails[newId] = newThumb;
              }
            }

            // Cleanup: xóa các keys không còn trong newIdArr
            for (const key of Object.keys(node.ref_file_names)) {
              if (!newIdSet.has(key)) {
                delete node.ref_file_names[key];
              }
            }
            for (const key of Object.keys(node.ref_thumbnails)) {
              if (!newIdSet.has(key)) {
                delete node.ref_thumbnails[key];
              }
            }
            nodeLog(`[Tầng 5] Updated ref_file_names/thumbnails with new keys`);
          }
          const afterRef = (updated || '').split(',').map(s => s.trim()).filter(Boolean);
          const droppedRef = beforeRef.length - afterRef.length;
          if (droppedRef > 0) {
            nodeLog(`[Node ${node.node_name || node.node_id}] ${droppedRef} ảnh tham chiếu không tìm thấy, đã bị bỏ qua`, 'warn');
            if (afterRef.length === 0 && beforeRef.length > 0) {
              nodeLog(`[Node ${node.node_name || node.node_id}] Tất cả ảnh tham chiếu đã mất. Node chạy không có ref.`, 'error');
            }
          }
        }

        // CRITICAL: Persist updated ref data sau khi correctFileIds + reuploadMissingFiles
        if (refCorrectionChanged) {
          nodeLog('[Tầng 1-5] Persisting corrected ref data to storage');
          try {
            await window.storageManager?.updateNodeStatus(
              this.currentWorkflow.wf_id,
              node.node_id,
              { ref_file_ids: node.ref_file_ids, ref_thumbnails: node.ref_thumbnails, ref_file_names: node.ref_file_names }
            );
            // CRITICAL FIX: Update _original_ref_state với new values để finally restore đúng
            // Nếu không update, finally sẽ restore giá trị cũ (trước reupload), ghi đè data đã persist
            if (node._original_ref_state) {
              node._original_ref_state.ref_file_ids = node.ref_file_ids;
              node._original_ref_state.ref_thumbnails = { ...node.ref_thumbnails };
              node._original_ref_state.ref_file_names = { ...node.ref_file_names };
              nodeLog('[Tầng 1-5] Updated _original_ref_state with persisted values');
            }
          } catch (e) {
            log('Failed to persist ref update:', e.message);
          }
        }
      }

      // 1. Collect input file IDs (upstream đã correct ở trên)
      // Frames mode trả object {frame1, frame2}, normal mode trả array
      const rawInputFileIds = this._collectInputFileIds(node, workflow.nodes, workflow.edges);
      const isFramesResult = !Array.isArray(rawInputFileIds) && rawInputFileIds?.frame1 !== undefined;
      let inputFileIds = isFramesResult
        ? [rawInputFileIds.frame1, rawInputFileIds.frame2].filter(Boolean)
        : (Array.isArray(rawInputFileIds) ? rawInputFileIds : []);
      nodeLog(`[Tầng 1] Input file IDs: ${inputFileIds.length} ảnh — ${inputFileIds.map(id => id.substring(0, 20)).join(', ')}`);

      // Cap runtime cho Video Ingredients (Flow limit = 3 ảnh)
      // Image limit = 10 (Flow generous, không cần cap nghiêm)
      // Frames mode KHÔNG cap (đã có flow riêng frame_1/frame_2)
      // inputFileIds thứ tự: [upstream..., refAttach...] → slice(0, 3) ưu tiên upstream
      //
      // Post-audit fix: dùng FlowAdapter.getMaxRefImages({mode, isFrames}) per-mode
      // thay vì hardcoded — đồng nhất pattern với ImagePickerModal.resolveMaxSelections.
      // Fallback hardcoded 3 nếu adapter chưa load (race condition).
      const isVideoIngredients = node.media_type === 'Video' && node.video_input_type !== 'Frames';
      if (!isFramesResult && isVideoIngredients) {
        const flowAdapter = window.ProviderRegistry?.get?.('flow');
        const refLimit = (typeof flowAdapter?.getMaxRefImages === 'function')
          ? flowAdapter.getMaxRefImages({ mode: 'video', isFrames: false })
          : 3;
        if (Array.isArray(inputFileIds) && inputFileIds.length > refLimit) {
          const dropped = inputFileIds.length - refLimit;
          nodeLog(`Video Ingredients giới hạn ${refLimit} ảnh — bỏ qua ${dropped} ảnh thừa (ưu tiên ảnh từ port edge)`, 'warn');
          inputFileIds = inputFileIds.slice(0, refLimit);
        }
      }

      // Filter synthetic IDs (chatgpt_xxx, grok_xxx) — không có tile trên Flow DOM (bridge timeout).
      // Apply cho cả PIPELINE và DIRECT paths để tránh addRefImages/addFileToPrompt fail.
      const syntheticIdPattern = /^(chatgpt_|grok_|grok_video_)/;
      const originalInputCount = inputFileIds.length;
      inputFileIds = inputFileIds.filter(id => !syntheticIdPattern.test(id));
      if (inputFileIds.length < originalInputCount) {
        const droppedSynthetic = originalInputCount - inputFileIds.length;
        nodeLog(`Loại bỏ ${droppedSynthetic} synthetic ID từ upstream (chatgpt/grok bridge timeout)`, 'warn');
      }

      // Build file_name lookup map cho addFileToPrompt fallback
      const fnLookup = this._buildFileNameLookup(node, workflow);

      // Chuyển sang pipeline PromptQueue nếu bật (SAU khi upstream đã correct + inputFileIds đã collect)
      const pqExists = !!window.PromptQueue;
      const pqEnabled = pqExists && PromptQueue.isEnabled();
      console.log(`[WorkflowExecutor] >>> NODE GENERATE DISPATCH — Pipeline Check: exists=${pqExists}, enabled=${pqEnabled}, settings.queueEnabled=${window.storageSettings?.getSettings?.()?.queueEnabled}`);
      console.log(`[WorkflowExecutor] >>> Will use ${pqExists && pqEnabled ? 'PIPELINE (PromptQueue)' : 'DIRECT (applySettings → ... → _waitForNewTiles)'} path`);
      nodeLog(`[Pipeline Check] PromptQueue exists: ${pqExists}, isEnabled: ${pqEnabled}, settings.queueEnabled: ${window.storageSettings?.getSettings?.()?.queueEnabled}`);
      if (pqExists && pqEnabled) {
        // Chờ download queue empty trước khi submit node mới
        // Tránh tranh chấp context menu giữa download và submit
        const pq = PromptQueue.getInstance();
        const downloadsCleared = await pq.waitForDownloadsEmpty(30000);
        if (!downloadsCleared) {
          nodeLog('[Pipeline] Timeout chờ downloads, tiếp tục submit...', 'warn');
        }

        const gd = await this._getGenDefaults();
        const isVid = (node.media_type || gd.genType) === 'Video';
        const nodeRefIds = node.ref_file_ids
          ? (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean)
          : [];
        const combinedRefIds = [...new Set([...inputFileIds, ...nodeRefIds])];

        // Cap runtime cho Video Ingredients (Flow limit = 3 ảnh)
        // Image limit = 10 (Flow generous, không cần cap nghiêm)
        // Priority: giữ port edge refs trước (intent rõ ràng), cắt form attach sau
        //
        // Post-audit fix: dùng FlowAdapter.getMaxRefImages per-mode.
        const isVideoIngredientsPq = node.media_type === 'Video' && node.video_input_type !== 'Frames';
        const flowAdapterPq = window.ProviderRegistry?.get?.('flow');
        const refLimitPq = (typeof flowAdapterPq?.getMaxRefImages === 'function')
          ? flowAdapterPq.getMaxRefImages({ mode: isVideoIngredientsPq ? 'video' : 'image', isFrames: false })
          : (isVideoIngredientsPq ? 3 : 10);
        let cappedRefIds = combinedRefIds;
        if (combinedRefIds.length > refLimitPq) {
          const portRefs = inputFileIds || [];   // upstream từ port edges (đã cap ở trên cho Video Ingredients)
          const formRefs = nodeRefIds || [];      // user pick qua image picker
          // Lấy tất cả portRefs trước (capped), bù từ formRefs cho đủ refLimit
          const portCap = portRefs.slice(0, refLimitPq);
          const formCap = formRefs.slice(0, Math.max(0, refLimitPq - portCap.length));
          cappedRefIds = [...new Set([...portCap, ...formCap])];
          const dropped = combinedRefIds.length - cappedRefIds.length;
          if (dropped > 0) {
            nodeLog(`Video Ingredients giới hạn ${refLimitPq} ảnh — bỏ qua ${dropped} ảnh thừa (ưu tiên giữ ảnh từ port edge)`, 'warn');
          }
        }

        // Filter synthetic IDs (chatgpt_xxx, grok_xxx, grok_video_xxx) — không dùng được làm
        // ref image cho Flow Generate vì chúng không có tile trên Flow DOM (bridge timeout).
        // Synthetic IDs chỉ có ý nghĩa cho Download node (có result_provider_urls).
        const syntheticPattern = /^(chatgpt_|grok_|grok_video_)/;
        const validFlowRefIds = cappedRefIds.filter(id => !syntheticPattern.test(id));
        if (validFlowRefIds.length < cappedRefIds.length) {
          const droppedSynthetic = cappedRefIds.length - validFlowRefIds.length;
          nodeLog(`Loại bỏ ${droppedSynthetic} synthetic ID (chatgpt/grok bridge timeout) — không có tile trên Flow DOM`, 'warn');
        }
        cappedRefIds = validFlowRefIds;

        const pipelineResult = await pq.submitJob({
          owner: 'workflow',
          label: `Node: ${node.node_name || 'Generate'}`,
          prompts: [node.prompt || ''],
          settings: {
            genType: node.media_type || gd.genType,
            ratio: node.ratio || gd.ratio,
            model: node.model || (isVid ? gd.videoModel : gd.imageModel),
            isFrames: node.media_type === 'Video' && node.video_input_type === 'Frames',
            quantity: quantity,
          },
          refFileIds: cappedRefIds,
          // Đọc từ node settings — user có thể bật auto-download nếu không dùng Download node
          // Check feature gate: nếu không có quyền, force autoDownload = false
          autoDownload: (window.featureGate?.canUse('auto_download') ?? false) &&
            (node.auto_download === true || node.auto_download === '1' || node.auto_download === 1),
          // Forward resolution từ node config xuống pipeline.
          // Trước fix: bỏ qua → PromptQueue fallback DOM settings → user config 1080p nhưng download 720p.
          downloadResolution: node.download_resolution || null,
          videoDownloadResolution: node.video_download_resolution || null,
          taskName: workflow?.wf_name || null,
        });

        // Extract result data từ pipeline
        const resultTileIds = pipelineResult.resultTileIds || [];
        console.log(`[WorkflowExecutor] >>> PIPELINE returned ${resultTileIds.length} tiles:`, resultTileIds.slice(0, 5));
        nodeLog(`Pipeline trả về ${resultTileIds.length} tile`, 'info');

        // Track tiles đã download bởi pipeline (để Download node không download lại)
        // autoDownload = true nghĩa là PromptQueue đã download tiles này
        const canUseAutoDownload = window.featureGate?.canUse('auto_download') ?? false;
        const nodeAutoDownload = canUseAutoDownload &&
          (node.auto_download === true || node.auto_download === '1' || node.auto_download === 1);
        if (nodeAutoDownload && resultTileIds.length > 0) {
          if (!this._downloadedTileIds) this._downloadedTileIds = new Set();
          for (const tid of resultTileIds) {
            this._downloadedTileIds.add(tid);
          }
        }
        // Build thumbnails ở format tương thích với WorkflowEditor node:completed handler
        // Format: { tileId: { thumbnail, type, file_name } } (object, KHÔNG phải flat string)
        const resultThumbnails = {};
        const resultFileNames = {};
        if (pipelineResult.resultThumbnails) {
          for (const [tid, info] of Object.entries(pipelineResult.resultThumbnails)) {
            if (info?.thumbnail) {
              resultThumbnails[tid] = {
                thumbnail: info.thumbnail,
                type: info.type || 'image',
                file_name: info.file_name || '',
                ...(info.video_url && { video_url: info.video_url })  // Preserve video_url for video tiles
              };
              if (info.file_name) resultFileNames[tid] = info.file_name;
            }
          }
        }

        // Scan thêm từ DOM nếu thumbnails còn thiếu
        if (resultTileIds.length > 0 && window.MessageBridge) {
          const missingTiles = resultTileIds.filter(id => !resultThumbnails[id]);
          if (missingTiles.length > 0) {
            try {
              const scanResult = await MessageBridge.getThumbnailsByIds(missingTiles);
              const results = scanResult?.results || {};
              for (const tid of missingTiles) {
                if (results[tid]?.thumbnail) {
                  resultThumbnails[tid] = {
                    thumbnail: results[tid].thumbnail,
                    type: results[tid].type || 'image',
                    file_name: results[tid].file_name || '',
                    ...(results[tid].video_url && { video_url: results[tid].video_url })  // Preserve video_url for video tiles
                  };
                  if (results[tid].file_name) resultFileNames[tid] = results[tid].file_name;
                }
              }
            } catch (e) {
              console.warn('[WorkflowExecutor] Scan pipeline result thumbnails failed:', e.message);
            }
          }
        }

        return {
          fileIds: resultTileIds,
          duration: 0,
          thumbnails: resultThumbnails,
          fileNames: resultFileNames,
          pipelineResult,
        };
      }

      // 2. Apply settings (media type, ratio, model) — only once
      const gd = await this._getGenDefaults();
      const isVid = (node.media_type || gd.genType) === 'Video';
      nodeLog(`Cài đặt: ${node.media_type || gd.genType} / ${node.ratio || gd.ratio} / ${node.model || (isVid ? gd.videoModel : gd.imageModel)}`);

      // Quantity đã được set qua _applySettings (click x1/x2/x3/x4)
      // Mỗi node chỉ submit 1 lần, Flow sẽ tạo quantity ảnh

      if (this.shouldStop) throw new Error('Execution stopped by user');

      // Phase 5.2: Ensure node is NOT marked as submitted at start
      this._submittedNodes?.delete(node.node_id);

      // CRITICAL SECTION (editor mutex): serialize TOÀN BỘ chuỗi editor operations
      // Flow chỉ có 1 editor → parallel nodes PHẢI chờ nhau hoàn thành:
      // apply settings → clear editor → add ref → insert text → submit → chờ tile placeholder
      // Nếu không serialize: node_02 clear editor XÓA text của node_01 đang chờ submit
      const accum = nodeAccum || this._currentNodeAccum || { thumbnails: {}, fileNames: {} };
      let preTileIds, preFileNames;
      const releaseSubmitMutex = await this._acquireSubmitMutex();
      try {
        // 2b. Apply settings (trong mutex để tránh conflict settings giữa parallel nodes)
        await this._applySettings(node);

        // [Bug fix] 2c. Xóa ref images cũ TRƯỚC khi clear text + add ref mới.
        // clearEditor() chỉ xóa text Slate, KHÔNG xóa ref image thumbnails (chúng ở ngoài Slate area).
        // Nếu skip bước này → ref images từ run trước còn lại → submit kèm ảnh sai.
        // Sync với EditorExecutor.processItem() pattern.
        await this._removeExistingRefImages();
        await this._sleep(200); // Settle delay sau khi xóa refs

        // 3. Clear editor
        await this._clearEditor();
        await this._sleep(this._getClearEditorDelay());

        // 4. Add reference images / frames (với file_name fallback)
        if (isFramesResult && node.media_type === 'Video' && node.video_input_type === 'Frames') {
          // Frames mode: rawInputFileIds = {frame1, frame2}
          // Filter synthetic IDs (hiếm khi xảy ra nhưng để an toàn)
          const frame1Valid = rawInputFileIds.frame1 && !syntheticIdPattern.test(rawInputFileIds.frame1);
          const frame2Valid = rawInputFileIds.frame2 && !syntheticIdPattern.test(rawInputFileIds.frame2);
          if (frame1Valid) {
            nodeLog(`Thêm Frame 1: ${rawInputFileIds.frame1.substring(0, 20)}...`);
            await this._addFileToPrompt(rawInputFileIds.frame1, fnLookup[rawInputFileIds.frame1]);
            await this._sleep(500);
          } else if (rawInputFileIds.frame1) {
            nodeLog('Frame 1 là synthetic ID — bỏ qua', 'warn');
          }
          if (frame2Valid) {
            nodeLog(`Thêm Frame 2: ${rawInputFileIds.frame2.substring(0, 20)}...`);
            await this._addFileToPrompt(rawInputFileIds.frame2, fnLookup[rawInputFileIds.frame2]);
            await this._sleep(500);
          } else if (rawInputFileIds.frame2) {
            nodeLog('Frame 2 là synthetic ID — bỏ qua', 'warn');
          }
        } else {
          if (inputFileIds.length > 0) {
            nodeLog(`Thêm ${inputFileIds.length} ảnh tham chiếu`);
            log(`Adding ${inputFileIds.length} ref images:`, inputFileIds);
          }
          for (const fileId of inputFileIds) {
            log('Adding ref image:', fileId);
            await this._addFileToPrompt(fileId, fnLookup[fileId]);
            await this._sleep(800);
          }
        }

        // Check stop trước khi submit (chưa submit thì dừng ngay)
        if (this.shouldStop) throw new Error('Execution stopped by user');

        // 5. Insert prompt
        nodeLog(`Nhập prompt: "${(node.prompt || '').substring(0, 40)}..."`);
        await this._insertPrompt(node.prompt || '');

        // 6. Chờ Slate editor xử lý xong (derived: inputTimeout × 0.5)
        await this._sleep(this._getSubmitDelay());

        // Check stop trước submit lần cuối
        if (this.shouldStop) throw new Error('Execution stopped by user');

        // 7. Capture tile IDs NGAY TRƯỚC submit (trong mutex → thấy tiles từ nodes trước)
        preTileIds = await this._getCurrentTileIds(accum);
        console.log(`[WorkflowExecutor] preTileIds captured: ${preTileIds.length} tiles`, preTileIds.slice(0, 5));
        nodeLog(`Snapshot ${preTileIds.length} tile có sẵn TRƯỚC submit (baseline)`, 'info');

        // 8. Click submit
        await this._clickSubmit();
        // Phase 5.2: Mark this specific node as submitted
        this._submittedNodes?.add(node.node_id);
        log('Prompt submitted, waiting for result...');
        nodeLog(`Đã submit (x${quantity}), chờ kết quả...`, 'info');
        window.eventBus.emit('node:submitted', { node });

        // Chờ tile placeholder xuất hiện trong DOM (Google Flow tạo gần như ngay lập tức)
        // Sau khi tile xuất hiện, node tiếp theo sẽ thấy nó trong preTileIds
        await this._sleep(1500);
      } finally {
        releaseSubmitMutex();
      }

      // 9. Monitor tiles (concurrent — không cần mutex)
      // CRITICAL: KHÔNG fallback `?? this._lastPreFileNames` — instance singleton bị overwrite
      // bởi parallel node sau, gây Node A lấy snapshot Node B → 15s grace timer accept tile cũ.
      // Per-node accum.preFileNames đã set chính xác trong _getCurrentTileIds (line ~4085).
      preFileNames = accum.preFileNames || null;
      console.log(`[WorkflowExecutor] CALLING _waitForNewTiles (timeout=${this.settings.tileTimeout}ms, expected quantity=${quantity})`);
      nodeLog(`Đang chờ ${quantity} tile mới (timeout ${Math.round(this.settings.tileTimeout/1000)}s)...`, 'info');
      const newTileIds = await this._waitForNewTiles(preTileIds, this.settings.tileTimeout, preFileNames, accum, quantity);
      console.log(`[WorkflowExecutor] _waitForNewTiles RETURNED ${newTileIds.length} tiles:`, newTileIds.slice(0, 5));
      allNewTileIds.push(...newTileIds);
      nodeLog(`Nhận ${newTileIds.length} kết quả mới`, 'success');

      // Phase 5.2: Remove node from submitted tracking after completion
      this._submittedNodes?.delete(node.node_id);

      const duration = Date.now() - startTime;
      log(`Node "${node.node_name}" completed in ${duration}ms, got ${allNewTileIds.length} tiles`);

      return {
        fileIds: allNewTileIds,
        duration,
        thumbnails: accum.thumbnails,
        fileNames: accum.fileNames
      };
    }

    /**
     * Execute Download node - tải kết quả
     */
    async _executeDownloadNode(node, workflow, emitLog) {
      const startTime = Date.now();
      console.log(`[WorkflowExecutor] >>> DOWNLOAD NODE START "${node.node_name || node.node_id}", collectAll=${node.download_collect_all}`);

      // Check auto_download feature gate — Download node cũng cần quyền
      const canUseAutoDownload = window.featureGate?.canUse('auto_download') ?? false;
      if (!canUseAutoDownload) {
        emitLog('Gói hiện tại không hỗ trợ tải xuống tự động. Vui lòng nâng cấp.', 'warn');
        return { fileIds: [], duration: Date.now() - startTime };
      }

      const collectAll = node.download_collect_all === true || node.download_collect_all === '1' || node.download_collect_all === 1;

      let inputFileIds;
      if (collectAll) {
        // Thu thap tat ca result_file_ids tu moi node trong workflow
        inputFileIds = this._collectAllWorkflowFileIds(workflow.nodes);
        console.log(`[WorkflowExecutor] >>> DOWNLOAD collectAll=TRUE → collected ${inputFileIds.length} tiles từ TẤT CẢ workflow nodes (kể cả nodes chưa hoàn thành!)`);
      } else {
        // Phase WK-1.4.7: Ưu tiên port `media_in`, fallback legacy collect (workflow cũ)
        inputFileIds = this._collectPortInputs(node, 'media_in', workflow.nodes, workflow.edges);
        if (!inputFileIds || inputFileIds.length === 0) {
          inputFileIds = this._collectInputFileIds(node, workflow.nodes, workflow.edges);
        }
        console.log(`[WorkflowExecutor] >>> DOWNLOAD via port/upstream → collected ${inputFileIds?.length || 0} tiles:`, inputFileIds?.slice(0, 5));
      }

      if (!Array.isArray(inputFileIds) || inputFileIds.length === 0) {
        throw new Error('Không có file để tải');
      }

      // Build file_name lookup for cross-project validation
      const fnLookup = this._buildFileNameLookup(node, workflow);
      // Dual URL — build provider URL lookup từ TẤT CẢ upstream nodes có result_provider_urls.
      // Tile có entry → download URL gốc Grok/ChatGPT (chất lượng 100%) thay vì Flow re-encoded.
      const providerUrlLookup = this._buildProviderUrlLookup(workflow.nodes);

      // Detect video: check upstream node media_type hoặc node config
      const hasVideoUpstream = this._hasVideoUpstreamNode(node, workflow);
      const resolution = hasVideoUpstream
        ? (node.video_download_resolution || '720p')
        : (node.download_resolution || '1k');

      emitLog(`Tải ${inputFileIds.length} file (${resolution.toUpperCase()})...`);
      let downloaded = 0;
      let skippedCrossProject = 0;

      // Ensure dedup set exists (để tránh Download node khác download lại cùng tile)
      if (!this._downloadedTileIds) this._downloadedTileIds = new Set();

      for (const fileId of inputFileIds) {
        if (this.shouldStop) break;

        // NOTE: Dedup chỉ áp dụng giữa nhiều Download nodes (tránh download cùng tile 2 lần).

        // Cross-project validation: verify file_name before download
        const expectedFileName = fnLookup[fileId];
        if (expectedFileName && this._isContentScriptContext()) {
          const tile = document.querySelector(`[data-tile-id="${fileId}"]`);
          if (tile) {
            const currentFileName = this._extractFileNameFromTile(tile);
            if (currentFileName && currentFileName !== expectedFileName) {
              emitLog(`Tile ${fileId.substring(0, 16)} thuộc project khác, bỏ qua`, 'warn');
              skippedCrossProject++;
              continue;
            }
          }
        }

        // Build ten file tu template
        const promptText = this._buildDownloadFileName(node, workflow, downloaded);
        const fileName = fnLookup[fileId] || null;
        // Subfolder: ưu tiên node.download_folder, để trống = dùng workflow name (undefined)
        const subfolder = node.download_folder ? node.download_folder : undefined;

        try {
          // Dual URL: tile có URL provider gốc → fetch direct (chất lượng 100%).
          // Fallback Flow context menu nếu fetch fail (URL provider có thể đã expire TTL).
          const providerData = providerUrlLookup[fileId];
          if (providerData?.url) {
            const ok = await this._downloadProviderTileDirect(fileId, providerData, promptText, downloaded + 1, subfolder, fileName);
            if (!ok) {
              await this._downloadSingleTile(fileId, promptText, resolution, fileName, null, subfolder);
            }
          } else {
            await this._downloadSingleTile(fileId, promptText, resolution, fileName, null, subfolder);
          }
          this._downloadedTileIds.add(fileId);
          downloaded++;
          emitLog(`Đã tải ${downloaded}/${inputFileIds.length}`, 'success');
        } catch (err) {
          emitLog(`Lỗi tải file ${fileId}: ${err.message}`, 'warn');
        }

        await this._sleep(500);
      }

      if (skippedCrossProject > 0) {
        emitLog(`Bỏ qua ${skippedCrossProject} file thuộc project khác`, 'warn');
      }

      return { fileIds: [], duration: Date.now() - startTime };
    }

    /**
     * Check if any upstream node (connected input) is video type
     */
    _hasVideoUpstreamNode(node, workflow) {
      if (!workflow?.edges || !workflow?.nodes) return false;
      const inputEdges = workflow.edges.filter(e => e.target_node_id === node.node_id);
      for (const edge of inputEdges) {
        const sourceNode = workflow.nodes.find(n => n.node_id === edge.source_node_id);
        if (!sourceNode) continue;
        // Flow generate node convention
        if (sourceNode.media_type === 'Video') return true;
        // Phase G-6 bug fix: Grok node lưu mode trong `grok_mode` (image/video), KHÔNG có media_type.
        // Trước fix: Grok video upstream → Download node default '1k' (image res) thay vì '720p' (video).
        const nodeType = sourceNode.node_type || sourceNode.type;
        if (nodeType === 'grok' && sourceNode.grok_mode === 'video') return true;
        // Result thumbnails với type='video' → upstream đã produce video tile (vd Grok bridge MP4 sang Flow)
        const thumbs = sourceNode.result_thumbnails || {};
        for (const key of Object.keys(thumbs)) {
          const t = thumbs[key];
          if (t && typeof t === 'object' && t.type === 'video') return true;
        }
      }
      return false;
    }

    /**
     * Collect ALL result_file_ids from every node in the workflow
     */
    _collectAllWorkflowFileIds(nodes) {
      const fileIds = [];
      for (const n of (nodes || [])) {
        if (n.node_type === 'download') continue;
        if (n.result_file_ids) {
          const ids = (n.result_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          fileIds.push(...ids);
        }
      }
      return [...new Set(fileIds)];
    }

    /**
     * Build download file name from template variables
     */
    _buildDownloadFileName(node, workflow, index) {
      const template = node.download_file_template;
      if (!template) return node.node_name || 'download';

      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

      // Sanitize: remove path separators + invalid filename chars (Windows/Mac/Linux compat).
      // Áp dụng cho values TỪ user data (workflow.name, node.node_name, node.content),
      // KHÔNG cho whole template (template do user define, có thể có / cố ý).
      const sanitize = (val) => String(val || '').replace(/[\/\\:*?"<>|]/g, '_').trim() || 'untitled';

      return template
        .replace(/\{workflow\}/g, sanitize(workflow.name || 'workflow'))
        .replace(/\{node\}/g, sanitize(node.node_name || 'download'))
        .replace(/\{index\}/g, String(index + 1))
        .replace(/\{date\}/g, date)
        .replace(/\{time\}/g, time)
        .replace(/\{prompt\}/g, sanitize(node.content || ''));
    }

    /**
     * Execute Telegram node - gửi ảnh qua Telegram API
     * Pass-through: trả về input fileIds cho downstream nodes
     */
    async _executeTelegramNode(node, workflow, emitLog) {
      const startTime = Date.now();

      // Feature gate check
      const canUseTelegram = (window.featureGate?.canUse('telegram_enabled') ?? false) &&
        (window.featureGate?.canUse('telegram_workflow') ?? false);
      if (!canUseTelegram) {
        emitLog('Tính năng Telegram bị khóa trong gói hiện tại. Vui lòng nâng cấp.', 'warn');
        // Pass-through: return input files anyway (port-aware, fallback legacy)
        let inputFileIds = this._collectPortInputs(node, 'media_in', workflow.nodes, workflow.edges);
        if (!inputFileIds || inputFileIds.length === 0) {
          inputFileIds = this._collectInputFileIds(node, workflow.nodes, workflow.edges);
        }
        return { fileIds: inputFileIds, duration: Date.now() - startTime };
      }

      // Validate chat_id
      const chatId = node.telegram_chat_id;
      if (!chatId) {
        throw new Error('Chưa nhập Telegram Chat ID');
      }

      // Collect input tiles — Phase WK-1.4.7: ưu tiên port `media_in`, fallback legacy
      let inputFileIds = this._collectPortInputs(node, 'media_in', workflow.nodes, workflow.edges);
      if (!inputFileIds || inputFileIds.length === 0) {
        inputFileIds = this._collectInputFileIds(node, workflow.nodes, workflow.edges);
      }
      if (!Array.isArray(inputFileIds) || inputFileIds.length === 0) {
        throw new Error('Không có ảnh để gửi qua Telegram');
      }

      // Build file_name lookup for cross-project validation
      const fnLookup = this._buildFileNameLookup(node, workflow);

      // Extract CDN URLs from tiles
      const images = [];
      let skippedCrossProject = 0;

      for (const fileId of inputFileIds) {
        if (this.shouldStop) break;

        // Cross-project validation
        const expectedFileName = fnLookup[fileId];
        if (expectedFileName && this._isContentScriptContext()) {
          const tile = document.querySelector(`[data-tile-id="${fileId}"]`);
          if (tile) {
            const currentFileName = this._extractFileNameFromTile(tile);
            if (currentFileName && currentFileName !== expectedFileName) {
              emitLog(`Tile ${fileId.substring(0, 16)} thuộc project khác, bỏ qua`, 'warn');
              skippedCrossProject++;
              continue;
            }
          }
        }

        // Extract media URL and type
        let mediaUrl = null;
        let mediaType = 'image';

        // 1. Try result_thumbnails cache from upstream nodes
        for (const n of (workflow.nodes || [])) {
          if (n.result_thumbnails && n.result_thumbnails[fileId]) {
            const thumb = n.result_thumbnails[fileId];
            if (typeof thumb === 'object') {
              // Check for video
              if (thumb.type === 'video' && thumb.video_url) {
                mediaUrl = thumb.video_url;
                mediaType = 'video';
              } else if (thumb.thumbnail && thumb.thumbnail.startsWith('https://')) {
                mediaUrl = thumb.thumbnail;
                mediaType = thumb.type || 'image';
              }
            } else if (thumb && thumb.startsWith('https://')) {
              mediaUrl = thumb;
            }
            if (mediaUrl) break;
          }
        }

        // 2. Fallback: DOM query
        if (!mediaUrl && this._isContentScriptContext()) {
          const tile = document.querySelector(`[data-tile-id="${fileId}"]`);
          if (tile) {
            // Check video first
            const video = tile.querySelector('video[src]');
            if (video && video.src && video.src.startsWith('https://')) {
              mediaUrl = video.src;
              mediaType = 'video';
            } else {
              const img = tile.querySelector('img[src*="googleusercontent.com"], img[src*="google.com"]');
              if (img && img.src && img.src.startsWith('https://')) {
                mediaUrl = img.src;
                mediaType = 'image';
              }
            }
          }
        }

        if (mediaUrl) {
          images.push({ url: mediaUrl, type: mediaType, file_id: fileId });
        }
      }

      if (skippedCrossProject > 0) {
        emitLog(`Bỏ qua ${skippedCrossProject} file thuộc project khác`, 'warn');
      }

      if (images.length === 0) {
        throw new Error('Không tìm thấy URL ảnh hợp lệ để gửi');
      }

      // Convert to base64 (giống TelegramExecutor)
      emitLog(`Đang tải ${images.length} file để gửi qua Telegram...`);
      const mediaItems = await this._convertMediaToBase64ForTelegram(images);

      if (mediaItems.length === 0) {
        throw new Error('Không thể tải file để gửi qua Telegram');
      }

      // Send via API
      const sendMode = node.telegram_send_mode || 'single';
      const message = node.telegram_message || '';

      emitLog(`Gửi ${mediaItems.length} file qua Telegram...`);

      try {
        const response = await window.authManager._apiCall('POST', 'telegram/send-workflow-images', {
          chat_id: chatId,
          images: mediaItems,
          message: message,
          send_mode: sendMode,
        });

        const sentCount = response?.sent_count || response?.data?.sent_count || 0;
        emitLog(`Đã gửi ${sentCount} ảnh qua Telegram`, 'success');
      } catch (err) {
        emitLog(`Lỗi gửi Telegram: ${err.message}`, 'warn');
        // Don't throw - allow workflow to continue (pass-through)
      }

      // Pass-through: return input file IDs for downstream nodes
      return {
        fileIds: inputFileIds,
        duration: Date.now() - startTime,
      };
    }

    /**
     * Convert media (images/videos) sang base64 để gửi qua Telegram.
     * Giống logic TelegramExecutor._convertThumbnailsToBase64()
     * @param {Array} mediaItems - Array of { url, type, file_id }
     * @returns {Array} Array of { base64, type, mime_type }
     */
    async _convertMediaToBase64ForTelegram(mediaItems) {
      const results = [];
      for (const item of mediaItems) {
        if (this.shouldStop) break;
        try {
          const mediaType = item.type || 'image';
          const url = item.url;
          if (!url) continue;

          // Fetch media từ Flow với timeout 30s. KHÔNG credentials: 'include' vì
          // Flow CDN trả Allow-Origin: '*' → CORS block. Signed URL đã đủ authenticate.
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          let response;
          try {
            response = await fetch(url, { signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }
          if (!response.ok) {
            console.warn('[WorkflowExecutor] Failed to fetch media:', url, response.status);
            continue;
          }

          const blob = await response.blob();

          // Video quá lớn (>50MB) thì skip (Telegram limit)
          if (mediaType === 'video' && blob.size > 50 * 1024 * 1024) {
            console.warn('[WorkflowExecutor] Video too large for Telegram:', blob.size);
            continue;
          }

          // Convert blob sang base64
          const base64 = await this._blobToBase64(blob);

          results.push({
            type: mediaType,
            base64: base64,
            mime_type: blob.type || (mediaType === 'video' ? 'video/mp4' : 'image/png'),
          });
        } catch (err) {
          console.warn('[WorkflowExecutor] Error converting media to base64:', item.url, err.message);
        }
      }
      return results;
    }

    /**
     * Convert Blob sang base64 string (không có prefix data:...)
     */
    _blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Loại bỏ prefix "data:image/png;base64,"
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    /**
     * Execute Delay node - chờ X giây
     */
    async _executeDelayNode(node, emitLog) {
      const seconds = node.delay_seconds || 3;
      emitLog(`Chờ ${seconds} giây...`);

      // Time-based với poll 200ms để stop signal phản hồi nhanh hơn (trễ tối đa 200ms thay vì 1s)
      const startTime = Date.now();
      const targetMs = seconds * 1000;
      while (Date.now() - startTime < targetMs) {
        if (this.shouldStop) break;
        const remaining = targetMs - (Date.now() - startTime);
        await this._sleep(Math.min(200, remaining));
      }

      // Pass through input file IDs — ưu tiên port `any_in`, fallback legacy collect
      let inputFileIds = this._collectPortInputs(node, 'any_in', this.currentWorkflow.nodes, this.currentWorkflow.edges);
      if (!inputFileIds || inputFileIds.length === 0) {
        inputFileIds = this._collectInputFileIds(node, this.currentWorkflow.nodes, this.currentWorkflow.edges);
      }

      return {
        fileIds: Array.isArray(inputFileIds) ? inputFileIds : [],
        duration: seconds * 1000
      };
    }

    /**
     * Image node: pass ref_file_ids as output (no generation)
     */
    async _executeImageNode(node, emitLog) {
      emitLog(`[IMAGE] Start: ref_file_ids=${node.ref_file_ids?.substring(0, 40)}`);
      emitLog(`[IMAGE] ref_file_names=${JSON.stringify(node.ref_file_names || {})}`);

      const refIds = node.ref_file_ids
        ? (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean)
        : [];

      if (refIds.length === 0) {
        emitLog('Node hình ảnh không có file tham chiếu', 'warning');
        return { fileIds: [], duration: 0 };
      }

      // BUG FIX: Sync ref_thumbnails/ref_file_names với ref_file_ids
      // Image node có thể bị mismatch (ref_file_ids có ID mà ref_thumbnails/ref_file_names không có)
      if (!node.ref_thumbnails || Array.isArray(node.ref_thumbnails)) node.ref_thumbnails = {};
      if (!node.ref_file_names || Array.isArray(node.ref_file_names)) node.ref_file_names = {};

      // Tìm IDs thiếu thumbnail
      const missingThumbIds = refIds.filter(fid => !node.ref_thumbnails[fid]);

      // Bước 1: Thử MediaRegistry trước
      for (const fid of missingThumbIds) {
        if (typeof MediaRegistry !== 'undefined') {
          const mrThumb = MediaRegistry.getThumb?.(fid);
          if (mrThumb) {
            node.ref_thumbnails[fid] = mrThumb;
            emitLog(`[IMAGE] Sync thumb từ MediaRegistry: ${fid.substring(0, 12)}`);
          }
          const mrName = MediaRegistry.getFileName?.(fid);
          if (mrName && !node.ref_file_names[fid]) {
            node.ref_file_names[fid] = mrName;
          }
        }
      }

      // Bước 2: DOM scan cho IDs vẫn còn thiếu thumbnail
      const stillMissing = refIds.filter(fid => !node.ref_thumbnails[fid]);
      if (stillMissing.length > 0 && window.MessageBridge?.getThumbnailsByIds) {
        emitLog(`[IMAGE] DOM scan cho ${stillMissing.length} IDs thiếu thumbnail...`);
        try {
          const scanResult = await window.MessageBridge.getThumbnailsByIds(stillMissing);
          const results = scanResult?.results || {};
          for (const [fileId, info] of Object.entries(results)) {
            if (info?.thumbnail) {
              node.ref_thumbnails[fileId] = info.thumbnail;
              emitLog(`[IMAGE] DOM scan found thumb: ${fileId.substring(0, 12)}`);
            }
            if (info?.file_name && !node.ref_file_names[fileId]) {
              node.ref_file_names[fileId] = info.file_name;
            }
          }
        } catch (scanErr) {
          emitLog(`[IMAGE] DOM scan failed: ${scanErr.message}`, 'warn');
        }
      }

      emitLog(`[IMAGE] ref_thumbnails keys after sync: ${Object.keys(node.ref_thumbnails).join(', ') || '(empty)'}`);

      // Upload pending local files nếu có
      const oldRefIds = node.ref_file_ids;
      if (node.ref_file_ids.includes('upload_') && typeof window.uploadPendingFiles === 'function') {
        emitLog(window.I18n?.t('workflow.uploadingLocalImages') || 'Uploading local images to Flow...', 'info');
        node.ref_file_ids = await window.uploadPendingFiles(node.ref_file_ids);
        // Sync ref_file_ids mới vào Drawflow data
        if (node.ref_file_ids !== oldRefIds) {
          // Capture ref_file_names từ GenTab.fileNameCache
          const newIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          if (!node.ref_file_names) node.ref_file_names = {};
          for (const newId of newIdArr) {
            if (MediaRegistry.getFileName(newId)) {
              node.ref_file_names[newId] = MediaRegistry.getFileName(newId);
            }
          }
          window.eventBus?.emit('node:ref_replaced', {
            nodeId: node.node_id,
            oldRefIds,
            newRefIds: node.ref_file_ids,
            refFileNames: node.ref_file_names,
            refThumbnails: node.ref_thumbnails
          });

          // Persist updated ref data after local file upload
          emitLog('[Upload] Persisting ref data after local file upload');
          try {
            await window.storageManager?.updateNodeStatus(
              this.currentWorkflow.wf_id,
              node.node_id,
              { ref_file_ids: node.ref_file_ids, ref_thumbnails: node.ref_thumbnails, ref_file_names: node.ref_file_names }
            );
          } catch (e) {
            log('Failed to persist ref update:', e.message);
          }
        }
      }

      // Handle import keys (upload_import_*) - fetch từ CDN và upload lên Flow
      const hasImageImportKeys = node.ref_file_ids && node.ref_file_ids.includes('upload_import_');
      if (hasImageImportKeys && typeof window.reuploadMissingFiles === 'function') {
        const imageImportThumbMap = node.ref_thumbnails || {};
        emitLog(`[Import] Xử lý ${Object.keys(imageImportThumbMap).length} import keys từ CDN...`);
        const uploadedImageImport = await window.reuploadMissingFiles(node.ref_file_ids, imageImportThumbMap, null, null);
        if (uploadedImageImport !== node.ref_file_ids) {
          emitLog(`[Import] Upload thành công: ${uploadedImageImport.substring(0, 60)}...`);
          node.ref_file_ids = uploadedImageImport;
          const newImageIdArr = (uploadedImageImport || '').split(',').map(s => s.trim()).filter(Boolean);
          if (!node.ref_file_names) node.ref_file_names = {};
          if (!node.ref_thumbnails) node.ref_thumbnails = {};
          // Bug fix: Ưu tiên _lastReuploadTileDetails (có thumbnail mới từ Flow)
          // Fallback MediaRegistry nếu không có
          const reuploadDetails = window._lastReuploadTileDetails || {};
          for (const newId of newImageIdArr) {
            const detail = reuploadDetails[newId];
            if (detail?.file_name) {
              node.ref_file_names[newId] = detail.file_name;
            } else if (MediaRegistry.getFileName(newId)) {
              node.ref_file_names[newId] = MediaRegistry.getFileName(newId);
            }
            if (detail?.thumbnailUrl) {
              node.ref_thumbnails[newId] = detail.thumbnailUrl;
            } else if (MediaRegistry.getThumb(newId)) {
              node.ref_thumbnails[newId] = MediaRegistry.getThumb(newId);
            }
          }
          for (const key of Object.keys(imageImportThumbMap)) {
            if (key.startsWith('upload_import_')) {
              delete node.ref_file_names[key];
              delete node.ref_thumbnails[key];
            }
          }
          window.eventBus?.emit('node:ref_replaced', {
            nodeId: node.node_id,
            oldRefIds: Object.keys(imageImportThumbMap).join(', '),
            newRefIds: node.ref_file_ids,
            refFileNames: node.ref_file_names,
            refThumbnails: node.ref_thumbnails
          });
          // CRITICAL: Persist updated ref data để lần chạy sau không cần reupload import keys
          try {
            await window.storageManager?.updateNodeStatus(
              this.currentWorkflow.wf_id,
              node.node_id,
              { ref_file_ids: node.ref_file_ids, ref_thumbnails: node.ref_thumbnails, ref_file_names: node.ref_file_names }
            );
            emitLog('[Import] Đã lưu ref data vào storage');
          } catch (e) {
            log('[Import] Failed to persist ref update:', e.message);
          }
        }
      }

      // Correct stale tile IDs (5-tầng)
      if (node.ref_file_ids && !node.ref_file_ids.includes('upload_')) {
        // Lưu original IDs trước correctFileIds để reupload cache lookup đúng key
        const originalImageRefIds = node.ref_file_ids;
        const thumbMap = { ...(node.ref_thumbnails || {}), ...(node.result_thumbnails || {}) };
        // BUGFIX: Dùng ref_file_names cho ref correction
        const fnMap = { ...(node.ref_file_names || {}), ...(node.result_file_names || {}) };
        if (typeof window.correctFileIds === 'function' && (Object.keys(thumbMap).length > 0 || Object.keys(fnMap).length > 0)) {
          const { correctedIds, changed } = await window.correctFileIds(node.ref_file_ids, thumbMap, fnMap);
          if (changed) {
            emitLog('Đã cập nhật ref image IDs (tile ID thay đổi sau reload)');
            node.ref_file_ids = correctedIds;
          }
        }

        // Tầng 5: Re-upload nếu vẫn còn missing
        // Truyền thumbnail map trực tiếp — không phụ thuộc GenTab (popup window không có)
        if (typeof window.reuploadMissingFiles === 'function') {
          const beforeReupload = node.ref_file_ids;
          const thumbMap2 = { ...(node.ref_thumbnails || {}), ...(node.result_thumbnails || {}) };
          // CRITICAL: Truyền file_names map để check file_name trước (tránh reupload không cần thiết)
          const imageRefFileNamesMap = { ...(node.ref_file_names || {}), ...(node.result_file_names || {}) };
          const updated = await window.reuploadMissingFiles(node.ref_file_ids, thumbMap2, originalImageRefIds, imageRefFileNamesMap);
          if (updated !== beforeReupload) {
            emitLog('Đã re-upload ảnh tham chiếu bị thiếu trên Flow');
            node.ref_file_ids = updated;

            // Cập nhật ref_thumbnails + ref_file_names với new IDs từ reupload
            const oldArr = (beforeReupload || '').split(',').map(s => s.trim()).filter(Boolean);
            const newArr = (updated || '').split(',').map(s => s.trim()).filter(Boolean);
            if (!node.ref_thumbnails) node.ref_thumbnails = {};
            if (!node.ref_file_names) node.ref_file_names = {};
            for (let i = 0; i < oldArr.length && i < newArr.length; i++) {
              if (oldArr[i] !== newArr[i]) {
                // Transfer old data sang new key
                if (node.ref_thumbnails[oldArr[i]]) {
                  node.ref_thumbnails[newArr[i]] = node.ref_thumbnails[oldArr[i]];
                  delete node.ref_thumbnails[oldArr[i]];
                }
                if (node.ref_file_names?.[oldArr[i]]) {
                  node.ref_file_names[newArr[i]] = node.ref_file_names[oldArr[i]];
                  delete node.ref_file_names[oldArr[i]];
                }
                // Cập nhật với NEW data từ reupload tileDetails hoặc GenTab fallback
                const reupDetails = window._lastReuploadTileDetails || {};
                const newThumb = reupDetails[newArr[i]]?.thumbnailUrl || MediaRegistry.getThumb(newArr[i]);
                const newFileName = reupDetails[newArr[i]]?.file_name || MediaRegistry.getFileName(newArr[i]);
                emitLog(`[Reupload] ${oldArr[i]} → ${newArr[i]}, file_name=${newFileName || 'NULL'}`);
                if (newThumb) {
                  node.ref_thumbnails[newArr[i]] = newThumb;
                }
                if (newFileName) {
                  node.ref_file_names[newArr[i]] = newFileName;
                } else {
                  emitLog(`[Reupload] WARNING: No file_name for ${newArr[i]} - may reupload again next run`, 'warning');
                }
              }
            }

            // Persist updated ref data vào workflow storage để lần chạy sau không reupload lại
            emitLog(`[Persist] Saving ref data: ids=${node.ref_file_ids}, names=${JSON.stringify(node.ref_file_names)}`);
            try {
              await window.storageManager?.updateNodeStatus(
                this.currentWorkflow.wf_id,
                node.node_id,
                { ref_file_ids: node.ref_file_ids, ref_thumbnails: node.ref_thumbnails, ref_file_names: node.ref_file_names }
              );
              emitLog('[Persist] Ref data saved successfully');
            } catch (e) {
              emitLog('[Persist] FAILED to save ref data: ' + e.message, 'error');
            }

            window.eventBus?.emit('node:ref_replaced', {
              nodeId: node.node_id,
              oldRefIds: beforeReupload,
              newRefIds: node.ref_file_ids,
              refFileNames: node.ref_file_names,
              refThumbnails: node.ref_thumbnails
            });
          }
        }
      }

      const finalIds = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
      if (finalIds.length === 0) {
        emitLog('Không thể tìm lại ảnh tham chiếu trên Flow', 'warning');
      } else {
        emitLog(`Truyền ${finalIds.length} hình tham chiếu cho node tiếp theo`);
      }

      // CRITICAL FIX: Copy ref_* sang result_* để downstream nodes (ChatGPT/Grok) có thể merge thumbnails
      // Port merge tại _prepareNode kiểm tra src.result_thumbnails — nếu không set thì downstream không nhận thumbnails
      node.result_file_ids = node.ref_file_ids;
      node.result_thumbnails = { ...(node.ref_thumbnails || {}) };
      node.result_file_names = { ...(node.ref_file_names || {}) };

      // Trả fileNames từ node để downstream có thể dùng file_name correction
      // BUGFIX: Image node dùng ref_file_names (không phải result_file_names)
      const imageFileNames = { ...(node.ref_file_names || {}), ...(node.result_file_names || {}) };
      return { fileIds: finalIds, fileNames: imageFileNames, duration: 0 };
    }

    /**
     * Execute ChatGPT Image node — sinh ảnh qua ChatGPT provider rồi bridge sang Flow.
     * Flow:
     *   1. Feature gate check (chatgpt_enabled).
     *   2. Get adapter qua ProviderRegistry.
     *   3. ensureReady → emit chatgpt:login_required nếu fail.
     *   4. Smart Clone reconstruction + upload pending refs + resolve refs sang base64.
     *   5. ExecutionGate request token (chatgpt_run quota).
     *   6. adapter.submit({...}) → nhận imageUrls + tabId.
     *   7. Cross-provider bridge: mỗi imageUrl → MessageBridge.chatGPTBridgeToFlow → tileId trên Flow.
     *   8. Persist result_file_ids/thumbnails/file_names theo format object {tileId: {thumbnail, type, file_name}}.
     *   9. Auto-download nếu node.auto_download (skip nếu PromptQueue.isEnabled() — pipeline đã handle).
     *   10. ExecutionGate.complete + emit node:completed.
     */
    async _executeChatGPTImageNode(node, workflow, emitLog, nodeAccum = null) {
      const startTime = Date.now();

      // 1. Feature gate
      if (!window.featureGate || !window.featureGate.canUse('chatgpt_enabled')) {
        const err = new Error('Tính năng ChatGPT chưa được kích hoạt cho gói hiện tại');
        err.code = 'FEATURE_LOCKED';
        node.last_error = 'FEATURE_LOCKED';
        throw err;
      }

      // 2. Lấy adapter
      if (!window.ProviderRegistry) {
        throw new Error('ProviderRegistry chưa sẵn sàng');
      }
      const adapter = window.ProviderRegistry.get('chatgpt');
      if (!adapter) {
        throw new Error('ChatGPT adapter chưa được đăng ký');
      }

      // 3. ensureReady — bảo đảm tab + login + composer ready
      let tabId = null;
      try {
        const ready = await adapter.ensureReady();
        if (!ready || !ready.ready) {
          if (window.eventBus) {
            window.eventBus.emit('chatgpt:login_required', { error: ready?.error || 'NOT_LOGGED_IN' });
          }
          const err = new Error('ChatGPT chưa sẵn sàng: ' + (ready?.error || 'NOT_LOGGED_IN'));
          err.code = ready?.error || 'NOT_LOGGED_IN';
          node.last_error = err.code;
          throw err;
        }
        tabId = ready.tabId;
      } catch (e) {
        node.last_error = e?.code || 'NOT_READY';
        if (window.eventBus && e?.code !== 'FEATURE_LOCKED') {
          window.eventBus.emit('chatgpt:login_required', { error: e?.message });
        }
        throw e;
      }

      // 4. Smart Clone reconstruction
      if (!node.ref_file_ids && node.ref_file_names && Object.keys(node.ref_file_names).length > 0) {
        node.ref_file_ids = Object.keys(node.ref_file_names).join(', ');
        emitLog('Smart Clone: reconstructed ref_file_ids from ref_file_names: ' + node.ref_file_ids);
      } else if (!node.ref_file_ids && node.ref_thumbnails && Object.keys(node.ref_thumbnails).length > 0) {
        node.ref_file_ids = Object.keys(node.ref_thumbnails).join(', ');
        emitLog('Smart Clone: reconstructed ref_file_ids from ref_thumbnails: ' + node.ref_file_ids);
      }

      // 5. Upload pending refs (upload_xxx) qua uploadPendingFiles để có tileId Flow
      if (node.ref_file_ids && node.ref_file_ids.includes('upload_') && typeof window.uploadPendingFiles === 'function') {
        const oldRefIds = node.ref_file_ids;
        emitLog('Upload ảnh ref local lên Flow trước khi submit ChatGPT...', 'info');
        node.ref_file_ids = await window.uploadPendingFiles(node.ref_file_ids);
        if (node.ref_file_ids !== oldRefIds) {
          // Capture file_names + thumbnails MỚI từ MediaRegistry
          const newIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          if (!node.ref_file_names) node.ref_file_names = {};
          if (!node.ref_thumbnails) node.ref_thumbnails = {};
          for (const newId of newIdArr) {
            if (typeof MediaRegistry !== 'undefined') {
              if (MediaRegistry.getFileName?.(newId)) node.ref_file_names[newId] = MediaRegistry.getFileName(newId);
              if (MediaRegistry.getThumb?.(newId)) node.ref_thumbnails[newId] = MediaRegistry.getThumb(newId);
            }
          }
          // Cleanup keys cũ
          const oldIdArr = (oldRefIds || '').split(',').map(s => s.trim()).filter(Boolean);
          for (const oldId of oldIdArr) {
            if (oldId.startsWith('upload_')) {
              delete node.ref_file_names[oldId];
              if (node.ref_thumbnails) delete node.ref_thumbnails[oldId];
            }
          }
        }
      }

      // 6. Resolve refs từ tile IDs → fetch base64 (cap maxRefImages = 4)
      const refIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
      const maxRef = adapter.capabilities?.maxRefImages || 4;
      const refIdsCapped = refIdArr.slice(0, maxRef);
      if (refIdArr.length > maxRef) {
        emitLog(`ChatGPT: vượt giới hạn ${maxRef} ảnh ref — chỉ gửi ${maxRef} ảnh đầu`, 'warn');
      }
      const resolvedRefs = [];
      for (const fid of refIdsCapped) {
        // Lấy thumbnail URL (ưu tiên ref_thumbnails của node, fallback GenTab.thumbnailCache, fallback MediaRegistry)
        let thumb = '';
        const refThumb = node.ref_thumbnails?.[fid];
        if (typeof refThumb === 'string') thumb = refThumb;
        else if (refThumb?.thumbnail) thumb = refThumb.thumbnail;
        if (!thumb && window.GenTab?.thumbnailCache?.[fid]) thumb = window.GenTab.thumbnailCache[fid];
        if (!thumb && typeof MediaRegistry !== 'undefined' && MediaRegistry.getThumb?.(fid)) thumb = MediaRegistry.getThumb(fid);
        if (!thumb) {
          emitLog(`ChatGPT ref skip: không có thumbnail URL cho ${fid.substring(0, 12)}`, 'warn');
          continue;
        }
        const fileName = node.ref_file_names?.[fid] || (typeof MediaRegistry !== 'undefined' && MediaRegistry.getFileName?.(fid)) || `${fid}.png`;
        try {
          const fetchResp = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'fetchBlob', url: thumb }, (r) => resolve(r));
          });
          if (fetchResp?.success && fetchResp.base64) {
            const m = fetchResp.base64.match(/^data:(.+?);base64,(.+)$/);
            if (m) {
              resolvedRefs.push({ base64: m[2], name: fileName, type: m[1] });
            } else {
              resolvedRefs.push({ base64: fetchResp.base64, name: fileName, type: 'image/png' });
            }
          } else {
            emitLog(`ChatGPT ref fetch fail: ${fid.substring(0, 12)} (${fetchResp?.error || 'unknown'})`, 'warn');
          }
        } catch (err) {
          emitLog(`ChatGPT ref fetch error: ${fid.substring(0, 12)} - ${err.message}`, 'warn');
        }
      }
      emitLog(`ChatGPT refs resolved: ${resolvedRefs.length}/${refIdsCapped.length}`);

      // 7. ExecutionGate request token
      let cgToken = null;
      if (window.ExecutionGate) {
        try {
          const gate = await window.ExecutionGate.request('chatgpt_run', 1, {
            owner: 'workflow',
            label: workflow?.wf_name || 'chatgpt_node'
          });
          if (!gate?.allowed) {
            window.ExecutionGate.showDeniedDialog?.(gate, 'ChatGPT');
            const err = new Error(gate?.reason === 'QUOTA_EXCEEDED' ? 'Đã hết lượt ChatGPT hôm nay' : 'Không được phép chạy ChatGPT');
            err.code = gate?.reason || 'QUOTA_EXCEEDED';
            node.last_error = 'RATE_LIMIT';
            throw err;
          }
          cgToken = gate.token;
        } catch (e) {
          if (window.QuotaErrorHandler?.isQuotaError(e)) {
            node.last_error = e.code === 'FEATURE_LOCKED' ? 'FEATURE_LOCKED' : 'RATE_LIMIT';
            throw e;
          }
          console.warn('[WorkflowExecutor] ChatGPT ExecutionGate request failed, proceeding:', e.message);
        }
      }

      try {
        // 8. Submit qua adapter
        emitLog(`ChatGPT submit: ratio=${node.ratio || 'story'}, mode=${node.use_fallback_prefix || 'auto'}, refs=${resolvedRefs.length}`);

        // Tracker update để show UI running khi ChatGPT gen (mirror prompt_enhancing pattern)
        if (window.eventBus) {
          window.eventBus.emit('execution:tracker_update', {
            owner: 'workflow',
            phase: 'chatgpt_generating',
            promptText: 'ChatGPT generating...',
            genMode: 'image',
          });
        }
        // Đồng bộ với GenTab + Task pattern: truyền explicit fallbackPrefix từ user settings.
        // ChatGPTAdapter Option B ưu tiên giá trị này; nếu undefined → tự đọc storage qua _getFallbackPrefix().
        const _wfSettings = window.storageSettings?.getSettings?.() || {};
        const result = await adapter.submit({
          prompt: node.prompt || '',
          refFileIds: resolvedRefs,
          settings: {
            ratio: node.ratio || 'story',
            // Phase L: Centralized timeout — node override or SystemConfig fallback
            timeout: node.timeout_ms || window.SystemConfig?.getTimeout('chatgpt_timeout_ms') || 120000,
            useFallbackPrefix: node.use_fallback_prefix || 'auto',
            fallbackPrefix: _wfSettings.chatgptFallbackPrefix || 'Generate an image of: ',
          },
          taskName: workflow?.wf_name || null,
        });

        if (!result || !result.success) {
          // Map error code
          const errCode = result?.error || 'IMAGE_GEN_FAILED';
          node.last_error = errCode;
          // Persist last_error vào storage
          try {
            await window.storageManager?.updateNodeStatus(
              this.currentWorkflow?.wf_id || workflow?.wf_id,
              node.node_id,
              { last_error: errCode }
            );
          } catch (e) { /* ignore */ }

          // Hiện notification đỏ cho các error types quan trọng
          if (window.showProviderError && ['RATE_LIMIT', 'CONTENT_BLOCKED', 'IMAGE_GEN_FAILED', 'TEXT_ONLY', 'NETWORK', 'TIMEOUT', 'LIMIT_ALERT', 'CHALLENGE_TIMEOUT'].includes(errCode)) {
            window.showProviderError('chatgpt', errCode, result?.message);
          }

          // ExecutionGate complete và clear token ngay — catch block sẽ skip nếu cgToken=null
          if (cgToken && window.ExecutionGate) {
            await window.ExecutionGate.complete(cgToken, 'failed').catch(() => {});
            cgToken = null; // Prevent double-complete in catch block
          }
          // CONTENT_BLOCKED: retry 1 lần (false positive), sau đó fail
          // Track retry count trên node để giới hạn
          if (errCode === 'CONTENT_BLOCKED') {
            node._contentBlockedRetries = (node._contentBlockedRetries || 0) + 1;
            if (node._contentBlockedRetries > 1) {
              const err = new Error('ChatGPT: Prompt bị từ chối (vi phạm content policy)');
              err.code = 'CONTENT_BLOCKED';
              err.noRetry = true;
              throw err;
            }
            emitLog('ChatGPT content policy warning — thử lại 1 lần...', 'warn');
          }
          // Bug 60 fix (2026-05-13): TIMEOUT với hasPendingImage=true → noRetry.
          // ChatGPT đang gen ảnh ở backend (UI có image marker) — retry sẽ submit prompt LẦN 2 →
          // user thấy 2-3 ảnh gen liên tiếp. Mark noRetry để workflow fail gracefully thay vì spam.
          //
          // SUBSCRIPTION_REQUIRED / LIMIT_ALERT / FEATURE_LOCKED cũng không retry vì retry không giúp.
          const err = new Error('ChatGPT submit thất bại: ' + (result?.message || errCode));
          err.code = errCode;
          if (errCode === 'TIMEOUT' && result?.hasPendingImage) {
            err.noRetry = true;
            emitLog('ChatGPT TIMEOUT nhưng image đang gen ở backend — bỏ qua retry để tránh resubmit', 'warn');
          } else if (['SUBSCRIPTION_REQUIRED', 'LIMIT_ALERT', 'FEATURE_LOCKED', 'CHALLENGE_TIMEOUT'].includes(errCode)) {
            err.noRetry = true;
          }
          throw err;
        }

        // 9. Persist last_mode_used
        node.last_mode_used = result.imageModeUsed ? 'image_mode' : 'fallback_prefix';
        node.last_error = null;
        emitLog(`ChatGPT mode used: ${node.last_mode_used}`);

        const imageUrls = result.imageUrls || [];
        if (imageUrls.length === 0) {
          throw new Error('ChatGPT không trả về URL ảnh nào');
        }
        emitLog(`ChatGPT trả về ${imageUrls.length} ảnh — bridge sang Flow...`);

        // 10. Cross-provider bridge: mỗi imageUrl → upload sang Flow → tileId.
        // Bug 2 fix (audit 2026-05): apply Grok pattern với 3 fallback paths + 30s timeout.
        // Trước fix: bridge fail → break loop → uploadedTiles=[] → result_file_ids="" → result_provider_urls={}
        // → user mất hoàn toàn kết quả + quota đã consume. Giờ mỗi fail push synthetic
        // tile_id `chatgpt_xxx` + giữ provider URL gốc → Download node vẫn tải được qua
        // result_provider_urls (line ~3682). Synthetic ID không tìm trên Flow DOM nhưng
        // _correctUpstreamNodeIds (line ~1569) đã skip ChatGPT upstream → không gây error correction.
        const uploadedTiles = [];
        const cgTabId = result.tabId || tabId;
        const BRIDGE_TIMEOUT_MS = 60000; // 60s/url — tăng từ 30s để tránh timeout sớm + re-upload

        const bridgeWithTimeout = (url, tabId, fileName) => {
          return Promise.race([
            window.MessageBridge.chatGPTBridgeToFlow(url, tabId, fileName),
            new Promise((resolve) => setTimeout(() => resolve({ _timeout: true }), BRIDGE_TIMEOUT_MS)),
          ]);
        };

        emitLog(`[ChatGPT Bridge] Starting bridge for ${imageUrls.length} image(s), timeout: ${BRIDGE_TIMEOUT_MS}ms`);
        for (let i = 0; i < imageUrls.length; i++) {
          const url = imageUrls[i];
          const fileName = `chatgpt-${Date.now()}-${i + 1}.png`;
          const bridgeStartTime = Date.now();
          try {
            if (!window.MessageBridge?.chatGPTBridgeToFlow) {
              emitLog('MessageBridge.chatGPTBridgeToFlow không tồn tại — fallback synthetic tile', 'warn');
              uploadedTiles.push({
                tileId: `chatgpt_${Date.now()}_${i}`,
                thumbnail: url,
                file_name: fileName,
              });
              continue;
            }
            emitLog(`[ChatGPT Bridge] ${i + 1}/${imageUrls.length}: Starting upload...`);
            const bridgeResp = await bridgeWithTimeout(url, cgTabId, fileName);
            const bridgeDuration = Date.now() - bridgeStartTime;
            emitLog(`[ChatGPT Bridge] ${i + 1}/${imageUrls.length}: Completed in ${bridgeDuration}ms`);
            // bridgeResp có thể có dạng { success, tileDetails } hoặc array tileDetails trực tiếp
            const tileDetails = Array.isArray(bridgeResp) ? bridgeResp : (bridgeResp?.tileDetails || []);
            const isTimeout = bridgeResp?._timeout === true;
            if (tileDetails && tileDetails.length > 0) {
              const td = tileDetails[0];
              const tileId = td.id || td.tile_id || td.tileId;
              if (tileId) {
                const thumbUrl = td.thumbnailUrl || td.thumbnail_url || url;
                // BUG FIX: Extract file_name từ thumbnailUrl nếu td.file_name rỗng
                // Tránh reupload sau reload page do file_names mapping sai
                const flowFileName = td.file_name || extractFileNameFromUrl(thumbUrl);
                uploadedTiles.push({
                  tileId,
                  thumbnail: thumbUrl,
                  file_name: flowFileName,
                });
                emitLog(`Bridge ${i + 1}/${imageUrls.length}: tileId=${tileId.substring(0, 16)}` +
                        (flowFileName ? `, file_name=${flowFileName.substring(0, 16)}` : ''));
              } else {
                emitLog(`Bridge ${i + 1}/${imageUrls.length}: tileDetails không có tileId — fallback synthetic`, 'warn');
                uploadedTiles.push({
                  tileId: `chatgpt_${Date.now()}_${i}`,
                  thumbnail: url,
                  file_name: fileName,
                });
              }
            } else {
              const reason = isTimeout ? 'TIMEOUT' : 'tileDetails rỗng';
              emitLog(`Bridge ${i + 1}/${imageUrls.length}: ${reason} — fallback synthetic`, 'warn');
              uploadedTiles.push({
                tileId: `chatgpt_${Date.now()}_${i}`,
                thumbnail: url,
                file_name: fileName,
              });
            }
          } catch (bErr) {
            emitLog(`Bridge ${i + 1} exception: ${bErr.message} → fallback synthetic`, 'warn');
            uploadedTiles.push({
              tileId: `chatgpt_${Date.now()}_${i}_err`,
              thumbnail: url,
              file_name: fileName,
            });
          }
        }

        // Note: với fix Bug 2, uploadedTiles luôn === imageUrls.length (mọi fail đều push
        // synthetic). Block dưới giữ làm safety net cho future regression.
        if (uploadedTiles.length === 0) {
          emitLog('Cảnh báo: ChatGPT có ảnh nhưng không bridge được sang Flow', 'warn');
        }

        // 11. Persist result trên node (format object {tileId: {thumbnail, type, file_name}})
        node.result_file_ids = uploadedTiles.map(t => t.tileId).join(', ');
        node.result_thumbnails = uploadedTiles.reduce((acc, t) => {
          acc[t.tileId] = {
            thumbnail: t.thumbnail,
            type: 'image',
            file_name: t.file_name || '',
          };
          return acc;
        }, {});
        node.result_file_names = uploadedTiles.reduce((acc, t) => {
          if (t.file_name) acc[t.tileId] = t.file_name;
          return acc;
        }, {});

        // Phase: Dual URL — lưu URL provider gốc song song với Flow tileId.
        // Manual download sẽ ưu tiên URL gốc (chất lượng 100% provider) thay vì Flow (re-encoded).
        // Note: URL gốc có signature TTL ~vài giờ → fetch sớm trước khi expire.
        node.result_provider_urls = uploadedTiles.reduce((acc, t, idx) => {
          const url = imageUrls?.[idx];
          if (t.tileId && url) {
            acc[t.tileId] = {
              url,
              provider: 'chatgpt',
              media_type: 'image',
              tab_id: cgTabId,
              captured_at: Date.now(),
            };
          }
          return acc;
        }, {});

        // DEBUG: Log result_provider_urls để verify đã set đúng
        emitLog(`[ChatGPT] result_provider_urls keys: ${Object.keys(node.result_provider_urls || {}).join(', ') || '(empty)'}`);

        // Cập nhật MediaRegistry để các node downstream + UI tham chiếu đúng
        if (typeof MediaRegistry !== 'undefined') {
          for (const t of uploadedTiles) {
            if (t.thumbnail) MediaRegistry.setThumb?.(t.tileId, t.thumbnail);
            if (t.file_name) MediaRegistry.setFileName?.(t.tileId, t.file_name);
          }
        }

        // 12. Auto-download (skip nếu pipeline mode — pipeline không xử lý ChatGPT image).
        // Bug fix: trước fix loop chạy SYNC await → block emit node:completed → user thấy
        // download xong nhưng node UI lâu mới update. Fix: fire-and-forget background.
        // Reference fix giống Grok workflow node pattern.
        const canUseAutoDownload = window.featureGate?.canUse('auto_download') ?? false;
        const nodeAutoDownload = canUseAutoDownload &&
          (node.auto_download === true || node.auto_download === '1' || node.auto_download === 1);
        const isPipelineActive = !!(window.PromptQueue?.isEnabled?.());
        if (nodeAutoDownload && !isPipelineActive && imageUrls.length > 0 && cgTabId) {
          emitLog(`Auto-download ${imageUrls.length} ảnh ChatGPT (background)...`);
          // Fire-and-forget: download xảy ra song song, executor return ngay sau bridge.
          (async () => {
            try {
              const _wfCgSettings = await new Promise((resolve) => {
                chrome.storage.local.get(['af_settings'], (res) => resolve(res.af_settings || {}));
              });
              const _wfCgDownloadFolder = _wfCgSettings.downloadFolder || 'flow-output';
              const _wfCgDownloadTemplate = _wfCgSettings.downloadTemplate || '[Date]_[Project]_[Prompt]_[Index]';

              for (let urlIdx = 0; urlIdx < imageUrls.length; urlIdx++) {
                const url = imageUrls[urlIdx];
                try {
                  const fetchResp = await window.MessageBridge?.chatGPTFetchImage?.(url, cgTabId);
                  if (fetchResp?.success && fetchResp.base64) {
                    const blob = await (await fetch(fetchResp.base64)).blob();
                    const blobUrl = URL.createObjectURL(blob);

                    const filename = window.GenTab?._buildChatGPTFilename?.(
                      _wfCgDownloadTemplate,
                      window._currentProjectName || 'flow',
                      node.prompt || '',
                      1, urlIdx + 1, '',
                      workflow?.wf_name || null,
                      _wfCgDownloadFolder
                    ) || `${_wfCgDownloadFolder}/${(workflow?.wf_name || 'workflow').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)}/chatgpt-${Date.now()}-${urlIdx + 1}.png`;

                    const dlResp = await new Promise((resolve) => {
                      chrome.runtime.sendMessage(
                        { action: 'chromeDownload', url: blobUrl, filename },
                        (r) => resolve(r)
                      );
                    });
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
                    if (!dlResp?.success) emitLog(`ChatGPT download fail: ${dlResp?.error || 'unknown'}`, 'warn');
                  } else {
                    emitLog(`ChatGPT fetchImage fail: ${fetchResp?.error || 'unknown'}`, 'warn');
                  }
                } catch (dlErr) {
                  emitLog(`ChatGPT auto-download lỗi: ${dlErr.message}`, 'warn');
                }
              }
              emitLog(`Auto-download ChatGPT hoàn tất`, 'success');
            } catch (e) {
              emitLog(`Auto-download ChatGPT bg error: ${e.message}`, 'error');
            }
          })().catch(() => {});
        }

        // 13. ExecutionGate complete success
        if (cgToken && window.ExecutionGate) {
          await window.ExecutionGate.complete(cgToken, 'success').catch(() => {});
        }

        // Bug fix: KHÔNG emit node:completed ở đây. Outer caller emit sau finally restore.
        const fileIds = uploadedTiles.map(t => t.tileId);

        const duration = Date.now() - startTime;
        emitLog(`ChatGPT Image node hoàn tất: ${fileIds.length} ảnh trong ${duration}ms`, 'success');

        return {
          fileIds,
          duration,
          thumbnails: node.result_thumbnails,
          fileNames: node.result_file_names,
        };

      } catch (err) {
        // ExecutionGate complete failed (rollback quota)
        if (cgToken && window.ExecutionGate) {
          await window.ExecutionGate.complete(cgToken, 'failed').catch(() => {});
        }
        // Set last_error nếu chưa có
        if (!node.last_error) {
          node.last_error = err?.code || 'IMAGE_GEN_FAILED';
        }
        // Persist last_error
        try {
          await window.storageManager?.updateNodeStatus(
            this.currentWorkflow?.wf_id || workflow?.wf_id,
            node.node_id,
            { last_error: node.last_error, last_mode_used: node.last_mode_used }
          );
        } catch (e) { /* ignore */ }
        throw err;
      }
    }

    /**
     * Phase G-6: Execute Grok Image node — sinh ảnh/video qua Grok provider rồi bridge sang Flow.
     * Mirror _executeChatGPTImageNode pattern.
     *
     * Flow:
     *   1. Feature gate check (grok_enabled).
     *   2. Get adapter qua ProviderRegistry.
     *   3. ensureReady → emit grok:login_required nếu fail.
     *   4. Smart Clone reconstruction + upload pending refs + resolve refs sang base64.
     *   5. ExecutionGate request token (grok_run quota).
     *   6. adapter.submit({...}) → nhận mediaUrls + tabId.
     *   7. Cross-provider bridge: mỗi mediaUrl → MessageBridge.grokBridgeToFlow → tileId trên Flow.
     *   8. Persist result_file_ids/thumbnails/file_names theo format object {tileId: {thumbnail, type, file_name}}.
     *   9. Auto-download nếu node.auto_download (skip nếu PromptQueue.isEnabled() — pipeline Flow-only).
     *   10. ExecutionGate.complete + emit node:completed.
     */
    async _executeGrokImageNode(node, workflow, emitLog, nodeAccum = null) {
      const startTime = Date.now();

      // 1. Feature gate
      if (!window.featureGate || !window.featureGate.canUse('grok_enabled')) {
        const err = new Error('Tính năng Grok chưa được kích hoạt cho gói hiện tại');
        err.code = 'FEATURE_LOCKED';
        node.last_error = 'FEATURE_LOCKED';
        throw err;
      }

      // 2. Lấy adapter
      if (!window.ProviderRegistry) {
        throw new Error('ProviderRegistry chưa sẵn sàng');
      }
      const adapter = window.ProviderRegistry.get('grok');
      if (!adapter) {
        throw new Error('Grok adapter chưa được đăng ký');
      }

      // 3. ensureReady — bảo đảm tab + login + composer ready
      let tabId = null;
      try {
        const ready = await adapter.ensureReady();
        if (!ready || !ready.ready) {
          if (window.eventBus) {
            window.eventBus.emit('grok:login_required', { error: ready?.error || 'NOT_LOGGED_IN' });
          }
          const err = new Error('Grok chưa sẵn sàng: ' + (ready?.error || 'NOT_LOGGED_IN'));
          err.code = ready?.error || 'NOT_LOGGED_IN';
          node.last_error = err.code;
          throw err;
        }
        tabId = ready.tabId;
      } catch (e) {
        node.last_error = e?.code || 'NOT_READY';
        if (window.eventBus && e?.code !== 'FEATURE_LOCKED') {
          window.eventBus.emit('grok:login_required', { error: e?.message });
        }
        throw e;
      }

      // 4. Smart Clone: reconstruct ref_file_ids từ ref_file_names (cross-project clone)
      if (!node.ref_file_ids && node.ref_file_names && Object.keys(node.ref_file_names).length > 0) {
        node.ref_file_ids = Object.keys(node.ref_file_names).join(', ');
        emitLog('Smart Clone: reconstructed ref_file_ids from ref_file_names: ' + node.ref_file_ids);
      } else if (!node.ref_file_ids && node.ref_thumbnails && Object.keys(node.ref_thumbnails).length > 0) {
        node.ref_file_ids = Object.keys(node.ref_thumbnails).join(', ');
        emitLog('Smart Clone: reconstructed ref_file_ids from ref_thumbnails: ' + node.ref_file_ids);
      }

      // 5. Upload pending refs (upload_xxx → real fileIds)
      if (node.ref_file_ids && node.ref_file_ids.includes('upload_') && typeof window.uploadPendingFiles === 'function') {
        const oldRefIds = node.ref_file_ids;
        emitLog('Upload ảnh ref local lên Flow trước khi submit Grok...', 'info');
        node.ref_file_ids = await window.uploadPendingFiles(node.ref_file_ids);
        if (node.ref_file_ids !== oldRefIds) {
          const newIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
          if (!node.ref_file_names) node.ref_file_names = {};
          if (!node.ref_thumbnails) node.ref_thumbnails = {};
          for (const newId of newIdArr) {
            if (typeof MediaRegistry !== 'undefined') {
              if (MediaRegistry.getFileName?.(newId)) node.ref_file_names[newId] = MediaRegistry.getFileName(newId);
              if (MediaRegistry.getThumb?.(newId)) node.ref_thumbnails[newId] = MediaRegistry.getThumb(newId);
            }
          }
          // Cleanup keys cũ
          const oldIdArr = (oldRefIds || '').split(',').map(s => s.trim()).filter(Boolean);
          for (const oldId of oldIdArr) {
            if (oldId.startsWith('upload_')) {
              delete node.ref_file_names[oldId];
              if (node.ref_thumbnails) delete node.ref_thumbnails[oldId];
            }
          }
        }
      }

      // 6. Resolve refs base64 (cap maxRefImages=4)
      const refIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
      const maxRef = adapter.capabilities?.maxRefImages || 4;
      const refIdsCapped = refIdArr.slice(0, maxRef);
      if (refIdArr.length > maxRef) {
        emitLog(`Grok: vượt giới hạn ${maxRef} ảnh ref — chỉ gửi ${maxRef} ảnh đầu`, 'warn');
      }

      const resolvedRefs = [];
      for (const fid of refIdsCapped) {
        let thumb = '';
        const refThumb = node.ref_thumbnails?.[fid];
        if (typeof refThumb === 'string') thumb = refThumb;
        else if (refThumb?.thumbnail) thumb = refThumb.thumbnail;
        if (!thumb && window.GenTab?.thumbnailCache?.[fid]) thumb = window.GenTab.thumbnailCache[fid];
        if (!thumb && typeof MediaRegistry !== 'undefined' && MediaRegistry.getThumb?.(fid)) thumb = MediaRegistry.getThumb(fid);
        if (!thumb) {
          emitLog(`Grok ref skip: không có thumbnail URL cho ${fid.substring(0, 12)}`, 'warn');
          continue;
        }
        const fileName = node.ref_file_names?.[fid] || (typeof MediaRegistry !== 'undefined' && MediaRegistry.getFileName?.(fid)) || `${fid}.png`;
        try {
          const fetchResp = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'fetchBlob', url: thumb }, (r) => resolve(r));
          });
          if (fetchResp?.success && fetchResp.base64) {
            const m = fetchResp.base64.match(/^data:(.+?);base64,(.+)$/);
            if (m) {
              resolvedRefs.push({ base64: m[2], name: fileName, type: m[1] });
            } else {
              resolvedRefs.push({ base64: fetchResp.base64, name: fileName, type: 'image/png' });
            }
          } else {
            emitLog(`Grok ref fetch fail: ${fid.substring(0, 12)} (${fetchResp?.error || 'unknown'})`, 'warn');
          }
        } catch (err) {
          emitLog(`Grok ref fetch error: ${fid.substring(0, 12)} - ${err.message}`, 'warn');
        }
      }
      emitLog(`Grok refs resolved: ${resolvedRefs.length}/${refIdsCapped.length}`);

      // 7. ExecutionGate request token (action: grok_run)
      let grokToken = null;
      if (window.ExecutionGate) {
        try {
          const gate = await window.ExecutionGate.request('grok_run', 1, {
            owner: 'workflow',
            label: workflow?.wf_name || 'grok_node'
          });
          if (!gate?.allowed) {
            window.ExecutionGate.showDeniedDialog?.(gate, 'Grok');
            const err = new Error(gate?.reason === 'QUOTA_EXCEEDED' ? 'Đã hết lượt Grok hôm nay' : 'Không được phép chạy Grok');
            err.code = gate?.reason || 'QUOTA_EXCEEDED';
            node.last_error = 'RATE_LIMIT';
            throw err;
          }
          grokToken = gate.token;
        } catch (e) {
          if (window.QuotaErrorHandler?.isQuotaError(e)) {
            node.last_error = e.code === 'FEATURE_LOCKED' ? 'FEATURE_LOCKED' : 'RATE_LIMIT';
            throw e;
          }
          console.warn('[WorkflowExecutor] Grok ExecutionGate request failed, proceeding:', e.message);
        }
      }

      try {
        // 8. Submit qua adapter
        const grokMode = node.grok_mode || 'image';
        const grokRatio = node.ratio || 'widescreen';
        const grokDuration = node.grok_duration || '6s';
        const grokResolution = node.grok_resolution || '720p';
        // Image quality (Grok update 2026-04): 'speed' | 'quality'
        const grokImageQuality = node.grok_image_quality || 'speed';
        // Phase L: Centralized timeout — video needs longer timeout than image
        const defaultTimeout = grokMode === 'video'
          ? (window.SystemConfig?.getTimeout('video_timeout_ms') || 600000)
          : (window.SystemConfig?.getTimeout('image_timeout_ms') || 300000);
        const grokTimeout = node.timeout_ms || defaultTimeout;
        emitLog(`Grok submit: mode=${grokMode}, ratio=${grokRatio}, refs=${resolvedRefs.length}`);

        // Tracker update để show UI running khi Grok gen (mirror prompt_enhancing pattern)
        if (window.eventBus) {
          window.eventBus.emit('execution:tracker_update', {
            owner: 'workflow',
            phase: 'grok_generating',
            promptText: `Grok generating ${grokMode}...`,
            genMode: grokMode,
          });
        }

        const result = await adapter.submit({
          prompt: node.prompt || '',
          refFileIds: resolvedRefs,
          settings: {
            mode: grokMode,
            ratio: grokRatio,
            duration: grokDuration,
            resolution: grokResolution,
            imageQuality: grokImageQuality,
            timeout: grokTimeout,
          },
          taskName: workflow?.wf_name || null,
        });

        if (!result || !result.success) {
          const errCode = result?.error || 'IMAGE_GEN_FAILED';
          node.last_error = errCode;
          try {
            await window.storageManager?.updateNodeStatus(
              this.currentWorkflow?.wf_id || workflow?.wf_id,
              node.node_id,
              { last_error: errCode }
            );
          } catch (e) { /* ignore */ }

          // Hiện notification đỏ cho các error types quan trọng
          if (window.showProviderError && ['RATE_LIMIT', 'CONTENT_BLOCKED', 'IMAGE_GEN_FAILED', 'TEXT_ONLY', 'NETWORK', 'TIMEOUT', 'SUBSCRIPTION_REQUIRED', 'CHALLENGE_TIMEOUT'].includes(errCode)) {
            window.showProviderError('grok', errCode, result?.message);
          }

          // ExecutionGate complete và clear token ngay — catch block sẽ skip nếu grokToken=null
          if (grokToken && window.ExecutionGate) {
            await window.ExecutionGate.complete(grokToken, 'failed').catch(() => {});
            grokToken = null; // Prevent double-complete in catch block
          }
          // SUBSCRIPTION_REQUIRED: emit event
          if (errCode === 'SUBSCRIPTION_REQUIRED') {
            if (window.eventBus) {
              window.eventBus.emit('grok:subscription_required', { error: errCode, message: result?.message });
            }
          }
          throw new Error('Grok submit thất bại: ' + (result?.message || errCode));
        }

        node.last_error = null;
        const mediaType = result.mediaType || (grokMode === 'video' ? 'video' : 'image');
        node.last_mode_used = mediaType;
        emitLog(`Grok ${mediaType}: ${result.mediaUrls?.length || 0} kết quả`, 'success');

        const mediaUrls = Array.isArray(result.mediaUrls) ? result.mediaUrls : [];
        if (mediaUrls.length === 0) {
          throw new Error('Grok không trả về URL media nào');
        }

        // 9. Cross-provider bridge: mỗi mediaUrl → Flow tile.
        //
        // VIDEO: Skip bridge vì không có node nào cần video trên Flow canvas.
        // Download node dùng provider URL path (fetch trực tiếp từ Grok CDN).
        // Tạo synthetic tile_id để UI render thumbnail + Download node có provider URL.
        //
        // IMAGE: Bridge sang Flow vì các node khác (Generate, Upscale) có thể cần.
        // Timeout 30s/bridge call. Nếu timeout/fail → fallback synthetic tile_id.
        const uploadedTiles = [];
        const grokTabId = result.tabId || tabId;
        const BRIDGE_TIMEOUT_MS = 60000; // 60s/url — tăng từ 30s để tránh timeout sớm + re-upload

        const bridgeWithTimeout = (url, tabId, fileName) => {
          return Promise.race([
            window.MessageBridge.grokBridgeToFlow(url, tabId, fileName),
            new Promise((resolve) => setTimeout(() => resolve({ success: false, error: 'BRIDGE_TIMEOUT' }), BRIDGE_TIMEOUT_MS)),
          ]);
        };

        for (let i = 0; i < mediaUrls.length; i++) {
          const url = mediaUrls[i];
          const ext = mediaType === 'video' ? 'mp4' : 'png';
          const fileName = `grok-${node.node_id}-${i + 1}.${ext}`;

          // VIDEO: Skip bridge, tạo synthetic tile ngay (Download node dùng provider URL)
          if (mediaType === 'video') {
            const syntheticTileId = `grok_video_${Date.now()}_${i}`;
            uploadedTiles.push({
              tileId: syntheticTileId,
              thumbnail: url,
              file_name: fileName,
              type: 'video',
            });
            emitLog(`Video ${i + 1}/${mediaUrls.length}: skip bridge, dùng provider URL để download`);
            continue;
          }

          // IMAGE: Bridge sang Flow
          const bridgeStartTime = Date.now();
          try {
            if (!window.MessageBridge?.grokBridgeToFlow) {
              emitLog('MessageBridge.grokBridgeToFlow không tồn tại — fallback synthetic tile', 'warn');
              const syntheticTileId = `grok_${Date.now()}_${i}`;
              uploadedTiles.push({
                tileId: syntheticTileId,
                thumbnail: url,
                file_name: fileName,
                type: mediaType,
              });
              continue;
            }
            emitLog(`[Grok Bridge] ${i + 1}/${mediaUrls.length}: Starting upload...`);
            const bridgeResp = await bridgeWithTimeout(url, grokTabId, fileName);
            const bridgeDuration = Date.now() - bridgeStartTime;
            emitLog(`[Grok Bridge] ${i + 1}/${mediaUrls.length}: Completed in ${bridgeDuration}ms`);
            if (bridgeResp?.success && bridgeResp.tileId) {
              const thumbUrl = bridgeResp.thumbnailUrl || url;
              // BUG FIX: Extract file_name từ thumbnailUrl nếu bridgeResp.fileName rỗng
              // Tránh reupload sau reload page do file_names mapping sai
              const flowFileName = bridgeResp.fileName || extractFileNameFromUrl(thumbUrl);
              uploadedTiles.push({
                tileId: bridgeResp.tileId,
                thumbnail: thumbUrl,
                file_name: flowFileName,
                type: mediaType,
              });
              emitLog(`Bridge ${i + 1}/${mediaUrls.length}: tileId=${bridgeResp.tileId.substring(0, 16)}` +
                      (flowFileName ? `, file_name=${flowFileName.substring(0, 16)}` : ''));
            } else {
              // Fallback: synthetic tile_id + Grok URL trực tiếp (UI vẫn render được)
              const errReason = bridgeResp?.error || 'unknown';
              emitLog(`Grok bridge ${errReason} → fallback synthetic tile (${i + 1}/${mediaUrls.length})`, 'warn');
              const syntheticTileId = `grok_${Date.now()}_${i}`;
              uploadedTiles.push({
                tileId: syntheticTileId,
                thumbnail: url,
                file_name: fileName,
                type: mediaType,
              });
            }
          } catch (bErr) {
            emitLog(`Grok bridge exception: ${bErr.message} → fallback synthetic`, 'warn');
            const syntheticTileId = `grok_${Date.now()}_${i}_err`;
            uploadedTiles.push({
              tileId: syntheticTileId,
              thumbnail: url,
              file_name: fileName,
              type: mediaType,
            });
          }
        }

        // 10. Persist result trên node (format object {tileId: {thumbnail, type, file_name}})
        node.result_file_ids = uploadedTiles.map(t => t.tileId).join(', ');
        node.result_thumbnails = uploadedTiles.reduce((acc, t) => {
          acc[t.tileId] = {
            thumbnail: t.thumbnail,
            type: t.type || 'image',
            file_name: t.file_name || '',
          };
          return acc;
        }, {});
        node.result_file_names = uploadedTiles.reduce((acc, t) => {
          if (t.file_name) acc[t.tileId] = t.file_name;
          return acc;
        }, {});

        // Phase: Dual URL — lưu URL provider gốc Grok (assets.grok.com / grok.x.ai).
        // Manual download ưu tiên URL gốc (chất lượng 100%, video nguyên codec/audio).
        node.result_provider_urls = uploadedTiles.reduce((acc, t, idx) => {
          const url = mediaUrls?.[idx];
          if (t.tileId && url) {
            acc[t.tileId] = {
              url,
              provider: 'grok',
              media_type: t.type || mediaType || 'image',
              tab_id: grokTabId,
              captured_at: Date.now(),
            };
          }
          return acc;
        }, {});

        // Cập nhật MediaRegistry để các node downstream + UI tham chiếu đúng
        if (typeof MediaRegistry !== 'undefined') {
          for (const t of uploadedTiles) {
            if (t.thumbnail) MediaRegistry.setThumb?.(t.tileId, t.thumbnail);
            if (t.file_name) MediaRegistry.setFileName?.(t.tileId, t.file_name);
          }
        }

        // 11. Auto-download (skip nếu Pipeline ON — Pipeline Flow-only, Grok bypass).
        // Bug fix: trước fix loop chạy SYNC await TRONG executor → block emit node:completed →
        // user gen+download xong vẫn đợi vài giây mới thấy result update trên node card.
        // Fix: chạy fire-and-forget (background) — UI cập nhật ngay sau bridge, download bg.
        // Reference fix giống GenTab + Task path: dùng GenTab._buildChatGPTFilename helper với
        // downloadFolder + downloadTemplate từ user settings (KHÔNG hardcode 'flow-output').
        const canUseAutoDownload = window.featureGate?.canUse('auto_download') ?? false;
        const nodeAutoDownload = canUseAutoDownload &&
          (node.auto_download === true || node.auto_download === '1' || node.auto_download === 1);
        const isPipelineActive = !!(window.PromptQueue?.isEnabled?.());
        if (nodeAutoDownload && !isPipelineActive && mediaUrls.length > 0 && grokTabId) {
          emitLog(`Auto-download ${mediaUrls.length} media Grok (background)...`);
          // Fire-and-forget: download xảy ra song song với việc executor return + emit node:completed.
          // CDN URL Grok có signature TTL ~vài giờ → download trong background OK, không gấp.
          (async () => {
            try {
              const _wfGrokSettings = await new Promise((resolve) => {
                chrome.storage.local.get(['af_settings'], (res) => resolve(res.af_settings || {}));
              });
              const _wfGrokDownloadFolder = _wfGrokSettings.downloadFolder || 'flow-output';
              const _wfGrokDownloadTemplate = _wfGrokSettings.downloadTemplate || '[Date]_[Project]_[Prompt]_[Index]';

              for (let urlIdx = 0; urlIdx < mediaUrls.length; urlIdx++) {
                const url = mediaUrls[urlIdx];
                try {
                  const fetchResp = await window.MessageBridge?.grokFetchImage?.(url, grokTabId);
                  if (fetchResp?.success && fetchResp.base64) {
                    const blob = await (await fetch(fetchResp.base64)).blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const ext = mediaType === 'video' ? 'mp4' : 'png';

                    let filename = window.GenTab?._buildChatGPTFilename?.(
                      _wfGrokDownloadTemplate,
                      window._currentProjectName || 'flow',
                      node.prompt || '',
                      1, urlIdx + 1, '',
                      workflow?.wf_name || null,
                      _wfGrokDownloadFolder
                    ) || `${_wfGrokDownloadFolder}/${(workflow?.wf_name || 'workflow').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)}/grok-${Date.now()}-${urlIdx + 1}.${ext}`;
                    if (ext !== 'png' && filename.endsWith('.png')) {
                      filename = filename.replace(/\.png$/i, `.${ext}`);
                    }

                    const dlResp = await new Promise((resolve) => {
                      chrome.runtime.sendMessage(
                        { action: 'chromeDownload', url: blobUrl, filename },
                        (r) => resolve(r)
                      );
                    });
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                    if (!dlResp?.success) emitLog(`Grok download fail: ${dlResp?.error || 'unknown'}`, 'warn');
                  } else {
                    emitLog(`Grok fetchImage fail: ${fetchResp?.error || 'unknown'}`, 'warn');
                  }
                } catch (dlErr) {
                  emitLog(`Grok auto-download lỗi: ${dlErr.message}`, 'warn');
                }
              }
              emitLog(`Auto-download Grok hoàn tất`, 'success');
            } catch (e) {
              emitLog(`Auto-download Grok bg error: ${e.message}`, 'error');
            }
          })().catch(() => {});
        }

        // 12. ExecutionGate complete success
        if (grokToken && window.ExecutionGate) {
          await window.ExecutionGate.complete(grokToken, 'success').catch(() => {});
        }

        // Bug fix: KHÔNG emit node:completed ở đây. Outer caller (executeSingleNode/_executeSingleNode)
        // sẽ emit SAU khi _executeNodeInternal finally restore _original_ref_state. Emit ở đây
        // chạy SYNC handler saveWorkflow() đọc Drawflow data TRƯỚC restore → persist port-merged
        // ref_file_ids xuống storage → reload mất ref_img.
        const fileIds = uploadedTiles.map(t => t.tileId);

        const duration = Date.now() - startTime;
        emitLog(`Grok Image node hoàn tất: ${fileIds.length} media trong ${duration}ms`, 'success');

        return {
          fileIds: fileIds.length > 0 ? fileIds : mediaUrls,
          duration,
          thumbnails: node.result_thumbnails,
          fileNames: node.result_file_names,
          grokResult: result,
        };

      } catch (err) {
        // ExecutionGate complete failed (rollback quota)
        if (grokToken && window.ExecutionGate) {
          await window.ExecutionGate.complete(grokToken, 'failed').catch(() => {});
        }
        if (!node.last_error) {
          node.last_error = err?.code || 'IMAGE_GEN_FAILED';
        }
        try {
          await window.storageManager?.updateNodeStatus(
            this.currentWorkflow?.wf_id || workflow?.wf_id,
            node.node_id,
            { last_error: node.last_error, last_mode_used: node.last_mode_used }
          );
        } catch (e) { /* ignore */ }
        throw err;
      }
    }

    /**
     * Phase CG-8: Execute Prompt node — chứa text + tuỳ chọn enhance qua LLM.
     *
     * Flow:
     *  - Feature gate `prompt_node_enabled` → throw nếu false.
     *  - Branch 1 (enhance OFF): pass-through, result_text = prompt nguyên văn.
     *  - Branch 2 (enhance ON):
     *      + Feature gate `prompt_enhancer_enabled` → soft fallback to plain với log warning.
     *      + Get adapter ChatGPT/Gemini từ ProviderRegistry.
     *      + ExecutionGate.request(`${provider}_run`, 1).
     *      + adapter.ensureReady() → throw nếu fail.
     *      + adapter.submitText({ prompt, timeout }) → result.text.
     *      + Empty result → fallback plain với warning.
     *      + ExecutionGate.complete.
     */
    async _executePromptNode(node, workflow, emitLog) {
      const startTime = Date.now();

      // 1. Feature gate cơ bản — cho phép dùng Prompt node nói chung (cả OFF + ON).
      if (window.featureGate && !window.featureGate.canUse('prompt_node_enabled')) {
        const err = new Error('Prompt node chưa được kích hoạt cho gói hiện tại');
        err.code = 'FEATURE_LOCKED';
        node.last_error = 'FEATURE_LOCKED';
        throw err;
      }

      // === PORT-BASED TEXT INPUT (Phase WK-1.4.6) ===
      // Chained prompt: lấy text từ upstream Prompt node qua port `text` → override node.prompt.
      try {
        const upstreamTextArr = this._collectPortInputs(node, 'text', workflow.nodes, workflow.edges);
        const upstreamText = upstreamTextArr.find((t) => typeof t === 'string' && t.trim());
        if (upstreamText) {
          let truncated = upstreamText.trim();
          const maxLen = window.ValidationRules?.getInt?.('prompt_max_length', 5000) ?? 5000;
          if (truncated.length > maxLen) {
            emitLog(`Upstream prompt > ${maxLen} ký tự — truncate`, 'warn');
            truncated = truncated.substring(0, maxLen);
          }
          node.prompt = truncated;
          emitLog(`Prompt node nhận text từ upstream port: len=${truncated.length}`);
        }
      } catch (err) {
        emitLog('Lỗi collect port "text" prompt node: ' + err.message, 'warn');
      }

      const promptText = (node.prompt || '').trim();
      if (!promptText) {
        const err = new Error('Prompt node: nội dung prompt rỗng');
        err.code = 'EMPTY_PROMPT';
        node.last_error = 'EMPTY_PROMPT';
        throw err;
      }

      // === PORT-BASED IMAGE_REF (Phase WK-1.4.6) — chỉ khi enhance=ON ===
      // Gộp tile IDs từ port `image_ref` vào node.ref_file_ids để _resolveRefImagesForLLM xử lý.
      if (node.enhance) {
        try {
          const portImageRefs = this._collectPortInputs(node, 'image_ref', workflow.nodes, workflow.edges);
          if (portImageRefs.length > 0) {
            const existing = (node.ref_file_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
            const combined = [...new Set([...existing, ...portImageRefs])];
            node.ref_file_ids = combined.join(', ');
            emitLog(`Prompt node port "image_ref" merge: +${portImageRefs.length} ảnh (tổng ${combined.length})`);
          }
        } catch (err) {
          emitLog('Lỗi collect port "image_ref" prompt node: ' + err.message, 'warn');
        }
      }

      // 2. BRANCH 1: Enhance OFF (pass-through plain text)
      if (!node.enhance) {
        node.result_text = promptText;
        node.result_source = 'plain';
        node.last_error = null;
        emitLog(`Prompt node: pass-through plain text (len=${promptText.length})`);
        const duration = Date.now() - startTime;
        // Bug fix: KHÔNG emit node:completed ở đây — outer caller emit sau finally restore.
        return { fileIds: [], duration, resultText: promptText };
      }

      // 3. BRANCH 2: Enhance ON
      // 3.1. Feature gate enhance — fallback to plain nếu không có quyền (không throw).
      if (window.featureGate && !window.featureGate.canUse('prompt_enhancer_enabled')) {
        emitLog('prompt_enhancer_enabled = false → fallback sang plain text', 'warn');
        node.result_text = promptText;
        node.result_source = 'plain_fallback';
        node.last_error = null;
        const duration = Date.now() - startTime;
        // Bug fix: KHÔNG emit node:completed ở đây — outer caller emit sau finally restore.
        return { fileIds: [], duration, resultText: promptText };
      }

      // 3.2. Get adapter
      const providerKey = node.provider || 'chatgpt';
      if (!window.ProviderRegistry) {
        throw new Error('ProviderRegistry chưa sẵn sàng');
      }
      const adapter = window.ProviderRegistry.get(providerKey);
      if (!adapter) {
        throw new Error(`Provider ${providerKey} không khả dụng`);
      }
      if (typeof adapter.submitText !== 'function') {
        throw new Error(`Adapter ${providerKey} không hỗ trợ submitText()`);
      }

      // 3.3. ExecutionGate request — trừ quota của provider tương ứng.
      const action = providerKey === 'gemini' ? 'gemini_run' : 'chatgpt_run';
      let token = null;
      if (window.ExecutionGate) {
        try {
          const gate = await window.ExecutionGate.request(action, 1, {
            owner: 'workflow',
            label: `Prompt enhance (${providerKey})`,
          });
          if (!gate?.allowed) {
            window.ExecutionGate.showDeniedDialog?.(gate, 'Prompt enhance');
            const err = new Error(gate?.reason === 'QUOTA_EXCEEDED' ? `Đã hết lượt ${providerKey} hôm nay` : `Không được phép chạy ${providerKey}`);
            err.code = gate?.reason || 'QUOTA_EXCEEDED';
            node.last_error = 'RATE_LIMIT';
            throw err;
          }
          token = gate.token;
        } catch (e) {
          if (window.QuotaErrorHandler?.isQuotaError(e)) {
            node.last_error = e.code === 'FEATURE_LOCKED' ? 'FEATURE_LOCKED' : 'RATE_LIMIT';
            throw e;
          }
          console.warn('[WorkflowExecutor] Prompt enhance ExecutionGate failed, proceed:', e.message);
        }
      }

      try {
        // 3.4. ensureReady
        const ready = await adapter.ensureReady();
        if (!ready || !ready.ready) {
          if (window.eventBus && providerKey === 'chatgpt') {
            window.eventBus.emit('chatgpt:login_required', { error: ready?.error || 'NOT_LOGGED_IN' });
          } else if (window.eventBus && providerKey === 'gemini') {
            window.eventBus.emit('gemini:login_required', { error: ready?.error || 'NOT_LOGGED_IN' });
          }
          const err = new Error(`${providerKey} chưa sẵn sàng: ${ready?.error || 'NOT_LOGGED_IN'}`);
          err.code = ready?.error || 'NOT_READY';
          node.last_error = err.code;
          throw err;
        }

        // 3.5. Phase CG-8 ext: Resolve ref images (cho phép user gửi prompt kèm ảnh)
        //  - Smart Clone: reconstruct ref_file_ids nếu chỉ có ref_file_names
        //  - Upload pending local files (upload_xxx keys) qua window.uploadPendingFiles
        //  - Convert tile thumbnails → base64 qua background fetchBlob
        if (!node.ref_file_ids && node.ref_file_names && Object.keys(node.ref_file_names).length > 0) {
          node.ref_file_ids = Object.keys(node.ref_file_names).join(', ');
          emitLog('Smart Clone: reconstructed ref_file_ids cho prompt node');
        }

        if (node.ref_file_ids && node.ref_file_ids.includes('upload_') && typeof window.uploadPendingFiles === 'function') {
          const oldRefIds = node.ref_file_ids;
          emitLog('Upload pending refs cho prompt node...');
          node.ref_file_ids = await window.uploadPendingFiles(node.ref_file_ids);
          if (node.ref_file_ids !== oldRefIds) {
            const newIdArr = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
            if (!node.ref_file_names) node.ref_file_names = {};
            for (const newId of newIdArr) {
              if (typeof MediaRegistry !== 'undefined' && MediaRegistry.getFileName?.(newId)) {
                node.ref_file_names[newId] = MediaRegistry.getFileName(newId);
              }
            }
          }
        }

        const resolvedRefs = await this._resolveRefImagesForLLM(node, adapter);
        if (resolvedRefs.length > 0) {
          emitLog(`Đã resolve ${resolvedRefs.length} ref image(s) cho prompt enhance`);
        }

        // 3.6. Submit text — KHÔNG modify, KHÔNG prepend prefix
        const timeoutMs = (parseInt(node.timeout_sec, 10) || 60) * 1000;
        emitLog(`Prompt enhance via ${providerKey} (timeout ${node.timeout_sec || 60}s)...`);

        // Tracker update để show UI running khi enhance prompt
        if (window.eventBus) {
          window.eventBus.emit('execution:tracker_update', {
            owner: 'workflow',
            phase: 'prompt_enhancing',
            promptText: `Enhancing via ${providerKey}...`,
            genMode: 'text',
          });
        }

        // Wrap submitText với try-catch riêng để có thể fallback khi timeout/error
        let enhanceResult = null;
        let enhanceError = null;
        try {
          enhanceResult = await adapter.submitText({
            prompt: promptText,
            refFileIds: resolvedRefs,
            timeout: timeoutMs,
          });
        } catch (submitErr) {
          enhanceError = submitErr;
          const errCode = submitErr?.code || submitErr?.message || 'UNKNOWN';
          emitLog(`Enhance error: ${errCode}`, 'warn');
        }

        const enhancedText = (enhanceResult?.text || '').trim();

        // Xử lý kết quả enhance hoặc fallback
        if (enhanceError || !enhancedText) {
          // Check fallback option (default: true)
          const canFallback = node.enhance_fallback !== false;

          if (canFallback) {
            // Fallback về plain text với warning
            const errCode = enhanceError?.code || enhanceError?.message || '';
            const reason = enhanceError ? errCode : 'empty response';
            emitLog(`${providerKey} ${reason} — fallback sang plain text`, 'warn');
            node.result_text = promptText;
            node.result_source = 'plain_fallback';
            node.last_error = null;

            // Show notification với message cụ thể theo error type
            if (typeof window.showNotification === 'function') {
              let notifMsg = `${node.node_name || 'Prompt'}: ${providerKey} không phản hồi, đã dùng plain text.`;

              // IMAGE_GENERATION_DETECTED: Gemini tạo ảnh thay vì trả prompt text
              if (errCode === 'IMAGE_GENERATION_DETECTED') {
                notifMsg = `${node.node_name || 'Prompt'}: ${providerKey} tạo ảnh thay vì trả prompt text — đã dùng plain text.`;
              }

              window.showNotification(notifMsg, 'warning', 5000);
            }
          } else {
            // Không cho phép fallback → throw error
            if (token && window.ExecutionGate) {
              await window.ExecutionGate.complete(token, 'failed').catch(() => {});
            }
            const err = enhanceError || new Error(`${providerKey} trả về empty text`);
            err.code = err.code || 'ENHANCE_FAILED';
            node.last_error = err.code;
            throw err;
          }
        } else {
          // Enhance thành công
          node.result_text = enhancedText;
          node.result_source = providerKey;
          node.last_error = null;
          emitLog(`Prompt enhance hoàn tất: len=${enhancedText.length}`);
        }

        // 3.7. ExecutionGate complete success
        if (token && window.ExecutionGate) {
          await window.ExecutionGate.complete(token, 'success').catch(() => {});
        }

        const duration = Date.now() - startTime;
        // Bug fix: KHÔNG emit node:completed ở đây — outer caller emit sau finally restore.
        return { fileIds: [], duration, resultText: node.result_text };

      } catch (err) {
        // ExecutionGate complete failed (rollback quota)
        if (token && window.ExecutionGate) {
          await window.ExecutionGate.complete(token, 'failed').catch(() => {});
        }
        if (!node.last_error) {
          node.last_error = err?.code || err?.message || 'PROMPT_FAILED';
        }
        throw err;
      }
    }

    /**
     * Phase CG-8 ext: Resolve refs cho Prompt node (enhance=ON).
     * Convert tile_id → base64 (qua background fetchBlob) → [{base64, name, type}].
     * Cap maxRefImages từ adapter capabilities (mặc định 4).
     */
    async _resolveRefImagesForLLM(node, adapter) {
      const idsRaw = node.ref_file_ids || '';
      if (!idsRaw) return [];
      const fileIds = idsRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (fileIds.length === 0) return [];

      // Post-audit fix: ưu tiên adapter.getMaxRefImages per-mode (Flow), fallback capabilities.maxRefImages
      // (ChatGPT/Grok/Gemini). Đồng nhất pattern với ImagePickerModal.resolveMaxSelections.
      let maxRefs;
      if (typeof adapter?.getMaxRefImages === 'function') {
        const mode = (node.media_type || 'Image').toLowerCase();
        const isFrames = mode === 'video' && node.video_input_type === 'Frames';
        maxRefs = adapter.getMaxRefImages({ mode, isFrames });
      }
      if (typeof maxRefs !== 'number' || maxRefs <= 0) {
        maxRefs = adapter?.capabilities?.maxRefImages || 4;
      }
      const capped = fileIds.slice(0, maxRefs);

      const refThumbs = node.ref_thumbnails || {};
      const results = [];
      for (const fid of capped) {
        let thumbUrl = null;
        // Format có thể là string URL hoặc object {thumbnail, type, file_name}
        const cached = refThumbs[fid];
        if (typeof cached === 'string') thumbUrl = cached;
        else if (cached && typeof cached === 'object') thumbUrl = cached.thumbnail || cached.thumbnail_url;
        // Fallback: GenTab.thumbnailCache (session memory)
        if (!thumbUrl && window.GenTab?.thumbnailCache?.[fid]) {
          thumbUrl = window.GenTab.thumbnailCache[fid];
        }
        if (!thumbUrl) {
          console.warn('[WorkflowExecutor] Prompt ref thumbnail missing for', fid);
          continue;
        }
        try {
          const resp = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'fetchBlob', url: thumbUrl }, (r) => resolve(r));
          });
          if (resp?.success && resp.dataUrl) {
            // dataUrl format: data:image/png;base64,XXX → split để lấy base64 + mime
            const m = resp.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (m) {
              results.push({
                base64: resp.dataUrl,
                name: `prompt_ref_${fid.substring(0, 12)}.png`,
                type: m[1] || 'image/png',
              });
            }
          }
        } catch (err) {
          console.warn('[WorkflowExecutor] fetchBlob ref failed:', fid, err.message);
        }
      }
      return results;
    }

    /**
     * Phase CG-8: Resolve effective prompt cho generate/chatgpt/grok
     * khi prompt_source = 'upstream_node'. Trả { text, source }.
     *
     * source: 'textbox' | 'upstream_node' | 'textbox_fallback'
     */
    _resolveEffectivePrompt(node, workflow) {
      if (node.prompt_source !== 'upstream_node') {
        return { text: node.prompt || '', source: 'textbox' };
      }
      const upstream = this._getUpstreamPromptNode(node, workflow);
      if (!upstream) {
        // Không có edge → fallback textbox + warning (caller log)
        return { text: node.prompt || '', source: 'textbox_fallback' };
      }
      if (!upstream.result_text) {
        const err = new Error(`Upstream "${upstream.node_name || upstream.node_id}" chưa có result_text`);
        err.code = 'UPSTREAM_NOT_READY';
        throw err;
      }
      let text = upstream.result_text.trim();
      // Truncate output > prompt_max_length chars để tránh Flow API reject.
      // Source of truth: ValidationRules (admin tweak qua /admin/validation-rules).
      const maxLen = window.ValidationRules?.getInt?.('prompt_max_length', 5000) ?? 5000;
      if (text.length > maxLen) {
        console.warn(`[WorkflowExecutor] Upstream prompt > ${maxLen} chars — truncating`);
        text = text.substring(0, maxLen);
      }
      return { text, source: 'upstream_node' };
    }

    /**
     * Tìm upstream Prompt node từ edges → trả về node hoặc null.
     */
    _getUpstreamPromptNode(node, workflow) {
      const edges = workflow?.edges || [];
      const nodes = workflow?.nodes || [];
      for (const edge of edges) {
        if (edge.target_node_id !== node.node_id) continue;
        const src = nodes.find(n => n.node_id === edge.source_node_id);
        if (src?.node_type === 'prompt') return src;
      }
      return null;
    }

    /**
     * Lấy tất cả tile IDs hiện tại trên Google Flow
     */
    async _getCurrentTileIds(nodeAccum = null) {
      if (this._isContentScriptContext()) {
        const tiles = document.querySelectorAll('[data-tile-id]');
        return [...new Set(Array.from(tiles).map(t => t.dataset.tileId).filter(Boolean))];
      } else if (window.MessageBridge) {
        const result = await window.MessageBridge.getCurrentTileIds();
        // Cache fileNames cho _waitForNewTiles sử dụng (per-node khi có accumulator)
        const preFileNames = result?.fileNames ? new Set(result.fileNames) : null;
        this._lastPreFileNames = preFileNames;
        // Store preFileNames trên per-node accumulator (parallel-safe)
        const accum = nodeAccum || this._currentNodeAccum;
        if (accum) {
          accum.preFileNames = preFileNames;
        }
        return result?.tileIds || [];
      }
      log('Warning: No method available to get tile IDs');
      return [];
    }

    /**
     * Apply settings: media type, ratio, model, quantity
     */
    async _applySettings(node) {
      const isVideo = node.media_type === 'Video';
      const isVideoFrames = isVideo && node.video_input_type === 'Frames';
      const quantity = node.quantity || 1;

      log('Applying settings:', {
        mediaType: node.media_type,
        ratio: node.ratio,
        model: node.model,
        videoInputType: node.video_input_type,
        isVideoFrames,
        quantity
      });

      // applySettings(genType, aspectRatio, modelName, hasRefs, quantity)
      // hasRefs param is used by content.js to pick Frames vs Ingredients for Video
      // quantity param clicks x1/x2/x3/x4 in Flow menu
      const defaults = await this._getGenDefaults();
      const genType = node.media_type || defaults.genType;
      const ratio = node.ratio || defaults.ratio;
      const model = isVideo ? (node.model || defaults.videoModel) : (node.model || defaults.imageModel);

      if (typeof applySettings === 'function') {
        log('Using direct applySettings');
        await applySettings(genType, ratio, model, isVideoFrames, quantity);
      } else if (window.MessageBridge) {
        log('Using MessageBridge for applySettings');
        await window.MessageBridge.applySettings(genType, ratio, model, isVideoFrames, quantity);
      } else {
        log('Warning: applySettings function not available');
        await this._sleep(500);
      }
    }

    /**
     * Clear editor content - delegate to content.js
     */
    async _clearEditor() {
      if (typeof getEditor === 'function' && typeof clearEditor === 'function') {
        const editor = getEditor();
        if (editor) {
          clearEditor(editor);
          log('Editor cleared (direct)');
        }
      } else if (window.MessageBridge) {
        log('Using MessageBridge for clearEditor');
        await window.MessageBridge.clearEditor();
      } else {
        log('Warning: clearEditor not available');
      }
    }

    /**
     * [Bug fix] Xóa ref images cũ trong prompt area - delegate to content.js
     * KHÔNG dùng clearEditor (chỉ xóa text Slate, không xóa ref image thumbnails).
     */
    async _removeExistingRefImages() {
      if (typeof removeExistingRefImages === 'function') {
        const removed = await removeExistingRefImages();
        if (removed > 0) log(`Đã xóa ${removed} ref images cũ (direct)`);
      } else if (window.MessageBridge) {
        log('Using MessageBridge for removeExistingRefImages');
        await window.MessageBridge.removeExistingRefImages();
      } else {
        log('Warning: removeExistingRefImages not available');
      }
    }

    /**
     * Lấy inputTimeout setting (ms), fallback 1200ms
     */
    _getInputTimeoutMs() {
      if (typeof getInputTimeoutMs === 'function') {
        return getInputTimeoutMs();
      }
      const s = window.storageSettings?.getSettings() || {};
      return s.inputTimeout || 1200;
    }

    // Derived — không cần settings riêng
    _getClearEditorDelay() {
      return Math.round(this._getInputTimeoutMs() * 0.4);
    }

    _getSubmitDelay() {
      return Math.round(this._getInputTimeoutMs() * 0.5);
    }

    _getAfterSubmitDelay() {
      return Math.round(this._getInputTimeoutMs() * 0.8);
    }

    _getDelayBetweenPromptsMs() {
      const s = window.storageSettings?.getSettings() || {};
      return (s.delayBetweenPrompts || 5) * 1000;
    }

    _getRandomDelay() {
      const s = window.storageSettings?.getSettings() || {};
      const min = (s.randomDelayMin || 3) * 1000;
      const max = (s.randomDelayMax || 10) * 1000;
      return min + Math.random() * (max - min);
    }

    /**
     * Extract file_name (UUID) from a tile element for cross-project validation
     * Looks for getMediaUrlRedirect?name=UUID in img src, a href, or data attributes
     * @param {Element} tile - DOM element with data-tile-id
     * @returns {string|null} - UUID if found, null otherwise
     */
    _extractFileNameFromTile(tile) {
      if (!tile) return null;
      const candidates = [
        ...tile.querySelectorAll('img[src*="getMediaUrlRedirect"]'),
        ...tile.querySelectorAll('a[href*="getMediaUrlRedirect"]'),
      ];
      for (const el of candidates) {
        const url = el.src || el.href;
        const fileName = this._extractFileNameFromUrl(url);
        if (fileName) return fileName;
      }
      // Check data-redirect-url attribute
      const redirectUrl = tile.dataset?.redirectUrl || tile.getAttribute('data-redirect-url');
      if (redirectUrl) {
        const fileName = this._extractFileNameFromUrl(redirectUrl);
        if (fileName) return fileName;
      }
      return null;
    }

    /**
     * Extract file_name (UUID) from a URL containing getMediaUrlRedirect?name=UUID
     * @param {string} url
     * @returns {string|null}
     */
    _extractFileNameFromUrl(url) {
      if (!url) return null;
      try {
        const urlObj = new URL(url, window.location.origin);
        const name = urlObj.searchParams.get('name');
        if (name && /^[a-f0-9-]{8,}$/i.test(name)) return name;
        // Also handle tRPC input format
        const input = urlObj.searchParams.get('input');
        if (input) {
          const inputObj = JSON.parse(decodeURIComponent(input));
          if (inputObj?.name && /^[a-f0-9-]{8,}$/i.test(inputObj.name)) return inputObj.name;
        }
      } catch (e) { /* ignore */ }
      return null;
    }

    /**
     * Insert prompt vào editor - delegate to content.js
     */
    async _insertPrompt(prompt) {
      if (typeof getEditor === 'function' && typeof insertText === 'function') {
        const editor = getEditor();
        if (editor) {
          await insertText(editor, prompt);
          log('Prompt inserted (direct):', prompt.substring(0, 50) + '...');
        }
      } else if (window.MessageBridge) {
        log('Using MessageBridge for insertText');
        await window.MessageBridge.insertText(prompt);
      } else {
        log('Warning: insertText not available');
      }
    }

    /**
     * Add file ID to prompt as reference - delegate to content.js
     * @param {string} fileId - data-tile-id
     * @param {string} [fileName] - persistent UUID from getMediaUrlRedirect (Tầng 1 fallback)
     * @param {string} [flowFileId] - persistent file_id from /edit/{file_id} (Phase U)
     */
    async _addFileToPrompt(fileId, fileName, flowFileId) {
      if (typeof addFileToPrompt === 'function') {
        // Content script context - can check DOM directly
        const tileExists = !!document.querySelector(`[data-tile-id="${fileId}"]`);
        if (!tileExists) {
          log('WARNING: Tile not found on page for fileId:', fileId, '- trying file_name fallback');
        }
        log('Using direct addFileToPrompt');
        await addFileToPrompt(fileId, fileName, flowFileId || null);
      } else if (window.MessageBridge) {
        log('Using MessageBridge for addFileToPrompt:', fileId, fileName ? `(file_name: ${fileName.substring(0, 20)}...)` : '');
        await window.MessageBridge.addFileToPrompt(fileId, fileName, flowFileId || null);
      } else {
        log('Warning: addFileToPrompt not available');
      }
    }

    /**
     * Click submit button - delegate to content.js
     * Chờ button xuất hiện và enabled trước khi click
     */
    async _clickSubmit() {
      if (this._isContentScriptContext()) {
        // Direct DOM access - poll for submit button
        const maxWait = 10000; // 10s max wait for submit button
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
          const btn = getSubmitButton();

          if (btn) {
            if (btn.disabled) {
              log('Submit button found but disabled, waiting...');
              await this._sleep(500);
              continue;
            }
            // Dùng simulateClick để giả lập chuỗi pointer/mouse events (giống user thực)
            if (typeof simulateClick === 'function') {
              simulateClick(btn);
            } else {
              btn.click();
            }
            log('Submit clicked (direct)');
            await this._sleep(this._getAfterSubmitDelay());
            return;
          }

          log('Submit button not found yet, waiting...');
          await this._sleep(500);
        }

        throw new Error('Submit button not found or disabled after 10s');
      } else if (window.MessageBridge) {
        // Retry via MessageBridge - content.js returns { success: bool }
        const maxWait = 10000;
        const startTime = Date.now();
        while (Date.now() - startTime < maxWait) {
          const result = await window.MessageBridge.clickSubmit();
          if (result?.success) {
            log('Submit clicked (MessageBridge)');
            await this._sleep(this._getAfterSubmitDelay());
            return;
          }
          log('Submit not ready via MessageBridge, retrying...');
          await this._sleep(500);
        }
        throw new Error('Submit button not found or disabled after 10s');
      } else {
        throw new Error('clickSubmit not available - no content script or MessageBridge');
      }
    }

    /**
     * Wait for new tiles to appear and complete
     */
    async _waitForNewTiles(preTileIds, timeout, preFileNames = null, nodeAccum = null, quantity = 0) {
      // When not in content script, delegate entirely to content script's polling logic
      if (!this._isContentScriptContext() && window.MessageBridge) {
        log('Using MessageBridge for waitForNewTiles');
        const opts = preFileNames
          ? { preFileNames: Array.from(preFileNames), maxQuantity: quantity }
          : { captureFileNames: true, maxQuantity: quantity };
        const result = await window.MessageBridge.waitForNewTiles(preTileIds, timeout, opts);
        // content.js returns { tiles: [...], failed: bool, thumbnails: {...} }
        if (result?.failed) {
          throw new Error('Google Flow trả về lỗi khi tạo nội dung');
        }
        // Merge thumbnails + file_names vào per-node accumulator (hoặc fallback shared)
        if (result?.thumbnails) {
          const thumbTarget = nodeAccum?.thumbnails ?? this._lastTileThumbnails;
          const fnTarget = nodeAccum?.fileNames ?? this._lastTileFileNames;
          Object.assign(thumbTarget, result.thumbnails);
          // Extract file_names from thumbnail data
          for (const [tid, info] of Object.entries(result.thumbnails)) {
            if (info?.file_name) {
              fnTarget[tid] = info.file_name;
            }
          }
        }
        return result?.tiles || [];
      }

      // Direct DOM polling in content script context
      const startTime = Date.now();
      const preSet = new Set(preTileIds);
      const MIN_FAIL_DETECT_MS = 15000; // Chờ 15s trước khi detect fail (tránh false positive)

      while (Date.now() - startTime < timeout) {
        // Phase 5.2: Check per-node submitted tracking (any node submitted = don't abort)
        const hasSubmittedNodes = this._submittedNodes && this._submittedNodes.size > 0;
        if (this.shouldStop && !hasSubmittedNodes) {
          throw new Error('Execution stopped by user');
        }

        await new Promise(r => setTimeout(r, 2000));

        const currentTileIds = await this._getCurrentTileIds();
        const newTiles = currentTileIds.filter(id => !preSet.has(id));

        if (newTiles.length > 0) {
          const elapsed = Date.now() - startTime;
          let allComplete = true;
          let hasError = false;
          for (const tileId of newTiles) {
            const tile = document.querySelector(`[data-tile-id="${tileId}"]`);
            if (!tile) continue;

            // Chỉ check fail sau 15s (tile vừa render có thể flash warning icon tạm thời)
            if (elapsed >= MIN_FAIL_DETECT_MS) {
              const warningIcons = tile.querySelectorAll('.google-symbols');
              let tileIsFailed = false;
              for (const icon of warningIcons) {
                if (icon.textContent.trim() !== 'warning') continue;
                let parent = icon.parentElement;
                let isHidden = false;
                while (parent && parent !== tile) {
                  if (parent.style && parent.style.opacity === '0') {
                    isHidden = true;
                    break;
                  }
                  parent = parent.parentElement;
                }
                if (!isHidden) { tileIsFailed = true; break; }
              }
              if (tileIsFailed) {
                hasError = true;
                break;
              }
            }

            // Check for media content (success = has img/video with real src)
            // Ưu tiên <video> trước — video tiles có cả <img> (ref) lẫn <video> (result)
            const media = tile.querySelector('video') || tile.querySelector('img');
            if (!media || !media.src || media.src.startsWith('data:')) {
              allComplete = false;
              break;
            }
          }

          if (hasError) {
            throw new Error('Google Flow trả về lỗi khi tạo nội dung');
          }

          if (allComplete) {
            log('New tiles completed:', newTiles);
            return newTiles;
          }
        }
      }

      throw new Error('Timeout waiting for generation');
    }

    /**
     * Dual URL — build lookup `{ tileId: { url, provider, media_type, tab_id, captured_at } }`
     * từ tất cả upstream nodes có `result_provider_urls`. Download node sử dụng để route
     * tile sang download path provider gốc (chất lượng 100%) thay vì Flow re-encoded.
     */
    _buildProviderUrlLookup(nodes) {
      const lookup = {};
      if (!Array.isArray(nodes)) return lookup;
      for (const n of nodes) {
        const map = n?.result_provider_urls;
        if (!map || typeof map !== 'object') continue;
        for (const [tileId, data] of Object.entries(map)) {
          if (data?.url && !lookup[tileId]) lookup[tileId] = data;
        }
      }
      return lookup;
    }

    /**
     * Dual URL — fetch URL provider gốc qua cookie session tab + download via chrome.downloads.
     * Trả `true` nếu thành công, `false` nếu fail (caller fallback sang Flow context menu).
     */
    async _downloadProviderTileDirect(fileId, providerData, promptText, index, subfolder, fileName) {
      const { url, provider, media_type, tab_id } = providerData;
      if (!url || !window.MessageBridge) return false;

      try {
        const fetchFn = provider === 'chatgpt'
          ? window.MessageBridge.chatGPTFetchImage
          : provider === 'grok'
            ? window.MessageBridge.grokFetchImage
            : null;
        if (!fetchFn) return false;

        const fetchResp = await fetchFn(url, tab_id);
        if (!fetchResp?.success || !fetchResp.base64) {
          console.warn('[WorkflowExecutor] Provider fetch fail:', provider, fetchResp?.error);
          return false; // Caller fallback Flow path (provider URL có thể expired)
        }

        const blob = await (await fetch(fetchResp.base64)).blob();
        const blobUrl = URL.createObjectURL(blob);
        const ext = media_type === 'video' ? 'mp4' : 'png';

        const settings = await new Promise((resolve) => {
          chrome.storage.local.get(['af_settings'], (res) => resolve(res.af_settings || {}));
        });
        const folder = settings.downloadFolder || 'flow-output';
        const template = settings.downloadTemplate || '[Date]_[Project]_[Prompt]_[Index]';
        const wfName = subfolder || this.currentWorkflow?.wf_name || null;

        let filename = window.GenTab?._buildChatGPTFilename?.(
          template,
          window._currentProjectName || 'flow',
          promptText || '',
          1, index, '',
          wfName,
          folder
        ) || `${folder}/${(wfName || 'workflow').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)}/${provider}-${Date.now()}-${index}.${ext}`;
        if (ext !== 'png' && filename.endsWith('.png')) {
          filename = filename.replace(/\.png$/i, `.${ext}`);
        }

        const dlResp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'chromeDownload', url: blobUrl, filename }, (r) => resolve(r));
        });
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

        return !!dlResp?.success;
      } catch (err) {
        console.error('[WorkflowExecutor] _downloadProviderTileDirect exception:', err);
        return false;
      }
    }

    /**
     * Download single tile via content script or MessageBridge
     * @param {string} fileId - tile_id (session-specific)
     * @param {string} promptText - for filename generation
     * @param {string} [resolution] - '1k' | '2k'
     * @param {string} [fileName] - file_name UUID (persistent)
     * @param {string} [flowFileId] - persistent file_id from /edit/{file_id} (Phase U)
     * @param {string} [taskName] - Subfolder name (từ node.download_folder hoặc workflow name)
     */
    async _downloadSingleTile(fileId, promptText, resolution, fileName, flowFileId, taskName) {
      // taskName ưu tiên: param truyền vào > workflow name > null
      const folderName = taskName !== undefined ? taskName : (this.currentWorkflow?.wf_name || null);
      if (this._isContentScriptContext() && typeof downloadTileMedia === 'function') {
        await downloadTileMedia(fileId, promptText, folderName, fileName || null, resolution, flowFileId || null);
      } else if (window.MessageBridge) {
        await window.MessageBridge.downloadTileMedia(fileId, promptText, folderName, fileName || null, resolution, flowFileId || null);
      }
    }

    /**
     * Download multiple tiles with delay between each
     * @param {string[]} fileIds - tile IDs
     * @param {string} promptText - for filename generation
     * @param {string} [resolution] - '1k' | '2k'
     * @param {Object} [fileNameMap] - { tileId: fileName } for cross-project safety
     * @param {string} [taskName] - Subfolder name (null = dùng workflow name)
     */
    async _downloadTiles(fileIds, promptText, resolution, fileNameMap, taskName) {
      // Dedup: tránh download trùng giữa các nodes trong cùng workflow
      // (VD: node generate có auto_download=true + node Download cuối cùng)
      if (!this._downloadedTileIds) this._downloadedTileIds = new Set();

      for (const tid of fileIds) {
        // Skip nếu tile đã được download trong workflow session này
        if (this._downloadedTileIds.has(tid)) {
          log(`Skip tile đã download: ${tid.substring(0, 20)}`);
          continue;
        }

        const fn = fileNameMap?.[tid] || null;
        await this._downloadSingleTile(tid, promptText, resolution, fn, null, taskName);
        this._downloadedTileIds.add(tid);
        await this._sleep(300);
      }
    }

    /**
     * Update node status in storage
     */
    async _updateNodeStatus(nodeId, status, fileIds = null, errorMessage = null, extra = null) {
      const data = { status };
      if (fileIds && (Array.isArray(fileIds) ? fileIds.length > 0 : fileIds)) {
        data.result_file_ids = Array.isArray(fileIds) ? fileIds.join(', ') : fileIds;
      }
      if (errorMessage) {
        data.error_message = errorMessage;
      }
      if (status === 'completed' || status === 'failed') {
        data.executed_at = new Date().toISOString();
      }
      // Bug fix ChatGPT/Grok image node: trước khi forward thumbnails/file_names qua extra,
      // PATCH endpoint chỉ persist result_file_ids → reload workflow → gallery trống vì
      // synthetic IDs (cg_xxx, grok_xxx) không có thumbnail data trong DOM Flow.
      if (extra && typeof extra === 'object') {
        if (extra.result_thumbnails) data.result_thumbnails = extra.result_thumbnails;
        if (extra.result_file_names) data.result_file_names = extra.result_file_names;
        // Dual URL — provider URL gốc (Grok/ChatGPT) cho manual download chất lượng 100%
        if (extra.result_provider_urls) data.result_provider_urls = extra.result_provider_urls;
        // Phase CG-8 — Prompt node: persist enhanced/plain text output cho downstream node.
        // Trước fix, result_text chỉ tồn tại trong memory → reload là mất → upstream_node fail.
        if (typeof extra.result_text === 'string') data.result_text = extra.result_text;
        if (typeof extra.result_source === 'string') data.result_source = extra.result_source;
      }

      // [API SPAM FIX — Phase 1.1] Update local workflow object TRƯỚC, để cả 2 path
      // (skip 'running' và persist 'completed'/'failed') đều giữ in-memory state.
      const node = this.currentWorkflow?.nodes?.find(n => n.node_id === nodeId);
      if (node) {
        Object.assign(node, data);
      }

      // [API SPAM FIX — Phase 1.1] Skip API call cho status='running' — transient state,
      // không cần persist DB. UI vẫn nhận update qua node:started event broadcast trong
      // _executeSingleNode (line ~921, 935) → workflow-editor-init listener cập nhật node UI.
      // Khi reload extension giữa workflow run: status node về 'pending' (không phải 'running'
      // giả) — acceptable vì af_running_workflow flag đã clear ở finally block của execute().
      // Reduces ~5 PATCH calls per 5-node workflow.
      if (status === 'running') {
        return;
      }

      // [API SPAM FIX — Phase 5] Buffer node state trong execution, flush 1 lần cuối
      // Thay vì N PATCH calls (mỗi node completed = 1 PATCH), buffer in-memory và
      // _flushNodeStateBuffer() gọi saveWorkflowFull() = 1 PUT toàn workflow.
      // Ngoài execution (vd manual single-node re-run) → call API ngay như cũ.
      if (this._executionInProgress) {
        const existing = this._nodeStateBuffer.get(nodeId) || {};
        this._nodeStateBuffer.set(nodeId, { ...existing, ...data });
        return;
      }

      await window.storageManager.updateNodeStatus(
        this.currentWorkflow.wf_id,
        nodeId,
        data
      );
    }

    /**
     * [API SPAM FIX — Phase 5] Flush buffered node states lên server = 1 PUT workflow_full.
     * Gọi cuối execute() (success hoặc error) để persist tất cả node final states.
     * Thay N PATCH calls (mỗi node) = 1 PUT toàn workflow → giảm ~70% API calls.
     */
    async _flushNodeStateBuffer() {
      if (this._nodeStateBuffer.size === 0) return;
      if (!this.currentWorkflow?.wf_id) {
        console.warn('[WorkflowExecutor] Cannot flush buffer: no current workflow');
        return;
      }

      // Merge buffer vào workflow.nodes để tạo snapshot đầy đủ
      const updatedNodes = (this.currentWorkflow.nodes || []).map(n => {
        const buffered = this._nodeStateBuffer.get(n.node_id);
        return buffered ? { ...n, ...buffered } : n;
      });

      try {
        // saveWorkflowFull = 1 PUT với workflow + nodes + edges
        await window.storageManager.saveWorkflowFull(
          this.currentWorkflow,
          updatedNodes,
          this.currentWorkflow?.edges || []
        );
        log('Flushed node state buffer:', this._nodeStateBuffer.size, 'nodes');
      } catch (e) {
        console.error('[WorkflowExecutor] Flush buffer failed, fallback PATCH từng node:', e);
        // Fallback: PATCH từng node 1 (đảm bảo không mất data)
        // Guard: kiểm tra lại vì saveWorkflowFull là async
        if (!this.currentWorkflow?.wf_id) return;
        for (const [nodeId, data] of this._nodeStateBuffer) {
          try {
            await window.storageManager.updateNodeStatus(
              this.currentWorkflow.wf_id, nodeId, data
            );
          } catch (err) {
            console.error('[WorkflowExecutor] Fallback PATCH failed for node:', nodeId, err);
          }
        }
      }
    }

    /**
     * Update workflow status
     */
    async _updateWorkflowStatus(status) {
      // Guard: nếu workflow đã bị stop/clear thì skip
      if (!this.currentWorkflow?.wf_id) {
        console.warn('[WorkflowExecutor] _updateWorkflowStatus skipped - no current workflow');
        return;
      }
      const now = new Date().toISOString();
      const data = {
        wf_id: this.currentWorkflow.wf_id,
        status,
        updated_at: now
      };
      // Track last run time when starting
      if (status === 'running') {
        data.last_run_at = now;
      }
      console.log('[WorkflowExecutor] _updateWorkflowStatus:', status, 'wfId:', data.wf_id);
      await window.storageManager.saveWorkflow(data);
      console.log('[WorkflowExecutor] _updateWorkflowStatus done');
      // Guard: kiểm tra lại vì saveWorkflow là async
      if (!this.currentWorkflow) return;
      this.currentWorkflow.status = status;
      if (status === 'running') {
        this.currentWorkflow.last_run_at = now;
      }
    }

    /**
     * Update workflow progress.
     *
     * [API SPAM FIX — Phase 1.2] Trước fix: gọi PUT toàn workflow chỉ để update 4 field
     * (progress_completed, progress_total, current_node_id, updated_at) → mỗi node = 1 PUT
     * dư thừa. Reduces ~5 PUT calls per 5-node workflow.
     *
     * Sau fix: chỉ update in-memory + emit event. UI listeners (ExecutionTracker,
     * WorkflowList progress card) đã subscribe execution:progress nên vẫn nhận update
     * realtime. Backend dashboard nhận progress=N/N qua _updateWorkflowStatus('completed')
     * cuối execution — acceptable vì realtime backend dashboard không critical.
     */
    async _updateWorkflowProgress(completed, total, currentNodeId) {
      if (this.currentWorkflow) {
        this.currentWorkflow.progress_completed = completed;
        this.currentWorkflow.progress_total = total;
        this.currentWorkflow.current_node_id = currentNodeId;
      }
      // emitProgress() đã được caller gọi trước (line ~539, 595) → UI tự cập nhật.
      // Không cần API call.
    }

    /**
     * Sleep utility — breaks into 500ms chunks to allow stop checking
     */
    async _sleep(ms) {
      const chunks = Math.ceil(ms / 500);
      for (let i = 0; i < chunks; i++) {
        if (this.shouldStop) return;
        await new Promise(resolve => setTimeout(resolve, Math.min(500, ms - i * 500)));
      }
    }
  }

  // Export as singleton
  window.WorkflowExecutor = WorkflowExecutor;
  window.workflowExecutor = new WorkflowExecutor();

  // Gap 2 fix: expose TTL-aware running flag check để callers (WorkflowEditor,
  // WorkflowTab) dùng thay vì đọc trực tiếp af_running_workflow → tự động xử
  // lý stale flag (>30 phút auto-clear).
  WorkflowExecutor.getCrossContextRunning = readRunningFlag;
  WorkflowExecutor.clearCrossContextRunning = clearRunningFlag;

  /**
   * [API SPAM FIX — Phase 5.10] Recover buffered node states từ crash checkpoint.
   * Gọi khi load workflow trong editor để flush pending states nếu browser crash giữa execution.
   * @param {string} wfId - workflow ID
   * @returns {Promise<boolean>} - true nếu có buffer recovered, false nếu không
   */
  WorkflowExecutor.recoverBufferCheckpoint = async function(wfId) {
    if (!wfId) return false;
    try {
      const storageKey = `af_workflow_buffer_${wfId}`;
      const data = await new Promise(resolve => {
        chrome.storage.local.get([storageKey], r => resolve(r));
      });
      const buffer = data[storageKey];
      if (!buffer?.nodes || Object.keys(buffer.nodes).length === 0) return false;

      // Stale check: nếu buffer > 30 phút → ignore (workflow đã xong lâu rồi)
      const BUFFER_TTL_MS = 30 * 60 * 1000;
      if (buffer.timestamp && Date.now() - buffer.timestamp > BUFFER_TTL_MS) {
        console.info('[WorkflowExecutor] Discarding stale buffer checkpoint (>', BUFFER_TTL_MS/60000, 'min old)');
        chrome.storage.local.remove([storageKey]);
        return false;
      }

      // Flush stale buffer lên server từng node
      console.info('[WorkflowExecutor] Recovering buffer checkpoint:', Object.keys(buffer.nodes).length, 'nodes');
      for (const [nodeId, nodeData] of Object.entries(buffer.nodes)) {
        try {
          await window.storageManager?.updateNodeStatus(wfId, nodeId, nodeData);
        } catch (e) {
          console.warn('[WorkflowExecutor] Recovery PATCH failed for node:', nodeId, e);
        }
      }

      // Clear checkpoint sau recovery thành công
      chrome.storage.local.remove([storageKey]);
      console.info('[WorkflowExecutor] Buffer checkpoint recovered and cleared');
      return true;
    } catch (e) {
      console.error('[WorkflowExecutor] Buffer recovery error:', e);
      return false;
    }
  };

})();
