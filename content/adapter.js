(() => {
  'use strict';

  const ns = window.ChatGptNav;

  const ROLE_ATTRIBUTES = ['data-message-author-role', 'data-author-role', 'data-role'];
  const ROLE_ALIASES = {
    user: new Set(['user', 'human', 'me']),
    assistant: new Set(['assistant', 'ai', 'bot', 'model'])
  };

  function createChatLikeAdapter(id) {
    const combinedSelector = ROLE_ATTRIBUTES.map((attr) => `[${attr}]`).join(',');
    return {
      id,
      getConversationRoot() {
        return document.querySelector('main') || document.body;
      },
      getConversationMessages(root) {
        if (!root) {
          return [];
        }
        const nodes = root.querySelectorAll(combinedSelector);
        const messages = [];
        nodes.forEach((node) => {
          const role = getRoleFromNode(node);
          if (role) {
            messages.push({ node, role });
          }
        });
        return messages;
      }
    };
  }

  function createChatGptAdapter() {
    return createChatLikeAdapter('chatgpt');
  }

  function createPlusAiAdapter() {
    return createChatLikeAdapter('plusai');
  }

  function getRoleFromNode(node) {
    for (const attr of ROLE_ATTRIBUTES) {
      const value = node.getAttribute(attr);
      if (!value) {
        continue;
      }
      const normalized = value.toLowerCase();
      if (ROLE_ALIASES.user.has(normalized)) {
        return 'user';
      }
      if (ROLE_ALIASES.assistant.has(normalized)) {
        return 'assistant';
      }
    }
    return null;
  }

  function getAdapter() {
    const host = location.hostname;
    if (host === 'chatgpt.com' || host === 'chat.openai.com') {
      return createChatGptAdapter();
    }
    if (host === 'cc01.plusai.io') {
      return createPlusAiAdapter();
    }
    return null;
  }

  ns.adapters = {
    getAdapter
  };
})();
