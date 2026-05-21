import { ns } from './namespace';
import {
  buildFormulaThemeConfig,
  getUiThemePreset,
  UI_KIT_THEME_VAR_KEYS,
  UI_NAV_THEME_VAR_KEYS,
  UI_THEME_DARK_SELECTORS,
  UI_THEME_PRESETS
} from '../shared/ui-kit/theme';
import { UI_KIT_STYLE_TEXT } from '../shared/ui-kit/styles';

function toCssVarBlock(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `        ${key}: ${value};`)
    .join('\n');
}

const defaultNavVars = toCssVarBlock((getUiThemePreset('generic', 'light').nav || {}) as Record<string, string>);

ns.UI_THEME_PRESETS = UI_THEME_PRESETS;
ns.UI_THEME_DARK_SELECTORS = UI_THEME_DARK_SELECTORS;
ns.UI_NAV_THEME_VAR_KEYS = [...UI_NAV_THEME_VAR_KEYS];
ns.UI_KIT_THEME_VAR_KEYS = [...UI_KIT_THEME_VAR_KEYS];
ns.getUiThemePreset = getUiThemePreset;
ns.UI_FORMULA_THEME = buildFormulaThemeConfig();
ns.UI_KIT_STYLE_TEXT = UI_KIT_STYLE_TEXT;
ns.UI_STYLE_TEXT = `
${UI_KIT_STYLE_TEXT}

      .nav-root,
      .nav-root * {
        box-sizing: border-box;
      }

      .nav-root {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        pointer-events: none;
${defaultNavVars}
        --nav-ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
        --nav-ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
        --nav-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
        --nav-feedback-duration: 160ms;
        --nav-surface-duration: 260ms;
        --nav-panel-enter-duration: 420ms;
        --nav-panel-exit-duration: 240ms;
        font-family: var(--ui-font-family, "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif);
      }

      .nav-root[data-visible="0"] {
        display: none;
      }

      @keyframes nav-panel-enter {
        from {
          opacity: 0;
          transform: translate3d(0, 14px, 0) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
      }

      @keyframes nav-panel-section-enter {
        from {
          opacity: 0;
          transform: translate3d(0, 10px, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      @keyframes nav-fab-enter {
        from {
          opacity: 0;
          transform: translate3d(0, 10px, 0) scale(0.92);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
      }

      .panel {
        position: fixed;
        top: var(--nav-panel-offset);
        right: 16px;
        width: 280px;
        max-height: var(--nav-panel-max-height);
        height: auto;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        overflow: hidden;
        opacity: 1;
        visibility: visible;
        transform: translate3d(0, 0, 0) scale(1);
        transform-origin: top right;
        transition:
          opacity var(--nav-panel-enter-duration) var(--nav-ease-out-quart),
          transform var(--nav-panel-enter-duration) var(--nav-ease-out-expo),
          box-shadow var(--nav-surface-duration) var(--nav-ease-out-quart),
          visibility 0ms linear 0ms;
        will-change: transform, opacity;
      }

      .panel-header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 14px 10px 14px;
        border-bottom: 1px solid var(--nav-border);
        background: var(--nav-surface);
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }

      .panel-title {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .panel-title strong {
        font-size: 14px;
        letter-spacing: 0.3px;
        color: var(--nav-text);
      }

      .panel-title span {
        font-size: 12px;
        color: var(--nav-muted);
      }

      .panel-actions {
        display: flex;
        gap: 6px;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: nowrap;
        width: 100%;
      }

      .panel-toggle {
        font-size: 12px;
        border-radius: 999px;
        padding: 6px 10px;
        white-space: nowrap;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }

      .panel-toggle.is-active {
        border-color: var(--nav-control-active-border);
        background: var(--nav-control-active-bg);
        color: var(--nav-control-active-text);
      }

      .panel-toggle-theme {
        width: 32px;
        height: 32px;
        min-width: 32px;
        padding: 0;
        border-radius: 999px;
        text-align: center;
        font-size: 15px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .panel-body-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
        background: var(--nav-surface);
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }

      .panel-body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 10px 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: var(--nav-surface);
      }

      .panel-body::-webkit-scrollbar {
        width: var(--nav-scrollbar-size);
      }

      .scroll-hint {
        position: absolute;
        left: 0;
        right: 0;
        height: 20px;
        opacity: 0;
        pointer-events: none;
        transition:
          opacity 180ms var(--nav-ease-out-quart),
          transform 180ms var(--nav-ease-out-quart);
        z-index: 2;
      }

      .scroll-hint::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--nav-surface);
      }

      .scroll-hint-top {
        top: 0;
        transform: translate3d(0, -4px, 0);
      }

      .scroll-hint-top::before {
        -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
      }

      .scroll-hint-bottom {
        bottom: 0;
        transform: translate3d(0, 4px, 0);
      }

      .scroll-hint-bottom::before {
        -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
        mask-image: linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
      }

      .nav-item {
        padding: 10px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
        position: relative;
        will-change: transform;
      }

      .nav-item::after {
        content: '';
        position: absolute;
        right: -2px;
        top: -2px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--nav-item-indicator-color);
        box-shadow: 0 0 0 2px var(--nav-surface);
        opacity: 0;
        transform: scale(0.45);
        transition:
          opacity 180ms var(--nav-ease-out-quart),
          transform 220ms var(--nav-ease-out-expo);
      }

      .nav-item.is-active {
        border-color: var(--nav-item-active-border);
        background: var(--nav-item-active-bg);
        box-shadow: 0 10px 24px var(--nav-item-active-shadow);
        transform: translate3d(0, 0, 0);
      }

      .nav-item.is-active::after {
        opacity: 1;
        transform: scale(1);
      }

      .nav-item.is-active .nav-item-title,
      .nav-item.is-active .nav-item-preview,
      .nav-item.is-active .nav-item-minimal {
        color: var(--nav-item-active-text);
      }

      .nav-root[data-site="claude"] .nav-item.is-active .nav-item-title {
        color: var(--nav-text);
      }

      .nav-root[data-site="claude"] .nav-item.is-active .nav-item-preview,
      .nav-root[data-site="claude"] .nav-item.is-active .nav-item-minimal {
        color: var(--nav-muted);
      }

      .nav-root[data-site="claude"] .nav-item.is-active {
        border-color: transparent;
      }

      .nav-root[data-minimal="1"] .nav-item {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        gap: 0;
      }

      .nav-item-title {
        color: var(--nav-text);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.35;
        transition: color 180ms var(--nav-ease-out-quart);
      }

      .nav-item-preview {
        color: var(--nav-muted);
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 180ms var(--nav-ease-out-quart);
      }

      .nav-item-minimal {
        font-size: 11px;
        color: var(--nav-muted);
        letter-spacing: 0.9px;
        text-transform: uppercase;
        transition: color 180ms var(--nav-ease-out-quart);
      }

      .nav-empty {
        text-align: center;
        margin-top: 24px;
      }

      .nav-root[data-minimal="1"] .nav-empty {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
        margin-top: 12px;
      }

      .nav-root[data-minimal="1"] .nav-empty span {
        display: block;
        line-height: 1.2;
        letter-spacing: 0.6px;
        text-transform: uppercase;
      }

      .nav-root[data-collapsed="1"] .panel {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translate3d(0, 12px, 0) scale(0.985);
        transition-duration:
          var(--nav-panel-exit-duration),
          var(--nav-panel-exit-duration),
          var(--nav-panel-exit-duration),
          0ms;
        transition-delay: 0ms, 0ms, 0ms, var(--nav-panel-exit-duration);
      }

      .nav-root[data-collapsed="0"] .fab {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translate3d(0, 10px, 0) scale(0.92);
        transition-delay: 0ms, 0ms, 0ms, 0ms, 0ms, 0ms, var(--nav-surface-duration);
      }

      .nav-root[data-visible="1"][data-collapsed="0"] .panel {
        animation: nav-panel-enter var(--nav-panel-enter-duration) var(--nav-ease-out-expo) both;
      }

      .nav-root[data-visible="1"][data-collapsed="0"] .panel-header {
        animation: nav-panel-section-enter 320ms 40ms var(--nav-ease-out-quart) both;
      }

      .nav-root[data-visible="1"][data-collapsed="0"] .panel-body-wrap {
        animation: nav-panel-section-enter 360ms 110ms var(--nav-ease-out-quart) both;
      }

      .nav-root[data-minimal="1"] .panel {
        width: max-content;
        max-width: 70vw;
        top: var(--nav-panel-offset);
      }

      .nav-root[data-minimal="1"] .panel-header {
        padding: 8px;
        align-items: center;
      }

      .nav-root[data-minimal="1"] .panel-title {
        display: none;
      }

      .nav-root[data-minimal="1"] .panel-actions {
        gap: 4px;
        flex-direction: column;
        align-items: center;
      }

      .nav-root[data-minimal="1"] .panel-toggle {
        padding: 4px 6px;
        font-size: 11px;
        letter-spacing: 0.6px;
      }

      .nav-root[data-minimal="1"] .panel-toggle-theme {
        min-width: 0;
        width: 28px;
        height: 28px;
        padding: 0;
        font-size: 13px;
      }

      .nav-root[data-minimal="1"] .panel-body {
        padding: 8px;
        gap: 8px;
        width: max-content;
        align-items: center;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .nav-root[data-minimal="1"] .panel-body::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      .nav-root[data-minimal="1"] .panel-body-wrap[data-scrollable="1"][data-scroll-top="1"] .scroll-hint-top,
      .nav-root[data-minimal="1"] .panel-body-wrap[data-scrollable="1"][data-scroll-bottom="1"] .scroll-hint-bottom {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }

      .nav-root[data-minimal="1"] .nav-item {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        flex: 0 0 32px;
        padding: 0;
        border-radius: 999px;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 0;
      }

      .nav-root[data-minimal="1"] .nav-item:hover {
        transform: scale(1.04);
      }

      .nav-root[data-minimal="1"] .nav-item:active {
        transform: scale(0.96);
      }

      .nav-root[data-minimal="1"] .nav-item.is-active {
        border-color: var(--nav-item-active-border);
        background: var(--nav-item-active-bg);
        box-shadow: 0 0 0 1px var(--nav-item-active-border);
        transform: translate3d(0, 0, 0);
      }

      .nav-root[data-minimal="1"] .nav-item.is-active .nav-item-minimal {
        color: var(--nav-item-active-text);
        font-weight: 700;
      }

      .nav-root[data-site="claude"][data-minimal="1"] .nav-item.is-active .nav-item-minimal {
        color: var(--nav-muted);
      }

      .nav-root[data-site="claude"][data-minimal="1"] .nav-item.is-active {
        border-color: transparent;
        box-shadow: none;
      }

      .fab {
        position: fixed;
        right: 16px;
        top: calc(var(--nav-panel-offset) + 12px);
        width: 48px;
        height: 48px;
        border-radius: 999px;
        border: 1px solid var(--nav-border);
        background: var(--nav-surface);
        color: var(--nav-text);
        box-shadow: var(--nav-shadow);
        cursor: pointer;
        pointer-events: auto;
        font-size: 12px;
        letter-spacing: 0.4px;
        cursor: grab;
        opacity: 1;
        visibility: visible;
        transform: translate3d(0, 0, 0) scale(1);
        transition:
          opacity var(--nav-surface-duration) var(--nav-ease-out-quart),
          transform var(--nav-surface-duration) var(--nav-ease-out-expo),
          border-color 180ms var(--nav-ease-out-quart),
          background-color 180ms var(--nav-ease-out-quart),
          color 180ms var(--nav-ease-out-quart),
          box-shadow var(--nav-surface-duration) var(--nav-ease-out-quart),
          visibility 0ms linear 0ms;
        will-change: transform, opacity;
      }

      .fab:hover {
        border-color: var(--nav-accent-strong);
        color: var(--nav-accent-strong);
        background: var(--nav-hover);
        transform: translate3d(0, -2px, 0) scale(1.02);
      }

      .fab:active {
        transform: translate3d(0, 0, 0) scale(0.96);
      }

      .fab:focus-visible {
        outline: 2px solid var(--nav-item-active-border);
        outline-offset: 2px;
      }

      .fab.dragging {
        cursor: grabbing;
        transition: none;
        transform: translate3d(0, 0, 0) scale(1);
      }

      .nav-preview {
        position: fixed;
        top: 0;
        left: 0;
        width: var(--preview-width, 260px);
        max-width: 360px;
        opacity: 0;
        visibility: hidden;
        transform: translate3d(12px, 0, 0) scale(0.985);
        transform-origin: top right;
        pointer-events: none;
        transition:
          opacity 180ms var(--nav-ease-out-quart),
          transform 220ms var(--nav-ease-out-expo),
          visibility 0ms linear 220ms;
        will-change: opacity, transform;
        z-index: 3;
        overflow: hidden;
      }

      .nav-preview[data-active="1"] {
        opacity: 1;
        visibility: visible;
        transform: translate3d(0, 0, 0) scale(1);
        pointer-events: auto;
        transition-delay: 0ms, 0ms, 0ms;
      }

      .nav-root[data-collapsed="1"] .nav-preview {
        opacity: 0;
        visibility: hidden;
        transform: translate3d(12px, 0, 0) scale(0.985);
        pointer-events: none;
      }

      .nav-preview-inner {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-radius: 14px;
      }

      .nav-root[data-minimal="1"] .nav-preview-inner {
        box-shadow: none;
      }

      .nav-root[data-visible="1"][data-collapsed="1"] .fab {
        animation: nav-fab-enter 300ms var(--nav-ease-out-expo) both;
      }

      @media (prefers-reduced-motion: reduce) {
        .panel,
        .panel-header,
        .panel-body-wrap,
        .panel-toggle,
        .scroll-hint,
        .nav-item,
        .nav-item::after,
        .fab,
        .nav-preview {
          animation: none !important;
          transition-duration: 0ms !important;
          transition-delay: 0ms !important;
        }

        .panel,
        .panel-header,
        .panel-body-wrap,
        .panel-toggle,
        .nav-item,
        .fab,
        .nav-preview {
          transform: none !important;
        }
      }
    `;

window.ChatGptNav = ns;
