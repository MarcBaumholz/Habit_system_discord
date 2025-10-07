module.exports = {
  apps: [{
    name: 'habit-tools-website',
    script: 'npm',
    args: 'start',
    cwd: '/home/pi/Documents/habit_System/Habit_system_discord/habit-tools-website',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
