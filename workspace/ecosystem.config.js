module.exports = {
  apps: [
    {
      name: 'frhm-app',
      script: 'npm',
      args: 'start',
      cwd: '/home/ubuntu/frhm/app',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      restart_delay: 5000,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/frhm-error.log',
      out_file: '/var/log/pm2/frhm-out.log',
      log_file: '/var/log/pm2/frhm-combined.log',
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
