import { create } from 'zustand'

export interface ReminderIntervals {
  stretchMinutes: number
  eyeRelaxMinutes: number
  kegelMinutes: number
  breathingMinutes: number
}

export interface NotificationPrefs {
  silentMode: boolean
  silentStart: string
  silentEnd: string
  showPreview: boolean
}

export interface AppSettings {
  intervals: ReminderIntervals
  notification: NotificationPrefs
  general: {
    launchAtLogin: boolean
    language: string
  }
}

export interface ActiveReminder {
  type: 'stretch' | 'eye_relax' | 'kegel' | 'breathing'
  triggeredAt: string
  completed: boolean
  snoozed: boolean
}

const defaultSettings: AppSettings = {
  intervals: { stretchMinutes: 45, eyeRelaxMinutes: 20, kegelMinutes: 60, breathingMinutes: 90 },
  notification: { silentMode: false, silentStart: '22:00', silentEnd: '07:00', showPreview: true },
  general: { launchAtLogin: true, language: 'zh-CN' },
}

function loadHealthScore(): number {
  try { const v = localStorage.getItem('deskcare_health'); return v ? parseInt(v, 10) || 0 : 0 } catch { return 0 }
}
function saveHealthScore(n: number) { try { localStorage.setItem('deskcare_health', String(n)) } catch { /* */ } }

function loadDates(): string[] {
  try { const v = localStorage.getItem('deskcare_dates'); return v ? JSON.parse(v) : [] } catch { return [] }
}
function saveDates(d: string[]) { try { localStorage.setItem('deskcare_dates', JSON.stringify(d)) } catch { /* */ } }

function prevDay(d: string): string { const dt = new Date(d); dt.setDate(dt.getDate() - 1); return dt.toISOString().slice(0, 10) }

function calcStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }
  const uniq = [...new Set(dates)].sort().reverse()
  let cur = 0, best = 0, exp = new Date().toISOString().slice(0, 10)
  for (const d of uniq) { if (d === exp) { cur++; exp = prevDay(exp) } else break }
  let run = 1
  for (let i = 1; i < uniq.length; i++) {
    if (uniq[i] === prevDay(uniq[i - 1])) run++; else { if (run > best) best = run; run = 1 }
  }
  if (run > best) best = run
  if (cur > best) best = cur
  return { current: cur, longest: best }
}

interface SettingsState {
  settings: AppSettings
  setSettings: (s: AppSettings) => void
  updateInterval: (key: keyof ReminderIntervals, value: number) => void
  updateNotification: (patch: Partial<NotificationPrefs>) => void
  updateGeneral: (patch: Partial<AppSettings['general']>) => void
  activeReminder: ActiveReminder | null
  setActiveReminder: (r: ActiveReminder | null) => void
  view: 'reminders' | 'settings'
  setView: (v: 'reminders' | 'settings') => void
  healthScore: number
  setHealthScore: (n: number) => void
  incrementHealth: () => void
  completedDates: string[]
  currentStreak: number
  longestStreak: number
  logCompletion: () => void
}

const initialHealth = loadHealthScore()
const initialDates = loadDates()
const initialStreaks = calcStreak(initialDates)

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...defaultSettings, general: { ...defaultSettings.general } },
  setSettings: (s) => set({ settings: s }),
  updateInterval: (key, value) => set((s) => ({ settings: { ...s.settings, intervals: { ...s.settings.intervals, [key]: value } } })),
  updateNotification: (p) => set((s) => ({ settings: { ...s.settings, notification: { ...s.settings.notification, ...p } } })),
  updateGeneral: (p) => set((s) => ({ settings: { ...s.settings, general: { ...s.settings.general, ...p } } })),
  activeReminder: null,
  setActiveReminder: (r) => set({ activeReminder: r }),
  view: 'reminders',
  setView: (v) => set({ view: v }),
  healthScore: initialHealth,
  setHealthScore: (n) => { saveHealthScore(n); set({ healthScore: n }) },
  incrementHealth: () => set((s) => { const n = s.healthScore + 1; saveHealthScore(n); return { healthScore: n } }),
  completedDates: initialDates,
  currentStreak: initialStreaks.current,
  longestStreak: initialStreaks.longest,
  logCompletion: () => set((s) => {
    const today = new Date().toISOString().slice(0, 10)
    if (s.completedDates.includes(today)) return {}
    const dates = [...s.completedDates, today]
    saveDates(dates)
    const st = calcStreak(dates)
    return { completedDates: dates, currentStreak: st.current, longestStreak: st.longest }
  }),
}))