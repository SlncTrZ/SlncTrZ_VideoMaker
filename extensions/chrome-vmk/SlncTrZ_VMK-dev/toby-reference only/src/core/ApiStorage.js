/**
 * ApiStorage - Lưu trữ dữ liệu qua REST API backend
 * Cùng interface với LocalStorage, dùng thay thế khi có kết nối server
 * Gọi API thông qua AuthManager._apiCall() -> background.js proxy
 */
class ApiStorage {
  constructor() {
    // Không cần KEYS vì dữ liệu nằm trên server
  }

  // Flag để tránh emit nhiều lần
  static _authErrorEmitted = false;

  /**
   * Xử lý lỗi authentication - chuyển về local mode
   * @returns {boolean} true nếu là lỗi auth
   */
  _handleAuthError(err) {
    const isAuthError = err.httpStatus === 401 || err.httpStatus === 403 ||
      err.code === 'UNAUTHENTICATED' || err.message?.includes('đăng nhập');

    if (isAuthError && window.storageManager?.mode === 'api' && !ApiStorage._authErrorEmitted) {
      ApiStorage._authErrorEmitted = true;
      console.warn('[ApiStorage] Auth error detected, emitting api:auth_error');
      // Emit event để app.js handle logout properly
      window.eventBus?.emit('api:auth_error', { error: err });
      // Reset flag sau 5s để cho phép detect lại nếu user login rồi lại bị lỗi
      setTimeout(() => { ApiStorage._authErrorEmitted = false; }, 5000);
    }
    return isAuthError;
  }

  /**
   * Kiểm tra và hiển thị modal nếu lỗi QUOTA_EXCEEDED
   * @returns {boolean} true nếu là lỗi quota
   */
  _handleQuotaError(err) {
    console.log('[ApiStorage] Checking quota error:', {
      code: err.code,
      httpStatus: err.httpStatus,
      message: err.message
    });

    // Check explicit error code only — KHÔNG suy luận từ httpStatus 403
    // (403 có thể là authorization fail / cross-user wf_id collision, không phải quota).
    // Backend phải trả `code: 'QUOTA_EXCEEDED'` hoặc 'WORKFLOW_QUOTA_EXCEEDED' rõ ràng.
    const isQuotaError = err.code === 'QUOTA_EXCEEDED' ||
      err.code === 'WORKFLOW_QUOTA_EXCEEDED' ||
      err.message?.includes('QUOTA_EXCEEDED');

    if (isQuotaError) {
      const dialog = window.customDialog || window.CustomDialog;
      if (dialog) {
        const message = err.message || 'Bạn đã đạt giới hạn theo gói hiện tại';
        dialog.alert(
          message + '\n\nVui lòng nâng cấp lên Premium để sử dụng không giới hạn.',
          { title: 'Đã đạt giới hạn', type: 'warning' }
        );
      } else {
        // Fallback to native alert if CustomDialog not available
        alert('Đã đạt giới hạn: ' + (err.message || 'Vui lòng nâng cấp Premium'));
      }
      return true;
    }
    return false;
  }

  /**
   * Lấy AuthManager instance
   */
  _auth() {
    if (!window.authManager) {
      throw new Error('AuthManager chưa được khởi tạo');
    }
    return window.authManager;
  }

