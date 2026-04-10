async function setup() {
  if (process.env.ONE_RENDER_MODE === 'ssg') {
    return
  } else {
    console.info(`[server] start (SHA: ${process.env.GIT_SHA})`)
    try {
      const { initBreezeSync } = await import('~/server/breezeSyncWorker')
      void initBreezeSync()
    } catch (err) {
      console.error('[server] failed to start breeze sync:', err)
    }
  }
}

await setup()

export {}
