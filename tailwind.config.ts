import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ════════════════════════════════════════════════════════════
      // Morandi 鼠尾草绿 + 暖米色系 — DeskCare 设计语言
      // ════════════════════════════════════════════════════════════
      colors: {
        // 主色：鼠尾草绿 (Sage Green) — 舒缓、自然、治愈
        sage: {
          50: '#F4F7F2',
          100: '#E8EDE7',
          200: '#D2DDCF',
          300: '#B4C9B1',
          400: '#8AAE92',
          500: '#6D9C76',
          600: '#5A8460',
          700: '#4A5D4E',
          800: '#3A4D3E',
          900: '#2A3C2E',
        },
        // 暖米系 (Warm Beige) — 纸张质感，柔和底板
        warm: {
          50: '#FDFBF7',
          100: '#F7F2E8',
          200: '#F2EFE9',
          300: '#E8DCC8',
          400: '#D4C4A8',
          500: '#8B8B7E',
        },
      },
      // ── 圆角 ──
      borderRadius: {
        panel: '16px',
        card: '18px',
        pill: '9999px',
      },
      // ── 自定义动画关键帧 ──
      keyframes: {
        // 入场动画
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // 呼吸环动画 (19s 完整周期: 4-7-8)
        'breathe-ring': {
          '0%': { transform: 'scale(0.48)', opacity: '0.45' },
          '21.05%': { transform: 'scale(1.0)', opacity: '1' },
          '35%': { transform: 'scale(1.0)', opacity: '0.88' },
          '57.89%': { transform: 'scale(1.0)', opacity: '1' },
          '100%': { transform: 'scale(0.48)', opacity: '0.45' },
        },
        // 柔脉动
        'pulse-gentle': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '0.9' },
        },
        // 按钮光泽扫过
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        // 打卡成功脉冲
        'success-pop': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // 外层轨道慢转
        'orbit-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'breathe-ring': 'breathe-ring 19s ease-in-out infinite',
        'pulse-gentle': 'pulse-gentle 2.6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s ease-in-out infinite',
        'success-pop': 'success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'orbit-slow': 'orbit-slow 40s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
