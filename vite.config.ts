import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    base: './',
    build: isLib
      ? {
          outDir: 'dist',
          lib: {
            entry: resolve(__dirname, 'src/mount.tsx'),
            name: 'OJSAdminUI',
            fileName: 'index',
            formats: ['es'],
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
            output: { manualChunks: undefined },
          },
        }
      : {
          outDir: 'dist-app',
        },
    server: {
      proxy: {
        '/ojs': 'http://localhost:8080',
      },
    },
  };
});
