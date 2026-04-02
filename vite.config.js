import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    svelte({
      onwarn(warning, handler) {
        if (warning.code === 'state_referenced_locally') return
        handler(warning)
      },
    }),
    tailwindcss(),
  ],
})