  /**
   * Gọi API và trả về phần data từ response
   * Includes retry logic with exponential backoff for network errors
   * Uses RequestCoalescer for GET requests in popup windows to avoid duplicate calls
   */
  async _call(method, endpoint, data = null, retries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Use RequestCoalescer for GET requests (popup windows delegate to sidePanel)
        // This prevents multiple popup windows from making duplicate API calls
        let response;
        if (method === 'GET' && window.RequestCoalescer?.isReady()) {
          response = await window.RequestCoalescer.request(method, endpoint, data);
        } else {
          response = await this._auth()._apiCall(method, endpoint, data);
        }
        return response;
      } catch (err) {
        lastError = err;

        // Handle auth errors immediately - don't retry
        if (this._handleAuthError(err)) {
          throw err;
        }

        // Only retry on network errors, not on HTTP errors like 400, 401, 403, 404
        const isNetworkError = !err.httpStatus || err.message?.includes('network') ||
                               err.message?.includes('Failed to fetch') || err.message?.includes('timeout');
        if (!isNetworkError || attempt >= retries) {
          throw err;
        }
        // Exponential backoff: 500ms, 1000ms, 2000ms
        const delay = Math.min(500 * Math.pow(2, attempt), 2000);
        console.warn(`[ApiStorage] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries}):`, err.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  // ===== TASKS =====

  /**
   * Lấy danh sách tasks với pagination
   * @param {Object} options - { page, per_page, search, project_id }
   * @returns {Object} { data: [], meta: { current_page, last_page, per_page, total } }
   */
  async getTasks(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.per_page) params.set('per_page', String(options.per_page));
      if (options.search) params.set('search', options.search);
      if (options.project_id) params.set('project_id', options.project_id);

      const query = params.toString();
      const endpoint = query ? `tasks?${query}` : 'tasks';
      const result = await this._call('GET', endpoint);
      console.log('[TobyFlow] ApiStorage: Lấy danh sách tasks thành công');

      if (Array.isArray(result)) {
        return { data: result, meta: { current_page: 1, last_page: 1, total: result.length } };
      }
      return {
        data: result.data || [],
        meta: result.meta || { current_page: 1, last_page: 1, total: result.data?.length || 0 }
      };
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi lấy danh sách tasks', err.message);
      return { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
    }
  }

  /**
   * Lấy chi tiết 1 task theo task_id
   */
  async getTask(taskId) {
    try {
      const result = await this._call('GET', `tasks/${taskId}`);
      return result;
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi lấy task', taskId, err.message);
      return null;
    }
  }

  /**
   * Tạo mới hoặc cập nhật task
   */
  async saveTask(task) {
    const { _isNew, ...taskData } = task;
    // Determine if this is a new task: explicitly marked _isNew, or no task_id.
    // Note: task_id always starts with 'task_' so we cannot use that as indicator.
    // Use _isNew flag or server-side 'id' (numeric PK) to distinguish.
    const isNew = _isNew || !taskData.task_id;

    // Always set platform for this extension
    taskData.platform = 'flow';

    // Auto-inject project_name nếu có project_id và biết tên project
    if (taskData.project_id && !taskData.project_name) {
      if (taskData.project_id === window._currentProjectId && window._currentProjectName) {
        taskData.project_name = window._currentProjectName;
      } else {
        // Lookup từ local cache
        try {
          const result = await chrome.storage.local.get('af_projects');
          const projects = result.af_projects || {};
          if (projects[taskData.project_id]?.name) {
            taskData.project_name = projects[taskData.project_id].name;
          }
        } catch (e) {
          // Ignore cache lookup error
        }
      }
    }

    try {
      let result;
      if (!isNew) {
        // Try PUT first (update existing task)
        result = await this._call('PUT', `tasks/${taskData.task_id}`, taskData);
        console.log('[TobyFlow] ApiStorage: Cập nhật task', taskData.task_id);
      } else {
        result = await this._call('POST', 'tasks', taskData);
        console.log('[TobyFlow] ApiStorage: Tạo task mới', result?.task_id);
      }
      return result;
    } catch (err) {
      // If PUT returns 404, the task doesn't exist on server yet — retry as POST
      if (!isNew && err.message?.includes('404')) {
        try {
          const result = await this._call('POST', 'tasks', taskData);
          console.log('[TobyFlow] ApiStorage: Tạo task mới (fallback từ 404)', result?.task_id);
          return result;
        } catch (retryErr) {
          this._handleQuotaError(retryErr);
          console.error('[TobyFlow] ApiStorage: Lỗi tạo task (fallback)', retryErr.message);
          throw retryErr;
        }
      }
      this._handleQuotaError(err);
      console.error('[TobyFlow] ApiStorage: Lỗi lưu task', err.message);
      throw err;
    }
  }

  /**
   * Xóa task theo task_id
   */
  async deleteTask(taskId) {
    try {
      await this._call('DELETE', `tasks/${taskId}`);
      console.log('[TobyFlow] ApiStorage: Xóa task', taskId);
      return true;
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi xóa task', taskId, err.message);
      throw err;
    }
  }

  /**
   * Cập nhật trạng thái task. Hỗ trợ truyền thêm result_thumbnails + result_file_names
   * (param thứ 4 - object) để fallback path persist được CDN URL của Grok/ChatGPT khi
   * saveTask full payload bị fail. Backward-compat: callers cũ truyền 2-3 args vẫn OK.
   */
  async updateTaskStatus(taskId, status, fileIds = '', extra = null) {
    try {
      const data = { status };
      if (fileIds) {
        data.result_file_ids = fileIds;
      }
      if (extra && typeof extra === 'object') {
        if (extra.result_thumbnails) data.result_thumbnails = extra.result_thumbnails;
        if (extra.result_file_names) data.result_file_names = extra.result_file_names;
        if (extra.error_message) data.error_message = extra.error_message;
        if (extra.executed_at) data.executed_at = extra.executed_at;
      }
      const result = await this._call('PATCH', `tasks/${taskId}/status`, data);
      console.log('[TobyFlow] ApiStorage: Cập nhật trạng thái task', taskId, '->', status);
      return result;
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi cập nhật trạng thái task', taskId, err.message);
      throw err;
    }
  }

  // ===== WORKFLOWS =====

  /**
   * Lấy danh sách workflows với pagination
   * @param {Object} options - { page, per_page, search, project_id, platform }
   * @returns {Object} { data: [], meta: { current_page, last_page, per_page, total } }
   */
  async getWorkflows(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.per_page) params.set('per_page', String(options.per_page));
      if (options.search) params.set('search', options.search);
      if (options.project_id) params.set('project_id', options.project_id);
      if (options.platform) params.set('platform', options.platform);

      const query = params.toString();
      const endpoint = query ? `workflows?${query}` : 'workflows';
      const result = await this._call('GET', endpoint);
      console.log('[TobyFlow] ApiStorage: Lấy danh sách workflows thành công');

      // Support cả response cũ (array) và mới (paginated object)
      if (Array.isArray(result)) {
        return { data: result, meta: { current_page: 1, last_page: 1, total: result.length } };
      }
      return {
        data: result.data || [],
        meta: result.meta || { current_page: 1, last_page: 1, total: result.data?.length || 0 }
      };
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi lấy danh sách workflows', err.message);
      // [API SPAM FIX — Phase 2.1] Re-throw rate limit errors để caller biết và giữ data cũ.
      // Trước fix: silent return empty → WorkflowList xóa danh sách → user thấy empty UI.
      if (err.code === 'RATE_LIMITED' || err.httpStatus === 429) {
        throw err;
      }
      return { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
    }
  }

