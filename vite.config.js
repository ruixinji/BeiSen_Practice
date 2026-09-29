import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署路径，需与仓库名保持一致；本地开发请用 npm run dev -- --base=/
  base: '/BeiSen_Practice-BeiSenCePing/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});