import fs from 'fs';

const ROOT = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_VMK';

// === 1. sidebar.html: remove changelog, tip coffee, SSE, notification ===
let html = fs.readFileSync(`${ROOT}\\sidebar.html`, 'utf-8');

// Remove Changelog button + Tip Coffee button from header
html = html.replace(
  /<!-- Changelog -->[\s\S]*?<\/button>\s*<!-- Tip Coffee \(gold icon\) -->[\s\S]*?<\/button>/,
  ''
);

// Remove Tip Coffee Modal
html = html.replace(
  /<!-- Tip Coffee Modal -->[\s\S]*?<!-- Contact Modal -->/,
  '<!-- Contact Modal -->'
);

// Remove SSE Disconnect Notification
html = html.replace(
  /<!-- SSE Disconnect Notification[\s\S]*?<\/div>/,
  ''
);

// Remove SSE status dot
html = html.replace(/\s*<span id="sseStatusDot".*?><\/span>/, '');

// Remove notification.css link
html = html.replace(/\s*<link rel="stylesheet" href="src\/core\/notification\.css">/, '');

// Remove changelog modal
html = html.replace(
  /<!-- Changelog Modal[\s\S]*?<\/div>\s*<\/div>/,
  ''
);

// Remove NotificationBell, NotificationPanel, NotificationModal script tags
html = html.replace(/<script src="src\/core\/NotificationBell\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="src\/core\/NotificationPanel\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="src\/core\/NotificationModal\.js"><\/script>\s*/g, '');

// Rename TobyFlow → SlncTrZ in title/alt
html = html.replace(/Toby Flow/g, 'SlncTrZ VM');

fs.writeFileSync(`${ROOT}\\sidebar.html`, html, 'utf-8');
console.log('sidebar.html: updated');

// === 2. sidebar.css: cyberpunk theme ===
let css = fs.readFileSync(`${ROOT}\\sidebar.css`, 'utf-8');

