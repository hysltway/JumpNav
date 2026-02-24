(() => {
  'use strict';

  const ns = window.ChatGptNav;

  const ROLE_ATTRIBUTES = ['data-message-author-role', 'data-author-role', 'data-role'];
  const ROLE_ALIASES = {
    user: new Set(['user', 'human', 'me']),
    assistant: new Set(['assistant', 'ai', 'bot', 'model'])
  };

  const GEMINI_SELECTORS = {
    root: ['chat-window', 'main', 'body'],
    turn: ['.conversation-container'],
    user: ['user-query .query-text', 'user-query'],
    assistant: ['model-response message-content', 'model-response']
  };

  function createChatLikeAdapter(id) {
    const combinedSelector = ROLE_ATTRIBUTES.map((attr) => `[${attr}]`).join(',');
    return {
      id,
      getConversationRoot() {
        return document.querySelector('main') || document.body;
      },
      getConversationMessages(root) {
        return getMessagesFromRoleAttributes(root, combinedSelector);
      }
    };
  }

  function createChatGptAdapter() {
    return createChatLikeAdapter('chatgpt');
  }

  function createGeminiAdapter() {
    return {
      id: 'gemini',
      getConversationRoot() {
        return findFirst(document, GEMINI_SELECTORS.root) || document.body;
      },
      getConversationMessages(root) {
        if (!root) {
          return [];
        }
        const turns = root.querySelectorAll(GEMINI_SELECTORS.turn.join(','));
        if (turns.length) {
          return collectGeminiTurns(turns);
        }
        const byNode = collectGeminiNodes(root);
        if (byNode.length) {
          return byNode;
        }
        return getMessagesFromRoleAttributes(root);
      }
    };
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

  function getMessagesFromRoleAttributes(root, selectorOverride) {
    if (!root) {
      return [];
    }
    const selector =
      selectorOverride || ROLE_ATTRIBUTES.map((attr) => `[${attr}]`).join(',');
    const nodes = root.querySelectorAll(selector);
    const messages = [];
    nodes.forEach((node) => {
      const role = getRoleFromNode(node);
      if (role) {
        messages.push({ node, role });
      }
    });
    return messages;
  }

  function collectGeminiTurns(turns) {
    const messages = [];
    turns.forEach((turn) => {
      const userNode = findFirst(turn, GEMINI_SELECTORS.user);
      if (userNode) {
        messages.push({ node: userNode, role: 'user' });
      }
      const assistantNode = findFirst(turn, GEMINI_SELECTORS.assistant);
      if (assistantNode) {
        messages.push({ node: assistantNode, role: 'assistant' });
      }
    });
    return messages;
  }

  function collectGeminiNodes(root) {
    const selector = GEMINI_SELECTORS.user.concat(GEMINI_SELECTORS.assistant).join(',');
    const nodes = root.querySelectorAll(selector);
    const messages = [];
    nodes.forEach((node) => {
      const role = getRoleFromGeminiNode(node);
      if (role) {
        messages.push({ node, role });
      }
    });
    return messages;
  }

  function getRoleFromGeminiNode(node) {
    if (matchesAny(node, GEMINI_SELECTORS.user)) {
      return 'user';
    }
    if (matchesAny(node, GEMINI_SELECTORS.assistant)) {
      return 'assistant';
    }
    return getRoleFromNode(node);
  }

  function matchesAny(node, selectors) {
    for (const selector of selectors) {
      if (node.matches(selector)) {
        return true;
      }
    }
    return false;
  }

  function findFirst(root, selectors) {
    for (const selector of selectors) {
      const node = root.querySelector(selector);
      if (node) {
        return node;
      }
    }
    return null;
  }

  function getAdapter() {
    const host = location.hostname;
    if (host === 'chatgpt.com' || host === 'chat.openai.com') {
      return createChatGptAdapter();
    }
    if (host === 'gemini.google.com') {
      return createGeminiAdapter();
    }
    return null;
  }

  ns.adapters = {
    getAdapter
  };
})();
