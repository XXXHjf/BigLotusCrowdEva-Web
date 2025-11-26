import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 生产环境构建优化
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境关闭 sourcemap，减小体积
    minify: 'esbuild', // 使用 esbuild 进行压缩（更快，默认）
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'echarts-vendor': ['echarts', 'echarts-for-react'],
        },
      },
    },
    // 块大小警告限制
    chunkSizeWarningLimit: 1000,
  },
  // 生产环境预览服务器配置
  preview: {
    port: 4173,
    host: true,
  },
})
