
  import { ns } from './namespace';
  import type {
    ColorScheme,
    ConversationIndexState,
    InsertPromptResult,
    MountTarget,
    PanelPlacement,
    SiteId
  } from './types';

  interface PromptLibrarySiteEnvironment {
    documentRef?: Document;
    locationRef?: Location;
    windowRef?: Window;
  }

  const SITE_ID = ns.site && ns.site.SITE_ID
    ? ns.site.SITE_ID
    : Object.freeze({
        CHATGPT: 'chatgpt',
        GEMINI: 'gemini',
        CLAUDE: 'claude',
        GENERIC: 'generic'
      });

  const THEME_ATTRIBUTE_FILTER = ['class', 'style', 'data-mode'];

  const EDITOR_SELECTORS = {
    chatgpt: [
      '#prompt-textarea',
      'form[data-type="unified-composer"] [contenteditable="true"]',
      '[data-composer-surface="true"] [contenteditable="true"]',
      'form[data-type="unified-composer"] textarea'
    ],
    gemini: [
      'rich-textarea [contenteditable="true"]',
      'rich-textarea textarea',
      '.text-input-field [contenteditable="true"]',
      '.text-input-field textarea'
    ],
    claude: [
      '[data-testid="chat-input"] [contenteditable="true"]',
      '[data-testid="chat-input"] textarea',
      '[data-testid="chat-input"] .ProseMirror',
      'button[aria-label="Toggle menu"] ~ * [contenteditable="true"]'
    ],
    generic: [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]'
    ]
  };

  const CONVERSATION_SELECTORS = {
    chatgpt: [
      '[data-message-author-role]',
      '[data-author-role]',
      "[data-testid='user-message']"
    ],
    gemini: [
      '.conversation-container',
      'user-query',
      'model-response'
    ],
    claude: [
      "[data-testid='user-message']",
      '.font-claude-response'
    ],
    generic: []
  };

  function createPromptLibrarySiteApi(overrides: PromptLibrarySiteEnvironment = {}) {
    const documentRef = overrides.documentRef || document;
    const locationRef = overrides.locationRef || location;
    const windowRef = overrides.windowRef || window;

    function getCurrentSiteId(): SiteId {
      if (ns.site && typeof ns.site.getCurrentSiteId === 'function') {
        return ns.site.getCurrentSiteId();
      }
      const hostname = locationRef && locationRef.hostname ? locationRef.hostname : '';
      if (hostname === 'chatgpt.com' || hostname === 'chat.openai.com') {
        return SITE_ID.CHATGPT;
      }
      if (hostname === 'gemini.google.com') {
        return SITE_ID.GEMINI;
      }
      if (hostname === 'claude.ai') {
        return SITE_ID.CLAUDE;
      }
      return SITE_ID.GENERIC;
    }

    function findMountTarget(siteId: SiteId = getCurrentSiteId()): MountTarget | null {
      if (siteId === SITE_ID.CHATGPT) {
        return findChatGptMountTarget(documentRef);
      }
      if (siteId === SITE_ID.GEMINI) {
        return findGeminiMountTarget(documentRef);
      }
      if (siteId === SITE_ID.CLAUDE) {
        return findClaudeMountTarget(documentRef);
      }
      return findGenericMountTarget(documentRef, siteId);
    }

    function findEditor(siteId: SiteId = getCurrentSiteId()) {
      const selectors = EDITOR_SELECTORS[siteId] || EDITOR_SELECTORS.generic;
      return resolveEditorFromSelectors(documentRef, selectors) || resolveEditorFromSelectors(documentRef, EDITOR_SELECTORS.generic);
    }

    function insertPromptContent(content: string, siteId: SiteId = getCurrentSiteId()): InsertPromptResult {
      const normalizedContent = normalizePromptContent(content);
      if (!normalizedContent) {
        return { ok: false, reason: 'Prompt body is empty.' };
      }

      const editor = findEditor(siteId);
      if (!editor || !editor.element) {
        return { ok: false, reason: 'Could not find the current composer. Copy it instead.' };
      }

      const existingText = getEditorText(editor.element, editor.type);
      const chunk = `${buildAppendSeparator(existingText)}${normalizedContent}`;
      if (!chunk) {
        return { ok: false, reason: 'Nothing to insert.' };
      }

      const inserted =
        editor.type === 'text'
          ? appendTextToInput(editor.element, chunk)
          : appendTextToContentEditable(editor.element, chunk, documentRef, windowRef);

      if (!inserted) {
        return { ok: false, reason: 'Browser blocked writing to the current composer. Copy it instead.' };
      }

      return { ok: true, reason: '', editor: editor.element };
    }

    function getColorScheme(siteId: SiteId = getCurrentSiteId()): ColorScheme {
      if (siteId === SITE_ID.CHATGPT) {
        return detectChatGptColorScheme(documentRef, windowRef);
      }
      if (siteId === SITE_ID.GEMINI) {
        return detectGeminiColorScheme(documentRef, windowRef);
      }
      if (siteId === SITE_ID.CLAUDE) {
        return detectClaudeColorScheme(documentRef, windowRef);
      }
      return detectGenericColorScheme(windowRef);
    }

    function getPanelPlacement(siteId: SiteId = getCurrentSiteId()): PanelPlacement {
      const mode = resolvePanelMode(siteId, documentRef, locationRef);
      return {
        mode,
        direction: mode === 'conversation' ? 'up' : 'down',
        anchor: mode === 'conversation' ? 'bottom-left' : 'top-left'
      };
    }

    return {
      SITE_ID,
      THEME_ATTRIBUTE_FILTER,
      getCurrentSiteId,
      getColorScheme,
      getPanelPlacement,
      findMountTarget,
      findEditor,
      insertPromptContent
    };
  }

  function findChatGptMountTarget(documentRef: Document): MountTarget | null {
    const plusButton = documentRef.querySelector('[data-testid="composer-plus-btn"]');
    if (plusButton) {
      const buttonSlot = findButtonSiblingSlot(plusButton);
      if (buttonSlot) {
        return buttonSlot;
      }
    }

    const leadingArea = queryFirst(documentRef, [
      'form[data-type="unified-composer"] [style*="grid-area: leading"]',
      'form[data-type="unified-composer"] [style*="grid-area:leading"]'
    ]);
    if (leadingArea) {
      return {
        container: leadingArea,
        referenceNode: null
      };
    }

    const surface = documentRef.querySelector('[data-composer-surface="true"]');
    if (surface) {
      const actionContainer = findActionContainer(surface);
      if (actionContainer) {
        return {
          container: actionContainer,
          referenceNode: null
        };
      }
      return {
        container: (surface.parentElement || surface) as HTMLElement,
        referenceNode: null
      };
    }

    return findGenericMountTarget(documentRef, SITE_ID.CHATGPT);
  }

  function findGeminiMountTarget(documentRef: Document): MountTarget | null {
    const leadingActions = documentRef.querySelector('.leading-actions-wrapper');
    if (leadingActions) {
      return {
        container: leadingActions as HTMLElement,
        referenceNode: null,
        inlineRow: true,
        hostAlignSelf: 'center',
        hostHeight: '40px',
        hostMarginInlineStart: '4px'
      };
    }

    const toolboxButton = documentRef.querySelector('.toolbox-drawer-button-container');
    if (toolboxButton && toolboxButton.parentElement) {
      return {
        container: toolboxButton.parentElement,
        referenceNode: toolboxButton,
        inlineRow: true,
        hostAlignSelf: 'center',
        hostHeight: '40px',
        hostMarginInlineStart: '4px'
      };
    }

    return findGenericMountTarget(documentRef, SITE_ID.GEMINI);
  }

  function findClaudeMountTarget(documentRef: Document): MountTarget | null {
    const toggleButton = documentRef.querySelector('button[aria-label="Toggle menu"]');
    if (toggleButton) {
      const flexRowSlot = findFlexRowSiblingSlot(toggleButton);
      if (flexRowSlot) {
        flexRowSlot.hostAlignSelf = 'center';
        flexRowSlot.hostHeight = '32px';
        flexRowSlot.hostMarginInlineStart = '0';
        return flexRowSlot;
      }
      const buttonSlot = findButtonSiblingSlot(toggleButton);
      if (buttonSlot) {
        buttonSlot.hostAlignSelf = 'center';
        buttonSlot.hostHeight = '32px';
        return buttonSlot;
      }
      if (toggleButton.parentElement) {
        return {
          container: toggleButton.parentElement,
          referenceNode: toggleButton,
          inlineRow: true,
          gap: '8px',
          hostAlignSelf: 'center',
          hostHeight: '32px'
        };
      }
    }

    const inputRoot = documentRef.querySelector('[data-testid="chat-input"]');
    if (inputRoot) {
      const actionContainer = findActionContainer(inputRoot);
      if (actionContainer) {
        return {
          container: actionContainer,
          referenceNode: null
        };
      }
      return {
        container: inputRoot as HTMLElement,
        referenceNode: null
      };
    }

    return findGenericMountTarget(documentRef, SITE_ID.CLAUDE);
  }

  function findGenericMountTarget(documentRef: Document, siteId: SiteId): MountTarget | null {
    const editor = resolveEditorFromSelectors(documentRef, EDITOR_SELECTORS[siteId] || EDITOR_SELECTORS.generic);
    if (!editor || !editor.element) {
      return null;
    }

    const anchorRoot = editor.element.closest(
      'form, [data-testid="chat-input"], [data-composer-surface="true"], .text-input-field, rich-textarea, main'
    );
    if (anchorRoot) {
      const actionContainer = findActionContainer(anchorRoot);
      if (actionContainer) {
        return {
          container: actionContainer,
          referenceNode: null
        };
      }
      return {
        container: anchorRoot,
        referenceNode: null
      };
    }

    return {
      container: editor.element.parentElement || documentRef.body,
      referenceNode: null
    };
  }

  function resolveEditorFromSelectors(root, selectors) {
    const element = queryFirst(root, selectors);
    if (!element) {
      return null;
    }
    return resolveEditorDescriptor(element);
  }

  function resolveEditorDescriptor(candidate) {
    const element = resolveEditableElement(candidate);
    if (!element) {
      return null;
    }

    return {
      element,
      type: isTextControl(element) ? 'text' : 'contenteditable'
    };
  }

  function resolveEditableElement(candidate) {
    if (!candidate) {
      return null;
    }
    if (isTextControl(candidate) || isContentEditableElement(candidate)) {
      return candidate;
    }
    return queryFirst(candidate, [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]'
    ]);
  }

  function isTextControl(element) {
    if (!element || !element.tagName) {
      return false;
    }
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea') {
      return true;
    }
    return tagName === 'input' && (!element.type || element.type === 'text' || element.type === 'search');
  }

  function isContentEditableElement(element) {
    if (!element) {
      return false;
    }
    if (element.isContentEditable) {
      return true;
    }
    const contentEditable = typeof element.getAttribute === 'function' ? element.getAttribute('contenteditable') : '';
    return contentEditable === 'true' || contentEditable === 'plaintext-only';
  }

  function findActionContainer(root) {
    if (!root || typeof root.querySelector !== 'function') {
      return null;
    }

    const preferred = [
      '.leading-actions-wrapper',
      '[style*="grid-area: leading"]',
      '[style*="grid-area:leading"]'
    ];

    const preferredNode = queryFirst(root, preferred);
    if (preferredNode) {
      return preferredNode;
    }

    const button = root.querySelector('button');
    if (button && button.parentElement) {
      return button.parentElement;
    }

    return null;
  }

  function findButtonSiblingSlot(button): MountTarget | null {
    if (!button) {
      return null;
    }

    const tooltipWrapper = button.closest('span[data-state]');
    if (tooltipWrapper && tooltipWrapper.parentElement) {
      return {
        container: tooltipWrapper.parentElement,
        referenceNode: tooltipWrapper,
        inlineRow: true,
        gap: '8px'
      };
    }

    if (button.parentElement) {
      return {
        container: button.parentElement,
        referenceNode: button,
        inlineRow: true,
        gap: '8px'
      };
    }

    return null;
  }

  function findFlexRowSiblingSlot(button): MountTarget | null {
    if (!button || !button.parentElement) {
      return null;
    }

    let referenceNode = button.parentElement;
    let container = referenceNode.parentElement;
    let depth = 0;

    while (referenceNode && container && depth < 4) {
      if (isFlexContainer(container)) {
        return {
          container,
          referenceNode,
          inlineRow: true
        };
      }
      referenceNode = container;
      container = container.parentElement;
      depth += 1;
    }

    return null;
  }

  function isFlexContainer(element) {
    if (!element || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
      return false;
    }
    const display = window.getComputedStyle(element).display || '';
    return display === 'flex' || display === 'inline-flex';
  }

  function appendTextToInput(element, chunk) {
    try {
      focusElement(element);
      const currentValue = typeof element.value === 'string' ? element.value : '';
      const nextValue = `${currentValue}${chunk}`;
      setInputValue(element, nextValue);
      if (typeof element.setSelectionRange === 'function') {
        element.setSelectionRange(nextValue.length, nextValue.length);
      }
      dispatchInputEvent(element, chunk);
      dispatchChangeEvent(element);
      return true;
    } catch (error) {
      return false;
    }
  }

  function appendTextToContentEditable(element, chunk, documentRef, windowRef) {
    try {
      focusElement(element);
      placeCaretAtEnd(element, documentRef, windowRef);

      if (tryExecCommandInsertText(chunk, documentRef)) {
        return true;
      }

      insertTextWithRange(element, chunk, documentRef, windowRef);
      dispatchInputEvent(element, chunk);
      return true;
    } catch (error) {
      return false;
    }
  }

  function focusElement(element) {
    if (!element || typeof element.focus !== 'function') {
      return;
    }
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      element.focus();
    }
  }

  function placeCaretAtEnd(element, documentRef, windowRef) {
    if (!element || typeof documentRef.createRange !== 'function') {
      return;
    }
    const selection = windowRef.getSelection ? windowRef.getSelection() : null;
    if (!selection) {
      return;
    }
    const range = documentRef.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function tryExecCommandInsertText(chunk, documentRef) {
    if (!documentRef || typeof documentRef.execCommand !== 'function') {
      return false;
    }
    try {
      return Boolean(documentRef.execCommand('insertText', false, chunk));
    } catch (error) {
      return false;
    }
  }

  function insertTextWithRange(element, chunk, documentRef, windowRef) {
    const selection = windowRef.getSelection ? windowRef.getSelection() : null;
    if (!selection) {
      return;
    }

    const range = documentRef.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    const lines = chunk.split('\n');
    lines.forEach((line, index) => {
      if (index > 0) {
        const breakNode = documentRef.createElement('br');
        range.insertNode(breakNode);
        range.setStartAfter(breakNode);
        range.collapse(true);
      }
      if (!line) {
        return;
      }
      const textNode = documentRef.createTextNode(line);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
    });
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function setInputValue(element, nextValue) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value') : null;
    if (descriptor && typeof descriptor.set === 'function') {
      descriptor.set.call(element, nextValue);
      return;
    }
    element.value = nextValue;
  }

  function dispatchInputEvent(element, data) {
    try {
      element.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: false,
          inputType: 'insertText',
          data
        })
      );
    } catch (error) {
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function dispatchChangeEvent(element) {
    try {
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      // Ignore legacy failures.
    }
  }

  function getEditorText(element, type) {
    if (!element) {
      return '';
    }
    if (type === 'text') {
      return typeof element.value === 'string' ? element.value : '';
    }
    if (typeof element.innerText === 'string') {
      return element.innerText;
    }
    return element.textContent || '';
  }

  function buildAppendSeparator(existingText) {
    if (typeof existingText !== 'string' || !existingText.trim()) {
      return '';
    }
    if (/\n\s*$/.test(existingText)) {
      return '\n';
    }
    return '\n\n';
  }

  function normalizePromptContent(content) {
    if (typeof content !== 'string') {
      return '';
    }
    return trimBlankLines(content.replace(/\r\n/g, '\n'));
  }

  function trimBlankLines(value) {
    const lines = value.split('\n');
    while (lines.length && lines[0].trim() === '') {
      lines.shift();
    }
    while (lines.length && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }
    return lines.join('\n');
  }

  function detectChatGptColorScheme(documentRef, windowRef) {
    const root = documentRef.documentElement;
    if (root && root.classList && root.classList.contains('dark')) {
      return 'dark';
    }
    if (root && root.classList && root.classList.contains('light')) {
      return 'light';
    }
    return detectGenericColorScheme(windowRef);
  }

  function detectGeminiColorScheme(documentRef, windowRef) {
    const body = documentRef.body;
    if (body && body.classList && body.classList.contains('dark-theme')) {
      return 'dark';
    }
    if (body && body.classList && body.classList.contains('light-theme')) {
      return 'light';
    }
    return detectGenericColorScheme(windowRef);
  }

  function detectClaudeColorScheme(documentRef, windowRef) {
    const root = documentRef.documentElement;
    if (root && root.getAttribute('data-mode') === 'dark') {
      return 'dark';
    }
    if (root && root.getAttribute('data-mode') === 'light') {
      return 'light';
    }
    if (root && root.classList && root.classList.contains('dark')) {
      return 'dark';
    }
    return detectGenericColorScheme(windowRef);
  }

  function detectGenericColorScheme(windowRef) {
    if (
      windowRef &&
      typeof windowRef.matchMedia === 'function' &&
      windowRef.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }

  function resolvePanelMode(siteId, documentRef, locationRef) {
    const indexedMode = getIndexedConversationMode();
    if (indexedMode) {
      return indexedMode;
    }
    return isConversationView(siteId, documentRef, locationRef) ? 'conversation' : 'new';
  }

  function getIndexedConversationMode() {
    if (ns.core && typeof ns.core.getConversationIndexState === 'function') {
      const indexState = ns.core.getConversationIndexState() as ConversationIndexState | undefined;
      if (indexState && indexState.ready) {
        return indexState.hasConversation ? 'conversation' : 'new';
      }
      return '';
    }
    if (!ns.core || typeof ns.core.hasIndexedConversation !== 'function') {
      return '';
    }
    return ns.core.hasIndexedConversation() ? 'conversation' : 'new';
  }

  function isConversationView(siteId, documentRef, locationRef) {
    return hasConversationPath(siteId, locationRef) || hasConversationContent(siteId, documentRef);
  }

  function hasConversationPath(siteId, locationRef) {
    const pathname = locationRef && typeof locationRef.pathname === 'string' ? locationRef.pathname : '';
    if (!pathname) {
      return false;
    }

    if (siteId === SITE_ID.CHATGPT) {
      return /\/c\/[^/?#]+/i.test(pathname);
    }
    if (siteId === SITE_ID.GEMINI) {
      return /\/app\/[^/?#]+/i.test(pathname);
    }
    if (siteId === SITE_ID.CLAUDE) {
      return /\/chat\/[^/?#]+/i.test(pathname) || /\/project\/[^/]+\/chat\/[^/?#]+/i.test(pathname);
    }
    return false;
  }

  function hasConversationContent(siteId, documentRef) {
    const selectors = CONVERSATION_SELECTORS[siteId] || CONVERSATION_SELECTORS.generic;
    if (!selectors.length) {
      return false;
    }
    const node = queryFirst(documentRef, selectors);
    return Boolean(node && isRenderableNode(node));
  }

  function isRenderableNode(node) {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  function queryFirst(root, selectors) {
    if (!root || typeof root.querySelector !== 'function') {
      return null;
    }
    for (const selector of selectors) {
      const node = root.querySelector(selector);
      if (node) {
        return node;
      }
    }
    return null;
  }

  const siteApi = createPromptLibrarySiteApi();

  ns.promptLibrarySite = Object.assign({}, ns.promptLibrarySite, siteApi, {
    createPromptLibrarySiteApi
  });
  window.ChatGptNav = ns;
