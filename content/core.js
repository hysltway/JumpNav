(() => {
  'use strict';

  const ns = window.ChatGptNav;
  const { CONFIG } = ns;
  const PREVIEW_HIDE_DELAY = 140;
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
    lastScrollAt: 0
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
    initThemeTracking();
    ns.ui.setTitle(state.ui, getNavigatorTitle());
    state.minimalMode = loadMinimalMode();
    syncAdaptiveMode(true);
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
      const index = Number(item.dataset.index);
      const message = state.messages[index];
      if (!message || !message.node) {
        return;
      }
      setActiveIndex(index, true);
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
    let startY = 0;
    let startTop = 0;

    const saved = loadFabPosition(storageKey);
    const initialTop =
      saved && typeof saved.top === 'number'
        ? saved.top
        : fab.getBoundingClientRect().top;
    applyFabPosition(fab, initialTop);

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
      if (typeof parsed.top === 'number') {
        return { top: parsed.top };
      }
      if (typeof parsed.left === 'number' && typeof parsed.top === 'number') {
        return { top: parsed.top };
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function initThemeTracking() {
    syncColorScheme(true);
    if (state.themeObserver) {
      state.themeObserver.disconnect();
    }
    state.themeObserver = new MutationObserver(() => {
      scheduleThemeSync();
    });
    refreshThemeTrackingTargets();

    if (typeof window.matchMedia !== 'function') {
      return;
    }
    if (state.themeMql && state.themeMqlHandler) {
      removeThemeMediaListener(state.themeMql, state.themeMqlHandler);
    }
    state.themeMql = window.matchMedia('(prefers-color-scheme: dark)');
    state.themeMqlHandler = () => {
      scheduleThemeSync();
    };
    addThemeMediaListener(state.themeMql, state.themeMqlHandler);
  }

  function refreshThemeTrackingTargets() {
    if (!state.themeObserver) {
      return;
    }
    state.themeObserver.disconnect();
    if (document.documentElement) {
      state.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: THEME_ATTRIBUTE_FILTER
      });
    }
    if (document.body) {
      state.themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: THEME_ATTRIBUTE_FILTER
      });
    }
  }

  function scheduleThemeSync() {
    if (state.themeRaf) {
      return;
    }
    state.themeRaf = window.requestAnimationFrame(() => {
      state.themeRaf = null;
      syncColorScheme();
    });
  }

  function syncColorScheme(force = false) {
    if (!state.ui) {
      return;
    }
    const nextScheme = detectSiteColorScheme();
    if (!force && nextScheme === state.colorScheme) {
      return;
    }
    state.colorScheme = nextScheme;
    if (ns.ui.setColorScheme) {
      ns.ui.setColorScheme(state.ui, nextScheme);
    }
  }

  function detectSiteColorScheme() {
    const adapterId = state.adapter ? state.adapter.id : '';
    if (adapterId === 'chatgpt') {
      return detectChatGptColorScheme() || 'light';
    }
    if (adapterId === 'gemini') {
      return detectGeminiColorScheme() || 'light';
    }
    return 'light';
  }

  function detectChatGptColorScheme() {
    const root = document.documentElement;
    if (!root || !root.classList) {
      return null;
    }
    if (root.classList.contains('dark')) {
      return 'dark';
    }
    if (root.classList.contains('light')) {
      return 'light';
    }
    return null;
  }

  function detectGeminiColorScheme() {
    const body = document.body;
    if (!body || typeof window.getComputedStyle !== 'function') {
      return null;
    }
    try {
      const style = window.getComputedStyle(body);
      const colorScheme = style.colorScheme || style.getPropertyValue('color-scheme');
      if (typeof colorScheme !== 'string') {
        return null;
      }
      const value = colorScheme.trim().toLowerCase();
      if (!value) {
        return null;
      }
      if (value.includes('dark')) {
        return 'dark';
      }
      if (value.includes('light')) {
        return 'light';
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  function addThemeMediaListener(mql, handler) {
    if (!mql || !handler) {
      return;
    }
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return;
    }
    if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
    }
  }

  function removeThemeMediaListener(mql, handler) {
    if (!mql || !handler) {
      return;
    }
    if (typeof mql.removeEventListener === 'function') {
      mql.removeEventListener('change', handler);
      return;
    }
    if (typeof mql.removeListener === 'function') {
      mql.removeListener(handler);
    }
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
      const text = getUserMessageText(entry.node);
      const title = text || `Prompt ${messages.length + 1}`;
      let assistantText = '';
      let lastAssistantNode = null;
      for (let i = index + 1; i < sequence.length; i += 1) {
        if (sequence[i].role === 'assistant') {
          if (!assistantText) {
            assistantText = ns.utils.normalizeText(sequence[i].node.textContent || '');
          }
          lastAssistantNode = sequence[i].node;
          continue;
        }
        if (sequence[i].role === 'user') {
          break;
        }
      }
      const preview = assistantText ? ns.utils.truncate(assistantText, CONFIG.previewMax) : '';
      messages.push({ node: entry.node, title, preview, text, endNode: lastAssistantNode });
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
    syncAdaptiveMode();
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
    const bubble = getUserBubbleNode(node);
    if (!bubble) {
      return;
    }
    scheduleBubbleHighlightWhenVisible(bubble);
  }

  function getUserBubbleNode(node) {
    if (!node) {
      return null;
    }
    const selector = getUserBubbleSelector();
    if (!selector) {
      return null;
    }
    if (typeof node.matches === 'function' && node.matches(selector)) {
      return node;
    }
    if (typeof node.closest === 'function') {
      const ancestor = node.closest(selector);
      if (ancestor) {
        return ancestor;
      }
    }
    if (typeof node.querySelector === 'function') {
      return node.querySelector(selector);
    }
    return null;
  }

  function getUserBubbleSelector() {
    const adapterId = state.adapter ? state.adapter.id : '';
    if (adapterId === 'chatgpt') {
      return CHATGPT_USER_BUBBLE_SELECTOR;
    }
    if (adapterId === 'gemini') {
      return GEMINI_USER_BUBBLE_SELECTOR;
    }
    return '';
  }

  function scheduleBubbleHighlightWhenVisible(bubble) {
    cancelPendingBubbleHighlight();
    const token = state.highlightToken + 1;
    state.highlightToken = token;
    const startAt = Date.now();

    const poll = () => {
      if (state.highlightToken !== token) {
        return;
      }
      if (!bubble || !bubble.isConnected) {
        return;
      }
      if (isElementVisibleInViewport(bubble) && hasScrollSettled()) {
        runBubbleHighlight(bubble);
        return;
      }
      if (Date.now() - startAt > SCROLL_HIGHLIGHT_WAIT_MS) {
        return;
      }
      state.highlightRaf = window.requestAnimationFrame(poll);
    };

    state.highlightRaf = window.requestAnimationFrame(poll);
  }

  function cancelPendingBubbleHighlight() {
    if (state.highlightRaf) {
      window.cancelAnimationFrame(state.highlightRaf);
      state.highlightRaf = null;
    }
    if (state.highlightRestoreTimer) {
      window.clearTimeout(state.highlightRestoreTimer);
      state.highlightRestoreTimer = null;
    }
  }

  function hasScrollSettled() {
    if (!state.lastScrollAt) {
      return true;
    }
    return Date.now() - state.lastScrollAt >= SCROLL_SETTLE_IDLE_MS;
  }

  function isElementVisibleInViewport(node) {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return false;
    }
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    return rect.bottom > 8 && rect.top < viewportHeight - 8 && rect.right > 8 && rect.left < viewportWidth - 8;
  }

  function runBubbleHighlight(node) {
    if (!node) {
      return;
    }
    cancelPendingBubbleHighlight();
    const baseColor = getBubbleBaseColor(node);
    const activeColor = getDarkenedColor(baseColor);
    if (typeof node.animate === 'function') {
      node.animate(
        [
          { backgroundColor: baseColor },
          { backgroundColor: activeColor, offset: 0.42 },
          { backgroundColor: baseColor }
        ],
        { duration: SCROLL_HIGHLIGHT_DURATION_MS, easing: 'ease-out' }
      );
      return;
    }

    const prevBackground = node.style.backgroundColor;
    node.style.backgroundColor = activeColor;
    state.highlightRestoreTimer = window.setTimeout(() => {
      node.style.backgroundColor = prevBackground;
      state.highlightRestoreTimer = null;
    }, SCROLL_HIGHLIGHT_DURATION_MS);
  }

  function getBubbleBaseColor(node) {
    const fallback = getBubbleFallbackColor();
    if (!node || typeof window.getComputedStyle !== 'function') {
      return fallback;
    }
    try {
      const background = window.getComputedStyle(node).backgroundColor;
      const parsed = parseRgbaColor(background);
      if (!parsed || parsed.a <= 0.02) {
        return fallback;
      }
      return background;
    } catch (error) {
      return fallback;
    }
  }

  function getBubbleFallbackColor() {
    const adapterId = state.adapter ? state.adapter.id : '';
    if (adapterId === 'gemini') {
      return GEMINI_USER_BUBBLE_BG;
    }
    return CHATGPT_USER_BUBBLE_BG;
  }

  function getDarkenedColor(color) {
    const parsed = parseRgbaColor(color);
    if (!parsed) {
      return color;
    }
    const r = clampColorChannel(parsed.r - HIGHLIGHT_DARKEN_DELTA);
    const g = clampColorChannel(parsed.g - HIGHLIGHT_DARKEN_DELTA);
    const b = clampColorChannel(parsed.b - HIGHLIGHT_DARKEN_DELTA);
    const alpha = parsed.a < 1 ? Math.min(1, parsed.a + 0.2) : 1;
    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  function parseRgbaColor(color) {
    if (typeof color !== 'string') {
      return null;
    }
    const match = color.trim().match(/^rgba?\(([^)]+)\)$/i);
    if (!match) {
      return null;
    }
    const parts = match[1].split(',').map((part) => part.trim());
    if (parts.length < 3) {
      return null;
    }
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts.length >= 4 ? Number(parts[3]) : 1;
    if (![r, g, b, a].every((value) => Number.isFinite(value))) {
      return null;
    }
    return {
      r: clampColorChannel(r),
      g: clampColorChannel(g),
      b: clampColorChannel(b),
      a: Math.min(Math.max(a, 0), 1)
    };
  }

  function clampColorChannel(value) {
    return Math.min(Math.max(Math.round(value), 0), 255);
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
    ns.ui.renderList(state.ui, state.messages, { minimalMode: state.effectiveMinimalMode });
    refreshActiveIndex(true);
  }

  function setMinimalMode(enabled) {
    state.minimalMode = enabled;
    saveMinimalMode(enabled);
    syncDisplayMode(true);
  }

  function isMinimalMode() {
    return state.minimalMode || state.adaptiveMinimalMode;
  }

  function shouldEnableAdaptiveMinimal() {
    if (!state.ui || !state.ui.panel || !state.root) {
      return false;
    }
    if (state.ui.root.dataset.collapsed === '1') {
      return false;
    }
    const panelRect = state.ui.panel.getBoundingClientRect();
    if (panelRect.width === 0 || panelRect.height === 0) {
      return false;
    }
    const messageRight = getConversationRightBoundary();
    if (!Number.isFinite(messageRight)) {
      return false;
    }
    const panelLeftForOverlap = getPanelLeftForAdaptiveCheck(panelRect);
    if (!Number.isFinite(panelLeftForOverlap)) {
      return false;
    }
    // Keep a consistent gap between panel and content, with hysteresis to avoid jitter.
    const hysteresisGap = state.adaptiveMinimalMode
      ? ADAPTIVE_INTERSECT_EXIT_GAP
      : ADAPTIVE_INTERSECT_ENTER_GAP;
    return panelLeftForOverlap <= messageRight + PANEL_CONTENT_MIN_GAP + hysteresisGap;
  }

  function getPanelLeftForAdaptiveCheck(panelRect) {
    if (!panelRect || !Number.isFinite(panelRect.right)) {
      return null;
    }
    const normalWidth = getNormalPanelWidth(panelRect);
    if (!Number.isFinite(normalWidth) || normalWidth <= 0) {
      return panelRect.left;
    }
    return panelRect.right - normalWidth;
  }

  function getNormalPanelWidth(panelRect) {
    if (!state.effectiveMinimalMode && panelRect && Number.isFinite(panelRect.width)) {
      if (panelRect.width > 0) {
        state.normalPanelWidth = panelRect.width;
      }
    }
    if (Number.isFinite(state.normalPanelWidth) && state.normalPanelWidth > 0) {
      return state.normalPanelWidth;
    }
    return DEFAULT_NORMAL_PANEL_WIDTH;
  }

  function getConversationRightBoundary() {
    const trackedRight = getTrackedMessagesRightBoundary();
    if (Number.isFinite(trackedRight)) {
      return trackedRight;
    }
    const scope = state.root || document;
    if (!scope || typeof scope.querySelectorAll !== 'function') {
      return null;
    }
    const primaryNodes = scope.querySelectorAll(MESSAGE_CONTENT_SELECTORS);
    const primaryRight = getMaxMessageRight(primaryNodes, false);
    if (Number.isFinite(primaryRight)) {
      return primaryRight;
    }
    const fallbackNodes = scope.querySelectorAll(MESSAGE_ROLE_SELECTORS);
    return getMaxMessageRight(fallbackNodes, true);
  }

  function getTrackedMessagesRightBoundary() {
    if (!Array.isArray(state.messages) || !state.messages.length) {
      return null;
    }
    const nodes = [];
    const seen = new Set();
    state.messages.forEach((message) => {
      if (message && message.node && !seen.has(message.node)) {
        seen.add(message.node);
        nodes.push(message.node);
      }
      if (message && message.endNode && !seen.has(message.endNode)) {
        seen.add(message.endNode);
        nodes.push(message.endNode);
      }
    });
    return getMaxMessageRight(nodes, true);
  }

  function getMaxMessageRight(nodes, useInnerContent) {
    if (!nodes || !nodes.length) {
      return null;
    }
    const viewportBottom = window.innerHeight || 0;
    const viewportWidth = window.innerWidth || 0;
    let maxVisibleRight = -Infinity;
    let visibleCount = 0;
    let maxAnyRight = -Infinity;
    let sampledCount = 0;

    for (const node of nodes) {
      if (!node || typeof node.getBoundingClientRect !== 'function') {
        continue;
      }
      const target = useInnerContent ? getMessageContentNode(node) : node;
      if (!target || typeof target.getBoundingClientRect !== 'function') {
        continue;
      }
      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        continue;
      }
      if (viewportWidth > 0 && rect.width >= viewportWidth * FULL_WIDTH_IGNORE_RATIO) {
        continue;
      }

      if (sampledCount < MESSAGE_SCAN_LIMIT) {
        maxAnyRight = Math.max(maxAnyRight, rect.right);
        sampledCount += 1;
      }

      const isVisible = rect.bottom > -120 && rect.top < viewportBottom + 120;
      if (!isVisible) {
        continue;
      }
      maxVisibleRight = Math.max(maxVisibleRight, rect.right);
      visibleCount += 1;
      if (visibleCount >= MESSAGE_SCAN_LIMIT) {
        break;
      }
    }

    if (Number.isFinite(maxVisibleRight)) {
      return maxVisibleRight;
    }
    if (Number.isFinite(maxAnyRight)) {
      return maxAnyRight;
    }
    return null;
  }

  function getMessageContentNode(node) {
    if (!node || typeof node.matches !== 'function') {
      return null;
    }
    if (node.matches(MESSAGE_INNER_SELECTORS)) {
      return node;
    }
    if (typeof node.querySelector !== 'function') {
      return node;
    }
    return node.querySelector(MESSAGE_INNER_SELECTORS) || node;
  }

  function syncAdaptiveMode(force = false) {
    const nextValue = shouldEnableAdaptiveMinimal();
    const changed = nextValue !== state.adaptiveMinimalMode;
    if (!force && !changed) {
      return;
    }
    state.adaptiveMinimalMode = nextValue;
    if (ns.ui.setAdaptiveMinimal) {
      ns.ui.setAdaptiveMinimal(state.ui, state.adaptiveMinimalMode);
    }
    syncDisplayMode(force || changed);
  }

  function syncDisplayMode(forceRender = false) {
    const nextMode = isMinimalMode();
    const changed = nextMode !== state.effectiveMinimalMode;
    if (!forceRender && !changed) {
      return;
    }
    state.effectiveMinimalMode = nextMode;
    ns.ui.setMinimalMode(state.ui, nextMode);
    renderMessages();
  }

  function refreshPreviewPosition() {
    if (!isMinimalMode()) {
      return;
    }
    if (typeof state.previewIndex !== 'number') {
      return;
    }
    const item = state.ui.body.querySelector(`.nav-item[data-index="${state.previewIndex}"]`);
    if (!item) {
      return;
    }
    showPreviewForItem(item);
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
    if (!isMinimalMode()) {
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
    if (!isMinimalMode()) {
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
    if (!isMinimalMode()) {
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
    if (!isMinimalMode()) {
      return;
    }
    const item = event.target.closest('.nav-item');
    if (!item || !state.ui.body.contains(item)) {
      return;
    }
    schedulePreviewHide();
  }

  function handlePreviewPointerEnter() {
    if (!isMinimalMode()) {
      return;
    }
    clearPreviewHideTimer();
  }

  function handlePreviewPointerLeave(event) {
    if (!isMinimalMode()) {
      return;
    }
    const related = event.relatedTarget;
    if (related && related.closest && related.closest('.nav-item')) {
      return;
    }
    schedulePreviewHide();
  }

  function handlePreviewClick() {
    if (!isMinimalMode()) {
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
    const trackedRight = getTrackedMessagesRightBoundary();
    const contentRight = Number.isFinite(trackedRight) ? trackedRight : getConversationRightBoundary();
    state.previewIndex = index;
    ns.ui.showPreview(state.ui, message, item, { contentRight });
  }

  function initActiveTracking() {
    const scheduleActiveUpdate = () => {
      state.lastScrollAt = Date.now();
      if (state.activeRaf) {
        return;
      }
      state.activeRaf = window.requestAnimationFrame(() => {
        state.activeRaf = null;
        refreshActiveIndex();
      });
    };
    const scheduleViewportUpdate = () => {
      if (state.activeRaf) {
        return;
      }
      state.activeRaf = window.requestAnimationFrame(() => {
        state.activeRaf = null;
        syncAdaptiveMode();
        refreshActiveIndex();
        refreshPreviewPosition();
      });
    };
    document.addEventListener('scroll', scheduleActiveUpdate, true);
    window.addEventListener('resize', scheduleViewportUpdate);
  }

  function refreshActiveIndex(force = false) {
    const nextIndex = getActiveIndex();
    setActiveIndex(nextIndex, force);
  }

  function setActiveIndex(nextIndex, force = false) {
    if (!force && nextIndex === state.activeIndex) {
      return;
    }
    state.activeIndex = nextIndex;
    ns.ui.setActiveIndex(state.ui, nextIndex);
  }

  function getActiveIndex() {
    if (!state.messages.length) {
      return null;
    }
    const targetY = window.innerHeight / 2;
    const viewportBottom = window.innerHeight;
    let containingIndex = null;
    let nearestVisibleIndex = null;
    let nearestVisibleDistance = Infinity;
    let nearestIndex = null;
    let nearestDistance = Infinity;

    state.messages.forEach((message, index) => {
      if (!message.node || typeof message.node.getBoundingClientRect !== 'function') {
        return;
      }
      const startRect = message.node.getBoundingClientRect();
      if (startRect.width === 0 && startRect.height === 0) {
        return;
      }
      let endRect = startRect;
      if (message.endNode && typeof message.endNode.getBoundingClientRect === 'function') {
        const candidate = message.endNode.getBoundingClientRect();
        if (!(candidate.width === 0 && candidate.height === 0)) {
          endRect = candidate;
        }
      }
      const blockTop = Math.min(startRect.top, endRect.top);
      const blockBottom = Math.max(startRect.bottom, endRect.bottom);
      const blockCenter = (blockTop + blockBottom) / 2;
      const distance = Math.abs(blockCenter - targetY);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
      const isVisible = blockBottom > 0 && blockTop < viewportBottom;
      if (!isVisible) {
        return;
      }
      if (blockTop <= targetY && blockBottom >= targetY) {
        containingIndex = index;
      }
      if (distance < nearestVisibleDistance) {
        nearestVisibleDistance = distance;
        nearestVisibleIndex = index;
      }
    });

    if (containingIndex !== null) {
      return containingIndex;
    }
    if (nearestVisibleIndex !== null) {
      return nearestVisibleIndex;
    }
    return nearestIndex !== null ? nearestIndex : state.activeIndex;
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
