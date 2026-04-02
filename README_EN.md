<p align="center">
  <img src="Poster.png" alt="JumpNav Poster" width="100%" />
</p>

# JumpNav

JumpNav is a floating side navigator for **ChatGPT, Gemini, and Claude**.
It turns long conversations into clickable outlines with prompt and reply previews, so you can jump back to key context in seconds.

**Language:** [简体中文](README.md) | **English**

> Current Version: **v3.6.1**

## Updates in v3.6.1

- Fixed Prompt Library content normalization so internal line breaks are preserved while only leading and trailing blank lines are trimmed.
- Reworked the prompt item interaction structure by separating the title area and body area, reducing conflicts between action buttons and insert targets.
- Improved textarea scrollbar styling and multi-line title wrapping so long content and long titles remain easier to read and operate.
- Removed the repo-local wrap-up skill copy, standardized on the global `jumpnav-release-sync`, and synced version references for `v3.6.1`.

## Chrome Web Store (Recommended)

Now live on the Chrome Web Store. Install from the store for automatic updates.

[JumpNav: The most elegant AI chat navigator you’ve ever seen.](https://chromewebstore.google.com/detail/chatgpt-gemini-quick-navi/kkemkfabmgjcjlileggigaaemcheapep)

## Local Development

- Install dependencies: `npm install --cache .npm-cache`
- Run type checks: `npm run typecheck`
- Start the dev server: `npm run dev`
- First load: open `chrome://extensions`, enable Developer Mode, choose “Load unpacked”, and load the repo's `dist/` directory
- Daily iteration: keep `npm run dev` running; the scripts watch build output and `public/` assets, then trigger development-time extension or page reloads when possible. If the current site tab still does not pick up the latest content script automatically, refresh that page once
- Production build: `npm run build`

## Core Value

- **Less scrolling, more thinking**: Convert long chats into structured navigation.
- **One-click jump**: Click an entry to smoothly return to the exact prompt location.
- **Low-distraction workflow**: Draggable floating panel with hide/show, plus persisted hidden state and position memory.

## Feature Checklist

- Automatically extracts user prompts and builds a clickable navigator for ChatGPT, Gemini, and Claude.
- Built-in Prompt Library for saving and editing reusable prompts, with search, copy, delete, and reuse flows.
- Supports one-click prompt injection into the current site's input box, with copy as the fallback when direct insertion is unavailable.
- Supports both mouse click and keyboard `Enter` / `Space` on navigator items.
- Tracks reading position in real time, highlights the active item, and keeps it visible in the list.
- Includes Minimal mode and Adaptive Minimal mode (auto-switch when panel overlaps conversation content).
- Shows reply preview on hover/focus in Minimal mode; click preview to jump directly.
- Supports one-click `Hide` / `Fab` reopen, persists collapsed state across refresh, and remembers `Fab` position.
- Supports light/dark theme switching and auto-sync with site theme changes (with transition animation).
- Rebuilds automatically on SPA route changes and streaming message updates.
- Includes a built-in localization system with Simplified Chinese, English, German, Spanish, and Japanese support.
- Includes a usage milestone prompt that evaluates accumulated usage days and key actions, then invites qualified users to leave a store review or star the GitHub repo.
- Formula click-to-copy supports MathML / LaTeX: default MathML, `Shift+Click` for LaTeX.
- MathML engine supports MathJax / KaTeX / Auto, configurable and persisted in popup settings.
- Includes robust formula extraction compatibility for KaTeX, MathJax, `data-math`, `annotation`, and similar structures.


## Interface Preview

**Normal Mode**
![Normal Mode](image1.png)

**Minimal Mode**
![Minimal Mode](image2.png)

**Interface Preview 3**
![Interface Preview 3](image3.png)

**Interface Preview 4**
![Interface Preview 4](image4.png)

**Interface Preview 5**
![Interface Preview 5](image5.png)

## Supported Sites

- `chatgpt.com`
- `gemini.google.com`
- `claude.ai`

## Acknowledgements

- The theme transition effect is inspired by [urzeye/ophel](https://github.com/urzeye/ophel).

## License

CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0)

- ✅ Free to use, copy, modify, and distribute
- ✅ Must provide attribution
- ❌ Not for commercial use
- ✅ Derivatives must use the same license

Read more: [CC BY-NC-SA 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
