import { create } from 'zustand'

export interface ReminderIntervals {
  stretchMinutes: number; eyeRelaxMinutes: number; kegelMinutes: number; breathingMinutes: number
}
export interface NotificationPrefs {
  silentMode: boolean; silentStart: string; silentEnd: string; showPreview: boolean
}
export interface AppSettings {
  intervals: ReminderIntervals; notification: NotificationPrefs
  general: { launchAtLogin: boolean; language: string }
}
export interface ActiveReminder {
  type: string; triggeredAt: string; completed: boolean; snoozed: boolean
}
export interface CustomReminder {
  id: string; title: string; guide: string; intervalMinutes: number; enabled: boolean
}
export type Lang = 'zh-CN' | 'en' | 'ko' | 'ja'

// ── 翻译表 ──
export const T: Record<Lang, Record<string, string | string[]>> = {
  'zh-CN': {
    title: 'DeskCare', keepHealthy: '保持健康', healthScore: '健康值',
    petCat: '撸猫', times: '次', streakDays: '连续', days: '天', todayDone: '今日已打卡',
    dragMove: '拖拽移动', hide: '隐藏到托盘', settings: '设置', back: '返回',
    stretch: '久坐拉伸', eyeRelax: '眼部放松', kegel: '提肛运动', breathing: '呼吸训练',
    stretchGuide: '双手举过头顶伸展 15s · 颈部左右转动各 10s · 起身走 30 步',
    eyeRelaxGuide: '远眺 6 米外 20s · 快速眨眼 20 次 · 顺/逆时针转眼各 5 圈',
    kegelGuide: '收紧盆底肌 5s → 放松 5s → 重复 10 次 · 呼气收紧吸气放松',
    breathingGuide: '鼻吸 4s → 屏息 7s → 口呼 8s → 重复 4 轮 · 感受腹部起伏',
    custom: '自定义', addCustom: '添加提醒',
    guide: '欢迎使用 DeskCare', guide1: '顶部拖拽栏可移动窗口', guide2: '点击小猫有惊喜',
    guide3: '卡片开关控制提醒', guide4: '完成提醒获得健康值', guide5: '连续打卡解锁连击成就',
    gotIt: '知道了，开始使用', intervalSettings: '提醒间隔', notifySettings: '通知偏好',
    nightSilent: '夜间静音', silentPeriod: '静音时段', to: '至', showPreview: '显示通知预览',
    generalSettings: '通用', autoStart: '开机自动启动', language: '语言',
    version: 'DeskCare v0.1.0 - 让健康成为习惯',
    customTitle: '自定义提醒', titlePlaceholder: '提醒标题', guidePlaceholder: '动作指导',
    intervalLabel: '间隔（分钟）', add: '添加', delete: '删除',
    catMessages: ['喵~ 继续加油！','你是最棒的！','休息一下也不错~','健康值 +1！','摸得好舒服~','今天的你很优秀！','好运连连！','元气满满！','坚持就是胜利！','摸摸头，继续肝！','离健康又近了一步！','打工人雄起！'],
  },
  'en': {
    title: 'DeskCare', keepHealthy: 'Stay Healthy', healthScore: 'Health',
    petCat: 'Pet', times: 'x', streakDays: 'Streak', days: 'd', todayDone: 'Done today',
    dragMove: 'Drag to move', hide: 'Hide', settings: 'Settings', back: 'Back',
    stretch: 'Stretch', eyeRelax: 'Eye Relax', kegel: 'Kegel', breathing: 'Breathing',
    stretchGuide: 'Raise arms overhead 15s · Neck rotations 10s each · Walk 30 steps',
    eyeRelaxGuide: 'Look 6m away 20s · Blink 20x · Eye circles 5x each',
    kegelGuide: 'Tighten 5s → relax 5s → repeat 10x',
    breathingGuide: 'Inhale 4s → hold 7s → exhale 8s → repeat 4x',
    custom: 'Custom', addCustom: 'Add Reminder',
    guide: 'Welcome to DeskCare', guide1: 'Drag top bar to move', guide2: 'Click the cat for fun',
    guide3: 'Toggle cards to control reminders', guide4: 'Complete to earn health',
    guide5: 'Build streaks with daily check-ins', gotIt: 'Got it',
    intervalSettings: 'Intervals', notifySettings: 'Notifications',
    nightSilent: 'Night silent', silentPeriod: 'Silent hours', to: 'to', showPreview: 'Show preview',
    generalSettings: 'General', autoStart: 'Launch at startup', language: 'Language',
    version: 'DeskCare v0.1.0 - Make health a habit',
    customTitle: 'Custom Reminder', titlePlaceholder: 'Title', guidePlaceholder: 'Instructions',
    intervalLabel: 'Interval (min)', add: 'Add', delete: 'Delete',
    catMessages: ['Meow~ Keep going!','You are the best!','Take a break~','Health +1!','That feels good~','You are amazing!','Good luck!','Full of energy!','Keep it up!','Pat pat, keep coding!','One step closer!','You got this!'],
  },
  'ko': {
    title: 'DeskCare', keepHealthy: '건강 유지', healthScore: '건강 점수',
    petCat: '쓰다듬기', times: '회', streakDays: '연속', days: '일', todayDone: '오늘 완료',
    dragMove: '드래그 이동', hide: '숨기기', settings: '설정', back: '뒤로',
    stretch: '스트레칭', eyeRelax: '눈 휴식', kegel: '케겔 운동', breathing: '호흡 훈련',
    stretchGuide: '팔 올려 15초 · 목 돌리기 10초 · 30걸음 걷기',
    eyeRelaxGuide: '6m 멀리 보기 20초 · 깜빡이기 20회 · 눈 굴리기 5회',
    kegelGuide: '조이기 5초 → 풀기 5초 → 10회 반복',
    breathingGuide: '들이쉬기 4초 → 참기 7초 → 내쉬기 8초 → 4회 반복',
    custom: '사용자 정의', addCustom: '알림 추가',
    guide: 'DeskCare에 오신 것을 환영합니다', guide1: '상단 바를 드래그하여 이동',
    guide2: '고양이를 클릭해보세요', guide3: '카드로 알림 제어',
    guide4: '완료하면 건강 점수 획득', guide5: '매일 체크인으로 연속 기록',
    gotIt: '확인', intervalSettings: '알림 간격', notifySettings: '알림 설정',
    nightSilent: '야간 무음', silentPeriod: '무음 시간', to: '~', showPreview: '미리보기 표시',
    generalSettings: '일반', autoStart: '시작 시 실행', language: '언어',
    version: 'DeskCare v0.1.0',
    customTitle: '사용자 정의 알림', titlePlaceholder: '제목', guidePlaceholder: '안내',
    intervalLabel: '간격 (분)', add: '추가', delete: '삭제',
    catMessages: ['냥~ 힘내세요!','최고예요!','잠시 쉬어요~','건강 +1!','기분 좋아요~','오늘 멋져요!','행운을 빕니다!','에너지 충만!','계속하세요!','토닥토닥!','한 걸음 더!','할 수 있어요!'],
  },
  'ja': {
    title: 'DeskCare', keepHealthy: '健康維持', healthScore: '健康値',
    petCat: 'なでなで', times: '回', streakDays: '連続', days: '日', todayDone: '本日完了',
    dragMove: 'ドラッグ移動', hide: '隠す', settings: '設定', back: '戻る',
    stretch: 'ストレッチ', eyeRelax: '目の休息', kegel: 'ケーゲル運動', breathing: '呼吸法',
    stretchGuide: '腕を上げて15秒 · 首回し10秒 · 30歩歩く',
    eyeRelaxGuide: '6m先を見る20秒 · まばたき20回 · 目を回す5回',
    kegelGuide: '締める5秒 → 緩める5秒 → 10回繰り返し',
    breathingGuide: '吸う4秒 → 止める7秒 → 吐く8秒 → 4回繰り返し',
    custom: 'カスタム', addCustom: 'リマインダー追加',
    guide: 'DeskCareへようこそ', guide1: '上部バーでドラッグ移動',
    guide2: '猫をクリックしてみて', guide3: 'カードでリマインダー制御',
    guide4: '完了で健康値を獲得', guide5: '毎日のチェックインで連続記録',
    gotIt: '了解', intervalSettings: '通知間隔', notifySettings: '通知設定',
    nightSilent: '夜間サイレント', silentPeriod: 'サイレント時間', to: '〜', showPreview: 'プレビュー表示',
    generalSettings: '一般', autoStart: '起動時に実行', language: '言語',
    version: 'DeskCare v0.1.0',
    customTitle: 'カスタムリマインダー', titlePlaceholder: 'タイトル', guidePlaceholder: '説明',
    intervalLabel: '間隔（分）', add: '追加', delete: '削除',
    catMessages: ['ニャン~ 頑張って!','最高だよ!','少し休もう~','健康 +1!','気持ちいい~','今日も素晴らしい!','幸運を!','元気いっぱい!','続けよう!','よしよし!','あと一歩!','君ならできる!'],
  },
}

