# 🧭 AI Chat Navigator Extension

一款轻量而强大的浏览器扩展，为 ChatGPT、Gemini 等 AI 对话平台注入智能导航功能。在长对话中快速定位用户提问、跳转查看，告别频繁滚动的低效时代。

**语言:** **简体中文** | [English](README_EN.md)

> 当前版本：**v0.5.0**

## 🚀 Chrome Web Store（推荐）

已上架，优先推荐从 Chrome Web Store 安装，自动更新更省心。

[ChatGPT & Gemini Quick Navi](https://chromewebstore.google.com/detail/chatgpt-gemini-quick-navi/kkemkfabmgjcjlileggigaaemcheapep)

## 📝 版本更新日志

### v0.5.0（2026-02-24）
- 新增导航面板自动深浅主题，进入页面后会自动匹配网站外观
- ChatGPT 与 Gemini 均支持自动主题跟随，无需手动切换
- 深色模式观感优化，夜间阅读更舒适
- 主题变化时导航条会更快同步，切换体验更稳定

### v0.4.0
- 屏幕空间不足时会自动切到简约模式，减少内容遮挡
- 窗口恢复后可自动回到正常显示
- 修复窗口拖动时模式频繁闪烁的问题
- 补充中英文文档与常见问题说明

## ✨ 核心特性

### 🎯 智能导航系统
- **自动识别用户提问**：实时解析对话流，提取所有用户消息，并按顺序生成可导航条目
- **平滑跳转体验**：点击任意条目，页面自动滚动到对应位置，并展示短暂高亮提示便于定位
- **当前位置指示**：根据视口中线高亮当前对话，快速识别阅读进度
- **实时内容同步**：支持 SPA 路由变化和动态内容加载，导航列表自动更新，无需手动刷新

### 📱 灵活的显示模式

#### 正常模式（默认）
- 完整显示用户提问内容（两行截断，超长省略）
- 同步显示 AI 回复预览（单行省略）
- 当前对话自动高亮，便于定位阅读进度
- 条目卡片化设计，视觉友好，信息丰富

#### 简约模式（极简）
- 面板仅显示序号圆点按钮，极端精简布局
- 悬停或键盘聚焦时展开预览，保持视觉简洁
- 当前对话以圆点标记提示，兼顾精简与定位
- 相同的跳转和定位能力，零功能缩水

#### 自适应模式切换（自动）
- 基于面板左边界与正文消息右边界的几何关系自动切换，避免遮挡聊天内容
- 窗口恢复可用空间后会自动回到正常模式（含 Gemini 页面）
- 持续拖动窗口时使用稳定判定基准与滞回阈值，避免模式来回闪烁
- 自动简约触发时仍可点击模式按钮，但不会强制切回会遮挡正文的正常模式

### 🎮 交互设计
- **可拖拽浮窗**：右侧圆形 FAB 按钮，可任意拖动至屏幕内任意位置
- **位置记忆**：自动保存按钮位置，下次访问时自动恢复
- **键盘友好**：完整的键盘导航支持，焦点管理规范
- **无障碍支持**：尊重 `prefers-reduced-motion` 系统设置，为敏感用户提供无过渡方案
- **自动主题适配**：跟随站点深浅主题自动切换导航面板配色（ChatGPT/Gemini）

## 📸 界面预览

**正常模式**（完整信息展示）
![正常模式](image1.png)

**简约模式**（极简视图）
![简约模式](image2.png)

## 🚀 快速开始

### 安装步骤
1. **Chrome Web Store 安装（推荐）**  
   [ChatGPT & Gemini Quick Navi](https://chromewebstore.google.com/detail/chatgpt-gemini-quick-navi/kkemkfabmgjcjlileggigaaemcheapep)
2. **本地加载（开发者模式）**  
   在 Chrome 地址栏输入 `chrome://extensions` 进入扩展管理页面  
   启用右上角的**开发者模式**  
   点击左上角**加载已解压的扩展程序**按钮  
   选择本仓库的目录文件夹，确认加载  
   打开任意支持站点的 AI 对话页面，右侧浮动面板会自动出现 ✅

### 开发工作流
```bash
# 修改代码后的刷新步骤：
1. 在 chrome://extensions 中点击本扩展的"重新加载"按钮
2. 刷新目标页面（Ctrl+R 或 Cmd+R）
3. 新的代码立即生效
```

## 🌐 支持的平台

| 平台 | 支持版本 | 说明 |
|------|--------|------|
| **ChatGPT** | ✅ chatgpt.com | 官方版本 |
| **OpenAI Chat** | ✅ chat.openai.com | OpenAI 官方聊天 |
| **Google Gemini** | ✅ gemini.google.com | 谷歌 AI 助手 |

扩展采用**适配器模式**开发，轻松支持新平台，详见"扩展新平台"部分。

## 📂 项目结构详解

```
chatgpt-nav-extension/
├── manifest.json                 # Chrome 扩展清单（权限、入注点、版本）
├── content.js                    # 扩展启动入口，初始化核心模块
├── content/                      # 功能模块目录
│   ├── namespace.js              # 全局命名空间定义与配置常量
│   ├── utils.js                  # 通用工具函数（文本规范化、截断等）
│   ├── adapter.js                # 平台适配器（识别消息节点的抽象层）
│   ├── ui.js                     # UI 组件创建与样式（Shadow DOM 隔离）
│   ├── core.js                   # 核心业务逻辑（消息识别、列表更新、交互处理）
└── README.md                     # 此文件
```

### 各模块职责

#### namespace.js
定义全局对象 `window.ChatGptNav`，存储适配器列表、配置常量：
- `CONFIG.debounceMs` - 消息重建防抖延迟（毫秒）
- `CONFIG.pollMs` - URL 轮询间隔（毫秒）
- `CONFIG.previewMax` - AI 回复预览最大字符数

#### utils.js
- `normalizeText(text)` - 规范化文本：去除多余空格、换行符
- `truncate(text, max)` - 截断文本至指定长度，末尾添加省略号

#### adapter.js
平台适配器工厂，抽象平台差异：
- 检测 DOM 结构中用户/助手消息的位置和属性标记
- 提供统一接口：`getConversationRoot()` 和 `getConversationMessages(root)`
- 支持多种 role 属性变体（data-message-author-role、data-author-role 等）
- 针对 Gemini 平台实现特殊的选择器和消息收集逻辑

#### ui.js
使用 Shadow DOM 创建隔离的 UI 层：
- 创建浮动面板及其内部组件（标题、按钮、消息列表、预览窗口）
- 定义完整的 CSS 样式（变量化设计，易于主题定制）
- 提供显示/隐藏、折叠/展开、模式切换等操作方法
- 共 543 行代码，涵盖了从面板容器到细微交互样式的所有设计

#### core.js（核心心脏）
处理扩展的全生命周期和实时交互（490 行核心逻辑）：
- **启动流程**：检测平台 → 创建 UI → 监听 DOM 变化 → 初始化拖拽
- **消息识别**：遍历 DOM，收集用户消息并自动配对 AI 回复预览
- **动态更新**：通过 MutationObserver 监听对话变化，自动重建列表
- **路由检测**：定期轮询 URL 变化，SPA 路由切换时自动清空列表
- **交互处理**：点击导航项 → 平滑滚动到对应消息 → 展示高亮提示
- **位置跟踪**：基于视口中线动态更新当前对话指示器
- **FAB 拖拽**：完整的指针事件处理，支持移动端触摸和桌面鼠标

## 💾 数据存储机制

扩展采用 **localStorage 本地存储**，完全离线运行，无云端通信：

| 键 | 值 | 用途 |
|----|-----|------|
| `chatgpt-nav-minimal-mode` | `'0'` 或 `'1'` | 记忆用户的显示模式设置 |
| `chatgpt-nav-fab-position` | `{left: px, top: px}` | 记忆 FAB 按钮的拖拽位置 |

**隐私承诺**：对话内容仅用于本地 DOM 解析，不上传任何服务器。

## 🔧 配置与自定义

### 调整导航列表更新频率
编辑 [content/namespace.js](content/namespace.js)，修改：
```javascript
CONFIG.debounceMs = 800  // 减小此值以更频繁更新（CPU 消耗↑）
```

### 修改 AI 回复预览长度
```javascript
CONFIG.previewMax = 100   // 字符数，超出部分省略
```

### 扩展新平台

1. **获取平台的 DOM 结构信息**
   - 打开目标网站的开发者工具
   - 检查用户消息和 AI 回复的 HTML 结构
   - 记下 role 属性值或外层容器选择器
   - 注意消息的嵌套层级和动态加载方式

2. **在 adapter.js 中添加新适配器**
   ```javascript
   function createNewPlatformAdapter() {
     return {
       id: 'newplatform',
       getConversationRoot() {
         return document.querySelector('chat-container') || document.body;
       },
       getConversationMessages(root) {
         // 返回 [{node, role: 'user'|'assistant'}, ...]
         // role 必须严格为 'user' 或 'assistant'
         return messages;
       }
     };
   }
   ```

3. **注册适配器**
   在 `ns.adapters.register()` 调用处添加：
   ```javascript
   ns.adapters.register(createNewPlatformAdapter());
   ```

4. **更新 manifest.json**
   ```json
   {
     "content_scripts": [{
       "matches": ["https://newplatform.com/*"],
       "js": ["content/namespace.js", "content/utils.js", "content/adapter.js", "content/ui.js", "content/core.js", "content.js"]
     }],
     "host_permissions": ["https://newplatform.com/*"]
   }
   ```

## 🐛 故障排查

### Q: 导航面板完全不显示

**检查清单：**
- ✅ 扩展已在 `chrome://extensions` 中加载且启用（蓝色开关）
- ✅ 当前网址在[支持列表](#支持的平台)中
- ✅ 页面完全加载（等待对话界面出现）
- ✅ 打开浏览器控制台（F12），查看是否有红色错误日志

**解决方案：**
1. 在 `chrome://extensions` 中点击"重新加载"按钮（扩展卡片上）
2. 刷新目标网页（Ctrl+R 或 Cmd+R）
3. 如仍无效，卸载扩展后重新加载

### Q: 某些提问没有出现在列表中

**可能原因：**
- DOM 节点未加载或被覆盖（某些平台的消息为异步加载）
- 文本提取失败（特殊字符或隐藏内容）
- 消息没有正确的 role 属性标记

**解决方案：**
- 等待 1~2 秒让消息完全加载
- 手动刷新页面（Ctrl+R），触发完整的列表重建
- 检查控制台是否有警告信息
- 在目标元素上右键 → 检查元素，查看其 role 属性值

### Q: FAB 按钮拖不动或位置重置

**原因：**
- localStorage 被禁用或数据已清除
- 浏览器无痕模式不支持持久化存储

**解决方案：**
- 检查浏览器隐私设置是否禁用了 localStorage
- 在普通模式下使用扩展（无痕模式限制较多）
- 尝试清除浏览器缓存后重新加载

### Q: 简约模式的预览不展开

**原因：**
- CSS 过渡被系统设置禁用（prefers-reduced-motion: reduce）
- JavaScript 焦点事件未正确触发

**解决方案：**
- 检查系统辅助功能设置中的"减少动画"开关
- 如开启了此选项，预览会直接显示（无过渡动画），功能不受影响
- 尝试手动点击或键盘聚焦条目

### Q: 窗口缩放时模式切换异常（闪烁或不能回到正常模式）

**原因：**
- 正文容器节点被错误识别为超宽元素，导致自适应判定长期为“相交”
- 持续拖动窗口时，若判定基准不稳定，可能触发频繁来回切换

**解决方案：**
- 升级到 `v0.4.0` 或更高版本（已修复 Gemini 回切与闪烁问题）
- 在 `chrome://extensions` 重新加载扩展并刷新页面
- 若问题仍在，打开控制台检查站点是否变更了消息节点结构

## 🎨 UI 设计细节

扩展采用温暖的大地色调设计，符合现代审美，完全兼容浅色和可扩展到深色主题：

```css
/* 色彩系统 */
--nav-bg: #FBF9F4              /* 奶白背景 */
--nav-surface: #FBF9F4         /* 面板底色 */
--nav-border: #e2d6ba          /* 边框线 */
--nav-text: #1f1e1a            /* 主文字（深灰） */
--nav-muted: #6e675b           /* 辅助文字（浅灰） */
--nav-accent: #d3b05b          /* 强调色（金） */
--nav-accent-strong: #8f6b24   /* 深强调色（深棕） */
--nav-hover: #f4edd6           /* 悬停背景 */
--nav-accent-shadow: rgba(143, 107, 36, 0.18)  /* 阴影色 */
--nav-shadow: 0 18px 42px rgba(23, 21, 16, 0.16) /* 面板阴影 */
```

所有颜色均使用 CSS 变量，便于后续主题定制或夜间模式适配，无需修改 HTML 结构。

## 📊 性能指标

- **初始化耗时**：< 200ms
- **消息识别**：O(n) 复杂度，n 为 DOM 消息节点数
- **防抖延迟**：800ms（可配置）
- **内存占用**：< 2MB（含 DOM 快照）
- **CPU 消耗**：仅在 DOM 变化时活动，其他时间休眠

## 📋 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| **Chrome Extension API** | 扩展框架 | Manifest V3 规范 |
| **Shadow DOM** | UI 隔离 | 防止样式污染、提高加载性能 |
| **MutationObserver** | DOM 监听 | 实时捕获对话内容变化 |
| **localStorage** | 数据存储 | 用户设置与按钮位置持久化 |
| **JavaScript (ES6+)** | 业务逻辑 | 现代 JS，无外部依赖（零依赖！） |
| **Pointer Events** | 触摸/鼠标 | 统一跨设备交互处理 |

**零依赖优势**：无需 npm 包、无打包步骤、无运行时库，纯原生 Web API。

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request！

**常见贡献场景：**

1. **新增平台支持**
   - 提供目标平台的 DOM 结构分析（HTML 截图）
   - 或直接修改 [content/adapter.js](content/adapter.js) 提交 PR
   - 记得同时更新 manifest.json 中的 matches 和 host_permissions

2. **Bug 修复或功能建议**
   - 清晰描述问题（截图、重现步骤、浏览器/扩展版本）
   - 或提出交互改进想法（UX 建议、新功能概念）

3. **样式/UI 优化**
   - CSS 改进、响应式设计增强
   - 深色主题支持或色彩方案变体
   - 无障碍性改进

**开发约定：**
- 遵循现有代码风格（ES6 风格、注释详细）
- 保持模块独立，不引入外部依赖
- 充分测试跨平台兼容性

## 📄 许可证

CC BY-NC-SA 4.0（知识共享署名-非商业性使用-相同方式共享）

- ✅ 可以自由使用、复制、修改和分发
- ✅ 必须署名（注明原作者）
- ❌ 不可用于商业目的
- ✅ 修改后的作品必须采用相同许可证

详见：[CC BY-NC-SA 4.0 许可证完整文本](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)

## 📞 联系方式

有问题或建议？欢迎提 Issue 反馈 😊