// Replace color variables with cyberpunk theme
css = css.replace(/--background: #1e1e1e/, '--background: #08080e');
css = css.replace(/--foreground: #dedede/, '--foreground: #c8d0e0');
css = css.replace(/--card: #1e1e1e/, '--card: #0d0d18');
css = css.replace(/--modal-border: #3f3f3f/, '--modal-border: #1a2a4a');
css = css.replace(/--card-foreground: #e8e8ea/, '--card-foreground: #c8d0e0');
css = css.replace(/--surface: #262626/, '--surface: #0f0f1e');
css = css.replace(/--surface-elevated: #2e2e33/, '--surface-elevated: #161630');
css = css.replace(/--primary: #ccff00([^;])/, '--primary: #00f0ff$1');
css = css.replace(/--primary-foreground: #1e1e1e/, '--primary-foreground: #08080e');
css = css.replace(/--primary-light: var\(--input\)/, '--primary-light: rgba(0,240,255,0.1)');
css = css.replace(/--primary-hover: #b8e600/, '--primary-hover: #33f3ff');
css = css.replace(/--primary-muted: rgba\(204,255,0,0\.08\)/, '--primary-muted: rgba(0,240,255,0.08)');
css = css.replace(/--secondary: #242428/, '--secondary: #0f0f2a');
css = css.replace(/--secondary-foreground: #e8e8ea/, '--secondary-foreground: #c8d0e0');
css = css.replace(/--muted: #2e2e33/, '--muted: #12122a');
css = css.replace(/--muted-foreground: #8b8b92/, '--muted-foreground: #6a7a9a');
css = css.replace(/--accent: #2e2e33/, '--accent: #0a2a5a');
css = css.replace(/--accent-foreground: #e8e8ea/, '--accent-foreground: #c8d0e0');
css = css.replace(/--destructive: #ef4444/, '--destructive: #ff2255');
css = css.replace(/--destructive-light: rgba\(239,68,68,0\.15\)/, '--destructive-light: rgba(255,34,85,0.15)');
css = css.replace(/--success: #22c55e/, '--success: #00ff88');
css = css.replace(/--success-light: rgba\(34,197,94,0\.15\)/, '--success-light: rgba(0,255,136,0.15)');
css = css.replace(/--warning: #f59e0b/, '--warning: #ffaa00');
css = css.replace(/--warning-light: rgba\(245,158,11,0\.15\)/, '--warning-light: rgba(255,170,0,0.15)');
css = css.replace(/--info: #e0e0e0/, '--info: #4a8aff');

// Add cyberpunk effects + upgrade hide after root variables
const insertPoint = css.indexOf('/* ===== Light Theme ===== */');
if (insertPoint > 0) {
  const cyberpunkCode = `
/* ===== Remove Upgrade/Premium UI ===== */
#settingsUpgradeBtn, #upgradeBtn, #footerUpgradeBtn, #upgradeOverlay, #upgradeModal,
#upgradePlansContainer, #upgradePaymentMethods, #premiumBenefitsOverlay, #premiumBenefitsModal,
.footer-upgrade-link, .footer-upgrade-section, .usage-stats-premium-teaser,
.usage-stats-premium-features, .usage-stats-premium-header, .usage-stats-upgrade,
#usageStatsPremiumTeaser, #conversionToastUpgradeBtn, #headerPremiumCrown,
.slnctrz-premium-crown, #userPlanBadge, .slnctrz-settings-menu-item[data-i18n="header.upgrade"],
#settingsUpgradeBtn, #footerPremium {
  display: none !important;
}

/* ===== Cyberpunk Effects ===== */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(rgba(0,240,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,0.015) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
@keyframes slnctrz-glow-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(0,240,255,0.3), 0 0 15px rgba(0,240,255,0.1); }
  50% { box-shadow: 0 0 10px rgba(0,240,255,0.5), 0 0 25px rgba(0,240,255,0.2); }
}
@keyframes slnctrz-text-glow {
  0%, 100% { text-shadow: 0 0 4px rgba(0,240,255,0.3); }
  50% { text-shadow: 0 0 8px rgba(0,240,255,0.6), 0 0 12px rgba(0,240,255,0.3); }
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #08080e; }
::-webkit-scrollbar-thumb { background: #1a2a4a; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #00f0ff; }
`;
  css = css.slice(0, insertPoint) + cyberpunkCode + css.slice(insertPoint);
}

// Header glow
css = css.replace(
  '.slnctrz-header-title {\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--foreground);\n  white-space: nowrap;\n}',
  '.slnctrz-header-title {\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--foreground);\n  white-space: nowrap;\n  animation: slnctrz-text-glow 3s ease-in-out infinite;\n}'
);

// Tab active glow
css = css.replace(
  '.slnctrz-tab.active {\n  color: var(--primary);\n  background: var(--background);\n}',
  '.slnctrz-tab.active {\n  color: var(--primary);\n  background: var(--background);\n  box-shadow: inset 0 -2px 0 var(--primary), 0 0 12px rgba(0,240,255,0.08);\n}'
);

// Button primary glow
css = css.replace(
  '.btn-primary {\n  width: 100%;\n  background: #ffffff;\n  color: #1a1a1e;\n  border: 0;\n}',
  '.btn-primary {\n  width: 100%;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  border: 0;\n  box-shadow: 0 0 8px rgba(0,240,255,0.2);\n  transition: box-shadow var(--transition-fast), background var(--transition-fast);\n}'
);
css = css.replace(
  '.btn-primary:hover {\n  background: rgba(255,255,255,0.85);\n}',
  '.btn-primary:hover {\n  background: var(--primary-hover);\n  box-shadow: 0 0 12px rgba(0,240,255,0.4);\n}'
);

// Logo neon border
css = css.replace(
  '.slnctrz-header-logo {\n  width: 28px;\n  height: 28px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #1a1a1e;\n  border-radius: 6px;\n}',
  '.slnctrz-header-logo {\n  width: 28px;\n  height: 28px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #08080e;\n  border-radius: 6px;\n  border: 1px solid rgba(0,240,255,0.2);\n  background: rgba(0,240,255,0.05);\n}'
);

// Header bottom line
css = css.replace(
  '.slnctrz-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  height: 40px;\n  padding: 0 12px;\n  background: var(--background);\n  flex-shrink: 0;\n  margin-top: 5px;\n}',
  '.slnctrz-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  height: 40px;\n  padding: 0 12px;\n  background: var(--background);\n  flex-shrink: 0;\n  margin-top: 5px;\n  border-bottom: 1px solid rgba(0,240,255,0.08);\n}'
);

// Rename tobyflow- → slnctrz- in CSS (this file)
css = css.replace(/tobyflow-/g, 'slnctrz-');

fs.writeFileSync(`${ROOT}\\sidebar.css`, css, 'utf-8');
console.log('sidebar.css: updated');

// === 3. src/core/I18n.js: fix labs.toby.vn fallback ===
let i18n = fs.readFileSync(`${ROOT}\\src\\core\\I18n.js`, 'utf-8');
i18n = i18n.replace(/window\.authManager\?\.apiBaseUrl \|\| 'https:\/\/labs\.toby\.vn\/api\/v1'/g, "window.authManager?.apiBaseUrl || ''");
i18n = i18n.replace(/"" \+ 'https:\/\/labs\.toby\.vn\/api\/v1'/g, "''");
fs.writeFileSync(`${ROOT}\\src\\core\\I18n.js`, i18n, 'utf-8');
console.log('I18n.js: updated');

// === 4. src/prompts/GenTab.js: fix regex ===
let genTab = fs.readFileSync(`${ROOT}\\src\\prompts\\GenTab.js`, 'utf-8');
genTab = genTab.replace(/\.normalize\('NFD'\)\.replace\(\/\[\u00CC\u20AC-\u00CD\u00AF\]\/g, ''\)/, ".normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')");
fs.writeFileSync(`${ROOT}\\src\\prompts\\GenTab.js`, genTab, 'utf-8');
console.log('GenTab.js: updated');

// === Verify all files ===
console.log('\nVerification:');
for (const f of ['sidebar.html', 'sidebar.css', 'settings.html', 'src/core/I18n.js', 'src/prompts/GenTab.js']) {
  const buf = fs.readFileSync(`${ROOT}\\${f}`);
  const s = buf.toString('utf-8');
  const corrupt = s.includes('\ufffd') || s.includes('Æ');
  console.log(`${f}: ${corrupt ? 'CORRUPT' : 'OK'} (${buf.length} bytes)`);
}
