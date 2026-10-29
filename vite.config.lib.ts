import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'dist/standalone',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'RichTextEmailEditor',
      formats: ['es', 'cjs'],
      fileName: (format) => `rich-text-email-editor.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // React and ReactDOM are peer dependencies provided by the consuming app
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'rich-text-email-editor.css';
          }
          return assetInfo.name || '[name][extname]';
        },
      },
    },
    sourcemap: true,
  },
});
