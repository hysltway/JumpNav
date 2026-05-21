import { ns } from './namespace';
import { t } from '../shared/i18n';
import { createEmptyState } from '../shared/ui-kit/dom';
import { getUiThemePreset, replaceCssVars, UI_KIT_THEME_VAR_KEYS, UI_NAV_THEME_VAR_KEYS } from '../shared/ui-kit/theme';
import type {
  ColorScheme,
  ConversationMessage,
  PreviewLayout,
  SiteId,
  UiApi,
  UiHandle
} from './types';

const THEME_TOGGLE_ICONS: Record<ColorScheme, string> = {
  dark: '🌙',
  light: '☀'
};

function getMinimalLabel(short = false): string {
  return t(short ? 'nav_minimal_short' : 'nav_minimal');
}

function getHideLabel(short = false): string {
  return t(short ? 'nav_hide_short' : 'nav_hide');
}

function getPromptCountLabel(count: number): string {
  return t('nav_prompt_count', [String(count)]);
}

function getThemeToggleLabel(nextScheme: ColorScheme): string {
  return t(nextScheme === 'dark' ? 'nav_switch_to_dark' : 'nav_switch_to_light');
}

function createStyleElement(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = ns.UI_STYLE_TEXT || '';
  return style;
}

function applyThemeVars(root: HTMLElement, colorScheme: ColorScheme): void {
  if (!root || !root.style) {
    return;
  }

  const site = (root.dataset.site as SiteId | undefined) || getSiteKey();
  const scheme: ColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  const preset = getUiThemePreset(site, scheme);
  const navVars = preset.nav && typeof preset.nav === 'object' ? preset.nav : null;
  const kitVars = preset.kit && typeof preset.kit === 'object' ? preset.kit : null;
  if (navVars) {
    replaceCssVars(root, navVars, UI_NAV_THEME_VAR_KEYS);
  }
  if (kitVars) {
    replaceCssVars(root, kitVars, UI_KIT_THEME_VAR_KEYS);
  }
}

function createUI(): UiHandle {
  const container = document.createElement('div');
  container.id = 'chatgpt-nav-root';
  const shadow = container.attachShadow({ mode: 'open' });
  const style = createStyleElement();
  const root = createRootElement();
  const panelElements = createPanelElements();
  const previewElements = createPreviewElements();
  const fab = createFabButton();

  root.appendChild(panelElements.panel);
  root.appendChild(previewElements.preview);
  root.appendChild(fab);

  shadow.appendChild(style);
  shadow.appendChild(root);
  const mountRoot = getMountRoot();
  if (mountRoot) {
    mountRoot.appendChild(container);
  }

  return {
    container,
    root,
    panel: panelElements.panel,
    bodyWrap: panelElements.bodyWrap,
    body: panelElements.body,
    title: panelElements.title,
    subtitle: panelElements.subtitle,
    toggle: panelElements.toggle,
    minimalToggle: panelElements.minimalToggle,
    themeToggle: panelElements.themeToggle,
    preview: previewElements.preview,
    previewInner: previewElements.previewInner,
    fab
  };
}

function getMountRoot(): HTMLElement | null {
  return document.documentElement || document.body || null;
}

function ensureMounted(ui: UiHandle): boolean {
  if (!ui || !ui.container) {
    return false;
  }
  const mountRoot = getMountRoot();
  if (!mountRoot) {
    return false;
  }
  if (ui.container.parentElement !== mountRoot || !ui.container.isConnected) {
    mountRoot.appendChild(ui.container);
  }
  return ui.container.isConnected;
}

function createRootElement(): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'nav-root ui-root';
  root.dataset.visible = '0';
  root.dataset.collapsed = '0';
  root.dataset.adaptiveMinimal = '0';
  root.dataset.colorScheme = 'light';
  root.dataset.site = getSiteKey();
  applyThemeVars(root, 'light');
  return root;
}

function createPanelElements(): Pick<
  UiHandle,
  'panel' | 'bodyWrap' | 'body' | 'title' | 'subtitle' | 'toggle' | 'minimalToggle' | 'themeToggle'
