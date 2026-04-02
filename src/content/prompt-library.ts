
  import { ns } from './namespace';
  import { t, tp } from '../shared/i18n';
  import { trackGrowth } from '../shared/growth';
  import { createPromptEntrySettingsApi } from '../shared/prompt-entry-settings';
  import type {
    Adapter,
    ChromeLikeWithStorageChanges,
    PromptFormDraftState,
    PromptLibrary,
    PromptLibrarySiteApi,
    PromptLibraryState,
    PromptLibraryStoreApi,
    PromptLibraryUiApi,
    PromptLibraryUiHandle,
    PromptRecord,
    PromptViewModel,
    TitleAssistFlow
  } from './types';

  const PROMPT_LIBRARY_BOOT_FLAG = 'jumpnavPromptLibraryInjected';
  const ROUTE_POLL_MS = 1200;
  const ENVIRONMENT_SYNC_DEBOUNCE_MS = 140;
  const TITLE_HELPER_COPY = Object.freeze({
    prompt:
      'Please write a short, accurate title for the prompt below. The title must use the same language as the prompt. Reply with the title only. Do not include any explanation, quotation marks, numbering, prefixes, suffixes, Markdown, line breaks, or any extra text.'
  });

  const promptLibraryUi = ns.promptLibraryUi as PromptLibraryUiApi;
  const createPromptLibraryStore = ns.promptLibraryStore?.createPromptLibraryStore as
    | ((environment?: { storageApi?: unknown }) => PromptLibraryStoreApi)
    | undefined;
  const createPromptLibrarySiteApi = ns.promptLibrarySite?.createPromptLibrarySiteApi as
    | ((environment?: unknown) => PromptLibrarySiteApi)
    | undefined;
  const promptEntrySettingsApi = createPromptEntrySettingsApi({
    storageApi: ns.storage ?? null
  });

  const state: PromptLibraryState = {
    started: false,
    booted: false,
    store: null,
    siteApi: null,
    ui: null,
    library: null,
    siteId: 'generic',
    colorScheme: 'light',
    entryEnabled: true,
    open: false,
    mounted: false,
    url: location.href,
    filter: {
      query: ''
    },
    promptFormVisible: false,
    promptFormMode: 'create',
    editingPromptId: '',
    duplicateWarning: '',
    duplicateConfirmToken: '',
    savePending: false,
    busyAction: '',
    busyPromptId: '',
    titleAssistFlow: null,
    environmentSyncTimer: null,
    environmentObserver: null,
    themeObserver: null,
    panelResizeObserver: null,
    routePollTimer: null,
    positionRaf: null
  };

  function getStore(): PromptLibraryStoreApi {
    return state.store as PromptLibraryStoreApi;
  }

  function getSiteApi(): PromptLibrarySiteApi {
    return state.siteApi as PromptLibrarySiteApi;
  }

  function getUi(): PromptLibraryUiHandle {
    return state.ui as PromptLibraryUiHandle;
  }

  function getLibrary(): PromptLibrary {
    return state.library as PromptLibrary;
  }

  function start() {
    if (state.started) {
      return;
    }
    state.started = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }

  async function boot() {
    if (state.booted || document.documentElement.dataset[PROMPT_LIBRARY_BOOT_FLAG] === '1') {
      return;
    }

    document.documentElement.dataset[PROMPT_LIBRARY_BOOT_FLAG] = '1';
    state.booted = true;

    state.store = createPromptLibraryStore!({
      storageApi: ns.storage
    });
    state.siteApi = createPromptLibrarySiteApi!();
    state.ui = promptLibraryUi.createPromptLibraryUI();

    bindUiEvents();
    bindGlobalEvents();

    const [library, entryEnabled] = await Promise.all([getStore().read(), promptEntrySettingsApi.read()]);
    state.library = library;
    state.entryEnabled = entryEnabled;
    state.siteId = getSiteApi().getCurrentSiteId();
    state.colorScheme = getSiteApi().getColorScheme(state.siteId);
    promptLibraryUi.setTheme(getUi(), state.siteId, state.colorScheme);

    render();
    syncEnvironment();
    startObservers();
    startRoutePolling();
    attachStorageListener();
  }

  function bindUiEvents() {
    const ui = getUi();

    ui.entryButton.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });

    ui.entryButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.savePending || state.busyAction) {
        return;
      }
      if (!state.open) {
        syncEnvironment();
      }
      setOpen(!state.open);
    });

    ui.closeButton.addEventListener('click', () => {
      if (state.savePending || state.busyAction) {
        return;
      }
      setOpen(false);
    });

    ui.promptToggleButton.addEventListener('click', () => {
      if (state.savePending || state.busyAction) {
        return;
      }
      togglePromptForm();
    });

    ui.searchInput.addEventListener('input', () => {
      state.filter.query = ui.searchInput.value || '';
      render();
    });

    ui.list.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const actionNode = target.closest('[data-action]') as HTMLElement | null;
      if (!actionNode) {
        return;
      }

      const action = actionNode.dataset.action || '';
      const promptHost = actionNode.closest('[data-prompt-id]') as HTMLElement | null;
      const promptId = actionNode.dataset.promptId || promptHost?.dataset.promptId || '';
      if (!promptId) {
        return;
      }

      if (action === 'copy-prompt') {
        handleCopyPrompt(promptId);
        return;
      }

      if (action === 'edit-prompt') {
        handleEditPrompt(promptId);
        return;
      }

      if (action === 'delete-prompt') {
        handleDeletePrompt(promptId);
        return;
      }

      if (action === 'inject-prompt') {
        handleInjectPrompt(promptId);
      }
    });

    ui.promptForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleSavePrompt();
    });

    ui.promptCancelButton.addEventListener('click', () => {
      if (state.savePending || state.busyAction) {
        return;
      }
      closePromptForm();
    });

    ui.promptTitleHelperButton.addEventListener('click', () => {
      handleGeneratePromptTitle();
    });

    ui.promptTitleInput.addEventListener('input', handlePromptDraftInput);
    ui.promptContentInput.addEventListener('input', handlePromptDraftInput);
  }

  function bindGlobalEvents() {
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!state.open) {
          return;
        }
        if (state.savePending || state.busyAction) {
          return;
        }
        if (isEventInsideUi(event)) {
          return;
        }
        setOpen(false);
      },
      true
    );

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && state.open) {
          if (handleScopedEscape(event)) {
            return;
          }
          if (state.savePending || state.busyAction) {
            event.preventDefault();
            return;
          }
          setOpen(false);
        }
      },
      true
    );

    window.addEventListener('resize', () => {
      schedulePosition();
    });

    window.addEventListener(
      'scroll',
      () => {
        schedulePosition();
      },
      true
    );
  }

  function startObservers() {
    const siteApi = getSiteApi();
    const ui = getUi();

    if (state.environmentObserver) {
      state.environmentObserver.disconnect();
    }
    state.environmentObserver = new MutationObserver(() => {
      scheduleEnvironmentSync();
    });

    if (document.body) {
      state.environmentObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    if (state.themeObserver) {
      state.themeObserver.disconnect();
    }
    state.themeObserver = new MutationObserver(() => {
      scheduleEnvironmentSync();
    });

    if (document.documentElement) {
      state.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: siteApi.THEME_ATTRIBUTE_FILTER
      });
    }
    if (document.body) {
      state.themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: siteApi.THEME_ATTRIBUTE_FILTER
      });
    }

    if (typeof window.matchMedia === 'function') {
      const colorSchemeMql = window.matchMedia('(prefers-color-scheme: dark)');
      if (typeof colorSchemeMql.addEventListener === 'function') {
        colorSchemeMql.addEventListener('change', scheduleEnvironmentSync);
      } else if (typeof colorSchemeMql.addListener === 'function') {
        colorSchemeMql.addListener(scheduleEnvironmentSync);
      }
    }

    if (state.panelResizeObserver) {
      state.panelResizeObserver.disconnect();
    }
    if (typeof ResizeObserver === 'function' && ui.panel) {
      state.panelResizeObserver = new ResizeObserver(() => {
        if (state.open) {
          schedulePosition();
        }
      });
      state.panelResizeObserver.observe(ui.panel);
    }
  }

  function startRoutePolling() {
    if (state.routePollTimer) {
      return;
    }
    state.routePollTimer = window.setInterval(() => {
      if (location.href === state.url) {
        return;
      }
      state.url = location.href;
      scheduleEnvironmentSync();
    }, ROUTE_POLL_MS);
  }

  function scheduleEnvironmentSync() {
    if (state.environmentSyncTimer) {
      window.clearTimeout(state.environmentSyncTimer);
    }
    state.environmentSyncTimer = window.setTimeout(() => {
      state.environmentSyncTimer = null;
      syncEnvironment();
    }, ENVIRONMENT_SYNC_DEBOUNCE_MS);
  }

  function syncEnvironment() {
    const ui = state.ui;
    const siteApi = state.siteApi;
    if (!ui || !siteApi) {
      return;
    }

    state.siteId = siteApi.getCurrentSiteId();
    state.colorScheme = siteApi.getColorScheme(state.siteId);
    promptLibraryUi.setTheme(ui, state.siteId, state.colorScheme);

    if (!state.entryEnabled) {
      promptLibraryUi.detachEntry(ui);
      state.mounted = false;

      if (state.open) {
        setOpen(false);
      }
      return;
    }

    const mounted = promptLibraryUi.mountEntry(ui, siteApi.findMountTarget(state.siteId));
    state.mounted = Boolean(mounted && ui.entryHost.isConnected);

    if (!state.mounted && state.open) {
      setOpen(false);
      return;
    }

    if (state.open) {
      schedulePosition();
    }
  }

  function render() {
    const library = state.library;
    const ui = state.ui;
    const store = state.store;
    if (!library || !ui || !store) {
      return;
    }

    const query = getSearchQuery();
    const draft = getPromptDraft();
    const shouldHidePromptItems = state.promptFormVisible && !query;
    const prompts = shouldHidePromptItems
      ? []
      : store.filterPrompts(library, state.filter).map(buildPromptViewModel);

    promptLibraryUi.renderPrompts(ui, prompts, {
      hasQuery: Boolean(query),
      query,
      hideEmptyState: shouldHidePromptItems,
      busyAction: state.busyAction,
      busyPromptId: state.busyPromptId
    });
    promptLibraryUi.setCounts(ui, buildCountText(prompts.length, library.prompts.length));
    promptLibraryUi.setCountVisibility(ui, !state.promptFormVisible);
    promptLibraryUi.setPromptFormVisible(ui, state.promptFormVisible);
    promptLibraryUi.setDuplicateWarning(ui, state.duplicateWarning);
    promptLibraryUi.setTitleHelperState(ui, {
      visible: state.promptFormVisible && Boolean(draft.content) && !draft.title,
      disabled: state.savePending || Boolean(state.busyAction)
    });
    syncPromptFormState(draft);
    schedulePosition();
  }

  function buildCountText(filteredCount: number, totalCount: number): string {
    const hasFilter = Boolean(getSearchQuery());
    if (!hasFilter) {
      return formatPromptCount(totalCount);
    }
    return t('prompt_library_count_filtered', [String(filteredCount), formatPromptCount(totalCount)]);
  }

  function buildPromptViewModel(prompt: PromptRecord): PromptViewModel {
    return {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content
    };
  }

  function setOpen(open: boolean) {
    const ui = getUi();
    const wasOpen = state.open;

    if (open) {
      syncEnvironment();
      if (!state.mounted) {
        return;
      }
      if (ui.panelHost && !ui.panelHost.isConnected) {
        (document.documentElement || document.body).appendChild(ui.panelHost);
      }
    }

    state.open = Boolean(open);
    promptLibraryUi.setOpen(ui, state.open);
    if (!wasOpen && state.open) {
      void trackGrowth('prompt_panel_open');
    }

    if (!state.open) {
      resetPanelEphemeralState();
      return;
    }

    const restoredTitleAssistFlow = restoreTitleAssistFlowOnOpen();
    schedulePosition();
    window.setTimeout(() => {
      if (state.open) {
        if (restoredTitleAssistFlow) {
          ui.promptTitleInput.focus();
          return;
        }
        ui.searchInput.focus();
      }
    }, 40);
  }

  function schedulePosition() {
    const ui = state.ui;
    if (!state.open || !state.mounted) {
      return;
    }
    if (state.positionRaf) {
      return;
    }
    state.positionRaf = window.requestAnimationFrame(() => {
      state.positionRaf = null;
      if (!state.open || !ui || !ui.entryHost.isConnected) {
        return;
      }
      const placement =
        state.siteApi && typeof state.siteApi.getPanelPlacement === 'function'
          ? state.siteApi.getPanelPlacement(state.siteId)
          : { direction: 'down', anchor: 'top-left', mode: 'new' };
      promptLibraryUi.positionPanel(ui, ui.entryButton.getBoundingClientRect(), placement);
    });
  }

  function togglePromptForm() {
    const ui = getUi();

    if (state.savePending || state.busyAction) {
      return;
    }
    if (state.promptFormVisible) {
      closePromptForm();
      return;
    }

    if (restoreTitleAssistFlow()) {
      window.setTimeout(() => {
        ui.promptTitleInput.focus();
      }, 50);
      return;
    }

    state.promptFormMode = 'create';
    state.editingPromptId = '';
    state.promptFormVisible = true;
    clearDuplicateReminder();
    resetPromptForm();
    render();

    window.setTimeout(() => {
      ui.promptTitleInput.focus();
    }, 50);
  }

  function closePromptForm() {
    if (state.savePending || state.busyAction) {
      return;
    }
    state.promptFormVisible = false;
    resetPromptFormMode();
    clearTitleAssistFlow();
    clearDuplicateReminder();
    render();
  }

  function handleEditPrompt(promptId: string) {
    const ui = state.ui;
    if (state.savePending || state.busyAction) {
      return;
    }
    if (!ui) {
      return;
    }

    const prompt = findPromptById(promptId);
    if (!prompt) {
      return;
    }

    state.promptFormVisible = true;
    state.promptFormMode = 'edit';
    state.editingPromptId = prompt.id;
    clearTitleAssistFlow();
    clearDuplicateReminder();
    ui.promptTitleInput.value = prompt.title;
    ui.promptContentInput.value = prompt.content;
    render();

    window.setTimeout(() => {
      ui.promptTitleInput.focus();
    }, 50);
  }

  function resetPromptForm() {
    const ui = getUi();
    ui.promptTitleInput.value = '';
    ui.promptContentInput.value = '';
  }

  function clearDuplicateReminder() {
    state.duplicateWarning = '';
    state.duplicateConfirmToken = '';
    if (state.ui) {
      promptLibraryUi.setDuplicateWarning(state.ui, '');
    }
  }

  function formatPromptCount(count: number): string {
    return tp('prompt_library_count', count);
  }

  function handlePromptDraftInput() {
    clearDuplicateReminder();
    syncTitleAssistFlowDraft();
    render();
  }

  async function handleSavePrompt() {
    const store = state.store;
    const ui = state.ui;
    if (state.savePending || state.busyAction) {
      return;
    }
    if (!store || !ui) {
      return;
    }

    const draft = getPromptDraft();
    const title = draft.title;
    const content = draft.content;

    if (!title || !content) {
      syncPromptFormState();
      return;
    }

    if (draft.hasDuplicateTitle && !draft.confirmDuplicate) {
      state.duplicateConfirmToken = draft.duplicateToken;
      state.duplicateWarning = t('prompt_library_duplicate_warning');
      promptLibraryUi.setDuplicateWarning(ui, state.duplicateWarning);
      syncPromptFormState();
      schedulePosition();
      return;
    }

    state.savePending = true;
    syncPromptFormState();

    try {
      if (state.promptFormMode === 'edit') {
        const promptId = state.editingPromptId;
        if (!promptId || !findPromptById(promptId)) {
          return;
        }

        state.library = await store.updatePrompt(promptId, {
          title,
          content
        });
      } else {
        const result = await store.createPrompt({
          title,
          content
        });
        state.library = result.library;
      }

      state.promptFormVisible = false;
      resetPromptFormMode();
      clearTitleAssistFlow();
      clearDuplicateReminder();
      render();
    } catch {
    } finally {
      state.savePending = false;
      syncPromptFormState();
    }
  }

  async function handleDeletePrompt(promptId) {
    const store = state.store;
    if (state.savePending || state.busyAction) {
      return;
    }
    if (!store) {
      return;
    }
    if (!findPromptById(promptId)) {
      return;
    }

    setBusyPrompt('delete', promptId);
    render();

    try {
      state.library = await store.deletePrompt(promptId);
      render();
    } catch {
    } finally {
      clearBusyPrompt();
      render();
    }
  }

  function handleInjectPrompt(promptId) {
    const siteApi = state.siteApi;
    if (state.savePending || state.busyAction) {
      return;
    }
    if (!siteApi) {
      return;
    }

    const prompt = findPromptById(promptId);
    if (!prompt) {
      return;
    }

    const result = siteApi.insertPromptContent(prompt.content, state.siteId);
    if (!result.ok) {
      return;
    }

    setOpen(false);
  }

  async function handleCopyPrompt(promptId) {
    const store = state.store;
    if (state.savePending || state.busyAction) {
      return;
    }
    if (!store) {
      return;
    }

    const prompt = findPromptById(promptId);
    if (!prompt) {
      return;
    }

    setBusyPrompt('copy', promptId);
    render();

    try {
      const copyResult = await writeClipboard(prompt.content);
      if (!copyResult.ok) {
        return;
      }

      state.library = await store.markCopied(promptId);
    } catch {
    } finally {
      clearBusyPrompt();
      render();
    }
  }

  function findPromptById(promptId: string): PromptRecord | null {
    const library = state.library;
    if (!library) {
      return null;
    }
    return library.prompts.find((prompt) => prompt.id === promptId) || null;
  }

  function setBusyPrompt(action: string, promptId: string) {
    state.busyAction = action || '';
    state.busyPromptId = promptId || '';
  }

  function clearBusyPrompt() {
    state.busyAction = '';
    state.busyPromptId = '';
  }

  function resetPanelEphemeralState() {
    const hadVisibleState = state.promptFormVisible;
    state.promptFormVisible = false;
    resetPromptFormMode();
    clearDuplicateReminder();
    if (hadVisibleState) {
      render();
    }
  }

  function resetPromptFormMode() {
    state.promptFormMode = 'create';
    state.editingPromptId = '';
  }

  function syncPromptFormState(draft: PromptFormDraftState = getPromptDraft()) {
    const ui = state.ui;
    const library = state.library;
    const store = state.store;
    if (!ui || !library || !store) {
      return;
    }

    const interactionsLocked = state.savePending || Boolean(state.busyAction);
    promptLibraryUi.setPromptFormState(ui, {
      saveLabel: state.savePending
        ? t('prompt_library_save_busy')
        : draft.confirmDuplicate
          ? t('prompt_library_save_anyway')
          : t(state.promptFormMode === 'edit' ? 'prompt_library_save_changes' : 'prompt_library_save'),
      saveDisabled: interactionsLocked || !draft.canSave,
      saveBusy: state.savePending,
      cancelDisabled: interactionsLocked,
      toggleDisabled: interactionsLocked,
      closeDisabled: interactionsLocked,
      searchDisabled: interactionsLocked,
      fieldDisabled: interactionsLocked
    });
  }

  function getPromptDraft(): PromptFormDraftState {
    const title = normalizeTitle(state.ui?.promptTitleInput?.value || '');
    const content = normalizeContent(state.ui?.promptContentInput?.value || '');
    const duplicateToken = title.toLowerCase();
    const library = state.library;
    const store = state.store;
    const excludePromptId = state.promptFormMode === 'edit' ? state.editingPromptId : '';
    const hasDuplicateTitle = Boolean(
      title &&
        library &&
        store &&
        typeof store.hasDuplicateTitle === 'function' &&
        store.hasDuplicateTitle(library, title, excludePromptId)
    );

    return {
      title,
      content,
      duplicateToken,
      hasDuplicateTitle,
      confirmDuplicate: Boolean(hasDuplicateTitle && state.duplicateConfirmToken === duplicateToken),
      canSave: Boolean(title && content)
    };
  }

  function getSearchQuery() {
    return typeof state.filter.query === 'string' ? state.filter.query.trim() : '';
  }

  function clearSearchFilter(shouldFocus = true) {
    const ui = state.ui;
    state.filter.query = '';
    if (ui && ui.searchInput) {
      ui.searchInput.value = '';
      if (shouldFocus) {
        ui.searchInput.focus();
      }
    }
    render();
  }

  function handleScopedEscape(event) {
    if (!isEventInsideUi(event)) {
      return false;
    }

    if (state.savePending || state.busyAction) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    if (state.promptFormVisible) {
      closePromptForm();
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    if (getSearchQuery()) {
      clearSearchFilter();
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    return false;
  }

  async function writeClipboard(text) {
    if (!text) {
      return { ok: false, reason: 'Nothing to copy.' };
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return { ok: true, reason: '' };
      }
    } catch (error) {
      const fallback = await fallbackCopy(text);
      if (fallback.ok) {
        return fallback;
      }
      return {
        ok: false,
        reason: normalizeCopyError(error) || fallback.reason
      };
    }

    return fallbackCopy(text);
  }

  async function fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      textarea.style.inset = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (copied) {
        return { ok: true, reason: '' };
      }
      return { ok: false, reason: 'Browser blocked clipboard access.' };
    } catch (error) {
      return {
        ok: false,
        reason: normalizeCopyError(error) || 'Browser blocked clipboard access.'
      };
    }
  }

  function normalizeCopyError(error) {
    if (!error) {
      return '';
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
    return 'Browser blocked clipboard access.';
  }

  function attachStorageListener() {
    const store = state.store;
    const chromeRef =
      typeof chrome === 'undefined' ? null : (chrome as unknown as ChromeLikeWithStorageChanges);
    if (!store || !chromeRef?.storage?.onChanged) {
      return;
    }

    chromeRef.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }

      if (changes[store.STORAGE_KEY]) {
        const nextValue = changes[store.STORAGE_KEY].newValue;
        state.library = store.normalizeLibrary(nextValue, () => new Date().toISOString());
        render();
      }

      if (changes[promptEntrySettingsApi.KEY]) {
        state.entryEnabled = promptEntrySettingsApi.normalize(changes[promptEntrySettingsApi.KEY].newValue);
        syncEnvironment();
      }
    });
  }

  function isEventInsideUi(event: Event): boolean {
    const ui = state.ui;
    if (!ui || typeof event.composedPath !== 'function') {
      return false;
    }
    const path = event.composedPath();
    return path.includes(ui.entryHost) || path.includes(ui.panelHost);
  }

  function normalizeTitle(value) {
    if (typeof value !== 'string') {
      return '';
    }
    return value.replace(/\s+/g, ' ').trim();
  }

  function normalizeContent(value) {
    if (typeof value !== 'string') {
      return '';
    }
    return value.replace(/\r\n/g, '\n').trim();
  }

  function handleGeneratePromptTitle() {
    const siteApi = state.siteApi;
    if (state.savePending || state.busyAction) {
      return;
    }
    if (!siteApi) {
      return;
    }

    const draft = getPromptDraft();
    if (!draft.content || draft.title) {
      return;
    }

    const injectedPrompt = buildPromptTitleRequest(draft.content);
    const baselineReply = getLatestAssistantReplySnapshot();
    const result = siteApi.insertPromptContent(injectedPrompt, state.siteId);
    if (!result.ok) {
      return;
    }

    state.titleAssistFlow = {
      active: true,
      mode: state.promptFormMode,
      promptId: state.editingPromptId,
      awaitingAiTitle: true,
      contentDraft: draft.content,
      titleDraft: '',
      baselineAssistantCount: baselineReply.assistantCount,
      baselineAssistantText: baselineReply.text
    };
    syncTitleAssistFlowDraft();
    setOpen(false);
  }

  function buildPromptTitleRequest(content: string): string {
    return `${TITLE_HELPER_COPY.prompt}\n\nPrompt:\n【${content}】`;
  }

  function hasActiveTitleAssistFlow() {
    return Boolean(state.titleAssistFlow && state.titleAssistFlow.active);
  }

  function clearTitleAssistFlow() {
    state.titleAssistFlow = null;
  }

  function syncTitleAssistFlowDraft() {
    if (!hasActiveTitleAssistFlow()) {
      return;
    }

    const draft = getPromptDraft();
    const flow = state.titleAssistFlow as TitleAssistFlow;
    flow.mode = state.promptFormMode;
    flow.promptId = state.editingPromptId;
    flow.contentDraft = draft.content;
    flow.titleDraft = draft.title;
    if (draft.title) {
      flow.awaitingAiTitle = false;
    }
  }

  function restoreTitleAssistFlowOnOpen() {
    if (!hasActiveTitleAssistFlow()) {
      return false;
    }

    return restoreTitleAssistFlow();
  }

  function restoreTitleAssistFlow() {
    const ui = state.ui;
    if (!hasActiveTitleAssistFlow()) {
      return false;
    }
    if (!ui) {
      return false;
    }

    const flow = state.titleAssistFlow as TitleAssistFlow;
    const suggestedTitle = flow.awaitingAiTitle ? resolveTitleFromLatestAssistantReply(flow) : '';
    if (suggestedTitle) {
      flow.titleDraft = suggestedTitle;
      flow.awaitingAiTitle = false;
    }

    state.promptFormVisible = true;
    state.promptFormMode = flow.mode || 'create';
    state.editingPromptId = flow.promptId || '';
    state.filter.query = '';
    if (ui.searchInput) {
      ui.searchInput.value = '';
    }
    clearDuplicateReminder();
    ui.promptTitleInput.value = flow.titleDraft || '';
    ui.promptContentInput.value = flow.contentDraft || '';
    render();
    return true;
  }

  function resolveTitleFromLatestAssistantReply(flow: TitleAssistFlow): string {
    const latestReply = getLatestAssistantReplySnapshot();
    const hasNewAssistantReply =
      latestReply.assistantCount > flow.baselineAssistantCount || latestReply.text !== flow.baselineAssistantText;
    if (!hasNewAssistantReply) {
      return '';
    }

    return extractTitleCandidate(latestReply.text);
  }

  function getLatestAssistantReplySnapshot() {
    const adapterApi = ns.adapters;
    if (!adapterApi || typeof adapterApi.getAdapter !== 'function') {
      return { assistantCount: 0, text: '' };
    }

    const adapter = adapterApi.getAdapter();
    if (!adapter || typeof adapter.getConversationRoot !== 'function' || typeof adapter.getConversationMessages !== 'function') {
      return { assistantCount: 0, text: '' };
    }

    const root = adapter.getConversationRoot();
    if (!root) {
      return { assistantCount: 0, text: '' };
    }

    const sequence = adapter.getConversationMessages(root);
    let assistantCount = 0;
    let latestText = '';

    sequence.forEach((entry) => {
      if (entry.role !== 'assistant') {
        return;
      }

      assistantCount += 1;
      latestText = readAssistantReplyText(entry.node, adapter);
    });

    return {
      assistantCount,
      text: latestText
    };
  }

  function readAssistantReplyText(node: Element | null, adapter: Adapter | null): string {
    if (!node) {
      return '';
    }

    const utils = ns.utils;
    if (adapter && adapter.id === 'gemini' && utils && typeof utils.getTextWithoutHidden === 'function') {
      return utils.getTextWithoutHidden(node);
    }

    const htmlNode = node as HTMLElement;
    const rawText =
      typeof htmlNode.innerText === 'string' && htmlNode.innerText
        ? htmlNode.innerText
        : typeof node.textContent === 'string'
          ? node.textContent
          : '';
    return rawText.replace(/\r\n/g, '\n').trim();
  }

  function extractTitleCandidate(replyText: string): string {
    if (typeof replyText !== 'string') {
      return '';
    }

    const lines = replyText.replace(/\r\n/g, '\n').split('\n');
    for (const line of lines) {
      const candidate = line.trim();
      if (candidate) {
        return candidate;
      }
    }
    return '';
  }

  ns.promptLibrary = Object.assign({}, ns.promptLibrary, {
    start
  });
  window.ChatGptNav = ns;
