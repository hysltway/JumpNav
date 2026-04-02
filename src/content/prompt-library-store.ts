import { ns } from './namespace';
import type {
  PromptDraft,
  PromptFilter,
  PromptLibrary,
  PromptLibraryStoreApi,
  PromptRecord,
  StorageApi
} from './types';

const STORAGE_KEY = 'prompt_library_v1';
const VERSION = 2;

interface PromptLibraryStoreEnvironment {
  storageApi?: StorageApi | null;
  now?: () => string;
}

function createEnvironment(
  overrides: PromptLibraryStoreEnvironment = {}
): Required<PromptLibraryStoreEnvironment> {
  return {
    storageApi: overrides.storageApi || ns.storage || null,
    now: typeof overrides.now === 'function' ? overrides.now : () => new Date().toISOString()
  };
}

function hasStorageApi(storageApi: StorageApi | null): storageApi is StorageApi {
  return Boolean(storageApi && typeof storageApi.getJson === 'function' && typeof storageApi.setJson === 'function');
}

function createPromptLibraryStore(
  environment: PromptLibraryStoreEnvironment = createEnvironment()
): PromptLibraryStoreApi {
  const env = createEnvironment(environment);

  async function read(): Promise<PromptLibrary> {
    return loadLibrary();
  }

  async function write(library: PromptLibrary): Promise<PromptLibrary> {
    const normalized = normalizeLibrary(library, env.now);
    await writeRaw(normalized);
    return normalized;
  }

  async function createPrompt(draft: PromptDraft): Promise<{ library: PromptLibrary; prompt: PromptRecord }> {
    const library = await loadLibrary(true);
    const prompt = createPromptRecord(draft, env.now);
    library.prompts = sortPrompts([prompt].concat(library.prompts));
    library.updatedAt = env.now();
    await writeRaw(library);
    return { library, prompt };
  }

  async function updatePrompt(promptId: string, draft: PromptDraft): Promise<PromptLibrary> {
    const library = await loadLibrary(true);
    const now = env.now();
    const title = normalizeLineText(draft.title);
    const content = normalizeContentText(draft.content);
    let changed = false;

    library.prompts = sortPrompts(
      library.prompts.map((prompt) => {
        if (prompt.id !== promptId) {
          return prompt;
        }

        changed = true;
        return {
          ...prompt,
          title,
          content,
          updatedAt: now
        };
      })
    );

    if (!changed) {
      return library;
    }

    library.updatedAt = now;
    await writeRaw(library);
    return library;
  }

  async function deletePrompt(promptId: string): Promise<PromptLibrary> {
    const library = await loadLibrary(true);
    library.prompts = library.prompts.filter((prompt) => prompt.id !== promptId);
    library.updatedAt = env.now();
    await writeRaw(library);
    return library;
  }

  async function markCopied(promptId: string): Promise<PromptLibrary> {
    const library = await loadLibrary(true);
    const now = env.now();
    let changed = false;

    library.prompts = library.prompts.map((prompt) => {
      if (prompt.id !== promptId) {
        return prompt;
      }
      changed = true;
      return {
        ...prompt,
        copyCount: sanitizeCount(prompt.copyCount) + 1,
        lastCopiedAt: now
      };
    });

    if (!changed) {
      return library;
    }

    library.updatedAt = now;
    await writeRaw(library);
    return library;
  }

  async function loadLibrary(retryOnEmpty = false): Promise<PromptLibrary> {
    let raw = await readRaw();
    if (!raw && retryOnEmpty) {
      raw = await readRaw();
    }
    const normalized = normalizeLibrary(raw, env.now);
    if (raw && !isSerializedEqual(raw, normalized)) {
      await writeRaw(normalized);
    }
    return normalized;
  }

  function filterPrompts(library: PromptLibrary, filter: PromptFilter = {}): PromptRecord[] {
    const normalized = normalizeLibrary(library, env.now);
    const query = normalizeQuery(filter.query);
    if (!query) {
      return sortPrompts(normalized.prompts);
    }

    return sortPrompts(
      normalized.prompts.filter((prompt) => {
        const haystack = `${prompt.title}\n${prompt.content}`.toLowerCase();
        return haystack.includes(query);
      })
    );
  }

  function hasDuplicateTitle(library: PromptLibrary, title: string, excludePromptId = ''): boolean {
    const normalizedTitle = normalizeLineText(title).toLowerCase();
    if (!normalizedTitle) {
      return false;
    }

    return normalizeLibrary(library, env.now).prompts.some(
      (prompt) => prompt.id !== excludePromptId && prompt.title.trim().toLowerCase() === normalizedTitle
    );
  }

  function readRaw(): Promise<unknown> {
    if (!hasStorageApi(env.storageApi)) {
      return Promise.resolve(null);
    }
    return Promise.resolve(env.storageApi.getJson(STORAGE_KEY)).catch(() => null);
  }

  function writeRaw(value: unknown): Promise<boolean> {
    if (!hasStorageApi(env.storageApi)) {
      return Promise.resolve(false);
    }
    return Promise.resolve(env.storageApi.setJson(STORAGE_KEY, normalizeLibrary(value, env.now))).catch(() => false);
  }

  return {
    STORAGE_KEY,
    VERSION,
    read,
    write,
    createPrompt,
    updatePrompt,
    deletePrompt,
    markCopied,
    filterPrompts,
    hasDuplicateTitle,
    normalizeLibrary
  };
}

