import { type ReactNode, useEffect, useState } from 'react'

interface TransitionProps {
  show: boolean
  children: ReactNode
  enter?: string
  leave?: string
}

/**
 * 轻量级 CSS 动画包装器，为面板切换提供过渡动画
 */
export function Transition({
  show,
  children,
  enter = 'animate-slide-up',
  leave = 'animate-slide-down',
}: TransitionProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) setVisible(true)
    else {
      const timer = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!visible) return null

  return (
    <div className={show ? enter : leave}>
      {children}
    </div>
  )
}