function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function ss(key: string, val: unknown) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

function prevDay(d: string): string { const dt = new Date(d); dt.setDate(dt.getDate()-1); return dt.toISOString().slice(0,10) }
function calcStreak(dates: string[]): { current: number; longest: number } {
  if (!dates.length) return { current:0, longest:0 }
  const uniq = [...new Set(dates)].sort().reverse()
  let cur=0, best=0, exp=new Date().toISOString().slice(0,10)
  for (const d of uniq) { if (d===exp) { cur++; exp=prevDay(exp) } else break }
  let run=1
  for (let i=1;i<uniq.length;i++) { if (uniq[i]===prevDay(uniq[i-1])) run++; else { if(run>best) best=run; run=1 } }
  if(run>best) best=run; if(cur>best) best=cur
  return { current:cur, longest:best }
}

interface SettingsState {
  settings: AppSettings
  setSettings: (s: AppSettings) => void
  updateInterval: (key: keyof ReminderIntervals, value: number) => void
  updateNotification: (patch: Partial<NotificationPrefs>) => void
  updateGeneral: (patch: Partial<AppSettings['general']>) => void
  activeReminder: ActiveReminder | null
  setActiveReminder: (r: ActiveReminder | null) => void
  view: 'reminders' | 'settings' | 'custom'
  setView: (v: 'reminders' | 'settings' | 'custom') => void
  healthScore: number; setHealthScore: (n: number) => void; incrementHealth: () => void
  completedDates: string[]; currentStreak: number; longestStreak: number; logCompletion: () => void
  customReminders: CustomReminder[]
  addCustomReminder: (r: Omit<CustomReminder, 'id' | 'enabled'>) => void
  removeCustomReminder: (id: string) => void
  toggleCustomReminder: (id: string) => void
}

