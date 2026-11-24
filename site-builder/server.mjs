/**
 * Static site builder for the single-server Docker deployment.
 *
 * - listens on :8080
 * - POST /rebuild  → pull content from the CMS and rebuild /srv/site
 * - GET  /health   → liveness
 *
 * The CMS is configured with DEPLOY_HOOK_URL=http://site-builder:8080/rebuild,
 * so every admin save triggers a rebuild.
 */

import { spawn } from 'node:child_process'
import { createServer } from 'node:http'

const SITE_DIR = '/app/site'
const DIST_DIR = process.env.DIST_DIR || '/srv/site'
const CMS_URL = process.env.CMS_URL || 'http://cms:3000'
const PUBLIC_URL = process.env.PUBLIC_URL || CMS_URL
const PORT = Number(process.env.PORT || 8080)

let running = false
let queued = false

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: SITE_DIR,
      env: { ...process.env, CMS_URL, PUBLIC_URL, DIST_DIR },
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

async function build() {
  if (running) {
    queued = true
    return
  }
  running = true
  try {
    await run('node', ['tools/fetch-content.mjs'])
    await run('python3', ['build.py'])
    console.log(`[site-builder] rebuild complete → ${DIST_DIR}`)
  } finally {
    running = false
    if (queued) {
      queued = false
      void build().catch((error) => console.error('[site-builder] queued build failed:', error.message))
    }
  }
}

async function initialBuild() {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      await build()
      return
    } catch (error) {
      console.log(`[site-builder] CMS not ready (attempt ${attempt}): ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
  console.error('[site-builder] gave up waiting for the CMS')
}

const server = createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/rebuild') {
    response.writeHead(202, { 'Content-Type': 'text/plain' })
    response.end('rebuild scheduled')
    void build().catch((error) => console.error('[site-builder] rebuild failed:', error.message))
    return
  }

  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok' }))
    return
  }

  response.writeHead(404)
  response.end('not found')
})

server.listen(PORT, () => {
  console.log(`[site-builder] listening on ${PORT}, cms=${CMS_URL}, public=${PUBLIC_URL}`)
  void initialBuild()
})
