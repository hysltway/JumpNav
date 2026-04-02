import { ns } from './namespace';
import {
  createButton as createUiButton,
  createEmptyState as createUiEmptyState,
  createField as createUiField,
  createIconButton as createUiIconButton,
  createSvgIcon
} from '../shared/ui-kit/dom';
import { UI_KIT_STYLE_TEXT } from '../shared/ui-kit/styles';

function createStyleElement() {
  const style = document.createElement('style');
  style.textContent = `
${UI_KIT_STYLE_TEXT}
      .prompt-ui {
        color: var(--ui-text);
        font-family: inherit;
      }

      .prompt-entry {
        display: inline-flex;
        align-items: center;
        align-self: center;
        min-height: 36px;
        flex: 0 0 auto;
      }

      .prompt-entry-button {
        appearance: none;
        border: 1px solid var(--prompt-entry-border);
        background: var(--prompt-entry-bg);
        color: var(--prompt-entry-text);
        height: 34px;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 12px;
        font: inherit;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.25;
        letter-spacing: 0.01em;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        white-space: nowrap;
        cursor: pointer;
        transition:
          background-color 140ms var(--ui-ease-out-quart),
          border-color 140ms var(--ui-ease-out-quart),
          color 140ms var(--ui-ease-out-quart),
          transform 140ms var(--ui-ease-out-quart);
        text-align: center;
        -webkit-tap-highlight-color: transparent;
      }

      .prompt-entry-icon {
        display: none;
        flex: 0 0 auto;
      }

      .prompt-entry-icon svg {
        width: 20px;
        height: 20px;
        display: block;
      }

      .prompt-entry-label {
        display: inline-flex;
        align-items: center;
      }

      .prompt-ui[data-site="gemini"] .prompt-entry {
        min-height: 40px;
      }

      .prompt-ui[data-site="gemini"] .prompt-entry-button {
        height: 36px;
        min-height: 36px;
        min-width: 72px;
        padding: 0 5px;
        border-radius: 18px;
        border-color: transparent;
        background: transparent;
        gap: 4px;
        font-size: 14px;
        font-weight: 400;
      }

      .prompt-ui[data-site="gemini"] .prompt-entry-button:hover {
        background: var(--prompt-entry-hover);
      }

      .prompt-ui[data-site="gemini"] .prompt-entry-icon {
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: center;
      }

      .prompt-ui[data-site="gemini"] .prompt-entry-label {
        min-height: 20px;
        line-height: 20px;
        align-self: center;
      }

      .prompt-ui[data-site="claude"] .prompt-entry {
        min-height: 32px;
      }

      .prompt-ui[data-site="claude"] .prompt-entry-button {
        height: 32px;
        min-height: 32px;
        padding: 0 10px;
        border-radius: 10px;
        font-size: 12.5px;
      }

      .prompt-entry-button:hover {
        background: var(--prompt-entry-hover);
      }

      .prompt-entry-button:active {
        transform: translate3d(0, 0, 0) scale(0.97);
      }

      .prompt-entry-button:focus-visible,
      .prompt-search-input:focus-visible,
      .prompt-helper-button:focus-visible {
        outline: 2px solid var(--ui-focus-outline);
        outline-offset: 2px;
      }

      .prompt-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .prompt-panel {
        position: fixed;
        left: 12px;
        top: 12px;
        width: min(328px, calc(100vw - 24px));
        max-height: min(78vh, 720px);
        display: grid;
        grid-template-rows: auto auto auto minmax(0, 1fr);
        gap: 12px;
        padding: 12px;
        font-family: var(--prompt-panel-font-family, var(--ui-font-family));
        font-size: var(--prompt-panel-font-size, 14px);
        line-height: 1.6;
        overflow: hidden;
        pointer-events: auto;
        opacity: 0;
        transform: translate3d(0, 8px, 0) scale(0.992);
        visibility: hidden;
        will-change: transform, opacity;
        transition:
          opacity 180ms var(--ui-ease-out-quart),
          transform 220ms var(--ui-ease-out-quint),
          visibility 0ms linear 220ms;
      }

      .prompt-panel[data-form-open="1"] {
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      .prompt-layer[data-open="1"] .prompt-panel {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        visibility: visible;
        transition-delay: 0ms;
      }

      .prompt-header,
      .prompt-toolbar,
      .prompt-section,
      .prompt-list {
        opacity: 0;
        transform: translateY(8px);
        transition:
          opacity 180ms var(--ui-ease-out-quart),
          transform 220ms var(--ui-ease-out-quint);
      }

      .prompt-layer[data-open="1"] .prompt-header,
      .prompt-layer[data-open="1"] .prompt-toolbar,
      .prompt-layer[data-open="1"] .prompt-section,
      .prompt-layer[data-open="1"] .prompt-list {
        opacity: 1;
        transform: translateY(0);
      }

      .prompt-layer[data-open="1"] .prompt-header {
        transition-delay: 24ms;
      }

      .prompt-layer[data-open="1"] .prompt-toolbar {
        transition-delay: 56ms;
      }

      .prompt-layer[data-open="1"] .prompt-section {
        transition-delay: 88ms;
      }

      .prompt-layer[data-open="1"] .prompt-list {
        transition-delay: 116ms;
      }

      .prompt-header {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .prompt-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 20px;
        padding-inline: 2px;
      }

      .prompt-panel[data-form-open="1"] .prompt-toolbar {
        display: none;
      }

      .prompt-count {
        font-size: 12px;
        line-height: 1.4;
        letter-spacing: 0.01em;
        font-variant-numeric: tabular-nums;
        color: var(--ui-muted);
      }

      .prompt-search-shell {
        min-width: 0;
      }

      .prompt-search-input {
        width: 100%;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--ui-text);
        font: inherit;
        font-size: 13px;
        line-height: 1.6;
        padding: 0;
        margin: 0;
        appearance: none;
      }

      .prompt-search-input::placeholder {
        color: color-mix(in srgb, var(--ui-muted) 82%, transparent);
      }

      .prompt-search-input:focus {
        outline: none;
      }

      .prompt-search-input::-webkit-search-decoration,
      .prompt-search-input::-webkit-search-cancel-button,
      .prompt-search-input::-webkit-search-results-button,
      .prompt-search-input::-webkit-search-results-decoration {
        -webkit-appearance: none;
      }

      .prompt-action-button {
        min-height: 34px;
      }

      .prompt-input {
        min-height: 44px;
        padding: 0 14px;
      }

      .prompt-textarea {
        min-height: 144px;
        padding: 12px 14px;
      }

      .prompt-section {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .prompt-section[data-open="1"] {
        grid-template-rows: 1fr;
      }

      .prompt-section-inner {
        min-height: 0;
        overflow: hidden;
      }

      .prompt-form {
        margin-top: 0;
        padding-top: 12px;
        border-top: 1px solid var(--ui-divider);
        display: grid;
        gap: 12px;
      }

      .prompt-section[data-open="1"] .prompt-form {
        animation: prompt-fade-up 220ms var(--ui-ease-out-quint) both;
        transform-origin: top;
      }

      .prompt-warning {
        font-size: 12px;
        line-height: 1.4;
        color: var(--ui-danger);
      }

      .prompt-warning[hidden] {
        display: none;
      }

      .prompt-helper {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        min-width: 0;
      }

      .prompt-helper[hidden] {
        display: none;
      }

      .prompt-helper-text {
        font-size: 12px;
        line-height: 1.4;
        color: var(--ui-muted);
      }

      .prompt-helper-button {
        appearance: none;
        border: none;
        background: transparent;
        padding: 0;
        margin: 0;
        color: var(--ui-accent-strong);
        font: inherit;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;
        letter-spacing: 0.01em;
        cursor: pointer;
        text-decoration: underline;
        text-decoration-thickness: 0.08em;
        text-underline-offset: 0.16em;
        transition:
          color 140ms ease,
          transform 140ms var(--ui-ease-out-quart);
        -webkit-tap-highlight-color: transparent;
      }

      .prompt-helper-button:hover {
        color: var(--ui-accent);
        transform: translateX(1px);
      }

      .prompt-form-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }

      .prompt-list {
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        display: grid;
        gap: 8px;
        align-content: start;
      }

      .prompt-list[data-empty="1"] {
        min-height: 0;
        align-content: center;
        padding-block: 8px;
      }

      .prompt-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        column-gap: 8px;
      }

      .prompt-item-main {
        min-width: 0;
      }

      .prompt-item-head {
        min-width: 0;
      }

      .prompt-item-title {
        display: block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .prompt-item-preview {
        overflow-wrap: anywhere;
        word-break: break-all;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        white-space: pre-wrap;
      }

      .prompt-item-title mark,
      .prompt-item-preview mark {
        background: color-mix(in srgb, var(--ui-accent) 16%, transparent);
        color: inherit;
        border-radius: 4px;
        padding: 0 0.08em;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }

      .prompt-item-actions {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
        flex-wrap: nowrap;
        align-self: start;
        cursor: default;
        opacity: 0.82;
        transition:
          opacity 180ms var(--ui-ease-out-quart),
          transform 180ms var(--ui-ease-out-quart);
      }

      .prompt-item-actions .prompt-icon-button {
        width: 30px;
        height: 30px;
      }

      .prompt-item-actions .prompt-icon-button[data-busy="1"]::after {
        inset: 7px;
      }

      .prompt-item:hover .prompt-item-actions,
      .prompt-item:focus-within .prompt-item-actions {
        opacity: 1;
      }

      .prompt-empty {
        padding-top: 0;
        border-top: none;
      }

      @keyframes prompt-fade-up {
        from {
          opacity: 0;
          transform: translateY(8px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .prompt-helper:not([hidden]),
      .prompt-warning:not([hidden]),
      .prompt-empty {
        animation: prompt-fade-up 200ms var(--ui-ease-out-quart) both;
      }

      @media (max-width: 640px) {
        .prompt-panel {
          width: calc(100vw - 16px);
          max-height: calc(100vh - 16px);
          padding: 12px;
          border-radius: 14px;
          gap: 10px;
        }

        .prompt-form-actions {
          justify-content: flex-start;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .prompt-panel,
        .prompt-header,
        .prompt-toolbar,
        .prompt-list,
        .prompt-helper-button,
        .prompt-helper,
        .prompt-warning,
        .prompt-item-actions,
        .prompt-section,
        .prompt-form,
        .prompt-empty {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
  return style;
}

function createActionButton(text, action) {
  return createUiButton(text, {
    action,
    className: 'prompt-action-button'
  });
}

function createIconButton(action, label, iconName) {
  return createUiIconButton(action, label, iconName, {
    className: 'prompt-icon-button'
  });
}

function createField(labelText) {
  return createUiField(labelText, {
    fieldClassName: 'prompt-field',
    labelClassName: 'prompt-label'
  });
}

function createEmptyState(titleText, bodyText) {
  return createUiEmptyState(titleText, bodyText, {
    className: 'prompt-empty',
    titleClassName: 'prompt-empty-title',
    textClassName: 'prompt-empty-text'
  });
}

ns.promptLibraryUiStyle = Object.assign({}, ns.promptLibraryUiStyle, {
  createStyleElement,
  createActionButton,
  createIconButton,
  createField,
  createEmptyState,
  createSvgIcon
});
window.ChatGptNav = ns;
