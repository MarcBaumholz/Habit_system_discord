# Docker Container Rebuild Plan

**Date:** October 13, 2025  
**Task:** Rebuild Docker container with latest code changes

## 🎯 Goal
Rebuild the Discord Habit System Docker container to incorporate the latest code changes and ensure the system is running the most up-to-date version.

## 📋 Pre-Rebuild Checklist
- ✅ Dockerfile exists at project root
- ✅ docker-compose.yml configured properly
- ✅ .env file present with environment variables
- ✅ dist/ folder contains compiled JavaScript code

## 🔧 Docker Configuration Overview

### Dockerfile Details
- **Base Image:** node:18-alpine
- **Working Directory:** /app
- **Build Process:** 
  1. Install system dependencies (git)
  2. Copy package files
  3. Install npm dependencies with `npm ci`
  4. Copy source code
  5. Build application with `npm run build`
  6. Create non-root user (discord-bot) for security
  7. Expose port 3000
  8. Health check configured

### docker-compose.yml Details
- **Service Name:** discord-habit-bot
- **Container Name:** discord-habit-system
- **Restart Policy:** unless-stopped
- **Resource Limits:** 
  - Memory: 256M-512M
  - CPU: 0.25-0.5 cores
- **Volumes:** ./logs:/app/logs
- **Network:** discord-bot-network (bridge)
- **Health Check:** Every 30s with 3 retries

## 🚀 Rebuild Steps

### Step 1: Stop Current Container
```bash
docker-compose down
```
**Purpose:** Stop and remove the existing container gracefully

### Step 2: Remove Old Images (Optional but recommended)
```bash
docker-compose down --rmi all
```
**Purpose:** Clean up old images to ensure fresh build

### Step 3: Rebuild Container
```bash
docker-compose build --no-cache
```
**Purpose:** Build new image from scratch without cache to ensure all changes are included

### Step 4: Start New Container
```bash
docker-compose up -d
```
**Purpose:** Start container in detached mode

### Step 5: Verify Container Status
```bash
docker-compose ps
docker-compose logs --tail=50
```
**Purpose:** Confirm container is running and check for any startup errors

## 🧪 Post-Rebuild Verification

1. **Container Status:** Check if container is running
2. **Health Check:** Verify health check passes
3. **Log Review:** Check logs for errors or warnings
4. **Bot Connection:** Verify Discord bot connects successfully

## ⚠️ Important Notes

- The rebuild will use the latest code in the `dist/` folder
- Environment variables from `.env` will be preserved
- Logs will be maintained in the `./logs` directory
- The container runs as non-root user `discord-bot` for security
- Health checks occur every 30 seconds

## 🔄 Rollback Plan

If issues occur after rebuild:
1. Check logs: `docker-compose logs`
2. Stop container: `docker-compose down`
3. Review changes in dist/ folder
4. Rebuild with verbose output: `docker-compose up --build`

## 📊 Expected Outcome

- Docker container rebuilt with latest changes
- Bot running in detached mode
- Health checks passing
- Logs available in ./logs directory
- System ready for production use


