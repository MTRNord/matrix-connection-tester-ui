/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
const ReactCompilerConfig = { /* ... */ };

const version = process.env.GITHUB_SHA || process.env.VITE_APP_VERSION || new Date(Date.now()).toLocaleDateString();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", ReactCompilerConfig],
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    rollupOptions: {
      // After build, write version.json
      plugins: [{
        name: 'write-version-json',
        closeBundle() {
          writeFileSync('dist/version.json', JSON.stringify({ version }), 'utf-8');
        }
      }]
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**', // Exclude E2E tests from Vitest
      '**/*.config.*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'e2e/',
      ],
    },
  },
})
