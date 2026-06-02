/**
 * AuthManager — REMOVED: no server, no auth, no API.
 * All methods return inert values — no throws, no errors propagated.
 */
class AuthManager {
  constructor() {
    this.apiBaseUrl = '';
    this.isInitialized = true;
  }

  async init() { this.isInitialized = true; }

  isLoggedIn() { return false; }
  isAdmin() { return true; }
  canManageTemplates() { return true; }
  getToken() { return null; }
  getUser() { return null; }

  async login() { return { user: null }; }
  async logout() {}
  async register() { return {}; }
  async refreshToken() { return {}; }
  async fetchUser() { return null; }

  async _apiCall() { return null; }

  async _clearAuth() {}
  _saveAuth() {}
  _getStoredFingerprint() { return null; }
  async forgotPassword() { return {}; }
  async resendVerification() { return {}; }
  async resendVerificationByEmail() { return {}; }
  async loginWithGoogle() { return {}; }
  async getLinkGoogleUrl() { return {}; }
  async linkGoogle() { return {}; }
  async unlinkGoogle() { return {}; }
}

window.authManager = new AuthManager();
window.AuthManager = AuthManager;
