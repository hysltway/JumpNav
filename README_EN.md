# 🧭 AI Chat Navigator Extension

A lightweight yet powerful browser extension that brings intelligent navigation functionality to AI chat platforms like ChatGPT and Gemini. Quickly locate user prompts in long conversations and jump to them—say goodbye to inefficient scrolling.

**Language:** [简体中文](README.md) | **English**

> Current Version: **v1.0.0**

## 🚀 Chrome Web Store (Recommended)

Now live on the Chrome Web Store. Install there for automatic updates and the smoothest experience.

[ChatGPT & Gemini Quick Navi](https://chromewebstore.google.com/detail/chatgpt-gemini-quick-navi/kkemkfabmgjcjlileggigaaemcheapep)

## 📸 Interface Preview

**Normal Mode** (Complete information display)
![Normal Mode](image1.png)

**Minimal Mode** (Minimalist view)
![Minimal Mode](image2.png)

**Interface Preview 3**
![Interface Preview 3](image3.png)

**Interface Preview 4**
![Interface Preview 4](image4.png)

**Interface Preview 5**
![Interface Preview 5](image5.png)

## 📝 Version Changelog

### v1.0.0
- ChatGPT and Gemini now use dedicated light palettes for a more native visual feel on each site
- Gemini panel and item backgrounds are now clearly layered for better visual separation
- Spacing behavior between panel and chat content is now more consistent while reading
- Clicking Hide now reliably shows the restore button without requiring a page refresh
- The restore button stays fixed on the right edge, supports vertical drag, and remembers position

### v0.5.3
- Fixed an issue where Gemini prompt bubble highlighting could fail after jump navigation
- Highlight feedback now appears after scrolling settles for a smoother locating experience
- In minimal mode, when space is too tight, the preview can temporarily overlap chat content to keep details readable

### v0.5.2
- In minimal mode, hover previews now expand in a way that avoids covering the main chat content whenever possible
- Added a minimum preview width so details stay readable on smaller windows
- Click feedback now briefly deepens the user prompt bubble background, then smoothly restores it

### v0.5.1 
- Fixed Gemini normal-mode titles showing hidden speaker prefixes (localized “You said” labels)
- Navigator now shows only the user’s actual prompt text in normal mode
- Kept display behavior consistent across different language settings

### v0.5.0 
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
- **Smooth Jump Experience**: Click any entry and the page automatically scrolls to the target, then briefly deepens the prompt bubble background for easier locating
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
- **Draggable Floating Button**: Right-side circular FAB button stays fixed to the right edge and supports vertical drag only
- **Position Memory**: Automatically saves button position and restores it on next visit
- **Keyboard Friendly**: Complete keyboard navigation support with proper focus management
- **Accessibility Support**: Respects `prefers-reduced-motion` system setting, providing non-transition experience for sensitive users
- **Automatic Theme Adaptation**: Navigator colors follow site light/dark theme automatically (ChatGPT/Gemini)

## 📄 License

CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0)

- ✅ Free to use, copy, modify, and distribute
- ✅ Must provide attribution to original author
- ❌ Cannot be used for commercial purposes
- ✅ Derivative works must use the same license

See full license: [CC BY-NC-SA 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
