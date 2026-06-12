import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Tách bundle theo nhóm thư viện lớn để tải trang nhanh hơn
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ['@mui/material', '@mui/x-data-grid'],
          charts: ['recharts'],
          katex: ['katex'],
          docx: ['docx'],
          pdfgen: ['html2pdf.js']
        }
      }
    }
  },
  server: {
    // Khi dev local với "vercel dev", API chạy cùng cổng. Nếu chỉ chạy vite, proxy tới vercel dev (port 3000)
    proxy: { '/api': 'http://localhost:3000' }
  }
});
