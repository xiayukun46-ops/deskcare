// ════════════════════════════════════════════════════════════════
// BreathingGuide — 4-7-8 呼吸引导圈
// ════════════════════════════════════════════════════════════════
//
// 视觉架构（从外到内）：
//   ① 外层轨道环 — 极淡实线 + 虚线，40s 慢速旋转
//   ② 呼吸动画环 — scale 0.48↔1.0，19s 周期，透明度随之呼吸
//   ③ 音频频谱式微弧线 — 4 个短弧段各自脉动
//   ④ 中心文字 — 阶段标签 + 倒计时秒数
//
// 纯 CSS animation，JS 只负责更新阶段文字。

import { useEffect, useRef, useState } from 'react'

type BreathPhase = 'inhale' | 'hold' | 'exhale'

const PHASE: Record<BreathPhase, { label: string; seconds: number; hint: string }> = {
  inhale: { label: '吸气', seconds: 4, hint: '鼻吸 · 腹部鼓起' },
  hold:  { label: '屏息', seconds: 7, hint: '保持 · 平静安稳' },
  exhale: { label: '呼气', seconds: 8, hint: '口呼 · 腹部回落' },
}

const CYCLE_TOTAL = 19 // 4 + 7 + 8

/** 每圈 4 个短弧，用于微脉动效果 */
function ArcWidget({ rotation, delay }: { rotation: number; delay: number }) {
  const diameter = 124
  const radius = diameter / 2
  const arcLength = 42 // 弧线长度（角度）
  const startAngle = 0

  const startRad = (startAngle * Math.PI) / 180
  const endRad = ((startAngle + arcLength) * Math.PI) / 180
  const x1 = radius + radius * Math.cos(startRad)
  const y1 = radius + radius * Math.sin(startRad)
  const x2 = radius + radius * Math.cos(endRad)
  const y2 = radius + radius * Math.sin(endRad)

  return (
    <g
      transform={`rotate(${rotation} 90 90)`}
      className="transition-opacity duration-1000"
      style={{ animationDelay: `${delay}s` }}
    >
      <path
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke="#8AAE92"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.3"
        className="animate-pulse-gentle"
        style={{ animationDelay: `${delay}s` }}
      />
    </g>
  )
}

export function BreathingGuide() {
  const [phase, setPhase] = useState<BreathPhase>('inhale')
  const [secInPhase, setSecInPhase] = useState(0)
  const elapsedRef = useRef(0)
  const phaseRef = useRef<BreathPhase>('inhale')

  useEffect(() => {
    const tick = setInterval(() => {
      elapsedRef.current = (elapsedRef.current + 1) % CYCLE_TOTAL

      let cum = 0
      let cur: BreathPhase = 'inhale'
      for (const p of ['inhale', 'hold', 'exhale'] as BreathPhase[]) {
        cum += PHASE[p].seconds
        if (elapsedRef.current < cum) { cur = p; break }
      }

      if (cur !== phaseRef.current) {
        phaseRef.current = cur
        setPhase(cur)
      }

      const prevCum =
        cur === 'inhale' ? 0
        : cur === 'hold' ? PHASE.inhale.seconds
        : PHASE.inhale.seconds + PHASE.hold.seconds
      setSecInPhase(elapsedRef.current - prevCum)
    }, 1000)

    return () => clearInterval(tick)
  }, [])

  const cfg = PHASE[phase]
  const remaining = cfg.seconds - secInPhase

  return (
    <div className="relative flex items-center justify-center w-[180px] h-[180px]">
      {/* ════════════ ① 外层轨道环 — 慢速旋转 ════════════ */}
      <svg
        viewBox="0 0 180 180"
        className="absolute inset-0 orbit-ring"
        aria-hidden="true"
      >
        {/* 主外环 */}
        <circle cx="90" cy="90" r="78" fill="none"
          stroke="#C5CFC2" strokeWidth="0.8" opacity="0.45" />
        {/* 虚线内环 */}
        <circle cx="90" cy="90" r="68" fill="none"
          stroke="#B4C9B1" strokeWidth="0.6" opacity="0.28"
          strokeDasharray="4 6" />
      </svg>

      {/* ════════════ ② 呼吸动画环 — 缩放呼吸 ════════════ */}
      <svg
        viewBox="0 0 180 180"
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* 主呼吸环 — 使用 CSS 类 breathing-ring-layer */}
        <circle cx="90" cy="90" r="58" fill="none"
          stroke="url(#breathGradient)" strokeWidth="2.2"
          strokeLinecap="round"
          className="breathing-ring-layer"
        />
        <defs>
          <linearGradient id="breathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8AAE92" />
            <stop offset="50%" stopColor="#6D9C76" />
            <stop offset="100%" stopColor="#B4C9B1" />
          </linearGradient>
        </defs>
      </svg>

      {/* ════════════ ③ 微弧线 — 4 条弧段各自脉动 ════════════ */}
      <svg viewBox="0 0 180 180" className="absolute inset-0" aria-hidden="true">
        <ArcWidget rotation={0} delay={0} />
        <ArcWidget rotation={90} delay={0.65} />
        <ArcWidget rotation={180} delay={1.3} />
        <ArcWidget rotation={270} delay={1.95} />
      </svg>

      {/* ════════════ ④ 中心阶段文字 ════════════ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[26px] font-light tracking-[0.15em] text-sage-700 leading-none">
          {cfg.label}
        </span>
        <span className="text-[13px] font-mono tabular-nums text-warm-500 mt-1.5 tracking-wider">
          {String(remaining).padStart(2, '0')}s
        </span>
      </div>

      {/* ════════════ ⑤ 底部呼吸引导文字 ════════════ */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <p className="text-[11px] text-warm-500 tracking-wide text-center">
          {cfg.hint}
        </p>
      </div>
    </div>
  )
}