> {
  const panel = document.createElement('div');
  panel.className = 'panel ui-panel';
  const headerElements = createPanelHeaderElements();
  const bodyElements = createPanelBodyElements();
  panel.appendChild(headerElements.header);
  panel.appendChild(bodyElements.bodyWrap);
  return {
    panel,
    bodyWrap: bodyElements.bodyWrap,
    body: bodyElements.body,
    title: headerElements.title,
    subtitle: headerElements.subtitle,
    toggle: headerElements.toggle,
    minimalToggle: headerElements.minimalToggle,
    themeToggle: headerElements.themeToggle
  };
}

function createPanelHeaderElements(): {
  header: HTMLDivElement;
  title: HTMLElement;
  subtitle: HTMLSpanElement;
  toggle: HTMLButtonElement;
  minimalToggle: HTMLButtonElement;
  themeToggle: HTMLButtonElement;
} {
  const header = document.createElement('div');
  header.className = 'panel-header';
  const titleWrap = document.createElement('div');
  titleWrap.className = 'panel-title';
  const title = document.createElement('strong');
  title.textContent = t('nav_navigator_title', ['ChatGPT']);
  const subtitle = document.createElement('span');
  subtitle.textContent = getPromptCountLabel(0);
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  const actions = document.createElement('div');
  actions.className = 'panel-actions';
  const themeToggle = createToggleButton(
    'panel-toggle panel-toggle-theme ui-button ui-icon-button',
    THEME_TOGGLE_ICONS.dark,
    getThemeToggleLabel('dark')
  );
  const minimalLabel = getMinimalLabel();
  const minimalToggle = createToggleButton('panel-toggle panel-toggle-minimal ui-button', minimalLabel, minimalLabel);
  minimalToggle.setAttribute('aria-pressed', 'false');
  const hideLabel = getHideLabel();
  const toggle = createToggleButton('panel-toggle ui-button', hideLabel, hideLabel);
  actions.appendChild(themeToggle);
  actions.appendChild(minimalToggle);
  actions.appendChild(toggle);
  header.appendChild(titleWrap);
  header.appendChild(actions);
  return { header, title, subtitle, toggle, minimalToggle, themeToggle };
}

function createToggleButton(className: string, text: string, ariaLabel: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  button.setAttribute('aria-label', ariaLabel);
  return button;
}

function createPanelBodyElements(): { bodyWrap: HTMLDivElement; body: HTMLDivElement } {
  const body = document.createElement('div');
  body.className = 'panel-body ui-scrollable';
  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'panel-body-wrap';
  bodyWrap.dataset.scrollable = '0';
  bodyWrap.dataset.scrollTop = '0';
  bodyWrap.dataset.scrollBottom = '0';
  const scrollHintTop = document.createElement('div');
  scrollHintTop.className = 'scroll-hint scroll-hint-top';
  const scrollHintBottom = document.createElement('div');
  scrollHintBottom.className = 'scroll-hint scroll-hint-bottom';
  const empty = createEmptyState(t('nav_empty_title'), '', {
    className: 'nav-empty',
    titleClassName: 'nav-empty-title'
  });
  body.appendChild(empty);
  bodyWrap.appendChild(body);
  bodyWrap.appendChild(scrollHintTop);
  bodyWrap.appendChild(scrollHintBottom);
  return { bodyWrap, body };
}

function createPreviewElements(): { preview: HTMLDivElement; previewInner: HTMLDivElement } {
  const preview = document.createElement('div');
  preview.className = 'nav-preview';
  preview.dataset.active = '0';
  preview.dataset.index = '';
  const previewInner = document.createElement('div');
  previewInner.className = 'nav-preview-inner ui-panel';
  preview.appendChild(previewInner);
  return { preview, previewInner };
}

function createFabButton(): HTMLButtonElement {
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'fab';
  fab.textContent = t('nav_fab_label');
  return fab;
}

function renderList(
  ui: UiHandle,
  messages: ConversationMessage[],
  options: { minimalMode?: boolean } = {}
): void {
  const minimalMode = Boolean(options.minimalMode);
  ui.body.textContent = '';
  ui.subtitle.textContent = getPromptCountLabel(messages.length);
  if (!messages.length) {
    ui.body.appendChild(createEmptyStateItem(minimalMode));
    return;
  }
  messages.forEach((message, index) => {
    ui.body.appendChild(createMessageItem(message, index, minimalMode));
  });
}

