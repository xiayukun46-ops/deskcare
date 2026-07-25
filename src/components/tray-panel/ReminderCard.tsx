import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '../shared/Icon'

interface ReminderCardProps {
  type: string
  title: string
  guide: string
  icon: IconName
  intervalMinutes: number
  enabled: boolean
  onToggle: () => void
  elapsedSeconds: number
}

const gradientMap: Record<string, string> = {
  stretch:   'from-emerald-500 to-teal-400',
  eye_relax: 'from-sky-500 to-blue-400',
  kegel:     'from-violet-500 to-purple-400',
  breathing: 'from-amber-500 to-orange-400',
}

const bgMap: Record<string, string> = {
  stretch:   'bg-emerald-50',
  eye_relax: 'bg-sky-50',
  kegel:     'bg-violet-50',
  breathing: 'bg-amber-50',
}

const barMap: Record<string, string> = {
  stretch:   'bg-emerald-400',
  eye_relax: 'bg-sky-400',
  kegel:     'bg-violet-400',
  breathing: 'bg-amber-400',
}

export function ReminderCard({
  type, title, guide, icon, intervalMinutes, enabled, onToggle, elapsedSeconds,
}: ReminderCardProps) {
  const gradient = gradientMap[type] ?? 'from-primary-500 to-primary-400'
  const bg = bgMap[type] ?? 'bg-primary-50'
  const bar = barMap[type] ?? 'bg-sage-400'
  const remaining = Math.max(intervalMinutes * 60 - elapsedSeconds, 0)
  const progress = Math.min(elapsedSeconds / (intervalMinutes * 60), 1)
  const [celebrating, setCelebrating] = useState(false)
  const prevProgress = useRef(progress)

  useEffect(() => {
    if (prevProgress.current < 1 && progress >= 1) {
      setCelebrating(true)
      const t = setTimeout(() => setCelebrating(false), 1600)
      return () => clearTimeout(t)
    }
    prevProgress.current = progress
  }, [progress])

  return (
    <div className={`rounded-xl px-3 py-2 card-hover ${enabled ? 'opacity-100' : 'opacity-45 grayscale'} ${bg} ${celebrating ? 'animate-card-celebrate' : ''}`}>
      {/* 图标 + 标题 + 开关 */}
      <div className="flex items-center gap-2">
        <div className={`shrink-0 w-7 h-7 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
          <Icon name={icon} size={15} />
        </div>
        <span className="text-[13px] font-semibold text-gray-800">{title}</span>
        <span className="text-[10px] text-gray-400 ml-auto mr-2">{intervalMinutes} min</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className={`relative inline-flex items-center w-[34px] h-[20px] rounded-full transition-colors duration-200 shrink-0 focus:outline-none ${enabled ? 'bg-sage-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[16px]' : 'translate-x-[1px]'}`} />
        </button>
      </div>

      {/* 动作指导 + 倒计时 */}
      <div className="mt-1.5 flex items-start gap-2">
        <span className="text-[11px] text-gray-600 leading-snug flex-1 line-clamp-2">{guide}</span>
        <span className="text-[10px] font-mono text-gray-400 tabular-nums shrink-0 mt-0.5">
          {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
        </span>
      </div>

      {/* 进度条 */}
      <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${bar} ${celebrating ? 'animate-progress-pulse' : ''}`} style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </div>
  )
}
