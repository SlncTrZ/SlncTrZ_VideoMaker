/**
 * SS-Phase I: AnnouncementManager â€” admin notification system má»Ÿ rá»™ng (renamed tá»« ChangelogManager).
 *
 * Cover use cases: release notes / alert / promo / maintenance notice.
 * KhÃ¡c ChangelogManager cÅ©:
 *   - Trigger: dÃ¹ng SERVER version token thay vÃ¬ chrome.runtime.getManifest().version
 *     â†’ admin update content (title/body/type) â†’ user nháº­n thÃ´ng bÃ¡o NGAY (khÃ´ng cáº§n update extension)
 *   - 2 mode hiá»ƒn thá»‹: badge (chá»‰ cháº¥m Ä‘á») hoáº·c popup (auto modal láº§n Ä‘áº§u)
 *   - Type-aware: release/alert/promo/maintenance â†’ mÃ u icon + tooltip khÃ¡c nhau
 *   - SSE realtime: nháº­n event 'announcement_changed' tá»« backend admin save
 *   - First-time guard: user má»›i install KHÃ”NG show thÃ´ng bÃ¡o cÅ© (markSeen ngay láº§n Ä‘áº§u)
 *
 * Storage keys:
 *   - af_announcement_seen_version: version Ä‘Ã£ xem (server token)
 *   - af_announcement_initialized:  flag first-time Ä‘Ã£ setup
 *
 * DOM IDs (giá»¯ tÃªn cÅ© `changelog*` Ä‘á»ƒ trÃ¡nh refactor sidebar.html â€” chá»‰ JS class rename):
 *   - #changelogBtn, #changelogBadge, #changelogOverlay, #changelogTitle, #changelogBody, #changelogCloseBtn
 *
 * CSS classes (giá»¯ `.slnctrz-announcement-*` trong sidebar.css â€” chá»‰ rename á»Ÿ admin Vue preview).
 *
 * PATCHED: Disabled for offline standalone operation (no backend).
 */
class AnnouncementManager {
  static async init() {}

  static markSeen(version) {}

  static _startPolling() {}

  static _stopPolling() {}

  static _showBadge() {}

  static _hideBadge() {}

  static _closeModal() {}
}

window.AnnouncementManager = AnnouncementManager;
window.ChangelogManager = AnnouncementManager;
