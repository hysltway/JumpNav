(() => {
  'use strict';

  const ns = window.ChatGptNav;
  const { CONFIG } = ns;
  const PREVIEW_HIDE_DELAY = 140;
  const MINIMAL_MODE_KEY = 'chatgpt-nav-minimal-mode';

  const state = {
    started: false,
    adapter: null,
    url: location.href,
    root: null,
    observer: null,
    messages: [],
    signature: '',
    rebuildTimer: null,
    pollTimer: null,
    ui: null,
    minimalMode: false,
    previewIndex: null,
    previewHideTimer: null
  };

  function start() {
    if (state.started) {
      return;
    }
    state.started = true;

    state.adapter = ns.adapters.getAdapter();
    if (!state.adapter) {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }

  function boot() {
    if (document.documentElement.dataset.chatgptNavInjected === '1') {
      return;
    }
    document.documentElement.dataset.chatgptNavInjected = '1';

    if (state.ui) {
      return;
    }
    state.ui = ns.ui.createUI();
    ns.ui.setTitle(state.ui, getNavigatorTitle());
    state.minimalMode = loadMinimalMode();
    ns.ui.setMinimalMode(state.ui, state.minimalMode);
    attachUiHandlers();
    initFabDrag();
    scheduleRebuild('init');
    startUrlPolling();
  }

  function attachUiHandlers() {
    state.ui.toggle.addEventListener('click', () => {
      ns.ui.setCollapsed(state.ui, true);
    });

    state.ui.minimalToggle.addEventListener('click', () => {
      setMinimalMode(!state.minimalMode);
    });

    state.ui.fab.addEventListener('click', () => {
      if (state.ui.fab.dataset.suppressClick === '1') {
        state.ui.fab.dataset.suppressClick = '0';
        return;
      }
      ns.ui.setCollapsed(state.ui, false);
    });

    state.ui.body.addEventListener('click', (event) => {
      const item = event.target.closest('.nav-item');
      if (!item) {
        return;
      }
      const index = Number(item.dataset.index);
      const message = state.messages[index];
      if (!message || !message.node) {
        return;
      }
      scrollToMessage(message.node);
    });

    state.ui.body.addEventListener('pointerover', handleItemPointerOver);
    state.ui.body.addEventListener('pointerout', handleItemPointerOut);
    state.ui.body.addEventListener('focusin', handleItemFocusIn);
    state.ui.body.addEventListener('focusout', handleItemFocusOut);

    state.ui.preview.addEventListener('pointerenter', handlePreviewPointerEnter);
    state.ui.preview.addEventListener('pointerleave', handlePreviewPointerLeave);
    state.ui.preview.addEventListener('click', handlePreviewClick);
  }

  function initFabDrag() {
    const fab = state.ui.fab;
    const storageKey = 'chatgpt-nav-fab-position';
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const saved = loadFabPosition(storageKey);
    if (saved) {
      applyFabPosition(fab, saved.left, saved.top);
    }

    fab.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      const rect = fab.getBoundingClientRect();
      dragging = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      fab.classList.add('dragging');
      fab.setPointerCapture(event.pointerId);
    });

    fab.addEventListener('pointermove', (event) => {
      if (!dragging) {
        return;
      }
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 3) {
        moved = true;
      }
      const rect = fab.getBoundingClientRect();
      const nextLeft = clamp(startLeft + dx, 0, window.innerWidth - rect.width);
      const nextTop = clamp(startTop + dy, 0, window.innerHeight - rect.height);
      applyFabPosition(fab, nextLeft, nextTop);
    });

    fab.addEventListener('pointerup', (event) => {
      if (!dragging) {
        return;
      }
      dragging = false;
      fab.classList.remove('dragging');
      fab.releasePointerCapture(event.pointerId);
      if (moved) {
        fab.dataset.suppressClick = '1';
        saveFabPosition(storageKey, fab);
      }
    });

    fab.addEventListener('pointercancel', (event) => {
      if (!dragging) {
        return;
      }
      dragging = false;
      fab.classList.remove('dragging');
      fab.releasePointerCapture(event.pointerId);
    });
  }

  function applyFabPosition(fab, left, top) {
    fab.style.left = `${left}px`;
    fab.style.top = `${top}px`;
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  }

  function saveFabPosition(key, fab) {
    const rect = fab.getBoundingClientRect();
    const payload = { left: rect.left, top: rect.top };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function loadFabPosition(key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed.left === 'number' && typeof parsed.top === 'number') {
        return parsed;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function startUrlPolling() {
    if (state.pollTimer) {
      return;
    }
    state.pollTimer = window.setInterval(() => {
      if (location.href !== state.url) {
        handleRouteChange('poll');
      }
    }, CONFIG.pollMs);
  }

  function handleRouteChange(source) {
    state.url = location.href;
    state.signature = '';
    state.messages = [];
    renderMessages();
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    state.root = null;
    scheduleRebuild(source);
  }

  function scheduleRebuild(reason) {
    if (state.rebuildTimer) {
      clearTimeout(state.rebuildTimer);
    }
    state.rebuildTimer = setTimeout(() => {
      state.rebuildTimer = null;
      rebuild(reason);
    }, CONFIG.debounceMs);
  }

  function rebuild(reason) {
    handlePotentialRouteChange(reason);

    const root = state.adapter.getConversationRoot();
    if (!root) {
      scheduleRebuild('wait-root');
      return;
    }

    if (root !== state.root) {
      state.root = root;
      attachObserver(root);
    }

    const sequence = state.adapter.getConversationMessages
      ? state.adapter.getConversationMessages(root)
      : [];
    const messages = [];
    sequence.forEach((entry, index) => {
      if (entry.role !== 'user') {
        return;
      }
      const text = ns.utils.normalizeText(entry.node.textContent || '');
      const title = text || `Prompt ${messages.length + 1}`;
      let assistantText = '';
      for (let i = index + 1; i < sequence.length; i += 1) {
        if (sequence[i].role === 'assistant') {
          assistantText = ns.utils.normalizeText(sequence[i].node.textContent || '');
          break;
        }
        if (sequence[i].role === 'user') {
          break;
        }
      }
      const preview = assistantText ? ns.utils.truncate(assistantText, CONFIG.previewMax) : '';
      messages.push({ node: entry.node, title, preview, text });
    });

    const lastText = messages.length ? messages[messages.length - 1].text : '';
    const lastPreview = messages.length ? messages[messages.length - 1].preview : '';
    const signature = `${messages.length}:${lastText}:${lastPreview}`;
    if (signature === state.signature) {
      return;
    }
    state.signature = signature;
    state.messages = messages;
    renderMessages();
  }

  function attachObserver(root) {
    if (state.observer) {
      state.observer.disconnect();
    }
    state.observer = new MutationObserver(() => {
      handlePotentialRouteChange('mutation');
      scheduleRebuild('mutation');
    });
    state.observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function handlePotentialRouteChange(source) {
    if (location.href !== state.url) {
      handleRouteChange(source);
    }
  }

  function scrollToMessage(node) {
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    flashTarget(node);
  }

  function flashTarget(node) {
    if (typeof node.animate === 'function') {
      node.animate(
        [
          { boxShadow: '0 0 0 0 rgba(240, 163, 75, 0.0)' },
          { boxShadow: '0 0 0 4px rgba(240, 163, 75, 0.55)' },
          { boxShadow: '0 0 0 0 rgba(240, 163, 75, 0.0)' }
        ],
        { duration: 1200, easing: 'ease-out' }
      );
      return;
    }

    const prevOutline = node.style.outline;
    const prevOffset = node.style.outlineOffset;
    node.style.outline = '2px solid rgba(240, 163, 75, 0.7)';
    node.style.outlineOffset = '4px';
    setTimeout(() => {
      node.style.outline = prevOutline;
      node.style.outlineOffset = prevOffset;
    }, 1200);
  }

  function getNavigatorTitle() {
    if (state.adapter && state.adapter.id === 'gemini') {
      return 'Gemini Navigator';
    }
    return 'ChatGPT Navigator';
  }

  function renderMessages() {
    clearPreviewHideTimer();
    state.previewIndex = null;
    ns.ui.hidePreview(state.ui);
    ns.ui.renderList(state.ui, state.messages, { minimalMode: state.minimalMode });
  }

  function setMinimalMode(enabled) {
    state.minimalMode = enabled;
    saveMinimalMode(enabled);
    ns.ui.setMinimalMode(state.ui, enabled);
    renderMessages();
  }

  function loadMinimalMode() {
    try {
      return window.localStorage.getItem(MINIMAL_MODE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function saveMinimalMode(value) {
    try {
      window.localStorage.setItem(MINIMAL_MODE_KEY, value ? '1' : '0');
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function handleItemPointerOver(event) {
    if (!state.minimalMode) {
      return;
    }
    const item = event.target.closest('.nav-item');
    if (!item || !state.ui.body.contains(item)) {
      return;
    }
    clearPreviewHideTimer();
    showPreviewForItem(item);
  }

  function handleItemPointerOut(event) {
    if (!state.minimalMode) {
      return;
    }
    const item = event.target.closest('.nav-item');
    if (!item || !state.ui.body.contains(item)) {
      return;
    }
    const related = event.relatedTarget;
    if (related && (item.contains(related) || state.ui.preview.contains(related))) {
      return;
    }
    schedulePreviewHide();
  }

  function handleItemFocusIn(event) {
    if (!state.minimalMode) {
      return;
    }
    const item = event.target.closest('.nav-item');
    if (!item || !state.ui.body.contains(item)) {
      return;
    }
    clearPreviewHideTimer();
    showPreviewForItem(item);
  }

  function handleItemFocusOut(event) {
    if (!state.minimalMode) {
      return;
    }
    const item = event.target.closest('.nav-item');
    if (!item || !state.ui.body.contains(item)) {
      return;
    }
    schedulePreviewHide();
  }

  function handlePreviewPointerEnter() {
    if (!state.minimalMode) {
      return;
    }
    clearPreviewHideTimer();
  }

  function handlePreviewPointerLeave(event) {
    if (!state.minimalMode) {
      return;
    }
    const related = event.relatedTarget;
    if (related && related.closest && related.closest('.nav-item')) {
      return;
    }
    schedulePreviewHide();
  }

  function handlePreviewClick() {
    if (!state.minimalMode) {
      return;
    }
    const index = state.previewIndex;
    if (typeof index !== 'number') {
      return;
    }
    const message = state.messages[index];
    if (!message || !message.node) {
      return;
    }
    scrollToMessage(message.node);
  }

  function showPreviewForItem(item) {
    const index = Number(item.dataset.index);
    const message = state.messages[index];
    if (!message) {
      return;
    }
    state.previewIndex = index;
    ns.ui.showPreview(state.ui, message, item);
  }

  function schedulePreviewHide() {
    clearPreviewHideTimer();
    state.previewHideTimer = window.setTimeout(() => {
      state.previewHideTimer = null;
      state.previewIndex = null;
      ns.ui.hidePreview(state.ui);
    }, PREVIEW_HIDE_DELAY);
  }

  function clearPreviewHideTimer() {
    if (!state.previewHideTimer) {
      return;
    }
    window.clearTimeout(state.previewHideTimer);
    state.previewHideTimer = null;
  }

  ns.core = {
    start
  };
})();
