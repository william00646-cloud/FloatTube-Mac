# 🛸 FloatTube (Mac Desktop Stealth Widget)

[![Electron](https://img.shields.io/badge/Electron-30.0-blue)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)

*Read this in other languages: [English](#english-documentation) | [繁體中文](#中文文檔)*

---

<h2 id="english-documentation">🇬🇧 English Documentation</h2>

FloatTube is an ultra-stealthy, frameless YouTube widget designed specifically for **macOS** power users (and office workers who secretly want to watch videos). It runs seamlessly in the background with **zero Dock icon footprint** and offers extensive keyboard and mouse bypass modes to never interrupt your workflow.

### ✨ Key Features
- **👻 Ghost Mode (Click-Through)**: Make the entire window transparent to mouse clicks. Clicks fall right through to the applications behind it!
- **👔 Boss Key (Panic Mode)**: Press `Cmd + Shift + H` at any time to instantly pause the video and hide the widget entirely.
- **🔇 Smart Volume Ducking**: Volume automatically dips to 20% when you switch to work on another window, and restores when you focus back.
- **⏭️ Auto Ad-Skipper**: Built-in background scripts automatically detect and click YouTube "Skip Ad" buttons for a hands-free experience.
- **📌 Pure Immersive Mode**: Strips away all YouTube comments, sidebars, and recommendations, leaving only the pure video player filling the screen.
- **🎚️ Opacity Control**: Built-in slider to seamlessly fade the player into your desktop wallpaper.
- **🚀 Clipboard Sniffing**: Automatically switch videos whenever you copy a `youtube.com` link to your clipboard.
- **🧊 Mini-Player Toggle**: Double click the exact top edge to condense the window into a tiny `320x180` stamp.
- **💾 Persistent State**: Remembers its exact position and bounds on your screen across restarts.

### 🛠️ Development & Build
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build the standalone macOS .dmg application
npm run build
```

---

<h2 id="中文文檔">🇹🇼 中文文檔</h2>

FloatTube 是一款專為 **macOS** 用戶（以及想在辦公室偷看 YouTube 的上班族）量身打造的特務級桌面懸浮影片神器。它採用無邊框、無 Dock 圖示的極致隱藏設計，並提供多種全域快捷鍵與滑鼠穿透模式，保證絕不干擾您的正常工作流程！

### ✨ 殺手級核心功能
- **👻 幽靈模式 (滑鼠穿透)**：開啟後視窗無視所有滑鼠點擊，您的點擊會直接穿透到後方的辦公軟體，邊看邊打字完全不受限！
- **👔 終極老闆鍵 (Boss Key)**：隨時按下全域快捷鍵 `Cmd + Shift + H`，瞬間隱藏整個視窗並**自動暫停影片**。
- **🔇 智慧音量控制**：當您切換到其他軟體工作時，YouTube 的音量會自動壓低至 20%；點回視窗時自動恢復正常音量。
- **⏭️ 無感自動跳廣告**：底層自動注入去廣告腳本，全程幫您精準點擊「略過廣告」，雙手完全不需離開鍵盤。
- **📌 沉浸純淨模式**：一鍵消滅 YouTube 原本繁雜的側邊欄與留言區，只保留最乾淨的影片畫面填滿視窗。
- **🎚️ 視窗透明度微調**：內建 OPACITY 拉桿，讓影片完美融入您的辦公室桌布中。
- **🚀 剪貼簿自動抓取**：系統在背景偵測，只要您一複製 YouTube 影片網址，就能自動切換並載入該影片！
- **🧊 雙擊迷你圖章模式**：對著畫面上方邊緣雙擊，瞬間縮小成 `320x180` 的極小方塊。
- **💾 永久記憶視窗位置**：自動儲存您的視窗大小與位置，下次開啟保證在同一個角落原地復活。

### 🛠️ 安裝與打包
```bash
# 安裝依賴環境
npm install

# 本地開發啟動
npm run dev

# 打包成 macOS 專用 .dmg 安裝檔
npm run build
```
