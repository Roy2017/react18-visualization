import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import commonjs from 'vite-plugin-commonjs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRefresh(),
    commonjs(/* options */),
  ],
  resolve: {
    alias: [
      {find: 'react', replacement: path.resolve(__dirname, './src/packages/react/cjs/react.development.js')},
      {find: 'react-dom', replacement: path.resolve(__dirname, './src/packages/react-dom/cjs/react-dom.development.js')},
      {find: 'scheduler', replacement: path.resolve(__dirname, './src/packages/scheduler/cjs/scheduler.development.js')},
      {find: 'react-cache', replacement: path.resolve(__dirname, './src/packages/react-cache')},
      {find: 'log', replacement: path.resolve(__dirname, './src/packages/log')}
    ]
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'scheduler', 'react-cache', 'log'
    ]
  }
})
