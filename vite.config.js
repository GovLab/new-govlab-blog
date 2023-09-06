import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Pages from "vite-plugin-pages";
import { VitePluginRadar } from "vite-plugin-radar";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    VitePluginRadar({
      // Google Analytics tag inject
      enableDev: true,
      analytics: {
        id: 'G-Y32056PZ03',
      },
    }),
    vue(),
    Pages({
      dirs: 'src/pages',
      extensions: ['vue', 'ts'],
    }),
  ],
  server: {
    host: '0.0.0.0',
    hmr: {
      host: 'localhost', // you could make this an ENV var
      port: '3000',
      path: '/'
    }
  }
})



