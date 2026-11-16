import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 部署在子路径时（例如 http://IP/addressbook/）用 VITE_BASE 覆盖：
//   PowerShell:  $env:VITE_BASE='/addressbook/'; npm run build
//   bash:        VITE_BASE=/addressbook/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
  preview: { port: 4173 },
});
