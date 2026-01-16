(() => {
  'use strict';

  const ns = window.ChatGptNav;
  const { CONFIG } = ns;

  const state = {
    started: false,
    adapter: null,
    url: location.href,
    root: null,
    observer: null,
    messages: [],
    signature: '',
    rebuildTimer: null,
    pollTimer: null,
    ui: null
  };

  function start() {
    if (state.started) {
      return;
    }
    state.started = true;

    state.adapter = ns.adapters.getAdapter();
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
    state.ui = ns.ui.createUI();
    attachUiHandlers();
    scheduleRebuild('init');
    startUrlPolling();
  }

  function attachUiHandlers() {
    state.ui.toggle.addEventListener('click', () => {
      ns.ui.setCollapsed(state.ui, true);
    });

    state.ui.fab.addEventListener('click', () => {
      ns.ui.setCollapsed(state.ui, false);
    });

    state.ui.body.addEventListener('click', (event) => {
      const item = event.target.closest('.nav-item');
      if (!item) {
        return;
      }
      const index = Number(item.dataset.index);
      const message = state.messages[index];
      if (!message || !message.node) {
        return;
      }
      scrollToMessage(message.node);
    });
  }

  function startUrlPolling() {
    if (state.pollTimer) {
      return;
    }
    state.pollTimer = window.setInterval(() => {
      if (location.href !== state.url) {
        handleRouteChange('poll');
      }
    }, CONFIG.pollMs);
  }

  function handleRouteChange(source) {
    state.url = location.href;
    state.signature = '';
    state.messages = [];
    ns.ui.renderList(state.ui, state.messages);
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    state.root = null;
    scheduleRebuild(source);
  }

  function scheduleRebuild(reason) {
    if (state.rebuildTimer) {
      clearTimeout(state.rebuildTimer);
    }
    state.rebuildTimer = setTimeout(() => {
      state.rebuildTimer = null;
      rebuild(reason);
    }, CONFIG.debounceMs);
  }

  function rebuild(reason) {
    handlePotentialRouteChange(reason);

    const root = state.adapter.getConversationRoot();
    if (!root) {
      scheduleRebuild('wait-root');
      return;
    }

    if (root !== state.root) {
      state.root = root;
      attachObserver(root);
    }

    const sequence = state.adapter.getConversationMessages
      ? state.adapter.getConversationMessages(root)
      : [];
    const messages = [];
    sequence.forEach((entry, index) => {
      if (entry.role !== 'user') {
        return;
      }
      const text = ns.utils.normalizeText(entry.node.textContent || '');
      const title = text || `Prompt ${messages.length + 1}`;
      let assistantText = '';
      for (let i = index + 1; i < sequence.length; i += 1) {
        if (sequence[i].role === 'assistant') {
          assistantText = ns.utils.normalizeText(sequence[i].node.textContent || '');
          break;
        }
        if (sequence[i].role === 'user') {
          break;
        }
      }
      const preview = assistantText ? ns.utils.truncate(assistantText, CONFIG.previewMax) : '';
      messages.push({ node: entry.node, title, preview, text });
    });

    const lastText = messages.length ? messages[messages.length - 1].text : '';
    const lastPreview = messages.length ? messages[messages.length - 1].preview : '';
    const signature = `${messages.length}:${lastText}:${lastPreview}`;
    if (signature === state.signature) {
      return;
    }
    state.signature = signature;
    state.messages = messages;
    ns.ui.renderList(state.ui, state.messages);
  }

  function attachObserver(root) {
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

  function handlePotentialRouteChange(source) {
    if (location.href !== state.url) {
      handleRouteChange(source);
    }
  }

  function scrollToMessage(node) {
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    flashTarget(node);
  }

  function flashTarget(node) {
    if (typeof node.animate === 'function') {
      node.animate(
        [
          { boxShadow: '0 0 0 0 rgba(240, 163, 75, 0.0)' },
          { boxShadow: '0 0 0 4px rgba(240, 163, 75, 0.55)' },
          { boxShadow: '0 0 0 0 rgba(240, 163, 75, 0.0)' }
        ],
        { duration: 1200, easing: 'ease-out' }
      );
      return;
    }

    const prevOutline = node.style.outline;
    const prevOffset = node.style.outlineOffset;
    node.style.outline = '2px solid rgba(240, 163, 75, 0.7)';
    node.style.outlineOffset = '4px';
    setTimeout(() => {
      node.style.outline = prevOutline;
      node.style.outlineOffset = prevOffset;
    }, 1200);
  }

  ns.core = {
    start
  };
})();
