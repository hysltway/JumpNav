(() => {
  'use strict';

  const ns = window.ChatGptNav;
  const MINIMAL_LABEL = 'Minimal';
  const MINIMAL_LABEL_SHORT = 'M';
  const HIDE_LABEL = 'Hide';
  const HIDE_LABEL_SHORT = 'H';

  function createUI() {
    const container = document.createElement('div');
    container.id = 'chatgpt-nav-root';
    const shadow = container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .nav-root, .nav-root * {
        box-sizing: border-box;
      }

      .nav-root {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        pointer-events: none;
        --nav-bg: #FBF9F4;
        --nav-surface: #FBF9F4;
        --nav-border: #e2d6ba;
        --nav-text: #1f1e1a;
        --nav-muted: #6e675b;
        --nav-accent: #d3b05b;
        --nav-accent-strong: #8f6b24;
        --nav-hover: #f4edd6;
        --nav-accent-shadow: rgba(143, 107, 36, 0.18);
        --nav-shadow: 0 18px 42px rgba(23, 21, 16, 0.16);
        --nav-panel-offset: 88px;
        --nav-panel-max-height: calc(100vh - 176px);
        font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      }

      .panel {
        position: fixed;
        top: var(--nav-panel-offset);
        right: 16px;
        width: 280px;
        max-height: var(--nav-panel-max-height);
        height: auto;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        background: var(--nav-surface);
        border: 1px solid var(--nav-border);
        border-radius: 16px;
        box-shadow: var(--nav-shadow);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px 8px 14px;
        border-bottom: 1px solid var(--nav-border);
        background: var(--nav-surface);
      }

      .panel-title {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .panel-title strong {
        font-size: 14px;
        letter-spacing: 0.3px;
        color: var(--nav-text);
      }

      .panel-title span {
        font-size: 12px;
        color: var(--nav-muted);
      }

      .panel-actions {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-wrap: nowrap;
      }

      .panel-toggle {
        border: 1px solid var(--nav-border);
        background: #fff;
        color: var(--nav-text);
        font-size: 12px;
        border-radius: 999px;
        padding: 6px 10px;
        cursor: pointer;
        white-space: nowrap;
      }

      .panel-toggle:hover {
        border-color: var(--nav-accent-strong);
        color: var(--nav-accent-strong);
        background: var(--nav-hover);
      }

      .panel-toggle.is-active {
        border-color: var(--nav-accent-strong);
        background: var(--nav-accent);
        color: #3b2a0b;
      }

      .panel-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: var(--nav-surface);
      }

      .nav-item {
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .nav-item:hover {
        border-color: var(--nav-accent-strong);
        box-shadow: 0 8px 20px var(--nav-accent-shadow);
      }

      .nav-root[data-minimal="1"] .nav-item {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        gap: 0;
      }

      .nav-item-title {
        font-size: 13px;
        color: var(--nav-text);
        font-weight: 600;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .nav-item-preview {
        font-size: 12px;
        color: var(--nav-muted);
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav-item-minimal {
        font-size: 11px;
        color: var(--nav-muted);
        letter-spacing: 0.9px;
        text-transform: uppercase;
      }

      .nav-empty {
        font-size: 12px;
        color: var(--nav-muted);
        text-align: center;
        margin-top: 24px;
      }

      .nav-root[data-collapsed="1"] .panel {
        display: none;
      }

      .nav-root[data-collapsed="0"] .fab {
        display: none;
      }

      .nav-root[data-minimal="1"] .panel {
        width: max-content;
        max-width: 70vw;
        top: var(--nav-panel-offset);
        transform: none;
      }

      .nav-root[data-minimal="1"] .panel-header {
        padding: 8px;
        align-items: center;
        justify-content: center;
      }

      .nav-root[data-minimal="1"] .panel-title {
        display: none;
      }

      .nav-root[data-minimal="1"] .panel-actions {
        gap: 4px;
        flex-direction: column;
        align-items: center;
      }

      .nav-root[data-minimal="1"] .panel-toggle {
        padding: 4px 6px;
        font-size: 11px;
        letter-spacing: 0.6px;
      }

      .nav-root[data-minimal="1"] .panel-body {
        padding: 8px;
        gap: 8px;
        width: max-content;
        align-items: center;
      }

      .nav-root[data-minimal="1"] .nav-item {
        width: 32px;
        height: 32px;
        padding: 0;
        border-radius: 999px;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 0;
      }

      .fab {
        position: fixed;
        right: 16px;
        top: calc(var(--nav-panel-offset) + 12px);
        width: 48px;
        height: 48px;
        border-radius: 999px;
        border: 1px solid var(--nav-border);
        background: var(--nav-surface);
        color: var(--nav-text);
        box-shadow: var(--nav-shadow);
        cursor: pointer;
        pointer-events: auto;
        font-size: 12px;
        letter-spacing: 0.4px;
        cursor: grab;
      }

      .fab:hover {
        border-color: var(--nav-accent-strong);
        color: var(--nav-accent-strong);
        background: var(--nav-hover);
      }

      .fab.dragging {
        cursor: grabbing;
      }

      .nav-preview {
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        max-width: 360px;
        opacity: 0;
        transform: translateX(12px);
        pointer-events: none;
        transition: width 180ms ease, opacity 160ms ease, transform 180ms ease;
        will-change: width, opacity, transform;
        z-index: 3;
        overflow: hidden;
      }

      .nav-preview[data-active="1"] {
        width: var(--preview-width, 260px);
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }

      .nav-preview-inner {
        background: var(--nav-surface);
        border: 1px solid var(--nav-border);
        border-radius: 14px;
        box-shadow: var(--nav-shadow);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .nav-root[data-minimal="1"] .nav-preview-inner {
        box-shadow: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .nav-preview {
          transition-duration: 0ms;
        }
      }
    `;

    const root = document.createElement('div');
    root.className = 'nav-root';
    root.dataset.collapsed = '0';

    const panel = document.createElement('div');
    panel.className = 'panel';

    const header = document.createElement('div');
    header.className = 'panel-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'panel-title';
    const title = document.createElement('strong');
    title.textContent = 'ChatGPT Navigator';
    const subtitle = document.createElement('span');
    subtitle.textContent = 'Prompts: 0';
    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'panel-actions';

    const minimalToggle = document.createElement('button');
    minimalToggle.type = 'button';
    minimalToggle.className = 'panel-toggle panel-toggle-minimal';
    minimalToggle.textContent = MINIMAL_LABEL;
    minimalToggle.setAttribute('aria-pressed', 'false');
    minimalToggle.setAttribute('aria-label', MINIMAL_LABEL);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'panel-toggle';
    toggle.textContent = HIDE_LABEL;
    toggle.setAttribute('aria-label', HIDE_LABEL);

    actions.appendChild(minimalToggle);
    actions.appendChild(toggle);

    header.appendChild(titleWrap);
    header.appendChild(actions);

    const body = document.createElement('div');
    body.className = 'panel-body';

    const empty = document.createElement('div');
    empty.className = 'nav-empty';
    empty.textContent = 'No prompts found yet.';

    body.appendChild(empty);

    panel.appendChild(header);
    panel.appendChild(body);

    const preview = document.createElement('div');
    preview.className = 'nav-preview';
    preview.dataset.active = '0';
    preview.dataset.index = '';

    const previewInner = document.createElement('div');
    previewInner.className = 'nav-preview-inner';
    preview.appendChild(previewInner);

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'fab';
    fab.textContent = 'Nav';

    root.appendChild(panel);
    root.appendChild(preview);
    root.appendChild(fab);

    shadow.appendChild(style);
    shadow.appendChild(root);
    document.body.appendChild(container);

    return {
      container,
      root,
      panel,
      body,
      title,
      subtitle,
      toggle,
      minimalToggle,
      preview,
      previewInner,
      fab
    };
  }

  function renderList(ui, messages, options = {}) {
    const minimalMode = Boolean(options.minimalMode);
    ui.body.textContent = '';

    ui.subtitle.textContent = `Prompts: ${messages.length}`;

    if (!messages.length) {
      const empty = document.createElement('div');
      empty.className = 'nav-empty';
      empty.textContent = 'No prompts found yet.';
      ui.body.appendChild(empty);
      return;
    }

    messages.forEach((message, index) => {
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.dataset.index = String(index);
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute(
        'aria-label',
        minimalMode ? `Prompt ${index + 1}` : message.title || `Prompt ${index + 1}`
      );
      item.title = minimalMode ? `Prompt ${index + 1}` : message.text;

      if (minimalMode) {
        const minimal = document.createElement('div');
        minimal.className = 'nav-item-minimal';
        minimal.textContent = `${index + 1}`;
        item.appendChild(minimal);
      } else {
        const title = document.createElement('div');
        title.className = 'nav-item-title';
        title.textContent = message.title;

        item.appendChild(title);

        if (message.preview) {
          const preview = document.createElement('div');
          preview.className = 'nav-item-preview';
          preview.textContent = message.preview;
          item.appendChild(preview);
        }
      }

      ui.body.appendChild(item);
    });
  }

  function setCollapsed(ui, collapsed) {
    ui.root.dataset.collapsed = collapsed ? '1' : '0';
  }

  function setMinimalMode(ui, enabled) {
    ui.root.dataset.minimal = enabled ? '1' : '0';
    ui.minimalToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    ui.minimalToggle.classList.toggle('is-active', enabled);
    ui.minimalToggle.textContent = enabled ? MINIMAL_LABEL_SHORT : MINIMAL_LABEL;
    ui.toggle.textContent = enabled ? HIDE_LABEL_SHORT : HIDE_LABEL;
    ui.minimalToggle.setAttribute('aria-label', MINIMAL_LABEL);
    ui.toggle.setAttribute('aria-label', HIDE_LABEL);
  }

  function showPreview(ui, message, item) {
    if (!message || !item) {
      return;
    }
    const index = String(item.dataset.index || '');
    if (ui.preview.dataset.index !== index) {
      ui.previewInner.textContent = '';
      const title = document.createElement('div');
      title.className = 'nav-item-title';
      title.textContent = message.title;
      ui.previewInner.appendChild(title);

      if (message.preview) {
        const previewText = document.createElement('div');
        previewText.className = 'nav-item-preview';
        previewText.textContent = message.preview;
        ui.previewInner.appendChild(previewText);
      }
      ui.preview.dataset.index = index;
    }

    const panelRect = ui.panel.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const gap = 12;
    const maxWidth = Math.min(360, Math.floor(window.innerWidth * 0.6));
    const minWidth = 180;
    const available = panelRect.left - gap;
    let width = Math.min(maxWidth, available);
    let overlay = false;

    if (width < minWidth) {
      overlay = true;
      width = Math.min(maxWidth, panelRect.width - 24);
    }

    ui.preview.dataset.overlay = overlay ? '1' : '0';
    width = Math.max(120, Math.floor(width));
    if (overlay && panelRect.width > 24) {
      width = Math.min(width, panelRect.width - 24);
    }
    ui.preview.style.setProperty('--preview-width', `${width}px`);

    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    let left = overlay
      ? panelRect.right - width - gap
      : panelRect.left - gap - width;
    left = Math.min(Math.max(8, left), maxLeft);
    ui.preview.style.left = `${left}px`;
    ui.preview.style.right = 'auto';

    const maxTop = Math.max(8, window.innerHeight - 8);
    const top = Math.min(Math.max(8, itemRect.top), maxTop);
    ui.preview.style.top = `${top}px`;

    ui.preview.dataset.active = '1';
  }

  function hidePreview(ui, keepContent = false) {
    ui.preview.dataset.active = '0';
    if (!keepContent) {
      ui.preview.dataset.index = '';
      ui.previewInner.textContent = '';
    }
  }

  function setTitle(ui, text) {
    ui.title.textContent = text;
  }

  ns.ui = {
    createUI,
    renderList,
    setCollapsed,
    setMinimalMode,
    showPreview,
    hidePreview,
    setTitle
  };
})();
