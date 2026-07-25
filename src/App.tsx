import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { TrayPanel } from './components/tray-panel/TrayPanel'
import { ReminderModal } from './components/reminder-modal'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null)
  useEffect(() => { setWindowLabel(getCurrentWindow().label) }, [])
  if (windowLabel === null) return null
  return (
    <ErrorBoundary>
      {windowLabel === 'reminder-modal' ? <ReminderModal /> : <TrayPanel />}
    </ErrorBoundary>
  )
}
export default App