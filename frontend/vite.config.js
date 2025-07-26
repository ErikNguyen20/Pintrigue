import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths"


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: '0.0.0.0',  // ensures it's accessible in Docker
    watch: {
      usePolling: true,         // needed for Docker
      interval: 500             // adjust if CPU is spiking (optional)
    }
  }

})
