import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * 监听 Rust 托盘菜单的导航事件。
 * 注意：不使用 onFocusChanged 自动隐藏 — 在 Windows alwaysOnTop 窗口上会导致点击即消失。
 * 面板显示/隐藏由托盘图标的左键点击在 Rust 侧控制。
 */
export function useTrayPanel() {
  const setView = useSettingsStore((s) => s.setView)

  useEffect(() => {
    const unlisten = listen<string>('navigate', (event) => {
      if (event.payload === 'settings') {
        setView('settings')
      }
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [setView])
}
