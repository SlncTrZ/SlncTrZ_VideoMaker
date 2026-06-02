/**
 * NotificationModal - Modal hiển thị chi tiết notification + action buttons
 *
 * Hiển thị nội dung chi tiết của notification với các action buttons tùy theo loại.
 * Tương thích light/dark theme.
 *
 * Sử dụng:
 *   NotificationModal.show(notification).then(result => {
 *     // result = action được thực hiện hoặc null nếu đóng
 *   });
 */
class NotificationModal {
  static _instance = null;
  static _resolve = null;
  static _isAcceptingShare = false; // Lock để tránh duplicate click khi accept share

  /**
   * Hiển thị modal chi tiết notification
   * @param {Object} notification - Đối tượng notification
   * @returns {Promise<string|null>} Action được thực hiện hoặc null nếu đóng
   */
  static async show(notification) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;

    console.log('[NotificationModal] show() called with:', notification);

    // Đóng modal cũ nếu có
    this._close();

    // Mark as read nếu chưa đọc
    if (!notification.read_at) {
      await this._markAsRead(notification.id);
    }

    return new Promise((resolve) => {
      this._resolve = resolve;

      // Lấy content dựa theo type
      const { html, buttons } = this._getContent(notification);
      console.log('[NotificationModal] Generated HTML:', html);

      // Tạo modal - append vào body
      const modal = this._createModal(notification, html, buttons);
      document.body.appendChild(modal);
      this._instance = modal;

      // Bind events
      this._bindEvents(modal, notification, buttons, resolve);

      // Inject styles (chỉ inject content styles, layout từ notification.css)
      this._injectStyles();
    });
  }

  /**
   * Đóng modal
   */
  static _close() {
    if (this._instance) {
      this._instance.remove();
      this._instance = null;
    }
    if (this._resolve) {
      this._resolve(null);
      this._resolve = null;
    }
  }

  /**
   * Lấy content và buttons dựa theo notification type
   * @param {Object} notification
   * @returns {{ html: string, buttons: Array }}
   */
  static _getContent(notification) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;
    const data = notification.data || {};
    const type = notification.type;

    let html = '';
    let buttons = [];

    switch (type) {
      case 'workflow_shared':
        html = this._getWorkflowSharedContent(notification, data);
        buttons = [
          {
            label: t('notification.action.reject', 'Từ chối'),
            action: 'reject',
            primary: false,
            danger: true
          },
          {
            label: t('notification.action.acceptOnly', 'Chấp nhận'),
            action: 'accept',
            primary: false
          },
          {
            label: t('notification.action.acceptAndCopy', 'Chấp nhận & Sao chép'),
            action: 'acceptAndCopy',
            primary: true
          }
        ];
        break;

      case 'account_expiring':
        html = this._getAccountExpiringContent(notification, data);
        buttons = [
          {
            label: t('notification.action.later', 'Để sau'),
            action: 'close',
            primary: false
          },
          {
            label: t('notification.action.upgrade', 'Nâng cấp ngay'),
            action: 'upgrade',
            primary: true
          }
        ];
        break;

      case 'feature_announcement':
        html = this._getFeatureAnnouncementContent(notification, data);
        buttons = [
          {
            label: t('common.ok', 'OK'),
            action: 'close',
            primary: true
          }
        ];
        break;

      case 'payment':
        html = this._getPaymentContent(notification, data);
        buttons = [
          {
            label: t('common.ok', 'Đã hiểu'),
            action: 'close',
            primary: true
          }
        ];
        break;

      case 'system':
      default:
        html = this._getDefaultContent(notification, data);
        buttons = [
          {
            label: t('common.ok', 'OK'),
            action: 'close',
            primary: true
          }
        ];
        break;
    }

    return { html, buttons };
  }

  /**
   * Content cho workflow_shared
   */
  static _getWorkflowSharedContent(notification, data) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;
    const workflowName = this._escapeHtml(data.workflow_name || 'Workflow');
    // Backend gửi sharer_name + sharer_email (xem WorkflowShareController::store).
    // Giữ fallback shared_by_* để tương thích notification cũ.
    const sharedBy = this._escapeHtml(
      data.sharer_name || data.sharer_email
      || data.shared_by_name || data.shared_by_email
      || (window.I18n?.t('workflow.unknownSharer') || 'Người dùng')
    );
    const permission = data.permission || 'view';
    const permissionText = permission === 'edit'
      ? t('notification.permission.edit', 'chỉnh sửa')
      : t('notification.permission.view', 'xem');

    return `
      <div class="notification-modal-icon workflow_shared">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      </div>
      <h3>${t('notification.workflowShared.title', 'Workflow được chia sẻ')}</h3>
      <p class="notification-modal-desc">
        <strong>${sharedBy}</strong> ${t('notification.workflowShared.sharedWith', 'đã chia sẻ workflow với bạn')}:
      </p>
      <div class="notification-modal-workflow">
        <div class="workflow-name">${workflowName}</div>
        <div class="workflow-permission">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${permission === 'edit'
              ? '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'
              : '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'}
          </svg>
          ${t('notification.workflowShared.permission', 'Quyền')}: ${permissionText}
        </div>
      </div>
      <p class="notification-modal-hint">
        ${t('notification.workflowShared.hint', 'Bạn có muốn thêm workflow này vào danh sách của mình không?')}
      </p>
    `;
  }

  /**
   * Content cho account_expiring
   */
  static _getAccountExpiringContent(notification, data) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;
    const daysLeft = data.days_left || 0;
    const expiryDate = data.expiry_date || '';
    const planName = this._escapeHtml(data.plan_name || 'Pro');

    let formattedDate = '';
    if (expiryDate) {
      const date = new Date(expiryDate);
      formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    return `
      <div class="notification-modal-icon account_expiring">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h3>${t('notification.accountExpiring.title', 'Tài khoản sắp hết hạn')}</h3>
      <p class="notification-modal-desc">
        ${t('notification.accountExpiring.desc', 'Gói')} <strong>${planName}</strong> ${t('notification.accountExpiring.willExpire', 'của bạn sẽ hết hạn trong')}:
      </p>
      <div class="notification-modal-expiry">
        <div class="expiry-days">
          <span class="days-number">${daysLeft}</span>
          <span class="days-label">${t('notification.accountExpiring.days', 'ngày')}</span>
        </div>
        ${formattedDate ? `<div class="expiry-date">(${formattedDate})</div>` : ''}
      </div>
      <p class="notification-modal-hint">
        ${t('notification.accountExpiring.hint', 'Gia hạn ngay để tiếp tục sử dụng tất cả tính năng Premium.')}
      </p>
    `;
  }

  /**
   * Content cho feature_announcement
   */
  static _getFeatureAnnouncementContent(notification, data) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;
    console.log('[NotificationModal] _getFeatureAnnouncementContent:', { notification, data });
    const title = this._escapeHtml(notification.title || data.title || 'Tính năng mới');
    const message = this._escapeHtml(notification.body || notification.message || data.message || '');
    const imageUrl = data.image_url || '';
    console.log('[NotificationModal] Parsed:', { title, message, imageUrl });

    return `
      <div class="notification-modal-icon feature_announcement">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 11 18-5v12L3 14v-3z"/>
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
        </svg>
      </div>
      <h3>${title}</h3>
      ${imageUrl ? `<img class="notification-modal-image" src="${this._escapeAttr(imageUrl)}" alt="${title}" />` : ''}
      <p class="notification-modal-desc">${message}</p>
    `;
  }

  /**
   * Content cho payment notification
   */
  static _getPaymentContent(notification, data) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;
    const title = this._escapeHtml(notification.title || data.title || 'Thông báo thanh toán');
    const message = this._escapeHtml(notification.body || notification.message || data.message || '');
    const amount = data.amount || '';
    const status = data.status || '';

    let statusClass = '';
    let statusText = '';
    if (status === 'success' || status === 'completed') {
      statusClass = 'success';
      statusText = t('notification.payment.success', 'Thành công');
    } else if (status === 'failed') {
      statusClass = 'failed';
      statusText = t('notification.payment.failed', 'Thất bại');
    } else if (status === 'pending') {
      statusClass = 'pending';
      statusText = t('notification.payment.pending', 'Đang xử lý');
    }

    return `
      <div class="notification-modal-icon payment ${statusClass}">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      </div>
      <h3>${title}</h3>
      ${amount ? `<div class="notification-modal-amount">${this._escapeHtml(amount)}</div>` : ''}
      ${statusText ? `<div class="notification-modal-status ${statusClass}">${statusText}</div>` : ''}
      <p class="notification-modal-desc">${message}</p>
    `;
  }

  /**
   * Content mặc định
   */
  static _getDefaultContent(notification, data) {
    const title = this._escapeHtml(notification.title || data.title || 'Thông báo');
    const message = this._escapeHtml(notification.body || notification.message || data.message || '');

    return `
      <div class="notification-modal-icon system">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </div>
      <h3>${title}</h3>
      <p class="notification-modal-desc">${message}</p>
    `;
  }

  /**
   * Tạo modal element - dùng pattern giống ChatAIModal
   */
  static _createModal(notification, html, buttons) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;

    const overlay = document.createElement('div');
    overlay.className = 'notification-detail-overlay';
    overlay.innerHTML = `
      <div class="notification-detail-modal">
        <button class="notification-detail-close" type="button"
                title="${t('common.close', 'Đóng')}" aria-label="${t('common.close', 'Đóng')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="notification-detail-body">
          ${html}
        </div>
        <div class="notification-detail-footer">
          ${buttons.map((btn, i) => `
            <button class="notification-detail-btn ${btn.primary ? 'primary' : ''} ${btn.danger ? 'danger' : ''}"
                    data-action="${btn.action}" data-idx="${i}">
              ${this._escapeHtml(btn.label)}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    return overlay;
  }

  /**
   * Bind events
   */
  static _bindEvents(modal, notification, buttons, resolve) {
    // Close button
    modal.querySelector('.notification-detail-close')?.addEventListener('click', () => {
      this._close();
    });

    // Overlay click (click outside modal)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this._close();
      }
    });

    // ESC to close
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        this._close();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Button clicks
    modal.querySelectorAll('.notification-detail-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;

        if (action === 'close') {
          this._close();
          return;
        }

        // Disable all buttons và show loading
        modal.querySelectorAll('.notification-detail-btn').forEach(b => b.disabled = true);
        btn.innerHTML = `
          <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
          </svg>
        `;

        try {
          // Execute action based on type
          switch (action) {
            case 'accept':
              await this._acceptShare(notification, { shouldCopy: false });
              break;
            case 'acceptAndCopy':
              await this._acceptShare(notification, { shouldCopy: true });
              break;
            case 'reject':
              await this._rejectShare(notification);
              break;
            case 'upgrade':
              this._openUpgrade();
              break;
          }

          // Close modal với result
          this._instance?.remove();
          this._instance = null;
          this._resolve = null;
          resolve(action);

        } catch (err) {
          console.error('[NotificationModal] Action error:', err.message);
          // err.silent = true → đã show dialog rồi, không hiện toast trùng nội dung
          if (!err.silent) {
            window.showNotification?.(err.message, 'error');
          }

          // Re-enable buttons
          modal.querySelectorAll('.notification-detail-btn').forEach((b, i) => {
            b.disabled = false;
            b.innerHTML = this._escapeHtml(buttons[i].label);
          });
        }
      });
    });

    // Chặn mouse events leak
    ['mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach(evt => {
      modal.addEventListener(evt, (e) => e.stopPropagation());
    });
  }

  /**
   * Mark notification as read
   */
  static async _markAsRead(id) {
    if (!window.authManager?.isLoggedIn()) return;

    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'apiRequest',
          method: 'POST',
          endpoint: `notifications/${id}/read`,
          token: window.authManager?.token
        }, (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(resp);
        });
      });
    } catch (err) {
      console.warn('[NotificationModal] Lỗi mark as read:', err.message);
    }
  }

  /**
   * Accept workflow share với 2 options:
   *   - shouldCopy = false: Chỉ accept, workflow hiển thị ở tab "Shared" (read-only)
   *   - shouldCopy = true: Accept + duplicate workflow về danh sách của mình
   *
   * Quota policy (chỉ áp dụng khi shouldCopy = true):
   *   - workflows_max: HARD-block nếu hết slot
   *   - workflows_nodes_max: HARD-block nếu workflow vượt limit nodes
   *
   * @param {Object} notification - Notification object
   * @param {Object} options - { shouldCopy: boolean }
   */
  static async _acceptShare(notification, options = {}) {
    const { shouldCopy = false } = options;
    const t = (key, fallback) => window.I18n?.t(key) || fallback;

    // Lock để tránh duplicate click
    if (this._isAcceptingShare) {
      console.log('[NotificationModal] Accept share already in progress, ignoring duplicate click');
      return;
    }

    const data = notification.data || {};
    const token = data.token || data.accept_token;
    const shareId = data.share_id || notification.reference_id;
    const wfId = data.workflow_wf_id;
    const nodeCount = Number(data.workflow_node_count ?? 0);

    if (!token) {
      throw new Error(t('notification.error.noShareId', 'Không tìm thấy thông tin chia sẻ'));
    }

    this._isAcceptingShare = true;

    try {
      const fg = window.featureGate;

      // ─── 1. Pre-check quotas (chỉ khi shouldCopy = true) ─────────────
      if (shouldCopy && fg) {
        // Check workflows_max
        const wfQuota = fg.checkQuota('workflows_max');
        if (wfQuota && wfQuota.limit !== 'unlimited' && wfQuota.limit > 0
            && (wfQuota.used ?? 0) >= wfQuota.limit) {
          const msg = t('workflow.shareAcceptQuotaExhausted',
            `Gói của bạn giới hạn tối đa ${wfQuota.limit} workflow. Bạn đã có ${wfQuota.used} workflow. Nâng cấp Premium để sao chép workflow.`);
          const upgrade = await window.customDialog?.confirm(msg, {
            title: t('workflow.quotaReached', 'Đã đạt giới hạn'),
            type: 'warning',
            confirmText: t('common.upgrade', 'Nâng cấp'),
            cancelText: t('common.later', 'Để sau'),
          });
          if (upgrade && typeof window.openUpgradeModal === 'function') window.openUpgradeModal();
          const err = new Error(msg);
          err.silent = true;
          throw err;
        }

        // Check workflows_nodes_max
        if (nodeCount > 0) {
          const nodeQuota = fg.checkQuota('workflows_nodes_max');
          const nodeLimit = nodeQuota?.limit;
          if (nodeLimit && nodeLimit !== 'unlimited' && nodeLimit > 0 && nodeCount > nodeLimit) {
            const msg = t('workflow.shareNodeLimitExceeded',
              `Workflow này có ${nodeCount} nodes, vượt giới hạn ${nodeLimit} nodes của gói. Nâng cấp để sao chép workflow này.`);
            const upgrade = await window.customDialog?.confirm(msg, {
              title: t('workflow.quotaReached', 'Đã đạt giới hạn'),
              type: 'warning',
              confirmText: t('common.upgrade', 'Nâng cấp'),
              cancelText: t('common.later', 'Để sau'),
            });
            if (upgrade && typeof window.openUpgradeModal === 'function') window.openUpgradeModal();
            const err = new Error(msg);
            err.silent = true;
            throw err;
          }
        }
      }

      // ─── 2. Accept share (đổi share status → ACCEPTED) ─────────────────
      const acceptResp = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'apiRequest',
          method: 'POST',
          endpoint: `workflow-shares/${token}/accept`,
          token: window.authManager?.token
        }, (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (resp?.success) {
            resolve(resp.data);
          } else {
            reject(new Error(resp?.error?.message || t('notification.error.acceptFailed', 'Không thể chấp nhận chia sẻ')));
          }
        });
      });

      // ─── 3. Duplicate (chỉ khi shouldCopy = true) ─────────────────
      let dupResp = null;
      if (shouldCopy) {
        const targetWfId = wfId || acceptResp?.workflow?.wf_id;
        if (targetWfId) {
          dupResp = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              action: 'apiRequest',
              method: 'POST',
              endpoint: `shared-workflows/${targetWfId}/clone`,
              token: window.authManager?.token
            }, (resp) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (resp?.success) {
                resolve(resp.data);
              } else {
                const err = new Error(resp?.error?.message || t('notification.error.duplicateFailed', 'Không thể sao chép workflow'));
                err.code = resp?.error?.code;
                reject(err);
              }
            });
          });
        }
      }

      // ─── 4. Toast + emit event ──────────────────────────────
      if (shouldCopy && dupResp) {
        window.showNotification?.(
          t('notification.workflowShared.acceptedAndCopied', 'Đã sao chép workflow vào danh sách của bạn'),
          'success'
        );
      } else {
        window.showNotification?.(
          t('notification.workflowShared.acceptedOnly', 'Đã thêm vào "Được chia sẻ với tôi"'),
          'success'
        );
      }

      if (window.eventBus) {
        window.eventBus.emit('workflow:shared_accepted', {
          shareId,
          notification,
          workflow: dupResp,
          copied: shouldCopy && !!dupResp,
        });
      }

      return dupResp || acceptResp;
    } finally {
      this._isAcceptingShare = false;
    }
  }

  /**
   * Reject workflow share
   */
  static async _rejectShare(notification) {
    const t = (key, fallback) => window.I18n?.t(key) || fallback;
    const data = notification.data || {};
    const shareId = data.share_id || notification.reference_id;

    if (!shareId) {
      throw new Error(t('notification.error.noShareId', 'Không tìm thấy thông tin chia sẻ'));
    }

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'apiRequest',
        method: 'POST',
        endpoint: `workflow-shares/${shareId}/reject`,
        token: window.authManager?.token
      }, (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (resp?.success) {
          resolve(resp.data);
        } else {
          reject(new Error(resp?.error?.message || t('notification.error.rejectFailed', 'Không thể từ chối chia sẻ')));
        }
      });
    });

    window.showNotification?.(t('notification.workflowShared.rejected', 'Đã từ chối chia sẻ workflow'), 'info');

    return response;
  }

  /**
   * Mở modal nâng cấp
   */
  static _openUpgrade() {
    // Mở modal upgrade thay vì link pricing
    if (typeof window.openUpgradeModal === 'function') {
      window.openUpgradeModal();
    } else {
      try { chrome.runtime.sendMessage({ action: 'showUpgradeModal' }); } catch (e) {}
    }
  }

  /**
   * Escape HTML
   */
  static _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Escape attribute
   */
  static _escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Inject CSS styles - Pattern giống ChatAIModal
   */
  static _injectStyles() {
    if (document.getElementById('notification-detail-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-detail-styles';
    style.textContent = `
      /* NotificationModal Overlay - Pattern giống chat-ai.css */
      .notification-detail-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      /* Modal container */
      .notification-detail-modal {
        position: relative;
        background: var(--background, #1e1e1e);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        border-radius: 16px;
        max-width: 480px;
        width: 100%;
        max-height: 85vh;
        overflow: hidden;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
        animation: notification-detail-slide-in 200ms ease-out;
      }

      @keyframes notification-detail-slide-in {
        from { opacity: 0; transform: scale(0.95) translateY(-8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }

      /* Close button */
      .notification-detail-close {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--muted-foreground, #8b8b92);
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;
        z-index: 1;
      }

      .notification-detail-close:hover {
        background: var(--muted, #2e2e33);
        color: var(--foreground, #f8fafc);
      }

      /* Body */
      .notification-detail-body {
        padding: 32px 24px 24px;
        text-align: center;
        overflow-y: auto;
        max-height: calc(85vh - 80px);
      }

      .notification-detail-body h3 {
        margin: 0 0 12px;
        font-size: 18px;
        font-weight: 600;
        color: var(--foreground, #f8fafc);
      }

      /* Footer */
      .notification-detail-footer {
        display: flex;
        gap: 12px;
        padding: 16px 24px 24px;
        border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
      }

      /* Buttons */
      .notification-detail-btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 20px;
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        border-radius: 10px;
        background: var(--secondary, #242428);
        color: var(--foreground, #f8fafc);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .notification-detail-btn:hover {
        background: var(--muted, #2e2e33);
      }

      .notification-detail-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .notification-detail-btn.primary {
        background: var(--primary, #ccff00);
        border-color: var(--primary, #ccff00);
        color: var(--primary-foreground, #1e1e1e);
      }

      .notification-detail-btn.primary:hover {
        background: var(--primary-hover, #b8e600);
        border-color: var(--primary-hover, #b8e600);
      }

      .notification-detail-btn.danger {
        border-color: #ef4444;
        color: #ef4444;
      }

      .notification-detail-btn.danger:hover {
        background: rgba(239, 68, 68, 0.1);
      }

      /* ===== Content styles (giữ nguyên prefix notification-modal- cho nội dung) ===== */
      .notification-modal-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        border-radius: 16px;
        background: var(--muted, #2e2e33);
        color: var(--muted-foreground, #8b8b92);
      }

      .notification-modal-icon.workflow_shared {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }

      .notification-modal-icon.account_expiring {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }

      .notification-modal-icon.feature_announcement {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      .notification-modal-icon.system {
        background: rgba(99, 102, 241, 0.15);
        color: #6366f1;
      }

      .notification-modal-icon.payment {
        background: rgba(236, 72, 153, 0.15);
        color: #ec4899;
      }

      .notification-modal-icon.payment.success {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      .notification-modal-icon.payment.failed {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      .notification-modal-desc {
        margin: 0 0 16px;
        font-size: 14px;
        line-height: 1.5;
        color: var(--muted-foreground, #8b8b92);
      }

      .notification-modal-desc strong {
        color: var(--foreground, #f8fafc);
      }

      .notification-modal-hint {
        margin: 16px 0 0;
        font-size: 13px;
        color: var(--muted-foreground, #8b8b92);
      }

      .notification-modal-image {
        max-width: 100%;
        max-height: 200px;
        margin: 16px 0;
        border-radius: 8px;
        object-fit: contain;
      }

      /* Workflow shared specific */
      .notification-modal-workflow {
        padding: 16px;
        margin: 16px 0;
        background: var(--muted, rgba(255, 255, 255, 0.05));
        border-radius: 12px;
      }

      .workflow-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--foreground, #f8fafc);
        margin-bottom: 8px;
      }

      .workflow-permission {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: var(--background, #1e1e1e);
        border-radius: 20px;
        font-size: 13px;
        color: var(--muted-foreground, #8b8b92);
      }

      /* Account expiring specific */
      .notification-modal-expiry {
        padding: 24px;
        margin: 16px 0;
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: 12px;
      }

      .expiry-days {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 8px;
      }

      .days-number {
        font-size: 48px;
        font-weight: 700;
        color: #f59e0b;
        line-height: 1;
      }

      .days-label {
        font-size: 18px;
        font-weight: 500;
        color: #f59e0b;
      }

      .expiry-date {
        margin-top: 8px;
        font-size: 14px;
        color: var(--muted-foreground, #8b8b92);
      }

      /* Payment specific */
      .notification-modal-amount {
        font-size: 24px;
        font-weight: 700;
        color: var(--foreground, #f8fafc);
        margin: 8px 0;
      }

      .notification-modal-status {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 12px;
      }

      .notification-modal-status.success {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      .notification-modal-status.failed {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      .notification-modal-status.pending {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      /* Light theme */
      .theme-light .notification-detail-overlay {
        background: rgba(0, 0, 0, 0.4);
      }

      .theme-light .notification-detail-modal {
        background: var(--background, #ffffff);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      }

      .theme-light .notification-detail-body h3 {
        color: var(--foreground, #1a1a1a);
      }

      .theme-light .notification-detail-close:hover {
        background: var(--muted, #f1f5f9);
        color: var(--foreground, #1a1a1a);
      }

      .theme-light .notification-detail-btn {
        background: var(--secondary, #f1f5f9);
        color: var(--foreground, #1a1a1a);
      }

      .theme-light .notification-detail-btn:hover {
        background: var(--muted, #e2e8f0);
      }

      .theme-light .notification-detail-btn.primary {
        background: var(--primary, #335AF5);
        border-color: var(--primary, #335AF5);
        color: #fff;
      }

      .theme-light .notification-modal-desc {
        color: var(--muted-foreground, #64748b);
      }

      .theme-light .notification-modal-desc strong,
      .theme-light .workflow-name,
      .theme-light .notification-modal-amount {
        color: var(--foreground, #1a1a1a);
      }
    `;

    document.head.appendChild(style);
  }
}

// Export global
window.NotificationModal = NotificationModal;
