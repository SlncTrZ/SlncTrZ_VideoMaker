/**
 * OAuth Bridge Content Script
 * Inject vÃ o trang OAuth success Ä‘á»ƒ forward token Ä‘áº¿n extension background.js
 *
 * Flow:
 * 1. OAuthSuccess.vue gá»i window.postMessage({ source: 'slnctrz-oauth-success', token })
 * 2. Content script nÃ y nháº­n postMessage
 * 3. Forward Ä‘áº¿n background.js qua chrome.runtime.sendMessage({ action: 'oauth:success', token })
 */

(function() {
  'use strict';

  // PATCHED: Disabled for offline standalone operation.
  console.log('[SlncTrZ] OAuth bridge disabled (offline mode)');
  return;

  // Track xem Ä‘Ã£ forward token chÆ°a Ä‘á»ƒ trÃ¡nh duplicate
  let tokenForwarded = false;

  // Láº¯ng nghe postMessage tá»« page
  window.addEventListener('message', (event) => {
    // Kiá»ƒm tra source
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'slnctrz-oauth-success') return;

    const { token, linked } = event.data;

    if (token && !tokenForwarded) {
      tokenForwarded = true;
      // Login flow: forward token Ä‘áº¿n background.js
      console.log('[SlncTrZ] OAuth bridge: forwarding token to background via postMessage');
      chrome.runtime.sendMessage({
        action: 'oauth:success',
        token: token,
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[SlncTrZ] OAuth bridge error:', chrome.runtime.lastError.message);
          // Reset Ä‘á»ƒ fallback cÃ³ thá»ƒ thá»­ láº¡i
          tokenForwarded = false;
        } else {
          console.log('[SlncTrZ] OAuth bridge: token forwarded successfully');
        }
      });
    } else if (linked) {
      // Link flow: thÃ´ng bÃ¡o extension Ä‘Ã£ link thÃ nh cÃ´ng
      console.log('[SlncTrZ] OAuth bridge: forwarding link success to background');
      chrome.runtime.sendMessage({
        action: 'oauth:linked',
        linked: true,
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[SlncTrZ] OAuth bridge error:', chrome.runtime.lastError.message);
        } else {
          console.log('[SlncTrZ] OAuth bridge: link success forwarded');
        }
      });
    }
  });

  // Fallback 1: Äá»c token trá»±c tiáº¿p tá»« URL query string (Ä‘Ã¡ng tin cáº­y nháº¥t)
  function checkUrlToken() {
    if (tokenForwarded) return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      tokenForwarded = true;
      console.log('[SlncTrZ] OAuth bridge: found token in URL query string, forwarding');
      chrome.runtime.sendMessage({
        action: 'oauth:success',
        token: urlToken,
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[SlncTrZ] OAuth bridge URL fallback error:', chrome.runtime.lastError.message);
          tokenForwarded = false;
        } else {
          console.log('[SlncTrZ] OAuth bridge: URL token forwarded successfully');
        }
      });
      return true;
    }
    return false;
  }

  // Thá»­ URL fallback NGAY Láº¬P Tá»¨C (khÃ´ng cáº§n chá» Vue mount)
  if (checkUrlToken()) {
    console.log('[SlncTrZ] OAuth bridge: token sent via URL fallback');
  }

  // Fallback 2: poll meta tag nhiá»u láº§n náº¿u URL vÃ  postMessage Ä‘á»u miss
  // Vue onMounted cÃ³ thá»ƒ cháº¡y trÆ°á»›c content script load, nÃªn cáº§n retry
  let metaCheckAttempts = 0;
  const maxMetaAttempts = 10;

  function checkMetaTag() {
    if (tokenForwarded) return;
    metaCheckAttempts++;

    const meta = document.querySelector('meta[name="slnctrz-auth-token"]');
    if (meta && meta.content) {
      tokenForwarded = true;
      console.log('[SlncTrZ] OAuth bridge: found token in meta tag (attempt ' + metaCheckAttempts + '), forwarding');
      chrome.runtime.sendMessage({
        action: 'oauth:success',
        token: meta.content,
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[SlncTrZ] OAuth bridge meta fallback error:', chrome.runtime.lastError.message);
          // Reset Ä‘á»ƒ cÃ³ thá»ƒ thá»­ láº¡i
          tokenForwarded = false;
        } else {
          console.log('[SlncTrZ] OAuth bridge: meta fallback token forwarded successfully');
        }
      });
    } else if (metaCheckAttempts < maxMetaAttempts) {
      // Retry sau 300ms
      setTimeout(checkMetaTag, 300);
    } else {
      // Final fallback: thá»­ URL láº§n ná»¯a (cÃ³ thá»ƒ URL params bá»‹ parse muá»™n)
      if (!checkUrlToken()) {
        console.warn('[SlncTrZ] OAuth bridge: no token found after all attempts');
      }
    }
  }

  // Báº¯t Ä‘áº§u check meta tag sau 200ms, sau Ä‘Ã³ retry má»—i 300ms
  // Tá»•ng thá»i gian: 200 + 300*9 = 2900ms
  setTimeout(checkMetaTag, 200);
})();
