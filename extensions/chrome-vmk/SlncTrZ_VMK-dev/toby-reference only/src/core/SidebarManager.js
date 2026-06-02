/**
 * SidebarManager - Core event bindings for sidePanel mode
 *
 * In sidePanel mode, sidebar.html IS the page (standalone HTML).
 * No injection, toggle, or resize needed - Chrome manages the panel.
 * SidebarManager only handles tab switching, theme, settings, and keyboard shortcuts.
 */
class SidebarManager {
  static async init() {
    // In sidePanel mode, DOM is already loaded (sidebar.html IS the page)
    SidebarManager._bindCoreEvents();

    // Initialize Tab 1 (GenTab)
    if (window.GenTab) {
      window.GenTab.init();
    }

    // Initialize app (auth, data fetch, tabs)
    if (window.TobyFlowApp) {
      window.TobyFlowApp.init();
    }
  }

  static _bindCoreEvents() {
    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tobyflow-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        btn.classList.remove('has-new');
        const targetPane = document.getElementById(btn.dataset.tab);
        if (targetPane) targetPane.classList.add('active');

        // Save active tab to storage (restore when sidePanel reopens)
        chrome.storage.local.set({ af_active_sidebar_tab: btn.dataset.tab }).catch(() => {});
      });
    });

    // Restore active tab from storage (when sidePanel reopens)
    SidebarManager._restoreActiveTab(tabBtns, tabPanes);

    // Clear logs button
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        const logContainer = document.getElementById('logContainer');
        if (logContainer) logContainer.innerHTML = '';
        window.showNotification?.(window.I18n?.t('logs.logsCleared') || 'Log đã xóa', 'success');
      });
    }

    // Export logs button
    const exportLogsBtn = document.getElementById('exportLogsBtn');
    if (exportLogsBtn) {
      exportLogsBtn.addEventListener('click', () => {
        const logContainer = document.getElementById('logContainer');
        if (!logContainer) return;

        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length === 0) {
          console.log('[TobyFlow] Kh\u00F4ng c\u00F3 log n\u00E0o \u0111\u1EC3 xu\u1EA5t');
          return;
        }

        const lines = [];
        let firstTime = '';
        let lastTime = '';

        entries.forEach((entry, i) => {
          const timeEl = entry.querySelector('.log-time');
          const msgEl = entry.querySelector('.log-msg') || entry;
          const time = timeEl ? timeEl.textContent.trim() : '';
          const msg = msgEl.textContent.replace(time, '').trim();

          if (i === 0) firstTime = time;
          lastTime = time;

          lines.push(`[${time}] ${msg}`);
        });

        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN');
        const header = [
          '='.repeat(60),
          `Toby Flow - Nh\u1EADt k\u00FD ho\u1EA1t \u0111\u1ED9ng`,
          `Ng\u00E0y xu\u1EA5t: ${dateStr}`,
          `T\u1ED5ng s\u1ED1 m\u1EE5c: ${entries.length}`,
          `Kho\u1EA3ng th\u1EDDi gian: ${firstTime} - ${lastTime}`,
          '='.repeat(60),
          ''
        ].join('\n');

        const content = header + lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tobyflow-log-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[TobyFlow] \u0110\u00E3 xu\u1EA5t', entries.length, 'm\u1EE5c log');
        window.showNotification?.(window.I18n?.t('logs.logsExported', { count: entries.length }) || `Đã xuất ${entries.length} mục log`, 'success');
      });
    }

    // Settings Dropdown
    const settingsDropdown = document.getElementById('settingsDropdown');
    const settingsDropdownBtn = document.getElementById('settingsDropdownBtn');
    const settingsMenu = document.getElementById('settingsMenu');

    if (settingsDropdownBtn && settingsDropdown) {
      // Toggle dropdown
      settingsDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('open');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!settingsDropdown.contains(e.target)) {
          settingsDropdown.classList.remove('open');
        }
      });

      // Close dropdown on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          settingsDropdown.classList.remove('open');
        }
      });
    }

    // Theme toggle button (inside dropdown)
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      function updateThemeIcon(theme) {
        const sunIcon = document.getElementById('themeIconSun');
        const moonIcon = document.getElementById('themeIconMoon');
        const themeLabel = document.getElementById('themeToggleLabel');
        if (!sunIcon || !moonIcon) return;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        sunIcon.classList.toggle('hidden', isDark);
        moonIcon.classList.toggle('hidden', !isDark);
        // Update label text
        if (themeLabel) {
          themeLabel.textContent = isDark
            ? (window.I18n?.t('header.lightMode') || 'Chế độ sáng')
            : (window.I18n?.t('header.darkMode') || 'Chế độ tối');
        }
      }

      // Init icon state
      chrome.storage.local.get(['af_settings'], (res) => {
        const theme = res.af_settings?.theme || 'dark';
        updateThemeIcon(theme);
      });

      themeToggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Keep dropdown open
        const root = document.getElementById('flow-auto-sidebar-root');
        const isCurrentlyLight = root?.classList.contains('theme-light');
        const newTheme = isCurrentlyLight ? 'dark' : 'light';

        // Apply immediately
        if (root) {
          root.classList.remove('theme-light', 'theme-dark');
          root.classList.add(`theme-${newTheme}`);
        }
        updateThemeIcon(newTheme);

        // Persist to storage
        const result = await new Promise(r => chrome.storage.local.get(['af_settings'], r));
        const settings = { ...(result.af_settings || {}), theme: newTheme };
        await new Promise(r => chrome.storage.local.set({ af_settings: settings }, r));
      });
    }

    // Open settings in separate window (inside dropdown)
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => {
        settingsDropdown?.classList.remove('open');
        chrome.runtime.sendMessage({ action: 'openSettings' });
      });
    }

    // Monitor active tab URL — show overlay when not on Google Flow
    SidebarManager._initTabMonitor();

    // Settings tab removed from sidebar - all settings now in separate window (settings.html)
    // Pipeline/timing settings read directly from storageSettings when needed

    // Listen for settings changes from settings window
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.af_settings) {
        const settings = changes.af_settings.newValue || {};
        // Apply theme
        const root = document.getElementById('flow-auto-sidebar-root');
        if (root) {
          root.classList.remove('theme-light', 'theme-dark');
          if (settings.theme === 'light') root.classList.add('theme-light');
          else if (settings.theme === 'system') {
            root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'theme-dark' : 'theme-light');
          }
        }
        // Sync executor settings
        if (window.workflowExecutor) {
          window.workflowExecutor.settings = {
            delayBetweenNodes: (settings.execDelayNodes || 3) * 1000,
            retryOnFail: (settings.execMaxRetries || 0) > 0,
            maxRetries: settings.execMaxRetries ?? 2,
            timeout: (settings.execTimeout || 180) * 1000,
            stopOnError: settings.execOnError === 'stop'
          };
        }
        // Sync auto-download toggle from settings (this element still exists in GenTab)
        const autoDownloadToggle = document.getElementById('genTabAutoDownload');
        if (autoDownloadToggle && settings.autoDownload !== undefined) {
          autoDownloadToggle.checked = settings.autoDownload;
        }
        console.log('[TobyFlow] Settings updated from settings window');
      }
    });
  }

  static _initTabMonitor() {
    const checkFlowTabExists = async () => {
      try {
        // Check if ANY Flow tab exists (not just the current tab)
        const flowTabs = await chrome.tabs.query({ url: window.ProviderConfigManager?.getTabQuery('flow') || 'https://labs.google/fx/*' });
        const hasFlowTab = flowTabs.length > 0;
        SidebarManager._toggleFlowOverlay(!hasFlowTab);
      } catch (e) {
        // Ignore errors (e.g. no permission)
      }
    };

    // Check on tab close/create
    chrome.tabs.onRemoved.addListener(() => checkFlowTabExists());
    chrome.tabs.onCreated.addListener(() => checkFlowTabExists());
    // Check on URL change (in case Flow tab navigates away)
    chrome.tabs.onUpdated.addListener((tabId, info) => {
      if (info.url || info.status === 'complete') checkFlowTabExists();
    });

    // Initial check
    checkFlowTabExists();
  }

  static _toggleFlowOverlay(show) {
    let overlay = document.getElementById('flowTabOverlay');
    if (show && !overlay) {
      overlay = document.createElement('div');
      overlay.id = 'flowTabOverlay';
      overlay.className = 'flow-tab-overlay';
      overlay.innerHTML = `
        <div class="flow-tab-overlay-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          <p style="margin: 12px 0 4px; font-weight: 600;">Ch&#x1B0;a m&#x1EDF; Google Flow</p>
          <p style="font-size: 12px; color: var(--muted-foreground); margin-bottom: 16px;">C&#x1EA7;n m&#x1EDF; tab Google Flow (labs.google/fx) &#x111;&#x1EC3; extension ho&#x1EA1;t &#x111;&#x1ED9;ng</p>
          <button class="btn btn-primary btn-sm" id="goToFlowBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            M&#x1EDF; Google Flow
          </button>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#goToFlowBtn')?.addEventListener('click', () => {
        // [Fix] Reuse existing Flow tab instead of opening new one
        chrome.runtime.sendMessage({
          action: 'openOrActivateTab',
          urlPattern: window.ProviderConfigManager?.getTabQuery('flow') || 'https://labs.google/fx/*',
          createUrl: window.ProviderConfigManager?.getCreateUrl('flow') || 'https://labs.google/fx/tools/flow',
          activate: true
        });
      });
    } else if (!show && overlay) {
      overlay.remove();
    }
  }

  /**
   * Restore active tab from storage khi sidebar mở
   * Global sidePanel mode: chỉ cần restore khi sidePanel init lần đầu
   */
  static async _restoreActiveTab(tabBtns, tabPanes) {
    try {
      const result = await new Promise(r => chrome.storage.local.get('af_active_sidebar_tab', r));
      const savedTabId = result?.af_active_sidebar_tab;

      if (!savedTabId) return;

      // Check if already on the correct tab
      const currentActive = document.querySelector('.tobyflow-tab.active');
      if (currentActive?.dataset.tab === savedTabId) return;

      // Find and activate the saved tab
      const targetBtn = document.querySelector(`.tobyflow-tab[data-tab="${savedTabId}"]`);
      if (!targetBtn) return;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      targetBtn.classList.add('active');
      targetBtn.classList.remove('has-new');

      const targetPane = document.getElementById(savedTabId);
      if (targetPane) targetPane.classList.add('active');

      console.log('[TobyFlow] Tab restored from storage:', savedTabId);
    } catch (err) {
      console.warn('[TobyFlow] Tab restore failed:', err.message);
    }
  }
}

window.SidebarManager = SidebarManager;
