(function () {
  function until(pred, timeoutMs = 5000, intervalMs = 50) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      (function tick() {
        try {
          if (pred()) return resolve();
        } catch (_) {}
        if (Date.now() - start > timeoutMs) return resolve();
        setTimeout(tick, intervalMs);
      })();
    });
  }

  function safe(fn) {
    try { fn && fn(); } catch (_) {}
  }

  // Soft shim for fetch to neutralize access-key/captcha endpoints if requested.
  (function patchFetch() {
    if (!window.fetch) return;
    const original = window.fetch.bind(window);
    window.fetch = function(input, init) {
      try {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        if (/2captcha|captcha\.com|turnstile|eon-access|eon_access|access-?key/i.test(url)) {
          const ok = { success: true, status: 'ok' };
          const body = JSON.stringify(ok);
          return Promise.resolve(new Response(body, { headers: { 'Content-Type': 'application/json' }, status: 200 }));
        }
      } catch (_) {}
      return original(input, init);
    };
  })();

  // Seed localStorage with a benign value so any key lookups don’t block UI.
  try {
    localStorage.setItem('eon_access', 'OK');
  } catch (_) {}

  // After the app is up, flip flags, stub methods, and enable UI.
  until(() => typeof window !== 'undefined' && window.app).then(() => {
    const app = window.app || {};

    // Flip likely auth gates
    ['authComplete', '_authComplete', 'authReady', 'isAccessGranted', 'isAuthorized']
      .forEach(k => { try { app[k] = true; } catch (_) {} });

    // Stub common auth methods if present
    const ok = () => true;
    ['sendAuth', 'validateAccess', 'requestAccess']
      .forEach(fn => {
        if (typeof app[fn] === 'function') {
          app[fn] = () => {
            safe(() => app.onAuthSucc && app.onAuthSucc({ ok: true }));
            return Promise.resolve(true);
          };
        }
      });

    if (app.auth && typeof app.auth === 'object') {
      ['sendAuth', 'validate', 'request'].forEach(fn => {
        if (typeof app.auth[fn] === 'function') {
          app.auth[fn] = () => Promise.resolve(true);
        }
      });
      ['ready', 'granted'].forEach(k => { try { app.auth[k] = true; } catch (_) {} });
    }

    // Enable Play/Spectate buttons if the UI disabled them pending auth
    try {
      document.querySelectorAll('.btn-play, .btn-spectate, .btn-reconnect-menu').forEach(btn => {
        btn.removeAttribute('disabled');
        btn.classList.remove('disabled');
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '';
      });
    } catch (_) {}

    // Remove/hide any access overlays
    try {
      const sel = [
        '#access-overlay', '#access-ov', '[id^="access-ov"]', '.access-overlay', '.access-ov',
        '#access', '.overlay.access', '.overlay-access'
      ].join(',');
      document.querySelectorAll(sel).forEach(el => el.remove());
    } catch (_) {}

    // As a fallback, unlock any backdrop overlays that block clicks
    try {
      document.querySelectorAll('[style*="backdrop"], .overlay, .modal-backdrop').forEach(el => {
        if (/(access|auth|key)/i.test(el.className || '') || /(access|auth|key)/i.test(el.id || '')) {
          el.remove();
        }
      });
    } catch (_) {}
  });
})();
