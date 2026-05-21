import { ns } from './namespace';
import type {
  Adapter,
  ColorScheme,
  ConversationIndexerApi,
  ConversationMessage,
  CoreNavigationControllerApi,
  CoreState,
  CoreThemeApi,
  CoreUiBehaviorApi,
  NavigationCallbacks,
  UiHandle
} from './types';

const { CONFIG } = ns;

  const PREVIEW_HIDE_DELAY = 140;
  const MANUAL_NAV_SCROLL_LOCK_MS = 1800;
  const MINIMAL_MODE_KEY = 'chatgpt-nav-minimal-mode';
  const COLLAPSED_MODE_KEY = 'chatgpt-nav-collapsed';
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
    "[data-testid='user-message']",
    '.font-claude-response',
    'user-query.ng-star-inserted',
    '.user-query.ng-star-inserted'
  ].join(',');
  const MESSAGE_ROLE_SELECTORS = [
    '[data-message-author-role="assistant"]',
    '[data-message-author-role="user"]',
    '[data-author-role="assistant"]',
    '[data-author-role="user"]',
    "[data-testid='user-message']",
    '.font-claude-response',
    'user-query.ng-star-inserted',
    '.user-query.ng-star-inserted'
  ].join(',');
  const MESSAGE_INNER_SELECTORS =
    '.min-h-8.text-message, .text-message, [class*="text-message"], .query-text, .markdown, .prose, .whitespace-pre-wrap, .font-claude-response-body';
  const THEME_ATTRIBUTE_FILTER = ['class', 'style', 'data-mode'];
  const SCROLL_HIGHLIGHT_WAIT_MS = 2600;
  const SCROLL_HIGHLIGHT_DURATION_MS = 820;
  const SCROLL_SETTLE_IDLE_MS = 180;
  const HIGHLIGHT_DARKEN_DELTA = 24;
  const CHATGPT_USER_BUBBLE_SELECTOR = '[class*="user-message-bubble-color"]';
  const GEMINI_USER_BUBBLE_SELECTOR = '.user-query-bubble-with-background';
  const CLAUDE_USER_BUBBLE_SELECTOR = '.group.relative.inline-flex.bg-bg-300.rounded-xl';
  const CHATGPT_USER_BUBBLE_BG = 'rgba(233, 233, 233, 0.5)';
  const GEMINI_USER_BUBBLE_BG = 'rgb(233, 238, 246)';
  const CLAUDE_USER_BUBBLE_BG = 'rgb(228, 232, 240)';
  const THEME_TRANSITION_STYLE_ID = 'chatgpt-nav-theme-transition-style';
  const THEME_TRANSITION_DURATION_MS = 520;
  const THEME_TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const CHATGPT_MESSAGE_TARGET_SELECTOR =
    '[data-testid="collapsible-user-message-content"], [class*="user-message-bubble-color"], [data-message-author-role="user"], [data-author-role="user"]';
  const CHATGPT_TURN_ANCHOR_SELECTOR =
    'section[data-turn], [data-turn-id-container], [data-turn-id], [data-testid^="conversation-turn"]';
  const CHATGPT_RESPONSE_ROOT_SELECTOR = '#thread, main#main';
  const CHATGPT_REMOUNT_WAIT_MS = 1500;
  const CHATGPT_REMOUNT_POLL_MS = 60;

  const state: CoreState = {
    started: false,
    adapter: null,
    url: location.href,
    root: null,
    observer: null,
    messages: [],
    signature: '',
    conversationIndexReady: false,
    conversationIndexUrl: '',
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
    colorScheme: 'light' as ColorScheme,
    themeObserver: null,
    themeRaf: null,
    themeMql: null,
    themeMqlHandler: null,
    highlightRaf: null,
    highlightRestoreTimer: null,
    highlightToken: 0,
    lastScrollAt: 0,
    minimalScrollRaf: null,
    suppressEnsureVisibleUntil: 0,
    manualModeOverride: false
  };

  const themeApi = ns.coreTheme as CoreThemeApi;
  const behaviorApi = ns.coreUiBehavior as CoreUiBehaviorApi;
  const navigationControllerApi = ns.coreNavigationController as CoreNavigationControllerApi | undefined;

  themeApi.initThemeApi({
    state,
    THEME_ATTRIBUTE_FILTER,
    THEME_TRANSITION_STYLE_ID,
    THEME_TRANSITION_DURATION_MS,
    THEME_TRANSITION_EASING
  });

  behaviorApi.initBehaviorApi({
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
    CLAUDE_USER_BUBBLE_SELECTOR,
    CHATGPT_USER_BUBBLE_BG,
    GEMINI_USER_BUBBLE_BG,
    CLAUDE_USER_BUBBLE_BG,
    scrollToMessage
  });

  const conversationIndexer = createConversationIndexer();
  const navigationApi = createNavigationApi();

  function createConversationIndexer(): ConversationIndexerApi {
    if (ns.coreConversationIndexer && typeof ns.coreConversationIndexer.createConversationIndexer === 'function') {
      return ns.coreConversationIndexer.createConversationIndexer({
        utils: ns.utils,
        previewMax: CONFIG.previewMax
      });
    }
    return {
      getConversationSequence() {
        return [] as never[];
      },
      buildUserMessages() {
        return [] as ConversationMessage[];
      },
      buildMessagesSignature() {
        return '';
      }
    };
  }

  function createNavigationApi() {
    const api =
      navigationControllerApi && typeof navigationControllerApi.initNavigationApi === 'function'
        ? navigationControllerApi
        : null;

    if (!api) {
      return {
        attachUiHandlers() {},
        initFabDrag() {},
        startUrlPolling() {},
        handleRouteChange() {},
        scheduleRebuild() {},
        handlePotentialRouteChange() {},
        hydrateMinimalModePreference() {}
      };
    }

    api.initNavigationApi({
      state,
      config: {
        pollMs: CONFIG.pollMs,
        debounceMs: CONFIG.debounceMs
      },
      callbacks: {
        handleThemeToggle,
        setCollapsed,
        setMinimalMode,
        syncAdaptiveMode,
        ensureUiMounted,
        setActiveIndex,
        snapNavListToEdge,
        scrollToMessage,
        scheduleMinimalScrollHintUpdate,
        handleItemPointerOver,
        handleItemPointerOut,
        handleItemFocusIn,
        handleItemFocusOut,
        handlePreviewPointerEnter,
        handlePreviewPointerLeave,
        handlePreviewClick,
        refreshThemeTrackingTargets,
        syncColorScheme,
        cancelPendingBubbleHighlight,
        renderMessages,
        rebuild,
        loadMinimalMode
      } satisfies NavigationCallbacks,
      MANUAL_NAV_SCROLL_LOCK_MS,
      FAB_RIGHT_OFFSET,
      FAB_VERTICAL_PADDING,
      windowRef: window,
      documentRef: document,
      locationRef: location
    });
    return api;
  }

  function start() {
    if (state.started) {
      return;
    }
    state.started = true;

    state.adapter = ns.adapters?.getAdapter() || null;
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

    state.ui = ns.ui?.createUI() || null;
    if (!state.ui) {
      return;
    }
    ensureUiMounted();
    initThemeTracking();
    ns.ui?.setTitle(state.ui, getNavigatorTitle());
    state.minimalMode = false;
    applyInitialCollapsedMode();
    syncAdaptiveMode(true);
    hydrateMinimalModePreference();
    hydrateCollapsedPreference();
    attachUiHandlers();
    initActiveTracking();
    initFabDrag();
    scheduleRebuild('init');
    startUrlPolling();
  }

  function initThemeTracking() {
    themeApi.initThemeTracking();
  }

  function refreshThemeTrackingTargets() {
    themeApi.refreshThemeTrackingTargets();
  }

  function syncColorScheme(force = false) {
    themeApi.syncColorScheme(force);
  }

  function handleThemeToggle(event: Event) {
    themeApi.handleThemeToggle(event);
  }

  function attachUiHandlers() {
    navigationApi.attachUiHandlers();
  }

  function initFabDrag() {
    navigationApi.initFabDrag();
  }

  function startUrlPolling() {
    navigationApi.startUrlPolling();
  }

  function handleRouteChange(source: string) {
    navigationApi.handleRouteChange(source);
  }

  function scheduleRebuild(reason: string) {
    navigationApi.scheduleRebuild(reason);
  }

  function handlePotentialRouteChange(source: string) {
    navigationApi.handlePotentialRouteChange(source);
  }

  function hydrateMinimalModePreference() {
    navigationApi.hydrateMinimalModePreference();
  }

  function rebuild(reason) {
    ensureUiMounted();
    handlePotentialRouteChange(reason);

    const root = getConversationRootForRebuild();
    if (!root) {
      return;
    }

    const sequence = conversationIndexer.getConversationSequence(state.adapter, root);
    const messages = conversationIndexer.buildUserMessages(sequence, state.adapter);
    const signature = conversationIndexer.buildMessagesSignature(messages);
    state.conversationIndexReady = true;
    state.conversationIndexUrl = state.url;
    if (signature === state.signature) {
      return;
    }
    state.signature = signature;
    state.messages = messages;
    renderMessages();
    syncAdaptiveMode();
  }

  function getConversationRootForRebuild() {
    const root = state.adapter?.getConversationRoot() || null;
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

  function attachObserver(root: Element) {
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

  function scrollToMessage(node: Element) {
    state.lastScrollAt = Date.now();
    if (state.adapter?.id === 'chatgpt') {
      scrollChatGptMessage(node);
    } else {
      const behavior =
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
        : 'smooth';
      scrollNodeToCenter(node, behavior);
    }
    flashTarget(node);
  }

  function scrollChatGptMessage(node: Element) {
    const mountedTarget = getChatGptMountedTarget(node);
    if (mountedTarget) {
      scrollElementIntoView(mountedTarget, 'center', 'instant');
      dispatchScrollEvent(mountedTarget);
      return;
    }

    const anchor = getLiveChatGptTurnAnchor(node) || node;
    scrollElementIntoView(anchor, 'center', 'instant');
    dispatchScrollEvent(anchor);
    void finishChatGptJump(node, anchor);
  }

  async function finishChatGptJump(node: Element, anchor: Element) {
    const mountedTarget = await waitForChatGptMountedTarget(node, anchor);
    if (!mountedTarget) {
      return;
    }
    scrollElementIntoView(mountedTarget, 'center', 'instant');
    dispatchScrollEvent(mountedTarget);
    flashTarget(mountedTarget);
  }

  async function waitForChatGptMountedTarget(node: Element, anchor: Element): Promise<Element | null> {
    const deadline = Date.now() + CHATGPT_REMOUNT_WAIT_MS;
    while (Date.now() < deadline) {
      const mountedTarget = getChatGptMountedTarget(node) || getChatGptMountedTarget(anchor);
      if (mountedTarget) {
        return mountedTarget;
      }
      await sleep(CHATGPT_REMOUNT_POLL_MS);
    }
    return null;
  }

  function getChatGptMountedTarget(node: Element): Element | null {
    const liveAnchor = getLiveChatGptTurnAnchor(node);
    const liveTarget = liveAnchor?.querySelector(CHATGPT_MESSAGE_TARGET_SELECTOR) || null;
    if (liveTarget) {
      return liveTarget;
    }

    const directTarget = node.isConnected ? node.querySelector(CHATGPT_MESSAGE_TARGET_SELECTOR) : null;
    if (directTarget) {
      return directTarget;
    }
    return null;
  }

  function getLiveChatGptTurnAnchor(node: Element): Element | null {
    const turnId = getChatGptTurnId(node);
    if (!turnId) {
      const anchor = getChatGptTurnAnchor(node);
      return anchor && anchor.isConnected ? anchor : null;
    }
    const root = document.querySelector(CHATGPT_RESPONSE_ROOT_SELECTOR) || document;
    const escapedTurnId = escapeAttributeValue(turnId);
    return root.querySelector(
      `[data-turn-id="${escapedTurnId}"], [data-turn-id-container="${escapedTurnId}"]`
    );
  }

  function getChatGptTurnAnchor(node: Element): Element | null {
    if (node.matches(CHATGPT_TURN_ANCHOR_SELECTOR)) {
      return node;
    }
    return node.closest(CHATGPT_TURN_ANCHOR_SELECTOR);
  }

  function getChatGptTurnId(node: Element): string {
    const turn = getChatGptTurnAnchor(node);
    return (
      turn?.getAttribute('data-turn-id') ||
      turn?.getAttribute('data-turn-id-container') ||
      node.getAttribute('data-turn-id') ||
      node.getAttribute('data-turn-id-container') ||
      ''
    );
  }

  function scrollElementIntoView(
    element: Element,
    block: ScrollLogicalPosition,
    behavior: ScrollBehavior | 'instant'
  ) {
    try {
      element.scrollIntoView({ behavior, block } as ScrollIntoViewOptions);
    } catch (error) {
      element.scrollIntoView({ block });
    }
  }

  function dispatchScrollEvent(node: Element) {
    const container = findScrollableAncestor(node);
    container?.dispatchEvent(new Event('scroll', { bubbles: true }));
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function escapeAttributeValue(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, '\\$&');
  }

  function scrollNodeToCenter(node: Element, behavior: ScrollBehavior) {
    const target = getScrollTargetNode(node);
    const container = findScrollableAncestor(target);
    if (!container) {
      target.scrollIntoView({ behavior, block: 'center' });
      return;
    }

    const nodeRect = target.getBoundingClientRect();
    const targetCenter = nodeRect.top + nodeRect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    container.scrollBy({
      top: targetCenter - viewportCenter,
      behavior
    });
  }

  function getScrollTargetNode(node: Element): Element {
    if (state.adapter?.id !== 'chatgpt') {
      return node;
    }
    return node.querySelector(CHATGPT_MESSAGE_TARGET_SELECTOR) || node;
  }

  function findScrollableAncestor(node: Element): HTMLElement | null {
    let current = node.parentElement;
    while (current && current !== document.documentElement) {
      if (isScrollableElement(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return (document.scrollingElement || document.documentElement) as HTMLElement;
  }

  function isScrollableElement(node: Element) {
    if (node.scrollHeight <= node.clientHeight + 1) {
      return false;
    }
    const overflowY = window.getComputedStyle(node).overflowY;
    return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  }

  function flashTarget(node: Element) {
    behaviorApi.flashTarget(node);
  }

  function cancelPendingBubbleHighlight() {
    behaviorApi.cancelPendingBubbleHighlight();
  }

  function getNavigatorTitle() {
    return behaviorApi.getNavigatorTitle();
  }

  function renderMessages() {
    ensureUiMounted();
    behaviorApi.renderMessages();
  }

  function scheduleMinimalScrollHintUpdate() {
    behaviorApi.scheduleMinimalScrollHintUpdate();
  }

  function setCollapsed(collapsed: boolean, persist = true) {
    if (!state.ui) {
      return;
    }
    ensureUiMounted();
    if (collapsed) {
      behaviorApi.clearPreviewHideTimer();
      state.previewIndex = null;
      ns.ui?.hidePreview?.(state.ui);
    }
    ns.ui?.setCollapsed(state.ui, Boolean(collapsed));
    if (persist) {
      saveCollapsedMode(Boolean(collapsed));
    }
    if (!collapsed) {
      syncAdaptiveMode(true);
    }
  }

  function setMinimalMode(enabled: boolean) {
    behaviorApi.setMinimalMode(enabled);
  }

  function ensureUiMounted() {
    if (!state.ui || !ns.ui || typeof ns.ui.ensureMounted !== 'function') {
      return false;
    }
    return ns.ui.ensureMounted(state.ui);
  }

  function syncAdaptiveMode(force = false) {
    behaviorApi.syncAdaptiveMode(force);
  }

  function loadMinimalMode() {
    return behaviorApi.loadMinimalMode();
  }

  function loadCollapsedMode() {
    const legacyValue = loadLegacyCollapsedMode();
    const storageApi = ns.storage;
    if (!storageApi || typeof storageApi.getBoolean !== 'function') {
      return Promise.resolve(legacyValue);
    }
    return storageApi
      .getBoolean(COLLAPSED_MODE_KEY)
      .then((storedValue) => {
        if (typeof storedValue === 'boolean') {
          return storedValue;
        }
        void storageApi.setBoolean(COLLAPSED_MODE_KEY, legacyValue);
        return legacyValue;
      })
      .catch(() => legacyValue);
  }

  function loadLegacyCollapsedMode() {
    try {
      return window.localStorage.getItem(COLLAPSED_MODE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function saveCollapsedMode(value: boolean) {
    if (ns.storage && typeof ns.storage.setBoolean === 'function') {
      void ns.storage.setBoolean(COLLAPSED_MODE_KEY, value);
    }
    try {
      window.localStorage.setItem(COLLAPSED_MODE_KEY, value ? '1' : '0');
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function applyInitialCollapsedMode() {
    if (loadLegacyCollapsedMode()) {
      setCollapsed(true, false);
    }
  }

  function hydrateCollapsedPreference() {
    Promise.resolve(loadCollapsedMode()).then((storedValue) => {
      if (typeof storedValue !== 'boolean' || !state.ui) {
        return;
      }
      const currentCollapsed = state.ui.root && state.ui.root.dataset.collapsed === '1';
      if (storedValue === currentCollapsed) {
        return;
      }
      setCollapsed(storedValue, false);
    });
  }

  function handleItemPointerOver(event: Event) {
    behaviorApi.handleItemPointerOver(event);
  }

  function handleItemPointerOut(event: Event) {
    behaviorApi.handleItemPointerOut(event);
  }

  function handleItemFocusIn(event: Event) {
    behaviorApi.handleItemFocusIn(event);
  }

  function handleItemFocusOut(event: Event) {
    behaviorApi.handleItemFocusOut(event);
  }

  function handlePreviewPointerEnter() {
    behaviorApi.handlePreviewPointerEnter();
  }

  function handlePreviewPointerLeave(event: Event) {
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

  function hasIndexedConversation() {
    return Boolean(Array.isArray(state.messages) && state.messages.length > 0 && state.signature);
  }

  function getConversationIndexState() {
    const ready = Boolean(state.conversationIndexReady && state.conversationIndexUrl === state.url);
    return {
      ready,
      hasConversation: ready && hasIndexedConversation()
    };
  }

  ns.core = {
    start,
    hasIndexedConversation,
    getConversationIndexState
  };
