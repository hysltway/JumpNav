# 🧭 JumpNav

JumpNav is a floating side navigator for ChatGPT and Gemini that turns long AI conversations into clickable outlines, so you can find prompts and answers in seconds.

**Language:** [简体中文](README.md) | **English**

> Current Version: **v1.3.2**

## 🚀 Chrome Web Store (Recommended)

Now live on the Chrome Web Store. Install there for automatic updates and the smoothest experience.

[JumpNav: The most elegant AI chat navigator you’ve ever seen.](https://chromewebstore.google.com/detail/chatgpt-gemini-quick-navi/kkemkfabmgjcjlileggigaaemcheapep)

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

## 💡 Core Value

- **Less scrolling, more thinking**: Turn long threads into a structured outline and reduce search friction
- **Jump to context instantly**: Click any entry to smoothly return to the exact spot in the conversation
- **Low-interruption workflow**: Right-side floating UI with hide/restore and position memory

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

## 🙏 Acknowledgements

- The light/dark radial transition animation is inspired by [urzeye/ophel](https://github.com/urzeye/ophel). Thanks for the open-source reference.

## 📄 License

CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0)

- ✅ Free to use, copy, modify, and distribute
- ✅ Must provide attribution to original author
- ❌ Cannot be used for commercial purposes
- ✅ Derivative works must use the same license

See full license: [CC BY-NC-SA 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
