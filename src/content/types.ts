import type { ChromeLike, JsonStorageApi } from '../shared/formula-settings';

export type SiteId = 'chatgpt' | 'gemini' | 'claude' | 'generic';
export type ColorScheme = 'light' | 'dark';
export type ConversationRole = 'user' | 'assistant';

export interface ConversationEntry {
  node: Element;
  role: ConversationRole;
}

export interface ConversationMessage {
  node: Element;
  title: string;
  preview: string;
  text: string;
  endNode: Element | null;
}

export interface Adapter {
  id: SiteId | string;
  getConversationRoot(): Element | null;
  getConversationMessages(root: ParentNode | null): ConversationEntry[];
}

export interface AdapterApi {
  getAdapter(): Adapter | null;
}

export interface UtilsApi {
  normalizeText(value: string): string;
  getTextWithoutHidden(node: Node | null): string;
  truncate(value: string, maxLen: number): string;
}

export interface StorageGetRawResult<T = unknown> {
  found: boolean;
  value: T | undefined;
}

export interface StorageApi extends JsonStorageApi {
  getRaw<T = unknown>(key: string): Promise<StorageGetRawResult<T>>;
  setRaw(key: string, value: unknown): Promise<boolean>;
  getBoolean(key: string): Promise<boolean | null>;
  setBoolean(key: string, value: boolean): Promise<boolean>;
  getJson<T = unknown>(key: string): Promise<T | null>;
  setJson(key: string, value: unknown): Promise<boolean>;
}

export interface SiteApi {
  SITE_ID: Record<string, SiteId>;
  resolveSiteId(hostname: unknown): SiteId;
  isSupportedSite(siteId: string): boolean;
  getCurrentSiteId(): SiteId;
}

export interface ConversationIndexerApi {
  getConversationSequence(adapter: Adapter | null, root: ParentNode | null): ConversationEntry[];
  buildUserMessages(sequence: ConversationEntry[], adapter: Adapter | null): ConversationMessage[];
  buildMessagesSignature(messages: ConversationMessage[]): string;
}

export interface CoreConversationIndexerApi {
  createConversationIndexer(overrides?: {
    utils?: Partial<UtilsApi>;
    previewMax?: number;
  }): ConversationIndexerApi;
}

export interface UiThemePreset {
  nav: Record<string, string>;
  kit?: Record<string, string>;
  formula?: Record<string, string>;
}

export interface UiHandle {
  container: HTMLDivElement;
  root: HTMLDivElement;
  panel: HTMLDivElement;
  bodyWrap: HTMLDivElement;
  body: HTMLDivElement;
  title: HTMLElement;
  subtitle: HTMLSpanElement;
  toggle: HTMLButtonElement;
  minimalToggle: HTMLButtonElement;
  themeToggle: HTMLButtonElement;
  preview: HTMLDivElement;
  previewInner: HTMLDivElement;
  fab: HTMLButtonElement;
}

export interface PreviewLayout {
  overlay: string;
  width: string;
  left: string;
  top: string;
}

export interface UiApi {
  createUI(): UiHandle;
  ensureMounted(ui: UiHandle): boolean;
  renderList(
    ui: UiHandle,
    messages: ConversationMessage[],
    options?: { minimalMode?: boolean }
  ): void;
  setVisible(ui: UiHandle, visible: boolean): void;
  setCollapsed(ui: UiHandle, collapsed: boolean): void;
  setMinimalMode(ui: UiHandle, enabled: boolean): void;
  setAdaptiveMinimal(ui: UiHandle, enabled: boolean): void;
  setThemeToggle(ui: UiHandle, colorScheme: ColorScheme): void;
  setColorScheme(ui: UiHandle, colorScheme: ColorScheme): void;
  setActiveIndex(ui: UiHandle, index: number | null): void;
  showPreview(
    ui: UiHandle,
    message: ConversationMessage,
    item: HTMLElement,
    options?: { contentRight?: number | null }
  ): void;
  hidePreview(ui: UiHandle, keepContent?: boolean): void;
  setTitle(ui: UiHandle, text: string): void;
}

