/**
 * UsageSync — Module theo doi va dong bo usage analytics
 * Xu ly 3 nhom chuc nang:
 *   UA-1: Dong bo daily stats len server (chi cho user da login)
 *   UA-2: Session tracking voi heartbeat (ca anonymous + login)
 *   UA-3: Event tracking voi buffer va flush (ca anonymous + login)
 *
 * Singleton, khoi tao qua UsageSync.init() sau khi AuthManager san sang.
 *
 * Agent 3 mo rong:
 *   - Anonymous tracking qua fingerprint (UUID v4 luu chrome.storage.local.af_fingerprint)
 *   - Standardize event metadata theo EVENT_SCHEMAS
 *   - Multi-tab heartbeat dedup qua chrome.storage.local.af_active_session
 *   - Cross-day boundary handling: gui UTC date thay vi local
 *
 * PATCHED: Disabled for offline standalone operation (no phone-home).
 */
class UsageSync {
  constructor() {
    this._disabled = true;
  }

  init() {}

  startHeartbeat() {}

  stopHeartbeat() {}

  trackEvent() {}

  flushEvents() {}

  syncDailyStats() {}

  setActiveTab() {}

  endSession() {}
}

window.UsageSync = new UsageSync();
