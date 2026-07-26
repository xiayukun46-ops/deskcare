import { useEffect, useState, useCallback, useRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { listen, emit } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

import { BreathingGuide } from './BreathingGuide'
import { ActionCard } from './ActionCard'
import { playCompletionChime } from './sound'
import type { ReminderPayload } from './types'
import { T } from '../../stores/settingsStore'

type ModalState = 'idle' | 'entering' | 'active' | 'completing' | 'snoozing'

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function ReminderModal() {
  const [payload, setPayload] = useState<ReminderPayload | null>(null)
  const [state, setState] = useState<ModalState>('idle')
  const windowRef = useRef(getCurrentWindow())
  const stateRef = useRef<ModalState>('idle')
  const completeRef = useRef<() => void>(() => {})
  const snoozeRef = useRef<() => void>(() => {})

  useEffect(() => {
    const unlisten = listen<ReminderPayload>('show-reminder', (event) => {
      setPayload(event.payload)
      setState('entering'); stateRef.current = 'entering'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setState('active'); stateRef.current = 'active'
        })
      })
    })
    return () => { unlisten.then((fn) => fn()) }
  }, [])

  const handleComplete = useCallback(async () => {
    if (stateRef.current !== 'active') return
    stateRef.current = 'completing'; setState('completing')
    playCompletionChime()
    setTimeout(async () => {
      try { await invoke('increment_health'); await emit('health-changed', {}) } catch { /* */ }
      try { await windowRef.current.hide() } catch { /* */ }
      setState('idle'); setPayload(null); stateRef.current = 'idle'
    }, 450)
  }, [])
  completeRef.current = handleComplete

  const handleSnooze = useCallback(async () => {
    if (stateRef.current !== 'active') return
    stateRef.current = 'snoozing'; setState('snoozing')
    setTimeout(async () => {
      try { await windowRef.current.hide() } catch { /* */ }
      setState('idle'); setPayload(null); stateRef.current = 'idle'
    }, 250)
  }, [])
  snoozeRef.current = handleSnooze

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stateRef.current !== 'active') return
      if (e.code === 'Space') { e.preventDefault(); completeRef.current() }
      if (e.code === 'Escape') { e.preventDefault(); snoozeRef.current() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (state === 'idle' && !payload) {
    return (
      <div className="h-full flex flex-col bg-warm-200">
        <div data-tauri-drag-region className="h-8 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
          <span className="text-[10px] text-warm-400 tracking-widest">{T['zh-CN' as keyof typeof T]?.dragMove || "拖拽移动"}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-warm-500">{(T as any)["zh-CN"]?.waiting || "等待提醒中…"}</p>
        </div>
      </div>
    )
  }

  if (!payload) return null

  return (
    <div className={`h-full flex flex-col bg-warm-200 transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${state === 'entering' ? 'opacity-0 translate-y-2' : ''} ${state === 'completing' ? 'opacity-0 scale-[0.97]' : ''} ${state === 'snoozing' ? 'opacity-0 translate-y-3' : ''}`}>

      {/* ═══ 拖拽栏 ═══ */}
      <div data-tauri-drag-region className="h-8 shrink-0 flex items-center justify-center bg-warm-200 border-b border-warm-300/30 cursor-grab active:cursor-grabbing select-none relative z-20">
        <span className="text-[10px] text-warm-400 tracking-widest">{T['zh-CN' as keyof typeof T]?.dragMove || "拖拽移动"}</span>
      </div>

      {/* 背景光晕 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-sage-100/45 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-warm-300/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full flex-1 px-6 pt-8 pb-6">
        <div className="flex-shrink-0 mb-3"><BreathingGuide /></div>
        <div className="flex-shrink-0 mb-5 w-full"><ActionCard payload={payload} /></div>

        <div className="mt-auto w-full space-y-2.5 pb-1">
          <button onClick={handleComplete} disabled={state !== 'active'}
            className="btn-shimmer relative w-full py-3.5 rounded-xl font-medium text-[14px] tracking-wide transition-all duration-200 bg-gradient-to-r from-sage-400 via-sage-500 to-sage-400 bg-[length:200%_100%] text-white shadow-md shadow-sage-400/25 hover:shadow-lg hover:shadow-sage-400/30 hover:brightness-105 active:scale-[0.96] active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundPosition: '0% 50%' }}>
            <CheckIcon size={18} /><span>{(T as any)["zh-CN"]?.complete || "完成打卡"}</span>
            <kbd className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono font-semibold">Space</kbd>
          </button>
          <button onClick={handleSnooze} disabled={state !== 'active'}
            className="glass-button w-full py-3 rounded-xl font-medium text-[12px] tracking-wide transition-all duration-200 text-warm-500 hover:text-sage-700 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
            <ClockIcon size={14} /><span>{(T as any)["zh-CN"]?.snooze5 || "再给 5 分钟"}</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded-md bg-sage-100/60 text-[10px] font-mono text-sage-600 font-semibold border border-sage-200/40">Esc</kbd>
          </button>
        </div>
      </div>

      {state === 'completing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-warm-200/85 backdrop-blur-sm z-20 animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="success-check w-16 h-16 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-xl shadow-sage-400/35">
              <CheckIcon size={34} />
            </div>
            <span className="text-[14px] font-medium text-sage-700 tracking-wide">{(T as any)["zh-CN"]?.done || "打卡完成"}</span>
          </div>
        </div>
      )}
    </div>
  )
}