  /**
   * Lấy chi tiết 1 workflow (kèm nodes + edges)
   * @returns {Object|null} workflow object or null if not found
   * @throws {Error} throws on network/auth errors (not 404)
   */
  async getWorkflow(wfId) {
    try {
      const result = await this._call('GET', `workflows/${wfId}`);
      if (result) {
        // Ensure nodes/edges are always arrays (API may not include them)
        if (!Array.isArray(result.nodes)) result.nodes = [];
        if (!Array.isArray(result.edges)) result.edges = [];
      }
      return result;
    } catch (err) {
      // 404 = workflow not found, return null (expected case)
      if (err.httpStatus === 404) {
        console.log('[TobyFlow] ApiStorage: Workflow không tồn tại', wfId);
        return null;
      }
      // Other errors (network, auth) should be re-thrown for proper handling
      console.error('[TobyFlow] ApiStorage: Lỗi lấy workflow', wfId, err.message);
      // Mark as connection error for upstream to handle
      err._isConnectionError = true;
      throw err;
    }
  }

  /**
   * Tạo mới hoặc cập nhật workflow
   */
  async saveWorkflow(workflow) {
    try {
      // Map 'settings' → 'settings_json' cho backend
      const data = { ...workflow };
      if (data.settings && !data.settings_json) {
        data.settings_json = data.settings;
        delete data.settings;
      }

      // Always set platform for this extension
      data.platform = 'flow';

      // Auto-inject project_name nếu có project_id và biết tên project
      if (data.project_id && !data.project_name) {
        if (data.project_id === window._currentProjectId && window._currentProjectName) {
          data.project_name = window._currentProjectName;
        } else {
          // Lookup từ local cache
          try {
            const result = await chrome.storage.local.get('af_projects');
            const projects = result.af_projects || {};
            if (projects[data.project_id]?.name) {
              data.project_name = projects[data.project_id].name;
            }
          } catch (e) {
            // Ignore cache lookup error
          }
        }
      }

      const isNew = !data.wf_id || data._isNew;
      delete data._isNew;

      let result;
      if (!isNew) {
        result = await this._call('PUT', `workflows/${data.wf_id}`, data);
        console.log('[TobyFlow] ApiStorage: Cập nhật workflow', data.wf_id);
      } else {
        result = await this._call('POST', 'workflows', data);
        console.log('[TobyFlow] ApiStorage: Tạo workflow mới', result?.wf_id);
      }

      // Bug 59 fix: invalidate RequestCoalescer cache để fresh fetch sau update
      const wfId = data.wf_id || result?.wf_id;
      if (wfId) {
        try { window.RequestCoalescer?.invalidate?.(`workflows/${wfId}`); } catch (e) { /* ignore */ }
      }

      return result;
    } catch (err) {
      this._handleQuotaError(err);
      console.error('[TobyFlow] ApiStorage: Lỗi lưu workflow', err.message);
      throw err;
    }
  }

