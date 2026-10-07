// Office-mode dev launcher (Windows/macOS/Linux compatible).
// Sets NUXT_OFFLINE=1 so nuxt.config.ts disables @nuxt/fonts and the
// remote Iconify API, then starts the normal Nuxt dev server.
// Usage: pnpm dev:office [--port 3000 --host ...] (extra args forwarded)
import { spawn } from 'node:child_process'

const extraArgs = process.argv.slice(2).join(' ')
// Single command string with shell:true (no args array) avoids DEP0190
// and works on PowerShell, cmd, and bash.
const command = `pnpm exec nuxt dev${extraArgs ? ` ${extraArgs}` : ''}`
const child = spawn(command,
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NUXT_OFFLINE: '1' }
  }
)

child.on('exit', code => process.exit(code ?? 0))
child.on('error', (err) => {
  console.error('[dev:office] failed to start:', err.message)
  process.exit(1)
})
