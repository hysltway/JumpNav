import { ns } from './namespace';
import type { Adapter, AdapterApi, ConversationEntry, ConversationRole, SiteId } from './types';

const ROLE_ATTRIBUTES = ['data-message-author-role', 'data-author-role', 'data-role'] as const;
const ROLE_ALIASES = {
  user: new Set(['user', 'human', 'me']),
  assistant: new Set(['assistant', 'ai', 'bot', 'model'])
};
const ROLE_SELECTOR = ROLE_ATTRIBUTES.map((attributeName) => `[${attributeName}]`).join(',');

const CHATGPT_TURN_SELECTOR = 'section[data-turn]';

const GEMINI_SELECTORS = {
  root: ['chat-window', 'main', 'body'],
  turn: ['.conversation-container'],
  user: ['user-query .query-text', 'user-query'],
  assistant: ['model-response message-content', 'model-response']
} as const;

const CLAUDE_SELECTORS = {
  root: ['#main-content .overflow-y-scroll', '#main-content', 'main', 'body'],
  user: ["[data-testid='user-message']"],
  assistant: ['.font-claude-response']
} as const;

const FALLBACK_HOST_TO_SITE: Record<string, SiteId> = Object.freeze({
  'chatgpt.com': 'chatgpt',
  'chat.openai.com': 'chatgpt',
  'gemini.google.com': 'gemini',
  'claude.ai': 'claude'
});

interface AdapterEnvironment {
  documentRef?: Document;
  locationRef?: Location;
}

function createEnvironment(overrides: AdapterEnvironment = {}): { documentRef: Document; locationRef: Location } {
  return {
    documentRef: overrides.documentRef || document,
    locationRef: overrides.locationRef || location
  };
}

function createAdapterApi(environment: AdapterEnvironment = createEnvironment()): AdapterApi {
  const env = createEnvironment(environment);
  return {
    getAdapter() {
      return resolveAdapterForHost(env.locationRef.hostname, env.documentRef);
    }
  };
}

function resolveAdapterForHost(hostname: unknown, documentRef: Document): Adapter | null {
  const siteId = resolveSiteId(hostname);
  if (siteId === 'chatgpt') {
    return createChatLikeAdapter('chatgpt', documentRef);
  }
  if (siteId === 'gemini') {
    return createGeminiAdapter(documentRef);
  }
  if (siteId === 'claude') {
    return createClaudeAdapter(documentRef);
  }
  return null;
}

function resolveSiteId(hostname: unknown): SiteId {
  if (ns.site && typeof ns.site.resolveSiteId === 'function') {
    return ns.site.resolveSiteId(hostname);
  }
  if (typeof hostname !== 'string') {
    return 'generic';
  }
  const normalizedHost = hostname.trim().toLowerCase();
  return FALLBACK_HOST_TO_SITE[normalizedHost] || 'generic';
}

function createChatLikeAdapter(id: SiteId, documentRef: Document): Adapter {
  return {
    id,
    getConversationRoot() {
      return documentRef.querySelector('main') || documentRef.body;
    },
    getConversationMessages(root) {
      const turnMessages = collectChatGptTurnMessages(root);
      if (turnMessages.length) {
        return turnMessages;
      }
      return collectMessagesByRoleAttributes(root, ROLE_SELECTOR);
    }
  };
}

function collectChatGptTurnMessages(root: ParentNode | null): ConversationEntry[] {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return [];
  }
  const messages: Array<ConversationEntry & { order: number; sourceIndex: number }> = [];
  let sourceIndex = 0;
  root.querySelectorAll(CHATGPT_TURN_SELECTOR).forEach((node) => {
    const rawRole = node.getAttribute('data-turn');
    if (rawRole === 'user' || rawRole === 'assistant') {
      messages.push({
        node,
        role: rawRole,
        order: getChatGptTurnOrder(node),
        sourceIndex
      });
      sourceIndex += 1;
    }
  });
  if (messages.some((message) => Number.isFinite(message.order))) {
    messages.sort((a, b) => a.order - b.order || a.sourceIndex - b.sourceIndex);
  }
  return messages.map(({ node, role }) => ({ node, role }));
}

