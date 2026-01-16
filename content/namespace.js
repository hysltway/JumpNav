(() => {
  'use strict';

  const ns = window.ChatGptNav || {};
  ns.CONFIG = {
    titleMax: 36,
    previewMax: 96,
    debounceMs: 300,
    pollMs: 1500
  };

  window.ChatGptNav = ns;
})();
