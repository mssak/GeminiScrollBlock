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

// Scroll to bottom button
(() => {
  const BUTTON_ID = 'gemini-scroll-btn';
  let scrollButton = null;
  let currentContainer = null;
  let currentUrl = location.href;
  
  // Create and style button
  function createButton() {
    if (scrollButton) return scrollButton;
    
    // Add styles first
    const style = document.createElement('style');
    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
        transition: opacity 0.15s ease;
        z-index: 999999;
        opacity: 0;
        pointer-events: none;
      }
      
      /* Light mode */
      @media (prefers-color-scheme: light) {
        #${BUTTON_ID} {
          background: #f8f9fa;
          color: #1a73e8;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        #${BUTTON_ID}:hover {
          background: #e8eaed;
        }
      }
      
      /* Dark mode */
      @media (prefers-color-scheme: dark) {
        #${BUTTON_ID} {
          background: #3a4047;
          color: #e8eaed;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        #${BUTTON_ID}:hover {
          background: #4a5259;
        }
      }
      
      #${BUTTON_ID}.visible {
        opacity: 1;
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
    
    // Create button
    scrollButton = document.createElement('div');
    scrollButton.id = BUTTON_ID;
    scrollButton.textContent = '⬇';
    scrollButton.addEventListener('click', handleClick);
    
    document.body.appendChild(scrollButton);
    return scrollButton;
  }
  
  // Find scrollable container
  function findContainer() {
    const selectors = [
      '[data-test-id="chat-history-container"]',
      '.chat-history',
      '[role="main"]'
    ];
    
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.scrollHeight > el.clientHeight) {
        return el;
      }
    }
    return null;
  }
  
  // Handle button click
  function handleClick() {
    const container = currentContainer || findContainer();
    if (!container) return;
    
    // Use direct scrollTop to bypass blocking
    container.scrollTop = container.scrollHeight;
  }
  
  // Update button visibility
  function updateButton() {
    if (!scrollButton) return;
    
    const container = currentContainer || findContainer();
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    scrollButton.classList.toggle('visible', distanceFromBottom > 100);
  }
  
  // Setup scroll monitoring
  function setupScrollMonitoring() {
    const container = findContainer();
    if (!container || container === currentContainer) return;
    
    // Remove old listener
    if (currentContainer) {
      currentContainer.removeEventListener('scroll', updateButton);
    }
    
    // Add new listener
    currentContainer = container;
    container.addEventListener('scroll', updateButton);
    updateButton();
  }
  
  // Initialize
  function init() {
    if (document.querySelector(`#${BUTTON_ID}`)) return;
    
    createButton();
    setupScrollMonitoring();
    
    // Watch for DOM changes, URL changes, and new conversations
    new MutationObserver((mutations) => {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        // (chat changes)
        [400, 600, 800, 1000].forEach(delay => {
          setTimeout(updateButton, delay);
        });
      }
      
      // Check for new conversation containers
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          const newConversations = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === 1 && 
                           node.classList?.contains('conversation-container'));
          if (newConversations.length > 0) {
            console.log('New conversation detected:', newConversations.length);
            setTimeout(updateButton, 200);
            setTimeout(updateButton, 500);
          }
        }
      });
      
      setupScrollMonitoring();
    }).observe(document.body, { childList: true, subtree: true });
  }
  
  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

//mssak