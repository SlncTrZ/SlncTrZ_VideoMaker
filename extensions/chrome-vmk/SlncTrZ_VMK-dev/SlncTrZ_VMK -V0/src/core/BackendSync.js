/**
 * BackendSync - Đồng bộ kết quả (file IDs, image URLs) lên backend
 * Chỉ hoạt động khi user đã đăng nhập (authManager.isLoggedIn)
 * Fire-and-forget: không block execution flow
 *
 * PATCHED: Disabled for offline standalone operation (no backend).
 */
class BackendSync {
  static _disabled = true;

  static init() {}

  static async _syncNodeResult(data) {}

  static async _syncTaskResult(data) {}

  static async _resolveFileUrls(fileIds) { return []; }

  static async _apiCall(method, endpoint, data) {
    throw new Error('[BackendSync] Disabled for offline mode');
  }
}

window.BackendSync = BackendSync;
