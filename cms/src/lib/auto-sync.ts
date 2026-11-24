/**
 * Debounced auto-sync: after any admin save, export the CMS content and
 * rebuild the static site, so there is no separate "sync" button or script.
 */

import { spawn } from 'node:child_process'
import path from 'node:path'

import type { Payload } from 'payload'

import { exportStatic } from './export-static'

let timer: ReturnType<typeof setTimeout> | null = null
let running = false
let queued = false

function runBuild(): Promise<void> {
  const siteDir = path.resolve(process.env.SITE_DIR || path.join(process.cwd(), '..', 'site'))
  const python = process.env.PYTHON || (process.platform === 'win32' ? 'python.exe' : 'python')

  return new Promise((resolve, reject) => {
    const child = spawn(python, ['build.py'], { cwd: siteDir, windowsHide: true })
    let stderr = ''
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`build.py exited with ${code}: ${stderr.slice(-400)}`))
    })
  })
}

async function sync(payload: Payload) {
  if (running) {
    queued = true
    return
  }
  running = true
  try {
    if (process.env.DEPLOY_HOOK_URL) {
      const response = await fetch(process.env.DEPLOY_HOOK_URL, { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Deploy hook returned ${response.status}`)
      }
      payload.logger.info('Auto-sync: triggered the Cloudflare Pages deploy hook')
      return
    }

    const result = await exportStatic(payload)
    await runBuild()
    payload.logger.info(
      `Auto-sync complete: ${result.vehicles} vehicles, ${result.brands} brands, ${result.photos} photos → site/dist rebuilt`,
    )
  } catch (error) {
    payload.logger.error({ msg: 'Auto-sync failed', err: error })
  } finally {
    running = false
    if (queued) {
      queued = false
      scheduleStaticSync(payload)
    }
  }
}

export function scheduleStaticSync(payload: Payload) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void sync(payload)
  }, 1200)
}
