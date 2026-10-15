import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Unit tests do not start the production TanStack/Nitro development servers.
export default defineConfig({
  resolve: { alias: { '#': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['test/**/*.test.{ts,tsx}'] },
})
