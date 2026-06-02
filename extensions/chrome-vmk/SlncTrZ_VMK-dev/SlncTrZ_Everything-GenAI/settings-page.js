/**
 * Settings Page - Standalone window for extension settings
 * Communicates with content script via chrome.storage
 */
(function() {
  'use strict';

  const DEFAULTS = {
    // Workflow
    execDelayNodes: 3,
    execMaxRetries: 2,
    execTimeout: 180,
    execOnError: 'continue',
    // Chung
    inputTimeout: 1200,
    delayBetweenPrompts: 5,
    blobMaxAgeDays: 7,
    // Chá»‘ng ban
    randomDelayMin: 3,
    randomDelayMax: 10,
    // Pipeline Queue
    queueEnabled: false,
    queueBatchSize: 4,
    queueMaxMonitor: 4,
    queueRestMin: 5,
    queueRestMax: 15,
    autoReloadEnabled: false,
    autoReloadThreshold: 30,
    // Phase FAR â€” Flow auto-retry
    flowSessionRefreshEnabled: false,
    flowSessionRefreshIntervalMin: 120,
    flowAutoRecoveryEnabled: true,
    flowConsecutiveFailThreshold: 2,
    flowBackoffBaseSec: 30,
    flowBackoffMaxSec: 300,
    flowBackoffJitterPercent: 20,
    autoDownload: false,
    downloadFolder: 'slnctrz_output',
    fileNameProject: '',
    fileNameTemplate: '[Date]_[Project]_[Prompt]_[Index]',
    downloadResolution: '1k',
    videoDownloadResolution: '720p',
    theme: 'dark',
    language: 'vi',
    notifyOnComplete: true,
    notifyTelegram: false,
    telegramAutoDownload: true,
    telegramDownloadFolder: 'tobyflow_bot',
    telegramDownloadResolution: '1k',
    telegramVideoDownloadResolution: '720p',
    // Telegram Provider Settings
    telegramDefaultProvider: 'flow',
    telegramFlowRatio: '16:9',
    telegramFlowModel: 'Nano Banana 2',
    telegramChatgptRatio: 'square',
    telegramGrokMode: 'image',
    telegramGrokRatio: 'widescreen',
    telegramGrokDuration: '6s',
    telegramGrokResolution: '720p',
    telegramGrokImageQuality: 'speed',
    notifySound: false,
    humanizedMode: false,
    humanizedSpeed: 0.5,
    defaultGenType: 'Image',
    defaultRatio: '9:16',             // numeric format khá»›p gen_tab; mapping VNâ†’numeric váº«n cÃ²n á»Ÿ consumers cho backward-compat user cÅ©
    defaultImageRatio: '16:9',
    defaultVideoRatio: '16:9',
    defaultImageModel: 'Nano Banana 2',
    defaultVideoModel: 'Veo 3.1 - Fast',
    // CG-5.3 Part B: ChatGPT provider defaults
    defaultProvider: 'flow',
    chatgptDefaultRatio: 'story',
    chatgptFallbackPrefix: 'Generate an image of: ',
    chatgptAutoClose: false,
    // G-8.4: Grok provider defaults
    grokDefaultMode: 'image',
    grokDefaultRatio: 'widescreen',
    grokDefaultDuration: '6s',
    grokDefaultResolution: '720p',
    grokDefaultImageQuality: 'speed',
    grokAutoClose: false
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ===== Elements =====
  const els = {};
    els.wsBridgeUrl = document.getElementById('wsBridgeUrl');

  function bindElements() {
    els.storageModeBadge = $('#storageModeBadge');

    els.execDelay = $('#execDelayNodes');
    els.execRetries = $('#execMaxRetries');
    els.execTimeout = $('#execTimeout');

    els.inputTimeout = $('#inputTimeout');
    els.delayBetweenPrompts = $('#delayBetweenPrompts');
    els.blobMaxAgeDays = $('#blobMaxAgeDays');
    els.randomDelayMin = $('#randomDelayMin');
    els.randomDelayMax = $('#randomDelayMax');

    // Pipeline Queue
    els.queueEnabled = $('#queueEnabled');
    els.queueBatchSize = $('#queueBatchSize');
    els.queueMaxMonitor = $('#queueMaxMonitor');
    els.queueRestMin = $('#queueRestMin');
    els.queueRestMax = $('#queueRestMax');

    // Auto Reload
    els.autoReloadEnabled = $('#autoReloadEnabled');
    els.autoReloadThreshold = $('#autoReloadThreshold');

    // Phase FAR â€” Flow auto-retry
    els.flowSessionRefreshEnabled = $('#flowSessionRefreshEnabled');
    els.flowSessionRefreshIntervalMin = $('#flowSessionRefreshIntervalMin');
    els.flowAutoRecoveryEnabled = $('#flowAutoRecoveryEnabled');
    els.flowConsecutiveFailThreshold = $('#flowConsecutiveFailThreshold');
    els.flowBackoffBaseSec = $('#flowBackoffBaseSec');
    els.flowBackoffMaxSec = $('#flowBackoffMaxSec');
    els.flowBackoffJitterPercent = $('#flowBackoffJitterPercent');

    els.autoDownload = $('#autoDownloadToggle');
    els.downloadFolder = $('#downloadFolder');
    els.fileNameProject = $('#fileNameProject');
    els.fileNameTemplate = $('#fileNameTemplate');
    els.downloadResolution = $('#downloadResolution');
    els.videoDownloadResolution = $('#videoDownloadResolution');

    els.theme = $('#themeSelect');
    els.language = $('#languageSelect');

    els.notifyComplete = $('#notifyOnComplete');
    els.notifySound = $('#notifySound');
    els.notifyTelegram = $('#notifyTelegram');
    els.notifyTelegramRow = $('#notifyTelegramRow');
    els.notifyTelegramInTab = $('#notifyTelegramInTab');

    els.humanizedMode = $('#humanizedMode');
    els.humanizedSpeed = $('#humanizedSpeed');
    els.humanizedSpeedLabel = $('#humanizedSpeedLabel');

    // CG-5.3: Provider máº·c Ä‘á»‹nh + ChatGPT
    els.defaultProvider = $('#defaultProvider');
    els.chatgptDefaultRatio = $('#chatgptDefaultRatio');
    els.chatgptAutoClose = $('#chatgptAutoClose');
    els.chatgptFallbackPrefix = $('#chatgptFallbackPrefix');

    // G-8.4: Grok defaults
    els.grokDefaultMode = $('#grokDefaultMode');
    els.grokDefaultRatio = $('#grokDefaultRatio');
    els.grokDefaultDuration = $('#grokDefaultDuration');
    els.grokDefaultResolution = $('#grokDefaultResolution');
    els.grokDefaultImageQuality = $('#grokDefaultImageQuality');
    els.grokAutoClose = $('#grokAutoClose');

    els.defaultGenType = $('#defaultGenType');
    els.defaultImageRatio = $('#defaultImageRatio');
    els.defaultVideoRatio = $('#defaultVideoRatio');
    els.defaultImageModel = $('#defaultImageModel');
    els.defaultVideoModel = $('#defaultVideoModel');

    els.clearCacheBtn = $('#clearCacheBtn');

    els.dataManagementSection = $('#dataManagementSection');
    els.exportBtn = $('#exportDataBtn');
    els.importBtn = $('#importDataBtn');
    els.importFile = $('#importFileInput');

    // Telegram
    els.telegramStatusBadge = $('#telegramStatusBadge');
    els.telegramNotLinked = $('#telegramNotLinked');
    els.telegramOtpDisplay = $('#telegramOtpDisplay');
    els.telegramLinked = $('#telegramLinked');
    els.telegramLinkBtn = $('#telegramLinkBtn');
    els.telegramOtpCode = $('#telegramOtpCode');
    els.telegramOtpCodeSmall = $('#telegramOtpCodeSmall');
    els.telegramOtpCopyBtn = $('#telegramOtpCopyBtn');
    els.telegramOtpCancelBtn = $('#telegramOtpCancelBtn');
    els.telegramOtpCountdown = $('#telegramOtpCountdown');
    els.telegramBotLink = $('#telegramBotLink');
    els.telegramBotName = $('#telegramBotName');
    els.telegramUsername = $('#telegramUsername');
    els.telegramLinkedBot = $('#telegramLinkedBot');
    els.telegramBotType = $('#telegramBotType');
    els.telegramUnlinkBtn = $('#telegramUnlinkBtn');
    els.telegramBotOptions = $('#telegramBotOptions');
    els.telegramOptionShared = $('#telegramOptionShared');
    els.telegramOptionCustom = $('#telegramOptionCustom');
    els.telegramCustomBotSetup = $('#telegramCustomBotSetup');
    els.telegramCustomBotToken = $('#telegramCustomBotToken');

    // Telegram download settings
    els.telegramSettingsSection = $('#telegramSettingsSection');
    els.telegramAutoDownload = $('#telegramAutoDownload');
    els.telegramDownloadFolder = $('#telegramDownloadFolder');
    els.telegramDownloadResolution = $('#telegramDownloadResolution');
    els.telegramVideoDownloadResolution = $('#telegramVideoDownloadResolution');

    // Telegram provider settings
    els.telegramDefaultProvider = $('#telegramDefaultProvider');
    els.telegramFlowRatio = $('#telegramFlowRatio');
    els.telegramFlowModel = $('#telegramFlowModel');
    els.telegramChatgptRatio = $('#telegramChatgptRatio');
    els.telegramGrokMode = $('#telegramGrokMode');
    els.telegramGrokRatio = $('#telegramGrokRatio');
    els.telegramGrokDuration = $('#telegramGrokDuration');
    els.telegramGrokResolution = $('#telegramGrokResolution');
    els.telegramGrokImageQuality = $('#telegramGrokImageQuality');
    els.telegramGrokVideoFields = $('#telegramGrokVideoFields');
    els.telegramGrokImageFields = $('#telegramGrokImageFields');

    els.saveAllBtn = $('#saveAllSettingsBtn');
    els.saveStatus = $('#settingsSaveStatus');
  }

  // ===== Load =====
  async function loadSettings() {
    const result = await chrome.storage.local.get(['af_settings']);
    const settings = { ...DEFAULTS, ...result.af_settings };
    updateUI(settings);
  }

  /**
   * Fetch settings tá»« server vÃ  merge vÃ o local (dÃ¹ng khi login)
   * Server wins on conflict
   */
  async function fetchAndMergeServerSettings() {
    try {
      const result = await chrome.storage.local.get(['af_auth', 'af_settings']);
      const auth = result.af_auth;
      if (!auth?.token) return;

      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'apiRequest',
          method: 'GET',
          endpoint: 'settings',
          token: auth.token
        }, (r) => resolve(r));
      });

      if (resp?.success && resp.data?.settings_json) {
        // Local wins on conflict - trÃ¡nh server cÅ© overwrite local má»›i khi sync fail trÆ°á»›c Ä‘Ã³
        // Server settings chá»‰ fill nhá»¯ng field local chÆ°a cÃ³ (vd: user má»›i login, chÆ°a config)
        const localSettings = result.af_settings || {};
        const merged = { ...DEFAULTS, ...resp.data.settings_json, ...localSettings };
        await chrome.storage.local.set({ af_settings: merged });
        updateUI(merged);
        console.log('[Settings] Synced settings from server (local wins on conflict)');
      }
    } catch (err) {
      console.warn('[Settings] Server settings fetch failed:', err.message);
    }
  }

  function updateUI(s) {
    // Storage mode badge
    if (els.storageModeBadge) {
      chrome.storage.local.get(['af_auth'], (result) => {
        const isLoggedIn = result.af_auth?.token;
        els.storageModeBadge.textContent = isLoggedIn ? 'Cloud' : 'Local';
        els.storageModeBadge.className = 's-section-badge' + (isLoggedIn ? ' s-badge-cloud' : '');
      });
    }

    // Executor
    if (els.execDelay) els.execDelay.value = s.execDelayNodes;
    if (els.execRetries) els.execRetries.value = s.execMaxRetries;
    if (els.execTimeout) els.execTimeout.value = s.execTimeout;
    const errRadio = $(`input[name="execOnError"][value="${s.execOnError}"]`);
    if (errRadio) errRadio.checked = true;

    // General
    if (els.inputTimeout) els.inputTimeout.value = s.inputTimeout;
    if (els.delayBetweenPrompts) els.delayBetweenPrompts.value = s.delayBetweenPrompts;
    if (els.blobMaxAgeDays) els.blobMaxAgeDays.value = s.blobMaxAgeDays;

    // Chá»‘ng ban
    if (els.randomDelayMin) els.randomDelayMin.value = s.randomDelayMin;
    if (els.randomDelayMax) els.randomDelayMax.value = s.randomDelayMax;

    // Pipeline Queue
    if (els.queueEnabled) els.queueEnabled.checked = s.queueEnabled;
    if (els.queueBatchSize) els.queueBatchSize.value = s.queueBatchSize;
    if (els.queueMaxMonitor) els.queueMaxMonitor.value = s.queueMaxMonitor;
    if (els.queueRestMin) els.queueRestMin.value = s.queueRestMin;
    if (els.queueRestMax) els.queueRestMax.value = s.queueRestMax;
    // Auto Reload
    if (els.autoReloadEnabled) els.autoReloadEnabled.checked = s.autoReloadEnabled;
    if (els.autoReloadThreshold) els.autoReloadThreshold.value = s.autoReloadThreshold;

    // Phase FAR â€” Flow auto-retry
    if (els.flowSessionRefreshEnabled) els.flowSessionRefreshEnabled.checked = s.flowSessionRefreshEnabled === true;
    if (els.flowSessionRefreshIntervalMin) els.flowSessionRefreshIntervalMin.value = s.flowSessionRefreshIntervalMin ?? 120;
    if (els.flowAutoRecoveryEnabled) els.flowAutoRecoveryEnabled.checked = s.flowAutoRecoveryEnabled !== false;
    if (els.flowConsecutiveFailThreshold) els.flowConsecutiveFailThreshold.value = s.flowConsecutiveFailThreshold ?? 2;
    if (els.flowBackoffBaseSec) els.flowBackoffBaseSec.value = s.flowBackoffBaseSec ?? 30;
    if (els.flowBackoffMaxSec) els.flowBackoffMaxSec.value = s.flowBackoffMaxSec ?? 300;
    if (els.flowBackoffJitterPercent) els.flowBackoffJitterPercent.value = s.flowBackoffJitterPercent ?? 20;

    // Toggle hiá»ƒn thá»‹ cÃ¡c cÃ i Ä‘áº·t queue khi báº­t/táº¯t
    _toggleQueueSettings(s.queueEnabled);

    // Download
    if (els.autoDownload) els.autoDownload.checked = s.autoDownload;
    if (els.downloadFolder) els.downloadFolder.value = s.downloadFolder;
    if (els.fileNameProject) els.fileNameProject.value = s.fileNameProject || '';
    if (els.fileNameTemplate) els.fileNameTemplate.value = s.fileNameTemplate || '[Date]_[Project]_[Prompt]_[Index]';
    if (els.downloadResolution) els.downloadResolution.value = s.downloadResolution;
    if (els.videoDownloadResolution) els.videoDownloadResolution.value = s.videoDownloadResolution || '720p';
    _toggleDownloadSettings(s.autoDownload);

    // UI
    if (els.theme) els.theme.value = s.theme;
    if (els.language) els.language.value = s.language || 'vi';

    // Notifications
    if (els.notifyComplete) els.notifyComplete.checked = s.notifyOnComplete;
    if (els.notifySound) els.notifySound.checked = s.notifySound;
    if (els.notifyTelegram) els.notifyTelegram.checked = s.notifyTelegram || false;
    if (els.notifyTelegramInTab) els.notifyTelegramInTab.checked = s.notifyTelegram || false;

    // Telegram download settings
    if (els.telegramAutoDownload) els.telegramAutoDownload.checked = s.telegramAutoDownload !== false;
    if (els.telegramDownloadFolder) els.telegramDownloadFolder.value = s.telegramDownloadFolder || 'tobyflow_bot';
    if (els.telegramDownloadResolution) els.telegramDownloadResolution.value = s.telegramDownloadResolution || '1k';
    if (els.telegramVideoDownloadResolution) els.telegramVideoDownloadResolution.value = s.telegramVideoDownloadResolution || '720p';

    // Telegram provider settings
    if (els.telegramDefaultProvider) els.telegramDefaultProvider.value = s.telegramDefaultProvider || 'flow';
    if (els.telegramFlowRatio) els.telegramFlowRatio.value = s.telegramFlowRatio || '16:9';
    if (els.telegramFlowModel) els.telegramFlowModel.value = s.telegramFlowModel || 'Nano Banana 2';
    if (els.telegramChatgptRatio) els.telegramChatgptRatio.value = s.telegramChatgptRatio || 'square';
    if (els.telegramGrokMode) els.telegramGrokMode.value = s.telegramGrokMode || 'image';
    if (els.telegramGrokRatio) els.telegramGrokRatio.value = s.telegramGrokRatio || 'widescreen';
    if (els.telegramGrokDuration) els.telegramGrokDuration.value = s.telegramGrokDuration || '6s';
    if (els.telegramGrokResolution) els.telegramGrokResolution.value = s.telegramGrokResolution || '720p';
    if (els.telegramGrokImageQuality) els.telegramGrokImageQuality.value = s.telegramGrokImageQuality || 'speed';
    _toggleTelegramGrokFields();

    // Humanized mode
    if (els.humanizedMode) els.humanizedMode.checked = s.humanizedMode;
    if (els.humanizedSpeed) els.humanizedSpeed.value = s.humanizedSpeed;
    if (els.humanizedSpeedLabel) els.humanizedSpeedLabel.textContent = parseFloat(s.humanizedSpeed).toFixed(1) + 'x';

    // CG-5.3: Provider máº·c Ä‘á»‹nh + ChatGPT
    if (els.defaultProvider) els.defaultProvider.value = s.defaultProvider || 'flow';
    if (els.chatgptDefaultRatio) els.chatgptDefaultRatio.value = s.chatgptDefaultRatio || 'story';
    if (els.chatgptAutoClose) els.chatgptAutoClose.checked = !!s.chatgptAutoClose;
    if (els.chatgptFallbackPrefix) els.chatgptFallbackPrefix.value = s.chatgptFallbackPrefix || 'Generate an image of: ';

    // G-8.4: Load Grok settings vÃ o form + toggle video fields visibility
    if (els.grokDefaultMode) els.grokDefaultMode.value = s.grokDefaultMode || 'image';
    if (els.grokDefaultRatio) els.grokDefaultRatio.value = s.grokDefaultRatio || 'widescreen';
    if (els.grokDefaultDuration) els.grokDefaultDuration.value = s.grokDefaultDuration || '6s';
    if (els.grokDefaultResolution) els.grokDefaultResolution.value = s.grokDefaultResolution || '720p';
    if (els.grokDefaultImageQuality) els.grokDefaultImageQuality.value = s.grokDefaultImageQuality || 'speed';
    if (els.grokAutoClose) els.grokAutoClose.checked = !!s.grokAutoClose;
    _toggleGrokVideoFields();

    // Generation defaults
    if (els.defaultGenType) els.defaultGenType.value = s.defaultGenType;
    if (els.defaultImageRatio) els.defaultImageRatio.value = s.defaultImageRatio || '16:9';
    if (els.defaultVideoRatio) els.defaultVideoRatio.value = s.defaultVideoRatio || '16:9';
    if (els.defaultImageModel) els.defaultImageModel.value = s.defaultImageModel;
    if (els.defaultVideoModel) els.defaultVideoModel.value = s.defaultVideoModel;

    // Update Info tab dynamic days
    _updateInfoBlobDays(s.blobMaxAgeDays || 7);
  }

  /**
   * Cáº­p nháº­t cÃ¡c text trong Info tab phá»¥ thuá»™c blobMaxAgeDays
   */
  function _updateInfoBlobDays(days) {
    const d = parseInt(days) || 3;
    const t = window.I18n?.t?.bind(window.I18n) || ((k, p) => k);

    // Badge tags: "3 ngÃ y" trÃªn upload/capture cards
    const uploadBadge = $('#infoBlobDaysUpload');
    const captureBadge = $('#infoBlobDaysCapture');
    if (uploadBadge) uploadBadge.textContent = d + ' ' + (t('settings.days') || 'ngÃ y');
    if (captureBadge) captureBadge.textContent = d + ' ' + (t('settings.days') || 'ngÃ y');

    // Lifecycle table row: "Sau N ngÃ y"
    const afterNDays = $('#infoAfterNDays');
    if (afterNDays) afterNDays.textContent = t('settings.infoAfterNDays', { days: d }) || ('Sau ' + d + ' ngÃ y');

    // Note 1: "...tá»± Ä‘á»™ng xÃ³a sau N ngÃ y"
    const note1 = $('#infoNote1Text');
    if (note1) note1.textContent = t('settings.infoNote1', { days: d }) || ('áº¢nh upload/capture lÆ°u blob trong IndexedDB, tá»± Ä‘á»™ng xÃ³a sau ' + d + ' ngÃ y.');
  }

  /**
   * G-8.4: Toggle visibility theo Grok mode.
   * - mode=video: show .grok-video-only (duration + resolution)
   * - mode=image: show .grok-image-only (image quality Speed/Quality â€” Grok update 2026-04)
   */
  function _toggleGrokVideoFields() {
    const isVideo = els.grokDefaultMode?.value === 'video';
    document.querySelectorAll('.grok-video-only').forEach(r => { r.style.display = isVideo ? '' : 'none'; });
    document.querySelectorAll('.grok-image-only').forEach(r => { r.style.display = isVideo ? 'none' : ''; });
  }

  /**
   * Toggle Telegram Grok fields visibility theo mode.
   * - mode=video: show .telegram-grok-video-only (duration + resolution)
   * - mode=image: show .telegram-grok-image-only (image quality)
   */
  function _toggleTelegramGrokFields() {
    const isVideo = els.telegramGrokMode?.value === 'video';
    document.querySelectorAll('.telegram-grok-video-only').forEach(r => { r.style.display = isVideo ? '' : 'none'; });
    document.querySelectorAll('.telegram-grok-image-only').forEach(r => { r.style.display = isVideo ? 'none' : ''; });
  }

  // ===== Collect Settings =====
  function collectSettings() {
    return {
      execDelayNodes: parseInt(els.execDelay?.value) || 3,
      execMaxRetries: parseInt(els.execRetries?.value) || 2,
      execTimeout: parseInt(els.execTimeout?.value) || 180,
      execOnError: $('input[name="execOnError"]:checked')?.value || 'continue',
      inputTimeout: parseInt(els.inputTimeout?.value) || 1200,
      delayBetweenPrompts: parseInt(els.delayBetweenPrompts?.value) || 5,
      blobMaxAgeDays: parseInt(els.blobMaxAgeDays?.value) || 7,
      randomDelayMin: parseInt(els.randomDelayMin?.value) || 3,
      randomDelayMax: parseInt(els.randomDelayMax?.value) || 10,
      queueEnabled: els.queueEnabled?.checked || false,
      queueBatchSize: parseInt(els.queueBatchSize?.value) || 4,
      queueMaxMonitor: parseInt(els.queueMaxMonitor?.value) || 4,
      queueRestMin: parseInt(els.queueRestMin?.value) || 5,
      queueRestMax: parseInt(els.queueRestMax?.value) || 15,
      autoReloadEnabled: els.autoReloadEnabled?.checked || false,
      autoReloadThreshold: parseInt(els.autoReloadThreshold?.value) || 30,
      // Phase FAR â€” Flow auto-retry settings
      flowSessionRefreshEnabled: els.flowSessionRefreshEnabled?.checked === true,
      flowSessionRefreshIntervalMin: parseInt(els.flowSessionRefreshIntervalMin?.value) || 120,
      flowAutoRecoveryEnabled: els.flowAutoRecoveryEnabled?.checked !== false,
      flowConsecutiveFailThreshold: parseInt(els.flowConsecutiveFailThreshold?.value) || 2,
      flowBackoffBaseSec: parseInt(els.flowBackoffBaseSec?.value) || 30,
      flowBackoffMaxSec: parseInt(els.flowBackoffMaxSec?.value) || 300,
      flowBackoffJitterPercent: parseInt(els.flowBackoffJitterPercent?.value) || 20,
      autoDownload: els.autoDownload?.checked || false,
      downloadFolder: els.downloadFolder?.value || 'slnctrz_output',
      fileNameProject: els.fileNameProject?.value || '',
      fileNameTemplate: els.fileNameTemplate?.value || '[Date]_[Project]_[Prompt]_[Index]',
      downloadResolution: els.downloadResolution?.value || '1k',
      videoDownloadResolution: els.videoDownloadResolution?.value || '720p',
      theme: els.theme?.value || 'dark',
      language: els.language?.value || 'vi',
      notifyOnComplete: els.notifyComplete?.checked ?? true,
      notifySound: els.notifySound?.checked || false,
      notifyTelegram: els.notifyTelegramInTab?.checked ?? els.notifyTelegram?.checked ?? false,
      telegramAutoDownload: els.telegramAutoDownload?.checked !== false,
      telegramDownloadFolder: els.telegramDownloadFolder?.value || 'tobyflow_bot',
      telegramDownloadResolution: els.telegramDownloadResolution?.value || '1k',
      telegramVideoDownloadResolution: els.telegramVideoDownloadResolution?.value || '720p',
      // Telegram provider settings
      telegramDefaultProvider: els.telegramDefaultProvider?.value || 'flow',
      telegramFlowRatio: els.telegramFlowRatio?.value || '16:9',
      telegramFlowModel: els.telegramFlowModel?.value || 'Nano Banana 2',
      telegramChatgptRatio: els.telegramChatgptRatio?.value || 'square',
      telegramGrokMode: els.telegramGrokMode?.value || 'image',
      telegramGrokRatio: els.telegramGrokRatio?.value || 'widescreen',
      telegramGrokDuration: els.telegramGrokDuration?.value || '6s',
      telegramGrokResolution: els.telegramGrokResolution?.value || '720p',
      telegramGrokImageQuality: els.telegramGrokImageQuality?.value || 'speed',
      humanizedMode: els.humanizedMode?.checked || false,
      humanizedSpeed: parseFloat(els.humanizedSpeed?.value) || 0.5,
      defaultGenType: els.defaultGenType?.value || 'Image',
      defaultImageRatio: els.defaultImageRatio?.value || '16:9',
      defaultVideoRatio: els.defaultVideoRatio?.value || '16:9',
      defaultImageModel: els.defaultImageModel?.value || 'Nano Banana 2',
      defaultVideoModel: els.defaultVideoModel?.value || 'Veo 3.1 - Fast',
      // CG-5.3: Provider máº·c Ä‘á»‹nh + ChatGPT
      defaultProvider: els.defaultProvider?.value || 'flow',
      chatgptDefaultRatio: els.chatgptDefaultRatio?.value || 'story',
      chatgptAutoClose: els.chatgptAutoClose?.checked || false,
      chatgptFallbackPrefix: els.chatgptFallbackPrefix?.value || 'Generate an image of: ',
      // G-8.4: Grok defaults
      grokDefaultMode: els.grokDefaultMode?.value || 'image',
      grokDefaultRatio: els.grokDefaultRatio?.value || 'widescreen',
      grokDefaultDuration: els.grokDefaultDuration?.value || '6s',
      grokDefaultResolution: els.grokDefaultResolution?.value || '720p',
      grokDefaultImageQuality: els.grokDefaultImageQuality?.value || 'speed',
      grokAutoClose: els.grokAutoClose?.checked || false
    };
  }

  // ===== Server Sync =====
  // Äáº©y settings lÃªn server khi Ä‘Ã£ Ä‘Äƒng nháº­p (backup cho trÆ°á»ng há»£p sidePanel chÆ°a má»Ÿ)
  async function syncToServer(settings) {
    try {
      const result = await chrome.storage.local.get(['af_auth']);
      const auth = result.af_auth;
      if (!auth?.token) return;

      const response = await chrome.runtime.sendMessage({
        action: 'apiRequest',
        method: 'PUT',
        endpoint: 'settings',
        data: { settings_json: settings },
        token: auth.token
      });

      if (response?.success) {
        console.log('[SlncTrZ] Settings synced to server from settings page');
      } else {
        // Verbose log: kÃ¨m validation errors detail (field nÃ o reject) Ä‘á»ƒ debug 422
        console.warn('[SlncTrZ] Settings server sync failed:', response?.error,
          'errors:', response?.errors || response?.data?.errors || '(no detail)');
      }
    } catch (err) {
      // KhÃ´ng hiá»ƒn thá»‹ lá»—i cho user - sync server lÃ  tÃ­nh nÄƒng phá»¥
      const detail = err.errors || err.data?.errors || null;
      console.warn('[SlncTrZ] Settings server sync error:', err.message,
        detail ? { errors: detail } : '');
    }
  }

  // ===== Save All =====
  async function saveAllSettings() {
    els.saveAllBtn.disabled = true;
    els.saveAllBtn.textContent = window.I18n?.t('settings.saving') || 'Äang lÆ°u...';

    try {
      const collected = collectSettings();
      // Defensive merge: collectSettings() chá»‰ cÃ³ cÃ¡c field cÃ³ UI input. Náº¿u storage hiá»‡n
      // cÃ³ field nÃ o khÃ´ng thuá»™c collectSettings (vd: legacy `defaultRatio`, hoáº·c field server
      // sync xuá»‘ng mÃ  extension version cÅ© hÆ¡n khÃ´ng biáº¿t) â†’ set trá»±c tiáº¿p `af_settings: collected`
      // sáº½ XOÃ chÃºng. Merge vÃ o existing Ä‘á»ƒ báº£o toÃ n.
      const existingResult = await chrome.storage.local.get(['af_settings']);
      const existing = existingResult.af_settings || {};
      const settings = { ...existing, ...collected };
      await chrome.storage.local.set({ af_settings: settings });
    if (settings.ws_bridge_url) {
      const wsConfig = { url: settings.ws_bridge_url };
      const existing = await chrome.storage.local.get(['af_ws_config']);
      chrome.storage.local.set({ af_ws_config: { ...(existing.af_ws_config || {}), ...wsConfig } });
    }

      // Äáº©y lÃªn server (debounce khÃ´ng cáº§n vÃ¬ user báº¥m nÃºt Save thá»§ cÃ´ng)
      syncToServer(settings);

      // Gá»­i notification Ä‘áº¿n sidebar Ä‘á»ƒ hiá»ƒn thá»‹ thÃ´ng bÃ¡o Ä‘Ã£ cáº­p nháº­t
      chrome.runtime.sendMessage({
        action: 'settingsSaved',
        message: window.I18n?.t('settings.settingsUpdated') || 'CÃ i Ä‘áº·t Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t'
      }).catch(() => {});

      showStatus(els.saveStatus, window.I18n?.t('settings.allSettingsSaved') || 'ÄÃ£ lÆ°u táº¥t cáº£ cÃ i Ä‘áº·t!', 'success');
      setTimeout(() => hideStatus(els.saveStatus), 3000);
    } catch (error) {
      showStatus(els.saveStatus, (window.I18n?.t('common.error') || 'Lá»—i') + ': ' + error.message, 'error');
    } finally {
      els.saveAllBtn.disabled = false;
      els.saveAllBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${window.I18n?.t('settings.saveAllSettings') || 'LÆ°u táº¥t cáº£ cÃ i Ä‘áº·t'}`;
    }
  }

  // ===== Data Management (Settings only, hidden for logged-in users) =====
  async function exportData() {
    try {
      // Chá»‰ export settings (khÃ´ng export tasks/workflows vÃ¬ Ä‘Ã£ sync server)
      const data = await chrome.storage.local.get(['af_settings']);
      const exportObj = { version: '2.1.0', type: 'settings', exportedAt: new Date().toISOString(), data };
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slnctrz-settings-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      if (window.customDialog) window.customDialog.alert((window.I18n?.t('settings.exportError') || 'Lá»—i xuáº¥t dá»¯ liá»‡u') + ': ' + e.message, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
    }
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const shouldImport = window.customDialog
      ? await window.customDialog.confirm(window.I18n?.t('settings.importSettingsConfirm') || 'Import sáº½ ghi Ä‘Ã¨ cÃ i Ä‘áº·t hiá»‡n táº¡i. Tiáº¿p tá»¥c?', { title: window.I18n?.t('settings.importConfirmTitle') || 'XÃ¡c nháº­n Import', type: 'warning', confirmText: 'Import', cancelText: window.I18n?.t('common.cancel') || 'Há»§y' })
      : confirm(window.I18n?.t('settings.importSettingsConfirm') || 'Import sáº½ ghi Ä‘Ã¨ cÃ i Ä‘áº·t hiá»‡n táº¡i. Tiáº¿p tá»¥c?');
    if (!shouldImport) {
      els.importFile.value = '';
      return;
    }
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (!obj.data || !obj.version) throw new Error(window.I18n?.t('settings.invalidFileFormat') || 'File khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng');
      // Chá»‰ import af_settings, bá» qua tasks/workflows náº¿u cÃ³ trong file cÅ©
      const settingsOnly = { af_settings: obj.data.af_settings };
      if (!settingsOnly.af_settings) throw new Error(window.I18n?.t('settings.noSettingsInFile') || 'File khÃ´ng chá»©a dá»¯ liá»‡u cÃ i Ä‘áº·t');
      await chrome.storage.local.set(settingsOnly);
      if (window.customDialog) window.customDialog.alert(window.I18n?.t('settings.importSuccess') || 'Import thÃ nh cÃ´ng!', { title: window.I18n?.t('common.success') || 'ThÃ nh cÃ´ng', type: 'success' });
      loadSettings();
    } catch (e) {
      if (window.customDialog) window.customDialog.alert((window.I18n?.t('settings.importError') || 'Lá»—i import') + ': ' + e.message, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
    } finally {
      els.importFile.value = '';
    }
  }

  // áº¨n Data Management section cho user Ä‘Ã£ login (data sync qua server)
  function updateDataManagementVisibility() {
    if (!els.dataManagementSection) return;
    // Settings page khÃ´ng cÃ³ authManager, check af_auth tá»« storage trá»±c tiáº¿p
    chrome.storage.local.get(['af_auth'], (result) => {
      const isLoggedIn = !!result.af_auth?.token;
      els.dataManagementSection.style.display = isLoggedIn ? 'none' : '';
    });
  }

  // ===== Clear Cache =====
  async function clearCache() {
    const shouldClear = window.customDialog
      ? await window.customDialog.confirm(window.I18n?.t('settings.clearCacheConfirm') || 'XÃ³a bá»™ nhá»› Ä‘á»‡m (thumbnail cache, dá»¯ liá»‡u táº¡m, IndexedDB)? CÃ i Ä‘áº·t vÃ  dá»¯ liá»‡u chÃ­nh khÃ´ng bá»‹ áº£nh hÆ°á»Ÿng.', { title: window.I18n?.t('settings.clearCacheTitle') || 'XÃ³a bá»™ nhá»› Ä‘á»‡m', type: 'warning', confirmText: window.I18n?.t('common.delete') || 'XÃ³a', cancelText: window.I18n?.t('common.cancel') || 'Há»§y' })
      : confirm(window.I18n?.t('settings.clearCacheConfirm') || 'XÃ³a bá»™ nhá»› Ä‘á»‡m? CÃ i Ä‘áº·t vÃ  dá»¯ liá»‡u chÃ­nh khÃ´ng bá»‹ áº£nh hÆ°á»Ÿng.');
    if (!shouldClear) return;

    try {
      // Remove thumbnail cache and temp keys from chrome.storage.local
      const allData = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(allData).filter(
        key => key === 'af_thumbnail_cache' || key.startsWith('af_temp_')
      );
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }

      // Delete IndexedDB database (PendingUploadStore)
      await new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase('autoflow_pro');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
      });

      console.log('[SlncTrZ] \u0110\u00E3 x\u00F3a b\u1ED9 nh\u1EDB \u0111\u1EC7m:', keysToRemove.length, 'kh\u00F3a storage + IndexedDB');

      if (window.customDialog) {
        window.customDialog.alert(window.I18n?.t('settings.clearCacheSuccess') || 'ÄÃ£ xÃ³a bá»™ nhá»› Ä‘á»‡m thÃ nh cÃ´ng!', { title: window.I18n?.t('common.success') || 'ThÃ nh cÃ´ng', type: 'success' });
      }
    } catch (e) {
      console.error('[SlncTrZ] Lá»—i xÃ³a bá»™ nhá»› Ä‘á»‡m:', e);
      if (window.customDialog) {
        window.customDialog.alert((window.I18n?.t('settings.clearCacheError') || 'Lá»—i xÃ³a bá»™ nhá»› Ä‘á»‡m') + ': ' + e.message, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
      }
    }
  }

  // ===== User Profile =====
  async function loadUserProfile() {
    const container = document.getElementById('userProfileContent');
    if (!container) return;

    try {
      const result = await chrome.storage.local.get(['af_auth', 'af_entitlements']);
      const auth = result.af_auth;
      const entitlements = result.af_entitlements;

      if (auth?.token && auth?.user) {
        const user = auth.user;
        const initial = _escapeHtml((user.name || user.email || '?').charAt(0).toUpperCase());
        const planLabel = _escapeHtml(entitlements?.plan?.name || user.plan_name || user.plan_slug || 'Free');
        // Free user detection â€” slug = trial/free hoáº·c null. Hide-upgrade-ui CSS rule
        // tá»± áº©n button khi admin táº¯t setting "Hiá»ƒn thá»‹ cÃ¡c gá»£i Ã½ nÃ¢ng cáº¥p".
        const planSlug = (entitlements?.plan?.slug || user.plan_slug || '').toLowerCase();
        const isFreePlan = !planSlug || planSlug === 'free' || planSlug === 'trial';
        const upgradeBtnHtml = isFreePlan ? `
            <button class="s-btn s-btn-upgrade s-btn-sm" id="settingsUpgradeBtn" title="${window.I18n?.t('footer.upgrade') || 'NÃ¢ng cáº¥p'}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"/></svg>
              ${window.I18n?.t('footer.upgrade') || 'NÃ¢ng cáº¥p'}
            </button>` : '';
        container.innerHTML = `
          <div class="s-profile-card">
            <div class="s-profile-avatar">${initial}</div>
            <div class="s-profile-info">
              <div class="s-profile-email">${_escapeHtml(user.email || '')}</div>
              <div class="s-profile-meta">
                <span class="s-profile-plan">${planLabel}</span>
                <span class="s-profile-sep"></span>
                <span class="s-profile-storage">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  Cloud
                </span>
              </div>
            </div>
            ${upgradeBtnHtml}
            <button class="s-btn s-btn-secondary s-btn-sm" id="settingsLogoutBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              ${window.I18n?.t('auth.logout') || 'ÄÄƒng xuáº¥t'}
            </button>
          </div>
        `;
        // Bind upgrade button click â€” gá»­i message Ä‘áº¿n sidePanel má»Ÿ upgrade modal
        document.getElementById('settingsUpgradeBtn')?.addEventListener('click', () => {
          try { chrome.runtime.sendMessage({ action: 'showUpgradeModal' }); } catch (_) {}
        });
        document.getElementById('settingsLogoutBtn')?.addEventListener('click', async () => {
          if (auth?.token) {
            try {
              // CRITICAL: Gá»i sse/end-session TRÆ¯á»šC auth/logout Ä‘á»ƒ xÃ³a SSE session
              // (Backend auth/logout cÅ©ng xÃ³a, nhÆ°ng Ä‘Ã¢y lÃ  backup)
              await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                  action: 'apiRequest',
                  method: 'POST',
                  endpoint: 'sse/end-session',
                  token: auth.token
                }, () => resolve());
              });
            } catch (e) { /* Ignore */ }

            try {
              // Call server logout endpoint to invalidate token
              await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                  action: 'apiRequest',
                  method: 'POST',
                  endpoint: 'auth/logout',
                  token: auth.token
                }, () => resolve());
              });
            } catch (e) { /* Ignore â€” still clear local */ }
          }
          await chrome.storage.local.remove(['af_auth', 'af_entitlements', 'af_settings']);
          window.close();
        });
      } else {
        container.innerHTML = `
          <div class="s-profile-anon">
            <div class="s-profile-anon-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              <div>
                <span class="s-profile-anon-label">Local mode</span>
                <span class="s-profile-storage-local">Offline — no server</span>
              </div>
            </div>
          </div>
        `;
        document.getElementById('settingsLoginBtn')?.addEventListener('click', () => {
          // Gá»­i message má»Ÿ login overlay bÃªn sidePanel (giá»‘ng pattern upgrade modal)
          chrome.runtime.sendMessage({ action: 'openLoginModal' });
        });
      }
    } catch (e) {
      console.error('[SlncTrZ] Error loading user profile:', e);
    }
  }

  // ===== Helpers =====
  function showStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `s-status ${type}`;
    el.classList.remove('hidden');
  }

  function hideStatus(el) {
    if (el) el.classList.add('hidden');
  }

  // ===== Bind Events =====
  /**
   * áº¨n/hiá»‡n cÃ¡c cÃ i Ä‘áº·t queue dá»±a trÃªn tráº¡ng thÃ¡i toggle
   */
  function _toggleQueueSettings(enabled) {
    const settingsGroup = document.getElementById('queueSettingsGroup');
    const restGroup = document.getElementById('queueRestGroup');
    const autoReloadGroup = document.getElementById('autoReloadGroup');
    if (settingsGroup) settingsGroup.style.display = enabled ? '' : 'none';
    if (restGroup) restGroup.style.display = enabled ? '' : 'none';
    if (autoReloadGroup) autoReloadGroup.style.display = enabled ? '' : 'none';
  }

  function _toggleDownloadSettings(enabled) {
    const fields = [els.downloadFolder, els.fileNameProject, els.fileNameTemplate, els.downloadResolution, els.videoDownloadResolution];
    fields.forEach(el => {
      if (!el) return;
      el.disabled = !enabled;
      const field = el.closest('.s-field');
      if (field) field.style.opacity = enabled ? '' : '0.45';
    });
  }

  function bindEvents() {
    els.saveAllBtn?.addEventListener('click', saveAllSettings);
    els.clearCacheBtn?.addEventListener('click', clearCache);
    els.exportBtn?.addEventListener('click', exportData);
    els.importBtn?.addEventListener('click', () => els.importFile?.click());
    els.importFile?.addEventListener('change', importData);

    // NÃºt Ä‘Ã³ng settings window
    document.getElementById('settingsCloseBtn')?.addEventListener('click', () => {
      window.close();
    });

    // Pipeline Queue toggle â€” áº©n/hiá»‡n cÃ i Ä‘áº·t chi tiáº¿t
    els.queueEnabled?.addEventListener('change', () => {
      _toggleQueueSettings(els.queueEnabled.checked);
    });

    // Auto-download toggle â€” disable/enable download setting inputs
    els.autoDownload?.addEventListener('change', () => {
      _toggleDownloadSettings(els.autoDownload.checked);
    });

    // Humanized speed range label update
    els.humanizedSpeed?.addEventListener('input', () => {
      if (els.humanizedSpeedLabel) {
        els.humanizedSpeedLabel.textContent = parseFloat(els.humanizedSpeed.value).toFixed(1) + 'x';
      }
    });

    // Blob max age days â€” cáº­p nháº­t Info tab live
    els.blobMaxAgeDays?.addEventListener('change', () => {
      _updateInfoBlobDays(els.blobMaxAgeDays.value);
    });

    // G-8.4: Grok mode change â€” toggle visibility duration/resolution rows
    els.grokDefaultMode?.addEventListener('change', _toggleGrokVideoFields);

    // Telegram Grok mode change â€” toggle video/image fields
    els.telegramGrokMode?.addEventListener('change', _toggleTelegramGrokFields);

    // Sync notifyTelegram checkboxes (tab CÃ i Ä‘áº·t vs tab Telegram)
    els.notifyTelegram?.addEventListener('change', () => {
      if (els.notifyTelegramInTab) {
        els.notifyTelegramInTab.checked = els.notifyTelegram.checked;
      }
    });
    els.notifyTelegramInTab?.addEventListener('change', async () => {
      // Sync vá»›i checkbox á»Ÿ tab CÃ i Ä‘áº·t
      if (els.notifyTelegram) {
        els.notifyTelegram.checked = els.notifyTelegramInTab.checked;
      }
      // Auto-save ngay khi toggle
      try {
        const result = await chrome.storage.local.get(['af_settings']);
        const settings = result.af_settings || {};
        settings.notifyTelegram = els.notifyTelegramInTab.checked;
        await chrome.storage.local.set({ af_settings: settings });
        // Sync to server náº¿u Ä‘Ã£ login
        syncToServer(settings);
      } catch (err) {
        console.error('[Settings] Auto-save notifyTelegram failed:', err);
      }
    });

    // Open Chrome download settings â€” reuse existing tab if open
    document.getElementById('openChromeDownloadSettings')?.addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({ url: 'chrome://settings/*' });
      const existing = tabs.find(t => t.url && t.url.includes('settings/downloads'));
      if (existing) {
        chrome.tabs.update(existing.id, { active: true });
        chrome.windows.update(existing.windowId, { focused: true });
      } else {
        chrome.tabs.create({ url: 'chrome://settings/downloads' });
      }
    });

    // Telegram
    els.telegramLinkBtn?.addEventListener('click', handleTelegramLink);
    els.telegramOtpCopyBtn?.addEventListener('click', handleTelegramOtpCopy);
    els.telegramOtpCancelBtn?.addEventListener('click', handleTelegramOtpCancel);
    els.telegramUnlinkBtn?.addEventListener('click', handleTelegramUnlink);
    // Bot option cards
    els.telegramOptionShared?.addEventListener('click', () => selectTelegramBotOption('shared'));
    els.telegramOptionCustom?.addEventListener('click', () => selectTelegramBotOption('custom'));
  }

  // ===== Crown Label Helpers (standalone â€” settings.html KHÃ”NG load FeatureGate.js) =====

  let _settingsIsLoggedIn = false; // cache from af_auth storage, set trong checkFeatureEntitlements

  function _settingsCanFreePlanUse(featureKey) {
    if (!featureKey) return null;
    const plans = window._cachedPlans;
    if (!Array.isArray(plans) || plans.length === 0) return null;
    const free = plans.find(p => p?.slug === 'free');
    if (!free || !Array.isArray(free.features)) return null;
    const f = free.features.find(x => x?.key === featureKey);
    if (!f) return false;
    const v = f.value;
    if (f.type === 'boolean') {
      return v === true || v === '1' || v === 1;
    }
    if (f.type === 'quota') {
      if (v === 'unlimited' || v === -1 || v === '-1') return true;
      const limit = typeof v === 'string' ? parseInt(v, 10) : v;
      return Number.isFinite(limit) && limit > 0;
    }
    return v !== null && v !== undefined && v !== '0' && v !== 0 && v !== false && v !== '';
  }

  function _settingsGetCrownLabel(featureKey) {
    if (!_settingsIsLoggedIn) {
      const freeHas = featureKey ? _settingsCanFreePlanUse(featureKey) : null;
      if (freeHas === true) {
        return window.I18n?.t('common.requireLogin') || 'YÃªu cáº§u login';
      }
    }
    return window.I18n?.t('common.premium') || 'Premium';
  }

  function _settingsRenderCrownHTML(featureKey) {
    const label = _settingsGetCrownLabel(featureKey);
    return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"></path></svg> ' + label;
  }

  // ===== Fetch Plans (cho crown label) =====
  async function _fetchPlansForCrowns() {
    if (Array.isArray(window._cachedPlans) && window._cachedPlans.length > 0) return; // Ä‘Ã£ cÃ³
    try {
      const resp = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'apiRequest',
          method: 'GET',
          endpoint: 'plans?extension=flow&include_internal=1',
        }, (r) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else if (r?.success && r?.data) resolve(r.data);
          else reject(new Error('plans fetch failed'));
        });
      });
      if (Array.isArray(resp)) {
        window._cachedPlans = resp;
      }
    } catch (e) {
      console.warn('[Settings] Fetch plans failed:', e.message);
    }
  }

  // ===== Check Feature Entitlements =====
  async function checkFeatureEntitlements() {
    try {
      const result = await chrome.storage.local.get(['af_entitlements', 'af_auth']);
      const entitlements = result.af_entitlements?.entitlements || {};
      _settingsIsLoggedIn = !!(result.af_auth?.token);

      // Check auto_download feature
      const autoDownloadFeature = entitlements.auto_download;
      const canUseAutoDownload = autoDownloadFeature?.value === '1' || autoDownloadFeature?.value === 1;
      _applySettingsFeatureState(els.autoDownload, canUseAutoDownload, '.s-checkbox-row', false, 'auto_download');

      // Check retry_on_fail feature
      const retryFeature = entitlements.retry_on_fail;
      const canUseRetry = retryFeature?.value === '1' || retryFeature?.value === 1;
      _applySettingsFeatureState(els.execRetries, canUseRetry, '.s-field', true, 'retry_on_fail');
      if (els.execRetries && !canUseRetry) {
        els.execRetries.value = '0';
      }

      // Check pipeline_queue_enabled feature
      const queueFeature = entitlements.pipeline_queue_enabled;
      const canUseQueue = queueFeature?.value === '1' || queueFeature?.value === 1;
      _applySettingsFeatureState(els.queueEnabled, canUseQueue, '.s-toggle-row', false, 'pipeline_queue_enabled');

      // Check humanized_mode feature (if exists)
      const humanizedFeature = entitlements.humanized_mode;
      const canUseHumanized = humanizedFeature ? (humanizedFeature.value === '1' || humanizedFeature.value === 1) : true;
      _applySettingsFeatureState(els.humanizedMode, canUseHumanized, '.s-toggle-row', false, 'humanized_mode');

      // Check telegram_enabled feature
      const telegramFeature = entitlements.telegram_enabled;
      const canUseTelegram = telegramFeature ? (telegramFeature.value === '1' || telegramFeature.value === 1) : true;
      _applyTelegramFeatureState(canUseTelegram);

      // Check telegram_custom_bot feature â€” hide custom bot option if not allowed
      const customBotFeature = entitlements.telegram_custom_bot;
      const canUseCustomBot = customBotFeature?.value === '1' || customBotFeature?.value === 1;
      _applyTelegramCustomBotState(canUseCustomBot);
    } catch (e) {
      console.warn('[Settings] Error checking feature entitlements:', e);
    }
  }

  /**
   * Apply feature gate state to a settings element
   */
  function _applySettingsFeatureState(el, canUse, containerSel, isInput, featureKeyArg) {
    if (!el) return;
    const container = el.closest(containerSel);
    // Stash featureKey trÃªn element Ä‘á»ƒ re-render dÃ¹ng Ä‘Ãºng key (khÃ´ng phá»¥ thuá»™c element id)
    if (featureKeyArg) el.dataset.featureKey = featureKeyArg;

    if (canUse) {
      el.disabled = false;
      if (container) {
        container.style.opacity = '';
        container.style.cursor = '';
        container.title = '';
        container.querySelector('.premium-crown')?.remove();
      }
    } else {
      el.disabled = true;
      if (!isInput) el.checked = false;
      if (container) {
        container.style.opacity = '0.5';
        container.style.cursor = 'not-allowed';
        container.title = window.I18n?.t('settings.premiumRequired') || 'TÃ­nh nÄƒng nÃ y yÃªu cáº§u gÃ³i Premium';
        // Always sync content (label Ä‘á»•i tá»« "Premium" â†’ "YÃªu cáº§u login" khi plans
        // cache load xong â†’ emit featuregate:refreshed â†’ re-call _applyFeatureGate).
        const featureKey = el.dataset?.featureKey || el.id || null;
        let crown = container.querySelector('.premium-crown');
        const crownCreated = !crown;
        if (crownCreated) {
          crown = document.createElement('span');
          crown.className = 'premium-crown';
        }
        crown.innerHTML = _settingsRenderCrownHTML(featureKey);
        crown.title = _settingsGetCrownLabel(featureKey);
        if (crownCreated) {
          // Try to place inline after toggle label text
          const toggleLabel = container.querySelector('.s-toggle > span:not(.s-toggle-track)') || container.querySelector('label > span:last-of-type');
          if (toggleLabel) {
            toggleLabel.appendChild(crown);
          } else {
            // For .s-field containers, append INSIDE label (label is display:block, crown stays inline with text)
            const fieldLabel = container.querySelector('label');
            if (fieldLabel) {
              fieldLabel.appendChild(crown);
            } else {
              container.appendChild(crown);
            }
          }
        }
      }
    }
  }

  /**
   * Apply feature gate state to Telegram sections (link + quota)
   * Note: Promo banner is NOT affected - always visible to encourage upgrade
   */
  function _applyTelegramFeatureState(canUse) {
    const linkSection = document.querySelector('#telegramSection');
    const quotaSection = document.querySelector('#telegramQuotaSection');

    // Apply to both sections
    [linkSection, quotaSection].forEach(section => {
      if (!section) return;

      if (canUse) {
        section.style.opacity = '';
        section.style.cursor = '';
        section.title = '';
        section.querySelector('.premium-crown')?.remove();
        // Re-enable interactive elements
        section.querySelectorAll('button, input').forEach(el => el.disabled = false);
      } else {
        section.style.opacity = '0.5';
        section.style.cursor = 'not-allowed';
        section.title = window.I18n?.t('settings.premiumRequired') || 'TÃ­nh nÄƒng nÃ y yÃªu cáº§u gÃ³i Premium';
        // Disable interactive elements
        section.querySelectorAll('button, input').forEach(el => el.disabled = true);
      }
    });

    // Add crown only to link section header
    if (!canUse && linkSection && !linkSection.querySelector('.premium-crown')) {
      const crown = document.createElement('span');
      crown.className = 'premium-crown';
      crown.innerHTML = _settingsRenderCrownHTML('telegram_enabled');
      crown.title = _settingsGetCrownLabel('telegram_enabled');
      const headerSpan = linkSection.querySelector('.s-section-header span:first-of-type');
      if (headerSpan) {
        headerSpan.insertAdjacentElement('afterend', crown);
      }
    }
  }

  /**
   * Apply feature gate state to Telegram Custom Bot option
   * Disable (not hide) custom bot option if user doesn't have telegram_custom_bot feature
   */
  function _applyTelegramCustomBotState(canUseCustomBot) {
    if (!els.telegramOptionCustom) return;

    if (canUseCustomBot) {
      els.telegramOptionCustom.classList.remove('telegram-bot-option--disabled');
      els.telegramOptionCustom.style.opacity = '';
      els.telegramOptionCustom.style.cursor = '';
      els.telegramOptionCustom.style.pointerEvents = '';
      els.telegramOptionCustom.title = '';
    } else {
      els.telegramOptionCustom.classList.add('telegram-bot-option--disabled');
      els.telegramOptionCustom.style.opacity = '0.5';
      els.telegramOptionCustom.style.cursor = 'not-allowed';
      els.telegramOptionCustom.style.pointerEvents = 'none';
      els.telegramOptionCustom.title = window.I18n?.t('settings.premiumRequired') || 'TÃ­nh nÄƒng nÃ y yÃªu cáº§u gÃ³i Premium';
      // If currently selected custom bot, reset to shared
      if (_telegramUseCustomBot) {
        selectTelegramBotOption('shared');
      }
    }
  }

  /**
   * Load and display Telegram quota from user's plan entitlements
   */
  async function _loadTelegramQuota() {
    try {
      const result = await chrome.storage.local.get('af_entitlements');
      const entitlements = result.af_entitlements || {};
      const features = entitlements.entitlements || {};

      // Hour quota
      const hourFeature = features.telegram_rate_hour;
      let hourLimit = 10; // default
      let hourUsed = 0;
      let isHourUnlimited = false;
      if (hourFeature) {
        const limitVal = hourFeature.value;
        isHourUnlimited = (limitVal === '-1' || limitVal === 'unlimited');
        hourLimit = isHourUnlimited ? 'âˆž' : (parseInt(limitVal) || 10);
        hourUsed = hourFeature.usage_today ?? hourFeature.usage ?? 0;
      }

      // Day quota
      const dayFeature = features.telegram_rate_day;
      let dayLimit = 50; // default
      let dayUsed = 0;
      let isDayUnlimited = false;
      if (dayFeature) {
        const limitVal = dayFeature.value;
        isDayUnlimited = (limitVal === '-1' || limitVal === 'unlimited');
        dayLimit = isDayUnlimited ? 'âˆž' : (parseInt(limitVal) || 50);
        dayUsed = dayFeature.usage_today ?? dayFeature.usage ?? 0;
      }

      // Update DOM elements
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setVal('telegramQuotaHourUsed', hourUsed);
      setVal('telegramQuotaHourLimit', hourLimit);
      setVal('telegramQuotaDayUsed', dayUsed);
      setVal('telegramQuotaDayLimit', dayLimit);

      // Show/hide upgrade hint: chá»‰ hiá»ƒn thá»‹ vá»›i free/trial plan
      const upgradeHint = document.getElementById('telegramQuotaUpgrade');
      if (upgradeHint) {
        const planSlug = entitlements.plan?.slug || 'trial';
        const isFreePlan = planSlug === 'free' || planSlug === 'trial';
        if (isFreePlan) {
          upgradeHint.classList.remove('hidden');
        } else {
          upgradeHint.classList.add('hidden');
        }
      }
    } catch (err) {
      console.warn('[Settings] _loadTelegramQuota error:', err);
    }
  }

  /**
   * Initialize Telegram quota upgrade hint click handler
   */
  function _initTelegramQuotaUpgrade() {
    const upgradeHint = document.getElementById('telegramQuotaUpgrade');
    if (upgradeHint) {
      upgradeHint.addEventListener('click', () => {
        // Send message to open upgrade modal in sidePanel
        chrome.runtime.sendMessage({ action: 'openUpgradeModal' });
      });
    }
  }

  // ===== Tab Switching =====
  function initTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const contents = document.querySelectorAll('.tab-content');

    // Auto-select tab tá»« URL hash (vd settings.html#storage)
    const hash = window.location.hash.slice(1);
    if (hash) {
      const targetBtn = document.querySelector(`.settings-tab[data-tab="${hash}"]`);
      if (targetBtn) {
        // Defer 1 tick Ä‘á»ƒ cÃ¡c listener init bÃªn dÆ°á»›i hoÃ n táº¥t
        setTimeout(() => targetBtn.click(), 0);
      }
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const targetContent = document.querySelector(`[data-tab-content="${target}"]`);
        if (targetContent) targetContent.classList.add('active');

        // Load storage stats on first switch
        if (target === 'storage') {
          loadDailyStats();
          scanAllStorage();
        }

        // Hide/show footer save button (show for settings + advanced tabs)
        const footer = document.querySelector('.settings-footer');
        if (footer) footer.style.display = (target === 'settings' || target === 'advanced') ? '' : 'none';

        // Check feature entitlements when switching to advanced tab
        if (target === 'advanced') checkFeatureEntitlements();

        // Load Telegram quota when switching to telegram tab
        if (target === 'telegram') {
          _loadTelegramQuota();
          checkFeatureEntitlements(); // Also check feature state
        }
      });
    });
  }

  // ===== Storage Tab =====
  const TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>';

  // Chrome storage key definitions
  const CHROME_STORAGE_DEFS = [
    { key: 'af_settings', get label() { return window.I18n?.t('settings.storageSettings') || 'CÃ i Ä‘áº·t'; }, get desc() { return window.I18n?.t('settings.storageSettingsDesc') || 'Theme, sidebar, timeout, download'; }, icon: 'blue', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4"/></svg>', safe: false },
    { key: 'af_auth', get label() { return window.I18n?.t('settings.storageAuth') || 'ÄÄƒng nháº­p'; }, get desc() { return window.I18n?.t('settings.storageAuthDesc') || 'Token xÃ¡c thá»±c vÃ  thÃ´ng tin tÃ i khoáº£n'; }, icon: 'purple', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', safe: false },
    { key: 'af_entitlements', get label() { return window.I18n?.t('settings.storageEntitlements') || 'Quyá»n sá»­ dá»¥ng'; }, get desc() { return window.I18n?.t('settings.storageEntitlementsDesc') || 'Plan, features, quota (cache tá»« server)'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', safe: true },
    { key: 'af_tasks', label: 'Tasks', get desc() { return window.I18n?.t('settings.storageTasksDesc') || 'Danh sÃ¡ch cÃ¡c task Ä‘Ã£ táº¡o (tÃªn, prompt, cÃ i Ä‘áº·t)'; }, icon: 'amber', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', safe: false },
    { key: 'af_workflows', label: 'Workflows', get desc() { return window.I18n?.t('settings.storageWorkflowsDesc') || 'Danh sÃ¡ch workflow (tÃªn, mÃ´ táº£, cÃ i Ä‘áº·t)'; }, icon: 'cyan', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>', safe: false },
    { key: 'af_nodes', label: 'Workflow Nodes', get desc() { return window.I18n?.t('settings.storageNodesDesc') || 'CÃ¡c node trong workflow (prompt, settings, ref images)'; }, icon: 'cyan', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>', safe: false },
    { key: 'af_edges', label: 'Workflow Edges', get desc() { return window.I18n?.t('settings.storageEdgesDesc') || 'Káº¿t ná»‘i giá»¯a cÃ¡c node trong workflow'; }, icon: 'cyan', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>', safe: true },
    { key: 'af_user_prompts', label: 'Prompt Snippets', get desc() { return window.I18n?.t('settings.storageSnippetsDesc') || 'CÃ¡c Ä‘oáº¡n prompt Ä‘Ã£ lÆ°u Ä‘á»ƒ tÃ¡i sá»­ dá»¥ng'; }, icon: 'blue', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', safe: false },
    { key: 'toby_gentab_state', label: 'GenTab State', get desc() { return window.I18n?.t('settings.storageGenTabDesc') || 'Tráº¡ng thÃ¡i UI tab Generate (gen type, model, ratio, prompt)'; }, icon: 'purple', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>', safe: false },
    { key: 'presets', label: 'Presets (legacy)', get desc() { return 'Key cÅ©, sáº½ migrate sang toby_gentab_state'; }, icon: 'gray', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>', safe: true },
    { key: 'af_history', get label() { return window.I18n?.t('settings.storageHistory') || 'Lá»‹ch sá»­ táº¡o'; }, get desc() { return window.I18n?.t('settings.storageHistoryDesc') || 'Lá»‹ch sá»­ cÃ¡c láº§n táº¡o áº£nh/video (prompt, thá»i gian)'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', safe: true },
    { key: 'af_angles_results', get label() { return window.I18n?.t('settings.storageAnglesResults') || 'Káº¿t quáº£ Angles'; }, get desc() { return window.I18n?.t('settings.storageAnglesDesc') || 'áº¢nh Ä‘Ã£ táº¡o tá»« tÃ­nh nÄƒng Angles (thumbnail, prompt)'; }, icon: 'rose', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>', safe: true },
    { key: 'af_effects_results', get label() { return window.I18n?.t('settings.storageEffectsResults') || 'Káº¿t quáº£ Effects'; }, get desc() { return window.I18n?.t('settings.storageEffectsDesc') || 'áº¢nh Ä‘Ã£ táº¡o tá»« tÃ­nh nÄƒng Effects (50 má»¥c gáº§n nháº¥t)'; }, icon: 'rose', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', safe: true },
    { key: 'af_addon_prompts', get label() { return window.I18n?.t('settings.storageAddonPrompts') || 'Addon Prompts'; }, get desc() { return window.I18n?.t('settings.storageAddonPromptsDesc') || 'Prompts má»Ÿ rá»™ng (cache tá»« server, dÃ¹ng trong tab Prompts)'; }, icon: 'blue', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>', safe: true },
    { key: 'af_projects', get label() { return window.I18n?.t('settings.storageProjects') || 'Projects'; }, get desc() { return window.I18n?.t('settings.storageProjectsDesc') || 'Danh sÃ¡ch project Flow (tÃªn, ID, metadata)'; }, icon: 'cyan', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', safe: false },
    { key: 'af_chatgpt_config', get label() { return window.I18n?.t('settings.storageChatGPTConfig') || 'ChatGPT Config'; }, get desc() { return window.I18n?.t('settings.storageChatGPTConfigDesc') || 'Cache cáº¥u hÃ¬nh ChatGPT (TTL 1 giá», tá»± refresh)'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', safe: true },
    { key: 'af_grok_config', get label() { return window.I18n?.t('settings.storageGrokConfig') || 'Grok Config'; }, get desc() { return window.I18n?.t('settings.storageGrokConfigDesc') || 'Cache cáº¥u hÃ¬nh Grok (TTL 1 giá», tá»± refresh)'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', safe: true },
    { key: 'af_daily_stats', get label() { return window.I18n?.t('settings.storageDailyStats') || 'Thá»‘ng kÃª hÃ ng ngÃ y'; }, get desc() { return window.I18n?.t('settings.storageDailyStatsDesc') || 'Sá»‘ lÆ°á»£t táº¡o theo ngÃ y (dÃ¹ng cho biá»ƒu Ä‘á»“ usage)'; }, icon: 'amber', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>', safe: true },
    { key: 'af_local_usage', get label() { return window.I18n?.t('settings.storageLocalUsage') || 'Local Usage'; }, get desc() { return window.I18n?.t('settings.storageLocalUsageDesc') || 'Bá»™ Ä‘áº¿m usage cho ngÆ°á»i dÃ¹ng áº©n danh (chÆ°a Ä‘Äƒng nháº­p)'; }, icon: 'amber', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', safe: true },
    // Server cache data
    { key: 'af_system_settings', label: 'System Settings', get desc() { return 'Cache cÃ i Ä‘áº·t há»‡ thá»‘ng tá»« server (timeout, feature flags)'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', safe: true },
    { key: 'toby_provider_configs', label: 'Provider DOM Selectors', get desc() { return 'Cache DOM selectors cho ChatGPT/Grok/Flow tá»« server'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', safe: true },
    { key: 'toby_provider_api_configs', label: 'Provider API Configs', get desc() { return 'Cache API config (ratios, resolutions, error patterns) tá»« server'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', safe: true },
    { key: 'toby_provider_models', label: 'AI Models', get desc() { return 'Cache danh sÃ¡ch AI models tá»« server'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', safe: true },
    // i18n cache (per locale)
    { key: 'toby_i18n_en', label: 'i18n English', get desc() { return 'Cache báº£n dá»‹ch tiáº¿ng Anh tá»« server'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', safe: true },
    { key: 'toby_i18n_vi', label: 'i18n Tiáº¿ng Viá»‡t', get desc() { return 'Cache báº£n dá»‹ch tiáº¿ng Viá»‡t tá»« server'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', safe: true },
    { key: 'toby_i18n_ja', label: 'i18n æ—¥æœ¬èªž', get desc() { return 'Cache báº£n dá»‹ch tiáº¿ng Nháº­t tá»« server'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', safe: true },
    { key: 'toby_i18n_th', label: 'i18n à¸ à¸²à¸©à¸²à¹„à¸—à¸¢', get desc() { return 'Cache báº£n dá»‹ch tiáº¿ng ThÃ¡i tá»« server'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', safe: true },
  ];

  // IndexedDB store definitions
  const IDB_STORE_DEFS = [
    { store: 'pending_uploads', get label() { return window.I18n?.t('storage.pendingUploads') || 'File chá» upload'; }, get desc() { return window.I18n?.t('settings.storagePendingDesc') || 'áº¢nh local chá» upload lÃªn Flow (full blob)'; }, icon: 'amber', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>', safe: true },
    { store: 'lightweight_pending', get label() { return window.I18n?.t('storage.lightweightPending') || 'File chá» upload (nháº¹)'; }, get desc() { return window.I18n?.t('settings.storageLightweightDesc') || 'Chá»‰ lÆ°u thumbnail (â‰¤50KB), khÃ´ng lÆ°u full blob'; }, icon: 'green', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/></svg>', safe: true },
    { store: 'uploaded_cache', get label() { return window.I18n?.t('storage.uploadedCache') || 'Cache file Ä‘Ã£ upload'; }, get desc() { return window.I18n?.t('settings.storageUploadedCacheDesc') || 'LÆ°u file Ä‘á»ƒ re-upload náº¿u tile máº¥t trÃªn Flow'; }, icon: 'blue', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', safe: true },
    { store: 'albums', label: 'Albums', get desc() { return window.I18n?.t('settings.storageAlbumsDesc') || 'Dá»¯ liá»‡u album áº£nh (tÃªn, danh sÃ¡ch áº£nh)'; }, icon: 'purple', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', safe: false },
    { store: 'album_images', get label() { return window.I18n?.t('storage.albumImages') || 'áº¢nh trong Albums'; }, get desc() { return window.I18n?.t('settings.storageAlbumImagesDesc') || 'Metadata áº£nh (tÃªn @mention, file_id, thumbnail URL)'; }, icon: 'purple', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>', safe: false },
    { store: 'image_blobs', get label() { return window.I18n?.t('storage.imageBlobs') || 'Blob áº£nh'; }, get desc() { return window.I18n?.t('settings.storageImageBlobsDesc') || 'Thumbnail blob (â‰¤50KB WebP) cho album images'; }, icon: 'rose', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5.5 8.5L9 12l-3.5 3.5L2 12l3.5-3.5z"/><path d="M12 2l3.5 3.5L12 9 8.5 5.5 12 2z"/><path d="M18.5 8.5L22 12l-3.5 3.5L15 12l3.5-3.5z"/><path d="M12 15l3.5 3.5L12 22l-3.5-3.5L12 15z"/></svg>', safe: true },
  ];

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function estimateSize(data) {
    if (data === undefined || data === null) return 0;
    try {
      const json = typeof data === 'string' ? data : JSON.stringify(data);
      return new Blob([json]).size;
    } catch { return 0; }
  }

  function countItems(data) {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object') return Object.keys(data).length;
    return 1;
  }

  function renderStorageCard(def, size, count, onDelete) {
    const card = document.createElement('div');
    card.className = 'storage-card';

    const iconClass = `storage-card-icon icon-${def.icon}`;
    const countLabel = count > 0 ? `<span class="storage-card-count">${count}</span>` : '';
    const sizeText = formatBytes(size);

    card.innerHTML = `
      <div class="${iconClass}">${def.iconSvg}</div>
      <div class="storage-card-body">
        <div class="storage-card-title">${def.label} ${countLabel}</div>
        <div class="storage-card-desc">${def.desc}</div>
      </div>
      <div class="storage-card-meta">
        <span class="storage-card-size">${sizeText}</span>
      </div>
      <button class="storage-card-delete" title="${window.I18n?.t('common.delete') || 'XÃ³a'} ${def.label}">${TRASH_ICON}</button>
    `;

    card.querySelector('.storage-card-delete').addEventListener('click', () => onDelete(def, card));
    return card;
  }

  async function scanChromeStorage() {
    const container = document.getElementById('chromeStorageCards');
    if (!container) return 0;
    container.innerHTML = '';

    const allData = await chrome.storage.local.get(null);
    let totalSize = 0;

    for (const def of CHROME_STORAGE_DEFS) {
      const data = allData[def.key];
      const size = estimateSize(data);
      const count = countItems(data);
      totalSize += size;

      const card = renderStorageCard(def, size, count, async (d, cardEl) => {
        const deleteLabel = window.I18n?.t('common.delete') || 'XÃ³a';
        const cancelLabel = window.I18n?.t('common.cancel') || 'Há»§y';
        const warning = d.safe
          ? `${deleteLabel} "${d.label}"?\n\n${window.I18n?.t('storage.safeDeleteWarning', { desc: d.desc }) || `Dá»¯ liá»‡u nÃ y sáº½ bá»‹ xÃ³a vÄ©nh viá»…n. ${d.desc}`}`
          : `${deleteLabel} "${d.label}"?\n\n${window.I18n?.t('storage.unsafeDeleteWarning', { desc: d.desc }) || `Cáº¢NH BÃO: Dá»¯ liá»‡u quan trá»ng! ${d.desc}.\nKhÃ´ng thá»ƒ khÃ´i phá»¥c sau khi xÃ³a.`}`;

        const confirmed = window.customDialog
          ? await window.customDialog.confirm(warning, { title: `${deleteLabel} ${d.label}`, type: d.safe ? 'warning' : 'error', confirmText: deleteLabel, cancelText: cancelLabel })
          : confirm(warning);

        if (confirmed) {
          await chrome.storage.local.remove(d.key);
          cardEl.style.opacity = '0.3';
          cardEl.style.pointerEvents = 'none';
          setTimeout(() => scanAllStorage(), 500);
        }
      });
      container.appendChild(card);
    }

    // Scan unknown keys (khÃ´ng náº±m trong CHROME_STORAGE_DEFS)
    const knownKeys = new Set(CHROME_STORAGE_DEFS.map(d => d.key));
    const unknownKeys = Object.keys(allData).filter(k => !knownKeys.has(k));
    if (unknownKeys.length > 0) {
      let unknownTotal = 0;
      const unknownDetails = [];
      for (const key of unknownKeys) {
        const size = estimateSize(allData[key]);
        unknownTotal += size;
        totalSize += size;
        if (size > 1024) unknownDetails.push(`${key}: ${formatBytes(size)}`);
      }
      if (unknownTotal > 0) {
        const card = document.createElement('div');
        card.className = 'storage-card';
        card.innerHTML = `
          <div class="storage-card-icon icon-red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div class="storage-card-body">
            <div class="storage-card-title">${window.I18n?.t('settings.storageOther') || 'Dá»¯ liá»‡u khÃ¡c'} <span class="storage-card-count">${unknownKeys.length} keys</span></div>
            <div class="storage-card-desc" style="font-size:10px;max-height:60px;overflow:auto;">${unknownDetails.join('<br>') || (window.I18n?.t('settings.storageOtherDesc') || 'Cache, locale, state...')}</div>
          </div>
          <div class="storage-card-meta">
            <span class="storage-card-size" style="${unknownTotal > 1048576 ? 'color:#ef4444;font-weight:600;' : ''}">${formatBytes(unknownTotal)}</span>
          </div>
          <button class="storage-card-delete" title="${window.I18n?.t('settings.storageOtherDeleteTitle') || 'XÃ³a táº¥t cáº£ dá»¯ liá»‡u khÃ¡c'}">${TRASH_ICON}</button>
        `;
        card.querySelector('.storage-card-delete').addEventListener('click', async () => {
          const deleteLabel = window.I18n?.t('common.delete') || 'XÃ³a';
          const otherLabel = window.I18n?.t('settings.storageOther') || 'Dá»¯ liá»‡u khÃ¡c';
          const confirmMsg = (window.I18n?.t('settings.storageOtherConfirm', { count: unknownKeys.length, size: formatBytes(unknownTotal) })
            || `XÃ³a ${unknownKeys.length} keys (${formatBytes(unknownTotal)})?`)
            + `\n\n${unknownKeys.slice(0, 10).join(', ')}${unknownKeys.length > 10 ? '...' : ''}`;
          const confirmed = window.customDialog
            ? await window.customDialog.confirm(confirmMsg, { title: `${deleteLabel} ${otherLabel}`, type: 'warning' })
            : confirm(confirmMsg);
          if (confirmed) {
            await chrome.storage.local.remove(unknownKeys);
            setTimeout(() => scanAllStorage(), 500);
          }
        });
        container.appendChild(card);
      }
    }

    document.getElementById('chromeStorageTotal').textContent = formatBytes(totalSize);
    return totalSize;
  }

  async function scanIndexedDB() {
    const container = document.getElementById('indexedDBCards');
    if (!container) return { totalSize: 0, pendingCount: 0 };
    container.innerHTML = '';

    let totalSize = 0;
    let pendingCount = 0;
    let db;

    try {
      db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('autoflow_pro');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      container.innerHTML = `<div class="storage-card-empty">${window.I18n?.t('storage.idbNotInitialized') || 'IndexedDB chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o'}</div>`;
      document.getElementById('indexedDBTotal').textContent = '0 B';
      return { totalSize: 0, pendingCount: 0 };
    }

    const storeNames = Array.from(db.objectStoreNames);

    for (const def of IDB_STORE_DEFS) {
      if (!storeNames.includes(def.store)) {
        const card = renderStorageCard(def, 0, 0, () => {});
        container.appendChild(card);
        continue;
      }

      try {
        const { size, count } = await new Promise((resolve, reject) => {
          const tx = db.transaction(def.store, 'readonly');
          const store = tx.objectStore(def.store);
          const countReq = store.count();
          const allReq = store.getAll();

          allReq.onsuccess = () => {
            const items = allReq.result || [];
            let storeSize = 0;
            for (const item of items) {
              storeSize += estimateSize(item);
            }
            resolve({ size: storeSize, count: countReq.result || items.length });
          };
          allReq.onerror = () => resolve({ size: 0, count: 0 });
          countReq.onerror = () => {};
        });

        totalSize += size;

        // Track pending uploads
        if (def.store === 'pending_uploads' || def.store === 'lightweight_pending') {
          pendingCount += count;
        }

        const card = renderStorageCard(def, size, count, async (d, cardEl) => {
          const deleteLabel = window.I18n?.t('common.delete') || 'XÃ³a';
          const cancelLabel = window.I18n?.t('common.cancel') || 'Há»§y';
          const warning = d.safe
            ? `${deleteLabel} "${d.label}"?\n\n${window.I18n?.t('storage.safeDeleteWarning', { desc: d.desc }) || `Dá»¯ liá»‡u nÃ y sáº½ bá»‹ xÃ³a vÄ©nh viá»…n. ${d.desc}`}`
            : `${deleteLabel} "${d.label}"?\n\n${window.I18n?.t('storage.unsafeDeleteWarning', { desc: d.desc }) || `Cáº¢NH BÃO: Dá»¯ liá»‡u quan trá»ng! ${d.desc}.\nKhÃ´ng thá»ƒ khÃ´i phá»¥c sau khi xÃ³a.`}`;

          const confirmed = window.customDialog
            ? await window.customDialog.confirm(warning, { title: `${deleteLabel} ${d.label}`, type: d.safe ? 'warning' : 'error', confirmText: deleteLabel, cancelText: cancelLabel })
            : confirm(warning);

          if (confirmed) {
            try {
              // Re-open DB vÃ¬ db gá»‘c Ä‘Ã£ close sau scan
              const freshDb = await new Promise((resolve, reject) => {
                const req = indexedDB.open('autoflow_pro');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
              });
              const clearTx = freshDb.transaction(d.store, 'readwrite');
              const clearStore = clearTx.objectStore(d.store);
              clearStore.clear();
              await new Promise((resolve, reject) => { clearTx.oncomplete = resolve; clearTx.onerror = reject; });
              freshDb.close();
              cardEl.style.opacity = '0.3';
              cardEl.style.pointerEvents = 'none';
              setTimeout(() => scanAllStorage(), 500);
            } catch (e) {
              console.error('[Storage] Clear failed:', e);
            }
          }
        });
        container.appendChild(card);
      } catch {
        const card = renderStorageCard(def, 0, 0, () => {});
        container.appendChild(card);
      }
    }

    db.close();
    document.getElementById('indexedDBTotal').textContent = formatBytes(totalSize);
    return { totalSize, pendingCount };
  }

  // ===== Daily Stats =====
  async function loadDailyStats() {
    const today = new Date().toISOString().slice(0, 10);
    const dateEl = document.getElementById('dailyStatsDate');
    if (dateEl) {
      const d = new Date();
      dateEl.textContent = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    try {
      const result = await chrome.storage.local.get(['af_entitlements', 'af_local_usage', 'af_daily_stats']);
      const entitlements = result.af_entitlements || {};
      const localUsage = result.af_local_usage || {};
      const dailyStats = result.af_daily_stats || {};
      const features = entitlements.entitlements || {};

      // Logged-in: usage from server cache; Anonymous: from local usage
      const isLoggedIn = !!(entitlements.plan && entitlements.plan.slug && entitlements.plan.slug !== 'trial');

      // Counts from daily stats (local tracking for all users)
      let failCount = 0, submitCount = 0, dailyTaskRun = 0, dailyWorkflowRun = 0;
      if (dailyStats._date === today) {
        // Total prompts = Flow + ChatGPT + Gemini + Grok (4 providers)
        const flowTotal = dailyStats.flow_prompt_total || 0;
        const chatgptTotal = dailyStats.chatgpt_prompt_total || 0;
        const geminiTotal = dailyStats.gemini_prompt_total || 0;
        const grokTotal = dailyStats.grok_prompt_total || 0;
        submitCount = flowTotal + chatgptTotal + geminiTotal + grokTotal;
        // Total failures = Flow + ChatGPT + Gemini + Grok
        const flowFail = dailyStats.flow_fail || 0;
        const chatgptFail = dailyStats.chatgpt_fail || 0;
        const geminiFail = dailyStats.gemini_fail || 0;
        const grokFail = dailyStats.grok_fail || 0;
        failCount = flowFail + chatgptFail + geminiFail + grokFail;
        // Other stats
        dailyTaskRun = dailyStats.task_run || 0;
        dailyWorkflowRun = dailyStats.workflow_run || 0;
      }

      let taskUsed = 0, workflowUsed = 0;

      // Task: prefer server usage_today, fallback to dailyStats (for premium/unlimited)
      if (isLoggedIn && features.tasks_run_max && features.tasks_run_max.usage_today !== undefined) {
        taskUsed = features.tasks_run_max.usage_today;
      } else if (isLoggedIn) {
        // Premium users without quota tracking: use local dailyStats
        taskUsed = dailyTaskRun;
      } else {
        taskUsed = localUsage.tasks_run_max || 0;
      }

      // Workflow: prefer server usage_today, fallback to dailyStats (for premium/unlimited)
      if (isLoggedIn && features.workflows_run_max && features.workflows_run_max.usage_today !== undefined) {
        workflowUsed = features.workflows_run_max.usage_today;
      } else if (isLoggedIn) {
        // Premium users without quota tracking: use local dailyStats
        workflowUsed = dailyWorkflowRun;
      } else {
        workflowUsed = localUsage.workflows_run_max || 0;
      }

      // GP-6.1: Global Prompt Quota (prompt_submit_max)
      let globalUsed = 0, globalLimit = 0;
      if (features.prompt_submit_max) {
        globalUsed = features.prompt_submit_max.usage_today || features.prompt_submit_max.usage || 0;
        const limitVal = features.prompt_submit_max.value;
        globalLimit = (limitVal === '-1' || limitVal === 'unlimited') ? 0 : (parseInt(limitVal) || 0);
      }
      // Display logic: logged-in + server has usage_today â†’ prefer server; else fallback local
      const hasServerPromptUsage = isLoggedIn && features.prompt_submit_max && features.prompt_submit_max.usage_today !== undefined;
      const displayUsed = hasServerPromptUsage ? globalUsed : (globalLimit > 0 ? globalUsed : submitCount);
      const displayLabel = globalLimit > 0 ? `${displayUsed}/${globalLimit}` : `${displayUsed}`;

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setVal('statPromptSubmit', displayLabel);
      setVal('statPromptFail', failCount);
      setVal('statTaskRun', taskUsed);
      setVal('statWorkflowRun', workflowUsed);
    } catch (err) {
      console.warn('[Settings] loadDailyStats error:', err);
    }
  }

  async function scanAllStorage() {
    const chromeSize = await scanChromeStorage();
    const idbResult = await scanIndexedDB();

    const totalSize = chromeSize + idbResult.totalSize;

    // Overview bar - tá»‰ lá»‡ dá»±a trÃªn dung lÆ°á»£ng extension (scale tá»± Ä‘á»™ng)
    document.getElementById('storageTotalUsed').textContent = formatBytes(totalSize);

    // Adaptive scale: bar luÃ´n hiá»ƒn thá»‹ Ä‘áº§y Ä‘á»§ tá»‰ lá»‡
    const fill = document.getElementById('storageTotalFill');
    if (fill) {
      // Scale: <1MB = xanh, 1-5MB = vÃ ng, >5MB = Ä‘á»
      let pct;
      if (totalSize < 1048576) {
        pct = (totalSize / 1048576) * 33; // <1MB = 0-33%
      } else if (totalSize < 5242880) {
        pct = 33 + ((totalSize - 1048576) / 4194304) * 34; // 1-5MB = 33-67%
      } else {
        pct = 67 + Math.min(((totalSize - 5242880) / 5242880) * 33, 33); // >5MB = 67-100%
      }
      fill.style.width = Math.max(pct, 2) + '%';
      fill.classList.remove('warn', 'heavy');
      if (totalSize > 5242880) fill.classList.add('heavy');
      else if (totalSize > 1048576) fill.classList.add('warn');
    }

    // Description
    const descEl = document.getElementById('storageTotalDesc');
    if (descEl) {
      const chromeLabel = formatBytes(chromeSize);
      const idbLabel = formatBytes(idbResult.totalSize);
      const chromeStorageText = window.I18n?.t('settings.chromeStorage') || 'Chrome Storage';
      descEl.textContent = `${chromeStorageText} ${chromeLabel} + IndexedDB ${idbLabel}`;
    }

    // Pending uploads indicator
    const pendingRow = document.getElementById('storagePendingRow');
    const pendingText = document.getElementById('storagePendingText');
    if (pendingRow && pendingText) {
      if (idbResult.pendingCount > 0) {
        pendingRow.classList.remove('hidden');
        pendingRow.classList.add('has-pending');
        pendingText.textContent = window.I18n?.t('storage.pendingUploadText', { count: idbResult.pendingCount }) || `${idbResult.pendingCount} file Ä‘ang chá» upload lÃªn Google Flow`;
      } else {
        pendingRow.classList.add('hidden');
        pendingRow.classList.remove('has-pending');
      }
    }
  }

  function bindStorageEvents() {
    document.getElementById('storageRefreshBtn')?.addEventListener('click', scanAllStorage);

    // Chrome Storage collapsible toggle
    document.getElementById('chromeStorageToggle')?.addEventListener('click', () => {
      const section = document.querySelector('.s-section-collapsible');
      const content = document.getElementById('chromeStorageCards');
      if (section && content) {
        section.classList.toggle('open');
        content.classList.toggle('hidden');
      }
    });

    // Cleanup button â€” trim base64 thumbnails + stale data
    document.getElementById('storageCleanupBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('storageCleanupBtn');
      btn.disabled = true;
      btn.querySelector('span').textContent = 'Äang dá»n dáº¹p...';

      let freed = 0;
      try {
        // 1. Trim presets thumbnailCache (base64 data URLs â†’ chá»‰ giá»¯ HTTP)
        const presetsResult = await new Promise(r => chrome.storage.local.get(['presets'], r));
        if (presetsResult.presets?.thumbnailCache) {
          const before = estimateSize(presetsResult.presets);
          const cleaned = { ...presetsResult.presets };
          const trimmedCache = {};
          for (const [k, v] of Object.entries(cleaned.thumbnailCache || {})) {
            if (typeof v === 'string' && !v.startsWith('data:')) trimmedCache[k] = v;
          }
          cleaned.thumbnailCache = trimmedCache;
          // Also remove fileNameCache from presets (session-only data)
          delete cleaned.fileNameCache;
          await new Promise(r => chrome.storage.local.set({ presets: cleaned }, r));
          freed += Math.max(0, before - estimateSize(cleaned));
        }

        // 2. Trim tasks thumbnails (base64 â†’ remove)
        const tasksResult = await new Promise(r => chrome.storage.local.get(['af_tasks'], r));
        if (tasksResult.af_tasks?.length > 0) {
          const before = estimateSize(tasksResult.af_tasks);
          const cleaned = tasksResult.af_tasks.map(task => {
            const t = { ...task };
            for (const field of ['ref_thumbnails', 'result_thumbnails']) {
              if (t[field] && typeof t[field] === 'object') {
                const rt = {};
                for (const [k, v] of Object.entries(t[field])) {
                  if (typeof v === 'string' && v.startsWith('data:') && v.length > 500) continue;
                  if (typeof v === 'object' && v?.thumbnail?.startsWith?.('data:') && v.thumbnail.length > 500) { rt[k] = { ...v, thumbnail: '' }; continue; }
                  rt[k] = v;
                }
                t[field] = rt;
              }
            }
            return t;
          });
          await new Promise(r => chrome.storage.local.set({ af_tasks: cleaned }, r));
          freed += Math.max(0, before - estimateSize(cleaned));
        }

        // 3. Trim history to last 50
        const histResult = await new Promise(r => chrome.storage.local.get(['af_history'], r));
        if (histResult.af_history?.length > 50) {
          const before = estimateSize(histResult.af_history);
          await new Promise(r => chrome.storage.local.set({ af_history: histResult.af_history.slice(-50) }, r));
          freed += Math.max(0, before - estimateSize(histResult.af_history.slice(-50)));
        }

        if (freed > 0) {
          const msg = `ÄÃ£ giáº£i phÃ³ng ${formatBytes(freed)}`;
          window.customDialog ? window.customDialog.alert(msg, { type: 'success', title: 'Dá»n dáº¹p thÃ nh cÃ´ng' }) : alert(msg);
        } else {
          window.customDialog ? window.customDialog.alert('KhÃ´ng cÃ³ dá»¯ liá»‡u thá»«a cáº§n dá»n', { type: 'info', title: 'Dá»n dáº¹p' }) : alert('KhÃ´ng cÃ³ dá»¯ liá»‡u thá»«a');
        }
      } catch (e) {
        console.error('[Storage] Cleanup failed:', e);
      }
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Dá»n dáº¹p dá»¯ liá»‡u thá»«a';
      scanAllStorage();
    });

    document.getElementById('storageClearAllBtn')?.addEventListener('click', async () => {
      const warning = window.I18n?.t('storage.clearAllWarning') || ('XÃ“A Táº¤T Cáº¢ Dá»® LIá»†U LOCAL?\n\n'
        + 'Sáº½ bá»‹ máº¥t:\n'
        + '\u2022 Táº¥t cáº£ Tasks vÃ  Workflows\n'
        + '\u2022 Prompt Snippets vÃ  Presets\n'
        + '\u2022 Albums vÃ  áº£nh Ä‘Ã£ lÆ°u\n'
        + '\u2022 Lá»‹ch sá»­ táº¡o áº£nh/video\n'
        + '\u2022 Cache file upload\n'
        + '\u2022 Káº¿t quáº£ Angles\n\n'
        + 'KHÃ”NG bá»‹ máº¥t:\n'
        + '\u2022 CÃ i Ä‘áº·t (settings)\n'
        + '\u2022 ThÃ´ng tin Ä‘Äƒng nháº­p\n'
        + '\u2022 Dá»¯ liá»‡u Ä‘Ã£ Ä‘á»“ng bá»™ lÃªn server\n\n'
        + 'HÃ nh Ä‘á»™ng nÃ y KHÃ”NG THá»‚ khÃ´i phá»¥c!');

      const deleteAllLabel = window.I18n?.t('common.deleteAll') || 'XÃ³a táº¥t cáº£';
      const cancelLabel = window.I18n?.t('common.cancel') || 'Há»§y';
      const confirmed = window.customDialog
        ? await window.customDialog.confirm(warning, { title: window.I18n?.t('storage.clearAllTitle') || 'XÃ³a táº¥t cáº£ dá»¯ liá»‡u', type: 'error', confirmText: deleteAllLabel, cancelText: cancelLabel })
        : confirm(warning);

      if (!confirmed) return;

      try {
        // Remove all af_* keys except settings and auth
        const allData = await chrome.storage.local.get(null);
        const keysToRemove = Object.keys(allData).filter(
          key => key.startsWith('af_') && key !== 'af_settings' && key !== 'af_auth'
        );
        if (keysToRemove.length > 0) {
          await chrome.storage.local.remove(keysToRemove);
        }

        // Delete IndexedDB
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase('autoflow_pro');
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        });

        if (window.customDialog) {
          window.customDialog.alert(window.I18n?.t('storage.clearAllSuccess') || 'ÄÃ£ xÃ³a táº¥t cáº£ dá»¯ liá»‡u local thÃ nh cÃ´ng!', { title: window.I18n?.t('common.success') || 'ThÃ nh cÃ´ng', type: 'success' });
        }
        scanAllStorage();
      } catch (e) {
        if (window.customDialog) {
          window.customDialog.alert((window.I18n?.t('common.error') || 'Lá»—i') + ': ' + e.message, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
        }
      }
    });
  }

  // ===== Telegram =====

  let _telegramOtpPollingInterval = null;
  let _telegramOtpCountdownInterval = null;
  let _telegramOtpExpiresAt = null;
  let _telegramUseCustomBot = false;

  /**
   * Táº£i tráº¡ng thÃ¡i liÃªn káº¿t Telegram, cáº­p nháº­t UI
   */
  async function initTelegramSection() {
    try {
      const result = await chrome.storage.local.get(['af_auth']);
      const auth = result.af_auth;
      if (!auth?.token) {
        _showTelegramState('not_linked');
        return;
      }

      // Gá»i API kiá»ƒm tra tráº¡ng thÃ¡i liÃªn káº¿t
      const resp = await _telegramApiCall('GET', 'telegram/link/status');

      if (resp?.success && resp.data?.linked) {
        const botTypeText = resp.data.bot_type === 'custom'
          ? (window.I18n?.t('settings.telegramBotCustom') || 'Bot riÃªng') + ' (Pro)'
          : (window.I18n?.t('settings.telegramBotShared') || 'Bot chung');
        _showTelegramState('linked', {
          username: resp.data.telegram_username || '--',
          botName: resp.data.bot_username ? `@${resp.data.bot_username}` : '@tobyflow_bot',
          botType: botTypeText,
          isCustomBot: resp.data.bot_type === 'custom'
        });
      } else {
        _showTelegramState('not_linked');
      }
    } catch (e) {
      console.warn('[Settings] Telegram status error:', e);
      _showTelegramState('not_linked');
    }
  }

  /**
   * Helper: Gá»i Telegram API
   */
  async function _telegramApiCall(method, endpoint, data = null) {
    const result = await chrome.storage.local.get(['af_auth']);
    const auth = result.af_auth;
    if (!auth?.token) return null;

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'apiRequest',
        method,
        endpoint,
        data,
        token: auth.token
      }, (r) => resolve(r));
    });
  }

  /**
   * Cáº­p nháº­t UI theo tráº¡ng thÃ¡i Telegram
   */
  function _showTelegramState(state, data = {}) {
    // áº¨n táº¥t cáº£ panels
    if (els.telegramNotLinked) els.telegramNotLinked.classList.add('hidden');
    if (els.telegramOtpDisplay) els.telegramOtpDisplay.classList.add('hidden');
    if (els.telegramLinked) els.telegramLinked.classList.add('hidden');

    // Dá»«ng polling/countdown náº¿u Ä‘ang cháº¡y
    if (state !== 'otp') {
      _stopTelegramOtpPolling();
    }

    if (state === 'linked') {
      if (els.telegramLinked) els.telegramLinked.classList.remove('hidden');
      if (els.telegramUsername) els.telegramUsername.textContent = data.username || '--';
      if (els.telegramLinkedBot) els.telegramLinkedBot.textContent = data.botName || '@tobyflow_bot';
      if (els.telegramBotType) els.telegramBotType.textContent = data.botType || (window.I18n?.t('settings.telegramBotShared') || 'Bot chung');
      if (els.telegramStatusBadge) {
        els.telegramStatusBadge.textContent = window.I18n?.t('settings.telegramStatusLinked') || 'ÄÃ£ liÃªn káº¿t';
        els.telegramStatusBadge.className = 's-section-badge telegram-status-linked';
      }
    } else if (state === 'otp') {
      if (els.telegramOtpDisplay) els.telegramOtpDisplay.classList.remove('hidden');
      if (els.telegramStatusBadge) {
        els.telegramStatusBadge.textContent = window.I18n?.t('settings.telegramLinking') || 'Äang liÃªn káº¿t...';
        els.telegramStatusBadge.className = 's-section-badge telegram-status-linking';
      }
    } else {
      // not_linked
      if (els.telegramNotLinked) els.telegramNotLinked.classList.remove('hidden');
      if (els.telegramStatusBadge) {
        els.telegramStatusBadge.textContent = window.I18n?.t('settings.telegramStatusNotLinked') || 'ChÆ°a liÃªn káº¿t';
        els.telegramStatusBadge.className = 's-section-badge telegram-status-not-linked';
      }
      // Reset bot option selection to shared (default)
      if (els.telegramOptionShared) els.telegramOptionShared.classList.add('telegram-bot-option--selected');
      if (els.telegramOptionCustom) els.telegramOptionCustom.classList.remove('telegram-bot-option--selected');
      if (els.telegramCustomBotSetup) els.telegramCustomBotSetup.classList.add('hidden');
      if (els.telegramCustomBotToken) els.telegramCustomBotToken.value = '';
      _telegramUseCustomBot = false;
    }
  }

  /**
   * Select Telegram bot option (shared or custom)
   */
  function selectTelegramBotOption(botType) {
    _telegramUseCustomBot = (botType === 'custom');

    // Update visual selection
    if (els.telegramOptionShared) {
      els.telegramOptionShared.classList.toggle('telegram-bot-option--selected', botType === 'shared');
    }
    if (els.telegramOptionCustom) {
      els.telegramOptionCustom.classList.toggle('telegram-bot-option--selected', botType === 'custom');
    }

    // Hiá»‡n/áº©n custom bot setup
    if (els.telegramCustomBotSetup) {
      els.telegramCustomBotSetup.classList.toggle('hidden', !_telegramUseCustomBot);
    }
  }

  /**
   * YÃªu cáº§u OTP Ä‘á»ƒ liÃªn káº¿t Telegram
   */
  async function handleTelegramLink() {
    try {
      // PATCHED: Offline mode — skip login check

      // Náº¿u dÃ¹ng custom bot, validate vÃ  setup trÆ°á»›c
      if (_telegramUseCustomBot) {
        const customToken = els.telegramCustomBotToken?.value?.trim();
        if (!customToken) {
          if (window.customDialog) {
            window.customDialog.alert(window.I18n?.t('settings.telegramMissingToken') || 'Vui lÃ²ng nháº­p bot token.', { title: window.I18n?.t('settings.telegramMissingTokenTitle') || 'Thiáº¿u token', type: 'warning' });
          }
          return;
        }

        // Validate vÃ  setup custom bot
        if (els.telegramLinkBtn) {
          els.telegramLinkBtn.disabled = true;
          els.telegramLinkBtn.innerHTML = '<span class="s-spinner-sm"></span> Äang thiáº¿t láº­p bot...';
        }

        const customResp = await _telegramApiCall('POST', 'telegram/custom-bot', { token: customToken });
        if (!customResp?.success) {
          const errMsg = customResp?.error?.message || (window.I18n?.t('settings.telegramCustomBotError') || 'KhÃ´ng thá»ƒ lÆ°u custom bot');
          if (window.customDialog) {
            window.customDialog.alert(errMsg, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
          }
          if (els.telegramLinkBtn) {
            els.telegramLinkBtn.disabled = false;
            els.telegramLinkBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>' + (window.I18n?.t('settings.linkTelegram') || 'LiÃªn káº¿t Telegram') + '</span>';
          }
          return;
        }

        // Custom bot Ä‘Ã£ setup thÃ nh cÃ´ng â†’ hiá»‡n tráº¡ng thÃ¡i linked ngay (khÃ´ng cáº§n OTP)
        const botUsername = customResp.data?.bot_username || 'Bot cá»§a báº¡n';
        _showTelegramState('linked');
        if (els.telegramBotName) els.telegramBotName.textContent = `@${botUsername}`;
        if (els.telegramLinkBtn) {
          els.telegramLinkBtn.disabled = false;
          els.telegramLinkBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>' + (window.I18n?.t('settings.linkTelegram') || 'LiÃªn káº¿t Telegram') + '</span>';
        }
        if (window.customDialog) {
          const linkedMsg = (window.I18n?.t('settings.telegramLinkedWithBot') || 'ÄÃ£ liÃªn káº¿t vá»›i bot @{botUsername}. HÃ£y gá»­i tin nháº¯n báº¥t ká»³ Ä‘áº¿n bot Ä‘á»ƒ kÃ­ch hoáº¡t.').replace('{botUsername}', botUsername);
          window.customDialog.alert(linkedMsg, { title: window.I18n?.t('settings.telegramLinkedSuccessTitle') || 'ThÃ nh cÃ´ng', type: 'success' });
        }
        return; // KhÃ´ng cáº§n tiáº¿p tá»¥c flow OTP
      }

      // Disable nÃºt trong khi gá»i API
      if (els.telegramLinkBtn) {
        els.telegramLinkBtn.disabled = true;
        els.telegramLinkBtn.innerHTML = '<span class="s-spinner-sm"></span> ' + (window.I18n?.t('settings.telegramGeneratingCode') || 'Äang táº¡o mÃ£...');
      }

      const resp = await _telegramApiCall('POST', 'telegram/link/generate');

      if (resp?.success && resp.data?.code) {
        const code = resp.data.code;
        const botUrl = resp.data.bot_url || 'https://t.me/tobyflow_bot';
        const botUsername = botUrl.replace('https://t.me/', '@');

        // Hiá»‡n OTP state
        _showTelegramState('otp');

        // Set OTP code
        if (els.telegramOtpCode) els.telegramOtpCode.textContent = code;
        if (els.telegramOtpCodeSmall) els.telegramOtpCodeSmall.textContent = code;

        // Set bot name & link
        if (els.telegramBotName) els.telegramBotName.textContent = botUsername;
        if (els.telegramBotLink) els.telegramBotLink.href = botUrl;

        // Start countdown (5 minutes = 300 seconds)
        _telegramOtpExpiresAt = Date.now() + (resp.data.expires_in || 300) * 1000;
        _startTelegramOtpCountdown();

        // Start polling Ä‘á»ƒ kiá»ƒm tra link thÃ nh cÃ´ng
        _startTelegramOtpPolling();

      } else {
        const errMsg = resp?.error?.message || (window.I18n?.t('settings.telegramOtpError') || 'KhÃ´ng thá»ƒ táº¡o mÃ£ OTP');
        if (window.customDialog) {
          window.customDialog.alert(errMsg, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
        }
      }
    } catch (e) {
      console.error('[Settings] Telegram link error:', e);
      if (window.customDialog) {
        window.customDialog.alert((window.I18n?.t('settings.telegramConnectionError') || 'Lá»—i káº¿t ná»‘i') + ': ' + e.message, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
      }
    } finally {
      if (els.telegramLinkBtn) {
        els.telegramLinkBtn.disabled = false;
        els.telegramLinkBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>' + (window.I18n?.t('settings.linkTelegram') || 'LiÃªn káº¿t Telegram') + '</span>';
      }
    }
  }

  /**
   * Start OTP countdown timer
   */
  function _startTelegramOtpCountdown() {
    _stopTelegramOtpCountdown();

    const updateCountdown = () => {
      if (!_telegramOtpExpiresAt) return;
      const remaining = Math.max(0, Math.floor((_telegramOtpExpiresAt - Date.now()) / 1000));
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;

      if (els.telegramOtpCountdown) {
        els.telegramOtpCountdown.textContent = `CÃ²n ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      if (remaining <= 0) {
        _stopTelegramOtpPolling();
        _showTelegramState('not_linked');
        if (window.customDialog) {
          window.customDialog.alert('MÃ£ OTP Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng táº¡o mÃ£ má»›i.', { title: 'Háº¿t háº¡n', type: 'warning' });
        }
      }
    };

    updateCountdown();
    _telegramOtpCountdownInterval = setInterval(updateCountdown, 1000);
  }

  function _stopTelegramOtpCountdown() {
    if (_telegramOtpCountdownInterval) {
      clearInterval(_telegramOtpCountdownInterval);
      _telegramOtpCountdownInterval = null;
    }
    _telegramOtpExpiresAt = null;
  }

  /**
   * Start polling Ä‘á»ƒ kiá»ƒm tra link thÃ nh cÃ´ng
   */
  function _startTelegramOtpPolling() {
    _stopTelegramOtpPolling();

    const pollStatus = async () => {
      try {
        const resp = await _telegramApiCall('GET', 'telegram/link/status');
        if (resp?.success && resp.data?.linked) {
          // Link thÃ nh cÃ´ng!
          _stopTelegramOtpPolling();
          const botTypeText = resp.data.bot_type === 'custom'
            ? (window.I18n?.t('settings.telegramBotCustom') || 'Bot riÃªng') + ' (Pro)'
            : (window.I18n?.t('settings.telegramBotShared') || 'Bot chung');
          _showTelegramState('linked', {
            username: resp.data.telegram_username || '--',
            botName: resp.data.bot_username ? `@${resp.data.bot_username}` : '@tobyflow_bot',
            botType: botTypeText,
            isCustomBot: resp.data.bot_type === 'custom'
          });
          if (window.customDialog) {
            window.customDialog.alert(window.I18n?.t('settings.telegramLinkSuccess') || 'ÄÃ£ liÃªn káº¿t Telegram thÃ nh cÃ´ng!', { title: window.I18n?.t('settings.telegramLinkedSuccessTitle') || 'ThÃ nh cÃ´ng', type: 'success' });
          }
        }
      } catch (e) {
        console.warn('[Settings] Telegram polling error:', e);
      }
    };

    // Poll má»—i 3 giÃ¢y
    _telegramOtpPollingInterval = setInterval(pollStatus, 3000);
  }

  function _stopTelegramOtpPolling() {
    if (_telegramOtpPollingInterval) {
      clearInterval(_telegramOtpPollingInterval);
      _telegramOtpPollingInterval = null;
    }
    _stopTelegramOtpCountdown();
  }

  /**
   * Cancel OTP vÃ  quay vá» tráº¡ng thÃ¡i ban Ä‘áº§u
   */
  function handleTelegramOtpCancel() {
    _stopTelegramOtpPolling();
    _showTelegramState('not_linked');
  }

  /**
   * Sao chÃ©p OTP code vÃ o clipboard
   */
  async function handleTelegramOtpCopy() {
    const code = els.telegramOtpCode?.textContent;
    if (!code || code === '------') return;
    try {
      await navigator.clipboard.writeText(code);
      if (els.telegramOtpCopyBtn) {
        const originalTitle = els.telegramOtpCopyBtn.title;
        els.telegramOtpCopyBtn.title = window.I18n?.t('common.copied') || 'ÄÃ£ sao chÃ©p!';
        setTimeout(() => {
          if (els.telegramOtpCopyBtn) els.telegramOtpCopyBtn.title = originalTitle || (window.I18n?.t('settings.copy') || 'Sao chÃ©p');
        }, 2000);
      }
    } catch (e) {
      console.warn('[Settings] Copy OTP failed:', e);
    }
  }

  /**
   * Há»§y liÃªn káº¿t Telegram
   */
  async function handleTelegramUnlink() {
    const shouldUnlink = window.customDialog
      ? await window.customDialog.confirm('Há»§y liÃªn káº¿t Telegram? Báº¡n sáº½ khÃ´ng nháº­n Ä‘Æ°á»£c lá»‡nh tá»« bot ná»¯a.', { title: 'Há»§y liÃªn káº¿t Telegram', type: 'warning', confirmText: 'Há»§y liÃªn káº¿t', cancelText: 'Giá»¯ láº¡i' })
      : confirm('Há»§y liÃªn káº¿t Telegram?');
    if (!shouldUnlink) return;

    try {
      const resp = await _telegramApiCall('POST', 'telegram/unlink');

      if (resp?.success) {
        _showTelegramState('not_linked');
        if (window.customDialog) {
          window.customDialog.alert(window.I18n?.t('settings.telegramUnlinkSuccess') || 'ÄÃ£ há»§y liÃªn káº¿t Telegram thÃ nh cÃ´ng.', { title: window.I18n?.t('common.success') || 'ThÃ nh cÃ´ng', type: 'success' });
        }
      } else {
        const errMsg = resp?.error?.message || (window.I18n?.t('settings.telegramUnlinkError') || 'KhÃ´ng thá»ƒ há»§y liÃªn káº¿t');
        if (window.customDialog) {
          window.customDialog.alert(errMsg, { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
        }
      }
    } catch (e) {
      console.error('[Settings] Telegram unlink error:', e);
    }
  }

  // ===== Init =====
  // ===== Account Linking — removed (offline mode) =====
  async function initAccountLinking() {
    const section = document.getElementById('accountLinkingSection');
    if (section) section.style.display = 'none';
      const user = auth.user;
      const isGoogleLinked = !!user?.google_id;

      if (isGoogleLinked) {
        googleLinkStatus.textContent = window.I18n?.t('settings.telegramStatusLinked') || 'ÄÃ£ liÃªn káº¿t';
        googleLinkStatus.style.color = '#22c55e';
        googleLinkBtn?.classList.add('hidden');
        googleUnlinkBtn?.classList.remove('hidden');
      } else {
        googleLinkStatus.textContent = window.I18n?.t('settings.notLinked') || 'ChÆ°a liÃªn káº¿t';
        googleLinkStatus.style.color = '';
        googleLinkBtn?.classList.remove('hidden');
        googleUnlinkBtn?.classList.add('hidden');
      }

      // Link Google â€” gá»i GET auth/google/link-url (cáº§n auth token) Ä‘á»ƒ láº¥y OAuth URL
      // Backend nhÃºng user_id vÃ o state param, callback sáº½ link google_id vÃ o Ä‘Ãºng user
      googleLinkBtn?.addEventListener('click', async () => {
        googleLinkBtn.disabled = true;
        googleLinkBtn.textContent = window.I18n?.t('settings.googleLinking') || 'Äang liÃªn káº¿t...';
        try {
          // Láº¥y OAuth URL dÃ nh riÃªng cho link flow (cÃ³ chá»©a state vá»›i user_id)
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              action: 'apiRequest',
              method: 'GET',
              endpoint: 'auth/google/link-url',
              token: auth.token
            }, (resp) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (resp?.success) resolve(resp.data);
              else reject(new Error(resp?.error?.message || (window.I18n?.t('settings.googleLinkUrlError') || 'Lá»—i láº¥y URL liÃªn káº¿t Google')));
            });
          });

          const url = response?.url || response;
          if (url && typeof url === 'string' && url.startsWith('http')) {
            // Má»Ÿ tab má»›i Ä‘á»ƒ user xÃ¡c thá»±c vá»›i Google
            // Sau khi xÃ¡c thá»±c, backend callback sáº½ link google_id vÃ  redirect vá» /auth/google/success?linked=1
            chrome.tabs.create({ url });
          } else {
            throw new Error(window.I18n?.t('settings.googleInvalidUrl') || 'KhÃ´ng nháº­n Ä‘Æ°á»£c URL liÃªn káº¿t Google há»£p lá»‡.');
          }
        } catch (e) {
          if (window.customDialog) {
            window.customDialog.alert(e.message || (window.I18n?.t('settings.googleLinkError') || 'KhÃ´ng thá»ƒ liÃªn káº¿t Google.'), { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
          }
        } finally {
          googleLinkBtn.disabled = false;
          googleLinkBtn.textContent = window.I18n?.t('settings.linkGoogle') || 'LiÃªn káº¿t';
        }
      });

      // Unlink Google
      googleUnlinkBtn?.addEventListener('click', async () => {
        googleUnlinkBtn.disabled = true;
        googleUnlinkBtn.textContent = window.I18n?.t('settings.googleUnlinking') || 'Äang há»§y...';
        try {
          await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              action: 'apiRequest',
              method: 'POST',
              endpoint: 'auth/google/unlink',
              token: auth.token
            }, (resp) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (resp?.success) resolve(resp.data);
              else reject(new Error(resp?.error?.message || (window.I18n?.t('settings.googleUnlinkError') || 'Lá»—i há»§y liÃªn káº¿t Google')));
            });
          });

          // Cáº­p nháº­t UI
          googleLinkStatus.textContent = window.I18n?.t('settings.notLinked') || 'ChÆ°a liÃªn káº¿t';
          googleLinkStatus.style.color = '';
          googleLinkBtn?.classList.remove('hidden');
          googleUnlinkBtn?.classList.add('hidden');

          // Cáº­p nháº­t user cache
          if (auth.user) {
            delete auth.user.google_id;
            await chrome.storage.local.set({ af_auth: auth });
          }

          if (window.customDialog) {
            window.customDialog.alert(window.I18n?.t('settings.googleUnlinkSuccess') || 'ÄÃ£ há»§y liÃªn káº¿t tÃ i khoáº£n Google.', { title: window.I18n?.t('common.success') || 'ThÃ nh cÃ´ng', type: 'success' });
          }
        } catch (e) {
          if (window.customDialog) {
            window.customDialog.alert(e.message || (window.I18n?.t('settings.googleUnlinkFailed') || 'KhÃ´ng thá»ƒ há»§y liÃªn káº¿t Google.'), { title: window.I18n?.t('common.error') || 'Lá»—i', type: 'error' });
          }
        } finally {
          googleUnlinkBtn.disabled = false;
          googleUnlinkBtn.textContent = window.I18n?.t('settings.unlinkGoogle') || 'Há»§y liÃªn káº¿t';
        }
      });
    } catch (e) {
      console.error('[Settings] Error init account linking:', e);
    }
  }

  function _applySystemSettings() {
    chrome.storage.local.get(['af_system_settings'], (res) => {
      const ss = res.af_system_settings || {};
      const showUpgrade = ss.show_upgrade_ui === true || ss.show_upgrade_ui === '1' || ss.show_upgrade_ui === 1;
      if (!showUpgrade && ss.show_upgrade_ui !== undefined) {
        document.body.classList.add('hide-upgrade-ui');
      } else {
        document.body.classList.remove('hide-upgrade-ui');
      }
      // Apply branding (logo, app name) tá»« SystemConfig
      if (window.SystemConfig) {
        window.SystemConfig.restoreFromStorage().then(() => {
          window.SystemConfig.applyToUI();
        }).catch(() => {});
      }
    });
  }

  async function _checkTelegramLinkStatus() {
    if (!window.authManager || !window.authManager.isLoggedIn()) {
      if (els.notifyTelegramRow) els.notifyTelegramRow.style.display = 'none';
      return;
    }
    try {
      const result = await window.authManager._apiCall('GET', 'telegram/link/status');
      const isLinked = result && result.linked;
      if (els.notifyTelegramRow) {
        els.notifyTelegramRow.style.display = isLinked ? '' : 'none';
      }
    } catch (e) {
      if (els.notifyTelegramRow) els.notifyTelegramRow.style.display = 'none';
    }
  }

  // Populate model + ratio selects tá»« backend qua ModelRegistry/ProviderConfigManager.
  // Hardcoded <option> trong settings.html chá»‰ lÃ m offline fallback â€” náº¿u fetch fail, options cÅ© váº«n cÃ²n.
  async function _populateDynamicSelects() {
    try {
      if (window.ModelRegistry?.fetch) {
        await window.ModelRegistry.fetch();
      }
      _fillModelSelect(els.defaultImageModel, 'flow', 'image');
      _fillModelSelect(els.defaultVideoModel, 'flow', 'video');
      _fillModelSelect(els.telegramFlowModel, 'flow', 'image', (m) => `ðŸŒ ${m.name}`);

      if (window.ProviderConfigManager?._fetchApiConfigs) {
        await window.ProviderConfigManager._fetchApiConfigs();
        _fillRatioSelect(els.telegramFlowRatio,   'flow',    'image');
        _fillRatioSelect(els.defaultImageRatio,   'flow',    'image');
        _fillRatioSelect(els.defaultVideoRatio,   'flow',    'video');
        _fillRatioSelect(els.chatgptDefaultRatio, 'chatgpt', 'image');
        _fillRatioSelect(els.grokDefaultRatio,    'grok',    'image');
        // Flow download resolutions (image + video)
        _fillDownloadResolutionSelect(els.downloadResolution,             'flow', 'image');
        _fillDownloadResolutionSelect(els.videoDownloadResolution,        'flow', 'video');
        _fillDownloadResolutionSelect(els.telegramDownloadResolution,     'flow', 'image');
        _fillDownloadResolutionSelect(els.telegramVideoDownloadResolution,'flow', 'video');
      }
    } catch (e) {
      console.warn('[Settings] Dynamic populate failed, using hardcoded options:', e?.message);
    }
  }

  function _fillModelSelect(selectEl, providerSlug, mediaType, labelFn) {
    if (!selectEl || !window.ModelRegistry?.getModelsSync) return;
    const models = window.ModelRegistry.getModelsSync(providerSlug, mediaType);
    if (!Array.isArray(models) || models.length === 0) return; // giá»¯ hardcoded options
    const prevValue = selectEl.value;
    selectEl.innerHTML = '';
    for (const m of models) {
      const opt = document.createElement('option');
      opt.value = m.value || m.name;
      opt.textContent = labelFn ? labelFn(m) : m.name;
      selectEl.appendChild(opt);
    }
    if (prevValue && [...selectEl.options].some(o => o.value === prevValue)) {
      selectEl.value = prevValue;
    }
  }

  function _fillRatioSelect(selectEl, providerSlug, mode) {
    if (!selectEl || !window.ProviderConfigManager?.getRatiosSync) return;
    const ratios = window.ProviderConfigManager.getRatiosSync(providerSlug, mode);
    if (!Array.isArray(ratios) || ratios.length === 0) return; // giá»¯ hardcoded options
    const prevValue = selectEl.value;
    const iconMap = { '16:9': 'â–¬', '9:16': 'â–®', '1:1': 'â–¡', '4:3': 'â–­', '3:4': 'â–¯', '2:3': 'â–¯', '3:2': 'â–­' };
    selectEl.innerHTML = '';
    for (const r of ratios) {
      // Flow ratios lÃ  string ('16:9'); ChatGPT/Grok shape { ui_name: 'story', value: '9:16' }.
      // Setting store ui_name (key) cho ChatGPT/Grok â€” adapter normalize â†’ DOM aria-label.
      const isObject = typeof r === 'object' && r !== null;
      const optionValue = isObject ? (r.ui_name || r.value) : r;
      if (!optionValue) continue;
      const numericLabel = isObject ? r.value : r;
      const icon = iconMap[numericLabel] || '';
      const opt = document.createElement('option');
      opt.value = optionValue;
      // Label: Flow "â–¬ 16:9", ChatGPT/Grok "â–® Story (9:16)"
      opt.textContent = isObject
        ? `${icon} ${_capitalize(r.ui_name)} (${r.value})`.trim()
        : `${icon} ${r}`.trim();
      selectEl.appendChild(opt);
    }
    if (prevValue && [...selectEl.options].some(o => o.value === prevValue)) {
      selectEl.value = prevValue;
    }
  }

  function _capitalize(s) {
    if (!s || typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Fill download resolution dropdown tá»« PCM (provider_configs.download_resolutions).
   * Server-first vá»›i fallback hardcoded options náº¿u PCM chÆ°a load hoáº·c backend chÆ°a seed.
   */
  function _fillDownloadResolutionSelect(selectEl, providerSlug, mode) {
    if (!selectEl || !window.ProviderConfigManager?.getDownloadResolutionsSync) return;
    const options = window.ProviderConfigManager.getDownloadResolutionsSync(providerSlug, mode);
    if (!Array.isArray(options) || options.length === 0) return; // giá»¯ HTML hardcoded options
    const prevValue = selectEl.value;
    selectEl.innerHTML = '';
    for (const r of options) {
      const opt = document.createElement('option');
      opt.value = r.value;
      // Label preference: `label` Æ°u tiÃªn (Ä‘áº§y Ä‘á»§ "1K (Pro)"), fallback menu_label.
      opt.textContent = r.label || r.menu_label || r.value;
      selectEl.appendChild(opt);
    }
    if (prevValue && [...selectEl.options].some(o => o.value === prevValue)) {
      selectEl.value = prevValue;
    }
  }

  function _displayVersion() {
    const versionEl = document.getElementById('aboutVersion');
    if (versionEl && chrome?.runtime?.getManifest) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = `v${manifest.version}`;
    }
  }

  async function init() {
    // Initialize tabs FIRST — always runs regardless of errors below
    initTabs();

    try {
    // Initialize i18n first
    if (window.I18n) {
      await window.I18n.init();
    }

    bindElements();
    bindEvents();
    _displayVersion();
    bindStorageEvents();

    // Bug 37 fix (2026-05-19): Connect SSE follower mode Ä‘á»ƒ nháº­n admin config update realtime
    // (download_resolutions, ratios, models). TrÆ°á»›c fix settings popup chá»‰ refresh khi reload.
    if (window.SseClient && window.authManager?.isLoggedIn?.()) {
      try {
        await window.SseClient.connect();
        console.log('[SettingsPage] SseClient connected (follower mode expected)');
      } catch (e) {
        console.warn('[SettingsPage] SseClient connect failed:', e?.message);
      }
    }

    await _populateDynamicSelects();
    loadSettings();
    // Fetch server settings náº¿u Ä‘Ã£ login (background, khÃ´ng block UI)
    fetchAndMergeServerSettings();
    _checkTelegramLinkStatus();
    loadUserProfile();
    // Pre-fetch plans â†’ window._cachedPlans (cáº§n cho crown label "YÃªu cáº§u login" vs "Premium").
    // /api/v1/plans lÃ  public endpoint nÃªn fetch cáº£ khi anonymous.
    // Sau khi load â†’ re-call checkFeatureEntitlements Ä‘á»ƒ re-render crown vá»›i label Ä‘Ãºng.
    _fetchPlansForCrowns().then(() => checkFeatureEntitlements()).catch(() => {});
    checkFeatureEntitlements();
    initTelegramSection();
    _initTelegramQuotaUpgrade();
    _loadTelegramQuota();
    initAccountLinking();
    _applySystemSettings();
    loadDailyStats();
    updateDataManagementVisibility();

    // Apply i18n translations after DOM is ready
    if (window.I18n) {
      window.I18n.applyTranslations(document.body);
      // Update document title (not in body, needs manual update)
      document.title = window.I18n.t('settings.title') || 'Settings';
    }

    // Listen for i18n:changed event to re-apply translations
    if (window.eventBus) {
      window.eventBus.on('i18n:changed', () => {
        if (window.I18n) {
          window.I18n.applyTranslations(document.body);
          document.title = window.I18n.t('settings.title') || 'Settings';
        }
      });

      // Admin update provider ratios / download_resolutions â†’ re-render relevant dropdowns
      window.eventBus.on('provider:api_config_updated', ({ provider, key }) => {
        try {
          if (key === 'download_resolutions' && provider === 'flow') {
            _fillDownloadResolutionSelect(els.downloadResolution,              'flow', 'image');
            _fillDownloadResolutionSelect(els.videoDownloadResolution,         'flow', 'video');
            _fillDownloadResolutionSelect(els.telegramDownloadResolution,      'flow', 'image');
            _fillDownloadResolutionSelect(els.telegramVideoDownloadResolution, 'flow', 'video');
            return;
          }
        } catch (_) {}
        if (key !== 'ratios') return;
        try {
          if (provider === 'flow') {
            _fillRatioSelect(els.telegramFlowRatio, 'flow', 'image');
            _fillRatioSelect(els.defaultImageRatio, 'flow', 'image');
            _fillRatioSelect(els.defaultVideoRatio, 'flow', 'video');
          } else if (provider === 'chatgpt') {
            _fillRatioSelect(els.chatgptDefaultRatio, 'chatgpt', 'image');
          } else if (provider === 'grok') {
            _fillRatioSelect(els.grokDefaultRatio, 'grok', 'image');
          }
        } catch (_e) { /* noop */ }
      });

      // Admin update provider models â†’ re-render model selects
      window.eventBus.on('provider:models_updated', () => {
        try {
          _fillModelSelect(els.defaultImageModel, 'flow', 'image');
          _fillModelSelect(els.defaultVideoModel, 'flow', 'video');
          _fillModelSelect(els.telegramFlowModel, 'flow', 'image', (m) => `ðŸŒ ${m.name}`);
        } catch (_e) { /* noop */ }
      });
    }

    // Listen for auth events from background.js
    chrome.runtime.onMessage.addListener((msg) => {
      // Login success (Google OAuth or other methods)
      if (msg.action === 'auth:oauthLogin' && msg.token) {
        console.log('[Settings] Login success received, refreshing all data');
        // Refresh táº¥t cáº£ UI vá»›i user data má»›i
        loadSettings();
        loadUserProfile();
        loadDailyStats();
        scanAllStorage();
        checkFeatureEntitlements();
        initTelegramSection();
        initAccountLinking();
        _checkTelegramLinkStatus();
        updateDataManagementVisibility();
      }

      // SSE relay: entitlements changed (plan upgrade/downgrade/admin change tá»« tab khÃ¡c)
      if (msg.action === 'sseRelay:entitlements_changed') {
        console.log('[Settings] SSE entitlements changed, refreshing UI');
        try {
          // Update authManager.user.plan_slug náº¿u cÃ³ data
          if (msg.data?.plan?.slug && window.authManager?.user) {
            window.authManager.user.plan_slug = msg.data.plan.slug;
            if (msg.data.plan.name) window.authManager.user.plan_name = msg.data.plan.name;
          }
          // Refresh UI components
          loadUserProfile();
          loadDailyStats();
          checkFeatureEntitlements();
          updateDataManagementVisibility();
        } catch (e) {
          console.warn('[Settings] sseRelay:entitlements_changed handler error:', e);
        }
      }

      // SSE relay: force logout tá»« admin â†’ Ä‘Ã³ng settings popup ngay
      if (msg.action === 'sseRelay:force_logout') {
        console.log('[Settings] SSE force_logout, closing window');
        try { window.close(); } catch (e) { /* ignore */ }
      }

      // Google link success
      if (msg.action === 'auth:googleLinked') {
        console.log('[Settings] Google link success received, refreshing user data');
        // Fetch fresh user data from server to get updated google_id
        (async () => {
          try {
            const stored = await chrome.storage.local.get(['af_auth']);
            const auth = stored.af_auth;
            if (!auth?.token) return;

            // Call /auth/me to get updated user with google_id
            const resp = await new Promise((resolve) => {
              chrome.runtime.sendMessage({
                action: 'apiRequest',
                method: 'GET',
                endpoint: 'auth/me',
                token: auth.token
              }, resolve);
            });

            if (resp?.success && resp.data?.user) {
              // Update af_auth with fresh user data
              await chrome.storage.local.set({
                af_auth: { ...auth, user: resp.data.user }
              });
              console.log('[Settings] User data refreshed with google_id');
            }

            // Refresh UI
            loadUserProfile();
            initAccountLinking();

            if (window.customDialog) {
              window.customDialog.alert(
                window.I18n?.t('settings.googleLinkSuccess') || 'ÄÃ£ liÃªn káº¿t tÃ i khoáº£n Google thÃ nh cÃ´ng.',
                { title: window.I18n?.t('common.success') || 'ThÃ nh cÃ´ng', type: 'success' }
              );
            }
          } catch (e) {
            console.error('[Settings] Error refreshing user data:', e);
          }
        })();
      }
    });

    // Listen for locale changes from storage (cross-window sync)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes.af_locale && window.I18n) {
          window.I18n.setLocale(changes.af_locale.newValue, false);
          window.I18n.applyTranslations(document.body);
          document.title = window.I18n.t('settings.title') || 'Settings';
        }
        if (changes.af_entitlements) {
          checkFeatureEntitlements();
          loadDailyStats();
          scanAllStorage();
          loadUserProfile();
          _loadTelegramQuota();
        }
        if (changes.af_settings) {
          // Reload settings UI when af_settings changes (e.g., from StorageSettings sync)
          loadSettings();
        }
        if (changes.af_auth) {
          // Refresh all UI on login/logout
          loadSettings();
          loadUserProfile();
          loadDailyStats();
          scanAllStorage();
          checkFeatureEntitlements();
          initTelegramSection();
          initAccountLinking();
          updateDataManagementVisibility();
          // Khi login, fetch settings tá»« server Ä‘á»ƒ Ä‘áº£m báº£o sync
          if (changes.af_auth.newValue?.token) {
            fetchAndMergeServerSettings();
          }
        }
        if (changes.af_system_settings) _applySystemSettings();
      }
    });
  } catch (e) {
    console.warn('[Settings] Init error:', e);
  }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
