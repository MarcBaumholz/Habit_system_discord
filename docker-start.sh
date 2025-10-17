#!/bin/bash

# Multi-Agent Discord Bot Docker Startup Script

echo "🚀 Starting Multi-Agent Discord Bot with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data

# Stop existing PM2 process if running
echo "🛑 Stopping existing PM2 processes..."
pm2 stop habit-discord-bot 2>/dev/null || echo "No PM2 process to stop"

# Build and start the Docker container
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting Multi-Agent Discord Bot..."
docker-compose up -d

# Wait for container to start
echo "⏳ Waiting for bot to initialize..."
sleep 10

# Check container status
echo "📊 Checking container status..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Multi-Agent Discord Bot is now running in Docker!"
echo ""
echo "🤖 Available Agents:"
echo "   • Identity Agent: /identity"
echo "   • Accountability Agent: /accountability" 
echo "   • Group Agent: /group"
echo "   • Learning Agent: /learning-agent"
echo ""
echo "📋 Useful Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop bot: docker-compose down"
echo "   • Restart bot: docker-compose restart"
echo "   • Check status: docker-compose ps"
echo ""
echo "🎯 Test the agents in your Discord channel!"