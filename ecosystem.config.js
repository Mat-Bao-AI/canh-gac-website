// ecosystem.config.js - Cấu hình PM2 cho Vibe Host / Linux VPS
module.exports = {
  apps: [
    {
      name: 'canhgac-website',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000
      }
    }
  ]
};
