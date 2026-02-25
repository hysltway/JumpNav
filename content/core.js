(() => {
  'use strict';

  const ns = window.ChatGptNav;
  const { CONFIG } = ns;
  const PREVIEW_HIDE_DELAY = 140;
  const MANUAL_NAV_SCROLL_LOCK_MS = 1800;
  const MINIMAL_MODE_KEY = 'chatgpt-nav-minimal-mode';
  const DEFAULT_NORMAL_PANEL_WIDTH = 280;
  const PANEL_CONTENT_MIN_GAP = 14;
  const ADAPTIVE_INTERSECT_ENTER_GAP = 0;
  const ADAPTIVE_INTERSECT_EXIT_GAP = 22;
  const MESSAGE_SCAN_LIMIT = 80;
  const FULL_WIDTH_IGNORE_RATIO = 0.9;
  const FAB_RIGHT_OFFSET = 16;
  const FAB_VERTICAL_PADDING = 8;
  const MESSAGE_CONTENT_SELECTORS = [
    '[data-message-author-role="assistant"] .min-h-8.text-message',
    '[data-message-author-role="assistant"] [class*="text-message"]',
    '[data-message-author-role="user"] .min-h-8.text-message',
    '[data-message-author-role="user"] [class*="text-message"]',
    '[data-author-role="assistant"] .min-h-8.text-message',
    '[data-author-role="assistant"] [class*="text-message"]',
    '[data-author-role="user"] .min-h-8.text-message',
    '[data-author-role="user"] [class*="text-message"]',
    'user-query.ng-star-inserted',
    '.user-query.ng-star-inserted'
  ].join(',');
  const MESSAGE_ROLE_SELECTORS = [
    '[data-message-author-role="assistant"]',
    '[data-message-author-role="user"]',
    '[data-author-role="assistant"]',
    '[data-author-role="user"]',
    'user-query.ng-star-inserted',
    '.user-query.ng-star-inserted'
  ].join(',');
  const MESSAGE_INNER_SELECTORS =
    '.min-h-8.text-message, .text-message, [class*="text-message"], .query-text, .markdown, .prose';
  const THEME_ATTRIBUTE_FILTER = ['class', 'style'];
  const SCROLL_HIGHLIGHT_WAIT_MS = 2600;
  const SCROLL_HIGHLIGHT_DURATION_MS = 820;
  const SCROLL_SETTLE_IDLE_MS = 180;
  const HIGHLIGHT_DARKEN_DELTA = 24;
  const CHATGPT_USER_BUBBLE_SELECTOR = '[class*="user-message-bubble-color"]';
  const GEMINI_USER_BUBBLE_SELECTOR = '.user-query-bubble-with-background';
  const CHATGPT_USER_BUBBLE_BG = 'rgba(233, 233, 233, 0.5)';
  const GEMINI_USER_BUBBLE_BG = 'rgb(233, 238, 246)';
  const THEME_TRANSITION_STYLE_ID = 'chatgpt-nav-theme-transition-style';
  const THEME_TRANSITION_DURATION_MS = 520;
  const THEME_TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
    adaptiveMinimalMode: false,
    effectiveMinimalMode: false,
    previewIndex: null,
    activeIndex: null,
    activeRaf: null,
    previewHideTimer: null,
    normalPanelWidth: DEFAULT_NORMAL_PANEL_WIDTH,
    colorScheme: 'light',
    themeObserver: null,
    themeRaf: null,
    themeMql: null,
    themeMqlHandler: null,
    highlightRaf: null,
    highlightRestoreTimer: null,
    highlightToken: 0,
    lastScrollAt: 0,
    minimalScrollRaf: null,
    suppressEnsureVisibleUntil: 0
  };

  ns.coreTheme.initThemeApi({
    state,
    THEME_ATTRIBUTE_FILTER,
    THEME_TRANSITION_STYLE_ID,
    THEME_TRANSITION_DURATION_MS,
    THEME_TRANSITION_EASING
  });

  ns.coreUiBehavior.initBehaviorApi({
    state,
    PREVIEW_HIDE_DELAY,
    MINIMAL_MODE_KEY,
    DEFAULT_NORMAL_PANEL_WIDTH,
    PANEL_CONTENT_MIN_GAP,
    ADAPTIVE_INTERSECT_ENTER_GAP,
    ADAPTIVE_INTERSECT_EXIT_GAP,
    MESSAGE_SCAN_LIMIT,
    FULL_WIDTH_IGNORE_RATIO,
    MESSAGE_CONTENT_SELECTORS,
    MESSAGE_ROLE_SELECTORS,
    MESSAGE_INNER_SELECTORS,
    SCROLL_HIGHLIGHT_WAIT_MS,
    SCROLL_HIGHLIGHT_DURATION_MS,
    SCROLL_SETTLE_IDLE_MS,
    HIGHLIGHT_DARKEN_DELTA,
    CHATGPT_USER_BUBBLE_SELECTOR,
    GEMINI_USER_BUBBLE_SELECTOR,
    CHATGPT_USER_BUBBLE_BG,
    GEMINI_USER_BUBBLE_BG,
    scrollToMessage
  });

  const themeApi = ns.coreTheme;
  const behaviorApi = ns.coreUiBehavior;

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
    initThemeTracking();
    ns.ui.setTitle(state.ui, getNavigatorTitle());
    state.minimalMode = false;
    syncAdaptiveMode(true);
    hydrateMinimalModePreference();
    attachUiHandlers();
    initActiveTracking();
    initFabDrag();
    scheduleRebuild('init');
    startUrlPolling();
  }

  function attachUiHandlers() {
    state.ui.toggle.addEventListener('click', () => {
      ns.ui.setCollapsed(state.ui, true);
    });

    state.ui.themeToggle.addEventListener('click', (event) => {
      handleThemeToggle(event);
    });

    state.ui.minimalToggle.addEventListener('click', () => {
      syncAdaptiveMode(true);
      const nextMinimal = !state.minimalMode;
      if (!nextMinimal && state.adaptiveMinimalMode) {
        syncDisplayMode(true);
        return;
      }
      setMinimalMode(nextMinimal);
    });

    state.ui.fab.addEventListener('click', () => {
      if (state.ui.fab.dataset.suppressClick === '1') {
        state.ui.fab.dataset.suppressClick = '0';
        return;
      }
      ns.ui.setCollapsed(state.ui, false);
      syncAdaptiveMode(true);
    });

    state.ui.body.addEventListener('click', (event) => {
      const item = event.target.closest('.nav-item');
      if (!item) {
        return;
      }
      activateNavItem(item);
    });
    state.ui.body.addEventListener('keydown', handleItemKeydown);

    state.ui.body.addEventListener('pointerover', handleItemPointerOver);
    state.ui.body.addEventListener('pointerout', handleItemPointerOut);
    state.ui.body.addEventListener('focusin', handleItemFocusIn);
    state.ui.body.addEventListener('focusout', handleItemFocusOut);
    state.ui.body.addEventListener('scroll', scheduleMinimalScrollHintUpdate, { passive: true });
    state.ui.panel.addEventListener('wheel', handlePanelWheel, { passive: false });

    state.ui.preview.addEventListener('pointerenter', handlePreviewPointerEnter);
    state.ui.preview.addEventListener('pointerleave', handlePreviewPointerLeave);
    state.ui.preview.addEventListener('click', handlePreviewClick);
  }

  function handleItemKeydown(event) {
    if (!event) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    const item = event.target && event.target.closest ? event.target.closest('.nav-item') : null;
    if (!item || !state.ui.body.contains(item)) {
      return;
    }
    event.preventDefault();
    activateNavItem(item);
  }

  function activateNavItem(item) {
    if (!item) {
      return;
    }
    const index = Number(item.dataset.index);
    const message = state.messages[index];
    if (!message || !message.node) {
      return;
    }
    state.suppressEnsureVisibleUntil = Date.now() + MANUAL_NAV_SCROLL_LOCK_MS;
    setActiveIndex(index, true);
    snapNavListToEdge(index);
    scrollToMessage(message.node);
  }

  function handlePanelWheel(event) {
    if (!state.ui || !state.ui.body) {
      return;
    }
    const scroller = state.ui.body;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    if (maxScroll <= 1) {
      return;
    }
    const before = scroller.scrollTop;
    scroller.scrollTop += event.deltaY;
    if (scroller.scrollTop !== before) {
      event.preventDefault();
      scheduleMinimalScrollHintUpdate();
    }
  }

  function initFabDrag() {
    const fab = state.ui.fab;
    const storageKey = 'chatgpt-nav-fab-position';
    let dragging = false;
    let moved = false;
    let startY = 0;
    let startTop = 0;

    const initialTop = fab.getBoundingClientRect().top;
    applyFabPosition(fab, initialTop);
    loadFabPosition(storageKey).then((saved) => {
      if (!saved || typeof saved.top !== 'number') {
        return;
      }
      applyFabPosition(fab, saved.top);
    });

    window.addEventListener('resize', () => {
      const rect = fab.getBoundingClientRect();
      applyFabPosition(fab, rect.top);
    });

    fab.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      const rect = fab.getBoundingClientRect();
      dragging = true;
      moved = false;
      startY = event.clientY;
      startTop = rect.top;
      fab.classList.add('dragging');
      fab.setPointerCapture(event.pointerId);
    });

    fab.addEventListener('pointermove', (event) => {
      if (!dragging) {
        return;
      }
      const dy = event.clientY - startY;
      if (!moved && Math.abs(dy) > 3) {
        moved = true;
      }
      applyFabPosition(fab, startTop + dy);
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

  function applyFabPosition(fab, top) {
    const clampedTop = getClampedFabTop(fab, top);
    fab.style.left = 'auto';
    fab.style.top = `${clampedTop}px`;
    fab.style.right = `${FAB_RIGHT_OFFSET}px`;
    fab.style.bottom = 'auto';
  }

  function getClampedFabTop(fab, top) {
    const rect = fab.getBoundingClientRect();
    const height = rect.height > 0 ? rect.height : 48;
    const minTop = FAB_VERTICAL_PADDING;
    const maxTop = Math.max(minTop, window.innerHeight - height - FAB_VERTICAL_PADDING);
    return clamp(top, minTop, maxTop);
  }

  function saveFabPosition(key, fab) {
    const rect = fab.getBoundingClientRect();
    const payload = { top: rect.top };
    if (ns.storage && typeof ns.storage.setJson === 'function') {
      ns.storage.setJson(key, payload);
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function loadFabPosition(key) {
    const legacyValue = loadLegacyFabPosition(key);
    if (!ns.storage || typeof ns.storage.getJson !== 'function') {
      return Promise.resolve(legacyValue);
    }
    return ns.storage
      .getJson(key)
      .then((storedValue) => {
        const normalized = normalizeFabPosition(storedValue);
        if (normalized) {
          return normalized;
        }
        if (legacyValue) {
          ns.storage.setJson(key, legacyValue);
        }
        return legacyValue;
      })
      .catch(() => legacyValue);
  }

  function loadLegacyFabPosition(key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      return normalizeFabPosition(raw);
    } catch (error) {
      return null;
    }
  }

  function normalizeFabPosition(value) {
    let parsed = value;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        return null;
      }
    }
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (typeof parsed.top !== 'number') {
      return null;
    }
    return { top: parsed.top };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function initThemeTracking() {
    themeApi.initThemeTracking();
  }

  function refreshThemeTrackingTargets() {
    themeApi.refreshThemeTrackingTargets();
  }

  function scheduleThemeSync() {
    themeApi.scheduleThemeSync();
  }

  function syncColorScheme(force = false) {
    themeApi.syncColorScheme(force);
  }

  function handleThemeToggle(event) {
    themeApi.handleThemeToggle(event);
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
    refreshThemeTrackingTargets();
    syncColorScheme();
    cancelPendingBubbleHighlight();
    state.signature = '';
    state.messages = [];
    state.activeIndex = null;
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

    const root = getConversationRootForRebuild();
    if (!root) {
      return;
    }

    const sequence = getConversationSequence(root);
    const messages = buildUserMessages(sequence);
    const signature = buildMessagesSignature(messages);
    if (signature === state.signature) {
      return;
    }
    state.signature = signature;
    state.messages = messages;
    renderMessages();
    syncAdaptiveMode();
  }

  function getConversationRootForRebuild() {
    const root = state.adapter.getConversationRoot();
    if (!root) {
      scheduleRebuild('wait-root');
      return null;
    }
    if (root !== state.root) {
      state.root = root;
      attachObserver(root);
    }
    return root;
  }

  function getConversationSequence(root) {
    if (!state.adapter.getConversationMessages) {
      return [];
    }
    return state.adapter.getConversationMessages(root);
  }

  function buildUserMessages(sequence) {
    const messages = [];
    sequence.forEach((entry, index) => {
      if (entry.role !== 'user') {
        return;
      }
      messages.push(buildUserMessage(sequence, entry, index, messages.length));
    });
    return messages;
  }

  function buildUserMessage(sequence, entry, index, promptIndex) {
    const text = getUserMessageText(entry.node);
    const title = text || `Prompt ${promptIndex + 1}`;
    const assistantSummary = getAssistantSummary(sequence, index + 1);
    const preview = assistantSummary.text
      ? ns.utils.truncate(assistantSummary.text, CONFIG.previewMax)
      : '';
    return {
      node: entry.node,
      title,
      preview,
      text,
      endNode: assistantSummary.lastAssistantNode
    };
  }

  function getAssistantSummary(sequence, startIndex) {
    let assistantText = '';
    let lastAssistantNode = null;
    for (let i = startIndex; i < sequence.length; i += 1) {
      const item = sequence[i];
      if (item.role === 'assistant') {
        if (!assistantText) {
          assistantText = ns.utils.normalizeText(item.node.textContent || '');
        }
        lastAssistantNode = item.node;
        continue;
      }
      if (item.role === 'user') {
        break;
      }
    }
    return { text: assistantText, lastAssistantNode };
  }

  function buildMessagesSignature(messages) {
    const lastMessage = messages[messages.length - 1];
    const lastText = lastMessage ? lastMessage.text : '';
    const lastPreview = lastMessage ? lastMessage.preview : '';
    return `${messages.length}:${lastText}:${lastPreview}`;
  }

  function getUserMessageText(node) {
    if (!node) {
      return '';
    }
    if (state.adapter && state.adapter.id === 'gemini' && ns.utils.getTextWithoutHidden) {
      const visibleText = ns.utils.getTextWithoutHidden(node);
      if (visibleText) {
        return visibleText;
      }
    }
    return ns.utils.normalizeText(node.textContent || '');
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
    state.lastScrollAt = Date.now();
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    flashTarget(node);
  }

  function flashTarget(node) {
    behaviorApi.flashTarget(node);
  }

  function cancelPendingBubbleHighlight() {
    behaviorApi.cancelPendingBubbleHighlight();
  }

  function getNavigatorTitle() {
    return behaviorApi.getNavigatorTitle();
  }

  function renderMessages() {
    behaviorApi.renderMessages();
  }

  function scheduleMinimalScrollHintUpdate() {
    behaviorApi.scheduleMinimalScrollHintUpdate();
  }

  function syncDisplayMode(forceRender = false) {
    behaviorApi.syncDisplayMode(forceRender);
  }

  function setMinimalMode(enabled) {
    behaviorApi.setMinimalMode(enabled);
  }

  function syncAdaptiveMode(force = false) {
    behaviorApi.syncAdaptiveMode(force);
  }

  function loadMinimalMode() {
    return behaviorApi.loadMinimalMode();
  }

  function hydrateMinimalModePreference() {
    Promise.resolve(loadMinimalMode()).then((storedValue) => {
      if (typeof storedValue !== 'boolean') {
        return;
      }
      if (storedValue === state.minimalMode) {
        return;
      }
      state.minimalMode = storedValue;
      syncAdaptiveMode(true);
    });
  }

  function handleItemPointerOver(event) {
    behaviorApi.handleItemPointerOver(event);
  }

  function handleItemPointerOut(event) {
    behaviorApi.handleItemPointerOut(event);
  }

  function handleItemFocusIn(event) {
    behaviorApi.handleItemFocusIn(event);
  }

  function handleItemFocusOut(event) {
    behaviorApi.handleItemFocusOut(event);
  }

  function handlePreviewPointerEnter() {
    behaviorApi.handlePreviewPointerEnter();
  }

  function handlePreviewPointerLeave(event) {
    behaviorApi.handlePreviewPointerLeave(event);
  }

  function handlePreviewClick() {
    behaviorApi.handlePreviewClick();
  }

  function initActiveTracking() {
    behaviorApi.initActiveTracking();
  }

  function setActiveIndex(nextIndex, force = false) {
    behaviorApi.setActiveIndex(nextIndex, force);
  }

  function snapNavListToEdge(index) {
    behaviorApi.snapNavListToEdge(index);
  }

  ns.core = {
    start
  };
})();