  /**
   * Xóa workflow theo wf_id
   */
  async deleteWorkflow(wfId) {
    try {
      await this._call('DELETE', `workflows/${wfId}`);
      console.log('[TobyFlow] ApiStorage: Xóa workflow', wfId);
      return true;
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi xóa workflow', wfId, err.message);
      throw err;
    }
  }

  // ===== NODES =====

  /**
   * Lấy danh sách nodes của workflow
   */
  async getNodes(wfId) {
    try {
      const result = await this._call('GET', `workflows/${wfId}/nodes`);
      return Array.isArray(result) ? result : (result.data || []);
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi lấy nodes của workflow', wfId, err.message);
      return [];
    }
  }

  /**
   * Tạo mới hoặc cập nhật node trong workflow
   */
  async saveNode(wfId, node) {
    try {
      let result;
      if (node.node_id && !node._isNew) {
        result = await this._call('PUT', `workflows/${wfId}/nodes/${node.node_id}`, node);
        console.log('[TobyFlow] ApiStorage: Cập nhật node', node.node_id);
      } else {
        delete node._isNew;
        result = await this._call('POST', `workflows/${wfId}/nodes`, node);
        console.log('[TobyFlow] ApiStorage: Tạo node mới trong workflow', wfId);
      }
      return result;
    } catch (err) {
      this._handleQuotaError(err);
      console.error('[TobyFlow] ApiStorage: Lỗi lưu node', err.message);
      throw err;
    }
  }

  /**
   * Xóa node khỏi workflow
   */
  async deleteNode(wfId, nodeId) {
    try {
      await this._call('DELETE', `workflows/${wfId}/nodes/${nodeId}`);
      console.log('[TobyFlow] ApiStorage: Xóa node', nodeId, 'khỏi workflow', wfId);
      return true;
    } catch (err) {
      this._handleQuotaError(err);
      console.error('[TobyFlow] ApiStorage: Lỗi xóa node', nodeId, err.message);
      throw err;
    }
  }

  /**
   * Cập nhật trạng thái node (status, result_file_ids, error_message...)
   */
  async updateNodeStatus(wfId, nodeId, data) {
    try {
      const result = await this._call('PATCH', `workflows/${wfId}/nodes/${nodeId}/status`, data);
      return result;
    } catch (err) {
      // Soft-fail: node status update is runtime info, don't crash execution
      console.warn('[TobyFlow] ApiStorage: Lỗi cập nhật trạng thái node', nodeId, err.message);
      return null;
    }
  }