function normalizeLibrary(rawLibrary: unknown, nowFn: () => string): PromptLibrary {
  const now = typeof nowFn === 'function' ? nowFn() : new Date().toISOString();
  const raw =
    rawLibrary && typeof rawLibrary === 'object' ? (rawLibrary as Partial<PromptLibrary>) : {};
  const prompts = sortPrompts(
    (Array.isArray(raw.prompts) ? raw.prompts : [])
      .map((prompt) => normalizePrompt(prompt, now))
      .filter((prompt): prompt is PromptRecord => Boolean(prompt))
  );

  return {
    version: VERSION,
    updatedAt: normalizeTimestamp(raw.updatedAt, now),
    prompts
  };
}

function normalizePrompt(rawPrompt: unknown, now: string): PromptRecord | null {
  const source =
    rawPrompt && typeof rawPrompt === 'object' ? (rawPrompt as Partial<PromptRecord>) : {};
  const title = normalizeLineText(source.title);
  const content = normalizeContentText(source.content);
  if (!title || !content) {
    return null;
  }

  const id = normalizeOptionalText(source.id) || createId('prompt');
  const createdAt = normalizeTimestamp(source.createdAt, now);
  const updatedAt = normalizeTimestamp(source.updatedAt, createdAt);

  return {
    id,
    title,
    content,
    createdAt,
    updatedAt,
    copyCount: sanitizeCount(source.copyCount),
    lastCopiedAt: normalizeNullableTimestamp(source.lastCopiedAt)
  };
}

function createPromptRecord(draft: PromptDraft, nowFn: () => string): PromptRecord {
  const now = nowFn();
  return {
    id: createId('prompt'),
    title: normalizeLineText(draft.title),
    content: normalizeContentText(draft.content),
    createdAt: now,
    updatedAt: now,
    copyCount: 0,
    lastCopiedAt: null
  };
}

function sortPrompts(prompts: PromptRecord[]): PromptRecord[] {
  return prompts.slice().sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.createdAt || '0');
    const rightTime = Date.parse(right.updatedAt || right.createdAt || '0');
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return (left.title || '').localeCompare(right.title || '', 'zh-Hans-CN');
  });
}

function normalizeQuery(value: unknown): string {
  return normalizeLineText(value).toLowerCase();
}

function sanitizeCount(value: unknown): number {
  if (!Number.isFinite(Number(value))) {
    return 0;
  }
  return Math.max(0, Math.floor(Number(value)));
}

function normalizeTimestamp(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return fallback;
}

function normalizeNullableTimestamp(value: unknown): string | null {
  if (typeof value === 'string' && value && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return null;
}

function normalizeLineText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

function normalizeContentText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\r\n/g, '\n').trim();
}

function normalizeOptionalText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function createId(prefix: string): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${stamp}_${random}`;
}

function isSerializedEqual(left: unknown, right: unknown): boolean {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

ns.promptLibraryStore = Object.assign({}, ns.promptLibraryStore, {
  STORAGE_KEY,
  VERSION,
  createPromptLibraryStore,
  normalizePromptLibrary: normalizeLibrary
});
window.ChatGptNav = ns;
