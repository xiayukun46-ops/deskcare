import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useSettingsStore } from '../../stores/settingsStore'
import { useReminder } from '../../hooks/useReminder'
import { useTrayPanel } from '../../hooks/useTrayPanel'
import { ReminderCard } from './ReminderCard'
import { QuickAction } from './QuickAction'
import { SettingsPanel } from '../settings/SettingsPanel'
import { Icon } from '../shared/Icon'

import catfishImg from '../../assets/OIP.webp'
import { T } from '../../stores/settingsStore'

const REMINDER_CONFIG = [
  { type: 'stretch',   title: '久坐拉伸', icon: 'stretch' as const,   guide: '双手举过头顶伸展 15s · 颈部左右转动各 10s · 起身走 30 步' },
  { type: 'eye_relax', title: '眼部放松', icon: 'eye' as const,       guide: '远眺 6 米外 20s · 快速眨眼 20 次 · 顺/逆时针转眼各 5 圈' },
  { type: 'kegel',     title: '提肛运动', icon: 'kegel' as const,     guide: '收紧盆底肌 5s → 放松 5s → 重复 10 次 · 呼气收紧吸气放松' },
  { type: 'breathing', title: '呼吸训练', icon: 'breathing' as const, guide: '鼻吸 4s → 屏息 7s → 口呼 8s → 重复 4 轮 · 感受腹部起伏' },
]

function getCatSkin(count: number): string {
  if (count >= 100) return '=^_^= v'
  if (count >= 50) return '=^_^= *'
  if (count >= 20) return '=^-^= ~'
  if (count >= 10) return '=^_^= !'
  return '(=^_^=)'
}

const CAT_MESSAGES = [
  '喵~ 继续加油！', '你是最棒的！', '休息一下也不错~', '健康值 +1！',
  '摸得好舒服~', '今天的你很优秀！', '好运连连！', '元气满满！',
  '坚持就是胜利！', '摸摸头，继续肝！', '离健康又近了一步！', '打工人雄起！',
]

const HEALTH_FACTS = [
  '每坐1小时，代谢率下降90%——起来走两步就恢复了！',
]

type ReminderType = 'stretch' | 'eye_relax' | 'kegel' | 'breathing'

