// PM2 production config for Frhm.
// Target box: 2 GB RAM VPS. Fork mode + 1 instance on purpose: each extra
// Next.js worker duplicates ~180 MB RSS, and cluster mode here caused the
// kernel OOM killer to reap the server during builds.
module.exports = {
  apps: [
    {
      name: 'frhm',
      cwd: '/home/ubuntu/frhm/app',
      // Call the Next binary directly: the `npm start` wrapper adds a second
      // node process (~70 MB) and hides the real PID from PM2.
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Hard ceiling so a runaway render fails fast instead of triggering
        // the kernel OOM killer, which also takes down other services.
        NODE_OPTIONS: '--max-old-space-size=768',
      },
      max_memory_restart: '800M',
      restart_delay: 4000,
      kill_timeout: 8000,
      max_restarts: 20,
      min_uptime: '20s',
      time: true,
      error_file: '/home/ubuntu/.pm2/logs/frhm-error.log',
      out_file: '/home/ubuntu/.pm2/logs/frhm-out.log',
    },
  ],
};
