import { app, BrowserWindow, session, shell, ipcMain, globalShortcut, clipboard, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null = null

function createWindow() {
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0';
  app.userAgentFallback = ua;

  const stateFile = path.join(app.getPath('userData'), 'window-state.json');
  let savedState: any = {};
  try {
    if (fs.existsSync(stateFile)) {
      savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch (e) {}

  win = new BrowserWindow({
    width: savedState.width || 640,
    height: savedState.height || 360,
    x: savedState.x,
    y: savedState.y,
    minWidth: 320,
    minHeight: 180,
    show: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    vibrancy: 'popover',
    visualEffectState: 'active',
    hasShadow: true,
    roundedCorners: true,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
      contextIsolation: true
    },
  })

  win.setWindowButtonVisibility?.(false)
  
  // 強化：確保在所有桌面(Workspaces)與全螢幕應用程式之上都會強制顯示
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('ready-to-show', () => {
    win?.show()
  })

  // 記憶視窗位置與大小
  const saveState = () => {
    if (!win) return;
    fs.writeFileSync(stateFile, JSON.stringify(win.getBounds()));
  };
  win.on('resized', saveState);
  win.on('moved', saveState);

  // 智慧音量 (失焦降低音量 / 聚焦恢復音量)
  win.on('blur', () => win?.webContents.send('window-blur'));
  win.on('focus', () => win?.webContents.send('window-focus'));
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function createTray() {
  // 使用 16x16 黑色方塊作為模板圖示（macOS 會自動根據深/淺色模式調整顏色）
  const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA1BMVEX///+nxBvIAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg=='
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${iconBase64}`)
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('FloatTube')

  const updateMenu = () => {
    const isVisible = win?.isVisible() ?? false
    const contextMenu = Menu.buildFromTemplate([
      {
        label: isVisible ? '隱藏視窗' : '顯示視窗',
        click: () => {
          if (win?.isVisible()) {
            win?.webContents.send('media-pause-only')
            win?.hide()
          } else {
            win?.show()
          }
          updateMenu()
        }
      },
      { type: 'separator' },
      {
        label: '開機時自動啟動',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked,
            openAsHidden: true
          })
        }
      },
      { type: 'separator' },
      {
        label: '結束 FloatTube',
        click: () => {
          app.quit()
        }
      }
    ])
    tray?.setContextMenu(contextMenu)
  }

  updateMenu()

  // 左鍵單擊切換顯示/隱藏
  tray.on('click', () => {
    if (win?.isVisible()) {
      win?.webContents.send('media-pause-only')
      win?.hide()
    } else {
      win?.show()
    }
    updateMenu()
  })
}

app.whenReady().then(() => {
  // 迷你模式切換
  let normalBounds: Electron.Rectangle | null = null;
  ipcMain.on('toggle-mini-player', () => {
    if (!win) return;
    if (normalBounds) {
      win.setBounds(normalBounds);
      normalBounds = null;
    } else {
      normalBounds = win.getBounds();
      win.setBounds({ width: 320, height: 180, x: normalBounds.x, y: normalBounds.y });
    }
  });

  ipcMain.on('window-close', () => {
    win?.close();
  });

  ipcMain.on('window-drag', (_, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
    if (!win) return;
    const [x, y] = win.getPosition();
    win.setPosition(x + deltaX, y + deltaY);
  });

  ipcMain.on('boss-key-hide', () => {
    win?.webContents.send('media-pause-only');
    win?.hide();
  });

  // 超級隱形：讓 App 不會在 Mac 的 Dock (下方捷徑列) 上顯示，只有桌面上的懸浮視窗！
  if (app.dock) {
    app.dock.hide();
  }

  ipcMain.on('set-opacity', (_, opacity) => {
    win?.setOpacity(opacity);
  });

  ipcMain.on('set-ghost-mode', (_, isGhost) => {
    win?.setIgnoreMouseEvents(isGhost, { forward: true });
  });

  ipcMain.handle('read-clipboard', () => {
    return clipboard.readText();
  });

  globalShortcut.register('CommandOrControl+Option+U', () => {
    win?.setIgnoreMouseEvents(false);
    win?.webContents.send('ghost-mode-disabled');
  });

  // 老闆鍵 (Boss Key): 瞬間隱藏視窗、暫停影片
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (win?.isVisible()) {
      win?.webContents.send('media-pause-only');
      win?.hide();
    } else {
      win?.show();
    }
  });

  globalShortcut.register('MediaPlayPause', () => {
    win?.webContents.send('media-play-pause');
  });

  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0';

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = ua;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    if (responseHeaders['X-Frame-Options']) delete responseHeaders['X-Frame-Options'];
    if (responseHeaders['x-frame-options']) delete responseHeaders['x-frame-options'];
    callback({ cancel: false, responseHeaders });
  });
  
  createWindow();
  createTray();
})
