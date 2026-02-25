(() => {
  'use strict';

  const ns = window.ChatGptNav;
  ns.UI_STYLE_TEXT = `

      .nav-root, .nav-root * {
        box-sizing: border-box;
      }

      .nav-root {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        pointer-events: none;
        --nav-bg: #f9f9f9;
        --nav-surface: #f9f9f9;
        --nav-border: #efefef;
        --nav-text: #1f1f1f;
        --nav-muted: #666666;
        --nav-accent: #efefef;
        --nav-accent-strong: #1f1f1f;
        --nav-hover: #efefef;
        --nav-accent-shadow: rgba(0, 0, 0, 0.06);
        --nav-item-bg: #f4f4f4;
        --nav-item-hover-bg: #efefef;
        --nav-item-active-bg: #eaeaea;
        --nav-item-hover-border: #efefef;
        --nav-item-active-border: #eaeaea;
        --nav-item-active-text: #1f1f1f;
        --nav-item-indicator-color: #1f1f1f;
        --nav-item-active-color: #1f1f1f;
        --nav-item-active-shadow: rgba(0, 0, 0, 0.06);
        --nav-control-hover-border: #efefef;
        --nav-control-hover-text: #1f1f1f;
        --nav-control-active-border: #eaeaea;
        --nav-control-active-bg: #eaeaea;
        --nav-control-active-text: #1f1f1f;
        --nav-shadow: 0 18px 42px rgba(23, 21, 16, 0.16);
        --nav-button-bg: #f9f9f9;
        --nav-active-text: #1f1f1f;
        --nav-scrollbar-size: 10px;
        --nav-scrollbar-track: rgba(31, 31, 31, 0.06);
        --nav-scrollbar-thumb: rgba(31, 31, 31, 0.22);
        --nav-scrollbar-thumb-hover: rgba(31, 31, 31, 0.34);
        --nav-scrollbar-thumb-active: rgba(31, 31, 31, 0.44);
        --nav-panel-offset: 88px;
        --nav-panel-max-height: calc(100vh - 176px);
        font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      }

      .nav-root[data-color-scheme="light"][data-site="chatgpt"] {
        --nav-bg: #f9f9f9;
        --nav-surface: #f9f9f9;
        --nav-border: #efefef;
        --nav-text: #1f1f1f;
        --nav-muted: #666666;
        --nav-accent: #efefef;
        --nav-accent-strong: #1f1f1f;
        --nav-hover: #efefef;
        --nav-item-bg: #f4f4f4;
        --nav-item-hover-bg: #efefef;
        --nav-item-active-bg: #eaeaea;
        --nav-item-hover-border: #efefef;
        --nav-item-active-border: #eaeaea;
        --nav-item-active-text: #1f1f1f;
        --nav-item-indicator-color: #1f1f1f;
        --nav-item-active-color: #1f1f1f;
        --nav-item-active-shadow: rgba(0, 0, 0, 0.06);
        --nav-control-hover-border: #efefef;
        --nav-control-hover-text: #1f1f1f;
        --nav-control-active-border: #eaeaea;
        --nav-control-active-bg: #eaeaea;
        --nav-control-active-text: #1f1f1f;
        --nav-button-bg: #f9f9f9;
      }

      .nav-root[data-color-scheme="light"][data-site="gemini"] {
        --nav-bg: #f3f6fc;
        --nav-surface: #f3f6fc;
        --nav-border: #dce1e9;
        --nav-text: #1f2a3d;
        --nav-muted: #546377;
        --nav-accent: #dce1e9;
        --nav-accent-strong: #0842a0;
        --nav-hover: #dce1e9;
        --nav-item-bg: #e9eef6;
        --nav-item-hover-bg: #dce1e9;
        --nav-item-active-bg: #d3e3fd;
        --nav-item-hover-border: #dce1e9;
        --nav-item-active-border: #d3e3fd;
        --nav-item-active-text: #0842a0;
        --nav-item-indicator-color: #0842a0;
        --nav-item-active-color: #0842a0;
        --nav-item-active-shadow: rgba(8, 66, 160, 0.16);
        --nav-control-hover-border: #dce1e9;
        --nav-control-hover-text: #0842a0;
        --nav-control-active-border: #d3e3fd;
        --nav-control-active-bg: #d3e3fd;
        --nav-control-active-text: #0842a0;
        --nav-button-bg: #f3f6fc;
      }

      .nav-root[data-color-scheme="dark"] {
        --nav-bg: #121417;
        --nav-surface: #181b1f;
        --nav-border: #2f343a;
        --nav-text: #e7eaee;
        --nav-muted: #a4adb7;
        --nav-accent: #2a3037;
        --nav-accent-strong: #c9d0d8;
        --nav-hover: #242a31;
        --nav-accent-shadow: rgba(170, 178, 187, 0.18);
        --nav-item-bg: #21262c;
        --nav-item-hover-bg: #2a3037;
        --nav-item-active-bg: #303740;
        --nav-item-hover-border: #4a545f;
        --nav-item-active-border: #66727d;
        --nav-item-active-text: #f1f4f7;
        --nav-item-indicator-color: #d3d9e0;
        --nav-item-active-color: #e5eaf0;
        --nav-item-active-shadow: rgba(10, 12, 15, 0.38);
        --nav-control-hover-border: #4f5964;
        --nav-control-hover-text: #e1e6eb;
        --nav-control-active-border: #6d7883;
        --nav-control-active-bg: rgba(160, 169, 178, 0.18);
        --nav-control-active-text: #f1f4f7;
        --nav-shadow: 0 20px 48px rgba(3, 8, 17, 0.58), 0 2px 10px rgba(3, 8, 17, 0.35);
        --nav-button-bg: #22272e;
        --nav-active-text: #f0f4f8;
        --nav-scrollbar-track: rgba(232, 236, 241, 0.1);
        --nav-scrollbar-thumb: rgba(232, 236, 241, 0.34);
        --nav-scrollbar-thumb-hover: rgba(232, 236, 241, 0.48);
        --nav-scrollbar-thumb-active: rgba(232, 236, 241, 0.62);
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
        background: var(--nav-surface);
        border: 1px solid var(--nav-border);
        border-radius: 16px;
        box-shadow: var(--nav-shadow);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 14px 10px 14px;
        border-bottom: 1px solid var(--nav-border);
        background: var(--nav-surface);
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
        border: 1px solid var(--nav-border);
        background: var(--nav-button-bg);
        color: var(--nav-text);
        font-size: 12px;
        border-radius: 999px;
        padding: 6px 10px;
        cursor: pointer;
        white-space: nowrap;
      }

      .panel-toggle:hover {
        border-color: var(--nav-control-hover-border);
        color: var(--nav-control-hover-text);
        background: var(--nav-hover);
      }

      .panel-toggle:focus-visible {
        outline: 2px solid var(--nav-item-active-border);
        outline-offset: 2px;
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
      }

      .panel-body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: var(--nav-scrollbar-thumb) var(--nav-scrollbar-track);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: var(--nav-surface);
      }

      .panel-body::-webkit-scrollbar {
        width: var(--nav-scrollbar-size);
      }

      .panel-body::-webkit-scrollbar-track {
        background: var(--nav-scrollbar-track);
        border-radius: 999px;
      }

      .panel-body::-webkit-scrollbar-thumb {
        background: var(--nav-scrollbar-thumb);
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      .panel-body::-webkit-scrollbar-thumb:hover {
        background: var(--nav-scrollbar-thumb-hover);
        background-clip: padding-box;
      }

      .panel-body::-webkit-scrollbar-thumb:active {
        background: var(--nav-scrollbar-thumb-active);
        background-clip: padding-box;
      }

      .scroll-hint {
        position: absolute;
        left: 0;
        right: 0;
        height: 20px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 180ms ease;
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
      }

      .scroll-hint-top::before {
        -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
      }

      .scroll-hint-bottom {
        bottom: 0;
      }

      .scroll-hint-bottom::before {
        -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
        mask-image: linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
      }

      .nav-item {
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: var(--nav-item-bg);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
        position: relative;
        transition: border-color 160ms ease, background-color 160ms ease, box-shadow 220ms ease,
          transform 160ms ease;
      }

      .nav-item:hover {
        border-color: var(--nav-item-hover-border);
        background: var(--nav-item-hover-bg);
        box-shadow: 0 6px 16px var(--nav-item-active-shadow);
        transform: translateY(-1px);
      }

      .nav-item:focus-visible {
        outline: 2px solid var(--nav-item-active-border);
        outline-offset: 2px;
      }

      .nav-item.is-active {
        border-color: var(--nav-item-active-border);
        background: var(--nav-item-active-bg);
        box-shadow: 0 6px 16px var(--nav-item-active-shadow);
        transform: none;
      }

      .nav-item.is-active::after {
        content: '';
        position: absolute;
        right: -2px;
        top: -2px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--nav-item-indicator-color);
        box-shadow: 0 0 0 2px var(--nav-surface);
      }

      .nav-item.is-active .nav-item-title,
      .nav-item.is-active .nav-item-preview,
      .nav-item.is-active .nav-item-minimal {
        color: var(--nav-item-active-text);
      }

      .nav-root[data-minimal="1"] .nav-item {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        gap: 0;
      }

      .nav-item-title {
        font-size: 13px;
        color: var(--nav-text);
        font-weight: 600;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .nav-item-preview {
        font-size: 12px;
        color: var(--nav-muted);
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav-item-minimal {
        font-size: 11px;
        color: var(--nav-muted);
        letter-spacing: 0.9px;
        text-transform: uppercase;
      }

      .nav-empty {
        font-size: 12px;
        color: var(--nav-muted);
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
        display: none;
      }

      .nav-root[data-collapsed="0"] .fab {
        display: none;
      }

      .nav-root[data-minimal="1"] .panel {
        width: max-content;
        max-width: 70vw;
        top: var(--nav-panel-offset);
        transform: none;
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

      .nav-root[data-minimal="1"] .nav-item.is-active {
        border-color: var(--nav-item-active-border);
        background: var(--nav-item-active-bg);
        box-shadow: 0 0 0 1px var(--nav-item-active-border);
      }

      .nav-root[data-minimal="1"] .nav-item.is-active .nav-item-minimal {
        color: var(--nav-item-active-text);
        font-weight: 700;
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
      }

      .fab:hover {
        border-color: var(--nav-accent-strong);
        color: var(--nav-accent-strong);
        background: var(--nav-hover);
      }

      .fab:focus-visible {
        outline: 2px solid var(--nav-item-active-border);
        outline-offset: 2px;
      }

      .fab.dragging {
        cursor: grabbing;
      }

      .nav-preview {
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        max-width: 360px;
        opacity: 0;
        transform: translateX(12px);
        pointer-events: none;
        transition: width 180ms ease, opacity 160ms ease, transform 180ms ease;
        will-change: width, opacity, transform;
        z-index: 3;
        overflow: hidden;
      }

      .nav-preview[data-active="1"] {
        width: var(--preview-width, 260px);
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }

      .nav-preview-inner {
        background: var(--nav-surface);
        border: 1px solid var(--nav-border);
        border-radius: 14px;
        box-shadow: var(--nav-shadow);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .nav-root[data-minimal="1"] .nav-preview-inner {
        box-shadow: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .nav-preview {
          transition-duration: 0ms;
        }
      }
    `;
})();