function getChatGptTurnOrder(node: Element): number {
  const testId = node.getAttribute('data-testid') || '';
  const match = /^conversation-turn-(\d+)$/.exec(testId);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function createGeminiAdapter(documentRef: Document): Adapter {
  return {
    id: 'gemini',
    getConversationRoot() {
      return findFirstMatchingNode(documentRef, GEMINI_SELECTORS.root) || documentRef.body;
    },
    getConversationMessages(root) {
      if (!root) {
        return [];
      }
      const turnNodes = root.querySelectorAll(GEMINI_SELECTORS.turn.join(','));
      if (turnNodes.length) {
        return collectGeminiTurnMessages(turnNodes);
      }
      const selectorMessages = collectMessagesBySelectors(
        root,
        GEMINI_SELECTORS.user,
        GEMINI_SELECTORS.assistant,
        resolveRoleFromGeminiNode
      );
      if (selectorMessages.length) {
        return selectorMessages;
      }
      return collectMessagesByRoleAttributes(root);
    }
  };
}

function createClaudeAdapter(documentRef: Document): Adapter {
  return {
    id: 'claude',
    getConversationRoot() {
      return findFirstMatchingNode(documentRef, CLAUDE_SELECTORS.root) || documentRef.body;
    },
    getConversationMessages(root) {
      if (!root) {
        return [];
      }
      const selectorMessages = collectMessagesBySelectors(
        root,
        CLAUDE_SELECTORS.user,
        CLAUDE_SELECTORS.assistant,
        resolveRoleFromClaudeNode
      );
      if (selectorMessages.length) {
        return selectorMessages;
      }
      return collectMessagesByRoleAttributes(root);
    }
  };
}

function resolveRoleFromAttributes(node: Element): ConversationRole | null {
  for (const attributeName of ROLE_ATTRIBUTES) {
    const rawRole = node.getAttribute(attributeName);
    if (!rawRole) {
      continue;
    }
    const normalizedRole = rawRole.toLowerCase();
    if (ROLE_ALIASES.user.has(normalizedRole)) {
      return 'user';
    }
    if (ROLE_ALIASES.assistant.has(normalizedRole)) {
      return 'assistant';
    }
  }
  return null;
}

function collectMessagesByRoleAttributes(
  root: ParentNode | null,
  selectorOverride?: string
): ConversationEntry[] {
  if (!root) {
    return [];
  }
  const selector = selectorOverride || ROLE_SELECTOR;
  const nodes = root.querySelectorAll(selector);
  const messages: ConversationEntry[] = [];
  nodes.forEach((node) => {
    const role = resolveRoleFromAttributes(node);
    if (role) {
      messages.push({ node, role });
    }
  });
  return messages;
}

function collectGeminiTurnMessages(turnNodes: NodeListOf<Element>): ConversationEntry[] {
  const messages: ConversationEntry[] = [];
  turnNodes.forEach((turnNode) => {
    const userNode = findFirstMatchingNode(turnNode, GEMINI_SELECTORS.user);
    if (userNode) {
      messages.push({ node: userNode, role: 'user' });
    }
    const assistantNode = findFirstMatchingNode(turnNode, GEMINI_SELECTORS.assistant);
    if (assistantNode) {
      messages.push({ node: assistantNode, role: 'assistant' });
    }
  });
  return messages;
}

function resolveRoleFromGeminiNode(node: Element): ConversationRole | null {
  if (nodeMatchesAnySelector(node, GEMINI_SELECTORS.user)) {
    return 'user';
  }
  if (nodeMatchesAnySelector(node, GEMINI_SELECTORS.assistant)) {
    return 'assistant';
  }
  return resolveRoleFromAttributes(node);
}

function resolveRoleFromClaudeNode(node: Element): ConversationRole | null {
  if (nodeMatchesAnySelector(node, CLAUDE_SELECTORS.user)) {
    return 'user';
  }
  if (nodeMatchesAnySelector(node, CLAUDE_SELECTORS.assistant)) {
    return 'assistant';
  }
  return resolveRoleFromAttributes(node);
}

function collectMessagesBySelectors(
  root: ParentNode | null,
  userSelectors: readonly string[],
  assistantSelectors: readonly string[],
  roleResolver: (node: Element) => ConversationRole | null
): ConversationEntry[] {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return [];
  }
  const selector = userSelectors.concat(assistantSelectors).join(',');
  if (!selector) {
    return [];
  }
  const nodes = root.querySelectorAll(selector);
  const messages: ConversationEntry[] = [];
  nodes.forEach((node) => {
    const role = roleResolver(node);
    if (role) {
      messages.push({ node, role });
    }
  });
  return messages;
}

function nodeMatchesAnySelector(node: Element, selectors: readonly string[]): boolean {
  for (const selector of selectors) {
    if (node.matches(selector)) {
      return true;
    }
  }
  return false;
}

function findFirstMatchingNode(root: ParentNode, selectors: readonly string[]): Element | null {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    if (node) {
      return node;
    }
  }
  return null;
}

const adapterApi = createAdapterApi();
ns.adapters = Object.assign({}, ns.adapters, adapterApi, { createAdapterApi });
