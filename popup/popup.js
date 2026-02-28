(() => {
  'use strict';

  const LINKS = {
    repo: 'https://github.com/hysltway/JumpNav',
    store: 'https://chromewebstore.google.com/detail/jumpnav-the-most-elegant/kkemkfabmgjcjlileggigaaemcheapep',
    bug: 'https://github.com/hysltway/JumpNav/issues/new?labels=bug&title=%5BBug%5D%20',
    feature: 'https://github.com/hysltway/JumpNav/issues/new?labels=enhancement&title=%5BFeature%5D%20'
  };

  document.addEventListener('DOMContentLoaded', bindLinkButtons);

  function bindLinkButtons() {
    const buttons = document.querySelectorAll('[data-link]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const linkKey = button.dataset.link;
        openLink(linkKey);
      });
    });
  }

  function openLink(linkKey) {
    const url = LINKS[linkKey];
    if (!url) {
      return;
    }
    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
      chrome.tabs.create({ url });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
})();
