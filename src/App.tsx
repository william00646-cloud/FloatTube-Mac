import { useState, useEffect, useRef } from 'react'
import { X, Home, Ghost, Maximize, Minimize, MousePointer2, EyeOff } from 'lucide-react'
import './index.css'

function App() {
  const [isHovered, setIsHovered] = useState(false)
  const [isGhostMode, setIsGhostMode] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)
  const [opacity, setOpacity] = useState(1.0)
  const [immersiveKey, setImmersiveKey] = useState<string | null>(null)
  const [clipboardToast, setClipboardToast] = useState<string | null>(null)
  
  const webviewRef = useRef<any>(null)
  const lastClipboard = useRef<string>('')
  const homeUrl = 'https://www.youtube.com'

  const handleClose = () => {
    (window as any).ipcRenderer.send('window-close')
  }

  const handleHome = () => {
    if (webviewRef.current) {
      webviewRef.current.loadURL(homeUrl)
    }
  }

  // Ghost Mode
  const enableGhostMode = () => {
    setIsGhostMode(true)
    ;(window as any).ipcRenderer.send('set-ghost-mode', true)
  }

  // Opacity
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setOpacity(val)
    ;(window as any).ipcRenderer.send('set-opacity', val)
  }

  // Immersive Mode
  const toggleImmersive = async () => {
    const wv = webviewRef.current
    if (!wv) return

    if (isImmersive && immersiveKey) {
      await wv.removeInsertedCSS(immersiveKey)
      setIsImmersive(false)
      setImmersiveKey(null)
    } else {
      // 只在影片頁面套用沉浸模式
      const currentUrl: string = await wv.executeJavaScript('window.location.href')
      if (!currentUrl.includes('youtube.com/watch')) {
        setClipboardToast('請先開啟 YouTube 影片再使用沉浸模式')
        setTimeout(() => setClipboardToast(null), 3000)
        return
      }
      const css = `
        ytd-masthead, #masthead-container { display: none !important; }
        #secondary { display: none !important; }
        #comments { display: none !important; }
        #related { display: none !important; }
        ytd-app { background: black !important; }
        #player-full-bleed-container { height: 100vh !important; max-height: none !important; }
        ytd-watch-flexy { margin-top: 0 !important; }
      `
      const key = await wv.insertCSS(css)
      setImmersiveKey(key)
      setIsImmersive(true)
    }
  }

  // Auto Ad Skip Initialization
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const handleDomReady = () => {
      wv.executeJavaScript(`
        setInterval(() => {
          const btn = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-overlay-close-button');
          if (btn) btn.click();
        }, 1000);
      `)
    }
    wv.addEventListener('dom-ready', handleDomReady)
    return () => wv.removeEventListener('dom-ready', handleDomReady)
  }, [])

  // Setup Effects (IPC, Shortcuts, Clipboard)
  useEffect(() => {
    const ipc = (window as any).ipcRenderer

    // 1. Ghost Mode Disable Sync
    const onGhostDisabled = () => setIsGhostMode(false)
    ipc.on('ghost-mode-disabled', onGhostDisabled)

    // 2. Global Shortcut: Media Play/Pause
    const onMediaPlay = () => {
      webviewRef.current?.executeJavaScript("document.querySelector('.ytp-play-button')?.click()")
    }
    ipc.on('media-play-pause', onMediaPlay)

    // Boss Key Media Pause
    const onMediaPauseOnly = () => {
      webviewRef.current?.executeJavaScript("var v = document.querySelector('video'); if (v && !v.paused) v.pause();")
    }
    ipc.on('media-pause-only', onMediaPauseOnly)

    // 3. Clipboard Sniffing
    const intervalId = setInterval(async () => {
      try {
        const text = await ipc.invoke('read-clipboard')
        if (text && text !== lastClipboard.current) {
          lastClipboard.current = text
          if (text.includes('youtube.com/watch') || text.includes('youtu.be/')) {
            webviewRef.current?.loadURL(text)
            setClipboardToast('偵測到 YouTube 連結，已自動載入')
            setTimeout(() => setClipboardToast(null), 3000)
          }
        }
      } catch (err) {}
    }, 2000)

    // 4. Auto Volume Ducking (Blur / Focus)
    const onBlur = () => {
      webviewRef.current?.executeJavaScript(`
        var v = document.querySelector('video');
        if (v && v.volume > 0.3) { window.__origVol = v.volume; v.volume = 0.2; }
      `)
    }
    const onFocus = () => {
      webviewRef.current?.executeJavaScript(`
        var v = document.querySelector('video');
        if (v && window.__origVol !== undefined) { v.volume = window.__origVol; window.__origVol = undefined; }
      `)
    }
    ipc.on('window-blur', onBlur)
    ipc.on('window-focus', onFocus)

    return () => {
      ipc.off('ghost-mode-disabled', onGhostDisabled)
      ipc.off('media-play-pause', onMediaPlay)
      ipc.off('media-pause-only', onMediaPauseOnly)
      ipc.off('window-blur', onBlur)
      ipc.off('window-focus', onFocus)
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div 
      className="relative w-full h-full overflow-hidden group select-none bg-transparent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ghost Mode Overlay Indicator */}
      {isGhostMode && (
        <div className="absolute inset-0 bg-transparent flex items-center justify-center z-40 transition-opacity">
          <button
            className="bg-black/80 text-white/70 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md text-sm border border-white/10 shadow-lg hover:bg-black/90 hover:text-white/90 transition-all cursor-pointer"
            title="點擊解除幽靈模式"
            onClick={() => {
              ;(window as any).ipcRenderer.send('set-ghost-mode', false)
              setIsGhostMode(false)
            }}
          >
            <Ghost size={16} /> 幽靈模式中，點此解除
          </button>
        </div>
      )}

      {/* Toast 通知 */}
      {clipboardToast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-black/85 text-white/90 px-4 py-2 rounded-full text-xs backdrop-blur-md border border-white/10 shadow-lg whitespace-nowrap">
            {clipboardToast}
          </div>
        </div>
      )}

      {/* Invisible Edge Drag Regions (T, L, R, B) */}
      <div 
        className="absolute top-0 left-0 w-full h-4 z-40 drag-region" 
        onDoubleClick={() => (window as any).ipcRenderer.send('toggle-mini-player')}
        style={{ cursor: 'grab' }}
        title="拖曳移動視窗 / 雙擊切換迷你模式"
      />
      <div className="absolute inset-y-0 left-0 w-3 z-40 drag-region" />
      <div className="absolute inset-y-0 right-0 w-3 z-40 drag-region" />
      <div className="absolute bottom-0 left-0 w-full h-3 z-40 drag-region" />

      {/* Controls Overlay */}
      <div 
        className={`absolute top-0 left-0 w-full h-12 z-50 transition-opacity duration-300 pointer-events-none flex items-center justify-between px-3 bg-gradient-to-b from-black/80 to-transparent ${isHovered && !isGhostMode ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Left side: Opacity Slider */}
        <div className="flex items-center gap-2 text-white/80 pointer-events-auto">
          <span className="text-xs font-semibold tracking-wider">OPACITY</span>
          <input 
            type="range" min="0.2" max="1.0" step="0.1" value={opacity} 
            onChange={handleOpacityChange}
            className="w-16 accent-white cursor-pointer"
          />
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button 
            onClick={() => { (window as any).ipcRenderer.send('boss-key-hide') }}
            className="p-1.5 hover:bg-yellow-500/80 rounded-full text-white/90 hover:text-white transition-all active:scale-95"
            title="老闆鍵: 一鍵隱藏+暫停 (快捷: Cmd+Shift+H)"
          >
            <EyeOff size={15} />
          </button>

          <button 
            onClick={enableGhostMode}
            className="p-1.5 hover:bg-white/20 rounded-full text-white/90 transition-all active:scale-95"
            title="幽靈模式 (穿透點擊)"
          >
            <MousePointer2 size={15} />
          </button>

          <button 
            onClick={toggleImmersive}
            className="p-1.5 hover:bg-white/20 rounded-full text-white/90 transition-all active:scale-95"
            title={isImmersive ? "退出沉浸模式" : "沉浸純淨模式"}
          >
            {isImmersive ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>

          <button 
            onClick={handleHome}
            className="p-1.5 hover:bg-white/20 rounded-full text-white/90 transition-all active:scale-95"
            title="回到首頁"
          >
            <Home size={15} />
          </button>
          
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-red-500/80 rounded-full text-white/90 hover:text-white transition-all active:scale-95"
            title="關閉"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* @ts-ignore */}
      <webview 
        ref={webviewRef}
        src={homeUrl}
        className="w-full h-full bg-black/40"
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0"
        {...({ allowpopups: "true" } as any)}
      />
    </div>
  )
}

export default App
