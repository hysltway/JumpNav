import { ns } from './namespace';
import type {
  Adapter,
  ConversationEntry,
  ConversationIndexerApi,
  ConversationMessage,
  UtilsApi
} from './types';

interface ConversationIndexerOverrides {
  utils?: Partial<UtilsApi>;
  previewMax?: number;
}

interface CachedConversationMessage {
  title: string;
  preview: string;
  text: string;
}

function createConversationIndexer(
  overrides: ConversationIndexerOverrides = {}
): ConversationIndexerApi {
  const utils = overrides.utils || ns.utils || {};
  const normalizeText: UtilsApi['normalizeText'] =
    typeof utils.normalizeText === 'function'
      ? utils.normalizeText
      : (value: string) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');
  const truncate: UtilsApi['truncate'] =
    typeof utils.truncate === 'function'
      ? utils.truncate
      : (value: string, maxLen: number) => {
          if (typeof value !== 'string') {
            return '';
          }
          if (value.length <= maxLen) {
            return value;
          }
          return `${value.slice(0, maxLen - 3)}...`;
        };
  const getTextWithoutHidden =
    typeof utils.getTextWithoutHidden === 'function' ? utils.getTextWithoutHidden : null;
  const previewMax =
    typeof overrides.previewMax === 'number' && Number.isFinite(overrides.previewMax)
      ? overrides.previewMax
      : 96;
  const messageCache = new Map<string, CachedConversationMessage>();
  let messageCacheScope = '';

  function getConversationSequence(
    adapter: Adapter | null,
    root: ParentNode | null
  ): ConversationEntry[] {
    if (!adapter || typeof adapter.getConversationMessages !== 'function') {
      return [];
    }
    return adapter.getConversationMessages(root);
  }

  function buildUserMessages(
    sequence: ConversationEntry[],
    adapter: Adapter | null
  ): ConversationMessage[] {
    syncMessageCacheScope(adapter);
    const messages: ConversationMessage[] = [];
    sequence.forEach((entry, index) => {
      if (entry.role !== 'user') {
        return;
      }
      const message = buildUserMessage(sequence, entry, index, adapter);
      if (message) {
        messages.push(message);
      }
    });
    return messages;
  }

  function buildUserMessage(
    sequence: ConversationEntry[],
    entry: ConversationEntry,
    index: number,
    adapter: Adapter | null
  ): ConversationMessage | null {
    const text = getUserMessageText(entry.node, adapter);
    const cacheKey = getMessageCacheKey(entry.node, adapter);
    const cachedMessage = cacheKey ? messageCache.get(cacheKey) || null : null;
    if (!text && !cachedMessage) {
      return null;
    }
    const assistantSummary = getAssistantSummary(sequence, index + 1);
    const preview = assistantSummary.text ? truncate(assistantSummary.text, previewMax) : cachedMessage?.preview || '';
    const message = {
      node: entry.node,
      title: text || cachedMessage!.title,
      preview,
      text: text || cachedMessage!.text,
      endNode: assistantSummary.lastAssistantNode
    };
    if (cacheKey && text) {
      messageCache.set(cacheKey, {
        title: message.title,
        preview: message.preview,
        text: message.text
      });
    }
    return message;
  }

  function getAssistantSummary(
    sequence: ConversationEntry[],
    startIndex: number
  ): { text: string; lastAssistantNode: Element | null } {
    let assistantText = '';
    let lastAssistantNode: Element | null = null;
    for (let i = startIndex; i < sequence.length; i += 1) {
      const item = sequence[i];
      if (item.role === 'assistant') {
        if (!assistantText) {
          assistantText = getAssistantMessageText(item.node);
        }
        lastAssistantNode = item.node;
        continue;
      }
      if (item.role === 'user') {
        break;
      }
    }
    return { text: assistantText, lastAssistantNode };
  }

  function getAssistantMessageText(node: Element | null): string {
    if (!node) {
      return '';
    }
    const contentNode = node.querySelector(
      '.markdown, .prose, [data-message-author-role="assistant"], [data-author-role="assistant"]'
    );
    return normalizeText((contentNode || node).textContent || '');
  }

  function getUserMessageText(node: Element | null, adapter: Adapter | null): string {
    if (!node) {
      return '';
    }
    const adapterId = adapter && adapter.id ? adapter.id : '';
    if (adapterId === 'gemini' && getTextWithoutHidden) {
      const visibleText = getTextWithoutHidden(node);
      if (visibleText) {
        return visibleText;
      }
    }
    const contentNode =
      adapterId === 'chatgpt'
        ? node.querySelector(
            '[data-testid="collapsible-user-message-content"], [class*="user-message-bubble-color"], [data-message-author-role="user"], [data-author-role="user"]'
          )
        : null;
    return normalizeText((contentNode || node).textContent || '');
  }

  function syncMessageCacheScope(adapter: Adapter | null): void {
    const nextScope = getMessageCacheScope(adapter);
    if (nextScope === messageCacheScope) {
      return;
    }
    messageCacheScope = nextScope;
    messageCache.clear();
  }

  function getMessageCacheScope(adapter: Adapter | null): string {
    const adapterId = adapter && adapter.id ? adapter.id : '';
    const href = typeof location !== 'undefined' ? location.href : '';
    return `${adapterId}:${href}`;
  }

  function getMessageCacheKey(node: Element | null, adapter: Adapter | null): string {
    if (!node) {
      return '';
    }
    const adapterId = adapter && adapter.id ? adapter.id : '';
    if (adapterId === 'chatgpt') {
      const turnId = getAttributeFromNodeOrDescendant(node, 'data-turn-id');
      if (turnId) {
        return `${adapterId}:turn:${turnId}`;
      }
      const testId = node.getAttribute('data-testid') || '';
      if (/^conversation-turn-\d+$/.test(testId)) {
        return `${adapterId}:turn:${testId}`;
      }
    }
    const messageId = getAttributeFromNodeOrDescendant(node, 'data-message-id');
    return messageId ? `${adapterId}:message:${messageId}` : '';
  }

  function getAttributeFromNodeOrDescendant(node: Element, attributeName: string): string {
    const directValue = node.getAttribute(attributeName);
    if (directValue) {
      return directValue;
    }
    return node.querySelector(`[${attributeName}]`)?.getAttribute(attributeName) || '';
  }

  function buildMessagesSignature(messages: ConversationMessage[]): string {
    return messages.map((message) => `${message.text}:${message.preview}`).join('\n');
  }

  return {
    getConversationSequence,
    buildUserMessages,
    buildMessagesSignature
  };
}

ns.coreConversationIndexer = Object.assign({}, ns.coreConversationIndexer, {
  createConversationIndexer
});
