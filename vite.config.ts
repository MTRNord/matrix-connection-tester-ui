import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { writeFileSync } from 'fs'

const version = process.env.GITHUB_SHA || process.env.VITE_APP_VERSION || Date.now().toString();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
