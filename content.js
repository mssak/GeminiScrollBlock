// Minimal autoscroll blocker: only blocks element-level programmatic scroll inside Gemini chat
(() => {
  const EXT_FLAG = '__gemini_autoscroll_blocker_min__';
  if (window[EXT_FLAG]) return;
  window[EXT_FLAG] = true;

  const containerSelectors = [
    '[data-test-id="chat-history-container"]',
    '.chat-history',
    'infinite-scroller'
  ];

  const isInsideChat = (el) => {
    if (!el || el.nodeType !== 1) return false;
    for (const sel of containerSelectors) {
      try { if (el.closest(sel)) return true; } catch (_) {}
    }
    return false;
  };

  const patch = (target, name, original) => {
    if (!target || typeof original !== 'function') return;
    const wrapped = function(...args) {
      if (isInsideChat(this)) return; // Block only when called on elements inside chat
      return original.apply(this, args);
    };
    try { Object.defineProperty(target, name, { value: wrapped, configurable: true, writable: true }); }
    catch (_) { try { target[name] = wrapped; } catch (_) {} }
  };

  // Intercept only element-level methods; do not touch window or properties
  patch(Element.prototype, 'scrollIntoView', Element.prototype.scrollIntoView);
  patch(Element.prototype, 'scrollTo', Element.prototype.scrollTo);
  patch(Element.prototype, 'scrollBy', Element.prototype.scrollBy);
  patch(Element.prototype, 'scroll', Element.prototype.scroll);
})();

//mssak