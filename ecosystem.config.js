module.exports = {
  apps: [{
    name: 'discord-habit-system',
    script: 'dist/index.js',
    cwd: '/home/pi/Documents/habit_System/Habit_system_discord',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true
  }]
};