function createEmptyStateItem(minimalMode: boolean): HTMLDivElement {
  if (!minimalMode) {
    return createEmptyState(t('nav_empty_title'), '', {
      className: 'nav-empty',
      titleClassName: 'nav-empty-title'
    });
  }
  const empty = document.createElement('div');
  empty.className = 'nav-empty ui-empty';
  const minimalText = t('nav_empty_minimal');
  const words = minimalText.trim().split(/\s+/).filter(Boolean);
  const units = words.length ? words : [minimalText];
  units.forEach((word) => {
    const span = document.createElement('span');
    span.textContent = word;
    empty.appendChild(span);
  });
  return empty;
}

function createMessageItem(
  message: ConversationMessage,
  index: number,
  minimalMode: boolean
): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'nav-item ui-item';
  item.dataset.index = String(index);
  item.tabIndex = 0;
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', message.title);
  item.title = message.text;
  if (minimalMode) {
    const minimal = document.createElement('div');
    minimal.className = 'nav-item-minimal';
    minimal.textContent = `${index + 1}`;
    item.appendChild(minimal);
    return item;
  }
  const title = document.createElement('div');
  title.className = 'nav-item-title ui-item-title';
  title.textContent = message.title;
  item.appendChild(title);
  if (message.preview) {
    const preview = document.createElement('div');
    preview.className = 'nav-item-preview ui-item-preview';
    preview.textContent = message.preview;
    item.appendChild(preview);
  }
  return item;
}

function setCollapsed(ui: UiHandle, collapsed: boolean): void {
  ui.root.dataset.collapsed = collapsed ? '1' : '0';
}

function setVisible(ui: UiHandle, visible: boolean): void {
  if (!ui || !ui.root) {
    return;
  }
  ui.root.dataset.visible = visible ? '1' : '0';
}

function setMinimalMode(ui: UiHandle, enabled: boolean): void {
  ui.root.dataset.minimal = enabled ? '1' : '0';
  ui.minimalToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  ui.minimalToggle.classList.toggle('is-active', enabled);
  ui.minimalToggle.textContent = enabled ? getMinimalLabel(true) : getMinimalLabel();
  ui.toggle.textContent = enabled ? getHideLabel(true) : getHideLabel();
  ui.minimalToggle.setAttribute('aria-label', getMinimalLabel());
  ui.toggle.setAttribute('aria-label', getHideLabel());
  setThemeToggle(ui, (ui.root.dataset.colorScheme as ColorScheme) || 'light');
}

function setAdaptiveMinimal(ui: UiHandle, enabled: boolean): void {
  ui.root.dataset.adaptiveMinimal = enabled ? '1' : '0';
  if (enabled) {
    ui.minimalToggle.title = t('nav_adaptive_minimal_active');
  } else {
    ui.minimalToggle.removeAttribute('title');
  }
}

function setThemeToggle(ui: UiHandle, colorScheme: ColorScheme): void {
  if (!ui || !ui.themeToggle) {
    return;
  }
  const normalized: ColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  const nextScheme: ColorScheme = normalized === 'dark' ? 'light' : 'dark';
  const nextLabel = getThemeToggleLabel(nextScheme);
  const nextIcon = THEME_TOGGLE_ICONS[nextScheme];
  ui.themeToggle.dataset.nextScheme = nextScheme;
  ui.themeToggle.textContent = nextIcon;
  ui.themeToggle.setAttribute('aria-label', nextLabel);
  ui.themeToggle.title = nextLabel;
}

function setColorScheme(ui: UiHandle, colorScheme: ColorScheme): void {
  const normalized: ColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  ui.root.dataset.colorScheme = normalized;
  applyThemeVars(ui.root, normalized);
  setThemeToggle(ui, normalized);
}

