(() => {
  'use strict';

  const ns = window.ChatGptNav;

  function normalizeText(value) {
    return value.replace(/\s+/g, ' ').trim();
  }

  function truncate(value, maxLen) {
    if (value.length <= maxLen) {
      return value;
    }
    return `${value.slice(0, maxLen - 3)}...`;
  }

  ns.utils = {
    normalizeText,
    truncate
  };
})();
