import { ns } from './namespace';
import { trackGrowth } from '../shared/growth';
import { t } from '../shared/i18n';

const BOOT_FLAG = 'jumpnavSidebarFavoritesInjected';
const STYLE_ID = 'jumpnav-sidebar-favorites-style';
const STORAGE_KEY = 'sidebar_favorites_v1';
const STORAGE_VERSION = 1;
const ROUTE_POLL_MS = 1200;
const DOM_SYNC_DEBOUNCE_MS = 140;
const FAVORITE_BUTTON_SELECTOR = '[data-jumpnav-favorite-button="1"]';

type SupportedSiteId = 'chatgpt' | 'gemini' | 'claude';

interface FavoritesStore {
  version: number;
  items: Record<string, true>;
}

interface SiteConfig {
  selector: string;
  pathPrefix: string;
  resolveMount(item: HTMLAnchorElement): { host: HTMLElement; title: HTMLElement } | null;
}

let started = false;
let booted = false;
let favorites = new Set<string>();
let currentUrl = location.href;
let observer: MutationObserver | null = null;
let routePollTimer: number | null = null;
let syncTimer: number | null = null;

const SITE_CONFIG: Record<SupportedSiteId, SiteConfig> = {
  chatgpt: {
    selector: 'a[data-sidebar-item="true"][href*="/c/"]',
    pathPrefix: '/c/',
    resolveMount(item) {
      const host = item.firstElementChild;
      if (!(host instanceof HTMLElement)) {
        return null;
      }
      const title = host.firstElementChild;
      if (!(title instanceof HTMLElement)) {
        return null;
      }
      return { host, title };
    }
  },
  gemini: {
    selector: 'a[data-test-id="conversation"][href*="/app/"], gem-nav-list-item[data-test-id="conversation"] a[href*="/app/"]',
    pathPrefix: '/app/',
    resolveMount(item) {
      const title = item.querySelector<HTMLElement>('.conversation-title, .title-text');
      if (!title) {
        return null;
      }
      return { host: item, title };
    }
  },
  claude: {
    selector: 'a[data-dd-action-name="sidebar-chat-item"][href*="/chat/"]',
    pathPrefix: '/chat/',
    resolveMount(item) {
      const host = item.firstElementChild;
      if (!(host instanceof HTMLElement)) {
        return null;
      }
      const title = host.firstElementChild;
      if (!(title instanceof HTMLElement)) {
        return null;
      }
      return { host, title };
    }
  }
};

function start(): void {
  if (started) {
    return;
  }
  started = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    void boot();
  }
}

