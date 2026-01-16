(() => {
  'use strict';

  const ns = window.ChatGptNav;

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
        --nav-bg: #f7f4ee;
        --nav-surface: #ffffff;
        --nav-border: #e3ded4;
        --nav-text: #1f1e1a;
        --nav-muted: #6e675b;
        --nav-accent: #f0a34b;
        --nav-shadow: 0 18px 42px rgba(23, 21, 16, 0.16);
        font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      }

      .panel {
        position: fixed;
        top: 88px;
        right: 16px;
        width: 280px;
        max-height: calc(100vh - 112px);
        height: auto;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        background: linear-gradient(180deg, var(--nav-surface) 0%, var(--nav-bg) 100%);
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
        background: rgba(255, 255, 255, 0.9);
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

      .panel-toggle {
        border: 1px solid var(--nav-border);
        background: #fff;
        color: var(--nav-text);
        font-size: 12px;
        border-radius: 999px;
        padding: 6px 10px;
        cursor: pointer;
      }

      .panel-toggle:hover {
        border-color: var(--nav-accent);
        color: var(--nav-accent);
      }

      .panel-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
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
        border-color: var(--nav-accent);
        box-shadow: 0 8px 20px rgba(240, 163, 75, 0.16);
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

      .fab {
        position: fixed;
        right: 16px;
        bottom: 24px;
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
      }

      .fab:hover {
        border-color: var(--nav-accent);
        color: var(--nav-accent);
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

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'panel-toggle';
    toggle.textContent = 'Hide';

    header.appendChild(titleWrap);
    header.appendChild(toggle);

    const body = document.createElement('div');
    body.className = 'panel-body';

    const empty = document.createElement('div');
    empty.className = 'nav-empty';
    empty.textContent = 'No prompts found yet.';

    body.appendChild(empty);

    panel.appendChild(header);
    panel.appendChild(body);

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'fab';
    fab.textContent = 'Nav';

    root.appendChild(panel);
    root.appendChild(fab);

    shadow.appendChild(style);
    shadow.appendChild(root);
    document.body.appendChild(container);

    return {
      container,
      root,
      panel,
      body,
      subtitle,
      toggle,
      fab
    };
  }

  function renderList(ui, messages) {
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
      item.title = message.text;

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

      ui.body.appendChild(item);
    });
  }

  function setCollapsed(ui, collapsed) {
    ui.root.dataset.collapsed = collapsed ? '1' : '0';
  }

  ns.ui = {
    createUI,
    renderList,
    setCollapsed
  };
})();
