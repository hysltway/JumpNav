(() => {
  'use strict';

  const ns = window.ChatGptNav || {};
  ns.CONFIG = {
    previewMax: 96,
    debounceMs: 300,
    pollMs: 1500
  };

  window.ChatGptNav = ns;
})();
