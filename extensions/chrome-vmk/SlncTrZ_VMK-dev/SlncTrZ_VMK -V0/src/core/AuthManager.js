/**
 * AuthManager - Quản lý xác thực cho extension
 * Lưu token trong chrome.storage.local (key: af_auth)
 * Gọi API qua background.js proxy (CORS-free)
 *
 * PATCHED: Full offline mode — all server calls disabled.
 */
class AuthManager {
  constructor() {
    this.user = { role: 'admin', is_admin: true, name: 'SlncTrZ', email: 'local@unlocked' };
    this.token = 'unlocked';
    this.apiBaseUrl = '';
    this.isInitialized = true;
    this._refreshing = false;
    this._rateLimitedUntil = 0;
    this._sessionInvalid = false;
  }

  async init() { this.isInitialized = true; }

  isLoggedIn() { return !!this.token; }
  isAdmin() { return true; }
  canManageTemplates() { return true; }
  getToken() { return this.token; }
  getUser() { return this.user; }

  async login() { return { token: 'unlocked', user: this.user }; }
  async logout() { /* offline — no-op */ }
  async register() { throw new Error('[Offline] Auth disabled'); }
  async refreshToken() { return { token: 'unlocked' }; }
  async fetchUser() { return this.user; }

  async _apiCall() {
    throw Object.assign(new Error('[Offline] Server disabled'), { _offline: true, httpStatus: 0 });
  }

  async _clearAuth() { /* offline — no-op */ }
  _saveAuth() {}
  _getStoredFingerprint() { return null; }
  async forgotPassword() { throw new Error('[Offline] Auth disabled'); }
  async resendVerification() { throw new Error('[Offline] Auth disabled'); }
  async resendVerificationByEmail() { throw new Error('[Offline] Auth disabled'); }
  async loginWithGoogle() { throw new Error('[Offline] Auth disabled'); }
  async getLinkGoogleUrl() { throw new Error('[Offline] Auth disabled'); }
  async linkGoogle() { throw new Error('[Offline] Auth disabled'); }
  async unlinkGoogle() { throw new Error('[Offline] Auth disabled'); }
}

window.authManager = new AuthManager();
window.AuthManager = AuthManager;
