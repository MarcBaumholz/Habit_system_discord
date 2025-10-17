# Duplicate Instance Prevention Plan

## Problem Analysis
The system experienced duplicate bot instances running in parallel, causing:
- Duplicate message processing
- Duplicate proof creation
- Resource conflicts

## Current Status: ✅ RESOLVED
- Only 1 Docker container running
- Only 1 Node.js process active
- No duplicate message processing detected

## Prevention Measures

### 1. Docker Health Checks
```bash
# Check for existing containers before starting
docker ps -a | grep habit-discord-bot
```

### 2. Process Monitoring
```bash
# Monitor for duplicate processes
ps aux | grep "node dist/index.js" | wc -l
```

### 3. Startup Script Enhancement
Add to startup script:
```bash
#!/bin/bash
# Kill any existing instances
docker stop habit-discord-bot 2>/dev/null
docker rm habit-discord-bot 2>/dev/null
pkill -f "node dist/index.js" 2>/dev/null

# Start fresh instance
docker-compose up -d
```

### 4. Log Monitoring
Monitor logs for duplicate patterns:
```bash
docker logs habit-discord-bot 2>&1 | grep -E "(DOPPELT|duplicate|Message Created.*DOPPELT)"
```

### 5. Health Check Endpoint
Implement health check to detect duplicate instances:
```javascript
// Add to bot code
setInterval(() => {
  const processes = execSync('ps aux | grep "node dist/index.js" | grep -v grep').toString();
  if (processes.split('\n').filter(line => line.trim()).length > 1) {
    console.error('🚨 DUPLICATE INSTANCE DETECTED!');
    process.exit(1);
  }
}, 30000);
```

## Monitoring Commands
```bash
# Check for duplicates
docker ps | grep habit
ps aux | grep "node dist/index.js" | grep -v grep | wc -l

# Monitor logs
docker logs -f habit-discord-bot | grep -E "(DOPPELT|duplicate)"
```

## Status: ✅ RESOLVED
The duplicate instance issue has been resolved. The system is now running with a single instance.
