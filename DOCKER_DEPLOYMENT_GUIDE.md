# 🐳 Discord Habit System - Docker Deployment Guide

## 📋 **Overview**

This guide shows you how to deploy your Discord Habit System using Docker, with automatic updates and easy management.

---

## 🚀 **Quick Start**

### **1. Deploy with Latest Changes**
```bash
# Simple deployment (builds and starts container)
./deploy.sh
```

### **2. Update from Git and Deploy**
```bash
# Pull latest changes and deploy
./update-and-deploy.sh
```

### **3. Manage Container**
```bash
# View all available commands
./docker-commands.sh help

# Start container
./docker-commands.sh start

# View logs
./docker-commands.sh logs

# Follow live logs
./docker-commands.sh logs-f

# Stop container
./docker-commands.sh stop
```

---

## 📁 **Docker Files Created**

### **Core Docker Files**
- ✅ `Dockerfile` - Main container configuration
- ✅ `docker-compose.yml` - Container orchestration
- ✅ `.dockerignore` - Files to exclude from build

### **Deployment Scripts**
- ✅ `deploy.sh` - Simple deployment script
- ✅ `update-and-deploy.sh` - Git update + deployment
- ✅ `docker-commands.sh` - Container management commands

---

## 🛠️ **Deployment Process**

### **What Happens When You Deploy:**

1. **🔍 Environment Check**
   - Verifies `.env` file exists
   - Checks Docker is running
   - Validates configuration

2. **🛑 Container Management**
   - Stops existing container
   - Removes old container
   - Cleans up resources

3. **🏗️ Build Process**
   - Builds new Docker image
   - Installs dependencies
   - Compiles TypeScript
   - Creates optimized container

4. **🚀 Deployment**
   - Starts new container
   - Verifies health
   - Shows status and logs

---

## 📊 **Container Features**

### **Security**
- ✅ **Non-root user** - Runs as `discord-bot` user
- ✅ **Resource limits** - Memory and CPU constraints
- ✅ **Health checks** - Automatic monitoring
- ✅ **Log rotation** - Prevents disk space issues

### **Performance**
- ✅ **Alpine Linux** - Minimal base image
- ✅ **Production build** - Optimized for performance
- ✅ **Cached layers** - Faster subsequent builds
- ✅ **Resource monitoring** - Built-in health checks

### **Reliability**
- ✅ **Auto-restart** - Container restarts on failure
- ✅ **Log management** - Structured logging
- ✅ **Error handling** - Graceful failure recovery
- ✅ **Backup ready** - Volume mounts for persistence

---

## 🎯 **Usage Examples**

### **Daily Development Workflow**
```bash
# 1. Make your changes in code
# 2. Commit and push to git
git add .
git commit -m "Add new feature"
git push

# 3. Deploy with latest changes
./update-and-deploy.sh
```

### **Quick Testing**
```bash
# Start container
./docker-commands.sh start

# View logs
./docker-commands.sh logs

# Stop when done
./docker-commands.sh stop
```

### **Production Deployment**
```bash
# Build and deploy
./deploy.sh

# Monitor status
./docker-commands.sh status

# Follow logs
./docker-commands.sh logs-f
```

---

## 📋 **Available Commands**

### **Docker Commands**
```bash
./docker-commands.sh start      # Start container
./docker-commands.sh stop       # Stop container
./docker-commands.sh restart    # Restart container
./docker-commands.sh logs       # Show logs
./docker-commands.sh logs-f     # Follow logs (live)
./docker-commands.sh status     # Show status
./docker-commands.sh build      # Build image
./docker-commands.sh shell      # Open shell in container
./docker-commands.sh clean      # Clean up everything
```

### **NPM Scripts**
```bash
npm run docker:build    # Build Docker image
npm run docker:start    # Start container
npm run docker:stop     # Stop container
npm run docker:restart  # Restart container
npm run docker:logs     # Show logs
npm run docker:deploy   # Deploy with latest changes
npm run docker:update   # Update from git and deploy
```

---

## 🔧 **Configuration**

### **Environment Variables**
Your `.env` file is automatically loaded:
```bash
# All your existing variables work in Docker
DISCORD_BOT_TOKEN=your_token
DISCORD_LOG_CHANNEL=1422469416746094693
# ... etc
```

### **Resource Limits**
Container is configured with:
- **Memory**: 512MB limit, 256MB reserved
- **CPU**: 0.5 cores limit, 0.25 cores reserved
- **Restart**: Automatically restarts on failure

### **Logging**
- **Container logs**: Available via `docker logs`
- **Application logs**: Sent to your Discord log channel
- **Health checks**: Every 30 seconds

---

## 🚨 **Troubleshooting**

### **Container Won't Start**
```bash
# Check Docker is running
docker info

# Check logs for errors
./docker-commands.sh logs

# Check environment variables
cat .env
```

### **Bot Not Responding**
```bash
# Check container status
./docker-commands.sh status

# Follow live logs
./docker-commands.sh logs-f

# Restart container
./docker-commands.sh restart
```

### **Update Issues**
```bash
# Manual update process
git pull
npm install
npm run build
./deploy.sh
```

### **Clean Start**
```bash
# Stop everything and clean up
./docker-commands.sh clean

# Rebuild and deploy
./deploy.sh
```

---

## 📈 **Monitoring**

### **Health Checks**
```bash
# Check container health
docker ps

# View health check logs
docker inspect discord-habit-system | grep -A 10 Health
```

### **Resource Usage**
```bash
# Monitor resource usage
docker stats discord-habit-system

# View container details
docker inspect discord-habit-system
```

### **Logs**
```bash
# Application logs (Discord channel)
# Check your #logs channel in Discord

# Container logs (terminal)
./docker-commands.sh logs-f
```

---

## 🔄 **Update Workflow**

### **Automatic Updates**
```bash
# This will:
# 1. Pull latest changes from git
# 2. Install/update dependencies
# 3. Build the application
# 4. Deploy new container
./update-and-deploy.sh
```

### **Manual Updates**
```bash
# 1. Pull changes
git pull origin main

# 2. Deploy
./deploy.sh
```

### **Development Updates**
```bash
# For local development changes
npm run build
./deploy.sh
```

---

## 🎉 **Benefits**

### **✅ Easy Deployment**
- One command deploys everything
- Automatic dependency management
- Consistent environment

### **✅ Easy Updates**
- Pull latest changes and deploy
- No manual configuration needed
- Rollback capability

### **✅ Easy Management**
- Simple commands for everything
- Built-in health monitoring
- Comprehensive logging

### **✅ Production Ready**
- Security best practices
- Resource limits
- Auto-restart on failure
- Health checks

---

## 🚀 **Ready to Deploy!**

Your Docker setup is complete and ready to use:

1. **Deploy now**: `./deploy.sh`
2. **Update later**: `./update-and-deploy.sh`
3. **Manage container**: `./docker-commands.sh help`

Your Discord Habit System will now run in a container with automatic updates and easy management! 🎯

---

*The Docker setup provides a production-ready environment with automatic updates, health monitoring, and easy management - perfect for keeping your Discord bot running reliably!*