async function boot(): Promise<void> {
  if (booted || document.documentElement.dataset[BOOT_FLAG] === '1') {
    return;
  }

  document.documentElement.dataset[BOOT_FLAG] = '1';
  booted = true;

  ensureStyle();
  await loadFavorites();
  syncSidebar();
  observeSidebarDom();
  startRoutePolling();
  attachStorageListener();
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    [data-jumpnav-favorite-item] {
      --jumpnav-favorite-title-offset: 22px;
      --jumpnav-favorite-left: 0px;
      --jumpnav-favorite-accent: #f59e0b;
      --jumpnav-favorite-hover-bg: rgba(245, 158, 11, 0.14);
    }

    [data-jumpnav-favorite-item="gemini"] {
      --jumpnav-favorite-left: 6px;
    }

    [data-jumpnav-favorite-host="1"] {
      position: relative;
    }

    [data-jumpnav-favorite-title="1"] {
      transition: padding-inline-start 140ms ease;
    }

    [data-jumpnav-favorite-item]:hover [data-jumpnav-favorite-title="1"],
    [data-jumpnav-favorite-item]:focus-within [data-jumpnav-favorite-title="1"],
    [data-jumpnav-favorite-item][data-jumpnav-favorited="1"] [data-jumpnav-favorite-title="1"] {
      padding-inline-start: var(--jumpnav-favorite-title-offset);
    }

    ${FAVORITE_BUTTON_SELECTOR} {
      position: absolute;
      inset-inline-start: var(--jumpnav-favorite-left);
      top: 50%;
      transform: translate3d(0, -50%, 0) scale(0.92);
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition:
        opacity 140ms ease,
        transform 140ms ease,
        color 140ms ease,
        background-color 140ms ease;
      -webkit-tap-highlight-color: transparent;
      z-index: 1;
    }

    [data-jumpnav-favorite-item]:hover ${FAVORITE_BUTTON_SELECTOR},
    [data-jumpnav-favorite-item]:focus-within ${FAVORITE_BUTTON_SELECTOR},
    [data-jumpnav-favorite-item][data-jumpnav-favorited="1"] ${FAVORITE_BUTTON_SELECTOR} {
      opacity: 1;
      pointer-events: auto;
      transform: translate3d(0, -50%, 0) scale(1);
    }

    [data-jumpnav-favorite-item][data-jumpnav-favorited="1"] ${FAVORITE_BUTTON_SELECTOR} {
      color: var(--jumpnav-favorite-accent);
    }

    ${FAVORITE_BUTTON_SELECTOR}:hover {
      background: var(--jumpnav-favorite-hover-bg);
    }

    ${FAVORITE_BUTTON_SELECTOR}:focus-visible {
      opacity: 1;
      pointer-events: auto;
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    ${FAVORITE_BUTTON_SELECTOR} svg {
      width: 16px;
      height: 16px;
      overflow: visible;
    }

    ${FAVORITE_BUTTON_SELECTOR} .jumpnav-favorite-star {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    ${FAVORITE_BUTTON_SELECTOR}[data-state="on"] .jumpnav-favorite-star {
      fill: currentColor;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-jumpnav-favorite-title="1"],
      ${FAVORITE_BUTTON_SELECTOR} {
        transition: none !important;
      }
    }
  `;

  document.documentElement.appendChild(style);
}

async function loadFavorites(): Promise<void> {
  const storageApi = ns.storage;
  if (!storageApi || typeof storageApi.getJson !== 'function') {
    favorites = new Set<string>();
    return;
  }

  const raw = await Promise.resolve(storageApi.getJson(STORAGE_KEY)).catch(() => null);
  favorites = normalizeFavorites(raw);
}

function normalizeFavorites(raw: unknown): Set<string> {
  const source = raw && typeof raw === 'object' ? (raw as Partial<FavoritesStore>) : {};
  const next = new Set<string>();
  const rawItems = source.items;

  if (!rawItems || typeof rawItems !== 'object') {
    return next;
  }

  Object.entries(rawItems as Record<string, unknown>).forEach(([key, value]) => {
    const normalizedKey = normalizeFavoriteKey(key);
    if (!normalizedKey || value !== true) {
      return;
    }
    next.add(normalizedKey);
  });

  return next;
}

function buildFavoritesStore(): FavoritesStore {
  const items: Record<string, true> = {};
  favorites.forEach((key) => {
    items[key] = true;
  });
  return {
    version: STORAGE_VERSION,
    items
  };
}

function observeSidebarDom(): void {
  if (observer || !document.body) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length || mutation.removedNodes.length) {
        scheduleSync();
        return;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function startRoutePolling(): void {
  if (routePollTimer) {
    return;
  }

  routePollTimer = window.setInterval(() => {
    if (location.href === currentUrl) {
      return;
    }
    currentUrl = location.href;
    scheduleSync();
  }, ROUTE_POLL_MS);
}

function scheduleSync(): void {
  if (syncTimer) {
    window.clearTimeout(syncTimer);
  }

  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    syncSidebar();
  }, DOM_SYNC_DEBOUNCE_MS);
}

function syncSidebar(): void {
  const siteId = getCurrentSiteId();
  if (!siteId) {
    return;
  }

  const config = SITE_CONFIG[siteId];
  document.querySelectorAll<HTMLAnchorElement>(config.selector).forEach((item) => {
    const key = getFavoriteKey(siteId, item, config.pathPrefix);
    if (!key) {
      return;
    }

    const mount = config.resolveMount(item);
    if (!mount) {
      return;
    }

    mountItem(siteId, key, item, mount.host, mount.title);
  });
}

function mountItem(
  siteId: SupportedSiteId,
  key: string,
  item: HTMLAnchorElement,
  host: HTMLElement,
  title: HTMLElement
): void {
  item.setAttribute('data-jumpnav-favorite-item', siteId);
  item.setAttribute('data-jumpnav-favorite-bound', '1');
  item.setAttribute('data-jumpnav-favorite-key', key);
  host.setAttribute('data-jumpnav-favorite-host', '1');
  title.setAttribute('data-jumpnav-favorite-title', '1');

  const foundButton = item.querySelector(FAVORITE_BUTTON_SELECTOR);
  let button: HTMLButtonElement | null = foundButton instanceof HTMLButtonElement ? foundButton : null;
  const existingButton = button;
  if (!button || button.parentElement !== host) {
    if (existingButton instanceof HTMLElement) {
      existingButton.remove();
    }
    button = createFavoriteButton();
    host.appendChild(button);
  }

  refreshItemState(item, button, key);
}

function createFavoriteButton(): HTMLButtonElement {
  const label = t('sidebar_favorites_add');
  const button = document.createElement('button');
  button.type = 'button';
  button.tabIndex = -1;
  button.draggable = false;
  button.setAttribute('data-jumpnav-favorite-button', '1');
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', label);
  button.title = label;
  button.appendChild(createStarIcon());
  button.addEventListener('pointerdown', suppressFavoriteEvent);
  button.addEventListener('click', handleFavoriteClick);
  button.addEventListener('dragstart', suppressFavoriteEvent);
  return button;
}

function createStarIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  path.setAttribute('class', 'jumpnav-favorite-star');
  path.setAttribute(
    'd',
    'M12 3.8l2.52 5.1 5.63.82-4.08 3.98.96 5.61L12 16.67 6.97 19.3l.96-5.61L3.85 9.72l5.63-.82L12 3.8Z'
  );

  svg.appendChild(path);
  return svg;
}

function handleFavoriteClick(event: MouseEvent): void {
  suppressFavoriteEvent(event);

  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const item = button.closest('[data-jumpnav-favorite-item]');
  if (!(item instanceof HTMLAnchorElement)) {
    return;
  }

  const key = item.getAttribute('data-jumpnav-favorite-key') || '';
  if (!key) {
    return;
  }

  const adding = !favorites.has(key);
  if (!adding) {
    favorites.delete(key);
  } else {
    favorites.add(key);
  }

  refreshItemState(item, button, key);
  if (adding) {
    void trackGrowth('favorite_add');
  }
  void persistFavorites();
}

function suppressFavoriteEvent(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function persistFavorites(): Promise<boolean> {
  const storageApi = ns.storage;
  if (!storageApi || typeof storageApi.setJson !== 'function') {
    return Promise.resolve(false);
  }

  return Promise.resolve(storageApi.setJson(STORAGE_KEY, buildFavoritesStore()))
    .then((saved) => Boolean(saved))
    .catch(() => false);
}

function attachStorageListener(): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return;
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEY]) {
      return;
    }

    favorites = normalizeFavorites(changes[STORAGE_KEY].newValue);
    syncSidebar();
  });
}

function refreshItemState(item: HTMLAnchorElement, button: HTMLButtonElement, key: string): void {
  const active = favorites.has(key);
  const label = t(active ? 'sidebar_favorites_remove' : 'sidebar_favorites_add');

  item.setAttribute('data-jumpnav-favorited', active ? '1' : '0');
  button.dataset.state = active ? 'on' : 'off';
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  button.setAttribute('aria-label', label);
  button.title = label;
}

function getFavoriteKey(siteId: SupportedSiteId, item: HTMLAnchorElement, pathPrefix: string): string {
  const rawHref = item.getAttribute('href') || item.href || '';
  if (!rawHref) {
    return '';
  }

  try {
    const url = new URL(rawHref, location.origin);
    const pathname = normalizePathname(url.pathname);
    if (!pathname || !pathname.startsWith(pathPrefix)) {
      return '';
    }
    return normalizeFavoriteKey(`${siteId}:${pathname}`);
  } catch {
    return '';
  }
}

function normalizeFavoriteKey(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function normalizePathname(value: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed || trimmed === '/') {
    return trimmed;
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function getCurrentSiteId(): SupportedSiteId | null {
  const siteId =
    ns.site && typeof ns.site.getCurrentSiteId === 'function' ? ns.site.getCurrentSiteId() : resolveSiteIdFromHost();

  if (siteId === 'chatgpt' || siteId === 'gemini' || siteId === 'claude') {
    return siteId;
  }

  return null;
}

function resolveSiteIdFromHost(): SupportedSiteId | null {
  const hostname = typeof location !== 'undefined' ? location.hostname : '';
  if (hostname === 'chatgpt.com' || hostname === 'chat.openai.com') {
    return 'chatgpt';
  }
  if (hostname === 'gemini.google.com') {
    return 'gemini';
  }
  if (hostname === 'claude.ai') {
    return 'claude';
  }
  return null;
}

ns.sidebarFavorites = Object.assign({}, ns.sidebarFavorites, {
  start
});
window.ChatGptNav = ns;
