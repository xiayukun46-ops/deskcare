import { useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from '../stores/settingsStore'
import type { AppSettings } from '../stores/settingsStore'

/**
 * 与 Rust 后端同步设置的 hook
 */
export function useSettings() {
  const settings = useSettingsStore((s) => s.settings)
  const setSettings = useSettingsStore((s) => s.setSettings)

  /** 从后端加载设置 */
  const loadSettings = useCallback(async () => {
    try {
      const loaded = await invoke<AppSettings>('get_settings')
      setSettings(loaded)
    } catch {
      // 首次启动使用默认值，提交到后端
      try {
        await invoke('update_settings', { settings })
      } catch (err) {
        console.warn('同步设置到后端失败:', err)
      }
    }
  }, [setSettings, settings])

  /** 保存设置到后端 */
  const saveSettings = useCallback(
    async (newSettings: AppSettings) => {
      setSettings(newSettings)
      try {
        await invoke('update_settings', { settings: newSettings })
      } catch (err) {
        console.warn('保存设置失败:', err)
      }
    },
    [setSettings],
  )

  return { settings, loadSettings, saveSettings }
}
