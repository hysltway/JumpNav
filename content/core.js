(() => {
  'use strict';

  const ns = window.ChatGptNav;
  const { CONFIG } = ns;
  const PREVIEW_HIDE_DELAY = 140;
  const MINIMAL_MODE_KEY = 'chatgpt-nav-minimal-mode';
  const DEFAULT_NORMAL_PANEL_WIDTH = 280;
  const ADAPTIVE_INTERSECT_ENTER_GAP = 6;
  const ADAPTIVE_INTERSECT_EXIT_GAP = 28;
  const MESSAGE_SCAN_LIMIT = 80;
  const FULL_WIDTH_IGNORE_RATIO = 0.9;
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
    normalPanelWidth: DEFAULT_NORMAL_PANEL_WIDTH
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
      const text = ns.utils.normalizeText(entry.node.textContent || '');
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
    // Use hysteresis to avoid mode jitter around the overlap boundary.
    const gap = state.adaptiveMinimalMode
      ? ADAPTIVE_INTERSECT_EXIT_GAP
      : ADAPTIVE_INTERSECT_ENTER_GAP;
    return panelLeftForOverlap <= messageRight + gap;
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
    state.previewIndex = index;
    ns.ui.showPreview(state.ui, message, item);
  }

  function initActiveTracking() {
    const scheduleActiveUpdate = () => {
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