function setActiveIndex(ui: UiHandle, index: number | null): void {
  const activeIndex = Number.isFinite(index) ? index : null;
  const items = ui.body.querySelectorAll<HTMLElement>('.nav-item');
  items.forEach((item) => {
    const itemIndex = Number(item.dataset.index);
    const isActive = activeIndex !== null && itemIndex === activeIndex;
    item.classList.toggle('is-active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'true');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function showPreview(
  ui: UiHandle,
  message: ConversationMessage,
  item: HTMLElement,
  options: { contentRight?: number | null } = {}
): void {
  if (!message || !item) {
    return;
  }
  const index = String(item.dataset.index || '');
  syncPreviewContent(ui, message, index);
  const layout = getPreviewLayout(ui.panel.getBoundingClientRect(), item.getBoundingClientRect(), options);
  applyPreviewLayout(ui, layout);
  ui.preview.dataset.active = '1';
}

function syncPreviewContent(ui: UiHandle, message: ConversationMessage, index: string): void {
  if (ui.preview.dataset.index === index) {
    return;
  }
  ui.previewInner.textContent = '';
  const title = document.createElement('div');
  title.className = 'nav-item-title ui-item-title';
  title.textContent = message.title;
  ui.previewInner.appendChild(title);

  if (message.preview) {
    const previewText = document.createElement('div');
    previewText.className = 'nav-item-preview ui-item-preview';
    previewText.textContent = message.preview;
    ui.previewInner.appendChild(previewText);
  }
  ui.preview.dataset.index = index;
}

function getPreviewLayout(
  panelRect: DOMRect,
  itemRect: DOMRect,
  options: { contentRight?: number | null } = {}
): PreviewLayout {
  const gap = 12;
  const viewportPadding = 8;
  const minWidth = 180;
  const maxWidth = Math.min(360, Math.floor(window.innerWidth * 0.56));
  const protectedRight =
    typeof options.contentRight === 'number' && Number.isFinite(options.contentRight)
      ? Math.max(0, Math.floor(options.contentRight))
      : null;
  const minLeft =
    typeof protectedRight === 'number' ? Math.max(viewportPadding, protectedRight + gap) : viewportPadding;
  const safeAvailable = panelRect.left - gap - minLeft;
  const canAvoidContent = Number.isFinite(safeAvailable) && safeAvailable >= minWidth;
  let width = canAvoidContent ? Math.min(maxWidth, Math.floor(safeAvailable)) : minWidth;
  if (!Number.isFinite(width) || width <= 0) {
    width = minWidth;
  }

  let left = panelRect.left - gap - width;
  if (canAvoidContent && left < minLeft) {
    left = minLeft;
  }
  const viewportRight = window.innerWidth - viewportPadding;
  const maxLeft = Math.max(viewportPadding, viewportRight - width);
  left = Math.min(Math.max(viewportPadding, left), maxLeft);
  const maxTop = Math.max(8, window.innerHeight - 8);
  const top = Math.min(Math.max(8, itemRect.top), maxTop);
  const overlay =
    !canAvoidContent && typeof protectedRight === 'number' && left < minLeft ? '1' : '0';
  return {
    overlay,
    width: `${Math.max(minWidth, width)}px`,
    left: `${left}px`,
    top: `${top}px`
  };
}

function applyPreviewLayout(ui: UiHandle, layout: PreviewLayout): void {
  ui.preview.dataset.overlay = layout.overlay;
  ui.preview.style.setProperty('--preview-width', layout.width);
  ui.preview.style.left = layout.left;
  ui.preview.style.right = 'auto';
  ui.preview.style.top = layout.top;
}

function hidePreview(ui: UiHandle, keepContent = false): void {
  ui.preview.dataset.active = '0';
  if (!keepContent) {
    ui.preview.dataset.index = '';
    ui.previewInner.textContent = '';
  }
}

function setTitle(ui: UiHandle, text: string): void {
  ui.title.textContent = text;
}

function getSiteKey(): SiteId {
  if (ns.site && typeof ns.site.getCurrentSiteId === 'function') {
    const siteId = ns.site.getCurrentSiteId();
    return siteId === 'generic' ? 'chatgpt' : siteId;
  }
  const host = typeof location !== 'undefined' ? location.hostname : '';
  if (host === 'gemini.google.com') {
    return 'gemini';
  }
  if (host === 'claude.ai') {
    return 'claude';
  }
  return 'chatgpt';
}

ns.ui = {
  createUI,
  ensureMounted,
  renderList,
  setVisible,
  setCollapsed,
  setMinimalMode,
  setAdaptiveMinimal,
  setThemeToggle,
  setColorScheme,
  setActiveIndex,
  showPreview,
  hidePreview,
  setTitle
} satisfies UiApi;
