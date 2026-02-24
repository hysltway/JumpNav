# 🧭 AI Chat Navigator Extension

A lightweight yet powerful browser extension that brings intelligent navigation functionality to AI chat platforms like ChatGPT and Gemini. Quickly locate user prompts in long conversations and jump to them—say goodbye to inefficient scrolling.

**Language:** [简体中文](README.md) | **English**

> Current Version: **v0.5.0**

## 🚀 Chrome Web Store (Recommended)

Now live on the Chrome Web Store. Install there for automatic updates and the smoothest experience.

[ChatGPT & Gemini Quick Navi](https://chromewebstore.google.com/detail/chatgpt-gemini-quick-navi/kkemkfabmgjcjlileggigaaemcheapep)

## 📝 Version Changelog

### v0.5.0 (2026-02-24)
- Added automatic light/dark adaptation so the navigator follows the page appearance
- Theme auto-follow now works smoothly on both ChatGPT and Gemini
- Improved dark mode visuals for more comfortable night reading
- Faster and more stable theme sync when the site appearance changes

### v0.4.0
- Navigator now switches to compact mode when space is tight to reduce overlap
- Panel can return to normal mode automatically after window size recovers
- Fixed flickering while continuously resizing the browser window

## ✨ Core Features

### 🎯 Intelligent Navigation System
- **Auto-detect User Prompts**: Analyzes conversation flow in real-time, extracts all user messages, and generates navigable entries in order
- **Smooth Jump Experience**: Click any entry and the page automatically scrolls to the corresponding position with a brief highlight indicator for easy locating
- **Real-time Content Sync**: Supports SPA route changes and dynamic content loading; navigation list updates automatically without manual refresh

### 📱 Flexible Display Modes

#### Normal Mode (Default)
- Complete display of user prompt content (truncated to two lines, ellipsis for overflow)
- Simultaneous display of AI reply preview (single line with ellipsis)
- Card-style design for entries, visually friendly and information-rich

#### Minimal Mode (Ultra-minimalist)
- Panel displays only numbered dot buttons for extreme space efficiency
- Preview expands on hover or keyboard focus, maintaining visual simplicity
- Same jump and locating capabilities with zero feature loss

#### Adaptive Mode Switching (Automatic)
- Switches mode based on geometric overlap between panel left edge and conversation content right edge
- Automatically returns to normal mode when enough layout space is available again (including Gemini pages)
- Uses a stable baseline + hysteresis during continuous window resizing to prevent flicker
- Mode button remains clickable in adaptive minimal state, but normal mode is blocked if it would overlap content

### 🎮 Interaction Design
- **Draggable Floating Button**: Right-side circular FAB button can be dragged anywhere on screen
- **Position Memory**: Automatically saves button position and restores it on next visit
- **Keyboard Friendly**: Complete keyboard navigation support with proper focus management
- **Accessibility Support**: Respects `prefers-reduced-motion` system setting, providing non-transition experience for sensitive users
- **Automatic Theme Adaptation**: Navigator colors follow site light/dark theme automatically (ChatGPT/Gemini)

## 📸 Interface Preview

**Normal Mode** (Complete information display)
![Normal Mode](image1.png)

**Minimal Mode** (Minimalist view)
![Minimal Mode](image2.png)

## 🚀 Quick Start

### Installation Steps
1. **Chrome Web Store install (Recommended)**  
   [ChatGPT & Gemini Quick Navi](https://chromewebstore.google.com/detail/chatgpt-gemini-quick-navi/kkemkfabmgjcjlileggigaaemcheapep)
2. **Local load (Developer mode)**  
   Type `chrome://extensions` in Chrome address bar to open Extensions page  
   Enable **Developer mode** toggle in the top right corner  
   Click **Load unpacked** button in the top left corner  
   Select this repository's directory folder and confirm loading  
   Open any AI chat page on a supported platform; the floating panel will appear automatically on the right ✅

### Development Workflow
```bash
# Steps to refresh after code changes:
1. Click the "Reload" button on the extension card at chrome://extensions
2. Refresh the target page (Ctrl+R or Cmd+R)
3. New code takes effect immediately
```

## 🌐 Supported Platforms

| Platform | Support | Description |
|----------|---------|-------------|
| **ChatGPT** | ✅ chatgpt.com | Official version |
| **OpenAI Chat** | ✅ chat.openai.com | OpenAI official chat |
| **Google Gemini** | ✅ gemini.google.com | Google AI assistant |

The extension is built with an **Adapter Pattern** for easy support of new platforms—see the "Adding New Platforms" section for details.

## 📂 Project Structure Details

```
chatgpt-nav-extension/
├── manifest.json                 # Chrome extension manifest (permissions, injection points, version)
├── content.js                    # Extension entry point, initializes core modules
├── content/                      # Functional modules directory
│   ├── namespace.js              # Global namespace definition and config constants
│   ├── utils.js                  # Utility functions (text normalization, truncation, etc.)
│   ├── adapter.js                # Platform adapters (abstraction layer for message node detection)
│   ├── ui.js                     # UI component creation and styling (Shadow DOM isolation)
│   ├── core.js                   # Core business logic (message detection, list updates, interaction handling)
└── README.md                     # This file
```

### Module Responsibilities

#### namespace.js
Defines global object `window.ChatGptNav`, stores adapter list and config constants:
- `CONFIG.debounceMs` - Message rebuild debounce delay (milliseconds)
- `CONFIG.pollMs` - URL polling interval (milliseconds)
- `CONFIG.previewMax` - Maximum character count for AI reply preview

#### utils.js
- `normalizeText(text)` - Normalize text: removes excess spaces, line breaks
- `truncate(text, max)` - Truncates text to specified length with ellipsis at the end

#### adapter.js
Platform adapter factory that abstracts platform differences:
- Detects user/assistant message positions and attribute markers in DOM structure
- Provides unified interface: `getConversationRoot()` and `getConversationMessages(root)`
- Supports multiple role attribute variants (data-message-author-role, data-author-role, etc.)
- Implements special selector and message collection logic for Gemini platform

#### ui.js
Creates isolated UI layer using Shadow DOM:
- Creates floating panel and internal components (title, buttons, message list, preview window)
- Defines comprehensive CSS styles (variable-based design for easy theme customization)
- Provides show/hide, collapse/expand, and mode switching operations
- Contains 543 lines of code covering everything from panel container to subtle interaction styles

#### core.js (Core Heart)
Handles extension lifecycle and real-time interaction (490 lines of core logic):
- **Startup Flow**: Detect platform → Create UI → Listen to DOM changes → Initialize dragging
- **Message Detection**: Traverse DOM, collect user messages and auto-pair with AI reply previews
- **Dynamic Updates**: Monitor conversation changes via MutationObserver; auto-rebuild list
- **Route Detection**: Poll URL changes periodically; clear list on SPA route switches
- **Interaction Handling**: Click nav item → Smooth scroll to message → Show highlight indicator
- **FAB Dragging**: Complete pointer event handling supporting mobile touch and desktop mouse

## 💾 Data Storage Mechanism

The extension uses **localStorage for local storage**, runs completely offline with no server communication:

| Key | Value | Purpose |
|----|-------|---------|
| `chatgpt-nav-minimal-mode` | `'0'` or `'1'` | Remembers user's display mode preference |
| `chatgpt-nav-fab-position` | `{left: px, top: px}` | Remembers FAB button's dragged position |

**Privacy Promise**: Conversation content is only used for local DOM parsing; nothing is uploaded to any server.

## 🔧 Configuration and Customization

### Adjust Navigation List Update Frequency
Edit [content/namespace.js](content/namespace.js), modify:
```javascript
CONFIG.debounceMs = 800  // Reduce this value for more frequent updates (↑ CPU usage)
```

### Modify AI Reply Preview Length
```javascript
CONFIG.previewMax = 100   // Character count, overflow is ellipsized
```

### Adding New Platforms

1. **Gather Platform DOM Structure Information**
   - Open the target website's developer tools
   - Inspect user message and AI reply HTML structure
   - Note down role attribute values or outer container selectors
   - Be aware of message nesting levels and dynamic loading patterns

2. **Add New Adapter in adapter.js**
   ```javascript
   function createNewPlatformAdapter() {
     return {
       id: 'newplatform',
       getConversationRoot() {
         return document.querySelector('chat-container') || document.body;
       },
       getConversationMessages(root) {
         // Return [{node, role: 'user'|'assistant'}, ...]
         // role must strictly be 'user' or 'assistant'
         return messages;
       }
     };
   }
   ```

3. **Register the Adapter**
   In the `ns.adapters.register()` call location, add:
   ```javascript
   ns.adapters.register(createNewPlatformAdapter());
   ```

4. **Update manifest.json**
   ```json
   {
     "content_scripts": [{
       "matches": ["https://newplatform.com/*"],
       "js": ["content/namespace.js", "content/utils.js", "content/adapter.js", "content/ui.js", "content/core.js", "content.js"]
     }],
     "host_permissions": ["https://newplatform.com/*"]
   }
   ```

## 🐛 Troubleshooting

### Q: Navigation panel doesn't display at all

**Checklist:**
- ✅ Extension is loaded and enabled at `chrome://extensions` (blue toggle)
- ✅ Current URL is in the [supported platforms list](#supported-platforms)
- ✅ Page is fully loaded (wait for chat interface to appear)
- ✅ Open browser console (F12), check for red error logs

**Solutions:**
1. Click "Reload" button on the extension card at `chrome://extensions`
2. Refresh the target web page (Ctrl+R or Cmd+R)
3. If still no luck, uninstall and reload the extension

### Q: Some prompts don't appear in the list

**Possible Causes:**
- DOM nodes not loaded or are being overwritten (some platforms load messages asynchronously)
- Text extraction failure (special characters or hidden content)
- Messages missing proper role attribute markers

**Solutions:**
- Wait 1~2 seconds for messages to fully load
- Manually refresh page (Ctrl+R), triggering complete list rebuild
- Check console for warning messages
- Right-click target element → Inspect Element, check its role attribute value

### Q: FAB button won't drag or position keeps resetting

**Causes:**
- localStorage is disabled or data was cleared
- Browser incognito mode doesn't support persistent storage

**Solutions:**
- Check browser privacy settings to ensure localStorage is enabled
- Use the extension in normal mode (incognito mode has more restrictions)
- Try clearing browser cache before reloading

### Q: Minimal mode preview won't expand

**Causes:**
- CSS transitions disabled by system setting (prefers-reduced-motion: reduce)
- JavaScript focus events not triggering properly

**Solutions:**
- Check system accessibility settings for "Reduce motion" toggle
- If enabled, preview displays directly (without transition animation), functionality unaffected
- Try manually clicking or keyboard focusing entries

### Q: Mode switching behaves incorrectly during resize (flicker or stuck in minimal mode)

**Causes:**
- Conversation nodes may be measured as oversized wrappers, causing overlap to be detected continuously
- Unstable switching baselines during active resize can trigger rapid mode toggling

**Solutions:**
- Upgrade to `v0.4.0` or later (Gemini restore + flicker fixes included)
- Reload the extension at `chrome://extensions` and refresh the page
- If the issue persists, inspect whether the site changed message node structure

## 🎨 UI Design Details

The extension uses a warm, earthy tone design that fits modern aesthetics and can expand to dark theme support:

```css
/* Color System */
--nav-bg: #FBF9F4              /* Off-white background */
--nav-surface: #FBF9F4         /* Panel base color */
--nav-border: #e2d6ba          /* Border line */
--nav-text: #1f1e1a            /* Main text (dark gray) */
--nav-muted: #6e675b           /* Secondary text (light gray) */
--nav-accent: #d3b05b          /* Accent color (gold) */
--nav-accent-strong: #8f6b24   /* Strong accent color (dark brown) */
--nav-hover: #f4edd6           /* Hover background */
--nav-accent-shadow: rgba(143, 107, 36, 0.18)  /* Shadow color */
--nav-shadow: 0 18px 42px rgba(23, 21, 16, 0.16) /* Panel shadow */
```

All colors use CSS variables for easy future theme customization or dark mode support without modifying HTML structure.

## 📊 Performance Metrics

- **Init time**: < 200ms
- **Message detection**: O(n) complexity where n = number of DOM message nodes
- **Debounce delay**: 800ms (configurable)
- **Memory footprint**: < 2MB (including DOM snapshot)
- **CPU usage**: Only active during DOM changes; idle otherwise

## 📋 Tech Stack

| Technology | Purpose | Notes |
|-----------|---------|-------|
| **Chrome Extension API** | Extension framework | Manifest V3 spec |
| **Shadow DOM** | UI isolation | Prevents style pollution, improves performance |
| **MutationObserver** | DOM listening | Real-time conversation change capture |
| **localStorage** | Data storage | User settings and button position persistence |
| **JavaScript (ES6+)** | Business logic | Modern JS, no external dependencies |
| **Pointer Events** | Touch/mouse input | Unified cross-device interaction handling |

**Zero Dependency Advantage**: No npm packages, no build step, no runtime library—pure native Web API.

## 🤝 Contributing Guide

Welcome to submit Issues or Pull Requests!

**Common Contribution Scenarios:**

1. **Add Platform Support**
   - Provide target platform's DOM structure analysis (HTML screenshots)
   - Or directly modify [content/adapter.js](content/adapter.js) and submit PR
   - Remember to also update matches and host_permissions in manifest.json

2. **Bug Fixes or Feature Suggestions**
   - Clearly describe the issue (screenshot, reproduction steps, browser/extension version)
   - Or propose interaction improvement ideas (UX suggestions, new feature concepts)

3. **Style/UI Optimization**
   - CSS improvements, enhanced responsive design
   - Dark theme support or alternate color schemes
   - Accessibility improvements

**Development Conventions:**
- Follow existing code style (ES6 style, detailed comments)
- Keep modules independent, no external dependencies
- Thoroughly test cross-platform compatibility

## 📄 License

CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0)

- ✅ Free to use, copy, modify, and distribute
- ✅ Must provide attribution to original author
- ❌ Cannot be used for commercial purposes
- ✅ Derivative works must use the same license

See full license: [CC BY-NC-SA 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/)

## 📞 Contact

Have questions or suggestions? Feel free to submit an Issue for feedback 😊