export interface CoreState {
  started: boolean;
  adapter: Adapter | null;
  url: string;
  root: Element | null;
  observer: MutationObserver | null;
  messages: ConversationMessage[];
  signature: string;
  conversationIndexReady: boolean;
  conversationIndexUrl: string;
  rebuildTimer: number | null;
  pollTimer: number | null;
  ui: UiHandle | null;
  minimalMode: boolean;
  adaptiveMinimalMode: boolean;
  effectiveMinimalMode: boolean;
  previewIndex: number | null;
  activeIndex: number | null;
  activeRaf: number | null;
  previewHideTimer: number | null;
  normalPanelWidth: number;
  colorScheme: ColorScheme;
  themeObserver: MutationObserver | null;
  themeRaf: number | null;
  themeMql: MediaQueryList | null;
  themeMqlHandler: (() => void) | null;
  highlightRaf: number | null;
  highlightRestoreTimer: number | null;
  highlightToken: number;
  lastScrollAt: number;
  minimalScrollRaf: number | null;
  suppressEnsureVisibleUntil: number;
  manualModeOverride: boolean;
  [key: string]: unknown;
}

export interface ConversationIndexState {
  ready: boolean;
  hasConversation: boolean;
}

export interface NavigationCallbacks {
  handleThemeToggle(event: Event): void;
  setCollapsed(collapsed: boolean, persist?: boolean): void;
  setMinimalMode(enabled: boolean): void;
  syncAdaptiveMode(force?: boolean): void;
  ensureUiMounted(): boolean;
  setActiveIndex(nextIndex: number | null, force?: boolean): void;
  snapNavListToEdge(index: number): void;
  scrollToMessage(node: Element): void;
  scheduleMinimalScrollHintUpdate(): void;
  handleItemPointerOver(event: Event): void;
  handleItemPointerOut(event: Event): void;
  handleItemFocusIn(event: Event): void;
  handleItemFocusOut(event: Event): void;
  handlePreviewPointerEnter(): void;
  handlePreviewPointerLeave(event: Event): void;
  handlePreviewClick(): void;
  refreshThemeTrackingTargets(): void;
  syncColorScheme(force?: boolean): void;
  cancelPendingBubbleHighlight(): void;
  renderMessages(): void;
  rebuild(reason: string): void;
  loadMinimalMode(): boolean | Promise<boolean | null> | null;
}

export interface CoreNavigationConfig {
  pollMs: number;
  debounceMs: number;
}

export interface NavigationApiContext {
  state: CoreState;
  config: CoreNavigationConfig;
  callbacks: NavigationCallbacks;
  MANUAL_NAV_SCROLL_LOCK_MS: number;
  FAB_RIGHT_OFFSET: number;
  FAB_VERTICAL_PADDING: number;
  windowRef?: Window;
  documentRef?: Document;
  locationRef?: Location;
}

export interface CoreNavigationControllerApi {
  initNavigationApi(ctx: NavigationApiContext): void;
  attachUiHandlers(): void;
  initFabDrag(): void;
  startUrlPolling(): void;
  handleRouteChange(source: string): void;
  scheduleRebuild(reason: string): void;
  handlePotentialRouteChange(source: string): void;
  hydrateMinimalModePreference(): void;
}

export interface CoreThemeContext {
  state: CoreState;
  THEME_ATTRIBUTE_FILTER: string[];
  THEME_TRANSITION_STYLE_ID: string;
  THEME_TRANSITION_DURATION_MS: number;
  THEME_TRANSITION_EASING: string;
}

export interface CoreThemeApi {
  initThemeApi(ctx: CoreThemeContext): void;
  initThemeTracking(): void;
  refreshThemeTrackingTargets(): void;
  scheduleThemeSync(): void;
  syncColorScheme(force?: boolean): void;
  handleThemeToggle(event: Event): void;
}

export interface CoreBehaviorContext {
  state: CoreState;
  PREVIEW_HIDE_DELAY: number;
  MINIMAL_MODE_KEY: string;
  DEFAULT_NORMAL_PANEL_WIDTH: number;
  PANEL_CONTENT_MIN_GAP: number;
  ADAPTIVE_INTERSECT_ENTER_GAP: number;
  ADAPTIVE_INTERSECT_EXIT_GAP: number;
  MESSAGE_SCAN_LIMIT: number;
  FULL_WIDTH_IGNORE_RATIO: number;
  MESSAGE_CONTENT_SELECTORS: string;
  MESSAGE_ROLE_SELECTORS: string;
  MESSAGE_INNER_SELECTORS: string;
  SCROLL_HIGHLIGHT_WAIT_MS: number;
  SCROLL_HIGHLIGHT_DURATION_MS: number;
  SCROLL_SETTLE_IDLE_MS: number;
  HIGHLIGHT_DARKEN_DELTA: number;
  CHATGPT_USER_BUBBLE_SELECTOR: string;
  GEMINI_USER_BUBBLE_SELECTOR: string;
  CLAUDE_USER_BUBBLE_SELECTOR: string;
  CHATGPT_USER_BUBBLE_BG: string;
  GEMINI_USER_BUBBLE_BG: string;
  CLAUDE_USER_BUBBLE_BG: string;
  scrollToMessage(node: Element): void;
}

