// ════════════════════════════════════════════════════════════════
// ActionCard — 提醒任务卡片
// ════════════════════════════════════════════════════════════════

import type { ReminderPayload } from './types'

const CONFIG: Record<string, { icon: string; label: string; duration: string; color: string }> = {
  stretch:   { icon: '', label: '久坐拉伸', duration: '约 1 分钟', color: '#8AAE92' },
  eye_relax: { icon: '', label: '眼部放松', duration: '约 30 秒', color: '#7B9DC8' },
  kegel:     { icon: '', label: '提肛运动', duration: '约 1 分钟', color: '#9B8EC4' },
  breathing: { icon: '', label: '呼吸训练', duration: '约 2 分钟', color: '#C49B6E' },
}

interface ActionCardProps {
  payload: ReminderPayload
}

export function ActionCard({ payload }: ActionCardProps) {
  const c = CONFIG[payload.reminder_type] ?? CONFIG.stretch

  return (
    <div className="w-full px-1">
      {/* ── 玻璃拟态卡片 ── */}
      <div className="glass-card rounded-card px-5 py-4">
        {/* 头部 */}
        <div className="flex items-center gap-2.5 mb-3">
          {/* 类型图标 + 背景渐变圆 */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg leading-none"
            style={{ background: `${c.color}18` }}
          >
            
          </div>

          <h3 className="text-[13px] font-semibold text-sage-700 tracking-wide">
            {c.label}
          </h3>

          <span className="ml-auto text-[10px] text-warm-500 bg-warm-200/60 px-2.5 py-1 rounded-pill font-medium">
            {c.duration}
          </span>
        </div>

        {/* 正文动作指令 */}
        <p className="text-[13px] leading-relaxed text-sage-700/85">
          {payload.body}
        </p>

        {/* 底部快捷键提示 */}
        <div className="mt-3 flex items-center gap-3 text-[10px] text-warm-500">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-5 h-5 rounded-[5px] bg-sage-100/60 text-sage-600 font-mono text-[9px] font-semibold border border-sage-200/60">
              ␣
            </kbd>
            完成
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-5 h-5 rounded-[5px] bg-sage-100/60 text-sage-600 font-mono text-[9px] font-semibold border border-sage-200/60">
              Esc
            </kbd>
            推迟
          </span>
        </div>
      </div>
    </div>
  )
}