  // ===== EDGES =====

  /**
   * Lấy danh sách edges của workflow
   */
  async getEdges(wfId) {
    try {
      const result = await this._call('GET', `workflows/${wfId}/edges`);
      return Array.isArray(result) ? result : (result.data || []);
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi lấy edges của workflow', wfId, err.message);
      return [];
    }
  }

  /**
   * Tạo mới edge trong workflow
   */
  async saveEdge(wfId, edge) {
    try {
      const result = await this._call('POST', `workflows/${wfId}/edges`, edge);
      console.log('[TobyFlow] ApiStorage: Tạo edge trong workflow', wfId);
      return result;
    } catch (err) {
      this._handleQuotaError(err);
      console.error('[TobyFlow] ApiStorage: Lỗi lưu edge', err.message);
      throw err;
    }
  }

  /**
   * Xóa edge khỏi workflow
   */
  async deleteEdge(wfId, edgeId) {
    try {
      await this._call('DELETE', `workflows/${wfId}/edges/${edgeId}`);
      console.log('[TobyFlow] ApiStorage: Xóa edge', edgeId, 'khỏi workflow', wfId);
      return true;
    } catch (err) {
      this._handleQuotaError(err);
      console.error('[TobyFlow] ApiStorage: Lỗi xóa edge', edgeId, err.message);
      throw err;
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Lưu toàn bộ workflow (workflow + nodes + edges) trong 1 request
   */
  async saveWorkflowFull(workflow, nodes, edges) {
    try {
      // Flatten workflow fields lên top-level theo BulkSaveWorkflowRequest
      // Map 'settings' → 'settings_json' cho backend
      const payload = { ...workflow, nodes, edges };
      if (payload.settings && !payload.settings_json) {
        payload.settings_json = payload.settings;
        delete payload.settings;
      }

      // Always set platform for this extension
      payload.platform = 'flow';

      // Auto-inject project_name nếu có project_id và biết tên project
      if (payload.project_id && !payload.project_name) {
        if (payload.project_id === window._currentProjectId && window._currentProjectName) {
          payload.project_name = window._currentProjectName;
        } else {
          // Lookup từ local cache
          try {
            const result = await chrome.storage.local.get('af_projects');
            const projects = result.af_projects || {};
            if (projects[payload.project_id]?.name) {
              payload.project_name = projects[payload.project_id].name;
            }
          } catch (e) {
            // Ignore cache lookup error
          }
        }
      }

      const result = await this._call('POST', 'workflows/bulk-save', payload);
      console.log('[TobyFlow] ApiStorage: Lưu toàn bộ workflow', workflow.wf_id);

      // Bug 59 fix (2026-05-13): Invalidate RequestCoalescer cache cho workflow này.
      // Tránh executeSingleNode → getWorkflow ngay sau save trả về data CŨ trong dedup
      // window 500ms (vd: user edit prompt → click Run Single → executor đọc stale prompt).
      try {
        window.RequestCoalescer?.invalidate?.(`workflows/${workflow.wf_id}`);
      } catch (e) { /* ignore */ }

      return result;
    } catch (err) {
      this._handleQuotaError(err);
      console.error('[TobyFlow] ApiStorage: Lỗi lưu toàn bộ workflow', err.message);
      throw err;
    }
  }

  /**
   * Reset trạng thái workflow (đặt lại tất cả nodes về pending)
   */
  async resetWorkflow(wfId) {
    try {
      const result = await this._call('POST', `workflows/${wfId}/reset`);
      console.log('[TobyFlow] ApiStorage: Reset workflow', wfId);
      return result || true;
    } catch (err) {
      console.error('[TobyFlow] ApiStorage: Lỗi reset workflow', wfId, err.message);
      throw err;
    }
  }
}

// Export
window.ApiStorage = ApiStorage;