export interface CoreUiBehaviorApi {
  initBehaviorApi(ctx: CoreBehaviorContext): void;
  flashTarget(node: Element): void;
  cancelPendingBubbleHighlight(): void;
  getNavigatorTitle(): string;
  renderMessages(): void;
  scheduleMinimalScrollHintUpdate(): void;
  syncDisplayMode(forceRender?: boolean): void;
  syncAdaptiveMode(force?: boolean): void;
  setMinimalMode(enabled: boolean): void;
  loadMinimalMode(): boolean | Promise<boolean | null> | null;
  handleItemPointerOver(event: Event): void;
  handleItemPointerOut(event: Event): void;
  handleItemFocusIn(event: Event): void;
  handleItemFocusOut(event: Event): void;
  handlePreviewPointerEnter(): void;
  handlePreviewPointerLeave(event: Event): void;
  handlePreviewClick(): void;
  showPreviewForItem(item: HTMLElement): void;
  initActiveTracking(): void;
  refreshActiveIndex(force?: boolean): void;
  setActiveIndex(nextIndex: number | null, force?: boolean): void;
  snapNavListToEdge(index: number): void;
  clearPreviewHideTimer(): void;
}

export interface PromptRecord {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  copyCount: number;
  lastCopiedAt: string | null;
}

export interface PromptLibrary {
  version: number;
  updatedAt: string;
  prompts: PromptRecord[];
}

export interface PromptDraft {
  title: string;
  content: string;
}

export type PromptFormMode = 'create' | 'edit';

export interface PromptFilter {
  query?: string;
}

export interface PromptViewModel {
  id: string;
  title: string;
  content: string;
}

export interface PromptLibraryStoreApi {
  STORAGE_KEY: string;
  VERSION: number;
  read(): Promise<PromptLibrary>;
  write(library: PromptLibrary): Promise<PromptLibrary>;
  createPrompt(draft: PromptDraft): Promise<{ library: PromptLibrary; prompt: PromptRecord }>;
  updatePrompt(promptId: string, draft: PromptDraft): Promise<PromptLibrary>;
  deletePrompt(promptId: string): Promise<PromptLibrary>;
  markCopied(promptId: string): Promise<PromptLibrary>;
  filterPrompts(library: PromptLibrary, filter?: PromptFilter): PromptRecord[];
  hasDuplicateTitle(library: PromptLibrary, title: string, excludePromptId?: string): boolean;
  normalizeLibrary(rawLibrary: unknown, nowFn: () => string): PromptLibrary;
}

export interface MountTarget {
  container: HTMLElement | null;
  referenceNode?: Element | null;
  inlineRow?: boolean;
  gap?: string;
  hostMarginInlineStart?: string;
  hostAlignSelf?: string;
  hostHeight?: string;
}

export interface InsertPromptResult {
  ok: boolean;
  reason: string;
  editor?: Element;
}

export interface PanelPlacement {
  direction?: string;
  anchor?: string;
  mode?: string;
  offsetX?: number;
  offsetY?: number;
  maxWidth?: number;
}

export interface PromptLibrarySiteApi {
  THEME_ATTRIBUTE_FILTER: string[];
  getCurrentSiteId(): SiteId;
  getColorScheme(siteId?: SiteId): ColorScheme;
  getPanelPlacement(siteId?: SiteId): PanelPlacement;
  findMountTarget(siteId?: SiteId): MountTarget | null;
  insertPromptContent(content: string, siteId?: SiteId): InsertPromptResult;
}

