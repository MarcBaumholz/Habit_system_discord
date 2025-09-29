# 🐳 Discord Habit System - Docker Guide

## 📋 **Docker Setup Complete!**

Your Discord Habit System is now fully containerized and ready to run in Docker.

---

## 🚀 **Quick Start**

### **Start the System:**
```bash
./docker-start.sh
```

### **Stop the System:**
```bash
./docker-stop.sh
```

### **View Logs:**
```bash
docker-compose logs -f
```

---

## 📦 **Docker Components Created:**

### **1. Dockerfile**
- Multi-stage build for optimized production image
- Node.js 18 Alpine base image
- Security-focused with non-root user
- Health checks included
- Resource optimized for Raspberry Pi

### **2. docker-compose.yml**
- Complete orchestration setup
- Volume mounts for persistence
- Network configuration
- Resource limits (512MB RAM, 0.5 CPU)
- Health monitoring
- Logging configuration

### **3. Docker Scripts**
- `docker-start.sh` - Automated startup with validation
- `docker-stop.sh` - Clean shutdown and cleanup
- Environment validation
- Container health monitoring

### **4. .dockerignore**
- Optimized build context
- Excludes unnecessary files
- Faster builds and smaller images

---

## 🔧 **Configuration Requirements**

Before starting, ensure your `.env` file has:

```bash
# Required tokens (replace placeholders)
DISCORD_BOT_TOKEN=your_actual_discord_bot_token
NOTION_TOKEN=your_actual_notion_integration_token
DISCORD_GUILD_ID=your_actual_discord_server_id

# Optional but recommended
DISCORD_TOOLS_CHANNEL=your_tools_channel_id
```

---

## 🎯 **Docker Commands**

### **Basic Operations:**
```bash
# Start the system
./docker-start.sh

# Stop the system
./docker-stop.sh

# View logs
docker-compose logs -f

# Restart container
docker-compose restart

# Check status
docker-compose ps
```

### **Advanced Operations:**
```bash
# Access container shell
docker-compose exec discord-habit-bot sh

# View container logs
docker-compose logs discord-habit-bot

# Rebuild container
docker-compose build --no-cache

# Clean up everything
docker-compose down --volumes --remove-orphans
```

---

## 📊 **System Monitoring**

### **Health Checks:**
- Container health monitoring every 30 seconds
- Automatic restart on failure
- Resource usage tracking

### **Logs:**
- Structured logging with rotation
- Maximum 10MB per log file
- 3 log files retained

### **Volumes:**
- `./logs` - Application logs
- `./data` - Persistent data storage

---

## 🚀 **Production Deployment**

### **Resource Requirements:**
- **Memory:** 256MB minimum, 512MB recommended
- **CPU:** 0.25 cores minimum, 0.5 cores recommended
- **Storage:** 1GB for application + logs

### **Security Features:**
- Non-root user execution
- Minimal Alpine Linux base
- No unnecessary packages
- Network isolation

---

## 🔧 **Troubleshooting**

### **Container Won't Start:**
```bash
# Check logs
docker-compose logs

# Check environment
docker-compose config

# Rebuild container
docker-compose build --no-cache
```

### **Environment Issues:**
```bash
# Verify .env file
cat .env

# Test environment loading
docker-compose exec discord-habit-bot env
```

### **Performance Issues:**
```bash
# Check resource usage
docker stats

# Monitor logs
docker-compose logs -f --tail=100
```

---

## 🎉 **Benefits of Docker Deployment**

✅ **Isolation** - Clean, isolated environment
✅ **Consistency** - Same environment everywhere
✅ **Scalability** - Easy to scale and deploy
✅ **Security** - Non-root execution, minimal attack surface
✅ **Monitoring** - Built-in health checks and logging
✅ **Portability** - Run anywhere Docker runs
✅ **Maintenance** - Easy updates and rollbacks

---

## 🚀 **Ready to Deploy!**

Your Discord Habit System is now fully containerized and production-ready!

**Next Steps:**
1. Update `.env` with real tokens
2. Run `./docker-start.sh`
3. Monitor logs with `docker-compose logs -f`
4. Enjoy your containerized Discord Habit System! 🎯