export function TrayPanel() {
  const view = useSettingsStore((s) => s.view)
  const setView = useSettingsStore((s) => s.setView)
  const activeReminder = useSettingsStore((s) => s.activeReminder)
  const settings = useSettingsStore((s) => s.settings)
  const lang = (useSettingsStore((s) => s.settings.general.language) || 'zh-CN') as 'zh-CN' | 'en' | 'ko' | 'ja'
  const healthScore = useSettingsStore((s) => s.healthScore)
  const incrementHealth = useSettingsStore((s) => s.incrementHealth)
  const currentStreak = useSettingsStore((s) => s.currentStreak)
  const longestStreak = useSettingsStore((s) => s.longestStreak)
  const logCompletion = useSettingsStore((s) => s.logCompletion)
  const customReminders = useSettingsStore((s) => s.customReminders)
  const toggleCustomReminder = useSettingsStore((s) => s.toggleCustomReminder)
  const addCustomReminder = useSettingsStore((s) => s.addCustomReminder)
  const removeCustomReminder = useSettingsStore((s) => s.removeCustomReminder)

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({
    stretch: true, eye_relax: true, kegel: true, breathing: true,
  })
  // 性能优化：用 useRef 存实际值，只用一个 trigger 触发渲染
  const elapsedRef = useRef<Record<string, number>>({ stretch: 0, eye_relax: 0, kegel: 0, breathing: 0 })
  const [, setTick] = useState(0)
  const translatedConfig = useMemo(() => REMINDER_CONFIG.map(cfg => ({
    ...cfg,
    title: (T[lang] as any)?.[cfg.type==='stretch'?'stretch':cfg.type==='eye_relax'?'eyeRelax':cfg.type==='kegel'?'kegel':'breathing'] || cfg.title,
    guide: (T[lang] as any)?.[cfg.type==='stretch'?'stretchGuide':cfg.type==='eye_relax'?'eyeRelaxGuide':cfg.type==='kegel'?'kegelGuide':'breathingGuide'] || cfg.guide,
  })), [lang])


  const [petCount, setPetCount] = useState(() => { try { return parseInt(localStorage.getItem('deskcare_pet')||'0') } catch { return 0 } })
  const [toasts, setToasts] = useState<{ id: number; msg: string; hearts: { x: number; d: number }[] }[]>([])
  const toastIdRef = useRef(0)
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'cafe' | 'forest'>('off')
  const noiseCtx = useRef<AudioContext | null>(null)
  const [healthFact, setHealthFact] = useState('')
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('deskcare_guide_v2'))

  useReminder()
  useTrayPanel()

  useEffect(() => {
    const unlisten = listen('health-changed', () => { incrementHealth(); logCompletion(); setHealthFact(HEALTH_FACTS[Math.floor(Math.random()*HEALTH_FACTS.length)]); setTimeout(() => setHealthFact(''), 5000) })
    return () => { unlisten.then((fn) => fn()) }
  }, [incrementHealth, logCompletion])

  useEffect(() => {
    const tick = setInterval(() => {
      const prev: Record<string, number> = {}
      let changed = false
      for (const t of ['stretch', 'eye_relax', 'kegel', 'breathing'] as ReminderType[]) {
        const max = settings.intervals[t === 'stretch' ? 'stretchMinutes' : t === 'eye_relax' ? 'eyeRelaxMinutes' : t === 'kegel' ? 'kegelMinutes' : 'breathingMinutes'] * 60
        const next = (elapsedRef.current[t] + 1) % max
        prev[t] = elapsedRef.current[t]
        elapsedRef.current[t] = next
        if (next === 0 && prev[t] > 0) {
          logCompletion()
        }
        changed = true
      }
      if (changed) setTick((n) => n + 1)
    }, 1000)
    return () => clearInterval(tick)
  }, [settings.intervals, logCompletion])

  const handleToggle = useCallback((type: string) => {
    setEnabledMap((prev) => {
      const next = !prev[type]
      invoke('toggle_timer', { reminderType: type, enabled: next }).catch(() => {
        setEnabledMap((p) => ({ ...p, [type]: !next }))
      })
      return { ...prev, [type]: next }
    })
  }, [])

  const handleQuickAction = useCallback((type: string) => {
    elapsedRef.current[type] = 0
    setTick((n) => n + 1)
  }, [])

  useEffect(() => {
    if (activeReminder) {
      elapsedRef.current[activeReminder.type] = 0
      setTick((n) => n + 1)
    }
  }, [activeReminder])

  const handleHide = useCallback(() => getCurrentWindow().hide(), [])

  const handlePetCat = useCallback(() => {
    const id = ++toastIdRef.current
    const msg = CAT_MESSAGES[Math.floor(Math.random() * CAT_MESSAGES.length)]
    const hearts = Array.from({ length: 5 }, () => ({
      x: Math.random() * 60 - 30,
      d: 0.8 + Math.random() * 0.6,
    }))
    setToasts(prev => [...prev, { id, msg, hearts }])
    setPetCount(c => { const n = c + 1; try { localStorage.setItem('deskcare_pet', String(n)) } catch {}; return n })
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2200)
  }, [])

  const toggleAmbient = useCallback((sound: 'off' | 'rain' | 'cafe' | 'forest') => {
    setAmbientSound(sound)
    if (noiseCtx.current) { noiseCtx.current.close(); noiseCtx.current = null }
    if (sound === 'off') return
    try {
      const ctx = new AudioContext()
      noiseCtx.current = ctx
      const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) {
        if (sound === 'rain') d[i] = (Math.random() - 0.5) * 0.06 * Math.random()
        else if (sound === 'cafe') d[i] = (Math.random() - 0.5) * 0.03 + Math.sin(i * 0.003) * 0.02
        else d[i] = (Math.random() - 0.5) * 0.02 + Math.sin(i * 0.0007) * 0.04
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true
      const gain = ctx.createGain(); gain.gain.value = 0.15
      src.connect(gain); gain.connect(ctx.destination); src.start()
    } catch {}
  }, [])

  const dismissGuide = useCallback(() => {
    setShowGuide(false)
    localStorage.setItem('deskcare_guide_v2', '1')
  }, [])

  const isSettings = view === 'settings'
  const today = new Date().toISOString().slice(0, 10)
  const todayDone = useSettingsStore((s) => s.completedDates).includes(today)

  return (
    <div className="h-full flex flex-col bg-white">

      {/* ===== 共享拖拽区 ===== */}
      <div data-tauri-drag-region id="drag-bar" className="h-8 shrink-0 flex items-center justify-center bg-[#F3F4F5] border-b border-gray-200 cursor-grab select-none">
        {isSettings ? (
          <span className="text-[11px] text-gray-400 tracking-wider">{(T[lang]?.dragMove as string) || "↕ 拖拽移动"}窗口</span>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3 rounded-full bg-gray-300" />
              <div className="w-1 h-3 rounded-full bg-gray-300" />
            </div>
            <span className="text-[11px] text-gray-400 tracking-wider mx-2">{(T[lang]?.dragMove as string) || "↕ 拖拽移动"}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3 rounded-full bg-gray-300" />
              <div className="w-1 h-3 rounded-full bg-gray-300" />
            </div>
          </>
        )}
      </div>

      {/* ===== 共享顶栏 ===== */}
      <div className="flex items-center justify-between px-5 h-9 shrink-0 bg-white border-b border-gray-100">
        {isSettings ? (
          <>
            <button onClick={() => setView('reminders')} className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <Icon name="arrow-left" size={18} />
            </button>
            <h2 className="text-[12px] font-semibold text-gray-800">{(T[lang]?.settings as string) || "\u8bbe\u7f6e"}</h2>
            <div className="w-8" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-gradient-to-br from-sage-400 to-sage-500 flex items-center justify-center shadow-sm">
                <span className="text-[8px] font-bold text-white">D</span>
              </div>
              <span className="text-[12px] font-bold text-gray-800">DeskCare</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={handleHide} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="隐藏到托盘">
                <Icon name="minus" size={16} />
              </button>
              <button onClick={() => setView("settings")} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title={(T[lang]?.settings as string) || "\u8bbe\u7f6e"}>
                <Icon name="settings" size={16} />
              </button>
              <button onClick={() => toggleAmbient(ambientSound==="off"?"rain":"off")}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title={ambientSound==="off"?"环境音：关闭":"环境音：已开启"}>
                <span className="text-[14px]">{ambientSound==="off"?"🔇":"🎵"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ===== 设置面板 ===== */}
      {isSettings && (
        <div className="flex-1 overflow-y-auto">
          <SettingsPanel />
        </div>
      )}

      {/* ===== 主页内容 ===== */}
      {!isSettings && (
        <>
          {/* Banner */}
          <div className="flex flex-col items-center px-4 py-2 shrink-0 bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-blue-50/60 border-b border-gray-100">
            <div className="relative">
              <img src={catfishImg} alt="DeskCare"
                className="h-12 w-auto object-contain mb-1 cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={handlePetCat} title="戳我试试~" />
              <span className="absolute -top-1 right-0 text-[10px] select-none pointer-events-none">{getCatSkin(petCount)}</span>
              {toasts.map((t) => (
                <div key={t.id} className="absolute inset-0 pointer-events-none">
                  {t.hearts.map((h, i) => (
                    <span key={i} className="absolute heart-particle animate-heart-pop"
                      style={{ left: `calc(50% + ${h.x}px)`, top: '50%', animationDelay: `${i * 0.08}s`, animationDuration: `${h.d * 1.4}s` }}>
                      {['♥', '♡', '❦', '✿', '★'][i]}
                    </span>
                  ))}
                  <span className="absolute left-1/2 -translate-x-1/2 top-0 text-[14px] font-bold text-sage-700 whitespace-nowrap animate-toast pointer-events-none select-none"
                    style={{ animationDelay: '0.15s' }}>{t.msg}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-1.5">
              {healthFact ? (<div className="bg-sage-50 border border-sage-200/40 rounded-lg px-3 py-1 mb-1" style={{animation:"slide-up 0.3s ease-out"}}><span className="text-[11px] text-sage-700">{healthFact}</span></div>) : null}
          <span className="text-lg font-bold tracking-[0.25em] text-sage-700 select-none">{(T[lang]?.keepHealthy as string) || "保持健康"}</span>
              <div className="flex items-center gap-2 bg-white/85 rounded-full px-4 py-0.5 shadow-sm border border-sage-200/40 select-none">
                <span className="text-[13px] text-sage-600 font-medium">{T[lang]?.healthScore || "❤️ 健康值"}</span>
                <span className="text-base font-bold text-sage-600 tabular-nums">{healthScore}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-sage-500/70 select-none">(=^_^=) 撸猫 <span className="font-semibold text-sage-600">{petCount}</span>{T[lang]?.times || " 次"}</span>
                {currentStreak > 0 && (
                  <span className="text-[10px] text-sage-500/70 select-none">
                    🔥 连续 <span className="font-semibold text-sage-600">{currentStreak}</span> 天
                    {longestStreak > currentStreak && <span className="text-gray-400"> (最佳{longestStreak})</span>}
                  </span>
                )}
                {todayDone && <span className="text-[10px] text-green-500/80 select-none">{(T[lang]?.todayDone as string) || "✓ 今日已打卡"}</span>}
              </div>
            </div>
          </div>

          {/* 活跃提醒 */}
          {activeReminder && (
            <div className="mx-5 mt-2 px-3.5 py-2 rounded-xl bg-sage-50 border border-sage-200/60 shrink-0" style={{ animation: 'slide-up 0.3s ease-out' }}>
              <div className="flex items-center gap-2">
                <Icon name="bell" size={15} className="text-sage-500" />
                <span className="text-[13px] font-semibold text-sage-700">
                  {translatedConfig.find((c) => c.type === activeReminder.type)?.title} — {T[lang]?.nowStart || "现在开始！"}
                </span>
              </div>
            </div>
          )}

          {/* 四张卡片 */}
          <div className="flex-1 flex flex-col justify-evenly px-4 py-0.5">
            {translatedConfig.map((config) => (
              <ReminderCard
                key={config.type}
                type={config.type}
                title={config.title}
                guide={config.guide}
                icon={config.icon}
                intervalMinutes={
                  config.type === 'stretch'   ? settings.intervals.stretchMinutes
                  : config.type === 'eye_relax' ? settings.intervals.eyeRelaxMinutes
                  : config.type === 'kegel'     ? settings.intervals.kegelMinutes
                  : settings.intervals.breathingMinutes
                }
                enabled={enabledMap[config.type] ?? true}
                onToggle={() => handleToggle(config.type)}
                elapsedSeconds={elapsedRef.current[config.type] ?? 0}
              />
            ))}
          </div>

          {customReminders.map((cr) => (<>
            <ReminderCard
              key={cr.id}
              type={cr.id}
              title={cr.title}
              guide={cr.guide}
              icon="stretch"
              intervalMinutes={cr.intervalMinutes}
              enabled={cr.enabled}
              onToggle={() => toggleCustomReminder(cr.id)}
              elapsedSeconds={elapsedRef.current[cr.id] ?? 0} />
              <div className="flex justify-end -mt-1 mb-1">
                <button onClick={() => removeCustomReminder(cr.id)}
                  className="text-[10px] text-red-400 hover:text-red-600">
                  {(T[lang]?.delete as string) || "删除"}
                </button>
              </div>
          </>))}

          <div className="flex items-center justify-center py-1.5">
            <button onClick={() => {
              const title = prompt('提醒名称（如：喝水）')
              if (!title) return
              const guide = prompt('动作指导（如：每次喝200ml水）')
              if (!guide) return
              const mins = parseInt(prompt('间隔（分钟）', '30') || '30')
              if (isNaN(mins) || mins < 5) return
              addCustomReminder({ title, guide, intervalMinutes: mins })
            }}
              className="text-[11px] text-gray-400 hover:text-sage-600 transition-colors">
              + {(T[lang]?.addCustom as string) || '添加自定义提醒'}
            </button>
          </div>


          {/* 底部 */}
          <div className="px-4 py-1.5 border-t border-gray-100 shrink-0">
            <div className="grid grid-cols-4 gap-2">
              {translatedConfig.map((config) => (
                <QuickAction key={config.type} label={config.title} icon={config.icon}
                  active={activeReminder?.type === config.type} onClick={() => handleQuickAction(config.type)} />
              ))}
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-1 leading-tight select-none">{T[lang]?.resetHint || "点击上方按钮可重置该类倒计时"}</p>
            <p className="text-center text-[9px] text-gray-300 leading-none mt-0.5 select-none">xyk</p>
          </div>
        </>
      )}

      {/* 首次引导 */}
      {showGuide && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30" style={{ animation: 'fade-in 0.25s ease-out' }} onClick={dismissGuide}>
          <div className="bg-white rounded-2xl shadow-2xl px-6 py-5 mx-5 max-w-[340px]" style={{ animation: 'slide-up 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-800 mb-3">{(T[lang]?.guide as string) || "欢迎使用 DeskCare"}</h3>
            <ul className="text-[12px] text-gray-600 space-y-2 mb-4">
              <li>{(T[lang]?.guide1 as string) || "· 顶部拖拽栏可移动窗口"}</li>
              <li>{(T[lang]?.guide2 as string) || "· 点击小猫有惊喜"}</li>
              <li>{(T[lang]?.guide3 as string) || "· 卡片开关控制提醒"}</li>
              <li>{(T[lang]?.guide4 as string) || "· 完成提醒获得健康值"}</li>
              <li>{(T[lang]?.guide5 as string) || "· 连续打卡解锁连击成就"}</li>
              <li>· {T[lang]?.guideLang || "设置中可切换中文/English/한국어/日本語"}</li>
              <li>· {T[lang]?.guideCustom || "支持添加自定义提醒类型"}</li>
            </ul>
            <button onClick={dismissGuide}
              className="w-full py-2.5 rounded-xl bg-sage-500 text-white text-[13px] font-medium hover:bg-sage-600 transition-colors">
              知道了，开始使用
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