const defaultSettings: AppSettings = {
  intervals: { stretchMinutes:45, eyeRelaxMinutes:20, kegelMinutes:60, breathingMinutes:90 },
  notification: { silentMode:false, silentStart:'22:00', silentEnd:'07:00', showPreview:true },
  general: { launchAtLogin:true, language:'zh-CN' },
}

const initialHealth = ls<number>('deskcare_health', 0)
const initialDates = ls<string[]>('deskcare_dates', [])
const initialStreaks = calcStreak(initialDates)
const initialCustom = ls<CustomReminder[]>('deskcare_custom', [])

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...defaultSettings, general: { ...defaultSettings.general } },
  setSettings: (s) => set({ settings: s }),
  updateInterval: (k, v) => set((s) => ({ settings: { ...s.settings, intervals: { ...s.settings.intervals, [k]: v } } })),
  updateNotification: (p) => set((s) => ({ settings: { ...s.settings, notification: { ...s.settings.notification, ...p } } })),
  updateGeneral: (p) => set((s) => ({ settings: { ...s.settings, general: { ...s.settings.general, ...p } } })),
  activeReminder: null,
  setActiveReminder: (r) => set({ activeReminder: r }),
  view: 'reminders',
  setView: (v) => set({ view: v }),
  healthScore: initialHealth,
  setHealthScore: (n) => { localStorage.setItem('deskcare_health', String(n)); set({ healthScore: n }) },
  incrementHealth: () => set((s) => { const n=s.healthScore+1; localStorage.setItem('deskcare_health', String(n)); return { healthScore:n } }),
  completedDates: initialDates,
  currentStreak: initialStreaks.current,
  longestStreak: initialStreaks.longest,
  logCompletion: () => set((s) => {
    const today = new Date().toISOString().slice(0,10)
    if (s.completedDates.includes(today)) return {}
    const dates = [...s.completedDates, today]; ss('deskcare_dates', dates)
    const st = calcStreak(dates); return { completedDates:dates, currentStreak:st.current, longestStreak:st.longest }
  }),
  customReminders: initialCustom,
  addCustomReminder: (r) => set((s) => {
    const cr: CustomReminder = { ...r, id: Date.now().toString(36), enabled: true }
    const list = [...s.customReminders, cr]; ss('deskcare_custom', list)
    return { customReminders: list }
  }),
  removeCustomReminder: (id) => set((s) => {
    const list = s.customReminders.filter(r => r.id !== id); ss('deskcare_custom', list)
    return { customReminders: list }
  }),
  toggleCustomReminder: (id) => set((s) => {
    const list = s.customReminders.map(r => r.id===id ? {...r, enabled:!r.enabled} : r); ss('deskcare_custom', list)
    return { customReminders: list }
  }),
}))