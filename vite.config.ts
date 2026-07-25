import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  // ════════════════════════════════════════════════════════════════
  // 生产构建优化
  // ════════════════════════════════════════════════════════════════
  build: {
    // 目标现代浏览器（Tauri 2 内置 Chrome 120+）
    target: 'esnext',
    // JS 压缩
    minify: true,
    // 分割 chunk 策略：node_modules 独立缓存
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor'
            if (id.includes('zustand')) return 'zustand-vendor'
            if (id.includes('@tauri-apps')) return 'tauri-vendor'
            return 'vendor'
          }
        },
        // 稳定 chunk 文件名（利于 Tauri 增量发布）
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    // 资源内联阈值：小于 4KB 的 CSS/JS 直接内联到 HTML，减少 HTTP 请求
    assetsInlineLimit: 4096,
    // 报告压缩后体积
    reportCompressedSize: true,
  },
})
