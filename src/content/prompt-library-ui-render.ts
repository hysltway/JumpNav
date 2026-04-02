
  import { t } from '../shared/i18n';
  import { replaceCssVars, UI_KIT_THEME_VAR_KEYS, getUiThemePreset } from '../shared/ui-kit/theme';
  import { ns } from './namespace';
  import type {
    ColorScheme,
    PanelPlacement,
    PromptFormState,
    PromptLibraryRenderOptions,
    PromptLibraryUiHandle,
    PromptViewModel,
    SiteId,
    TitleHelperState
  } from './types';
  const uiStyle = ns.promptLibraryUiStyle || {};

  function setTheme(ui: PromptLibraryUiHandle, site: SiteId | string, scheme: ColorScheme) {
    applyThemeVars(ui.entryRoot, site, scheme);
    applyThemeVars(ui.panelRoot, site, scheme);
  }

  function applyThemeVars(root: HTMLElement, site: SiteId | string, scheme: ColorScheme) {
    const safeSite = typeof site === 'string' ? site : 'generic';
    const safeScheme = scheme === 'dark' ? 'dark' : 'light';
    const preset = getUiThemePreset(safeSite, safeScheme);
    const kitVars = preset.kit && typeof preset.kit === 'object' ? preset.kit : null;
    root.dataset.site = safeSite;
    root.dataset.colorScheme = safeScheme;
    if (kitVars) {
      replaceCssVars(root, kitVars, UI_KIT_THEME_VAR_KEYS);
    }
    const vars = buildThemeVars(safeSite, safeScheme);
    Object.keys(vars).forEach((key) => {
      root.style.setProperty(key, vars[key]);
    });
  }

  function buildThemeVars(site: string, scheme: ColorScheme) {
    const preset = getUiThemePreset(site, scheme);
    const kit = (preset && preset.kit) || {};
    const fontFamilyBySite = {
      chatgpt:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", sans-serif',
      gemini: '"Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif',
      claude:
        '"Anthropic Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      generic: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    };

    const isDark = scheme === 'dark';
    const text = kit['--ui-text'] || (isDark ? '#e7eaee' : '#1f1f1f');
    const muted = kit['--ui-muted'] || (isDark ? '#a4adb7' : '#666666');
    let entryText = site === 'claude' ? muted || text : text;
    const entryHover = site === 'gemini' ? '#F0F1F1' : kit['--ui-control-hover-bg'] || kit['--ui-surface-hover'] || '#efefef';
    if (!isDark && site === 'gemini') {
      entryText = '#444746';
    }

    return {
      '--prompt-entry-bg': 'transparent',
      '--prompt-entry-border': 'transparent',
      '--prompt-entry-text': entryText,
      '--prompt-entry-hover': entryHover,
      '--prompt-panel-font-family': fontFamilyBySite[site] || fontFamilyBySite.generic,
      '--prompt-panel-font-size': '14px'
    };
  }

  function setOpen(ui: PromptLibraryUiHandle, open: boolean) {
    ui.panelRoot.dataset.open = open ? '1' : '0';
    ui.entryButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    ui.panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function positionPanel(ui: PromptLibraryUiHandle, anchorRect: DOMRect, placement: PanelPlacement = {}) {
    if (!ui || !ui.panel || !anchorRect) {
      return;
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const gap = 12;
    const direction = placement && placement.direction === 'up' ? 'up' : 'down';
    const availableHeight =
      direction === 'up'
        ? Math.max(0, anchorRect.top - gap - 12)
        : Math.max(0, viewportHeight - anchorRect.bottom - gap - 12);

    const constrainedMaxHeight = Math.max(0, Math.min(720, availableHeight));
    ui.panel.style.maxHeight = `${constrainedMaxHeight}px`;

    const panelRect = ui.panel.getBoundingClientRect();
    const panelWidth = Math.min(panelRect.width || 315, Math.max(280, viewportWidth - 24));
    const fallbackHeight = Math.min(360, Math.max(96, constrainedMaxHeight));
    const panelHeight = Math.min(panelRect.height || fallbackHeight, viewportHeight - 24);
    const maxLeft = Math.max(12, viewportWidth - panelWidth - 12);
    const maxTop = Math.max(12, viewportHeight - panelHeight - 12);

    const left = clamp(anchorRect.left, 12, maxLeft);
    const top =
      direction === 'up'
        ? clamp(anchorRect.top - panelHeight - gap, 12, maxTop)
        : clamp(anchorRect.bottom + gap, 12, maxTop);
    const originY = direction === 'up' ? '100%' : '0%';
    const originX = clamp(anchorRect.left + anchorRect.width / 2 - left, 20, Math.max(20, panelWidth - 20));

    ui.panel.style.left = `${left}px`;
    ui.panel.style.top = `${top}px`;
    ui.panel.style.transformOrigin = `${originX}px ${originY}`;
  }

  function renderPrompts(
    ui: PromptLibraryUiHandle,
    prompts: PromptViewModel[],
    options: PromptLibraryRenderOptions = {}
  ) {
    ui.list.textContent = '';

    if (!prompts.length) {
      const shouldShowEmptyState = !options.hideEmptyState;
      ui.list.dataset.empty = shouldShowEmptyState ? '1' : '0';
      if (shouldShowEmptyState) {
        ui.list.appendChild(createEmptyState(Boolean(options.hasQuery), options.query || ''));
      }
      return;
    }

    ui.list.dataset.empty = '0';
    prompts.forEach((prompt) => {
      ui.list.appendChild(createPromptItem(prompt, options));
    });
  }

  function createEmptyState(hasQuery: boolean, query: string) {
    const title = t(hasQuery ? 'prompt_library_empty_search_title' : 'prompt_library_empty_default_title');
    const text = hasQuery
      ? t('prompt_library_empty_search_body', [summarizeQuery(query)])
      : t('prompt_library_empty_default_body');
    return uiStyle.createEmptyState(title, text);
  }

  function createPromptItem(prompt: PromptViewModel, options: PromptLibraryRenderOptions = {}) {
    const query = typeof options.query === 'string' ? options.query.trim() : '';
    const busyAction = options.busyAction || '';
    const busyPromptId = options.busyPromptId || '';
    const hasBusyAction = Boolean(busyAction);
    const isCopying = busyAction === 'copy' && busyPromptId === prompt.id;
    const isDeleting = busyAction === 'delete' && busyPromptId === prompt.id;

    const item = document.createElement('article');
    item.className = 'prompt-item ui-item';
    item.dataset.promptId = prompt.id;
    item.setAttribute('role', 'listitem');

    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'prompt-item-main ui-item-main';
    main.dataset.action = 'inject-prompt';
    main.dataset.promptId = prompt.id;
    main.disabled = hasBusyAction;
    main.setAttribute('aria-label', t('prompt_library_insert_prompt', [prompt.title]));

    const head = document.createElement('div');
    head.className = 'prompt-item-head';

    const title = document.createElement('h3');
    title.className = 'prompt-item-title ui-item-title';
    applyHighlightedText(title, prompt.title, query);

    const actions = document.createElement('div');
    actions.className = 'prompt-item-actions';

    const editButton = uiStyle.createIconButton('edit-prompt', t('prompt_library_edit_prompt'), 'edit');
    editButton.dataset.promptId = prompt.id;
    editButton.disabled = hasBusyAction;
    editButton.setAttribute('aria-label', t('prompt_library_edit_prompt'));
    editButton.title = t('prompt_library_edit_prompt');

    const copyButton = uiStyle.createIconButton('copy-prompt', t('prompt_library_copy_prompt'), 'copy');
    copyButton.dataset.promptId = prompt.id;
    copyButton.dataset.busy = isCopying ? '1' : '0';
    copyButton.disabled = hasBusyAction;
    copyButton.setAttribute(
      'aria-label',
      t(isCopying ? 'prompt_library_copying_prompt' : 'prompt_library_copy_prompt')
    );
    copyButton.title = t(isCopying ? 'prompt_library_copying_prompt' : 'prompt_library_copy_prompt');

    const deleteButton = uiStyle.createIconButton('delete-prompt', t('prompt_library_delete_prompt'), 'trash');
    deleteButton.dataset.promptId = prompt.id;
    deleteButton.dataset.tone = 'danger';
    deleteButton.dataset.busy = isDeleting ? '1' : '0';
    deleteButton.disabled = hasBusyAction;
    deleteButton.setAttribute(
      'aria-label',
      t(isDeleting ? 'prompt_library_deleting_prompt' : 'prompt_library_delete_prompt')
    );
    deleteButton.title = t(isDeleting ? 'prompt_library_deleting_prompt' : 'prompt_library_delete_prompt');

    actions.appendChild(editButton);
    actions.appendChild(copyButton);
    actions.appendChild(deleteButton);

    head.appendChild(title);

    const preview = document.createElement('p');
    preview.className = 'prompt-item-preview ui-item-preview';
    applyHighlightedText(preview, prompt.content, query);

    main.appendChild(head);
    main.appendChild(preview);

    item.appendChild(main);
    item.appendChild(actions);
    return item;
  }

  function setCounts(ui: PromptLibraryUiHandle, text: string) {
    ui.countText.textContent = text;
  }

  function setCountVisibility(ui: PromptLibraryUiHandle, visible: boolean) {
    ui.countText.hidden = !visible;
    ui.countText.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function setPromptFormVisible(ui: PromptLibraryUiHandle, visible: boolean) {
    const nextState = visible ? '1' : '0';
    const hasChanged = ui.panel.dataset.formOpen !== nextState;
    ui.promptFormWrap.dataset.open = visible ? '1' : '0';
    ui.panel.dataset.formOpen = nextState;
    ui.promptToggleButton.dataset.active = visible ? '1' : '0';
    ui.promptToggleButton.setAttribute('aria-expanded', visible ? 'true' : 'false');
    const toggleLabel = t(visible ? 'prompt_library_close_form' : 'prompt_library_new_prompt');
    ui.promptToggleButton.setAttribute('aria-label', toggleLabel);
    ui.promptToggleButton.title = toggleLabel;
    if (hasChanged && !visible) {
      ui.panel.scrollTop = 0;
    }
  }

  function setDuplicateWarning(ui: PromptLibraryUiHandle, text: string) {
    const warningText = text || '';
    const visible = Boolean(warningText);
    ui.promptWarning.textContent = warningText;
    ui.promptWarning.hidden = !visible;
    ui.promptWarning.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function setTitleHelperState(ui: PromptLibraryUiHandle, options: TitleHelperState = { visible: false, disabled: false }) {
    const visible = Boolean(options.visible);
    ui.promptTitleHelper.hidden = !visible;
    ui.promptTitleHelper.setAttribute('aria-hidden', visible ? 'false' : 'true');
    ui.promptTitleHelperButton.disabled = !visible || Boolean(options.disabled);
  }

  function setPromptFormState(ui: PromptLibraryUiHandle, options: PromptFormState = {
    saveLabel: t('prompt_library_save'),
    saveDisabled: false,
    saveBusy: false,
    cancelDisabled: false,
    toggleDisabled: false,
    closeDisabled: false,
    searchDisabled: false,
    fieldDisabled: false
  }) {
    const saveLabel = options.saveLabel || t('prompt_library_save');
    const saveLabelNode = ui.promptSaveButton.querySelector('.ui-button-label');
    if (saveLabelNode) {
      saveLabelNode.textContent = saveLabel;
    }

    ui.promptSaveButton.disabled = Boolean(options.saveDisabled);
    ui.promptSaveButton.dataset.busy = options.saveBusy ? '1' : '0';
    ui.promptCancelButton.disabled = Boolean(options.cancelDisabled);
    ui.promptToggleButton.disabled = Boolean(options.toggleDisabled);
    ui.closeButton.disabled = Boolean(options.closeDisabled);
    ui.searchInput.disabled = Boolean(options.searchDisabled);
    ui.promptTitleInput.disabled = Boolean(options.fieldDisabled);
    ui.promptContentInput.disabled = Boolean(options.fieldDisabled);
    ui.promptForm.dataset.busy = options.saveBusy ? '1' : '0';
    ui.promptForm.setAttribute('aria-busy', options.saveBusy ? 'true' : 'false');
  }

  function destroy(ui: PromptLibraryUiHandle) {
    if (!ui) {
      return;
    }
    if (ui.entryHost && ui.entryHost.parentElement) {
      ui.entryHost.remove();
    }
    if (ui.panelHost && ui.panelHost.parentElement) {
      ui.panelHost.remove();
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function applyHighlightedText(node, text, query) {
    node.textContent = '';
    const source = typeof text === 'string' ? text : '';
    const normalizedQuery = typeof query === 'string' ? query.trim() : '';
    if (!normalizedQuery) {
      node.textContent = source;
      return;
    }

    const lowerSource = source.toLowerCase();
    const lowerQuery = normalizedQuery.toLowerCase();
    let cursor = 0;

    while (cursor < source.length) {
      const matchIndex = lowerSource.indexOf(lowerQuery, cursor);
      if (matchIndex === -1) {
        node.appendChild(document.createTextNode(source.slice(cursor)));
        break;
      }

      if (matchIndex > cursor) {
        node.appendChild(document.createTextNode(source.slice(cursor, matchIndex)));
      }

      const mark = document.createElement('mark');
      mark.textContent = source.slice(matchIndex, matchIndex + normalizedQuery.length);
      node.appendChild(mark);
      cursor = matchIndex + normalizedQuery.length;
    }
  }

  function summarizeQuery(query) {
    const normalized = typeof query === 'string' ? query.trim() : '';
    if (!normalized) {
      return '';
    }
    return normalized.length > 32 ? `${normalized.slice(0, 29)}...` : normalized;
  }

  ns.promptLibraryUiRender = Object.assign({}, ns.promptLibraryUiRender, {
    setTheme,
    setOpen,
    positionPanel,
    renderPrompts,
    setCounts,
    setCountVisibility,
    setPromptFormVisible,
    setDuplicateWarning,
    setTitleHelperState,
    setPromptFormState,
    destroy
  });
  window.ChatGptNav = ns;
