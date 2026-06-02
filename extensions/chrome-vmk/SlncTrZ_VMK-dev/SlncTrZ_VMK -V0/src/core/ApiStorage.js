/**
 * ApiStorage - Lưu trữ dữ liệu qua REST API backend
 * Cùng interface với LocalStorage, dùng thay thế khi có kết nối server
 * Gọi API thông qua AuthManager._apiCall() -> background.js proxy
 *
 * PATCHED: Delegates all operations to LocalStorage for offline standalone mode.
 */
class ApiStorage {
  constructor() {
    this._local = new LocalStorage();
  }

  _handleAuthError(err) { return false; }
  _handleQuotaError(err) { return false; }

  async _call() { throw Object.assign(new Error('[ApiStorage] Backend disabled'), { _isOffline: true }); }

  // ===== TASKS =====
  async getTasks(o) { return this._local.getTasks(o); }
  async getTask(id) { return this._local.getTask(id); }
  async saveTask(t) { return this._local.saveTask(t); }
  async deleteTask(id) { return this._local.deleteTask(id); }
  async updateTaskStatus(id, s, f, e) { return this._local.updateTaskStatus(id, s, f, e); }

  // ===== WORKFLOWS =====
  async getWorkflows(o) { return this._local.getWorkflows(o); }
  async getWorkflow(id) { return this._local.getWorkflow(id); }
  async saveWorkflow(w) { return this._local.saveWorkflow(w); }
  async deleteWorkflow(id) { return this._local.deleteWorkflow(id); }

  // ===== NODES =====
  async getNodes(id) { return this._local.getNodes(id); }
  async saveNode(id, n) { return this._local.saveNode(id, n); }
  async deleteNode(id, nid) { return this._local.deleteNode(id, nid); }
  async updateNodeStatus(id, nid, d) { return this._local.updateNodeStatus(id, nid, d); }

  // ===== EDGES =====
  async getEdges(id) { return this._local.getEdges(id); }
  async saveEdge(id, e) { return this._local.saveEdge(id, e); }
  async deleteEdge(id, eid) { return this._local.deleteEdge(id, eid); }

  // ===== BULK =====
  async saveWorkflowFull(w, n, e) { return this._local.saveWorkflowFull(w, n, e); }
  async resetWorkflow(id) { return this._local.resetWorkflow(id); }
}

window.ApiStorage = ApiStorage;
