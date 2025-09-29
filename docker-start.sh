#!/bin/bash

# Discord Habit System - Docker Startup Script
# This script handles Docker container startup and configuration

echo "🐳 Starting Discord Habit System in Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "📖 Installation guide: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "📖 Installation guide: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your actual tokens before starting the container."
    echo "🔧 Required tokens:"
    echo "   - DISCORD_BOT_TOKEN"
    echo "   - NOTION_TOKEN"
    echo "   - DISCORD_GUILD_ID"
    exit 1
fi

# Check if required environment variables are set
if grep -q "your_discord_bot_token_here" .env || grep -q "your_notion_integration_token_here" .env; then
    echo "⚠️  Please update .env file with your actual tokens:"
    echo "   - DISCORD_BOT_TOKEN"
    echo "   - NOTION_TOKEN"
    echo "   - DISCORD_GUILD_ID"
    exit 1
fi

# Create necessary directories
mkdir -p logs data

# Build and start the container
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting Discord Habit System container..."
docker-compose up -d

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Check container status
if docker-compose ps | grep -q "Up"; then
    echo "✅ Discord Habit System is running!"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop system: docker-compose down"
    echo "   Restart system: docker-compose restart"
    echo "   View container: docker-compose exec discord-habit-bot sh"
    echo ""
    echo "🎉 Your Discord Habit System is now running in Docker!"
else
    echo "❌ Failed to start container. Check logs:"
    docker-compose logs
    exit 1
fi
