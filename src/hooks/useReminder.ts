import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useSettingsStore } from '../stores/settingsStore'
import type { ActiveReminder } from '../stores/settingsStore'

interface ReminderPayload {
  type: 'stretch' | 'eye_relax' | 'kegel' | 'breathing'
  timestamp: string
}

/**
 * 监听 Rust 后端的 reminder-triggered 事件，
 * 将最新提醒写入全局状态
 */
export function useReminder() {
  const setActiveReminder = useSettingsStore((s) => s.setActiveReminder)

  useEffect(() => {
    const unlisten = listen<ReminderPayload>('reminder-triggered', (event) => {
      const reminder: ActiveReminder = {
        type: event.payload.type,
        triggeredAt: event.payload.timestamp,
        completed: false,
        snoozed: false,
      }
      setActiveReminder(reminder)
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [setActiveReminder])
}
