(() => {
  'use strict';

  const ns = window.ChatGptNav;
  let state;
  let PREVIEW_HIDE_DELAY;
  let MINIMAL_MODE_KEY;
  let DEFAULT_NORMAL_PANEL_WIDTH;
  let PANEL_CONTENT_MIN_GAP;
  let ADAPTIVE_INTERSECT_ENTER_GAP;
  let ADAPTIVE_INTERSECT_EXIT_GAP;
  let MESSAGE_SCAN_LIMIT;
  let FULL_WIDTH_IGNORE_RATIO;
  let MESSAGE_CONTENT_SELECTORS;
  let MESSAGE_ROLE_SELECTORS;
  let MESSAGE_INNER_SELECTORS;
  let SCROLL_HIGHLIGHT_WAIT_MS;
  let SCROLL_HIGHLIGHT_DURATION_MS;
  let SCROLL_SETTLE_IDLE_MS;
  let HIGHLIGHT_DARKEN_DELTA;
  let CHATGPT_USER_BUBBLE_SELECTOR;
  let GEMINI_USER_BUBBLE_SELECTOR;
  let CHATGPT_USER_BUBBLE_BG;
  let GEMINI_USER_BUBBLE_BG;
  let scrollToMessage;
  let cachedConversationScrollContainer = null;
  let cachedConversationScrollRoot = null;

  function initBehaviorApi(ctx) {
    ({
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
    } = ctx);
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
    scheduleMinimalScrollHintUpdate();
  }

  function scheduleMinimalScrollHintUpdate() {
    if (state.minimalScrollRaf) {
      return;
    }
    state.minimalScrollRaf = window.requestAnimationFrame(() => {
      state.minimalScrollRaf = null;
      syncMinimalScrollHintState();
    });
  }

  function syncMinimalScrollHintState() {
    if (!state.ui || !state.ui.body || !state.ui.bodyWrap) {
      return;
    }
    if (!state.effectiveMinimalMode) {
      setMinimalScrollHintState(false, false, false);
      return;
    }

    const scroller = state.ui.body;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    if (maxScroll <= 1) {
      setMinimalScrollHintState(false, false, false);
      return;
    }

    const top = scroller.scrollTop;
    const showTopHint = top > 1;
    const showBottomHint = top < maxScroll - 1;
    setMinimalScrollHintState(true, showTopHint, showBottomHint);
  }

  function setMinimalScrollHintState(scrollable, showTopHint, showBottomHint) {
    if (!state.ui || !state.ui.bodyWrap) {
      return;
    }
    state.ui.bodyWrap.dataset.scrollable = scrollable ? '1' : '0';
    state.ui.bodyWrap.dataset.scrollTop = showTopHint ? '1' : '0';
    state.ui.bodyWrap.dataset.scrollBottom = showBottomHint ? '1' : '0';
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
    scheduleMinimalScrollHintUpdate();
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
    const legacyValue = loadLegacyMinimalMode();
    if (!ns.storage || typeof ns.storage.getBoolean !== 'function') {
      return Promise.resolve(legacyValue);
    }
    return ns.storage
      .getBoolean(MINIMAL_MODE_KEY)
      .then((storedValue) => {
        if (typeof storedValue === 'boolean') {
          return storedValue;
        }
        ns.storage.setBoolean(MINIMAL_MODE_KEY, legacyValue);
        return legacyValue;
      })
      .catch(() => legacyValue);
  }

  function loadLegacyMinimalMode() {
    try {
      return window.localStorage.getItem(MINIMAL_MODE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function saveMinimalMode(value) {
    if (ns.storage && typeof ns.storage.setBoolean === 'function') {
      ns.storage.setBoolean(MINIMAL_MODE_KEY, value);
    }
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
        scheduleMinimalScrollHintUpdate();
      });
    };
    document.addEventListener('scroll', scheduleActiveUpdate, true);
    window.addEventListener('resize', scheduleViewportUpdate);
  }

  function refreshActiveIndex(force = false) {
    const nextIndex = getActiveIndex();
    setActiveIndex(nextIndex, force);
    syncNavScrollWithViewportEdge(nextIndex);
  }

  function setActiveIndex(nextIndex, force = false) {
    if (!force && nextIndex === state.activeIndex) {
      return;
    }
    state.activeIndex = nextIndex;
    ns.ui.setActiveIndex(state.ui, nextIndex);
    ensureActiveItemVisible(nextIndex);
  }

  function ensureActiveItemVisible(index) {
    if (!state.ui || !state.ui.body || !Number.isFinite(index)) {
      return;
    }
    if (Date.now() < state.suppressEnsureVisibleUntil) {
      return;
    }
    const item = state.ui.body.querySelector(`.nav-item[data-index="${index}"]`);
    if (!item) {
      return;
    }
    const scroller = state.ui.body;
    const containerRect = scroller.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const edgePadding = Math.min(56, Math.max(20, Math.floor(containerRect.height * 0.16)));
    const safeTop = containerRect.top + edgePadding;
    const safeBottom = containerRect.bottom - edgePadding;
    const itemAbove = itemRect.top < safeTop;
    const itemBelow = itemRect.bottom > safeBottom;
    if (itemAbove) {
      scroller.scrollTop -= safeTop - itemRect.top;
      scheduleMinimalScrollHintUpdate();
      return;
    }
    if (itemBelow) {
      scroller.scrollTop += itemRect.bottom - safeBottom;
      scheduleMinimalScrollHintUpdate();
    }
  }

  function snapNavListToEdge(index) {
    if (!state.ui || !state.ui.body || !Number.isFinite(index)) {
      return;
    }
    const lastIndex = state.messages.length - 1;
    if (lastIndex < 0) {
      return;
    }
    if (index === 0) {
      state.ui.body.scrollTop = 0;
      scheduleMinimalScrollHintUpdate();
      return;
    }
    if (index === lastIndex) {
      state.ui.body.scrollTop = state.ui.body.scrollHeight;
      scheduleMinimalScrollHintUpdate();
    }
  }

  function getActiveIndex() {
    if (!state.messages.length) {
      return null;
    }
    if (isViewportNearConversationEnd()) {
      return state.messages.length - 1;
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

  function syncNavScrollWithViewportEdge(activeIndex) {
    if (!state.ui || !state.ui.body || !state.messages.length || !Number.isFinite(activeIndex)) {
      return;
    }
    const lastIndex = state.messages.length - 1;
    if (activeIndex !== lastIndex || !isViewportNearConversationEnd()) {
      return;
    }
    state.ui.body.scrollTop = state.ui.body.scrollHeight;
    scheduleMinimalScrollHintUpdate();
  }

  function isViewportNearConversationEnd() {
    if (!state.messages.length) {
      return false;
    }
    const lastMessage = state.messages[state.messages.length - 1];
    const targetNode = lastMessage && (lastMessage.endNode || lastMessage.node);
    if (!targetNode || typeof targetNode.getBoundingClientRect !== 'function') {
      return false;
    }
    const rect = targetNode.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }
    const scrollContainer = resolveConversationScrollContainer(targetNode);
    if (!isScrollContainerNearBottom(scrollContainer)) {
      return false;
    }
    const viewportBottom = window.innerHeight || 0;
    const bottomTolerance = 16;
    return rect.bottom <= viewportBottom + bottomTolerance;
  }

  function resolveConversationScrollContainer(anchorNode) {
    const root = state.root || anchorNode || null;
    if (
      cachedConversationScrollContainer &&
      cachedConversationScrollRoot === root &&
      cachedConversationScrollContainer.isConnected
    ) {
      return cachedConversationScrollContainer;
    }

    const fallback = document.scrollingElement || document.documentElement;
    const container = findScrollableAncestor(anchorNode) || findScrollableAncestor(root) || fallback;
    cachedConversationScrollContainer = container;
    cachedConversationScrollRoot = root;
    return container;
  }

  function findScrollableAncestor(startNode) {
    if (!startNode || typeof startNode !== 'object') {
      return null;
    }
    let node = startNode.nodeType === 1 ? startNode : startNode.parentElement;
    while (node && node !== document.documentElement) {
      if (isElementScrollable(node)) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function isElementScrollable(node) {
    if (!node || typeof node.scrollHeight !== 'number' || typeof node.clientHeight !== 'number') {
      return false;
    }
    if (node.scrollHeight <= node.clientHeight + 1) {
      return false;
    }
    if (typeof window.getComputedStyle !== 'function') {
      return false;
    }
    const overflowY = window.getComputedStyle(node).overflowY;
    return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  }

  function isScrollContainerNearBottom(container) {
    const target = container || document.scrollingElement || document.documentElement;
    if (!target) {
      return false;
    }
    const scrollHeight = target.scrollHeight || 0;
    const clientHeight = target.clientHeight || 0;
    if (scrollHeight <= clientHeight + 1) {
      return true;
    }
    const scrollTop = target.scrollTop || 0;
    const remaining = scrollHeight - clientHeight - scrollTop;
    const tolerance = 6;
    return remaining <= tolerance;
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


  ns.coreUiBehavior = {
    initBehaviorApi,
    flashTarget,
    cancelPendingBubbleHighlight,
    getNavigatorTitle,
    renderMessages,
    scheduleMinimalScrollHintUpdate,
    syncDisplayMode,
    syncAdaptiveMode,
    setMinimalMode,
    loadMinimalMode,
    handleItemPointerOver,
    handleItemPointerOut,
    handleItemFocusIn,
    handleItemFocusOut,
    handlePreviewPointerEnter,
    handlePreviewPointerLeave,
    handlePreviewClick,
    showPreviewForItem,
    initActiveTracking,
    refreshActiveIndex,
    setActiveIndex,
    snapNavListToEdge,
    clearPreviewHideTimer
  };
})();