export interface PromptLibraryUiHandle {
  entryHost: HTMLSpanElement;
  panelHost: HTMLDivElement;
  entryRoot: HTMLDivElement;
  entryButton: HTMLButtonElement;
  panelRoot: HTMLDivElement;
  panel: HTMLElement;
  countText: HTMLElement;
  closeButton: HTMLButtonElement;
  promptToggleButton: HTMLButtonElement;
  searchInput: HTMLInputElement;
  promptFormWrap: HTMLElement;
  promptForm: HTMLFormElement;
  promptTitleInput: HTMLInputElement;
  promptContentInput: HTMLTextAreaElement;
  promptTitleHelper: HTMLElement;
  promptTitleHelperButton: HTMLButtonElement;
  promptSaveButton: HTMLButtonElement;
  promptCancelButton: HTMLButtonElement;
  promptWarning: HTMLElement;
  list: HTMLElement;
}

export interface PromptLibraryRenderOptions {
  hasQuery?: boolean;
  query?: string;
  hideEmptyState?: boolean;
  busyAction?: string;
  busyPromptId?: string;
}

export interface PromptFormState {
  saveLabel: string;
  saveDisabled: boolean;
  saveBusy: boolean;
  cancelDisabled: boolean;
  toggleDisabled: boolean;
  closeDisabled: boolean;
  searchDisabled: boolean;
  fieldDisabled: boolean;
}

export interface TitleHelperState {
  visible: boolean;
  disabled: boolean;
}

export interface PromptLibraryUiApi {
  createPromptLibraryUI(): PromptLibraryUiHandle;
  mountEntry(ui: PromptLibraryUiHandle, target: MountTarget | null): boolean;
  detachEntry(ui: PromptLibraryUiHandle): void;
  setTheme(ui: PromptLibraryUiHandle, site: SiteId | string, scheme: ColorScheme): void;
  setOpen(ui: PromptLibraryUiHandle, open: boolean): void;
  positionPanel(ui: PromptLibraryUiHandle, anchorRect: DOMRect, placement?: PanelPlacement): void;
  renderPrompts(
    ui: PromptLibraryUiHandle,
    prompts: PromptViewModel[],
    options?: PromptLibraryRenderOptions
  ): void;
  setCounts(ui: PromptLibraryUiHandle, text: string): void;
  setCountVisibility(ui: PromptLibraryUiHandle, visible: boolean): void;
  setPromptFormVisible(ui: PromptLibraryUiHandle, visible: boolean): void;
  setDuplicateWarning(ui: PromptLibraryUiHandle, text: string): void;
  setTitleHelperState(ui: PromptLibraryUiHandle, options: TitleHelperState): void;
  setPromptFormState(ui: PromptLibraryUiHandle, options: PromptFormState): void;
  destroy(ui: PromptLibraryUiHandle): void;
}

export interface PromptFormDraftState {
  title: string;
  content: string;
  duplicateToken: string;
  hasDuplicateTitle: boolean;
  confirmDuplicate: boolean;
  canSave: boolean;
}

export interface CopyResult {
  ok: boolean;
  reason: string;
}

export interface TitleAssistFlow {
  active: boolean;
  mode: PromptFormMode;
  promptId: string;
  awaitingAiTitle: boolean;
  contentDraft: string;
  titleDraft: string;
  baselineAssistantCount: number;
  baselineAssistantText: string;
}

export interface PromptLibraryState {
  started: boolean;
  booted: boolean;
  store: PromptLibraryStoreApi | null;
  siteApi: PromptLibrarySiteApi | null;
  ui: PromptLibraryUiHandle | null;
  library: PromptLibrary | null;
  siteId: SiteId;
  colorScheme: ColorScheme;
  entryEnabled: boolean;
  open: boolean;
  mounted: boolean;
  url: string;
  filter: Required<PromptFilter>;
  promptFormVisible: boolean;
  promptFormMode: PromptFormMode;
  editingPromptId: string;
  duplicateWarning: string;
  duplicateConfirmToken: string;
  savePending: boolean;
  busyAction: string;
  busyPromptId: string;
  titleAssistFlow: TitleAssistFlow | null;
  environmentSyncTimer: number | null;
  environmentObserver: MutationObserver | null;
  themeObserver: MutationObserver | null;
  panelResizeObserver: ResizeObserver | null;
  routePollTimer: number | null;
  positionRaf: number | null;
}

export interface ChromeStorageChange<T = unknown> {
  newValue?: T;
  oldValue?: T;
}

export interface ChromeLikeWithStorageChanges extends ChromeLike {
  storage?: ChromeLike['storage'] & {
    onChanged?: {
      addListener(
        callback: (changes: Record<string, ChromeStorageChange>, areaName: string) => void
      ): void;
    };
  };
}
